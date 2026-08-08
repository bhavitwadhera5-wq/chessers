import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { Chess } from "chess.js";
import {
  humanBotByName,
  humanBotMove,
  pickHumanBot,
} from "@/lib/humanBots";

type Color = "w" | "b";

const START_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/**
 * Return the colour belonging to a real logged-in player.
 */
function getPlayerColor(
  game: {
    white_id: string | null;
    black_id: string | null;
  },
  userId: string,
): Color | null {
  if (game.white_id === userId) return "w";
  if (game.black_id === userId) return "b";
  return null;
}

/**
 * Get the username stored on the bot seat.
 *
 * Bot seats have a NULL player ID and the bot name
 * is stored in the corresponding username column.
 */
function getBotName(
  game: {
    white_id: string | null;
    black_id: string | null;
    white_username: string | null;
    black_username: string | null;
  },
): string | null {
  if (
    game.white_id === null &&
    game.white_username
  ) {
    return game.white_username;
  }

  if (
    game.black_id === null &&
    game.black_username
  ) {
    return game.black_username;
  }

  return null;
}

/**
 * Get the bot's colour.
 */
function getBotColor(
  game: {
    white_id: string | null;
    black_id: string | null;
    white_username: string | null;
    black_username: string | null;
  },
): Color | null {
  if (
    game.white_id === null &&
    game.white_username
  ) {
    return "w";
  }

  if (
    game.black_id === null &&
    game.black_username
  ) {
    return "b";
  }

  return null;
}

/**
 * Find an opponent or create a new waiting game.
 *
 * This version only uses columns that exist in your
 * current games table.
 */
export const findOrCreateGame =
  createServerFn({ method: "POST" })
    .middleware([requireSupabaseAuth])
    .validator(
      (data: {
        opponentUsername?: string | null;
        color?: "w" | "b" | "random";
        minutes?: number;
      }) => data,
    )
    .handler(async ({ data, context }) => {
      const { supabase, userId } = context;

      const wanted =
        (data.opponentUsername ?? "")
          .trim()
          .toLowerCase() || null;

      const requestedColor =
        data.color ?? "random";

      const myColor: Color =
        requestedColor === "random"
          ? Math.random() < 0.5
            ? "w"
            : "b"
          : requestedColor;

      /*
       * Get our username.
       *
       * We deliberately don't query "banned" because
       * that column does not exist in your current
       * profiles table.
       */
      const { data: me } =
        await supabase
          .from("profiles")
          .select("username")
          .eq("id", userId)
          .maybeSingle();

      const myUsername =
        me?.username ?? "Player";

      /*
       * If a username was entered, check whether
       * that player exists.
       */
      let invitedUsername: string | null = null;

      if (wanted) {
        const { data: target } =
          await supabase
            .from("profiles")
            .select("id, username")
            .eq("username", wanted)
            .maybeSingle();

        if (
          target &&
          target.id !== userId
        ) {
          invitedUsername =
            target.username;
        }
      }

      /*
       * Look for an existing waiting game.
       *
       * We don't require time_control because that
       * column does not exist in your database.
       */
      const freeColumn =
        myColor === "w"
          ? "white_id"
          : "black_id";

      const opponentColumn =
        myColor === "w"
          ? "black_id"
          : "white_id";

      const {
        data: waitingGames,
        error: waitingError,
      } = await supabase
        .from("games")
        .select(
          "id, white_id, black_id, white_username, black_username, status, fen, turn, winner, created_at",
        )
        .eq("status", "waiting")
        .is(freeColumn, null)
        .not(opponentColumn, "is", null)
        .order("created_at", {
          ascending: true,
        })
        .limit(20);

      if (waitingError) {
        throw new Error(
          `Could not find waiting games: ${waitingError.message}`,
        );
      }

      /*
       * Prefer a game where the other player is
       * the requested opponent.
       */
      let chosenGame =
        waitingGames?.find((game) => {
          const opponentName =
            myColor === "w"
              ? game.black_username
              : game.white_username;

          return (
            invitedUsername !== null &&
            opponentName === invitedUsername
          );
        }) ?? null;

      /*
       * Otherwise use the oldest waiting game.
       */
      if (!chosenGame) {
        chosenGame =
          waitingGames?.[0] ?? null;
      }

      /*
       * Join an existing game.
       */
      if (chosenGame) {
        const updateData =
          myColor === "w"
            ? {
                white_id: userId,
                white_username:
                  myUsername,
                status: "active",
                fen:
                  chosenGame.fen &&
                  chosenGame.fen !== "start"
                    ? chosenGame.fen
                    : START_FEN,
              }
            : {
                black_id: userId,
                black_username:
                  myUsername,
                status: "active",
                fen:
                  chosenGame.fen &&
                  chosenGame.fen !== "start"
                    ? chosenGame.fen
                    : START_FEN,
              };

        const {
          data: joined,
          error: joinError,
        } = await supabase
          .from("games")
          .update(updateData)
          .eq("id", chosenGame.id)
          .eq("status", "waiting")
          .is(freeColumn, null)
          .select("id")
          .maybeSingle();

        if (joinError) {
          throw new Error(
            `Could not join the game: ${joinError.message}`,
          );
        }

        if (joined) {
          return {
            gameId: joined.id,
            mode: "joined" as const,
            opponent:
              myColor === "w"
                ? chosenGame.black_username
                : chosenGame.white_username,
            color: myColor,
            unknownUsername:
              wanted !== null &&
              invitedUsername === null,
          };
        }
      }

      /*
       * No suitable waiting game exists.
       *
       * Create a fresh one.
       *
       * The empty seat has NULL ID and NULL username.
       */
      const insertData =
        myColor === "w"
          ? {
              white_id: userId,
              black_id: null,
              white_username:
                myUsername,
              black_username: null,
              status: "waiting",
              fen: START_FEN,
              turn: "w",
              winner: null,
            }
          : {
              white_id: null,
              black_id: userId,
              white_username: null,
              black_username:
                myUsername,
              status: "waiting",
              fen: START_FEN,
              turn: "w",
              winner: null,
            };

      const {
        data: created,
        error: createError,
      } = await supabase
        .from("games")
        .insert(insertData)
        .select("id")
        .single();

      if (createError || !created) {
        throw new Error(
          createError?.message ??
            "Could not create a game.",
        );
      }

      return {
        gameId: created.id,
        mode: invitedUsername
          ? ("invited" as const)
          : ("open" as const),
        opponent:
          invitedUsername,
        color: myColor,
        unknownUsername:
          wanted !== null &&
          invitedUsername === null,
      };
    });

