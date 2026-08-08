import { n as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { _ as Link, v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as createServerFn } from "./server-ZpaeG_xO.mjs";
import { n as useServerFn, t as createSsrRpc } from "./createSsrRpc-B7DPvFzx.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-DNcGORuI.mjs";
import { t as supabase } from "./client-BGr9uG5A.mjs";
import { n as Route, r as useAuth } from "./router-BZgWhZSc.mjs";
import { t as Chess } from "../_libs/chess.js.mjs";
import { i as humanThinkDelay, n as humanBotByName, r as humanBotMove } from "./humanBots-Dol-gB05.mjs";
import { i as playMoveSound, n as BoardView, r as THEME_KEY, t as BOARD_THEMES } from "./sounds-DLicoFiG.mjs";
import { n as MoveList, t as GameOverDialog } from "./MoveList-DNL6uaMB.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/play._gameId-nfMrg1xS.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(createSsrRpc("7c89d1e873fad3f4339751da3a4b7f5bc5c54ccaad6d7c651c68d5492d4fc749"));
/**
* Make a real player's chess move.
*/
var makeMove = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(createSsrRpc("4729b461ab9e7f95edbc2066531e6119c7ef1c4ef291f5167be40c95b0ca16f9"));
createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(createSsrRpc("54831cd06c61e074e7534b463a8cd8b493da9baa80e973f1404530dc5ff100d0"));
/**
* Resign a game.
*/
var resignGame = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(createSsrRpc("c53c2b171816dd0c5a50865e9569ff93244d2193ffbb0da9d33ce4953ed6aa75"));
/**
* Agree to a draw.
*/
var agreeDraw = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(createSsrRpc("b76842116856c5549ee4b720305aa5b9ee88c3d7fd6bb32282a47c0e0af7745a"));
/**
* Automatically put one of the 50 bots into
* a waiting game.
*
* The bot is NOT stored as a fake Supabase user.
* Instead:
*
*   bot seat ID       = NULL
*   bot seat username = bot's name
*
* This matches your current database structure.
*/
var fillWithBot = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(createSsrRpc("fa9fc95427da78d1e177c789a6ba700580cada50f5fb424a81eee4e1c4e568fe"));
/**
* Make the bot's move.
*
* The client asks the server for the bot move by sending
* the selected from/to squares.
*/
var botPlayMove = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(createSsrRpc("79f7500f37bcbd972b3ae9fafeb36e137de69c0cf837f0143fcac4fb35fe9b36"));
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
var BOT_WAIT_MS = 3e4;
var POLL_MS = 2e3;
function PlayOnline() {
	const { gameId } = Route.useParams();
	const { user, username, loading } = useAuth();
	const navigate = useNavigate();
	const move = useServerFn(makeMove);
	const resign = useServerFn(resignGame);
	const draw = useServerFn(agreeDraw);
	const seatBot = useServerFn(fillWithBot);
	const sendBotMove = useServerFn(botPlayMove);
	const sendFairPlay = useServerFn(submitFairPlay);
	const [game, setGame] = (0, import_react.useState)(null);
	const [opponentName, setOpponentName] = (0, import_react.useState)(null);
	const [selected, setSelected] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	const [theme, setTheme] = (0, import_react.useState)("green");
	const [drawOffered, setDrawOffered] = (0, import_react.useState)(false);
	const [incomingDraw, setIncomingDraw] = (0, import_react.useState)(false);
	const [showResult, setShowResult] = (0, import_react.useState)(true);
	const [moveLog, setMoveLog] = (0, import_react.useState)([]);
	const channelRef = (0, import_react.useRef)(null);
	const fillingRef = (0, import_react.useRef)(false);
	const botThinkingRef = (0, import_react.useRef)(null);
	const pieceCountRef = (0, import_react.useRef)(0);
	(0, import_react.useEffect)(() => {
		const saved = window.localStorage.getItem(THEME_KEY);
		if (saved && BOARD_THEMES.some((themeItem) => themeItem.id === saved)) setTheme(saved);
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
		const loadGame = async () => {
			const { data, error: loadError } = await supabase.from("games").select("*").eq("id", gameId).maybeSingle();
			if (!active) return;
			if (loadError) {
				setError(loadError.message);
				return;
			}
			if (!data) {
				setError("Game not found.");
				return;
			}
			setGame(data);
		};
		loadGame();
		const channel = supabase.channel(`game-${gameId}`).on("postgres_changes", {
			event: "UPDATE",
			schema: "public",
			table: "games",
			filter: `id=eq.${gameId}`
		}, (payload) => {
			if (!active) return;
			setGame(payload.new);
		}).on("broadcast", { event: "draw-offer" }, ({ payload }) => {
			if (payload?.from !== user?.id) setIncomingDraw(true);
		}).on("broadcast", { event: "draw-decline" }, ({ payload }) => {
			if (payload?.from !== user?.id) setDrawOffered(false);
		}).subscribe();
		channelRef.current = channel;
		const poll = window.setInterval(() => {
			loadGame();
		}, POLL_MS);
		return () => {
			active = false;
			window.clearInterval(poll);
			supabase.removeChannel(channel);
			channelRef.current = null;
		};
	}, [gameId, user?.id]);
	const myColor = !game || !user ? null : game.white_id === user.id ? "w" : game.black_id === user.id ? "b" : null;
	(0, import_react.useEffect)(() => {
		if (!game) {
			setOpponentName(null);
			return;
		}
		const otherId = myColor === "w" ? game.black_id : myColor === "b" ? game.white_id : null;
		if (!otherId) {
			const botName = myColor === "w" ? game.black_username : game.white_username;
			setOpponentName(botName ?? null);
			return;
		}
		supabase.from("profiles").select("username").eq("id", otherId).maybeSingle().then(({ data }) => {
			setOpponentName(data?.username ?? "Opponent");
		});
	}, [
		game?.black_id,
		game?.white_id,
		game?.black_username,
		game?.white_username,
		myColor
	]);
	const safeFen = game?.fen && game.fen !== "start" ? game.fen : "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
	const chess = (0, import_react.useMemo)(() => {
		if (!game) return null;
		try {
			return new Chess(safeFen);
		} catch {
			return new Chess();
		}
	}, [game?.fen, safeFen]);
	const board = (0, import_react.useMemo)(() => chess?.board() ?? [], [chess]);
	const myTurn = !!chess && !!myColor && chess.turn() === myColor && game?.status === "active";
	const waitingAlone = !!game && game.status === "waiting" && !!myColor && (myColor === "w" ? !game.black_id : !game.white_id);
	(0, import_react.useEffect)(() => {
		if (!waitingAlone) {
			fillingRef.current = false;
			return;
		}
		if (fillingRef.current) return;
		const createdAt = game?.created_at ? new Date(game.created_at).getTime() : Date.now();
		const getElapsed = () => Date.now() - createdAt;
		const tryFillBot = async () => {
			if (!waitingAlone || fillingRef.current) return;
			if (getElapsed() < BOT_WAIT_MS) return;
			fillingRef.current = true;
			try {
				if ((await seatBot({ data: { gameId } })).filled) {
					const { data } = await supabase.from("games").select("*").eq("id", gameId).maybeSingle();
					if (data) setGame(data);
					setError(null);
				}
			} catch (e) {
				setError(e instanceof Error ? e.message.replace(/^Error:\s*/, "") : "Could not start the bot.");
			} finally {
				fillingRef.current = false;
			}
		};
		const elapsed = getElapsed();
		const remaining = Math.max(0, BOT_WAIT_MS - elapsed);
		const firstTimer = window.setTimeout(() => {
			tryFillBot();
		}, remaining);
		const retryTimer = window.setInterval(() => {
			tryFillBot();
		}, 3e3);
		return () => {
			window.clearTimeout(firstTimer);
			window.clearInterval(retryTimer);
		};
	}, [
		waitingAlone,
		game?.created_at,
		gameId,
		seatBot
	]);
	const botName = game && myColor ? myColor === "w" ? game.black_username : game.white_username : null;
	const botSeatEmpty = !!game && !!myColor && !!botName && (myColor === "w" ? !game.black_id : !game.white_id);
	(0, import_react.useEffect)(() => {
		if (!botSeatEmpty || !chess || !game || game.status !== "active" || myTurn) return;
		if (!botName) return;
		const bot = humanBotByName(botName);
		if (!bot) {
			setError(`Bot "${botName}" could not be found.`);
			return;
		}
		const fen = game.fen;
		if (botThinkingRef.current === fen) return;
		botThinkingRef.current = fen;
		const thinkingTime = humanThinkDelay(bot);
		const timer = window.setTimeout(async () => {
			try {
				const choice = humanBotMove(fen, bot);
				if (!choice) {
					botThinkingRef.current = null;
					return;
				}
				const result = await sendBotMove({ data: {
					gameId,
					from: choice.from,
					to: choice.to
				} });
				const { data } = await supabase.from("games").select("*").eq("id", gameId).maybeSingle();
				if (data) setGame(data);
				else setGame((current) => current ? {
					...current,
					fen: result.fen,
					status: result.status,
					winner: result.winner,
					turn: result.turn,
					last_move: `${choice.from}${choice.to}`
				} : current);
				botThinkingRef.current = null;
				setError(null);
			} catch (e) {
				botThinkingRef.current = null;
				setError(e instanceof Error ? e.message.replace(/^Error:\s*/, "") : "Bot move failed.");
			}
		}, thinkingTime);
		return () => {
			window.clearTimeout(timer);
		};
	}, [
		botSeatEmpty,
		botName,
		game?.fen,
		game?.status,
		myTurn,
		gameId,
		sendBotMove,
		chess
	]);
	(0, import_react.useEffect)(() => {
		const lastMove = game?.last_move;
		if (!lastMove) return;
		setMoveLog((log) => {
			if (log[log.length - 1] === lastMove) return log;
			const pieces = (game?.fen ?? "").split(" ")[0].replace(/[^a-zA-Z]/g, "").length;
			const captured = pieceCountRef.current > 0 && pieces < pieceCountRef.current;
			pieceCountRef.current = pieces;
			playMoveSound({
				captured,
				check: !!chess?.inCheck(),
				over: game?.status === "finished"
			});
			return [...log, lastMove];
		});
	}, [game?.last_move]);
	const history = (0, import_react.useMemo)(() => {
		const replay = new Chess();
		for (const moveString of moveLog) try {
			replay.move({
				from: moveString.slice(0, 2),
				to: moveString.slice(2, 4),
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
		}).map((move) => move.to));
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
			const result = await move({ data: {
				gameId,
				from,
				to: square
			} });
			const { data } = await supabase.from("games").select("*").eq("id", gameId).maybeSingle();
			if (data) setGame(data);
			else setGame((current) => current ? {
				...current,
				fen: result.fen,
				status: result.status,
				turn: result.turn,
				winner: result.winner,
				last_move: `${from}${square}`
			} : current);
		} catch (e) {
			setError(e instanceof Error ? e.message.replace(/^Error:\s*/, "") : "Move failed.");
		}
	};
	const sendDrawOffer = () => {
		setDrawOffered(true);
		channelRef.current?.send({
			type: "broadcast",
			event: "draw-offer",
			payload: { from: user?.id }
		});
	};
	if (!game) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Shell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-center text-sm text-muted-foreground",
		children: "Loading match…"
	}), error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mt-3 text-center text-sm text-destructive",
		children: error
	})] });
	if (!myColor) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl border border-border bg-card p-6 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-medium text-card-foreground",
				children: "You're not a player in this match."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-xs text-muted-foreground",
				children: "This game belongs to another account."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: () => navigate({ to: "/" }),
				className: "mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground",
				children: "Go home"
			})
		]
	}) });
	const myResult = game.winner === "draw" ? "draw" : game.winner === (myColor === "w" ? "white" : "black") ? "win" : game.winner ? "loss" : null;
	let status;
	if (game.status === "waiting") status = "Finding you an opponent…";
	else if (game.status === "finished") status = myResult === "draw" ? "Draw" : myResult === "win" ? "You won!" : "You lost.";
	else if (myTurn) status = chess?.inCheck() ? "Your move — you're in check" : "Your move";
	else status = `Waiting for ${opponentName ?? "your opponent"}…`;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Shell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col items-center gap-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-3 shadow-[var(--shadow-panel)]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-medium text-card-foreground",
					children: status
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs text-muted-foreground",
					children: [
						"You play",
						" ",
						myColor === "w" ? "White" : "Black",
						opponentName ? ` · vs ${opponentName}` : "",
						botName ? " · COMPUTER" : ""
					]
				})] })
			}),
			game.status === "waiting" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-lg border border-border bg-card px-4 py-3 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-medium text-card-foreground",
					children: "Waiting for an opponent"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs text-muted-foreground",
					children: "If nobody joins within 30 seconds, a computer opponent will automatically start the game."
				})]
			}),
			botName && game.status === "active" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-lg border border-border bg-card px-4 py-2 text-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs text-muted-foreground",
					children: [
						"You are playing against",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-semibold text-card-foreground",
							children: botName
						})
					]
				})
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
							onClick: async () => {
								try {
									await resign({ data: { gameId } });
								} catch (e) {
									setError(e instanceof Error ? e.message.replace(/^Error:\s*/, "") : "Could not resign.");
								}
							},
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
									children: [
										opponentName ?? "Your opponent",
										" ",
										"offers a draw."
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: async () => {
										setIncomingDraw(false);
										try {
											await draw({ data: { gameId } });
										} catch (e) {
											setError(e instanceof Error ? e.message.replace(/^Error:\s*/, "") : "Could not accept the draw.");
										}
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
								children: BOARD_THEMES.map((boardTheme) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setTheme(boardTheme.id),
									className: `rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${theme === boardTheme.id ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"}`,
									children: boardTheme.label
								}, boardTheme.id))
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
				className: "text-center text-sm text-destructive",
				children: error
			})
		]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameOverDialog, {
		open: game.status === "finished" && showResult,
		headline: game.winner === "draw" ? "Draw" : myResult === "win" ? "You won!" : "You lost",
		detail: game.winner === "draw" ? "The game ended in a draw." : chess?.isCheckmate() ? "Checkmate ended the game." : "The game is over.",
		history,
		whiteLabel: myColor === "w" ? username ?? "You" : opponentName ?? "White",
		blackLabel: myColor === "b" ? username ?? "You" : opponentName ?? "Black",
		reportSlot: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportPanel, { gameId }),
		onReview: (review) => {
			sendFairPlay({ data: {
				gameId,
				stats: ["w", "b"].map((color) => ({
					color,
					engineMatch: review.fairPlay[color].engineMatch,
					accuracy: review.fairPlay[color].accuracy,
					moves: review.fairPlay[color].moves,
					suspicion: review.fairPlay[color].suspicion
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
