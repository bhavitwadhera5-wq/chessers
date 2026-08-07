import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as supabase } from "./client-BGr9uG5A.mjs";
import { r as useAuth } from "./router-B5Ig5G0B.mjs";
import { t as HUMAN_BOTS } from "./humanBots-GpmBr8cf.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/leaderboard-Cbc0Zv13.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Online personas that also appear in the public rankings. */
var BOT_ROWS = HUMAN_BOTS.map((b) => ({
	id: `bot:${b.name}`,
	username: b.name,
	elo: b.elo
}));
function Leaderboard() {
	const { user, username } = useAuth();
	const [rows, setRows] = (0, import_react.useState)([]);
	const [games, setGames] = (0, import_react.useState)([]);
	const [names, setNames] = (0, import_react.useState)({});
	const [loading, setLoading] = (0, import_react.useState)(true);
	(0, import_react.useEffect)(() => {
		if (!user) {
			setLoading(false);
			return;
		}
		let active = true;
		(async () => {
			const [top, mine] = await Promise.all([supabase.from("profiles").select("id, username, elo").order("elo", { ascending: false }).limit(25), supabase.from("games").select("id, white_id, black_id, result, created_at").eq("status", "finished").or(`white_id.eq.${user.id},black_id.eq.${user.id}`).order("created_at", { ascending: false }).limit(20)]);
			if (!active) return;
			const merged = [...top.data ?? [], ...BOT_ROWS].sort((a, b) => b.elo - a.elo).slice(0, 25);
			setRows(merged);
			setGames(mine.data ?? []);
			setNames(Object.fromEntries(merged.map((p) => [p.id, p.username])));
			setLoading(false);
		})();
		return () => {
			active = false;
		};
	}, [user]);
	const record = games.reduce((acc, g) => {
		const mine = g.white_id === user?.id ? "white" : "black";
		if (g.result === "draw") acc.d += 1;
		else if (g.result === mine) acc.w += 1;
		else if (g.result) acc.l += 1;
		return acc;
	}, {
		w: 0,
		l: 0,
		d: 0
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "flex min-h-screen flex-col items-center bg-background px-4 py-8",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-3xl",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "mb-6 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					className: "text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground",
					children: "← Home"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-3 font-serif text-4xl font-bold tracking-tight text-foreground",
					children: "Leaderboard"
				})]
			}), !user ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-xl border border-border bg-card p-4 text-center text-sm text-muted-foreground",
				children: "Sign in from the home screen to see rankings and your record."
			}) : loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-center text-sm text-muted-foreground",
				children: "Loading rankings…"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "grid grid-cols-3 gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Wins",
								value: record.w
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Draws",
								value: record.d
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Losses",
								value: record.l
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "overflow-hidden rounded-xl border border-border bg-card",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "border-b border-border px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground",
							children: "Top players"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", { children: [rows.map((r, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: `flex items-center justify-between px-4 py-2 text-sm ${r.username === username ? "bg-secondary font-semibold" : ""}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "w-6 text-muted-foreground",
									children: i + 1
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-card-foreground",
									children: r.username
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-card-foreground",
								children: r.elo
							})]
						}, r.id)), rows.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "px-4 py-3 text-sm text-muted-foreground",
							children: "No players yet."
						})] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "overflow-hidden rounded-xl border border-border bg-card",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "border-b border-border px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground",
							children: "Your recent games"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", { children: [games.map((g) => {
							const mine = g.white_id === user.id ? "white" : "black";
							const opponentId = mine === "white" ? g.black_id : g.white_id;
							const outcome = g.result === "draw" ? "Draw" : g.result === mine ? "Win" : "Loss";
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-center justify-between px-4 py-2 text-sm text-card-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
									"vs ",
									opponentId ? names[opponentId] ?? "Opponent" : "Opponent",
									" ·",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted-foreground",
										children: mine
									})
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: outcome === "Win" ? "text-primary" : outcome === "Loss" ? "text-destructive" : "text-muted-foreground",
									children: outcome
								})]
							}, g.id);
						}), games.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "px-4 py-3 text-sm text-muted-foreground",
							children: "No finished online games yet."
						})] })]
					})
				]
			})]
		})
	});
}
function Stat({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl border border-border bg-card px-3 py-3 text-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xl font-semibold text-card-foreground",
			children: value
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-[0.7rem] uppercase tracking-wide text-muted-foreground",
			children: label
		})]
	});
}
//#endregion
export { Leaderboard as component };
