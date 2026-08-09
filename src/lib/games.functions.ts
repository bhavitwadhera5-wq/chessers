import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { Chess } from "chess.js";
import { pickHumanBot } from "@/lib/humanBots";

type Color = "w" | "b";

function ratingAfter(
  current: number,
  opponent: number,
  result: number,
  k = 24,
) {
  const expected =
    1 / (1 + 10 ** ((opponent - current) / 400));

  return Math.max(
    100,
    Math.round(
      current + k * (result - expected),
    ),
  );
}

/**
 * Applies online rating changes once per finished game.
 *
 * Uses the Supabase service-role client so that
 * rating updates are not blocked by normal RLS rules.
 */
async function applyRatings(gameId: string) {
  const { supabaseAdmin } =
    await import(
      "@/integrations/supabase/client.server"
    );

  const { data: game } =
    await supabaseAdmin
      .from("games")
      .select(
        "id, white_id, black_id, result, status, elo_applied, bot_name, bot_elo",
      )
      .eq("id", gameId)
      .maybeSingle();

  if (
    !game ||
    game.status !== "finished" ||
    game.elo_applied
  ) {
    return;
  }

  /*
   * BOT GAME
   *
   * Only one real player exists in white_id / black_id.
   * bot_name identifies the computer opponent.
   */
  if (
    game.bot_name &&
    (!game.white_id || !game.black_id)
  ) {
    const humanId =
      game.white_id ?? game.black_id;

    if (!humanId) return;

    const humanIsWhite =
      !!game.white_id;

    const { data: profile } =
      await supabaseAdmin
        .from("profiles")
        .select("id, elo")
        .eq("id", humanId)
        .maybeSingle();

    if (!profile) return;

    const score =
      game.result === "draw"
        ? 0.5
        : game.result ===
            (humanIsWhite
              ? "white"
              : "black")
          ? 1
          : 0;

    const next = ratingAfter(
      profile.elo,
      game.bot_elo ?? profile.elo,
      score,
    );

    await supabaseAdmin
      .from("profiles")
      .update({
        elo: next,
      })
      .eq("id", humanId);

    await supabaseAdmin
      .from("games")
      .update({
        elo_applied: true,
      })
      .eq("id", gameId);

    return;
  }

  /*
   * NORMAL PLAYER VS PLAYER GAME
   */
  if (
    !game.white_id ||
    !game.black_id
  ) {
    return;
  }

  const { data: rows } =
    await supabaseAdmin
      .from("profiles")
      .select("id, elo")
      .in("id", [
        game.white_id,
        game.black_id,
      ]);

  const white =
    rows?.find(
      (r) => r.id === game.white_id,
    );

  const black =
    rows?.find(
      (r) => r.id === game.black_id,
    );

  if (!white || !black) {
    return;
  }

  const whiteScore =
    game.result === "white"
      ? 1
      : game.result === "black"
        ? 0
        : 0.5;

  const newWhite =
    ratingAfter(
      white.elo,
      black.elo,
      whiteScore,
    );

  const newBlack =
    ratingAfter(
      black.elo,
      white.elo,
      1 - whiteScore,
    );

  await supabaseAdmin
    .from("profiles")
    .update({
      elo: newWhite,
    })
    .eq("id", white.id);

  await supabaseAdmin
    .from("profiles")
    .update({
      elo: newBlack,
    })
    .eq("id", black.id);

  await supabaseAdmin
    .from("games")
    .update({
      elo_applied: true,
    })
    .eq("id", gameId);
}


/**
 * Finds an existing waiting game or creates a new one.
 */
