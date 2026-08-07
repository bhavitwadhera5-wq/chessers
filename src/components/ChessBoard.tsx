import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Move, type Square } from "chess.js";
import { BoardView } from "./BoardView";
import { GameOverDialog } from "./GameOverDialog";
import { MoveList } from "./MoveList";
import { playMoveSound, setSoundEnabled, soundEnabled } from "@/lib/sounds";
import { BOARD_THEMES, type BoardTheme } from "@/lib/boardThemes";
import {
  BOTS,
  BOT_TIERS,
  getBot,
  botMove,
  evaluate,
  nextElo,
  readElo,
  writeElo,
  readAllElo,
  startElo,
  type BotLevel,
} from "@/lib/engine";

const TIMERS = [
  { id: 0, label: "No clock" },
  { id: 5, label: "5 min" },
  { id: 10, label: "10 min" },
];

type SideChoice = "w" | "b" | "random";

const SIDES: { id: SideChoice; label: string }[] = [
  { id: "w", label: "White" },
  { id: "b", label: "Black" },
  { id: "random", label: "Random" },
];

function fmt(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function ChessBoard() {
  const [game] = useState(() => new Chess());
  const [started, setStarted] = useState(false);
  const [fen, setFen] = useState(game.fen());
  const [selected, setSelected] = useState<Square | null>(null);
  const [thinking, setThinking] = useState(false);
  const [level, setLevel] = useState<BotLevel>("medium");
  const [theme, setTheme] = useState<BoardTheme>("green");
  const [sideChoice, setSideChoice] = useState<SideChoice>("w");
  const [mySide, setMySide] = useState<"w" | "b">("w");
  const [minutes, setMinutes] = useState(0);
  const [clock, setClock] = useState({ w: 0, b: 0 });
  const [over, setOver] = useState<{ headline: string; detail: string } | null>(null);
  const [elo, setElo] = useState(() => startElo("medium"));
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [eloDelta, setEloDelta] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [confirmNew, setConfirmNew] = useState(false);
  const scored = useRef(false);
  const tickRef = useRef(Date.now());

  const [sound, setSound] = useState(true);
  useEffect(() => setSound(soundEnabled()), []);
  useEffect(() => setRatings(readAllElo()), []);
  useEffect(() => setElo(readElo(level)), [level]);


  const botSide = mySide === "w" ? "b" : "w";
  const board = useMemo(() => game.board(), [fen, game]);
  const history = useMemo(() => game.history({ verbose: true }) as Move[], [fen, game]);

  const destinations = useMemo(() => {
    if (!selected) return new Set<string>();
    return new Set(game.moves({ square: selected, verbose: true }).map((m) => m.to));
  }, [selected, fen, game]);

  const lastMove = history[history.length - 1] ?? null;
  const checkSquare = useMemo(() => {
    if (!game.inCheck()) return null;
    const turn = game.turn();
    for (const row of game.board())
      for (const cell of row) if (cell && cell.type === "k" && cell.color === turn) return cell.square;
    return null;
  }, [fen, game]);
  const finished = !!over;

  const finish = useCallback(
    (headline: string, detail: string, result: number) => {
      if (scored.current) return;
      scored.current = true;
      const botElo = getBot(level).elo;
      const current = readElo(level);
      const updated = nextElo(current, botElo, result);
      writeElo(level, updated);
      setElo(updated);
      setRatings(readAllElo());
      setEloDelta(updated - current);
      setOver({ headline, detail });
    },
    [level],
  );


  const checkEnd = useCallback(() => {
    if (!game.isGameOver()) return false;
    if (game.isCheckmate()) {
      const iWon = game.turn() === botSide;
      finish(
        iWon ? "Checkmate — you win!" : "Checkmate — the bot wins",
        iWon ? "You delivered mate." : "Your king has no escape.",
        iWon ? 1 : 0,
      );
    } else {
      finish("Draw", game.isStalemate() ? "Stalemate." : "Drawn position.", 0.5);
    }
    return true;
  }, [game, finish, botSide]);

  const aiMove = useCallback(() => {
    const move = botMove(game.fen(), level);
    if (!move) return;
    const played = game.move({ from: move.from, to: move.to, promotion: move.promotion });
    setFen(game.fen());
    playMoveSound({
      captured: !!played?.captured,
      check: game.inCheck(),
      over: game.isGameOver(),
    });
  }, [game, level]);

  useEffect(() => {
    if (!started) return;
    if (finished || game.turn() !== botSide || game.isGameOver()) {
      checkEnd();
      return;
    }
    setThinking(true);
    const t = setTimeout(() => {
      aiMove();
      setThinking(false);
      checkEnd();
    }, 250);
    return () => clearTimeout(t);
  }, [fen, game, aiMove, checkEnd, finished, started, botSide]);

  // Clock — driven by real elapsed time so both sides tick, including the bot.
  useEffect(() => {
    if (!started || !minutes || finished || game.isGameOver()) return;
    tickRef.current = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      const elapsed = now - tickRef.current;
      tickRef.current = now;
      setClock((c) => {
        const side = game.turn() as "w" | "b";
        const next = { ...c, [side]: c[side] - elapsed };
        if (next[side] <= 0) {
          next[side] = 0;
          const iLost = side === mySide;
          finish(
            iLost ? "Time out — the bot wins" : "Time out — you win!",
            "The clock ran out.",
            iLost ? 0 : 1,
          );
        }
        return next;
      });
    }, 200);
    return () => clearInterval(id);
  }, [minutes, finished, game, finish, started, mySide]);


  const handleClick = (square: Square) => {
    if (!started || finished || game.isGameOver() || game.turn() !== mySide || thinking) return;
    const piece = game.get(square);
    if (piece && piece.color === mySide) {
      setSelected(square === selected ? null : square);
      return;
    }
    if (!selected) return;
    try {
      const played = game.move({ from: selected, to: square, promotion: "q" });
      setFen(game.fen());
      playMoveSound({
        captured: !!played?.captured,
        check: game.inCheck(),
        over: game.isGameOver(),
      });
      checkEnd();
    } catch {
      /* illegal move */
    }
    setSelected(null);
  };

  const start = () => {
    const side: "w" | "b" =
      sideChoice === "random" ? (Math.random() < 0.5 ? "w" : "b") : sideChoice;
    game.reset();
    scored.current = false;
    setMySide(side);
    setSelected(null);
    setThinking(false);
    setOver(null);
    setEloDelta(null);
    setNote(null);
    setConfirmNew(false);
    setClock({ w: minutes * 60000, b: minutes * 60000 });
    setFen(game.fen());
    setStarted(true);
  };

  const reset = () => {
    game.reset();
    scored.current = false;
    setSelected(null);
    setThinking(false);
    setOver(null);
    setEloDelta(null);
    setNote(null);
    setConfirmNew(false);
    setClock({ w: minutes * 60000, b: minutes * 60000 });
    setFen(game.fen());
  };

  const offerDraw = () => {
    if (finished) return;
    const score = evaluate(game);
    if (Math.abs(score) < 120) finish("Draw agreed", "The bot accepted your draw offer.", 0.5);
    else setNote("The bot declined your draw offer.");
  };

  const resign = () => {
    if (finished) return;
    finish("You resigned", "The bot takes the point.", 0);
  };

  if (!started) {
    return (
      <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-panel)]">
        <h2 className="font-serif text-2xl font-bold tracking-tight text-card-foreground">
          Set up your game
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Answer a few questions, then press Start. Your rating vs {getBot(level).label} is {elo}.
        </p>


        <div className="mt-5 flex flex-col gap-3">
          <Group label="Which colour do you want to play?">
            {SIDES.map((s) => (
              <Choice key={s.id} active={sideChoice === s.id} onClick={() => setSideChoice(s.id)}>
                {s.label}
              </Choice>
            ))}
          </Group>

          <div className="rounded-xl border border-border bg-card p-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Choose your opponent
            </p>
            <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
              {BOT_TIERS.map((tier) => (
                <div key={tier}>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {tier}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {BOTS.filter((b) => b.tier === tier).map((b) => (
                      <button
                        key={b.id}
                        onClick={() => setLevel(b.id)}
                        className={`rounded-lg border px-2 py-1.5 text-left text-xs transition-colors ${
                          level === b.id
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border text-muted-foreground hover:bg-secondary"
                        }`}
                      >
                        <span className="block font-semibold text-foreground">
                          {b.label} <span className="text-muted-foreground">{b.elo}</span>
                        </span>
                        <span className="block truncate">{b.blurb}</span>
                        <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
                          you: {ratings[b.id] ?? startElo(b.id)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Group label="Do you want a clock?">
            {TIMERS.map((t) => (
              <Choice key={t.id} active={minutes === t.id} onClick={() => setMinutes(t.id)}>
                {t.label}
              </Choice>
            ))}
          </Group>

          <Group label="Which board do you like?">
            {BOARD_THEMES.map((t) => (
              <Choice key={t.id} active={theme === t.id} onClick={() => setTheme(t.id)}>
                {t.label}
              </Choice>
            ))}
          </Group>
        </div>



        <button
          onClick={start}
          className="mt-5 w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Start game
        </button>
      </div>
    );
  }

  const myTurn = game.turn() === mySide;
  const inProgress = !finished && history.length > 0;

  const status = finished
    ? over!.headline
    : thinking
      ? "Bot is thinking…"
      : game.inCheck() && myTurn
        ? `Your turn (${mySide === "w" ? "White" : "Black"}) — you're in check`
        : myTurn
          ? `Your turn (${mySide === "w" ? "White" : "Black"})`
          : "Bot's turn";

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-3 shadow-[var(--shadow-panel)]">
        <div className="flex items-center gap-3">
          <span className={`size-2.5 rounded-full ${thinking ? "bg-accent" : "bg-primary"} animate-pulse`} />
          <p className="font-medium tracking-tight text-card-foreground">{status}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          vs {getBot(level).label} — your rating <span className="font-semibold text-foreground">{elo}</span>
        </p>

      </div>

      <div className="flex w-full flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-center">
        <BoardView
          board={board}
          selected={selected}
          destinations={destinations}
          lastMove={lastMove ? { from: lastMove.from, to: lastMove.to } : null}
          flipped={mySide === "b"}
          theme={theme}
          checkSquare={checkSquare}
          onSquareClick={handleClick}
          onDropMove={(from, to) => {
            setSelected(from);
            handleClick(to);
          }}
        />

        <aside className="flex w-full flex-col gap-3 sm:w-52">
          <MoveList
            history={history}
            whiteLabel={mySide === "w" ? "You" : "Bot"}
            blackLabel={mySide === "b" ? "You" : "Bot"}
          />
          <button
            onClick={() => {
              const next = !sound;
              setSound(next);
              setSoundEnabled(next);
            }}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
          >
            Sound: {sound ? "On" : "Off"}
          </button>
          {minutes > 0 && (
            <div className="rounded-xl border border-border bg-card p-3 text-center">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Bot</p>
              <p className="text-xl font-semibold text-foreground">{fmt(clock[botSide])}</p>
              <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">You</p>
              <p className="text-xl font-semibold text-foreground">{fmt(clock[mySide])}</p>
            </div>
          )}

          <button
            onClick={resign}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
          >
            Resign
          </button>
          <button
            onClick={offerDraw}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
          >
            Offer draw
          </button>
          {confirmNew ? (
            <div className="space-y-2 rounded-xl border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground">
                A match is in progress. Leaving it now abandons the game without a rating change.
              </p>
              <button
                onClick={reset}
                className="w-full rounded-md bg-primary px-2 py-1.5 text-xs font-semibold text-primary-foreground"
              >
                Abandon &amp; start new
              </button>
              <button
                onClick={() => {
                  setStarted(false);
                  reset();
                }}
                className="w-full rounded-md border border-border px-2 py-1.5 text-xs text-muted-foreground"
              >
                Abandon &amp; change settings
              </button>
              <button
                onClick={() => setConfirmNew(false)}
                className="w-full rounded-md border border-border px-2 py-1.5 text-xs text-muted-foreground"
              >
                Keep playing
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => (inProgress ? setConfirmNew(true) : reset())}
                className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                New game
              </button>
              <button
                onClick={() => {
                  if (inProgress) {
                    setConfirmNew(true);
                    return;
                  }
                  setStarted(false);
                  reset();
                }}
                className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Change settings
              </button>
            </>
          )}

          {note && <p className="text-xs text-muted-foreground">{note}</p>}

          <Group label="Board">
            {BOARD_THEMES.map((t) => (
              <Choice key={t.id} active={theme === t.id} onClick={() => setTheme(t.id)}>
                {t.label}
              </Choice>
            ))}
          </Group>
        </aside>
      </div>

      <GameOverDialog
        open={finished}
        headline={over?.headline ?? ""}
        detail={over?.detail}
        history={history}
        whiteLabel={mySide === "w" ? "You" : `${getBot(level).label} (${getBot(level).elo})`}
        blackLabel={mySide === "b" ? "You" : `${getBot(level).label} (${getBot(level).elo})`}
        extra={
          eloDelta !== null ? (
            <p className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">
              Elo {elo - eloDelta} →{" "}
              <span className="font-semibold text-foreground">{elo}</span>{" "}
              <span className={eloDelta >= 0 ? "text-accent" : "text-destructive"}>
                ({eloDelta >= 0 ? "+" : ""}
                {eloDelta})
              </span>
            </p>
          ) : null
        }
        onRematch={reset}
        onClose={() => setOver(null)}
      />
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Choice({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "border border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

