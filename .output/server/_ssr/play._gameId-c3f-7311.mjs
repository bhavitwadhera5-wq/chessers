import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { _ as Link, v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as createServerFn } from "./server-TUNRzD0E.mjs";
import { n as useServerFn, t as createSsrRpc } from "./createSsrRpc-Z4YZpYFL.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-T8rJsk6L.mjs";
import { t as supabase } from "./client-BGr9uG5A.mjs";
import { n as Route, r as useAuth } from "./router-B5Ig5G0B.mjs";
import { t as Chess } from "../_libs/chess.js.mjs";
import { i as humanThinkDelay, n as humanBotByName, r as humanBotMove } from "./humanBots-GpmBr8cf.mjs";
import { n as THEME_KEY, t as BOARD_THEMES } from "./boardThemes-CqnkWAfd.mjs";
import { i as fillWithBot, n as botPlayMove, o as makeMove, r as claimTimeout, s as resignGame, t as agreeDraw } from "./games.functions-DZG7yZnb.mjs";
import { n as playMoveSound, t as BoardView } from "./sounds-6KmV21qp.mjs";
import { n as MoveList, t as GameOverDialog } from "./MoveList-DNL6uaMB.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/play._gameId-c3f-7311.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var REPORT_REASONS = [
	{
		id: "cheating",
		label: "Cheating / engine use"
	},
	{
		id: "sandbagging",
		label: "Sandbagging (losing on purpose)"
	},
	{
		id: "abuse",
		label: "Abusive behaviour"
	},
	{
		id: "stalling",
		label: "Stalling / disconnecting"
	},
	{
		id: "other",
		label: "Something else"
	}
];
/** Files a report against the opponent in one of the caller's games. */
var reportOpponent = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((data) => data).handler(createSsrRpc("ead9869751f05fbb7f10c05880c3e1d0a463c80c5dd8793e964710a8d2f85baa"));
/** Stores post-game fair-play statistics for both players of a finished game. */
var submitFairPlay = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((data) => data).handler(createSsrRpc("c136811f6020ce02f020d92d8cabe7bf91cf5edfcdc0f55cfb280e27d76222b5"));
createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("e11da762a6722bcbc849cc9a7b60293c800eaf30b3024cf9825fcc7c419081aa"));
/** Report the opponent of a finished online game. */
function ReportPanel({ gameId }) {
	const submit = useServerFn(reportOpponent);
	const [open, setOpen] = (0, import_react.useState)(false);
	const [reason, setReason] = (0, import_react.useState)(REPORT_REASONS[0].id);
	const [details, setDetails] = (0, import_react.useState)("");
	const [state, setState] = (0, import_react.useState)("idle");
	const [message, setMessage] = (0, import_react.useState)(null);
	if (state === "done") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground",
		children: "Thanks — our fair play team will review this game."
	});
	if (!open) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		onClick: () => setOpen(true),
		className: "w-full rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground",
		children: "Report opponent"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-2 rounded-xl border border-border p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-medium uppercase tracking-wide text-muted-foreground",
				children: "What went wrong?"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-1.5",
				children: REPORT_REASONS.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setReason(r.id),
					className: `rounded-md border px-2 py-1 text-xs ${reason === r.id ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:bg-secondary"}`,
					children: r.label
				}, r.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
				value: details,
				onChange: (e) => setDetails(e.target.value),
				rows: 2,
				maxLength: 1e3,
				placeholder: "Anything else we should know? (optional)",
				className: "w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
			}),
			message && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-destructive",
				children: message
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					disabled: state === "busy",
					onClick: async () => {
						setState("busy");
						setMessage(null);
						try {
							await submit({ data: {
								gameId,
								reason,
								details
							} });
							setState("done");
						} catch {
							setState("error");
							setMessage("Could not send the report. Please try again.");
						}
					},
					className: "flex-1 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50",
					children: state === "busy" ? "Sending…" : "Send report"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setOpen(false),
					className: "rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground",
					children: "Cancel"
				})]
			})
		]
	});
}
function fmtClock(ms) {
	const s = Math.max(0, Math.ceil(ms / 1e3));
	return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
function PlayOnline() {
	const { gameId } = Route.useParams();
	const { user, username, loading } = useAuth();
	const navigate = useNavigate();
	const move = useServerFn(makeMove);
	const resign = useServerFn(resignGame);
	const draw = useServerFn(agreeDraw);
	const timeout = useServerFn(claimTimeout);
	const seatBot = useServerFn(fillWithBot);
	const sendBotMove = useServerFn(botPlayMove);
	const [game, setGame] = (0, import_react.useState)(null);
	const [opponentName, setOpponentName] = (0, import_react.useState)(null);
	const [selected, setSelected] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	const [theme, setTheme] = (0, import_react.useState)("green");
	const [drawOffered, setDrawOffered] = (0, import_react.useState)(false);
	const [incomingDraw, setIncomingDraw] = (0, import_react.useState)(false);
	const [showResult, setShowResult] = (0, import_react.useState)(true);
	const sendFairPlay = useServerFn(submitFairPlay);
	const [now, setNow] = (0, import_react.useState)(() => Date.now());
	const channelRef = (0, import_react.useRef)(null);
	const claimedRef = (0, import_react.useRef)(false);
	const pieceCountRef = (0, import_react.useRef)(0);
	const fillingRef = (0, import_react.useRef)(false);
	const botThinkingRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const saved = window.localStorage.getItem(THEME_KEY);
		if (saved && BOARD_THEMES.some((t) => t.id === saved)) setTheme(saved);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!loading && !user) navigate({ to: "/" });
	}, [
		loading,
		user,
		navigate
	]);
	(0, import_react.useEffect)(() => {
		let active = true;
		const load = async () => {
			const { data } = await supabase.from("games").select("*").eq("id", gameId).maybeSingle();
			if (active && data) setGame(data);
		};
		load();
		const channel = supabase.channel(`game-${gameId}`).on("postgres_changes", {
			event: "UPDATE",
			schema: "public",
			table: "games",
			filter: `id=eq.${gameId}`
		}, (payload) => setGame(payload.new)).on("broadcast", { event: "draw-offer" }, ({ payload }) => {
			if (payload?.from !== user?.id) setIncomingDraw(true);
		}).on("broadcast", { event: "draw-decline" }, ({ payload }) => {
			if (payload?.from !== user?.id) setDrawOffered(false);
		}).subscribe();
		channelRef.current = channel;
		const poll = setInterval(load, 4e3);
		return () => {
			active = false;
			clearInterval(poll);
			supabase.removeChannel(channel);
			channelRef.current = null;
		};
	}, [gameId, user?.id]);
	const myColor = !game || !user ? null : game.white_id === user.id ? "w" : game.black_id === user.id ? "b" : null;
	(0, import_react.useEffect)(() => {
		const otherId = myColor === "w" ? game?.black_id : game?.white_id;
		if (!otherId) {
			setOpponentName(game?.bot_name ?? null);
			return;
		}
		supabase.from("profiles").select("username").eq("id", otherId).maybeSingle().then(({ data }) => setOpponentName(data?.username ?? null));
	}, [
		game?.black_id,
		game?.white_id,
		game?.bot_name,
		myColor
	]);
	const chess = (0, import_react.useMemo)(() => game ? new Chess(game.fen) : null, [game?.fen]);
	const board = (0, import_react.useMemo)(() => chess?.board() ?? [], [chess]);
	const myTurn = !!chess && !!myColor && chess.turn() === myColor && game?.status === "active";
	const waitingAlone = game?.status === "waiting" && !!myColor && !game.invited_username && (myColor === "w" ? !game.black_id : !game.white_id);
	(0, import_react.useEffect)(() => {
		if (!waitingAlone || fillingRef.current) return;
		const id = setTimeout(() => {
			fillingRef.current = true;
			seatBot({ data: { gameId } }).catch(() => void 0).finally(() => {
				fillingRef.current = false;
			});
		}, 12e3);
		return () => clearTimeout(id);
	}, [
		waitingAlone,
		seatBot,
		gameId
	]);
	const botSeatEmpty = !!game?.bot_name && !!myColor && (myColor === "w" ? !game.black_id : !game.white_id);
	(0, import_react.useEffect)(() => {
		if (!botSeatEmpty || !chess || !game || game.status !== "active" || myTurn) return;
		const bot = humanBotByName(game.bot_name);
		if (!bot) return;
		const fen = game.fen;
		if (botThinkingRef.current === fen) return;
		botThinkingRef.current = fen;
		const id = setTimeout(() => {
			const choice = humanBotMove(fen, bot);
			if (!choice) return;
			sendBotMove({ data: {
				gameId,
				from: choice.from,
				to: choice.to
			} }).then((res) => setGame((g) => g ? {
				...g,
				fen: res.fen,
				status: res.status,
				result: res.result,
				last_move: `${choice.from}${choice.to}`
			} : g)).catch(() => {
				botThinkingRef.current = null;
			});
		}, humanThinkDelay(bot));
		return () => clearTimeout(id);
	}, [
		botSeatEmpty,
		game?.fen,
		game?.status,
		myTurn,
		gameId,
		sendBotMove
	]);
	const clockOn = !!game?.time_control && game.status === "active";
	(0, import_react.useEffect)(() => {
		if (!clockOn) return;
		const id = setInterval(() => setNow(Date.now()), 250);
		return () => clearInterval(id);
	}, [clockOn]);
	const remaining = (side) => {
		if (!game?.time_control) return null;
		const base = (side === "w" ? game.white_ms : game.black_ms) ?? game.time_control * 6e4;
		if (game.status !== "active" || !chess || chess.turn() !== side || !game.turn_started_at) return Math.max(0, base);
		return Math.max(0, base - (now - new Date(game.turn_started_at).getTime()));
	};
	const turnClock = chess ? remaining(chess.turn()) : null;
	(0, import_react.useEffect)(() => {
		if (!clockOn || turnClock === null || turnClock > 0 || claimedRef.current) return;
		claimedRef.current = true;
		timeout({ data: { gameId } }).catch(() => {
			claimedRef.current = false;
		});
	}, [
		clockOn,
		turnClock,
		timeout,
		gameId
	]);
	const [moveLog, setMoveLog] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		const lm = game?.last_move;
		if (!lm) return;
		setMoveLog((log) => {
			if (log[log.length - 1] === lm) return log;
			const pieces = (game?.fen ?? "").split(" ")[0].replace(/[^a-zA-Z]/g, "").length;
			const captured = pieceCountRef.current > 0 && pieces < pieceCountRef.current;
			pieceCountRef.current = pieces;
			playMoveSound({
				captured,
				check: !!chess?.inCheck(),
				over: game?.status === "finished"
			});
			return [...log, lm];
		});
	}, [game?.last_move]);
	const history = (0, import_react.useMemo)(() => {
		const replay = new Chess();
		for (const m of moveLog) try {
			replay.move({
				from: m.slice(0, 2),
				to: m.slice(2, 4),
				promotion: "q"
			});
		} catch {
			return [];
		}
		return replay.history({ verbose: true });
	}, [moveLog]);
	(0, import_react.useEffect)(() => {
		if (myTurn) setError(null);
	}, [myTurn]);
	const destinations = (0, import_react.useMemo)(() => {
		if (!chess || !selected) return /* @__PURE__ */ new Set();
		return new Set(chess.moves({
			square: selected,
			verbose: true
		}).map((m) => m.to));
	}, [chess, selected]);
	const checkSquare = (0, import_react.useMemo)(() => {
		if (!chess?.inCheck()) return null;
		const turn = chess.turn();
		for (const row of chess.board()) for (const cell of row) if (cell && cell.type === "k" && cell.color === turn) return cell.square;
		return null;
	}, [chess]);
	const lastMove = game?.last_move ? {
		from: game.last_move.slice(0, 2),
		to: game.last_move.slice(2, 4)
	} : null;
	const onSquareClick = async (square) => {
		if (!chess || !myTurn) {
			if (game?.status === "active" && !myTurn) setError("It's not your turn yet.");
			return;
		}
		setError(null);
		const piece = chess.get(square);
		if (piece && piece.color === myColor) {
			setSelected(square === selected ? null : square);
			return;
		}
		if (!selected) return;
		const from = selected;
		setSelected(null);
		try {
			const res = await move({ data: {
				gameId,
				from,
				to: square
			} });
			setGame((g) => g ? {
				...g,
				fen: res.fen,
				status: res.status,
				result: res.result,
				last_move: `${from}${square}`
			} : g);
		} catch (e) {
			setError(e instanceof Error ? e.message.replace(/^Error:\s*/, "") : "Move failed.");
		}
	};
	if (!game) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-center text-sm text-muted-foreground",
		children: "Loading match…"
	}) });
	if (!myColor) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-center text-sm text-muted-foreground",
		children: "You're not a player in this match."
	}) });
	const iWon = game.result === (myColor === "w" ? "white" : "black");
	let status;
	if (game.status === "waiting") status = game.invited_username ? `Waiting for ${game.invited_username} to join…` : "Finding you an opponent…";
	else if (game.status === "finished") status = game.result === "draw" ? "Draw" : iWon ? "You won!" : "You lost.";
	else if (myTurn) status = chess?.inCheck() ? "Your move — you're in check" : "Your move";
	else status = `Waiting for ${opponentName ?? "your opponent"}…`;
	const sendDrawOffer = () => {
		setDrawOffered(true);
		channelRef.current?.send({
			type: "broadcast",
			event: "draw-offer",
			payload: { from: user?.id }
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Shell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col items-center gap-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-3 shadow-[var(--shadow-panel)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-medium text-card-foreground",
					children: status
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs text-muted-foreground",
					children: [
						"You play ",
						myColor === "w" ? "White" : "Black",
						opponentName ? ` · vs ${opponentName}` : "",
						game.bot_name && game.bot_elo ? ` (${game.bot_elo})` : ""
					]
				})] }), !!game.time_control && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2 font-mono text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: `rounded-md px-2.5 py-1 ${chess?.turn() === (myColor === "w" ? "b" : "w") ? "bg-secondary text-foreground" : "text-muted-foreground"}`,
						children: [
							opponentName ?? "Opponent",
							" ",
							fmtClock(remaining(myColor === "w" ? "b" : "w") ?? 0)
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: `rounded-md px-2.5 py-1 ${myTurn ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`,
						children: ["You ", fmtClock(remaining(myColor) ?? 0)]
					})]
				})]
			}),
			game.status === "waiting" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-lg border border-border bg-card px-4 py-2 text-xs text-muted-foreground",
				children: "Share your username — your friend can enter it from their home screen to join you. If nobody turns up in a few seconds, a rated opponent at your level will start the game."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex w-full flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BoardView, {
					board,
					selected,
					destinations,
					lastMove,
					flipped: myColor === "b",
					theme,
					checkSquare,
					onSquareClick,
					onDropMove: (from, to) => {
						setSelected(from);
						onSquareClick(to);
					}
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: "flex w-full flex-col gap-3 sm:w-52",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MoveList, {
							history,
							whiteLabel: myColor === "w" ? username ?? "You" : opponentName ?? "White",
							blackLabel: myColor === "b" ? username ?? "You" : opponentName ?? "Black"
						}),
						game.status !== "finished" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => resign({ data: { gameId } }),
							className: "rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary",
							children: "Resign"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: sendDrawOffer,
							disabled: drawOffered,
							className: "rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-50",
							children: drawOffered ? "Draw offered…" : "Offer draw"
						})] }),
						incomingDraw && game.status === "active" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2 rounded-xl border border-border bg-card p-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-muted-foreground",
									children: [opponentName ?? "Your opponent", " offers a draw."]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: async () => {
										setIncomingDraw(false);
										await draw({ data: { gameId } });
									},
									className: "w-full rounded-md bg-primary px-2 py-1.5 text-xs font-semibold text-primary-foreground",
									children: "Accept"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => {
										setIncomingDraw(false);
										channelRef.current?.send({
											type: "broadcast",
											event: "draw-decline",
											payload: { from: user?.id }
										});
									},
									className: "w-full rounded-md border border-border px-2 py-1.5 text-xs text-muted-foreground",
									children: "Decline"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-xl border border-border bg-card p-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground",
								children: "Board"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex flex-wrap gap-1.5",
								children: BOARD_THEMES.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setTheme(t.id),
									className: `rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${theme === t.id ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"}`,
									children: t.label
								}, t.id))
							})]
						}),
						game.status === "finished" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setShowResult(true),
							className: "rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90",
							children: "Scorecard & review"
						})
					]
				})]
			}),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-destructive",
				children: error
			})
		]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameOverDialog, {
		open: game.status === "finished" && showResult,
		headline: game.result === "draw" ? "Draw" : iWon ? "You won!" : "You lost",
		detail: game.result === "draw" ? "The game ended in a draw." : chess?.isCheckmate() ? "Checkmate ended the game." : "The game is over.",
		history,
		whiteLabel: myColor === "w" ? username ?? "You" : opponentName ?? "White",
		blackLabel: myColor === "b" ? username ?? "You" : opponentName ?? "Black",
		reportSlot: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportPanel, { gameId }),
		onReview: (review) => {
			sendFairPlay({ data: {
				gameId,
				stats: ["w", "b"].map((c) => ({
					color: c,
					engineMatch: review.fairPlay[c].engineMatch,
					accuracy: review.fairPlay[c].accuracy,
					moves: review.fairPlay[c].moves,
					suspicion: review.fairPlay[c].suspicion
				}))
			} }).catch(() => void 0);
		},
		onRematch: () => navigate({ to: "/" }),
		onClose: () => setShowResult(false)
	})] });
}
function Shell({ children }) {
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
					className: "mt-3 font-serif text-3xl font-bold tracking-tight text-foreground",
					children: "Online Match"
				})]
			}), children]
		})
	});
}
//#endregion
export { PlayOnline as component };
