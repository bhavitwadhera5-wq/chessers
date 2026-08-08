import { n as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as createServerFn } from "./server-ZpaeG_xO.mjs";
import { n as useServerFn, t as createSsrRpc } from "./createSsrRpc-B7DPvFzx.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-DNcGORuI.mjs";
import { r as useAuth } from "./router-BZgWhZSc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-DGmzpkK0.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Whether the signed-in user is an admin. */
var amIAdmin = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("2b97112c91f9366ddeba9c0a0772794613596207065806955c5ef8594bbf3232"));
/** All reports, newest first (admin only). */
var adminReports = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("81d2db1e986ca7c5da8dd626b5f0ef84f703739167070415cf0acf42a88894c8"));
/** Fair-play records with the highest engine match (admin only). */
var adminFairPlay = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("3bb480c9ab9dab7c23a053cd0be69a4ff89be9155239c9078a1feaf0a83273b0"));
/** Updates a report's status (admin only). */
var setReportStatus = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((data) => data).handler(createSsrRpc("28c16ff53e3e12fed0d9ee29b34cf08ad5e4c1d31ad47db860c0b15125784537"));
/** Looks up players by username fragment (admin only). */
var adminSearchPlayers = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((data) => data).handler(createSsrRpc("ac46bab4254687c8abb8288fdd1fc1bff5017726674d3e61c02e189846814348"));
/** Grants or revokes the admin role for a player (admin only). */
var adminSetRole = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((data) => data).handler(createSsrRpc("154da85bc7e5915df5164155bbb68a97441082079312d44aab513dabc82f59c3"));
/** Sets a new password for a player (admin only). Passwords can never be read back. */
var adminSetPassword = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((data) => data).handler(createSsrRpc("982cd71e41e7dc3375231ff8e29feeb7f105d5093767612bc96f45fe8c87c45e"));
/** Bans or unbans a player (admin only). */
var adminSetBan = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((data) => data).handler(createSsrRpc("0c572b87d175c555742716bd49ec1623931b0f407c46a1261100fae63bce22e2"));
/** Sets a player's online rating (admin only). */
var adminSetElo = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((data) => data).handler(createSsrRpc("1d6f7b8ec1b11679dadfdeb4cad35fb9d237690247d7884b55ea05164bf6f2fc"));
var STATUSES = [
	"open",
	"reviewing",
	"resolved",
	"dismissed"
];
function PlayerAdmin() {
	const search = useServerFn(adminSearchPlayers);
	const setBan = useServerFn(adminSetBan);
	const setElo = useServerFn(adminSetElo);
	const setRole = useServerFn(adminSetRole);
	const setPassword = useServerFn(adminSetPassword);
	const [query, setQuery] = (0, import_react.useState)("");
	const [players, setPlayers] = (0, import_react.useState)([]);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [notice, setNotice] = (0, import_react.useState)(null);
	const run = (0, import_react.useCallback)(async (q) => {
		setBusy(true);
		setError(null);
		try {
			setPlayers(await search({ data: { query: q } }));
		} catch {
			setError("Could not load players.");
		} finally {
			setBusy(false);
		}
	}, [search]);
	(0, import_react.useEffect)(() => {
		run("");
	}, [run]);
	async function act(fn, message) {
		setError(null);
		setNotice(null);
		try {
			await fn();
			if (message) setNotice(message);
			await run(query);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Action failed.");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mb-3 text-lg font-medium",
			children: "Players"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-3 flex gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				value: query,
				onChange: (e) => setQuery(e.target.value),
				onKeyDown: (e) => e.key === "Enter" && run(query),
				placeholder: "Search username…",
				maxLength: 40,
				className: "flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: () => run(query),
				className: "rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground",
				children: "Search"
			})]
		}),
		error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-2 text-sm text-destructive",
			children: error
		}),
		notice && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-2 text-sm text-primary",
			children: notice
		}),
		busy && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted-foreground",
			children: "Loading…"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-2",
			children: [!busy && players.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "No players found."
			}), players.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-[9rem] flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "font-medium",
							children: [
								p.username,
								p.isAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "ml-2 rounded bg-primary/15 px-1.5 py-0.5 text-xs text-primary",
									children: "admin"
								}),
								p.banned && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "ml-2 rounded bg-destructive/15 px-1.5 py-0.5 text-xs text-destructive",
									children: "banned"
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted-foreground",
							children: [
								"Rating ",
								p.elo,
								p.ban_reason ? ` · ${p.ban_reason}` : ""
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "number",
						defaultValue: p.elo,
						min: 100,
						max: 4e3,
						onKeyDown: (e) => {
							if (e.key !== "Enter") return;
							const elo = Number(e.target.value);
							act(() => setElo({ data: {
								userId: p.id,
								elo
							} }), "Rating saved.");
						},
						className: "w-24 rounded-md border border-border bg-background px-2 py-1 text-sm",
						"aria-label": `Rating for ${p.username}`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							const pw = window.prompt(`New password for ${p.username} (min 6 characters)`);
							if (!pw) return;
							act(() => setPassword({ data: {
								userId: p.id,
								password: pw
							} }), `Password updated for ${p.username}.`);
						},
						className: "rounded-md border border-border px-3 py-1.5 text-sm font-semibold hover:bg-secondary",
						children: "Reset password"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							if (!window.confirm(p.isAdmin ? `Remove admin powers from ${p.username}?` : `Make ${p.username} an admin? They get full moderation powers.`)) return;
							act(() => setRole({ data: {
								userId: p.id,
								admin: !p.isAdmin
							} }), p.isAdmin ? "Admin removed." : "Admin granted.");
						},
						className: `rounded-md px-3 py-1.5 text-sm font-semibold ${p.isAdmin ? "border border-border text-foreground hover:bg-secondary" : "bg-primary text-primary-foreground"}`,
						children: p.isAdmin ? "Remove admin" : "Make admin"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							const reason = p.banned ? null : window.prompt(`Reason for banning ${p.username}?`, "Fair play violation");
							if (!p.banned && reason === null) return;
							act(() => setBan({ data: {
								userId: p.id,
								banned: !p.banned,
								reason
							} }));
						},
						className: `rounded-md px-3 py-1.5 text-sm font-semibold ${p.banned ? "border border-border text-foreground hover:bg-secondary" : "bg-destructive text-destructive-foreground"}`,
						children: p.banned ? "Unban" : "Ban"
					})
				]
			}, p.id))]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-xs text-muted-foreground",
			children: "Press Enter in the rating box to save a new rating. Passwords are stored one-way encrypted, so nobody can read them — you can only set a new one."
		})
	] });
}
function Admin() {
	const { user, loading: authLoading } = useAuth();
	const checkAdmin = useServerFn(amIAdmin);
	const loadReports = useServerFn(adminReports);
	const loadFlags = useServerFn(adminFairPlay);
	const updateStatus = useServerFn(setReportStatus);
	const [state, setState] = (0, import_react.useState)("loading");
	const [reports, setReports] = (0, import_react.useState)([]);
	const [flags, setFlags] = (0, import_react.useState)([]);
	const refresh = (0, import_react.useCallback)(async () => {
		const [r, f] = await Promise.all([loadReports(), loadFlags()]);
		setReports(r);
		setFlags(f);
	}, [loadReports, loadFlags]);
	(0, import_react.useEffect)(() => {
		if (authLoading) return;
		if (!user) {
			setState("denied");
			return;
		}
		let active = true;
		(async () => {
			try {
				const { isAdmin } = await checkAdmin();
				if (!active) return;
				if (!isAdmin) return setState("denied");
				await refresh();
				if (active) setState("ok");
			} catch {
				if (active) setState("denied");
			}
		})();
		return () => {
			active = false;
		};
	}, [
		authLoading,
		user,
		checkAdmin,
		refresh
	]);
	async function onStatus(id, status) {
		setReports((prev) => prev.map((r) => r.id === id ? {
			...r,
			status
		} : r));
		await updateStatus({ data: {
			id,
			status
		} });
	}
	if (state === "loading") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "p-8 text-center text-muted-foreground",
		children: "Loading…"
	});
	if (state === "denied") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-md p-8 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mb-2 text-2xl font-semibold",
				children: "Admins only"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-6 text-muted-foreground",
				children: "Sign in with the admin account to open the moderation dashboard."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				className: "text-primary underline",
				children: "Back to home"
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-4xl space-y-8 p-4 sm:p-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex items-center justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-semibold",
					children: "Moderation dashboard"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					className: "text-sm text-primary underline",
					children: "Home"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayerAdmin, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
				className: "mb-3 text-lg font-medium",
				children: [
					"Reports (",
					reports.length,
					")"
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [reports.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "No reports filed yet."
				}), reports.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "rounded-lg border border-border bg-card p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "font-medium",
							children: [r.reported_username ?? r.reported_id ?? "Unknown player", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ml-2 text-sm text-muted-foreground",
								children: r.reason
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted-foreground",
							children: [
								new Date(r.created_at).toLocaleString(),
								r.engine_match != null && ` · engine match ${r.engine_match}%`,
								r.accuracy != null && ` · accuracy ${r.accuracy}%`
							]
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							value: STATUSES.includes(r.status) ? r.status : "open",
							onChange: (e) => onStatus(r.id, e.target.value),
							className: "rounded-md border border-border bg-background px-2 py-1 text-sm",
							children: STATUSES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: s,
								children: s
							}, s))
						})]
					}), r.details && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm",
						children: r.details
					})]
				}, r.id))]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mb-3 text-lg font-medium",
				children: "Fair-play analysis"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto rounded-lg border border-border",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "bg-muted/50 text-left",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "p-2",
								children: "Player"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "p-2",
								children: "Engine match"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "p-2",
								children: "Accuracy"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "p-2",
								children: "Moves"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "p-2",
								children: "Verdict"
							})
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [flags.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "p-3 text-muted-foreground",
						colSpan: 5,
						children: "No analysed games yet."
					}) }), flags.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-t border-border",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "p-2 font-mono text-xs",
								children: f.player_id.slice(0, 8)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "p-2",
								children: [f.engine_match, "%"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "p-2",
								children: [f.accuracy, "%"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "p-2",
								children: f.moves
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "p-2",
								children: f.suspicion
							})
						]
					}, f.id))] })]
				})
			})] })
		]
	});
}
//#endregion
export { Admin as component };
