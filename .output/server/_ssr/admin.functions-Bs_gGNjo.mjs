import { n as createServerFn } from "./server-ZpaeG_xO.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-DNcGORuI.mjs";
import { t as createServerRpc } from "./createServerRpc-BfpZqqzp.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin.functions-Bs_gGNjo.js
/** Whether the signed-in user is an admin. */
var amIAdmin_createServerFn_handler = createServerRpc({
	id: "2b97112c91f9366ddeba9c0a0772794613596207065806955c5ef8594bbf3232",
	name: "amIAdmin",
	filename: "src/lib/admin.functions.ts"
}, (opts) => amIAdmin.__executeServer(opts));
var amIAdmin = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(amIAdmin_createServerFn_handler, async ({ context }) => {
	const { data } = await context.supabase.rpc("has_role", {
		_user_id: context.userId,
		_role: "admin"
	});
	return { isAdmin: Boolean(data) };
});
async function assertAdmin(context) {
	const { data } = await context.supabase.rpc("has_role", {
		_user_id: context.userId,
		_role: "admin"
	});
	if (!data) throw new Error("Forbidden");
}
/** All reports, newest first (admin only). */
var adminReports_createServerFn_handler = createServerRpc({
	id: "81d2db1e986ca7c5da8dd626b5f0ef84f703739167070415cf0acf42a88894c8",
	name: "adminReports",
	filename: "src/lib/admin.functions.ts"
}, (opts) => adminReports.__executeServer(opts));
var adminReports = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(adminReports_createServerFn_handler, async ({ context }) => {
	await assertAdmin(context);
	const { data } = await context.supabase.from("reports").select("id, reported_username, reported_id, reason, details, status, engine_match, accuracy, game_id, created_at").order("created_at", { ascending: false }).limit(100);
	return data ?? [];
});
var adminFairPlay_createServerFn_handler = createServerRpc({
	id: "3bb480c9ab9dab7c23a053cd0be69a4ff89be9155239c9078a1feaf0a83273b0",
	name: "adminFairPlay",
	filename: "src/lib/admin.functions.ts"
}, (opts) => adminFairPlay.__executeServer(opts));
var adminFairPlay = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(adminFairPlay_createServerFn_handler, async ({ context }) => {
	await assertAdmin(context);
	const { data } = await context.supabase.from("fair_play_flags").select("id, player_id, engine_match, accuracy, moves, suspicion, created_at").order("engine_match", { ascending: false }).limit(50);
	return data ?? [];
});
var setReportStatus_createServerFn_handler = createServerRpc({
	id: "28c16ff53e3e12fed0d9ee29b34cf08ad5e4c1d31ad47db860c0b15125784537",
	name: "setReportStatus",
	filename: "src/lib/admin.functions.ts"
}, (opts) => setReportStatus.__executeServer(opts));
var setReportStatus = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((data) => data).handler(setReportStatus_createServerFn_handler, async ({ data, context }) => {
	await assertAdmin(context);
	if (![
		"open",
		"auto",
		"reviewing",
		"resolved",
		"dismissed"
	].includes(data.status)) throw new Error("Unknown status.");
	const { error } = await context.supabase.from("reports").update({ status: data.status }).eq("id", data.id);
	if (error) throw new Error(error.message);
	return { ok: true };
});
var adminSearchPlayers_createServerFn_handler = createServerRpc({
	id: "ac46bab4254687c8abb8288fdd1fc1bff5017726674d3e61c02e189846814348",
	name: "adminSearchPlayers",
	filename: "src/lib/admin.functions.ts"
}, (opts) => adminSearchPlayers.__executeServer(opts));
var adminSearchPlayers = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((data) => data).handler(adminSearchPlayers_createServerFn_handler, async ({ data, context }) => {
	await assertAdmin(context);
	const q = (data.query ?? "").trim().toLowerCase().slice(0, 40);
	let req = context.supabase.from("profiles").select("id, username, elo, banned, ban_reason, banned_at").order("username").limit(25);
	if (q) req = req.ilike("username", `%${q}%`);
	const { data: rows, error } = await req;
	if (error) throw new Error(error.message);
	const { supabaseAdmin } = await import("./client.server-Bw6iWMJ-.mjs");
	const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role").eq("role", "admin");
	const adminIds = new Set((roles ?? []).map((r) => r.user_id));
	return (rows ?? []).map((r) => ({
		...r,
		isAdmin: adminIds.has(r.id)
	}));
});
var adminSetRole_createServerFn_handler = createServerRpc({
	id: "154da85bc7e5915df5164155bbb68a97441082079312d44aab513dabc82f59c3",
	name: "adminSetRole",
	filename: "src/lib/admin.functions.ts"
}, (opts) => adminSetRole.__executeServer(opts));
var adminSetRole = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((data) => data).handler(adminSetRole_createServerFn_handler, async ({ data, context }) => {
	await assertAdmin(context);
	if (data.userId === context.userId) throw new Error("You cannot change your own admin role.");
	const { supabaseAdmin } = await import("./client.server-Bw6iWMJ-.mjs");
	if (data.admin) {
		const { error } = await supabaseAdmin.from("user_roles").upsert({
			user_id: data.userId,
			role: "admin"
		}, { onConflict: "user_id,role" });
		if (error) throw new Error(error.message);
	} else {
		const { error } = await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId).eq("role", "admin");
		if (error) throw new Error(error.message);
	}
	return { ok: true };
});
var adminSetPassword_createServerFn_handler = createServerRpc({
	id: "982cd71e41e7dc3375231ff8e29feeb7f105d5093767612bc96f45fe8c87c45e",
	name: "adminSetPassword",
	filename: "src/lib/admin.functions.ts"
}, (opts) => adminSetPassword.__executeServer(opts));
var adminSetPassword = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((data) => data).handler(adminSetPassword_createServerFn_handler, async ({ data, context }) => {
	await assertAdmin(context);
	const password = String(data.password ?? "");
	if (password.length < 6) throw new Error("Password must be at least 6 characters.");
	const { supabaseAdmin } = await import("./client.server-Bw6iWMJ-.mjs");
	const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, { password });
	if (error) throw new Error(error.message);
	return { ok: true };
});
var adminSetBan_createServerFn_handler = createServerRpc({
	id: "0c572b87d175c555742716bd49ec1623931b0f407c46a1261100fae63bce22e2",
	name: "adminSetBan",
	filename: "src/lib/admin.functions.ts"
}, (opts) => adminSetBan.__executeServer(opts));
var adminSetBan = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((data) => data).handler(adminSetBan_createServerFn_handler, async ({ data, context }) => {
	await assertAdmin(context);
	if (data.userId === context.userId) throw new Error("You cannot ban yourself.");
	const { error } = await context.supabase.from("profiles").update({
		banned: data.banned,
		ban_reason: data.banned ? (data.reason ?? "").slice(0, 200) || null : null,
		banned_at: data.banned ? (/* @__PURE__ */ new Date()).toISOString() : null
	}).eq("id", data.userId);
	if (error) throw new Error(error.message);
	return { ok: true };
});
var adminSetElo_createServerFn_handler = createServerRpc({
	id: "1d6f7b8ec1b11679dadfdeb4cad35fb9d237690247d7884b55ea05164bf6f2fc",
	name: "adminSetElo",
	filename: "src/lib/admin.functions.ts"
}, (opts) => adminSetElo.__executeServer(opts));
var adminSetElo = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((data) => data).handler(adminSetElo_createServerFn_handler, async ({ data, context }) => {
	await assertAdmin(context);
	const elo = Math.round(Number(data.elo));
	if (!Number.isFinite(elo) || elo < 100 || elo > 4e3) throw new Error("Rating must be between 100 and 4000.");
	const { error } = await context.supabase.from("profiles").update({ elo }).eq("id", data.userId);
	if (error) throw new Error(error.message);
	return {
		ok: true,
		elo
	};
});
//#endregion
export { adminFairPlay_createServerFn_handler, adminReports_createServerFn_handler, adminSearchPlayers_createServerFn_handler, adminSetBan_createServerFn_handler, adminSetElo_createServerFn_handler, adminSetPassword_createServerFn_handler, adminSetRole_createServerFn_handler, amIAdmin_createServerFn_handler, setReportStatus_createServerFn_handler };