export const findOrCreateGame =
  createServerFn({
    method: "POST",
  })
    .middleware([
      requireSupabaseAuth,
    ])
    .inputValidator(
      (data: {
        opponentUsername?:
          | string
          | null;

        color?:
          | "w"
          | "b"
          | "random";

        minutes?: number;
      }) => data,
    )
    .handler(
      async ({ data, context }) => {
        const {
          supabase,
          userId,
        } = context;

        const wanted =
          (
            data.opponentUsername ??
            ""
          )
            .trim()
            .toLowerCase() || null;

        const minutes =
          [0, 5, 10].includes(
            Number(data.minutes),
          )
            ? Number(data.minutes)
            : 0;

        const pref =
          data.color ?? "w";

        const myColor: Color =
          pref === "random"
            ? Math.random() < 0.5
              ? "w"
              : "b"
            : pref;

        /*
         * Get current profile.
         */
        const { data: me } =
          await supabase
            .from("profiles")
            .select(
              "username, banned, ban_reason",
            )
            .eq("id", userId)
            .maybeSingle();

        if (me?.banned) {
          throw new Error(
            me.ban_reason
              ? `Your account is banned: ${me.ban_reason}`
              : "Your account is banned from online play.",
          );
        }

        const myUsername =
          me?.username ?? null;

        /*
         * Find invited opponent.
         */
        let matchedName:
          | string
          | null = null;

        if (wanted) {
          const { data: target } =
            await supabase
              .from("profiles")
              .select(
                "id, username",
              )
              .eq(
                "username",
                wanted,
              )
              .maybeSingle();

          if (
            target &&
            target.id !== userId
          ) {
            matchedName =
              target.username;
          }
        }

        /*
         * 1. Try to join an existing
         * waiting game.
         */
        const seat =
          myColor === "w"
            ? "white_id"
            : "black_id";

        const otherSeat =
          myColor === "w"
            ? "black_id"
            : "white_id";

        const {
          data: waiting,
        } = await supabase
          .from("games")
          .select(
            "id, white_id, black_id, invited_username, time_control",
          )
          .eq(
            "status",
            "waiting",
          )
          .eq(
            "time_control",
            minutes,
          )
          .is(seat, null)
          .not(
            otherSeat,
            "is",
            null,
          )
          .order(
            "created_at",
            {
              ascending: true,
            },
          )
          .limit(20);

        const candidates =
          (waiting ?? []).filter(
            (g) =>
              g[
                otherSeat as
                  | "white_id"
                  | "black_id"
              ] !== userId &&
              (!g.invited_username ||
                (myUsername &&
                  g.invited_username ===
                    myUsername)),
          );

        const preferred =
          candidates.find(
            (g) =>
              myUsername &&
              g.invited_username ===
                myUsername,
          ) ??
          candidates[0];

        if (preferred) {
          const clockMs =
            minutes
              ? minutes * 60000
              : null;

          const {
            data: joined,
            error,
          } = await supabase
            .from("games")
            .update({
              white_id:
                myColor === "w"
                  ? userId
                  : preferred.white_id,

              black_id:
                myColor === "b"
                  ? userId
                  : preferred.black_id,

              status: "active",

              white_ms: clockMs,

              black_ms: clockMs,

              turn_started_at:
                new Date().toISOString(),
            })
            .eq(
              "id",
              preferred.id,
            )
            .eq(
              "status",
              "waiting",
            )
            .is(
              seat,
              null,
            )
            .select("id")
            .maybeSingle();

          if (
            !error &&
            joined
          ) {
            return {
              gameId:
                joined.id,

              mode:
                "joined" as const,

              opponent: null,

              color:
                myColor,

              unknownUsername:
                wanted !== null &&
                matchedName ===
                  null,
            };
          }
        }

        /*
         * 2. No game found.
         *
         * Create a new waiting game.
         */
        const {
          data: created,
          error: createError,
        } = await supabase
          .from("games")
          .insert({
            white_id:
              myColor === "w"
                ? userId
                : null,

            black_id:
              myColor === "b"
                ? userId
                : null,

            invited_username:
              matchedName,

            time_control:
              minutes,
          })
          .select("id")
          .single();

        if (
          createError ||
          !created
        ) {
          throw new Error(
            "Could not create a game.",
          );
        }

        return {
          gameId:
            created.id,

          mode: matchedName
            ? ("invited" as const)
            : ("open" as const),

          opponent:
            matchedName,

          color:
            myColor,

          unknownUsername:
            wanted !== null &&
            matchedName === null,
        };
      },
    );


