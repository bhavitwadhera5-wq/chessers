import { n as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as supabase } from "./client-BGr9uG5A.mjs";
import { r as useAuth } from "./router-BZgWhZSc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CgMewXUQ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Home() {
	const { user, username, isAdmin, loading } = useAuth();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "min-h-screen bg-background px-4 py-10",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-2xl",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-8 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground",
						children: "Board is set"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-3 text-5xl font-bold tracking-tight",
						children: "Chessers"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-muted-foreground",
						children: "Play against AI, play online, solve puzzles and improve your chess."
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-2xl border border-border bg-card p-6 shadow-lg",
				children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-center text-sm text-muted-foreground",
					children: "Loading…"
				}) : user ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, {
					username,
					isAdmin
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthCard, {})
			})]
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
		className: "space-y-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex rounded-lg border border-border p-1",
				children: ["in", "up"].map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => {
						setMode(m);
						setError(null);
					},
					className: `flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`,
					children: m === "in" ? "Sign in" : "Create account"
				}, m))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "text-sm font-medium",
					children: "Username"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: name,
					onChange: (e) => setName(e.target.value),
					autoComplete: "username",
					required: true,
					className: "w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "text-sm font-medium",
					children: "Password"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "password",
					value: password,
					onChange: (e) => setPassword(e.target.value),
					autoComplete: mode === "in" ? "current-password" : "new-password",
					required: true,
					className: "w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
				})]
			}),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-destructive",
				children: error
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "submit",
				disabled: busy,
				className: "w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50",
				children: busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"
			})
		]
	});
}
function Menu({ username, isAdmin }) {
	const navigate = useNavigate();
	const { signOut } = useAuth();
	const [elo, setElo] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		supabase.auth.getUser().then(({ data }) => {
			if (!data.user) return;
			supabase.from("profiles").select("elo").eq("id", data.user.id).maybeSingle().then(({ data: row }) => {
				setElo(row?.elo ?? null);
			});
		});
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted-foreground",
					children: [
						"Signed in as",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-semibold text-foreground",
							children: username ?? "…"
						})
					]
				}), elo !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: [
						"Rating:",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-semibold text-foreground",
							children: elo
						})
					]
				})]
			}),
			isAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: () => navigate({ to: "/admin" }),
				className: "w-full rounded-xl bg-destructive px-4 py-3 text-left font-semibold text-destructive-foreground transition-opacity hover:opacity-90",
				children: ["🛠️ Admin Console", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block text-xs font-normal opacity-80",
					children: "Manage players, ratings and fair play"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: () => navigate({ to: "/online" }),
				className: "w-full rounded-xl bg-primary px-4 py-4 text-left font-semibold text-primary-foreground transition-opacity hover:opacity-90",
				children: ["🌐 Play Online", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mt-1 block text-xs font-normal opacity-80",
					children: "Play chess against another player online"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: () => navigate({ to: "/solo" }),
				className: "w-full rounded-xl border border-border px-4 py-4 text-left font-semibold transition-colors hover:bg-secondary",
				children: ["🤖 Play Against AI", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mt-1 block text-xs font-normal text-muted-foreground",
					children: "Start an instant game against the computer"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => navigate({ to: "/puzzles" }),
					className: "rounded-xl border border-border px-4 py-4 text-left font-semibold transition-colors hover:bg-secondary",
					children: ["🧩 Chess Puzzles", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mt-1 block text-xs font-normal text-muted-foreground",
						children: "Improve your tactics"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => navigate({ to: "/leaderboard" }),
					className: "rounded-xl border border-border px-4 py-4 text-left font-semibold transition-colors hover:bg-secondary",
					children: ["🏆 Leaderboard", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mt-1 block text-xs font-normal text-muted-foreground",
						children: "View the strongest players"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: signOut,
				className: "w-full rounded-xl border border-border px-4 py-3 text-sm transition-colors hover:bg-secondary",
				children: "Sign Out"
			})
		]
	});
}
//#endregion
export { Home as component };
