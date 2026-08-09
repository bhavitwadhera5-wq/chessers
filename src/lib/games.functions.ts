// src/lib/games.functions.ts

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { Chess } from "chess.js";
import {
  humanBotByName,
  humanBotMove,
  pickHumanBot,
} from "@/lib/humanBots";

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
    Math.round(current + k * (result - expected)),
  );
}

/** Applies online rating changes once per finished game (service role). */
async function applyRatings(gameId: string) {
  const { supabaseAdmin } = await import(
    "@/integrations/supabase/client.server"
  );

  const { data: game } = await supabaseAdmin
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

  // Games against a stand-in computer opponent rate the single human seat.
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
            (humanIsWhite ? "white" : "black")
          ? 1
          : 0;

    const next = ratingAfter(
      profile.elo,
      game.bot_elo ?? profile.elo,
      score,
    );

    await supabaseAdmin
      .from("profiles")
      .update({ elo: next })
      .eq("id", humanId);

    await supabaseAdmin
      .from("games")
      .update({ elo_applied: true })
      .eq("id", gameId);

    return;
  }

  if (!game.white_id || !game.black_id) {
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

  const white = rows?.find(
    (r) => r.id === game.white_id,
  );

  const black = rows?.find(
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

  const newWhite = ratingAfter(
    white.elo,
    black.elo,
    whiteScore,
  );

  const newBlack = ratingAfter(
    black.elo,
    white.elo,
    1 - whiteScore,
  );

  await supabaseAdmin
    .from("profiles")
    .update({ elo: newWhite })
    .eq("id", white.id);

  await supabaseAdmin
    .from("profiles")
    .update({ elo: newBlack })
    .eq("id", black.id);

  await supabaseAdmin
    .from("games")
    .update({ elo_applied: true })
    .eq("id", gameId);
}

/* ============================================================
   FIND OR CREATE GAME
   ============================================================ */

export const findOrCreateGame =
  createServerFn({ method: "POST" })
    .middleware([requireSupabaseAuth])
    .inputValidator(
      (data: {
        opponentUsername?: string | null;
        color?: "w" | "b" | "random";
        minutes?: number;
      }) => data,
    )
    .handler(async ({ data, context }) => {
      const {
        supabase,
        userId,
      } = context;

      const wantedRaw =
        (data.opponentUsername ?? "").trim();

      const wanted =
        wantedRaw.toLowerCase() || null;

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

      /* ========================================================
         GET MY PROFILE
         ======================================================== */

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

      /* ========================================================
         FIND FRIEND

         Case-insensitive username matching.
         ======================================================== */

      let matchedName:
        | string
        | null = null;

      let matchedUserId:
        | string
        | null = null;

      if (wanted) {
        const {
          data: profiles,
        } = await supabase
          .from("profiles")
          .select("id, username")
          .limit(1000);

        const target =
          (profiles ?? []).find(
            (profile) =>
              profile.id !== userId &&
              typeof profile.username ===
                "string" &&
              profile.username
                .trim()
                .toLowerCase() ===
                wanted,
          );

        if (target) {
          matchedName =
            target.username;

          matchedUserId =
            target.id;
        }
      }

      /* ========================================================
         1. LOOK FOR A GAME THAT INVITES ME

         This is the main friend-multiplayer fix.

         We look for the friend's invitation BEFORE
         normal matchmaking.

         We don't require a particular colour.
         ======================================================== */

      let invitedGame:
        | {
            id: string;
            white_id: string | null;
            black_id: string | null;
            invited_username:
              | string
              | null;
            time_control: number;
          }
        | null = null;

      if (myUsername) {
        const {
          data: invitedGames,
        } = await supabase
          .from("games")
          .select(
            "id, white_id, black_id, invited_username, time_control",
          )
          .eq("status", "waiting")
          .eq(
            "time_control",
            minutes,
          )
          .not(
            "invited_username",
            "is",
            null,
          )
          .order(
            "created_at",
            {
              ascending: true,
            },
          )
          .limit(50);

        invitedGame =
          (invitedGames ?? []).find(
            (game) => {
              const invitedName =
                game.invited_username
                  ?.trim()
                  .toLowerCase();

              const usernameMatches =
                invitedName ===
                myUsername
                  .trim()
                  .toLowerCase();

              const notAlreadyPlaying =
                game.white_id !== userId &&
                game.black_id !== userId;

              const hasEmptySeat =
                !game.white_id ||
                !game.black_id;

              return (
                usernameMatches &&
                notAlreadyPlaying &&
                hasEmptySeat
              );
            },
          ) ?? null;
      }

      /* ========================================================
         JOIN FRIEND'S GAME

         If White is empty -> join White.
         Otherwise -> join Black.

         Friend invitation takes priority.
         ======================================================== */

      if (invitedGame) {
        const joinColor: Color =
          !invitedGame.white_id
            ? "w"
            : "b";

        const clockMs =
          minutes > 0
            ? minutes * 60000
            : null;

        const updateData =
          joinColor === "w"
            ? {
                white_id: userId,
                status: "active",
                white_ms: clockMs,
                black_ms: clockMs,
                turn_started_at:
                  new Date().toISOString(),
              }
            : {
                black_id: userId,
                status: "active",
                white_ms: clockMs,
                black_ms: clockMs,
                turn_started_at:
                  new Date().toISOString(),
              };

        const {
          data: joined,
          error: joinError,
        } = await supabase
          .from("games")
          .update(updateData)
          .eq(
            "id",
            invitedGame.id,
          )
          .eq(
            "status",
            "waiting",
          )
          .select("id")
          .maybeSingle();

        if (joinError) {
          throw new Error(
            `Could not join your friend's game: ${joinError.message}`,
          );
        }

        if (joined) {
          return {
            gameId: joined.id,
            mode: "joined" as const,
            opponent: null,
            color: joinColor,
            unknownUsername: false,
          };
        }
      }

      /* ========================================================
         2. NORMAL MULTIPLAYER MATCHMAKING

         Look for another waiting player.

         We check BOTH seats instead of requiring the
         exact colour selected.
         ======================================================== */

      const {
        data: waitingGames,
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
        .order(
          "created_at",
          {
            ascending: true,
          },
        )
        .limit(50);

      const candidates =
        (waitingGames ?? []).filter(
          (game) => {
            const whiteEmpty =
              !game.white_id;

            const blackEmpty =
              !game.black_id;

            const exactlyOnePlayer =
              (whiteEmpty &&
                !!game.black_id) ||
              (blackEmpty &&
                !!game.white_id);

            const notMe =
              game.white_id !==
                userId &&
              game.black_id !==
                userId;

            const invitationIsForMe =
              !game.invited_username ||
              (
                myUsername &&
                game.invited_username
                  .trim()
                  .toLowerCase() ===
                  myUsername
                    .trim()
                    .toLowerCase()
              );

            return (
              exactlyOnePlayer &&
              notMe &&
              invitationIsForMe
            );
          },
        );

      const preferred =
        candidates[0] ?? null;

      /* ========================================================
         JOIN NORMAL WAITING GAME
         ======================================================== */

      if (preferred) {
        const joinColor: Color =
          !preferred.white_id
            ? "w"
            : "b";

        const clockMs =
          minutes > 0
            ? minutes * 60000
            : null;

        const updateData =
          joinColor === "w"
            ? {
                white_id: userId,
                status: "active",
                white_ms: clockMs,
                black_ms: clockMs,
                turn_started_at:
                  new Date().toISOString(),
              }
            : {
                black_id: userId,
                status: "active",
                white_ms: clockMs,
                black_ms: clockMs,
                turn_started_at:
                  new Date().toISOString(),
              };

        const {
          data: joined,
          error: joinError,
        } = await supabase
          .from("games")
          .update(updateData)
          .eq(
            "id",
            preferred.id,
          )
          .eq(
            "status",
            "waiting",
          )
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
            opponent: null,
            color: joinColor,
            unknownUsername:
              wanted !== null &&
              matchedUserId === null,
          };
        }
      }

      /* ========================================================
         3. CREATE NEW GAME
         ======================================================== */

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
          createError?.message ??
            "Could not create a game.",
        );
      }

      return {
        gameId:
          created.id,

        mode:
          matchedName
            ? ("invited" as const)
            : ("open" as const),

        opponent:
          matchedName,

        color:
          myColor,

        unknownUsername:
          wanted !== null &&
          matchedUserId === null,
      };
    });

