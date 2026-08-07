import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as Chess } from "../_libs/chess.js.mjs";
import { a as getBot, c as readAllElo, d as startElo, f as writeElo, i as evaluate, l as readElo, n as BOT_TIERS, o as nextElo, r as botMove, t as BOTS } from "./engine-BXikbV55.mjs";
import { t as BOARD_THEMES } from "./boardThemes-CqnkWAfd.mjs";
import { a as soundEnabled, i as setSoundEnabled, n as playMoveSound, t as BoardView } from "./sounds-6KmV21qp.mjs";
import { n as MoveList, t as GameOverDialog } from "./MoveList-DNL6uaMB.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/solo-Bq7Y38L9.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var TIMERS = [
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
var SIDES = [
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
function fmt(ms) {
	const total = Math.max(0, Math.ceil(ms / 1e3));
	const m = Math.floor(total / 60);
	const s = total % 60;
	return `${m}:${String(s).padStart(2, "0")}`;
}
function ChessBoard() {
	const [game] = (0, import_react.useState)(() => new Chess());
	const [started, setStarted] = (0, import_react.useState)(false);
	const [fen, setFen] = (0, import_react.useState)(game.fen());
	const [selected, setSelected] = (0, import_react.useState)(null);
	const [thinking, setThinking] = (0, import_react.useState)(false);
	const [level, setLevel] = (0, import_react.useState)("medium");
	const [theme, setTheme] = (0, import_react.useState)("green");
	const [sideChoice, setSideChoice] = (0, import_react.useState)("w");
	const [mySide, setMySide] = (0, import_react.useState)("w");
	const [minutes, setMinutes] = (0, import_react.useState)(0);
	const [clock, setClock] = (0, import_react.useState)({
		w: 0,
		b: 0
	});
	const [over, setOver] = (0, import_react.useState)(null);
	const [elo, setElo] = (0, import_react.useState)(() => startElo("medium"));
	const [ratings, setRatings] = (0, import_react.useState)({});
	const [eloDelta, setEloDelta] = (0, import_react.useState)(null);
	const [note, setNote] = (0, import_react.useState)(null);
	const [confirmNew, setConfirmNew] = (0, import_react.useState)(false);
	const scored = (0, import_react.useRef)(false);
	const tickRef = (0, import_react.useRef)(Date.now());
	const [sound, setSound] = (0, import_react.useState)(true);
	(0, import_react.useEffect)(() => setSound(soundEnabled()), []);
	(0, import_react.useEffect)(() => setRatings(readAllElo()), []);
	(0, import_react.useEffect)(() => setElo(readElo(level)), [level]);
	const botSide = mySide === "w" ? "b" : "w";
	const board = (0, import_react.useMemo)(() => game.board(), [fen, game]);
	const history = (0, import_react.useMemo)(() => game.history({ verbose: true }), [fen, game]);
	const destinations = (0, import_react.useMemo)(() => {
		if (!selected) return /* @__PURE__ */ new Set();
		return new Set(game.moves({
			square: selected,
			verbose: true
		}).map((m) => m.to));
	}, [
		selected,
		fen,
		game
	]);
	const lastMove = history[history.length - 1] ?? null;
	const checkSquare = (0, import_react.useMemo)(() => {
		if (!game.inCheck()) return null;
		const turn = game.turn();
		for (const row of game.board()) for (const cell of row) if (cell && cell.type === "k" && cell.color === turn) return cell.square;
		return null;
	}, [fen, game]);
	const finished = !!over;
	const finish = (0, import_react.useCallback)((headline, detail, result) => {
		if (scored.current) return;
		scored.current = true;
		const botElo = getBot(level).elo;
		const current = readElo(level);
		const updated = nextElo(current, botElo, result);
		writeElo(level, updated);
		setElo(updated);
		setRatings(readAllElo());
		setEloDelta(updated - current);
		setOver({
			headline,
			detail
		});
	}, [level]);
	const checkEnd = (0, import_react.useCallback)(() => {
		if (!game.isGameOver()) return false;
		if (game.isCheckmate()) {
			const iWon = game.turn() === botSide;
			finish(iWon ? "Checkmate — you win!" : "Checkmate — the bot wins", iWon ? "You delivered mate." : "Your king has no escape.", iWon ? 1 : 0);
		} else finish("Draw", game.isStalemate() ? "Stalemate." : "Drawn position.", .5);
		return true;
	}, [
		game,
		finish,
		botSide
	]);
	const aiMove = (0, import_react.useCallback)(() => {
		const move = botMove(game.fen(), level);
		if (!move) return;
		const played = game.move({
			from: move.from,
			to: move.to,
			promotion: move.promotion
		});
		setFen(game.fen());
		playMoveSound({
			captured: !!played?.captured,
			check: game.inCheck(),
			over: game.isGameOver()
		});
	}, [game, level]);
	(0, import_react.useEffect)(() => {
		if (!started) return;
		if (finished || game.turn() !== botSide || game.isGameOver()) {
			checkEnd();
			return;
		}
		setThinking(true);
		const t = setTimeout(() => {
			aiMove();
			setThinking(false);
			checkEnd();
		}, 250);
		return () => clearTimeout(t);
	}, [
		fen,
		game,
		aiMove,
		checkEnd,
		finished,
		started,
		botSide
	]);
	(0, import_react.useEffect)(() => {
		if (!started || !minutes || finished || game.isGameOver()) return;
		tickRef.current = Date.now();
		const id = setInterval(() => {
			const now = Date.now();
			const elapsed = now - tickRef.current;
			tickRef.current = now;
			setClock((c) => {
				const side = game.turn();
				const next = {
					...c,
					[side]: c[side] - elapsed
				};
				if (next[side] <= 0) {
					next[side] = 0;
					const iLost = side === mySide;
					finish(iLost ? "Time out — the bot wins" : "Time out — you win!", "The clock ran out.", iLost ? 0 : 1);
				}
				return next;
			});
		}, 200);
		return () => clearInterval(id);
	}, [
		minutes,
		finished,
		game,
		finish,
		started,
		mySide
	]);
	const handleClick = (square) => {
		if (!started || finished || game.isGameOver() || game.turn() !== mySide || thinking) return;
		const piece = game.get(square);
		if (piece && piece.color === mySide) {
			setSelected(square === selected ? null : square);
			return;
		}
		if (!selected) return;
		try {
			const played = game.move({
				from: selected,
				to: square,
				promotion: "q"
			});
			setFen(game.fen());
			playMoveSound({
				captured: !!played?.captured,
				check: game.inCheck(),
				over: game.isGameOver()
			});
			checkEnd();
		} catch {}
		setSelected(null);
	};
	const start = () => {
		const side = sideChoice === "random" ? Math.random() < .5 ? "w" : "b" : sideChoice;
		game.reset();
		scored.current = false;
		setMySide(side);
		setSelected(null);
		setThinking(false);
		setOver(null);
		setEloDelta(null);
		setNote(null);
		setConfirmNew(false);
		setClock({
			w: minutes * 6e4,
			b: minutes * 6e4
		});
		setFen(game.fen());
		setStarted(true);
	};
	const reset = () => {
		game.reset();
		scored.current = false;
		setSelected(null);
		setThinking(false);
		setOver(null);
		setEloDelta(null);
		setNote(null);
		setConfirmNew(false);
		setClock({
			w: minutes * 6e4,
			b: minutes * 6e4
		});
		setFen(game.fen());
	};
	const offerDraw = () => {
		if (finished) return;
		const score = evaluate(game);
		if (Math.abs(score) < 120) finish("Draw agreed", "The bot accepted your draw offer.", .5);
		else setNote("The bot declined your draw offer.");
	};
	const resign = () => {
		if (finished) return;
		finish("You resigned", "The bot takes the point.", 0);
	};
	if (!started) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-panel)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-serif text-2xl font-bold tracking-tight text-card-foreground",
				children: "Set up your game"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-sm text-muted-foreground",
				children: [
					"Answer a few questions, then press Start. Your rating vs ",
					getBot(level).label,
					" is ",
					elo,
					"."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 flex flex-col gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Group, {
						label: "Which colour do you want to play?",
						children: SIDES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
							active: sideChoice === s.id,
							onClick: () => setSideChoice(s.id),
							children: s.label
						}, s.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl border border-border bg-card p-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground",
							children: "Choose your opponent"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "max-h-72 space-y-3 overflow-y-auto pr-1",
							children: BOT_TIERS.map((tier) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
								children: tier
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid grid-cols-2 gap-1.5",
								children: BOTS.filter((b) => b.tier === tier).map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => setLevel(b.id),
									className: `rounded-lg border px-2 py-1.5 text-left text-xs transition-colors ${level === b.id ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:bg-secondary"}`,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "block font-semibold text-foreground",
											children: [
												b.label,
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-muted-foreground",
													children: b.elo
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "block truncate",
											children: b.blurb
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "block text-[10px] uppercase tracking-wide text-muted-foreground",
											children: ["you: ", ratings[b.id] ?? startElo(b.id)]
										})
									]
								}, b.id))
							})] }, tier))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Group, {
						label: "Do you want a clock?",
						children: TIMERS.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
							active: minutes === t.id,
							onClick: () => setMinutes(t.id),
							children: t.label
						}, t.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Group, {
						label: "Which board do you like?",
						children: BOARD_THEMES.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
							active: theme === t.id,
							onClick: () => setTheme(t.id),
							children: t.label
						}, t.id))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: start,
				className: "mt-5 w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90",
				children: "Start game"
			})
		]
	});
	const myTurn = game.turn() === mySide;
	const inProgress = !finished && history.length > 0;
	const status = finished ? over.headline : thinking ? "Bot is thinking…" : game.inCheck() && myTurn ? `Your turn (${mySide === "w" ? "White" : "Black"}) — you're in check` : myTurn ? `Your turn (${mySide === "w" ? "White" : "Black"})` : "Bot's turn";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col items-center gap-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-3 shadow-[var(--shadow-panel)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `size-2.5 rounded-full ${thinking ? "bg-accent" : "bg-primary"} animate-pulse` }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-medium tracking-tight text-card-foreground",
						children: status
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted-foreground",
					children: [
						"vs ",
						getBot(level).label,
						" — your rating ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-semibold text-foreground",
							children: elo
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex w-full flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BoardView, {
					board,
					selected,
					destinations,
					lastMove: lastMove ? {
						from: lastMove.from,
						to: lastMove.to
					} : null,
					flipped: mySide === "b",
					theme,
					checkSquare,
					onSquareClick: handleClick,
					onDropMove: (from, to) => {
						setSelected(from);
						handleClick(to);
					}
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: "flex w-full flex-col gap-3 sm:w-52",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MoveList, {
							history,
							whiteLabel: mySide === "w" ? "You" : "Bot",
							blackLabel: mySide === "b" ? "You" : "Bot"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => {
								const next = !sound;
								setSound(next);
								setSoundEnabled(next);
							},
							className: "rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary",
							children: ["Sound: ", sound ? "On" : "Off"]
						}),
						minutes > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-xl border border-border bg-card p-3 text-center",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs uppercase tracking-wide text-muted-foreground",
									children: "Bot"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xl font-semibold text-foreground",
									children: fmt(clock[botSide])
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-xs uppercase tracking-wide text-muted-foreground",
									children: "You"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xl font-semibold text-foreground",
									children: fmt(clock[mySide])
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: resign,
							className: "rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary",
							children: "Resign"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: offerDraw,
							className: "rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary",
							children: "Offer draw"
						}),
						confirmNew ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2 rounded-xl border border-border bg-card p-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: "A match is in progress. Leaving it now abandons the game without a rating change."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: reset,
									className: "w-full rounded-md bg-primary px-2 py-1.5 text-xs font-semibold text-primary-foreground",
									children: "Abandon & start new"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => {
										setStarted(false);
										reset();
									},
									className: "w-full rounded-md border border-border px-2 py-1.5 text-xs text-muted-foreground",
									children: "Abandon & change settings"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setConfirmNew(false),
									className: "w-full rounded-md border border-border px-2 py-1.5 text-xs text-muted-foreground",
									children: "Keep playing"
								})
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => inProgress ? setConfirmNew(true) : reset(),
							className: "rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90",
							children: "New game"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => {
								if (inProgress) {
									setConfirmNew(true);
									return;
								}
								setStarted(false);
								reset();
							},
							className: "rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground",
							children: "Change settings"
						})] }),
						note && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: note
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Group, {
							label: "Board",
							children: BOARD_THEMES.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
								active: theme === t.id,
								onClick: () => setTheme(t.id),
								children: t.label
							}, t.id))
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameOverDialog, {
				open: finished,
				headline: over?.headline ?? "",
				detail: over?.detail,
				history,
				whiteLabel: mySide === "w" ? "You" : `${getBot(level).label} (${getBot(level).elo})`,
				blackLabel: mySide === "b" ? "You" : `${getBot(level).label} (${getBot(level).elo})`,
				extra: eloDelta !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground",
					children: [
						"Elo ",
						elo - eloDelta,
						" →",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-semibold text-foreground",
							children: elo
						}),
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: eloDelta >= 0 ? "text-accent" : "text-destructive",
							children: [
								"(",
								eloDelta >= 0 ? "+" : "",
								eloDelta,
								")"
							]
						})
					]
				}) : null,
				onRematch: reset,
				onClose: () => setOver(null)
			})
		]
	});
}
function Group({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl border border-border bg-card p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex flex-wrap gap-1.5",
			children
		})]
	});
}
function Choice({ active, onClick, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		onClick,
		className: `rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${active ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"}`,
		children
	});
}
function Solo() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "flex min-h-screen flex-col items-center bg-background px-4 py-8",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-3xl",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "mb-8 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					className: "text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground",
					children: "← Home"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-3 font-serif text-4xl font-bold tracking-tight text-foreground",
					children: "You vs the Bot"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChessBoard, {})]
		})
	});
}
//#endregion
export { Solo as component };
