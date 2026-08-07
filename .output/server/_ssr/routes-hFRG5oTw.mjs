import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as useServerFn } from "./createSsrRpc-Z4YZpYFL.mjs";
import { t as supabase } from "./client-BGr9uG5A.mjs";
import { r as useAuth } from "./router-B5Ig5G0B.mjs";
import { n as THEME_KEY, t as BOARD_THEMES } from "./boardThemes-CqnkWAfd.mjs";
import { a as findOrCreateGame } from "./games.functions-DZG7yZnb.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-hFRG5oTw.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Home() {
	const { user, username, isAdmin, loading } = useAuth();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-md",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "mb-10 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground",
						children: "Board is set"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-2 font-serif text-5xl font-bold tracking-tight text-foreground",
						children: "chessers"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-muted-foreground",
						children: "Play the bot, or challenge a friend on any device."
					})
				]
			}), loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-center text-sm text-muted-foreground",
				children: "Loading…"
			}) : user ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, {
				username,
				isAdmin
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthCard, {})]
		})
	});
}
function AuthCard() {
	const { signIn, signUp } = useAuth();
	const [mode, setMode] = (0, import_react.useState)("in");
	const [name, setName] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const submit = async (e) => {
		e.preventDefault();
		setBusy(true);
		setError(null);
		const err = mode === "in" ? await signIn(name, password) : await signUp(name, password);
		if (err) setError(err);
		setBusy(false);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		onSubmit: submit,
		className: "space-y-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-panel)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex rounded-lg border border-border p-1",
				children: ["in", "up"].map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => {
						setMode(m);
						setError(null);
					},
					className: `flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`,
					children: m === "in" ? "Sign in" : "Create account"
				}, m))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block space-y-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs font-medium uppercase tracking-wide text-muted-foreground",
					children: "Username"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: name,
					onChange: (e) => setName(e.target.value),
					autoComplete: "username",
					required: true,
					className: "w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-ring"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block space-y-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs font-medium uppercase tracking-wide text-muted-foreground",
					children: "Password"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "password",
					value: password,
					onChange: (e) => setPassword(e.target.value),
					autoComplete: mode === "in" ? "current-password" : "new-password",
					required: true,
					className: "w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-ring"
				})]
			}),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-destructive",
				children: error
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "submit",
				disabled: busy,
				className: "w-full rounded-lg bg-primary px-4 py-2.5 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50",
				children: busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-center text-xs text-muted-foreground",
				children: "We remember you on this device, so you stay signed in."
			})
		]
	});
}
var COLORS = [
	{
		id: "w",
		label: "White"
	},
	{
		id: "b",
		label: "Black"
	},
	{
		id: "random",
		label: "Random"
	}
];
var CLOCKS = [
	{
		id: 0,
		label: "No clock"
	},
	{
		id: 5,
		label: "5 min"
	},
	{
		id: 10,
		label: "10 min"
	}
];
function Menu({ username, isAdmin }) {
	const navigate = useNavigate();
	const { signOut } = useAuth();
	const startGame = useServerFn(findOrCreateGame);
	const [setup, setSetup] = (0, import_react.useState)(false);
	const [opponent, setOpponent] = (0, import_react.useState)("");
	const [color, setColor] = (0, import_react.useState)("random");
	const [minutes, setMinutes] = (0, import_react.useState)(0);
	const [theme, setTheme] = (0, import_react.useState)("green");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [note, setNote] = (0, import_react.useState)(null);
	const [elo, setElo] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		const saved = window.localStorage.getItem(THEME_KEY);
		if (saved && BOARD_THEMES.some((t) => t.id === saved)) setTheme(saved);
		supabase.auth.getUser().then(({ data }) => {
			if (!data.user) return;
			supabase.from("profiles").select("elo").eq("id", data.user.id).maybeSingle().then(({ data: row }) => setElo(row?.elo ?? null));
		});
	}, []);
	const play = async () => {
		setBusy(true);
		setNote(null);
		window.localStorage.setItem(THEME_KEY, theme);
		try {
			const res = await startGame({ data: {
				opponentUsername: opponent || null,
				color,
				minutes
			} });
			navigate({
				to: "/play/$gameId",
				params: { gameId: res.gameId }
			});
		} catch (e) {
			setNote(e instanceof Error ? e.message : "Something went wrong.");
			setBusy(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-panel)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Signed in as ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-semibold text-foreground",
						children: username ?? "…"
					})] }),
					isAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "rounded-md bg-destructive px-2 py-0.5 text-xs font-bold uppercase text-destructive-foreground",
						children: "Admin"
					}),
					elo !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						"· online rating",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-semibold text-foreground",
							children: elo
						})
					] })
				]
			}),
			isAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: () => navigate({ to: "/admin" }),
				className: "w-full rounded-lg bg-destructive px-4 py-3 text-left font-semibold text-destructive-foreground transition-opacity hover:opacity-90",
				children: ["Open Admin Console", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block text-xs font-normal opacity-80",
					children: "Manage players, bans, ratings, roles, passwords, reports, and fair play"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: () => navigate({ to: "/solo" }),
				className: "w-full rounded-lg border border-border px-4 py-3 text-left font-medium text-foreground transition-colors hover:bg-secondary",
				children: ["Play against the bot", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block text-xs font-normal text-muted-foreground",
					children: "Instant offline game"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => navigate({ to: "/puzzles" }),
					className: "rounded-lg border border-border px-4 py-3 text-left font-medium text-foreground transition-colors hover:bg-secondary",
					children: ["Puzzles", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block text-xs font-normal text-muted-foreground",
						children: "Daily tactic"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => navigate({ to: "/leaderboard" }),
					className: "rounded-lg border border-border px-4 py-3 text-left font-medium text-foreground transition-colors hover:bg-secondary",
					children: ["Leaderboard", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block text-xs font-normal text-muted-foreground",
						children: "Rankings & stats"
					})]
				})]
			}),
			!setup ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: () => setSetup(true),
				className: "w-full rounded-lg bg-primary px-4 py-3 text-left font-semibold text-primary-foreground transition-opacity hover:opacity-90",
				children: ["Play online", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block text-xs font-normal opacity-80",
					children: "Set up your match, then find an opponent"
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3 rounded-lg border border-border p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-medium text-foreground",
						children: "Set up your online match"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SetupGroup, {
						label: "Which colour do you want to play?",
						children: COLORS.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pick, {
							active: color === c.id,
							onClick: () => setColor(c.id),
							children: c.label
						}, c.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SetupGroup, {
						label: "Time control",
						children: CLOCKS.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pick, {
							active: minutes === c.id,
							onClick: () => setMinutes(c.id),
							children: c.label
						}, c.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SetupGroup, {
						label: "Board theme",
						children: BOARD_THEMES.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pick, {
							active: theme === t.id,
							onClick: () => setTheme(t.id),
							children: t.label
						}, t.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: opponent,
						onChange: (e) => setOpponent(e.target.value),
						placeholder: "Friend's username (optional)",
						className: "w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-ring"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: play,
						disabled: busy,
						className: "w-full rounded-lg bg-primary px-4 py-2.5 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50",
						children: busy ? "Finding a game…" : "Find a match"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground",
						children: "We match you with a player who picked the same time control and the other colour."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setSetup(false),
						className: "w-full rounded-lg px-4 py-1.5 text-xs text-muted-foreground hover:text-foreground",
						children: "Cancel"
					}),
					note && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-destructive",
						children: note
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: signOut,
				className: "w-full rounded-lg px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground",
				children: "Sign out"
			})
		]
	});
}
function SetupGroup({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground",
		children: label
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex flex-wrap gap-1.5",
		children
	})] });
}
function Pick({ active, onClick, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		onClick,
		className: `rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${active ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"}`,
		children
	});
}
//#endregion
export { Home as component };