/**
 * Make a real player's chess move.
 */
export const makeMove =
  createServerFn({ method: "POST" })
    .middleware([requireSupabaseAuth])
    .validator(
      (data: {
        gameId: string;
        from: string;
        to: string;
      }) => data,
    )
    .handler(async ({ data, context }) => {
      const {
        supabase,
        userId,
      } = context;

      const {
        data: game,
        error: gameError,
      } = await supabase
        .from("games")
        .select(
          "id, white_id, black_id, white_username, black_username, status, fen, turn, winner",
        )
        .eq("id", data.gameId)
        .maybeSingle();

      if (gameError) {
        throw new Error(
          `Could not load game: ${gameError.message}`,
        );
      }

      if (!game) {
        throw new Error(
          "Game not found.",
        );
      }

      if (
        game.status !== "active"
      ) {
        throw new Error(
          "This game is not in play.",
        );
      }

      const myColor =
        getPlayerColor(
          game,
          userId,
        );

      /*
       * THIS IS THE IMPORTANT PLAYER CHECK.
       *
       * The game stores the actual Supabase Auth ID
       * in white_id / black_id.
       */
      if (!myColor) {
        throw new Error(
          "You are not a player in this game.",
        );
      }

      const fen =
        game.fen === "start" ||
        !game.fen
          ? START_FEN
          : game.fen;

      const chess =
        new Chess(fen);

      if (
        chess.turn() !== myColor
      ) {
        throw new Error(
          "It is not your turn.",
        );
      }

      /*
       * Make sure the requested move is legal.
       */
      try {
        chess.move({
          from: data.from,
          to: data.to,
          promotion: "q",
        });
      } catch {
        throw new Error(
          "Illegal move.",
        );
      }

      const over =
        chess.isGameOver();

      let winner:
        | "white"
        | "black"
        | "draw"
        | null = null;

      if (over) {
        if (
          chess.isCheckmate()
        ) {
          winner =
            chess.turn() === "w"
              ? "black"
              : "white";
        } else {
          winner = "draw";
        }
      }

      const nextStatus = over
        ? "finished"
        : "active";

      const nextTurn =
        chess.turn();

      const {
        error: saveError,
      } = await supabase
        .from("games")
        .update({
          fen: chess.fen(),
          turn: nextTurn,
          status: nextStatus,
          winner,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", game.id);

      if (saveError) {
        throw new Error(
          `Could not save your move: ${saveError.message}`,
        );
      }

      return {
        fen: chess.fen(),
        status: nextStatus,
        turn: nextTurn,
        winner,
      };
    });

/**
 * Claim a timeout.
 *
 * Your current database does not have clock columns,
 * so timeout handling is intentionally disabled here.
 */
export const claimTimeout =
  createServerFn({ method: "POST" })
    .middleware([requireSupabaseAuth])
    .validator(
      (data: {
        gameId: string;
      }) => data,
    )
    .handler(async () => {
      return {
        ok: false,
        reason:
          "Clock support is not enabled in the current games table.",
      };
    });

/**
 * Resign a game.
 */
export const resignGame =
  createServerFn({ method: "POST" })
    .middleware([requireSupabaseAuth])
    .validator(
      (data: {
        gameId: string;
      }) => data,
    )
    .handler(async ({ data, context }) => {
      const {
        supabase,
        userId,
      } = context;

      const {
        data: game,
        error,
      } = await supabase
        .from("games")
        .select(
          "id, white_id, black_id, status",
        )
        .eq("id", data.gameId)
        .maybeSingle();

      if (error) {
        throw new Error(
          error.message,
        );
      }

      if (!game) {
        throw new Error(
          "Game not found.",
        );
      }

      const myColor =
        getPlayerColor(
          game,
          userId,
        );

      if (!myColor) {
        throw new Error(
          "You are not a player in this game.",
        );
      }

      if (
        game.status !== "active"
      ) {
        throw new Error(
          "This game is not in play.",
        );
      }

      const winner =
        myColor === "w"
          ? "black"
          : "white";

      const {
        error: updateError,
      } = await supabase
        .from("games")
        .update({
          status: "finished",
          winner,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", game.id);

      if (updateError) {
        throw new Error(
          updateError.message,
        );
      }

      return {
        ok: true,
        winner,
      };
    });

/**
 * Agree to a draw.
 */
export const agreeDraw =
  createServerFn({ method: "POST" })
    .middleware([requireSupabaseAuth])
    .validator(
      (data: {
        gameId: string;
      }) => data,
    )
    .handler(async ({ data, context }) => {
      const {
        supabase,
        userId,
      } = context;

      const {
        data: game,
        error,
      } = await supabase
        .from("games")
        .select(
          "id, white_id, black_id, status",
        )
        .eq("id", data.gameId)
        .maybeSingle();

      if (error) {
        throw new Error(
          error.message,
        );
      }

      if (!game) {
        throw new Error(
          "Game not found.",
        );
      }

      if (
        game.white_id !== userId &&
        game.black_id !== userId
      ) {
        throw new Error(
          "You are not a player in this game.",
        );
      }

      if (
        game.status !== "active"
      ) {
        throw new Error(
          "This game is not in play.",
        );
      }

      const {
        error: updateError,
      } = await supabase
        .from("games")
        .update({
          status: "finished",
          winner: "draw",
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", game.id);

      if (updateError) {
        throw new Error(
          updateError.message,
        );
      }

      return {
        ok: true,
        winner: "draw",
      };
    });

/**
 * Automatically put one of the 50 bots into
 * a waiting game.
 *
 * The bot is NOT stored as a fake Supabase user.
 * Instead:
 *
 *   bot seat ID       = NULL
 *   bot seat username = bot's name
 *
 * This matches your current database structure.
 */
export const fillWithBot =
  createServerFn({ method: "POST" })
    .middleware([requireSupabaseAuth])
    .validator(
      (data: {
        gameId: string;
      }) => data,
    )
    .handler(async ({ data, context }) => {
      const {
        supabase,
        userId,
      } = context;

      const {
        data: game,
        error,
      } = await supabase
        .from("games")
        .select(
          "id, white_id, black_id, white_username, black_username, status, fen, turn, winner",
        )
        .eq("id", data.gameId)
        .maybeSingle();

      if (error) {
        throw new Error(
          error.message,
        );
      }

      if (!game) {
        throw new Error(
          "Game not found.",
        );
      }

      /*
       * The real player must own one of the two
       * human seats.
       */
      if (
        game.white_id !== userId &&
        game.black_id !== userId
      ) {
        throw new Error(
          "You are not a player in this game.",
        );
      }

      /*
       * Someone already joined.
       */
      if (
        game.status !== "waiting"
      ) {
        return {
          filled: false,
          botName:
            getBotName(game),
        };
      }

      /*
       * Never overwrite a real second player.
       */
      if (
        game.white_id &&
        game.black_id
      ) {
        return {
          filled: false,
          botName: null,
        };
      }

      /*
       * Get the player's rating.
       */
      const { data: profile } =
        await supabase
          .from("profiles")
          .select("elo")
          .eq("id", userId)
          .maybeSingle();

      const bot =
        pickHumanBot(
          profile?.elo ?? 1200,
        );

      /*
       * If the creator is White,
       * the bot becomes Black.
       *
       * If the creator is Black,
       * the bot becomes White.
       */
      const updateData =
        game.white_id === userId
          ? {
              black_id: null,
              black_username:
                bot.name,
              status: "active",
              fen:
                game.fen === "start" ||
                !game.fen
                  ? START_FEN
                  : game.fen,
              turn:
                game.turn || "w",
              updated_at:
                new Date().toISOString(),
            }
          : {
              white_id: null,
              white_username:
                bot.name,
              status: "active",
              fen:
                game.fen === "start" ||
                !game.fen
                  ? START_FEN
                  : game.fen,
              turn:
                game.turn || "w",
              updated_at:
                new Date().toISOString(),
            };

      const {
        data: updated,
        error: updateError,
      } = await supabase
        .from("games")
        .update(updateData)
        .eq("id", game.id)
        .eq("status", "waiting")
        .select(
          "id, white_id, black_id, white_username, black_username, status, fen, turn",
        )
        .maybeSingle();

      if (updateError) {
        throw new Error(
          `Could not start the bot game: ${updateError.message}`,
        );
      }

      if (!updated) {
        return {
          filled: false,
          botName: null,
        };
      }

      return {
        filled: true,
        botName: bot.name,
        botElo: bot.elo,
      };
    });

/**
 * Make the bot's move.
 *
 * The client asks the server for the bot move by sending
 * the selected from/to squares.
 */
export const botPlayMove =
  createServerFn({ method: "POST" })
    .middleware([requireSupabaseAuth])
    .validator(
      (data: {
        gameId: string;
        from: string;
        to: string;
      }) => data,
    )
    .handler(async ({ data, context }) => {
      const {
        supabase,
        userId,
      } = context;

      const {
        data: game,
        error,
      } = await supabase
        .from("games")
        .select(
          "id, white_id, black_id, white_username, black_username, status, fen, turn, winner",
        )
        .eq("id", data.gameId)
        .maybeSingle();

      if (error) {
        throw new Error(
          error.message,
        );
      }

      if (!game) {
        throw new Error(
          "Game not found.",
        );
      }

      if (
        game.status !== "active"
      ) {
        throw new Error(
          "This game is not in play.",
        );
      }

      const myColor =
        getPlayerColor(
          game,
          userId,
        );

      if (!myColor) {
        throw new Error(
          "You are not a player in this game.",
        );
      }

      const botColor =
        myColor === "w"
          ? "b"
          : "w";

      const botName =
        getBotName(game);

      if (!botName) {
        throw new Error(
          "This game does not have a computer opponent.",
        );
      }

      const bot =
        humanBotByName(botName);

      if (!bot) {
        throw new Error(
          "The computer opponent could not be found.",
        );
      }

      /*
       * Make absolutely sure the bot is actually
       * sitting in the opposite seat.
       */
      const oppositeId =
        botColor === "w"
          ? game.white_id
          : game.black_id;

      if (oppositeId !== null) {
        throw new Error(
          "That seat is occupied by a player.",
        );
      }

      const fen =
        game.fen === "start" ||
        !game.fen
          ? START_FEN
          : game.fen;

      const chess =
        new Chess(fen);

      if (
        chess.turn() !== botColor
      ) {
        throw new Error(
          "It is not the opponent's turn.",
        );
      }

      /*
       * The client supplies a legal move generated
       * by the bot logic.
       *
       * Validate it again on the server.
       */
      try {
        chess.move({
          from: data.from,
          to: data.to,
          promotion: "q",
        });
      } catch {
        throw new Error(
          "Illegal bot move.",
        );
      }

      const over =
        chess.isGameOver();

      let winner:
        | "white"
        | "black"
        | "draw"
        | null = null;

      if (over) {
        if (
          chess.isCheckmate()
        ) {
          winner =
            chess.turn() === "w"
              ? "black"
              : "white";
        } else {
          winner = "draw";
        }
      }

      const nextStatus =
        over
          ? "finished"
          : "active";

      const {
        error: saveError,
      } = await supabase
        .from("games")
        .update({
          fen: chess.fen(),
          turn: chess.turn(),
          status: nextStatus,
          winner,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", game.id);

      if (saveError) {
        throw new Error(
          `Could not save the bot move: ${saveError.message}`,
        );
      }

      return {
        fen: chess.fen(),
        status: nextStatus,
        turn: chess.turn(),
        winner,
        botName,
        botElo: bot.elo,
      };
    });