/* ============================================================
   MAKE MOVE
   ============================================================ */

export const makeMove =
  createServerFn({ method: "POST" })
    .middleware([requireSupabaseAuth])
    .inputValidator(
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

      const { data: game } =
        await supabase
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
        game.status !== "active"
      ) {
        throw new Error(
          "This game is not in play.",
        );
      }

      const myColor:
        | Color
        | null =
        game.white_id === userId
          ? "w"
          : game.black_id === userId
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

      // Charge the clock before accepting the move.
      let whiteMs =
        game.white_ms;

      let blackMs =
        game.black_ms;

      if (
        game.time_control > 0 &&
        game.turn_started_at
      ) {
        const elapsed =
          Date.now() -
          new Date(
            game.turn_started_at,
          ).getTime();

        const remaining =
          (
            myColor === "w"
              ? whiteMs
              : blackMs
          ) ??
          game.time_control *
            60000;

        const left =
          remaining - elapsed;

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
            chess.turn() === "w"
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
            fen:
              chess.fen(),

            last_move:
              `${data.from}${data.to}`,

            status:
              over
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
          `Could not save your move: ${error.message}`,
        );
      }

      if (over) {
        await applyRatings(
          game.id,
        );
      }

      return {
        fen:
          chess.fen(),

        status:
          over
            ? "finished"
            : "active",

        result,

        white_ms:
          whiteMs,

        black_ms:
          blackMs,
      };
    });

