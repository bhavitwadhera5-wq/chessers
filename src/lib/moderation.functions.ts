import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const REPORT_REASONS = [
  { id: "cheating", label: "Cheating / engine use" },
  { id: "sandbagging", label: "Sandbagging (losing on purpose)" },
  { id: "abuse", label: "Abusive behaviour" },
  { id: "stalling", label: "Stalling / disconnecting" },
  { id: "other", label: "Something else" },
] as const;

const REASON_IDS = REPORT_REASONS.map((r) => r.id) as readonly string[];

type ReportInput = {
  gameId?: string | null;
  reason: string;
  details?: string | null;
};

/** Files a report against the opponent in one of the caller's games. */
export const reportOpponent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: ReportInput) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (!REASON_IDS.includes(data.reason)) throw new Error("Unknown report reason.");
    const details = (data.details ?? "").slice(0, 1000) || null;

    let reportedId: string | null = null;
    let reportedUsername: string | null = null;
    let engineMatch: number | null = null;
    let accuracy: number | null = null;

    if (data.gameId) {
      const { data: game } = await supabase
        .from("games")
        .select("id, white_id, black_id")
        .eq("id", data.gameId)
        .maybeSingle();
      if (!game || (game.white_id !== userId && game.black_id !== userId))
        throw new Error("You can only report opponents from your own games.");
      reportedId = game.white_id === userId ? game.black_id : game.white_id;

      if (reportedId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", reportedId)
          .maybeSingle();
        reportedUsername = profile?.username ?? null;

        const { data: flag } = await supabase
          .from("fair_play_flags")
          .select("engine_match, accuracy")
          .eq("game_id", data.gameId)
          .eq("player_id", reportedId)
          .maybeSingle();
        engineMatch = flag?.engine_match ?? null;
        accuracy = flag?.accuracy ?? null;
      }
    }

    const { error } = await supabase.from("reports").insert({
      reporter_id: userId,
      reported_id: reportedId,
      reported_username: reportedUsername,
      game_id: data.gameId ?? null,
      reason: data.reason,
      details,
      engine_match: engineMatch,
      accuracy,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

type FairPlayInput = {
  gameId: string;
  stats: {
    color: "w" | "b";
    engineMatch: number;
    accuracy: number;
    moves: number;
    suspicion: string;
  }[];
};

/** Stores post-game fair-play statistics for both players of a finished game. */
export const submitFairPlay = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: FairPlayInput) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: game } = await supabase
      .from("games")
      .select("id, white_id, black_id, status")
      .eq("id", data.gameId)
      .maybeSingle();
    if (!game || (game.white_id !== userId && game.black_id !== userId))
      throw new Error("Not your game.");
    if (game.status !== "finished") return { ok: false };

    const rows = data.stats
      .map((s) => ({
        game_id: game.id,
        player_id: s.color === "w" ? game.white_id : game.black_id,
        engine_match: Math.max(0, Math.min(100, s.engineMatch)),
        accuracy: Math.max(0, Math.min(100, s.accuracy)),
        moves: Math.max(0, Math.round(s.moves)),
        suspicion: ["clean", "review", "high"].includes(s.suspicion) ? s.suspicion : "clean",
      }))
      .filter((r): r is typeof r & { player_id: string } => Boolean(r.player_id));

    if (!rows.length) return { ok: false };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("fair_play_flags").upsert(rows, { onConflict: "game_id,player_id" });

    // Auto-open a system report when the analysis looks engine-like.
    const flagged = rows.filter((r) => r.suspicion === "high");
    for (const r of flagged) {
      const { data: existing } = await supabaseAdmin
        .from("reports")
        .select("id")
        .eq("game_id", game.id)
        .eq("reported_id", r.player_id)
        .eq("reason", "cheating")
        .maybeSingle();
      if (existing) continue;
      await supabaseAdmin.from("reports").insert({
        reporter_id: r.player_id,
        reported_id: r.player_id,
        game_id: game.id,
        reason: "cheating",
        details: "Automatic fair-play review: engine-like move matching.",
        status: "auto",
        engine_match: r.engine_match,
        accuracy: r.accuracy,
      });
    }
    return { ok: true, flagged: flagged.length };
  });

/** Reports the signed-in user has filed. */
export const myReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("reports")
      .select("id, reported_username, reason, status, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    return data ?? [];
  });

