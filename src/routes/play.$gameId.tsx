import {
  createFileRoute,
  Link,
  useNavigate,
} from "@tanstack/react-router";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useServerFn,
} from "@tanstack/react-start";

import {
  Chess,
  type Move,
  type Square,
} from "chess.js";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

import {
  agreeDraw,
  botPlayMove,
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


/* =========================================================
   ROUTE
========================================================= */

export const Route =
  createFileRoute("/play/$gameId")({
    head: () => ({
      meta: [
        {
          title: "Online Chess Match — Chessers",
        },
        {
          name: "description",
          content:
            "Live multiplayer chess with automatic bot opponents.",
        },
      ],
    }),

    component: PlayOnline,
  });


/* =========================================================
   DATABASE GAME TYPE
========================================================= */

type GameRow = {
  id: string;

  white_id: string | null;
  black_id: string | null;

  white_username: string | null;
  black_username: string | null;

  status: string;

  fen: string;

  turn: string | null;

  winner: string | null;

  created_at?: string | null;
  updated_at?: string | null;

  last_move?: string | null;
};


/* =========================================================
   CONSTANTS
========================================================= */

/*
 * IMPORTANT:
 *
 * The player gets 30 seconds to find another player.
 *
 * After 30 seconds, a bot automatically joins.
 */
const BOT_WAIT_MS = 30_000;


/*
 * Polling keeps the game working even if realtime
 * temporarily disconnects.
 */
const POLL_MS = 2000;


/* =========================================================
   PLAY ONLINE
========================================================= */

function PlayOnline() {
  const { gameId } = Route.useParams();

  const {
    user,
    username,
    loading,
  } = useAuth();

  const navigate = useNavigate();


  /* -------------------------------------------------------
     SERVER FUNCTIONS
  ------------------------------------------------------- */

  const move =
    useServerFn(makeMove);

  const resign =
    useServerFn(resignGame);

  const draw =
    useServerFn(agreeDraw);

  const seatBot =
    useServerFn(fillWithBot);

  const sendBotMove =
    useServerFn(botPlayMove);

  const sendFairPlay =
    useServerFn(submitFairPlay);


  /* -------------------------------------------------------
     STATE
  ------------------------------------------------------- */

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

  const [moveLog, setMoveLog] =
    useState<string[]>([]);


  /* -------------------------------------------------------
     REFS
  ------------------------------------------------------- */

  const channelRef =
    useRef<
      ReturnType<typeof supabase.channel> | null
    >(null);

  const fillingRef =
    useRef(false);

  const botThinkingRef =
    useRef<string | null>(null);

  const pieceCountRef =
    useRef(0);


  /* =======================================================
     LOAD SAVED BOARD THEME
  ======================================================= */

  useEffect(() => {
    const saved =
      window.localStorage.getItem(
        THEME_KEY,
      ) as BoardTheme | null;

    if (
      saved &&
      BOARD_THEMES.some(
        (themeItem) =>
          themeItem.id === saved,
      )
    ) {
      setTheme(saved);
    }
  }, []);


  /* =======================================================
     REQUIRE LOGIN
  ======================================================= */

  useEffect(() => {
    if (!loading && !user) {
      navigate({
        to: "/",
      });
    }
  }, [
    loading,
    user,
    navigate,
  ]);


  /* =======================================================
     LOAD GAME + REALTIME
  ======================================================= */

  useEffect(() => {
    let active = true;


    const loadGame = async () => {
      const {
        data,
        error: loadError,
      } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .maybeSingle();


      if (!active) {
        return;
      }


      if (loadError) {
        setError(
          loadError.message,
        );

        return;
      }


      if (!data) {
        setError(
          "Game not found.",
        );

        return;
      }


      /*
       * IMPORTANT:
       *
       * Always use the real database row.
       */
      setGame(
        data as GameRow,
      );
    };


    void loadGame();


    /* -----------------------------------------------------
       REALTIME CHANNEL
    ----------------------------------------------------- */

    const channel =
      supabase
        .channel(
          `game-${gameId}`,
        )

        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "games",
            filter:
              `id=eq.${gameId}`,
          },
          (payload) => {
            if (!active) {
              return;
            }

            setGame(
              payload.new as GameRow,
            );
          },
        )

        .on(
          "broadcast",
          {
            event:
              "draw-offer",
          },
          ({ payload }) => {
            if (
              payload?.from !==
              user?.id
            ) {
              setIncomingDraw(
                true,
              );
            }
          },
        )

        .on(
          "broadcast",
          {
            event:
              "draw-decline",
          },
          ({ payload }) => {
            if (
              payload?.from !==
              user?.id
            ) {
              setDrawOffered(
                false,
              );
            }
          },
        )

        .subscribe();


    channelRef.current =
      channel;


    /*
     * Backup polling.
     *
     * This is important because the bot and multiplayer
     * system should still update if realtime misses an event.
     */
    const poll =
      window.setInterval(
        () => {
          void loadGame();
        },
        POLL_MS,
      );


    return () => {
      active = false;

      window.clearInterval(
        poll,
      );

      supabase.removeChannel(
        channel,
      );

      channelRef.current =
        null;
    };
  }, [
    gameId,
    user?.id,
  ]);


  /* =======================================================
     MY COLOR
  ======================================================= */

  const myColor =
    !game || !user
      ? null
      : game.white_id ===
        user.id
        ? "w"
        : game.black_id ===
            user.id
          ? "b"
          : null;


  /* =======================================================
     OPPONENT
  ======================================================= */

  useEffect(() => {
    if (!game) {
      setOpponentName(
        null,
      );

      return;
    }


    /*
     * If I'm White:
     *
     *   opponent = Black
     *
     * If I'm Black:
     *
     *   opponent = White
     */
    const otherId =
      myColor === "w"
        ? game.black_id
        : myColor === "b"
          ? game.white_id
          : null;


    /*
     * If the opposite seat has no player ID,
     * it is the bot seat.
     */
    if (!otherId) {
      const botName =
        myColor === "w"
          ? game.black_username
          : game.white_username;

      setOpponentName(
        botName ?? null,
      );

      return;
    }


    /*
     * Real player.
     */
    void supabase
      .from("profiles")
      .select("username")
      .eq("id", otherId)
      .maybeSingle()
      .then(
        ({
          data,
        }) => {
          setOpponentName(
            data?.username ??
              "Opponent",
          );
        },
      );
  }, [
    game?.black_id,
    game?.white_id,
    game?.black_username,
    game?.white_username,
    myColor,
  ]);


  /* =======================================================
     CHESS INSTANCE
  ======================================================= */

  const safeFen =
    game?.fen &&
    game.fen !== "start"
      ? game.fen
      : "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";


  const chess =
    useMemo(() => {
      if (!game) {
        return null;
      }

      try {
        return new Chess(
          safeFen,
        );
      } catch {
        /*
         * Protect the UI from an invalid FEN.
         */
        return new Chess();
      }
    }, [
      game?.fen,
      safeFen,
    ]);


  /* =======================================================
     BOARD
  ======================================================= */

  const board =
    useMemo(
      () =>
        chess?.board() ??
        [],
      [chess],
    );


  /* =======================================================
     TURN
  ======================================================= */

  const myTurn =
    !!chess &&
    !!myColor &&
    chess.turn() ===
      myColor &&
    game?.status ===
      "active";


  /* =======================================================
     BOT WAITING SYSTEM
  ======================================================= */

  const waitingAlone =
    !!game &&
    game.status ===
      "waiting" &&
    !!myColor &&
    (
      myColor === "w"
        ? !game.black_id
        : !game.white_id
    );


  /*
   * AUTOMATIC BOT:
   *
   * Wait exactly 30 seconds.
   *
   * Then call fillWithBot().
   */
  useEffect(() => {
    if (!waitingAlone) {
      fillingRef.current =
        false;

      return;
    }


    if (
      fillingRef.current
    ) {
      return;
    }


    /*
     * Use the game creation time when available.
     *
     * This prevents the 30 seconds from resetting
     * every time Supabase sends a realtime update.
     */
    const createdAt =
      game?.created_at
        ? new Date(
            game.created_at,
          ).getTime()
        : Date.now();


    const getElapsed =
      () =>
        Date.now() -
        createdAt;


    const tryFillBot =
      async () => {
        if (
          !waitingAlone ||
          fillingRef.current
        ) {
          return;
        }


        const elapsed =
          getElapsed();


        if (
          elapsed <
          BOT_WAIT_MS
        ) {
          return;
        }


        fillingRef.current =
          true;


        try {
          const result =
            await seatBot({
              data: {
                gameId,
              },
            });


          if (
            result.filled
          ) {
            /*
             * Reload the actual row from Supabase.
             *
             * This is safer than trying to manufacture
             * a frontend game object from the server result.
             */
            const {
              data,
            } =
              await supabase
                .from("games")
                .select("*")
                .eq(
                  "id",
                  gameId,
                )
                .maybeSingle();


            if (data) {
              setGame(
                data as GameRow,
              );
            }


            setError(
              null,
            );
          }
        } catch (e) {
          setError(
            e instanceof Error
              ? e.message.replace(
                  /^Error:\s*/,
                  "",
                )
              : "Could not start the bot.",
          );
        } finally {
          fillingRef.current =
            false;
        }
      };


    /*
     * First attempt exactly when the 30 seconds expire.
     */
    const elapsed =
      getElapsed();

    const remaining =
      Math.max(
        0,
        BOT_WAIT_MS -
          elapsed,
      );


    const firstTimer =
      window.setTimeout(
        () => {
          void tryFillBot();
        },
        remaining,
      );


    /*
     * If the first request fails because another
     * client changed the row at the same time,
     * retry every 3 seconds.
     */
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
    game?.created_at,
    gameId,
    seatBot,
  ]);


  /* =======================================================
     BOT DETECTION
  ======================================================= */

  const botName =
    game && myColor
      ? myColor === "w"
        ? game.black_username
        : game.white_username
      : null;


  const botSeatEmpty =
    !!game &&
    !!myColor &&
    !!botName &&
    (
      myColor === "w"
        ? !game.black_id
        : !game.white_id
    );


  /* =======================================================
     BOT MOVE SYSTEM
  ======================================================= */

  useEffect(() => {
    if (
      !botSeatEmpty ||
      !chess ||
      !game ||
      game.status !==
        "active" ||
      myTurn
    ) {
      return;
    }


    if (!botName) {
      return;
    }


    const bot =
      humanBotByName(
        botName,
      );


    if (!bot) {
      setError(
        `Bot "${botName}" could not be found.`,
      );

      return;
    }


    const fen =
      game.fen;


    /*
     * Don't make two bot moves from the
     * exact same position.
     */
    if (
      botThinkingRef.current ===
      fen
    ) {
      return;
    }


    botThinkingRef.current =
      fen;


    /*
     * Human-like thinking delay.
     */
    const thinkingTime =
      humanThinkDelay(
        bot,
      );


    const timer =
      window.setTimeout(
        async () => {
          try {
            const choice =
              humanBotMove(
                fen,
                bot,
              );


            if (!choice) {
              botThinkingRef.current =
                null;

              return;
            }


            const result =
              await sendBotMove({
                data: {
                  gameId,
                  from:
                    choice.from,
                  to:
                    choice.to,
                },
              });


            /*
             * Reload the complete database row.
             *
             * This keeps the client synchronized.
             */
            const {
              data,
            } =
              await supabase
                .from("games")
                .select("*")
                .eq(
                  "id",
                  gameId,
                )
                .maybeSingle();


            if (data) {
              setGame(
                data as GameRow,
              );
            } else {
              /*
               * Fallback if the realtime/database
               * request is momentarily unavailable.
               */
              setGame(
                (current) =>
                  current
                    ? {
                        ...current,
                        fen:
                          result.fen,
                        status:
                          result.status,
                        winner:
                          result.winner,
                        turn:
                          result.turn,
                        last_move:
                          `${choice.from}${choice.to}`,
                      }
                    : current,
              );
            }


            botThinkingRef.current =
              null;

            setError(
              null,
            );
          } catch (e) {
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
          }
        },
        thinkingTime,
      );


    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, [
    botSeatEmpty,
    botName,
    game?.fen,
    game?.status,
    myTurn,
    gameId,
    sendBotMove,
    chess,
  ]);


  /* =======================================================
     MOVE HISTORY
  ======================================================= */

  useEffect(() => {
    const lastMove =
      game?.last_move;


    if (!lastMove) {
      return;
    }


    setMoveLog(
      (log) => {
        if (
          log[
            log.length - 1
          ] === lastMove
        ) {
          return log;
        }


        const pieces =
          (
            game?.fen ??
            ""
          )
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
          lastMove,
        ];
      },
    );
  }, [
    game?.last_move,
  ]);


  const history =
    useMemo(() => {
      const replay =
        new Chess();


      for (
        const moveString of
        moveLog
      ) {
        try {
          replay.move({
            from:
              moveString.slice(
                0,
                2,
              ),
            to:
              moveString.slice(
                2,
                4,
              ),
            promotion:
              "q",
          });
        } catch {
          return [] as Move[];
        }
      }


      return replay.history({
        verbose: true,
      }) as Move[];
    }, [
      moveLog,
    ]);


  /* =======================================================
     CLEAR ERROR WHEN IT BECOMES OUR TURN
  ======================================================= */

  useEffect(() => {
    if (myTurn) {
      setError(null);
    }
  }, [
    myTurn,
  ]);


  /* =======================================================
     DESTINATIONS
  ======================================================= */

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
            (move) =>
              move.to,
          ),
      );
    }, [
      chess,
      selected,
    ]);


  /* =======================================================
     CHECK SQUARE
  ======================================================= */

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
        const row of
        chess.board()
      ) {
        for (
          const cell of
          row
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
    }, [
      chess,
    ]);


  /* =======================================================
     LAST MOVE
  ======================================================= */

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


  /* =======================================================
     CLICK BOARD
  ======================================================= */

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
        chess.get(
          square,
        );


      /*
       * Select our piece.
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


      setSelected(
        null,
      );


      try {
        const result =
          await move({
            data: {
              gameId,
              from,
              to: square,
            },
          });


        /*
         * Reload the complete row.
         */
        const {
          data,
        } =
          await supabase
            .from("games")
            .select("*")
            .eq(
              "id",
              gameId,
            )
            .maybeSingle();


        if (data) {
          setGame(
            data as GameRow,
          );
        } else {
          setGame(
            (current) =>
              current
                ? {
                    ...current,
                    fen:
                      result.fen,
                    status:
                      result.status,
                    turn:
                      result.turn,
                    winner:
                      result.winner,
                    last_move:
                      `${from}${square}`,
                  }
                : current,
          );
        }
      } catch (e) {
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


  /* =======================================================
     DRAW OFFER
  ======================================================= */

  const sendDrawOffer =
    () => {
      setDrawOffered(
        true,
      );


      channelRef.current?.send(
        {
          type:
            "broadcast",

          event:
            "draw-offer",

          payload: {
            from:
              user?.id,
          },
        },
      );
    };


  /* =======================================================
     LOADING
  ======================================================= */

  if (!game) {
    return (
      <Shell>
        <p className="text-center text-sm text-muted-foreground">
          Loading match…
        </p>

        {error && (
          <p className="mt-3 text-center text-sm text-destructive">
            {error}
          </p>
        )}
      </Shell>
    );
  }


  /* =======================================================
     PLAYER CHECK
  ======================================================= */

  if (!myColor) {
    return (
      <Shell>
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <p className="font-medium text-card-foreground">
            You're not a player in this match.
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            This game belongs to another account.
          </p>

          <button
            onClick={() =>
              navigate({
                to: "/",
              })
            }
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Go home
          </button>
        </div>
      </Shell>
    );
  }


  /* =======================================================
     RESULT
  ======================================================= */

  const myResult =
    game.winner ===
    "draw"
      ? "draw"
      : game.winner ===
          (myColor ===
          "w"
            ? "white"
            : "black")
        ? "win"
        : game.winner
          ? "loss"
          : null;


  /* =======================================================
     STATUS TEXT
  ======================================================= */

  let status: string;


  if (
    game.status ===
    "waiting"
  ) {
    status =
      "Finding you an opponent…";
  } else if (
    game.status ===
    "finished"
  ) {
    status =
      myResult ===
      "draw"
        ? "Draw"
        : myResult ===
            "win"
          ? "You won!"
          : "You lost.";
  } else if (
    myTurn
  ) {
    status =
      chess?.inCheck()
        ? "Your move — you're in check"
        : "Your move";
  } else {
    status =
      `Waiting for ${
        opponentName ??
        "your opponent"
      }…`;
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <Shell>

      <div className="flex flex-col items-center gap-5">

        {/* =================================================
            GAME HEADER
        ================================================= */}

        <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-3 shadow-[var(--shadow-panel)]">

          <div>

            <p className="font-medium text-card-foreground">
              {status}
            </p>


            <p className="text-xs text-muted-foreground">

              You play{" "}

              {myColor ===
              "w"
                ? "White"
                : "Black"}


              {opponentName
                ? ` · vs ${opponentName}`
                : ""}


              {botName
                ? " · COMPUTER"
                : ""}

            </p>

          </div>

        </div>


        {/* =================================================
            WAITING MESSAGE
        ================================================= */}

        {game.status ===
          "waiting" && (

          <div className="rounded-lg border border-border bg-card px-4 py-3 text-center">

            <p className="text-sm font-medium text-card-foreground">
              Waiting for an opponent
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              If nobody joins within 30 seconds,
              a computer opponent will automatically
              start the game.
            </p>

          </div>

        )}


        {/* =================================================
            BOT MESSAGE
        ================================================= */}

        {botName &&
          game.status ===
            "active" && (

          <div className="rounded-lg border border-border bg-card px-4 py-2 text-center">

            <p className="text-xs text-muted-foreground">

              You are playing against{" "}

              <span className="font-semibold text-card-foreground">
                {botName}
              </span>

            </p>

          </div>

        )}


        {/* =================================================
            BOARD + SIDE PANEL
        ================================================= */}

        <div className="flex w-full flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-center">


          {/* BOARD */}

          <BoardView
            board={
              board
            }

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
              myColor ===
              "b"
            }

            theme={
              theme
            }

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


          {/* SIDE PANEL */}

          <aside className="flex w-full flex-col gap-3 sm:w-52">


            {/* MOVE LIST */}

            <MoveList
              history={
                history
              }

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


            {/* RESIGN / DRAW */}

            {game.status !==
              "finished" && (

              <>

                <button
                  onClick={async () => {
                    try {
                      await resign({
                        data: {
                          gameId,
                        },
                      });
                    } catch (
                      e
                    ) {
                      setError(
                        e instanceof Error
                          ? e.message.replace(
                              /^Error:\s*/,
                              "",
                            )
                          : "Could not resign.",
                      );
                    }
                  }}
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


            {/* INCOMING DRAW */}

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
                    } catch (
                      e
                    ) {
                      setError(
                        e instanceof Error
                          ? e.message.replace(
                              /^Error:\s*/,
                              "",
                            )
                          : "Could not accept the draw.",
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


            {/* BOARD THEMES */}

            <div className="rounded-xl border border-border bg-card p-3">

              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Board
              </p>


              <div className="flex flex-wrap gap-1.5">

                {BOARD_THEMES.map(
                  (boardTheme) => (

                    <button
                      key={
                        boardTheme.id
                      }

                      onClick={() =>
                        setTheme(
                          boardTheme.id,
                        )
                      }

                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        theme ===
                        boardTheme.id
                          ? "bg-primary text-primary-foreground"
                          : "border border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {
                        boardTheme.label
                      }
                    </button>

                  ),
                )}

              </div>

            </div>


            {/* RESULT BUTTON */}

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


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (

          <p className="text-center text-sm text-destructive">
            {error}
          </p>

        )}

      </div>


      {/* ===================================================
          GAME OVER
      =================================================== */}

      <GameOverDialog

        open={
          game.status ===
            "finished" &&
          showResult
        }


        headline={
          game.winner ===
          "draw"
            ? "Draw"
            : myResult ===
                "win"
              ? "You won!"
              : "You lost"
        }


        detail={
          game.winner ===
          "draw"
            ? "The game ended in a draw."
            : chess?.isCheckmate()
              ? "Checkmate ended the game."
              : "The game is over."
        }


        history={
          history
        }


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

              stats:
                (
                  [
                    "w",
                    "b",
                  ] as const
                ).map(
                  (
                    color,
                  ) => ({
                    color,

                    engineMatch:
                      review
                        .fairPlay[
                        color
                      ]
                        .engineMatch,

                    accuracy:
                      review
                        .fairPlay[
                        color
                      ]
                        .accuracy,

                    moves:
                      review
                        .fairPlay[
                        color
                      ]
                        .moves,

                    suspicion:
                      review
                        .fairPlay[
                        color
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


/* =========================================================
   PAGE SHELL
========================================================= */

function Shell({
  children,
}: {
  children:
    React.ReactNode;
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