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
import {
  humanBotByName,
  humanBotMove,
  humanThinkDelay,
} from "@/lib/humanBots";
import { BoardView } from "@/components/BoardView";
import { GameOverDialog } from "@/components/GameOverDialog";
import { MoveList } from "@/components/MoveList";
import { ReportPanel } from "@/components/ReportPanel";
import { submitFairPlay } from "@/lib/moderation.functions";
import { playMoveSound } from "@/lib/sounds";
import {
  BOARD_THEMES,
  THEME_KEY,
  type BoardTheme,
} from "@/lib/boardThemes";

export const Route = createFileRoute("/play/$gameId")({
  head: () => ({
    meta: [
      {
        title: "Online Chess Match — Click Chess",
      },
      {
        name: "description",
        content:
          "A live chess match against another player. Moves sync across devices and you can only move on your turn.",
      },
      {
        property: "og:title",
        content: "Online Chess Match — Click Chess",
      },
      {
        property: "og:description",
        content:
          "Live multiplayer chess with draw offers, a scorecard and a full game review.",
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
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

  return `${Math.floor(s / 60)}:${String(
    s % 60,
  ).padStart(2, "0")}`;
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

  const [game, setGame] =
    useState<GameRow | null>(null);

  const [opponentName, setOpponentName] =
    useState<string | null>(null);

  const [selected, setSelected] =
    useState<Square | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [theme, setTheme] =
    useState<BoardTheme>("green");

  const [drawOffered, setDrawOffered] =
    useState(false);

  const [incomingDraw, setIncomingDraw] =
    useState(false);

  const [showResult, setShowResult] =
    useState(true);

  const sendFairPlay =
    useServerFn(submitFairPlay);

  const [now, setNow] =
    useState(() => Date.now());

  const channelRef =
    useRef<ReturnType<typeof supabase.channel> | null>(
      null,
    );

  const claimedRef =
    useRef(false);

  const pieceCountRef =
    useRef(0);

  const fillingRef =
    useRef(false);

  /*
   * Stores the FEN currently being calculated by the bot.
   *
   * This prevents duplicate bot moves when the realtime
   * channel and the polling request update the game at
   * nearly the same time.
   */
  const botThinkingRef =
    useRef<string | null>(null);

  /*
   * Load saved board theme.
   */
  useEffect(() => {
    const saved =
      window.localStorage.getItem(
        THEME_KEY,
      ) as BoardTheme | null;

    if (
      saved &&
      BOARD_THEMES.some(
        (t) => t.id === saved,
      )
    ) {
      setTheme(saved);
    }
  }, []);

  /*
   * Require login.
   */
  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/" });
    }
  }, [
    loading,
    user,
    navigate,
  ]);

  /*
   * Load the game and keep it synchronized.
   *
   * Realtime is used when available.
   * Polling every 2 seconds is also kept as a
   * fallback so multiplayer still works if the
   * realtime websocket has trouble.
   */
  useEffect(() => {
    let active = true;

    const load = async () => {
      const { data, error: loadError } =
        await supabase
          .from("games")
          .select("*")
          .eq("id", gameId)
          .maybeSingle();

      if (loadError) {
        console.error(
          "LOAD GAME ERROR:",
          loadError,
        );

        if (active) {
          setError(
            `Could not load game: ${loadError.message}`,
          );
        }

        return;
      }

      if (active && data) {
        setGame(data as GameRow);
      }
    };

    void load();

    const channel = supabase
      .channel(`game-${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          if (active) {
            setGame(
              payload.new as GameRow,
            );
          }
        },
      )
      .on(
        "broadcast",
        {
          event: "draw-offer",
        },
        ({ payload }) => {
          if (
            payload?.from !== user?.id
          ) {
            setIncomingDraw(true);
          }
        },
      )
      .on(
        "broadcast",
        {
          event: "draw-decline",
        },
        ({ payload }) => {
          if (
            payload?.from !== user?.id
          ) {
            setDrawOffered(false);
          }
        },
      )
      .subscribe();

    channelRef.current = channel;

    const poll = window.setInterval(
      () => {
        void load();
      },
      2000,
    );

    return () => {
      active = false;

      window.clearInterval(poll);

      void supabase.removeChannel(
        channel,
      );

      channelRef.current = null;
    };
  }, [
    gameId,
    user?.id,
  ]);

  /*
   * Determine our colour.
   */
  const myColor =
    !game || !user
      ? null
      : game.white_id === user.id
        ? "w"
        : game.black_id === user.id
          ? "b"
          : null;

  /*
   * Find the opponent username.
   */
  useEffect(() => {
    const otherId =
      myColor === "w"
        ? game?.black_id
        : game?.white_id;

    if (!otherId) {
      setOpponentName(
        game?.bot_name ?? null,
      );

      return;
    }

    void supabase
      .from("profiles")
      .select("username")
      .eq("id", otherId)
      .maybeSingle()
      .then(({ data }) => {
        setOpponentName(
          data?.username ?? null,
        );
      });
  }, [
    game?.black_id,
    game?.white_id,
    game?.bot_name,
    myColor,
  ]);

  /*
   * Build chess.js position from the
   * current server FEN.
   */
  const chess = useMemo(
    () =>
      game
        ? new Chess(game.fen)
        : null,
    [game?.fen],
  );

  const board = useMemo(
    () => chess?.board() ?? [],
    [chess],
  );

  /*
   * Is it our turn?
   */
  const myTurn =
    !!chess &&
    !!myColor &&
    chess.turn() === myColor &&
    game?.status === "active";

  /*
   * ============================================================
   * BOT FALLBACK
   * ============================================================
   *
   * Wait 30 seconds for a human.
   *
   * If nobody joins, ask the server to seat a bot.
   *
   * Retry every 3 seconds if the request fails.
   */
  const waitingAlone =
    game?.status === "waiting" &&
    !!myColor &&
    !game.invited_username &&
    (myColor === "w"
      ? !game.black_id
      : !game.white_id);

  useEffect(() => {
    if (!waitingAlone) {
      fillingRef.current = false;
      return;
    }

    if (fillingRef.current) {
      return;
    }

    const startedAt =
      Date.now();

    const tryFillBot =
      async () => {
        if (
          !waitingAlone ||
          fillingRef.current
        ) {
          return;
        }

        const elapsed =
          Date.now() -
          startedAt;

        if (elapsed < 30000) {
          return;
        }

        fillingRef.current = true;

        try {
          const result =
            await seatBot({
              data: {
                gameId,
              },
            });

          if (result) {
            /*
             * The server response may only contain
             * bot-related fields, so merge it with
             * the existing game rather than replacing
             * the complete game object.
             */
            setGame(
              (current) =>
                current
                  ? {
                      ...current,
                      ...result,
                    }
                  : current,
            );
          }

          setError(null);
        } catch (e) {
          console.error(
            "[BOT] Could not start bot:",
            e,
          );

          setError(
            e instanceof Error
              ? e.message.replace(
                  /^Error:\s*/,
                  "",
                )
              : "Could not start the bot.",
          );
        } finally {
          fillingRef.current = false;
        }
      };

    const firstTimer =
      window.setTimeout(
        () => {
          void tryFillBot();
        },
        30000,
      );

    const retryTimer =
      window.setInterval(
        () => {
          void tryFillBot();
        },
        3000,
      );

    return () => {
      window.clearTimeout(
        firstTimer,
      );

      window.clearInterval(
        retryTimer,
      );
    };
  }, [
    waitingAlone,
    seatBot,
    gameId,
  ]);

  /*
   * ============================================================
   * COMPUTER OPPONENT
   * ============================================================
   *
   * IMPORTANT:
   *
   * We do NOT require the bot's database seat to be empty.
   *
   * The database represents the bot using bot_name while
   * the player's colour is stored in white_id/black_id.
   *
   * Therefore the only things that matter are:
   *
   *   1. There is a bot.
   *   2. The game is active.
   *   3. It is the bot's turn.
   *
   * The bot move is calculated locally and then sent to
   * botPlayMove() so the server validates and saves it.
   */
  useEffect(() => {
    if (
      !game ||
      !chess ||
      game.status !== "active" ||
      !game.bot_name ||
      !myColor
    ) {
      return;
    }

    /*
     * The bot is always the opposite colour
     * from the human player.
     */
    const botColor =
      myColor === "w"
        ? "b"
        : "w";

    /*
     * If it is our turn, wait.
     */
    if (
      chess.turn() !== botColor
    ) {
      return;
    }

    /*
     * Find the bot definition.
     */
    const bot =
      humanBotByName(
        game.bot_name,
      );

    if (!bot) {
      console.error(
        "[BOT] Bot not found:",
        game.bot_name,
      );

      setError(
        `Bot "${game.bot_name}" could not be loaded.`,
      );

      return;
    }

    /*
     * Current position.
     */
    const fen = game.fen;

    /*
     * Prevent duplicate calculations for the
     * same position.
     */
    if (
      botThinkingRef.current ===
      fen
    ) {
      return;
    }

    botThinkingRef.current = fen;

    console.log(
      "[BOT] Thinking...",
      {
        bot: game.bot_name,
        color: botColor,
        fen,
      },
    );

    /*
     * Give the bot its human-like thinking delay.
     */
    const timer =
      window.setTimeout(
        () => {
          try {
            /*
             * Calculate a legal move.
             */
            const choice =
              humanBotMove(
                fen,
                bot,
              );

            if (!choice) {
              console.error(
                "[BOT] No legal move found.",
              );

              botThinkingRef.current =
                null;

              return;
            }

            console.log(
              "[BOT] Playing:",
              choice.from,
              "->",
              choice.to,
            );

            /*
             * Send the move to the server.
             */
            sendBotMove({
              data: {
                gameId,
                from: choice.from,
                to: choice.to,
              },
            })
              .then((res) => {
                console.log(
                  "[BOT] Move saved:",
                  choice.from,
                  "->",
                  choice.to,
                );

                /*
                 * Allow the next FEN to be
                 * processed.
                 */
                botThinkingRef.current =
                  null;

                /*
                 * Update immediately.
                 *
                 * Realtime/polling will also
                 * update this state.
                 */
                setGame(
                  (current) =>
                    current
                      ? {
                          ...current,
                          fen: res.fen,
                          status:
                            res.status,
                          result:
                            res.result,
                          last_move:
                            `${choice.from}${choice.to}`,
                        }
                      : current,
                );

                setError(null);
              })
              .catch((e) => {
                console.error(
                  "[BOT] Server move failed:",
                  e,
                );

                botThinkingRef.current =
                  null;

                setError(
                  e instanceof Error
                    ? e.message.replace(
                        /^Error:\s*/,
                        "",
                      )
                    : "Bot move failed.",
                );
              });
          } catch (e) {
            console.error(
              "[BOT] Move calculation failed:",
              e,
            );

            botThinkingRef.current =
              null;

            setError(
              e instanceof Error
                ? e.message
                : "Bot could not calculate a move.",
            );
          }
        },
        humanThinkDelay(bot),
      );

    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, [
    game,
    chess,
    myColor,
    gameId,
    sendBotMove,
  ]);

  /*
   * ============================================================
   * CLOCKS
   * ============================================================
   */
  const clockOn =
    !!game?.time_control &&
    game.status === "active";

  useEffect(() => {
    if (!clockOn) {
      return;
    }

    const id =
      window.setInterval(
        () => {
          setNow(
            Date.now(),
          );
        },
        250,
      );

    return () =>
      window.clearInterval(
        id,
      );
  }, [clockOn]);

  const remaining =
    (side: "w" | "b") => {
      if (!game?.time_control) {
        return null;
      }

      const base =
        (side === "w"
          ? game.white_ms
          : game.black_ms) ??
        game.time_control *
          60000;

      if (
        game.status !==
          "active" ||
        !chess ||
        chess.turn() !==
          side ||
        !game.turn_started_at
      ) {
        return Math.max(
          0,
          base,
        );
      }

      return Math.max(
        0,
        base -
          (now -
            new Date(
              game.turn_started_at,
            ).getTime()),
      );
    };

  const turnClock =
    chess
      ? remaining(
          chess.turn() as
            | "w"
            | "b",
        )
      : null;

  /*
   * Claim timeout when clock reaches zero.
   */
  useEffect(() => {
    if (
      !clockOn ||
      turnClock === null ||
      turnClock > 0 ||
      claimedRef.current
    ) {
      return;
    }

    claimedRef.current = true;

    timeout({
      data: {
        gameId,
      },
    }).catch(() => {
      claimedRef.current = false;
    });
  }, [
    clockOn,
    turnClock,
    timeout,
    gameId,
  ]);

  /*
   * ============================================================
   * MOVE HISTORY
   * ============================================================
   */
  const [moveLog, setMoveLog] =
    useState<string[]>([]);

  useEffect(() => {
    const lm =
      game?.last_move;

    if (!lm) {
      return;
    }

    setMoveLog(
      (log) => {
        if (
          log[log.length - 1] ===
          lm
        ) {
          return log;
        }

        const pieces =
          (game?.fen ?? "")
            .split(" ")[0]
            .replace(
              /[^a-zA-Z]/g,
              "",
            ).length;

        const captured =
          pieceCountRef.current >
            0 &&
          pieces <
            pieceCountRef.current;

        pieceCountRef.current =
          pieces;

        playMoveSound({
          captured,
          check:
            !!chess?.inCheck(),
          over:
            game?.status ===
            "finished",
        });

        return [
          ...log,
          lm,
        ];
      },
    );
  }, [
    game?.last_move,
  ]);

  const history = useMemo(
    () => {
      const replay =
        new Chess();

      for (
        const m of moveLog
      ) {
        try {
          replay.move({
            from: m.slice(
              0,
              2,
            ),
            to: m.slice(
              2,
              4,
            ),
            promotion: "q",
          });
        } catch {
          return [] as Move[];
        }
      }

      return replay.history({
        verbose: true,
      }) as Move[];
    },
    [moveLog],
  );

  /*
   * Clear errors when it becomes our turn.
   */
  useEffect(() => {
    if (myTurn) {
      setError(null);
    }
  }, [myTurn]);

  /*
   * Legal destination squares.
   */
  const destinations =
    useMemo(() => {
      if (
        !chess ||
        !selected
      ) {
        return new Set<string>();
      }

      return new Set(
        chess
          .moves({
            square:
              selected,
            verbose:
              true,
          })
          .map(
            (m) => m.to,
          ),
      );
    }, [
      chess,
      selected,
    ]);

  /*
   * Highlight king in check.
   */
  const checkSquare =
    useMemo(() => {
      if (
        !chess?.inCheck()
      ) {
        return null;
      }

      const turn =
        chess.turn();

      for (
        const row of chess.board()
      ) {
        for (
          const cell of row
        ) {
          if (
            cell &&
            cell.type ===
              "k" &&
            cell.color ===
              turn
          ) {
            return cell.square;
          }
        }
      }

      return null;
    }, [chess]);

  /*
   * Last move highlight.
   */
  const lastMove =
    game?.last_move
      ? {
          from:
            game.last_move.slice(
              0,
              2,
            ),
          to:
            game.last_move.slice(
              2,
              4,
            ),
        }
      : null;

  /*
   * ============================================================
   * HUMAN MOVE
   * ============================================================
   */
  const onSquareClick =
    async (
      square: Square,
    ) => {
      if (
        !chess ||
        !myTurn
      ) {
        if (
          game?.status ===
            "active" &&
          !myTurn
        ) {
          setError(
            "It's not your turn yet.",
          );
        }

        return;
      }

      setError(null);

      const piece =
        chess.get(square);

      /*
       * Select one of our pieces.
       */
      if (
        piece &&
        piece.color ===
          myColor
      ) {
        setSelected(
          square ===
            selected
            ? null
            : square,
        );

        return;
      }

      if (!selected) {
        return;
      }

      const from =
        selected;

      setSelected(null);

      try {
        const res =
          await move({
            data: {
              gameId,
              from,
              to: square,
            },
          });

        setGame(
          (g) =>
            g
              ? {
                  ...g,
                  fen: res.fen,
                  status:
                    res.status,
                  result:
                    res.result,
                  last_move:
                    `${from}${square}`,
                }
              : g,
        );
      } catch (e) {
        console.error(
          "PLAYER MOVE ERROR:",
          e,
        );

        setError(
          e instanceof Error
            ? e.message.replace(
                /^Error:\s*/,
                "",
              )
            : "Move failed.",
        );
      }
    };

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */
  if (!game) {
    return (
      <Shell>
        <p className="text-center text-sm text-muted-foreground">
          Loading match…
        </p>
      </Shell>
    );
  }

  /*
   * User isn't a player in this game.
   */
  if (!myColor) {
    return (
      <Shell>
        <p className="text-center text-sm text-muted-foreground">
          You're not a player in this match.
        </p>
      </Shell>
    );
  }

  /*
   * Determine result.
   */
  const iWon =
    game.result ===
    (myColor === "w"
      ? "white"
      : "black");

  /*
   * Status message.
   */
  let status: string;

  if (
    game.status ===
    "waiting"
  ) {
    status =
      game.invited_username
        ? `Waiting for ${game.invited_username} to join…`
        : "Finding you an opponent…";
  } else if (
    game.status ===
    "finished"
  ) {
    status =
      game.result ===
      "draw"
        ? "Draw"
        : iWon
          ? "You won!"
          : "You lost.";
  } else if (
    myTurn
  ) {
    status =
      chess?.inCheck()
        ? "Your move — you're in check"
        : "Your move";
  } else if (
    game.bot_name
  ) {
    status = `Waiting for ${
      opponentName ??
      game.bot_name
    }…`;
  } else {
    status = `Waiting for ${
      opponentName ??
      "your opponent"
    }…`;
  }

  /*
   * Draw offer.
   */
  const sendDrawOffer =
    () => {
      setDrawOffered(
        true,
      );

      channelRef.current?.send(
        {
          type: "broadcast",
          event:
            "draw-offer",
          payload: {
            from:
              user?.id,
          },
        },
      );
    };

  /*
   * ============================================================
   * UI
   * ============================================================
   */
  return (
    <Shell>
      <div className="flex flex-col items-center gap-5">

        <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-3 shadow-[var(--shadow-panel)]">

          <div>
            <p className="font-medium text-card-foreground">
              {status}
            </p>

            <p className="text-xs text-muted-foreground">
              You play{" "}
              {myColor === "w"
                ? "White"
                : "Black"}

              {opponentName
                ? ` · vs ${opponentName}`
                : ""}

              {game.bot_name &&
              game.bot_elo
                ? ` (${game.bot_elo})`
                : ""}
            </p>
          </div>

          {!!game.time_control && (
            <div className="flex gap-2 font-mono text-sm">

              <span
                className={`rounded-md px-2.5 py-1 ${
                  chess?.turn() ===
                  (myColor ===
                  "w"
                    ? "b"
                    : "w")
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {opponentName ??
                  game.bot_name ??
                  "Opponent"}{" "}
                {fmtClock(
                  remaining(
                    myColor ===
                      "w"
                      ? "b"
                      : "w",
                  ) ?? 0,
                )}
              </span>

              <span
                className={`rounded-md px-2.5 py-1 ${
                  myTurn
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                }`}
              >
                You{" "}
                {fmtClock(
                  remaining(
                    myColor,
                  ) ?? 0,
                )}
              </span>

            </div>
          )}

        </div>

        {game.status ===
          "waiting" && (
          <p className="rounded-lg border border-border bg-card px-4 py-2 text-xs text-muted-foreground">
            {game.invited_username
              ? `Waiting for ${game.invited_username} to join…`
              : "Waiting for an opponent. If nobody joins within 30 seconds, a bot will automatically start the game."}
          </p>
        )}

        <div className="flex w-full flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-center">

          <BoardView
            board={board}
            selected={
              selected
            }
            destinations={
              destinations
            }
            lastMove={
              lastMove
            }
            flipped={
              myColor === "b"
            }
            theme={theme}
            checkSquare={
              checkSquare
            }
            onSquareClick={
              onSquareClick
            }
            onDropMove={(
              from,
              to,
            ) => {
              setSelected(
                from,
              );

              void onSquareClick(
                to,
              );
            }}
          />

          <aside className="flex w-full flex-col gap-3 sm:w-52">

            <MoveList
              history={history}
              whiteLabel={
                myColor ===
                "w"
                  ? username ??
                    "You"
                  : opponentName ??
                    "White"
              }
              blackLabel={
                myColor ===
                "b"
                  ? username ??
                    "You"
                  : opponentName ??
                    "Black"
              }
            />

            {game.status !==
              "finished" && (
              <>
                <button
                  onClick={() =>
                    resign({
                      data: {
                        gameId,
                      },
                    })
                  }
                  className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
                >
                  Resign
                </button>

                <button
                  onClick={
                    sendDrawOffer
                  }
                  disabled={
                    drawOffered
                  }
                  className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-50"
                >
                  {drawOffered
                    ? "Draw offered…"
                    : "Offer draw"}
                </button>
              </>
            )}

            {incomingDraw &&
              game.status ===
                "active" && (
                <div className="space-y-2 rounded-xl border border-border bg-card p-3">

                  <p className="text-xs text-muted-foreground">
                    {opponentName ??
                      "Your opponent"}{" "}
                    offers a draw.
                  </p>

                  <button
                    onClick={async () => {
                      setIncomingDraw(
                        false,
                      );

                      try {
                        await draw({
                          data: {
                            gameId,
                          },
                        });
                      } catch (e) {
                        setError(
                          e instanceof Error
                            ? e.message.replace(
                                /^Error:\s*/,
                                "",
                              )
                            : "Could not accept draw.",
                        );
                      }
                    }}
                    className="w-full rounded-md bg-primary px-2 py-1.5 text-xs font-semibold text-primary-foreground"
                  >
                    Accept
                  </button>

                  <button
                    onClick={() => {
                      setIncomingDraw(
                        false,
                      );

                      channelRef.current?.send(
                        {
                          type:
                            "broadcast",
                          event:
                            "draw-decline",
                          payload: {
                            from:
                              user?.id,
                          },
                        },
                      );
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

                {BOARD_THEMES.map(
                  (t) => (
                    <button
                      key={t.id}
                      onClick={() =>
                        setTheme(
                          t.id,
                        )
                      }
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        theme ===
                        t.id
                          ? "bg-primary text-primary-foreground"
                          : "border border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t.label}
                    </button>
                  ),
                )}

              </div>
            </div>

            {game.status ===
              "finished" && (
              <button
                onClick={() =>
                  setShowResult(
                    true,
                  )
                }
                className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Scorecard & review
              </button>
            )}

          </aside>
        </div>

        {error && (
          <p className="max-w-xl text-center text-sm text-destructive">
            {error}
          </p>
        )}

      </div>

      <GameOverDialog
        open={
          game.status ===
            "finished" &&
          showResult
        }
        headline={
          game.result ===
          "draw"
            ? "Draw"
            : iWon
              ? "You won!"
              : "You lost"
        }
        detail={
          game.result ===
          "draw"
            ? "The game ended in a draw."
            : chess?.isCheckmate()
              ? "Checkmate ended the game."
              : "The game is over."
        }
        history={history}
        whiteLabel={
          myColor ===
          "w"
            ? username ??
              "You"
            : opponentName ??
              "White"
        }
        blackLabel={
          myColor ===
          "b"
            ? username ??
              "You"
            : opponentName ??
              "Black"
        }
        reportSlot={
          <ReportPanel
            gameId={
              gameId
            }
          />
        }
        onReview={(
          review,
        ) => {
          void sendFairPlay({
            data: {
              gameId,
              stats: (
                [
                  "w",
                  "b",
                ] as const
              ).map(
                (c) => ({
                  color: c,
                  engineMatch:
                    review
                      .fairPlay[
                      c
                    ]
                      .engineMatch,
                  accuracy:
                    review
                      .fairPlay[
                      c
                    ]
                      .accuracy,
                  moves:
                    review
                      .fairPlay[
                      c
                    ].moves,
                  suspicion:
                    review
                      .fairPlay[
                      c
                    ]
                      .suspicion,
                }),
              ),
            },
          }).catch(
            () =>
              undefined,
          );
        }}
        onRematch={() =>
          navigate({
            to: "/",
          })
        }
        onClose={() =>
          setShowResult(
            false,
          )
        }
      />
    </Shell>
  );
}

function Shell({
  children,
}: {
  children: React.ReactNode;
}) {
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