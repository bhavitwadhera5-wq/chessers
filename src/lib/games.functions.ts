import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { Chess } from "chess.js";
import { pickHumanBot } from "@/lib/humanBots";

type Color = "w" | "b";
type RatingType = "rapid" | "blitz" | "bullet";

type Rating = {
  rating: number;
  rd: number;
};

type GameRating = {
  white: Rating;
  black: Rating;
};

/* =========================================================
   RATING SYSTEM
   ========================================================= */

const INITIAL_RATING = 1000;
const INITIAL_RD = 350;

const MIN_RATING = 100;
const MAX_RATING = 3000;

const MIN_RD = 60;
const MAX_RD = 350;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getRatingType(minutes: number): RatingType {
  /*
   * 5 minutes  -> Blitz
   * 10 minutes -> Rapid
   * 0 minutes  -> Bullet / untimed
   *
   * If you later add 1+0, 2+1, etc., this function
   * can be changed easily.
   */
  if (minutes === 10) return "rapid";
  if (minutes === 5) return "blitz";
  return "bullet";
}

/*
 * Glicko-style rating update.

 * This is intentionally kept self-contained so we don't
 * need another npm package.
 */
function glickoUpdate(
  player: Rating,
  opponent: Rating,
  score: number,
): Rating {
  const q = Math.log(10) / 400;

  const rd = clamp(player.rd, MIN_RD, MAX_RD);
  const opponentRd = clamp(opponent.rd, MIN_RD, MAX_RD);

  const g = 1 / Math.sqrt(
    1 + (3 * q * q * opponentRd * opponentRd) / (Math.PI * Math.PI),
  );

  const expected =
    1 /
    (1 +
      Math.pow(
        10,
        (-g * (player.rating - opponent.rating)) / 400,
      ));

  /*
   * Smaller RD = more established player.
   * Larger RD = more uncertain player.
   */
  const variance =
    1 /
    (q * q * g * g * expected * (1 - expected));

  const improvement =
    q /
    (1 / (rd * rd) + 1 / variance) *
    g *
    (score - expected);

  const newRating = player.rating + 400 * improvement;

  /*
   * RD becomes smaller as we gain information.
   * We keep it from becoming unrealistically tiny.
   */
  const newRd = Math.sqrt(
    1 /
      (1 / (rd * rd) + 1 / variance),
  );

  return {
    rating: Math.round(
      clamp(newRating, MIN_RATING, MAX_RATING),
    ),
    rd: Math.round(
      clamp(newRd, MIN_RD, MAX_RD),
    ),
  };
}

/*
 * New / inactive players should be uncertain.
 */
function increaseRd(rd: number, amount = 12) {
  return clamp(rd + amount, MIN_RD, MAX_RD);
}

/*
 * Convert a normal game result into a rating score.
 */
function resultScore(
  result: string | null,
  color: Color,
) {
  if (result === "draw") return 0.5;

  if (result === "white") {
    return color === "w" ? 1 : 0;
  }

  if (result === "black") {
    return color === "b" ? 1 : 0;
  }

  return 0.5;
}

/* =========================================================
   RATING DATABASE HELPERS
   ========================================================= */

function getRatingFromProfile(
  profile: any,
  type: RatingType,
): Rating {
  const eloKey = `${type}_elo`;
  const rdKey = `${type}_rd`;

  return {
    rating:
      typeof profile?.[eloKey] === "number"
        ? profile[eloKey]
        : typeof profile?.elo === "number"
          ? profile.elo
          : INITIAL_RATING,

    rd:
      typeof profile?.[rdKey] === "number"
        ? profile[rdKey]
        : INITIAL_RD,
  };
}

function ratingColumns(type: RatingType) {
  return {
    elo: `${type}_elo`,
    rd: `${type}_rd`,
  } as const;
}

/* =========================================================
   APPLY RATING CHANGES
   ========================================================= */