/**
 * Makes a move in a normal player-vs-player game.
 */
export const makeMove =
  createServerFn({
    method: "POST",
  })
    .middleware([
      requireSupabaseAuth,
    ])
    .inputValidator(
      (data: {
        gameId: string;
        from: string;
        to: string;
      }) => data,
    )
    .handler(
      async ({ data, context }) => {
        const {
          supabase,
          userId,
        } = context;

        const {
          data: game,
        } = await supabase
          .from("games")
          .select(
            "id, white_id, black_id, fen, status, time_control, white_ms, black_ms, turn_started_at",
          )
          .eq(
            "id",
            data.gameId,
          )
          .maybeSingle();

        if (!game) {
          throw new Error(
            "Game not found.",
          );
        }

        if (
          game.status !==
          "active"
        ) {
          throw new Error(
            "This game is not in play.",
          );
        }

        const myColor:
          | Color
          | null =
          game.white_id ===
          userId
            ? "w"
            : game.black_id ===
                userId
              ? "b"
              : null;

        if (!myColor) {
          throw new Error(
            "You are not a player in this game.",
          );
        }

        const chess =
          new Chess(game.fen);

        if (
          chess.turn() !==
          myColor
        ) {
          throw new Error(
            "It is not your turn.",
          );
        }

        /*
         * Charge clock.
         */
        let whiteMs =
          game.white_ms;

        let blackMs =
          game.black_ms;

        if (
          game.time_control >
            0 &&
          game.turn_started_at
        ) {
          const elapsed =
            Date.now() -
            new Date(
              game.turn_started_at,
            ).getTime();

          const remaining =
            (myColor === "w"
              ? whiteMs
              : blackMs) ??
            game.time_control *
              60000;

          const left =
            remaining -
            elapsed;

          if (left <= 0) {
            await supabase
              .from("games")
              .update({
                status:
                  "finished",

                result:
                  myColor === "w"
                    ? "black"
                    : "white",

                white_ms:
                  myColor === "w"
                    ? 0
                    : whiteMs,

                black_ms:
                  myColor === "b"
                    ? 0
                    : blackMs,
              })
              .eq(
                "id",
                game.id,
              );

            await applyRatings(
              game.id,
            );

            throw new Error(
              "Your time ran out.",
            );
          }

          if (
            myColor === "w"
          ) {
            whiteMs = left;
          } else {
            blackMs = left;
          }
        }

        /*
         * Validate chess move.
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

        let result:
          | string
          | null = null;

        if (over) {
          if (
            chess.isCheckmate()
          ) {
            result =
              chess.turn() ===
              "w"
                ? "black"
                : "white";
          } else {
            result = "draw";
          }
        }

        const { error } =
          await supabase
            .from("games")
            .update({
              fen: chess.fen(),

              last_move: `${data.from}${data.to}`,

              status: over
                ? "finished"
                : "active",

              result,

              white_ms:
                whiteMs,

              black_ms:
                blackMs,

              turn_started_at:
                new Date().toISOString(),
            })
            .eq(
              "id",
              game.id,
            );

        if (error) {
          throw new Error(
            "Could not save your move.",
          );
        }

        if (over) {
          await applyRatings(
            game.id,
          );
        }

        return {
          fen: chess.fen(),

          status: over
            ? "finished"
            : "active",

          result,

          white_ms:
            whiteMs,

          black_ms:
            blackMs,
        };
      },
    );


/**
 * Ends a game when the side to move
 * runs out of time.
 */
export const claimTimeout =
  createServerFn({
    method: "POST",
  })
    .middleware([
      requireSupabaseAuth,
    ])
    .inputValidator(
      (data: {
        gameId: string;
      }) => data,
    )
    .handler(
      async ({ data, context }) => {
        const {
          supabase,
          userId,
        } = context;

        const {
          data: game,
        } = await supabase
          .from("games")
          .select(
            "id, white_id, black_id, fen, status, time_control, white_ms, black_ms, turn_started_at",
          )
          .eq(
            "id",
            data.gameId,
          )
          .maybeSingle();

        if (!game) {
          throw new Error(
            "Game not found.",
          );
        }

        if (
          game.status !==
            "active" ||
          !game.time_control
        ) {
          return {
            ok: false,
          };
        }

        if (
          game.white_id !==
            userId &&
          game.black_id !==
            userId
        ) {
          throw new Error(
            "You are not a player in this game.",
          );
        }

        const turn =
          new Chess(
            game.fen,
          ).turn() as Color;

        const remaining =
          (turn === "w"
            ? game.white_ms
            : game.black_ms) ??
          game.time_control *
            60000;

        const elapsed =
          game.turn_started_at
            ? Date.now() -
              new Date(
                game.turn_started_at,
              ).getTime()
            : 0;

        if (
          remaining -
            elapsed >
          0
        ) {
          return {
            ok: false,
          };
        }

        await supabase
          .from("games")
          .update({
            status:
              "finished",

            result:
              turn === "w"
                ? "black"
                : "white",

            white_ms:
              turn === "w"
                ? 0
                : game.white_ms,

            black_ms:
              turn === "b"
                ? 0
                : game.black_ms,
          })
          .eq(
            "id",
            game.id,
          );

        await applyRatings(
          game.id,
        );

        return {
          ok: true,
        };
      },
    );


/**
 * Resigns a game.
 */
export const resignGame =
  createServerFn({
    method: "POST",
  })
    .middleware([
      requireSupabaseAuth,
    ])
    .inputValidator(
      (data: {
        gameId: string;
      }) => data,
    )
    .handler(
      async ({ data, context }) => {
        const {
          supabase,
          userId,
        } = context;

        const {
          data: game,
        } = await supabase
          .from("games")
          .select(
            "id, white_id, black_id, status",
          )
          .eq(
            "id",
            data.gameId,
          )
          .maybeSingle();

        if (!game) {
          throw new Error(
            "Game not found.",
          );
        }

        const myColor:
          | Color
          | null =
          game.white_id ===
          userId
            ? "w"
            : game.black_id ===
                userId
              ? "b"
              : null;

        if (!myColor) {
          throw new Error(
            "You are not a player in this game.",
          );
        }

        await supabase
          .from("games")
          .update({
            status:
              "finished",

            result:
              myColor === "w"
                ? "black"
                : "white",
          })
          .eq(
            "id",
            game.id,
          );

        await applyRatings(
          game.id,
        );

        return {
          ok: true,
        };
      },
    );


/**
 * Accepts a draw.
 */
export const agreeDraw =
  createServerFn({
    method: "POST",
  })
    .middleware([
      requireSupabaseAuth,
    ])
    .inputValidator(
      (data: {
        gameId: string;
      }) => data,
    )
    .handler(
      async ({ data, context }) => {
        const {
          supabase,
          userId,
        } = context;

        const {
          data: game,
        } = await supabase
          .from("games")
          .select(
            "id, white_id, black_id, status",
          )
          .eq(
            "id",
            data.gameId,
          )
          .maybeSingle();

        if (!game) {
          throw new Error(
            "Game not found.",
          );
        }

        if (
          game.white_id !==
            userId &&
          game.black_id !==
            userId
        ) {
          throw new Error(
            "You are not a player in this game.",
          );
        }

        if (
          game.status !==
          "active"
        ) {
          throw new Error(
            "This game is not in play.",
          );
        }

        await supabase
          .from("games")
          .update({
            status:
              "finished",

            result: "draw",
          })
          .eq(
            "id",
            game.id,
          );

        await applyRatings(
          game.id,
        );

        return {
          ok: true,
        };
      },
    );


/**
 * Seats a human-like computer opponent
 * when nobody joins the waiting game.
 *
 * IMPORTANT:
 * This uses supabaseAdmin for the game lookup
 * and update. The normal client can be blocked
 * by RLS after the 30-second waiting period.
 */
export const fillWithBot =
  createServerFn({
    method: "POST",
  })
    .middleware([
      requireSupabaseAuth,
    ])
    .inputValidator(
      (data: {
        gameId: string;
      }) => data,
    )
    .handler(
      async ({ data, context }) => {
        const {
          userId,
        } = context;

        /*
         * IMPORTANT FIX:
         *
         * Use the server/service client
         * instead of the normal client.
         */
        const {
          supabaseAdmin,
        } = await import(
          "@/integrations/supabase/client.server"
        );

        /*
         * Find the waiting game.
         */
        const {
          data: game,
          error: gameError,
        } =
          await supabaseAdmin
            .from("games")
            .select(
              "id, white_id, black_id, status, time_control, bot_name",
            )
            .eq(
              "id",
              data.gameId,
            )
            .maybeSingle();

        /*
         * Give a useful error if Supabase
         * itself fails.
         */
        if (gameError) {
          console.error(
            "fillWithBot game lookup failed:",
            gameError,
          );

          throw new Error(
            `Could not find the game: ${gameError.message}`,
          );
        }

        /*
         * Game genuinely doesn't exist.
         */
        if (!game) {
          throw new Error(
            "Game not found. The game may have expired or the game ID is invalid.",
          );
        }

        /*
         * Make sure the person requesting
         * the bot is actually in the game.
         */
        if (
          game.white_id !==
            userId &&
          game.black_id !==
            userId
        ) {
          throw new Error(
            "You are not a player in this game.",
          );
        }

        /*
         * Somebody already joined.
         */
        if (
          game.status !==
          "waiting"
        ) {
          return {
            filled: false,

            botName:
              game.bot_name,

            botElo: null,
          };
        }

        /*
         * Both seats are occupied.
         */
        if (
          game.white_id &&
          game.black_id
        ) {
          return {
            filled: false,

            botName: null,

            botElo: null,
          };
        }

        /*
         * Get the human player's rating
         * so we can choose a nearby bot.
         */
        const {
          data: profile,
        } =
          await supabaseAdmin
            .from("profiles")
            .select("elo")
            .eq(
              "id",
              userId,
            )
            .maybeSingle();

        const bot =
          pickHumanBot(
            profile?.elo ??
              1000,
          );

        const clockMs =
          game.time_control
            ? game.time_control *
              60000
            : null;

        /*
         * Start the game with the bot.
         *
         * We intentionally leave the bot's
         * white_id / black_id seat NULL.
         * bot_name identifies the computer.
         */
        const {
          data: updated,
          error: updateError,
        } =
          await supabaseAdmin
            .from("games")
            .update({
              status: "active",

              bot_name:
                bot.name,

              bot_elo:
                bot.elo,

              invited_username:
                null,

              white_ms:
                clockMs,

              black_ms:
                clockMs,

              turn_started_at:
                new Date().toISOString(),
            })
            .eq(
              "id",
              game.id,
            )
            .eq(
              "status",
              "waiting",
            )
            .select(
              "id, status, bot_name, bot_elo, white_ms, black_ms, turn_started_at",
            )
            .maybeSingle();

        if (updateError) {
          console.error(
            "fillWithBot update failed:",
            updateError,
          );

          throw new Error(
            `Could not start the bot: ${updateError.message}`,
          );
        }

        /*
         * If another player joined at
         * exactly the same moment,
         * don't overwrite their game.
         */
        if (!updated) {
          const {
            data: latest,
          } =
            await supabaseAdmin
              .from("games")
              .select(
                "id, status, bot_name, bot_elo",
              )
              .eq(
                "id",
                game.id,
              )
              .maybeSingle();

          if (
            latest &&
            latest.status ===
              "active"
          ) {
            return {
              filled: false,

              botName:
                latest.bot_name,

              botElo:
                latest.bot_elo,
            };
          }

          throw new Error(
            "The game changed before the bot could join. Please try again.",
          );
        }

        return {
          filled: true,

          botName:
            bot.name,

          botElo:
            bot.elo,

          status:
            "active",

          white_ms:
            clockMs,

          black_ms:
            clockMs,

          turn_started_at:
            updated.turn_started_at,
        };
      },
    );


/**
 * Applies the computer opponent's move.
 *
 * The human player's browser asks the server
 * to make the bot's move.
 */
export const botPlayMove =
  createServerFn({
    method: "POST",
  })
    .middleware([
      requireSupabaseAuth,
    ])
    .inputValidator(
      (data: {
        gameId: string;
        from: string;
        to: string;
      }) => data,
    )
    .handler(
      async ({ data, context }) => {
        const {
          supabase,
          userId,
        } = context;

        const {
          data: game,
        } = await supabase
          .from("games")
          .select(
            "id, white_id, black_id, fen, status, time_control, white_ms, black_ms, turn_started_at, bot_name",
          )
          .eq(
            "id",
            data.gameId,
          )
          .maybeSingle();

        if (!game) {
          throw new Error(
            "Game not found.",
          );
        }

        if (!game.bot_name) {
          throw new Error(
            "This game has no computer opponent.",
          );
        }

        if (
          game.status !==
          "active"
        ) {
          throw new Error(
            "This game is not in play.",
          );
        }

        /*
         * Find the human player's colour.
         */
        const myColor:
          | Color
          | null =
          game.white_id ===
          userId
            ? "w"
            : game.black_id ===
                userId
              ? "b"
              : null;

        if (!myColor) {
          throw new Error(
            "You are not a player in this game.",
          );
        }

        const botColor: Color =
          myColor === "w"
            ? "b"
            : "w";

        /*
         * The bot's seat must be empty.
         */
        if (
          (
            botColor === "w"
              ? game.white_id
              : game.black_id
          ) !== null
        ) {
          throw new Error(
            "That seat is taken by a player.",
          );
        }

        const chess =
          new Chess(game.fen);

        if (
          chess.turn() !==
          botColor
        ) {
          throw new Error(
            "It is not the opponent's turn.",
          );
        }

        /*
         * Handle bot clock.
         */
        let whiteMs =
          game.white_ms;

        let blackMs =
          game.black_ms;

        if (
          game.time_control >
            0 &&
          game.turn_started_at
        ) {
          const elapsed =
            Date.now() -
            new Date(
              game.turn_started_at,
            ).getTime();

          const remaining =
            (
              botColor === "w"
                ? whiteMs
                : blackMs
            ) ??
            game.time_control *
              60000;

          const left =
            remaining -
            elapsed;

          if (left <= 0) {
            await supabase
              .from("games")
              .update({
                status:
                  "finished",

                result:
                  botColor === "w"
                    ? "black"
                    : "white",

                white_ms:
                  botColor === "w"
                    ? 0
                    : whiteMs,

                black_ms:
                  botColor === "b"
                    ? 0
                    : blackMs,
              })
              .eq(
                "id",
                game.id,
              );

            await applyRatings(
              game.id,
            );

            return {
              fen: game.fen,

              status:
                "finished",

              result:
                botColor === "w"
                  ? "black"
                  : "white",
            };
          }

          if (
            botColor === "w"
          ) {
            whiteMs =
              left;
          } else {
            blackMs =
              left;
          }
        }

        /*
         * Validate and make bot move.
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

        let result:
          | string
          | null = null;

        if (over) {
          result =
            chess.isCheckmate()
              ? chess.turn() ===
                "w"
                ? "black"
                : "white"
              : "draw";
        }

        const { error } =
          await supabase
            .from("games")
            .update({
              fen: chess.fen(),

              last_move:
                `${data.from}${data.to}`,

              status: over
                ? "finished"
                : "active",

              result,

              white_ms:
                whiteMs,

              black_ms:
                blackMs,

              turn_started_at:
                new Date().toISOString(),
            })
            .eq(
              "id",
              game.id,
            );

        if (error) {
          throw new Error(
            "Could not save the move.",
          );
        }

        if (over) {
          await applyRatings(
            game.id,
          );
        }

        return {
          fen: chess.fen(),

          status: over
            ? "finished"
            : "active",

          result,
        };
      },
    );