/** Ends a game when the side to move has run out of time. */
export const claimTimeout =
  createServerFn({ method: "POST" })
    .middleware([requireSupabaseAuth])
    .inputValidator(
      (data: {
        gameId: string;
      }) => data,
    )
    .handler(async ({ data, context }) => {
      const {
        supabase,
        userId,
      } = context;

      const { data: game } =
        await supabase
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
        (
          turn === "w"
            ? game.white_ms
            : game.black_ms
        ) ??
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
        remaining - elapsed >
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
    });

export const resignGame =
  createServerFn({ method: "POST" })
    .middleware([requireSupabaseAuth])
    .inputValidator(
      (data: {
        gameId: string;
      }) => data,
    )
    .handler(async ({ data, context }) => {
      const {
        supabase,
        userId,
      } = context;

      const { data: game } =
        await supabase
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
        game.white_id === userId
          ? "w"
          : game.black_id === userId
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
    });

export const agreeDraw =
  createServerFn({ method: "POST" })
    .middleware([requireSupabaseAuth])
    .inputValidator(
      (data: {
        gameId: string;
      }) => data,
    )
    .handler(async ({ data, context }) => {
      const {
        supabase,
        userId,
      } = context;

      const { data: game } =
        await supabase
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

          result:
            "draw",
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
    });