async function applyRatings(gameId: string) {
  const { supabaseAdmin } =
    await import("@/integrations/supabase/client.server");

  const { data: game } = await supabaseAdmin
    .from("games")
    .select(
      "id, white_id, black_id, result, status, elo_applied, bot_name, bot_elo, time_control",
    )
    .eq("id", gameId)
    .maybeSingle();

  if (!game) return;

  if (game.status !== "finished") return;

  if (game.elo_applied) return;

  const ratingType = getRatingType(
    Number(game.time_control ?? 0),
  );

  const columns = ratingColumns(ratingType);

  /*
   * =======================================================
   * BOT GAME
   * =======================================================
   */

  if (
    game.bot_name &&
    (!game.white_id || !game.black_id)
  ) {
    const humanId = game.white_id ?? game.black_id;

    if (!humanId) return;

    const humanColor: Color = game.white_id
      ? "w"
      : "b";

    const { data: profile } =
      await supabaseAdmin
        .from("profiles")
        .select(
          `id, elo, ${columns.elo}, ${columns.rd}`,
        )
        .eq("id", humanId)
        .maybeSingle();

    if (!profile) return;

    const humanRating =
      getRatingFromProfile(profile, ratingType);

    const botRating: Rating = {
      rating:
        typeof game.bot_elo === "number"
          ? game.bot_elo
          : INITIAL_RATING,

      rd: 100,
    };

    const score = resultScore(
      game.result,
      humanColor,
    );

    let updated =
      glickoUpdate(
        humanRating,
        botRating,
        score,
      );

    /*
     * Bot games have a reduced effect.
     * This prevents someone farming rating against bots.
     */
    updated = {
      rating: Math.round(
        humanRating.rating +
          (updated.rating - humanRating.rating) *
            0.35,
      ),

      rd: Math.round(
        humanRating.rd +
          (updated.rd - humanRating.rd) *
            0.35,
      ),
    };

    await supabaseAdmin
      .from("profiles")
      .update({
        [columns.elo]: updated.rating,
        [columns.rd]: updated.rd,
        rated_games:
          Number(profile.rated_games ?? 0) + 1,
        last_rated_at: new Date().toISOString(),
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
   * =======================================================
   * HUMAN VS HUMAN
   * =======================================================
   */

  if (!game.white_id || !game.black_id) return;

  const { data: profiles } =
    await supabaseAdmin
      .from("profiles")
      .select(
        `id, elo, ${columns.elo}, ${columns.rd}, rated_games`,
      )
      .in("id", [
        game.white_id,
        game.black_id,
      ]);

  if (!profiles || profiles.length !== 2) {
    return;
  }

  const whiteProfile = profiles.find(
    (p) => p.id === game.white_id,
  );

  const blackProfile = profiles.find(
    (p) => p.id === game.black_id,
  );

  if (!whiteProfile || !blackProfile) {
    return;
  }

  const whiteRating =
    getRatingFromProfile(
      whiteProfile,
      ratingType,
    );

  const blackRating =
    getRatingFromProfile(
      blackProfile,
      ratingType,
    );

  const whiteScore = resultScore(
    game.result,
    "w",
  );

  const blackScore = 1 - whiteScore;

  const newWhite =
    glickoUpdate(
      whiteRating,
      blackRating,
      whiteScore,
    );

  const newBlack =
    glickoUpdate(
      blackRating,
      whiteRating,
      blackScore,
    );

  /*
   * Update both players.
   */
  await supabaseAdmin
    .from("profiles")
    .update({
      [columns.elo]: newWhite.rating,
      [columns.rd]: newWhite.rd,
      rated_games:
        Number(whiteProfile.rated_games ?? 0) + 1,
      last_rated_at:
        new Date().toISOString(),
    })
    .eq("id", whiteProfile.id);

  await supabaseAdmin
    .from("profiles")
    .update({
      [columns.elo]: newBlack.rating,
      [columns.rd]: newBlack.rd,
      rated_games:
        Number(blackProfile.rated_games ?? 0) + 1,
      last_rated_at:
        new Date().toISOString(),
    })
    .eq("id", blackProfile.id);

  /*
   * IMPORTANT:
   * This prevents rating changes from being applied twice.
   */
  await supabaseAdmin
    .from("games")
    .update({
      elo_applied: true,
    })
    .eq("id", gameId);
}

/* =========================================================
   FIND OR CREATE GAME
   ========================================================= */

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

      const wanted =
        (data.opponentUsername ?? "")
          .trim()
          .toLowerCase() || null;

      const minutes = [0, 5, 10].includes(
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

      let matchedName:
        | string
        | null = null;

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
          matchedName =
            target.username;
        }
      }

      /*
       * Join an existing waiting game.
       */

      const seat =
        myColor === "w"
          ? "white_id"
          : "black_id";

      const otherSeat =
        myColor === "w"
          ? "black_id"
          : "white_id";

      const { data: waiting } =
        await supabase
          .from("games")
          .select(
            "id, white_id, black_id, invited_username, time_control",
          )
          .eq("status", "waiting")
          .eq("time_control", minutes)
          .is(seat, null)
          .not(otherSeat, "is", null)
          .order("created_at", {
            ascending: true,
          })
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
        ) ?? candidates[0];

      if (preferred) {
        const clockMs = minutes
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
          .eq("id", preferred.id)
          .eq("status", "waiting")
          .is(seat, null)
          .select("id")
          .maybeSingle();

        if (!error && joined) {
          return {
            gameId: joined.id,
            mode: "joined" as const,
            opponent: null,
            color: myColor,
            unknownUsername:
              wanted !== null &&
              matchedName === null,
          };
        }
      }

      /*
       * Otherwise create a waiting game.
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

          time_control: minutes,
        })
        .select("id")
        .single();

      if (createError || !created) {
        throw new Error(
          "Could not create a game.",
        );
      }

      return {
        gameId: created.id,
        mode: matchedName
          ? ("invited" as const)
          : ("open" as const),
        opponent: matchedName,
        color: myColor,
        unknownUsername:
          wanted !== null &&
          matchedName === null,
      };
    });

/* =========================================================
   MAKE MOVE
   ========================================================= */

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
          .eq("id", data.gameId)
          .maybeSingle();

      if (!game) {
        throw new Error(
          "Game not found.",
        );
      }

      if (game.status !== "active") {
        throw new Error(
          "This game is not in play.",
        );
      }

      const myColor: Color | null =
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
        chess.turn() !== myColor
      ) {
        throw new Error(
          "It is not your turn.",
        );
      }

      let whiteMs =
        game.white_ms;

      let blackMs =
        game.black_ms;

      /*
       * Charge the clock before move.
       */

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
          game.time_control * 60000;

        const left =
          remaining - elapsed;

        if (left <= 0) {
          await supabase
            .from("games")
            .update({
              status: "finished",

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

        if (myColor === "w") {
          whiteMs = left;
        } else {
          blackMs = left;
        }
      }

      /*
       * Validate move with chess.js.
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
            fen: chess.fen(),

            last_move:
              `${data.from}${data.to}`,

            status: over
              ? "finished"
              : "active",

            result,

            white_ms: whiteMs,
            black_ms: blackMs,

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
        white_ms: whiteMs,
        black_ms: blackMs,
      };
    });

/* =========================================================
   CLAIM TIMEOUT
   ========================================================= */

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
          .eq("id", data.gameId)
          .maybeSingle();

      if (!game) {
        throw new Error(
          "Game not found.",
        );
      }

      if (
        game.status !== "active" ||
        !game.time_control
      ) {
        return {
          ok: false,
        };
      }

      if (
        game.white_id !== userId &&
        game.black_id !== userId
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
        game.time_control * 60000;

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
          status: "finished",

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

/* =========================================================
   RESIGN
   ========================================================= */

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
          .eq("id", data.gameId)
          .maybeSingle();

      if (!game) {
        throw new Error(
          "Game not found.",
        );
      }

      const myColor: Color | null =
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

      if (
        game.status === "finished"
      ) {
        return {
          ok: true,
        };
      }

      await supabase
        .from("games")
        .update({
          status: "finished",

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

/* =========================================================
   AGREE DRAW
   ========================================================= */

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
          .eq("id", data.gameId)
          .maybeSingle();

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

      await supabase
        .from("games")
        .update({
          status: "finished",
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
    });

/* =========================================================
   FILL WITH BOT
   ========================================================= */

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
          .eq("id", data.gameId)
          .maybeSingle();

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
        game.status !== "waiting"
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
          .eq("id", userId)
          .maybeSingle();

      const bot =
        pickHumanBot(
          me?.elo ?? INITIAL_RATING,
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
            status: "active",

            bot_name: bot.name,
            bot_elo: bot.elo,

            invited_username: null,

            white_ms: clockMs,
            black_ms: clockMs,

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
        botName: bot.name,
        botElo: bot.elo,
      };
    });

/* =========================================================
   BOT MOVE
   ========================================================= */

export const botPlayMove =
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
            "id, white_id, black_id, fen, status, time_control, white_ms, black_ms, turn_started_at, bot_name",
          )
          .eq("id", data.gameId)
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
        game.status !== "active"
      ) {
        throw new Error(
          "This game is not in play.",
        );
      }

      const myColor: Color | null =
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
        chess.turn() !== botColor
      ) {
        throw new Error(
          "It is not the opponent's turn.",
        );
      }

      let whiteMs =
        game.white_ms;

      let blackMs =
        game.black_ms;

      /*
       * Bot clock.
       */

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
          game.time_control * 60000;

        const left =
          remaining - elapsed;

        if (left <= 0) {
          await supabase
            .from("games")
            .update({
              status: "finished",

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
            status: "finished",
            result:
              botColor === "w"
                ? "black"
                : "white",
          };
        }

        if (botColor === "w") {
          whiteMs = left;
        } else {
          blackMs = left;
        }
      }

      /*
       * Validate the bot move.
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
        result = chess.isCheckmate()
          ? chess.turn() === "w"
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

            white_ms: whiteMs,
            black_ms: blackMs,

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
    });