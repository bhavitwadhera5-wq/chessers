import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Chess, type Move, type Square } from "chess.js";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  agreeDraw,
  botPlayMove,
  claimTimeout,
  fillWithBot,
  makeMove,
  resignGame,
} from "@/lib/games.functions";
import { humanBotByName, humanBotMove, humanThinkDelay } from "@/lib/humanBots";
import { BoardView } from "@/components/BoardView";
import { GameOverDialog } from "@/components/GameOverDialog";
import { MoveList } from "@/components/MoveList";
import { ReportPanel } from "@/components/ReportPanel";
import { submitFairPlay } from "@/lib/moderation.functions";
import { playMoveSound } from "@/lib/sounds";
import { BOARD_THEMES, THEME_KEY, type BoardTheme } from "@/lib/boardThemes";

export const Route = createFileRoute("/play/$gameId")({
  head: () => ({
    meta: [
      { title: "Online Chess Match — Chessers" },
      {
        name: "description",
        content:
          "A live chess match against another player. Moves sync across devices and you can only move on your turn.",
      },
      { property: "og:title", content: "Online Chess Match — Chessers" },
      {
        property: "og:description",
        content: "Live multiplayer chess with draw offers, a scorecard and a full game review.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlayOnline,
});

type GameRow = {
  id: string;
  white_id: string | null;
  black_id: string | null;
  invited_username: string | null;
  fen: string;
  status: string;
  result: string | null;
  last_move: string | null;
  time_control: number;
  white_ms: number | null;
  black_ms: number | null;
  turn_started_at: string | null;
  bot_name: string | null;
  bot_elo: number | null;
};

function fmtClock(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}


function PlayOnline() {
  const { gameId } = Route.useParams();
  const { user, username, loading } = useAuth();
  const navigate = useNavigate();
  const move = useServerFn(makeMove);
  const resign = useServerFn(resignGame);
  const draw = useServerFn(agreeDraw);
  const timeout = useServerFn(claimTimeout);
  const seatBot = useServerFn(fillWithBot);
  const sendBotMove = useServerFn(botPlayMove);

  const [game, setGame] = useState<GameRow | null>(null);
  const [opponentName, setOpponentName] = useState<string | null>(null);
  const [selected, setSelected] = useState<Square | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<BoardTheme>("green");
  const [drawOffered, setDrawOffered] = useState(false);
  const [incomingDraw, setIncomingDraw] = useState(false);
  const [showResult, setShowResult] = useState(true);
  const sendFairPlay = useServerFn(submitFairPlay);
  const [now, setNow] = useState(() => Date.now());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const claimedRef = useRef(false);
  const pieceCountRef = useRef(0);
  const fillingRef = useRef(false);
  const botThinkingRef = useRef<string | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(THEME_KEY) as BoardTheme | null;
    if (saved && BOARD_THEMES.some((t) => t.id === saved)) setTheme(saved);
  }, []);


  useEffect(() => {
    if (!loading && !user) navigate({ to: "/" });
  }, [loading, user, navigate]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await supabase.from("games").select("*").eq("id", gameId).maybeSingle();
      if (active && data) setGame(data as GameRow);
    };
    load();

    const channel = supabase
      .channel(`game-${gameId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${gameId}` },
        (payload) => setGame(payload.new as GameRow),
      )
      .on("broadcast", { event: "draw-offer" }, ({ payload }) => {
        if (payload?.from !== user?.id) setIncomingDraw(true);
      })
      .on("broadcast", { event: "draw-decline" }, ({ payload }) => {
        if (payload?.from !== user?.id) setDrawOffered(false);
      })
      .subscribe();
    channelRef.current = channel;

    const poll = setInterval(load, 4000);
    return () => {
      active = false;
      clearInterval(poll);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [gameId, user?.id]);

  const myColor = !game || !user ? null : game.white_id === user.id ? "w" : game.black_id === user.id ? "b" : null;

  useEffect(() => {
    const otherId = myColor === "w" ? game?.black_id : game?.white_id;
    if (!otherId) {
      setOpponentName(game?.bot_name ?? null);
      return;
    }
    supabase
      .from("profiles")
      .select("username")
      .eq("id", otherId)
      .maybeSingle()
      .then(({ data }) => setOpponentName(data?.username ?? null));
  }, [game?.black_id, game?.white_id, game?.bot_name, myColor]);


  const chess = useMemo(() => (game ? new Chess(game.fen) : null), [game?.fen]);
  const board = useMemo(() => chess?.board() ?? [], [chess]);
  const myTurn = !!chess && !!myColor && chess.turn() === myColor && game?.status === "active";

  // Nobody in the lobby? After a short wait a rated human-like opponent sits down.
  const waitingAlone =
    game?.status === "waiting" &&
    !!myColor &&
    !game.invited_username &&
    (myColor === "w" ? !game.black_id : !game.white_id);
  useEffect(() => {
    if (!waitingAlone || fillingRef.current) return;
    const id = setTimeout(() => {
      fillingRef.current = true;
      seatBot({ data: { gameId } })
        .catch(() => undefined)
        .finally(() => {
          fillingRef.current = false;
        });
    }, 12000);
    return () => clearTimeout(id);
  }, [waitingAlone, seatBot, gameId]);

  // The computer opponent answers from this client, with a human-like pause.
  const botSeatEmpty =
    !!game?.bot_name && !!myColor && (myColor === "w" ? !game.black_id : !game.white_id);
  useEffect(() => {
    if (!botSeatEmpty || !chess || !game || game.status !== "active" || myTurn) return;
    const bot = humanBotByName(game.bot_name!);
    if (!bot) return;
    const fen = game.fen;
    if (botThinkingRef.current === fen) return;
    botThinkingRef.current = fen;
    const id = setTimeout(() => {
      const choice = humanBotMove(fen, bot);
      if (!choice) return;
      sendBotMove({ data: { gameId, from: choice.from, to: choice.to } })
        .then((res) =>
          setGame((g) =>
            g
              ? {
                  ...g,
                  fen: res.fen,
                  status: res.status,
                  result: res.result,
                  last_move: `${choice.from}${choice.to}`,
                }
              : g,
          ),
        )
        .catch(() => {
          botThinkingRef.current = null;
        });
    }, humanThinkDelay(bot));
    return () => clearTimeout(id);
  }, [botSeatEmpty, game?.fen, game?.status, myTurn, gameId, sendBotMove]);



  // Live clocks: the server stores remaining time per side plus when the
  // current turn began, so both players see the same countdown.
  const clockOn = !!game?.time_control && game.status === "active";
  useEffect(() => {
    if (!clockOn) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [clockOn]);

  const remaining = (side: "w" | "b") => {
    if (!game?.time_control) return null;
    const base = (side === "w" ? game.white_ms : game.black_ms) ?? game.time_control * 60000;
    if (game.status !== "active" || !chess || chess.turn() !== side || !game.turn_started_at) {
      return Math.max(0, base);
    }
    return Math.max(0, base - (now - new Date(game.turn_started_at).getTime()));
  };

  const turnClock = chess ? remaining(chess.turn() as "w" | "b") : null;
  useEffect(() => {
    if (!clockOn || turnClock === null || turnClock > 0 || claimedRef.current) return;
    claimedRef.current = true;
    timeout({ data: { gameId } }).catch(() => {
      claimedRef.current = false;
    });
  }, [clockOn, turnClock, timeout, gameId]);


  // The server only stores the current FEN, so build the move list locally as
  // moves arrive, then replay it for the end-of-game review.
  const [moveLog, setMoveLog] = useState<string[]>([]);
  useEffect(() => {
    const lm = game?.last_move;
    if (!lm) return;
    setMoveLog((log) => {
      if (log[log.length - 1] === lm) return log;
      const pieces = (game?.fen ?? "").split(" ")[0].replace(/[^a-zA-Z]/g, "").length;
      const captured = pieceCountRef.current > 0 && pieces < pieceCountRef.current;
      pieceCountRef.current = pieces;
      playMoveSound({
        captured,
        check: !!chess?.inCheck(),
        over: game?.status === "finished",
      });
      return [...log, lm];
    });
  }, [game?.last_move]);

  const history = useMemo(() => {
    const replay = new Chess();
    for (const m of moveLog) {
      try {
        replay.move({ from: m.slice(0, 2), to: m.slice(2, 4), promotion: "q" });
      } catch {
        return [] as Move[];
      }
    }
    return replay.history({ verbose: true }) as Move[];
  }, [moveLog]);


  useEffect(() => {
    if (myTurn) setError(null);
  }, [myTurn]);

  const destinations = useMemo(() => {
    if (!chess || !selected) return new Set<string>();
    return new Set(chess.moves({ square: selected, verbose: true }).map((m) => m.to));
  }, [chess, selected]);

  const checkSquare = useMemo(() => {
    if (!chess?.inCheck()) return null;
    const turn = chess.turn();
    for (const row of chess.board())
      for (const cell of row)
        if (cell && cell.type === "k" && cell.color === turn) return cell.square;
    return null;
  }, [chess]);

  const lastMove = game?.last_move
    ? { from: game.last_move.slice(0, 2), to: game.last_move.slice(2, 4) }
    : null;

  const onSquareClick = async (square: Square) => {
    if (!chess || !myTurn) {
      if (game?.status === "active" && !myTurn) setError("It's not your turn yet.");
      return;
    }
    setError(null);
    const piece = chess.get(square);
    if (piece && piece.color === myColor) {
      setSelected(square === selected ? null : square);
      return;
    }
    if (!selected) return;

    const from = selected;
    setSelected(null);
    try {
      const res = await move({ data: { gameId, from, to: square } });
      setGame((g) =>
        g ? { ...g, fen: res.fen, status: res.status, result: res.result, last_move: `${from}${square}` } : g,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message.replace(/^Error:\s*/, "") : "Move failed.");
    }
  };

  if (!game) {
    return (
      <Shell>
        <p className="text-center text-sm text-muted-foreground">Loading match…</p>
      </Shell>
    );
  }

  if (!myColor) {
    return (
      <Shell>
        <p className="text-center text-sm text-muted-foreground">You're not a player in this match.</p>
      </Shell>
    );
  }

  const iWon = game.result === (myColor === "w" ? "white" : "black");
  let status: string;
  if (game.status === "waiting") {
    status = game.invited_username
      ? `Waiting for ${game.invited_username} to join…`
      : "Finding you an opponent…";
  } else if (game.status === "finished") {
    status = game.result === "draw" ? "Draw" : iWon ? "You won!" : "You lost.";
  } else if (myTurn) {
    status = chess?.inCheck() ? "Your move — you're in check" : "Your move";
  } else {
    status = `Waiting for ${opponentName ?? "your opponent"}…`;
  }

  const sendDrawOffer = () => {
    setDrawOffered(true);
    channelRef.current?.send({
      type: "broadcast",
      event: "draw-offer",
      payload: { from: user?.id },
    });
  };

  return (
    <Shell>
      <div className="flex flex-col items-center gap-5">
        <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-3 shadow-[var(--shadow-panel)]">
          <div>
            <p className="font-medium text-card-foreground">{status}</p>
            <p className="text-xs text-muted-foreground">
              You play {myColor === "w" ? "White" : "Black"}
              {opponentName ? ` · vs ${opponentName}` : ""}
              {game.bot_name && game.bot_elo ? ` (${game.bot_elo})` : ""}
            </p>
          </div>
          {!!game.time_control && (
            <div className="flex gap-2 font-mono text-sm">
              <span
                className={`rounded-md px-2.5 py-1 ${
                  chess?.turn() === (myColor === "w" ? "b" : "w")
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {opponentName ?? "Opponent"} {fmtClock(remaining(myColor === "w" ? "b" : "w") ?? 0)}
              </span>
              <span
                className={`rounded-md px-2.5 py-1 ${
                  myTurn ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                You {fmtClock(remaining(myColor) ?? 0)}
              </span>
            </div>
          )}
        </div>


        {game.status === "waiting" && (
          <p className="rounded-lg border border-border bg-card px-4 py-2 text-xs text-muted-foreground">
            Share your username — your friend can enter it from their home screen to join you. If
            nobody turns up in a few seconds, a rated opponent at your level will start the game.
          </p>
        )}

        <div className="flex w-full flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-center">
          <BoardView
            board={board}
            selected={selected}
            destinations={destinations}
            lastMove={lastMove}
            flipped={myColor === "b"}
            theme={theme}
            checkSquare={checkSquare}
            onSquareClick={onSquareClick}
            onDropMove={(from, to) => {
              setSelected(from);
              void onSquareClick(to);
            }}
          />

          <aside className="flex w-full flex-col gap-3 sm:w-52">
            <MoveList
              history={history}
              whiteLabel={myColor === "w" ? username ?? "You" : opponentName ?? "White"}
              blackLabel={myColor === "b" ? username ?? "You" : opponentName ?? "Black"}
            />
            {game.status !== "finished" && (
              <>
                <button
                  onClick={() => resign({ data: { gameId } })}
                  className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
                >
                  Resign
                </button>
                <button
                  onClick={sendDrawOffer}
                  disabled={drawOffered}
                  className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-50"
                >
                  {drawOffered ? "Draw offered…" : "Offer draw"}
                </button>
              </>
            )}

            {incomingDraw && game.status === "active" && (
              <div className="space-y-2 rounded-xl border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">
                  {opponentName ?? "Your opponent"} offers a draw.
                </p>
                <button
                  onClick={async () => {
                    setIncomingDraw(false);
                    await draw({ data: { gameId } });
                  }}
                  className="w-full rounded-md bg-primary px-2 py-1.5 text-xs font-semibold text-primary-foreground"
                >
                  Accept
                </button>
                <button
                  onClick={() => {
                    setIncomingDraw(false);
                    channelRef.current?.send({
                      type: "broadcast",
                      event: "draw-decline",
                      payload: { from: user?.id },
                    });
                  }}
                  className="w-full rounded-md border border-border px-2 py-1.5 text-xs text-muted-foreground"
                >
                  Decline
                </button>
              </div>
            )}

            <div className="rounded-xl border border-border bg-card p-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Board
              </p>
              <div className="flex flex-wrap gap-1.5">
                {BOARD_THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      theme === t.id
                        ? "bg-primary text-primary-foreground"
                        : "border border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {game.status === "finished" && (
              <button
                onClick={() => setShowResult(true)}
                className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Scorecard & review
              </button>
            )}
          </aside>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <GameOverDialog
        open={game.status === "finished" && showResult}
        headline={game.result === "draw" ? "Draw" : iWon ? "You won!" : "You lost"}
        detail={
          game.result === "draw"
            ? "The game ended in a draw."
            : chess?.isCheckmate()
              ? "Checkmate ended the game."
              : "The game is over."
        }
        history={history}
        whiteLabel={myColor === "w" ? username ?? "You" : opponentName ?? "White"}
        blackLabel={myColor === "b" ? username ?? "You" : opponentName ?? "Black"}
        reportSlot={<ReportPanel gameId={gameId} />}
        onReview={(review) => {
          void sendFairPlay({
            data: {
              gameId,
              stats: (["w", "b"] as const).map((c) => ({
                color: c,
                engineMatch: review.fairPlay[c].engineMatch,
                accuracy: review.fairPlay[c].accuracy,
                moves: review.fairPlay[c].moves,
                suspicion: review.fairPlay[c].suspicion,
              })),
            },
          }).catch(() => undefined);
        }}
        onRematch={() => navigate({ to: "/" })}
        onClose={() => setShowResult(false)}
      />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center bg-background px-4 py-8">
      <div className="w-full max-w-3xl">
        <header className="mb-6 text-center">
          <Link
            to="/"
            className="text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground"
          >
            ← Home
          </Link>
          <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-foreground">
            Online Match
          </h1>
        </header>
        {children}
      </div>
    </main>
  );
}