/** Seats a human-like computer opponent when the lobby is empty. */
export const fillWithBot =
  createServerFn({ method: "POST" })
    .middleware([requireSupabaseAuth])
    .inputValidator(
      (data: {
        gameId: string;
      }) => data,
    )
    .handler(async ({ data, context }) => {
      const {
        supabase,
        userId,
      } = context;

      const { data: game } =
        await supabase
          .from("games")
          .select(
            "id, white_id, black_id, status, time_control, bot_name",
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
        "waiting"
      ) {
        return {
          filled: false,
          botName:
            game.bot_name,
        };
      }

      if (
        game.white_id &&
        game.black_id
      ) {
        return {
          filled: false,
          botName: null,
        };
      }

      const { data: me } =
        await supabase
          .from("profiles")
          .select("elo")
          .eq(
            "id",
            userId,
          )
          .maybeSingle();

      const bot =
        pickHumanBot(
          me?.elo ?? 1000,
        );

      const clockMs =
        game.time_control
          ? game.time_control *
            60000
          : null;

      const { error } =
        await supabase
          .from("games")
          .update({
            status:
              "active",

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
          );

      if (error) {
        throw new Error(
          "Could not start the match.",
        );
      }

      return {
        filled: true,
        botName:
          bot.name,
        botElo:
          bot.elo,
      };
    });

/** Applies the computer opponent's move. The server chooses and validates it. */
export const botPlayMove =
  createServerFn({ method: "POST" })
    .middleware([requireSupabaseAuth])
    .inputValidator(
      (data: {
        gameId: string;
      }) => data,
    )
    .handler(async ({ data, context }) => {
      const {
        supabase,
        userId,
      } = context;

      const { data: game } =
        await supabase
          .from("games")
          .select(
            "id, white_id, black_id, fen, status, time_control, white_ms, black_ms, turn_started_at, bot_name, bot_elo",
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

      const myColor:
        | Color
        | null =
        game.white_id === userId
          ? "w"
          : game.black_id === userId
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

      // The bot occupies the empty seat; a real player must not be there.
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

      const bot =
        humanBotByName(
          game.bot_name,
        );

      if (!bot) {
        throw new Error(
          `Bot "${game.bot_name}" could not be found.`,
        );
      }

      // Charge the bot's clock before calculating/saving its move.
      let whiteMs =
        game.white_ms;

      let blackMs =
        game.black_ms;

      if (
        game.time_control > 0 &&
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
          remaining - elapsed;

        if (left <= 0) {
          const result =
            botColor === "w"
              ? "black"
              : "white";

          await supabase
            .from("games")
            .update({
              status:
                "finished",

              result,

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
            fen:
              game.fen,

            status:
              "finished",

            result,

            last_move:
              game.last_move,

            white_ms:
              botColor === "w"
                ? 0
                : whiteMs,

            black_ms:
              botColor === "b"
                ? 0
                : blackMs,
          };
        }

        if (
          botColor === "w"
        ) {
          whiteMs = left;
        } else {
          blackMs = left;
        }
      }

      // The server chooses the move.
      const choice =
        humanBotMove(
          game.fen,
          bot,
        );

      if (!choice) {
        const result =
          chess.isCheckmate()
            ? botColor === "w"
              ? "black"
              : "white"
            : "draw";

        await supabase
          .from("games")
          .update({
            status:
              "finished",

            result,

            white_ms:
              whiteMs,

            black_ms:
              blackMs,
          })
          .eq(
            "id",
            game.id,
          );

        await applyRatings(
          game.id,
        );

        return {
          fen:
            game.fen,

          status:
            "finished",

          result,

          last_move:
            game.last_move,

          white_ms:
            whiteMs,

          black_ms:
            blackMs,
        };
      }

      try {
        chess.move({
          from:
            choice.from,

          to:
            choice.to,

          promotion:
            "q",
        });
      } catch {
        throw new Error(
          "The bot generated an illegal move.",
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
            ? chess.turn() === "w"
              ? "black"
              : "white"
            : "draw";
      }

      const lastMove =
        `${choice.from}${choice.to}`;

      const { error } =
        await supabase
          .from("games")
          .update({
            fen:
              chess.fen(),

            last_move:
              lastMove,

            status:
              over
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
          `Could not save the bot move: ${error.message}`,
        );
      }

      if (over) {
        await applyRatings(
          game.id,
        );
      }

      return {
        fen:
          chess.fen(),

        status:
          over
            ? "finished"
            : "active",

        result,

        last_move:
          lastMove,

        white_ms:
          whiteMs,

        black_ms:
          blackMs,

        from:
          choice.from,

        to:
          choice.to,
      };
    });