import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Whether the signed-in user is an admin. */
export const amIAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: Boolean(data) };
  });

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Forbidden");
}

/** All reports, newest first (admin only). */
export const adminReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data } = await context.supabase
      .from("reports")
      .select(
        "id, reported_username, reported_id, reason, details, status, engine_match, accuracy, game_id, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(100);
    return data ?? [];
  });

/** Fair-play records with the highest engine match (admin only). */
export const adminFairPlay = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data } = await context.supabase
      .from("fair_play_flags")
      .select("id, player_id, engine_match, accuracy, moves, suspicion, created_at")
      .order("engine_match", { ascending: false })
      .limit(50);
    return data ?? [];
  });

/** Updates a report's status (admin only). */
export const setReportStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; status: string }) => data)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (!["open", "auto", "reviewing", "resolved", "dismissed"].includes(data.status))
      throw new Error("Unknown status.");
    const { error } = await context.supabase
      .from("reports")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Looks up players by username fragment (admin only). */
export const adminSearchPlayers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { query?: string }) => data)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const q = (data.query ?? "").trim().toLowerCase().slice(0, 40);
    let req = context.supabase
      .from("profiles")
      .select("id, username, elo, banned, ban_reason, banned_at")
      .order("username")
      .limit(25);
    if (q) req = req.ilike("username", `%${q}%`);
    const { data: rows, error } = await req;
    if (error) throw new Error(error.message);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .eq("role", "admin");
    const adminIds = new Set((roles ?? []).map((r) => r.user_id));

    return (rows ?? []).map((r) => ({ ...r, isAdmin: adminIds.has(r.id) }));
  });

/** Grants or revokes the admin role for a player (admin only). */
export const adminSetRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string; admin: boolean }) => data)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId)
      throw new Error("You cannot change your own admin role.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.admin) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.userId, role: "admin" }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", "admin");
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

/** Sets a new password for a player (admin only). Passwords can never be read back. */
export const adminSetPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string; password: string }) => data)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const password = String(data.password ?? "");
    if (password.length < 6) throw new Error("Password must be at least 6 characters.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, { password });
    if (error) throw new Error(error.message);
    return { ok: true };
  });


/** Bans or unbans a player (admin only). */
export const adminSetBan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string; banned: boolean; reason?: string | null }) => data)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId) throw new Error("You cannot ban yourself.");
    const { error } = await context.supabase
      .from("profiles")
      .update({
        banned: data.banned,
        ban_reason: data.banned ? (data.reason ?? "").slice(0, 200) || null : null,
        banned_at: data.banned ? new Date().toISOString() : null,
      })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Sets a player's online rating (admin only). */
export const adminSetElo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string; elo: number }) => data)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const elo = Math.round(Number(data.elo));
    if (!Number.isFinite(elo) || elo < 100 || elo > 4000)
      throw new Error("Rating must be between 100 and 4000.");
    const { error } = await context.supabase
      .from("profiles")
      .update({ elo })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true, elo };
  });


