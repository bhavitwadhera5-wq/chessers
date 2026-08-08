import { n as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as supabase } from "./client-BGr9uG5A.mjs";
import { n as Route, r as useAuth } from "./router-B_EKXhaC.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/play._gameId-Cp0IAoCc.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var START_BOARD = [
	[
		{
			type: "r",
			color: "b"
		},
		{
			type: "n",
			color: "b"
		},
		{
			type: "b",
			color: "b"
		},
		{
			type: "q",
			color: "b"
		},
		{
			type: "k",
			color: "b"
		},
		{
			type: "b",
			color: "b"
		},
		{
			type: "n",
			color: "b"
		},
		{
			type: "r",
			color: "b"
		}
	],
	[
		{
			type: "p",
			color: "b"
		},
		{
			type: "p",
			color: "b"
		},
		{
			type: "p",
			color: "b"
		},
		{
			type: "p",
			color: "b"
		},
		{
			type: "p",
			color: "b"
		},
		{
			type: "p",
			color: "b"
		},
		{
			type: "p",
			color: "b"
		},
		{
			type: "p",
			color: "b"
		}
	],
	[
		null,
		null,
		null,
		null,
		null,
		null,
		null,
		null
	],
	[
		null,
		null,
		null,
		null,
		null,
		null,
		null,
		null
	],
	[
		null,
		null,
		null,
		null,
		null,
		null,
		null,
		null
	],
	[
		null,
		null,
		null,
		null,
		null,
		null,
		null,
		null
	],
	[
		{
			type: "p",
			color: "w"
		},
		{
			type: "p",
			color: "w"
		},
		{
			type: "p",
			color: "w"
		},
		{
			type: "p",
			color: "w"
		},
		{
			type: "p",
			color: "w"
		},
		{
			type: "p",
			color: "w"
		},
		{
			type: "p",
			color: "w"
		},
		{
			type: "p",
			color: "w"
		}
	],
	[
		{
			type: "r",
			color: "w"
		},
		{
			type: "n",
			color: "w"
		},
		{
			type: "b",
			color: "w"
		},
		{
			type: "q",
			color: "w"
		},
		{
			type: "k",
			color: "w"
		},
		{
			type: "b",
			color: "w"
		},
		{
			type: "n",
			color: "w"
		},
		{
			type: "r",
			color: "w"
		}
	]
];
var PIECES = {
	wp: "♙",
	wr: "♖",
	wn: "♘",
	wb: "♗",
	wq: "♕",
	wk: "♔",
	bp: "♟",
	br: "♜",
	bn: "♞",
	bb: "♝",
	bq: "♛",
	bk: "♚"
};
function cloneBoard(board) {
	return board.map((row) => row.map((piece) => piece ? { ...piece } : null));
}
function parseBoard(fen) {
	if (!fen || fen === "start") return cloneBoard(START_BOARD);
	try {
		const parsed = JSON.parse(fen);
		if (Array.isArray(parsed) && parsed.length === 8 && parsed.every((row) => Array.isArray(row) && row.length === 8)) return parsed;
	} catch {}
	return cloneBoard(START_BOARD);
}
function inside(row, col) {
	return row >= 0 && row < 8 && col >= 0 && col < 8;
}
function clearPath(board, fr, fc, tr, tc) {
	const rowStep = Math.sign(tr - fr);
	const colStep = Math.sign(tc - fc);
	let row = fr + rowStep;
	let col = fc + colStep;
	while (row !== tr || col !== tc) {
		if (board[row][col]) return false;
		row += rowStep;
		col += colStep;
	}
	return true;
}
function pieceCanMove(board, from, to, color) {
	const [fr, fc] = from;
	const [tr, tc] = to;
	if (!inside(tr, tc)) return false;
	const piece = board[fr][fc];
	const target = board[tr][tc];
	if (!piece || piece.color !== color) return false;
	if (target?.color === color) return false;
	if (target?.type === "k") return false;
	const dr = tr - fr;
	const dc = tc - fc;
	const adr = Math.abs(dr);
	const adc = Math.abs(dc);
	switch (piece.type) {
		case "p": {
			const direction = color === "w" ? -1 : 1;
			const startRow = color === "w" ? 6 : 1;
			if (dc === 0 && dr === direction && !target) return true;
			if (dc === 0 && dr === direction * 2 && fr === startRow && !target && !board[fr + direction][fc]) return true;
			if (adc === 1 && dr === direction && target && target.color !== color && target.type !== "k") return true;
			return false;
		}
		case "r": return (dr === 0 || dc === 0) && clearPath(board, fr, fc, tr, tc);
		case "b": return adr === adc && clearPath(board, fr, fc, tr, tc);
		case "q": return (dr === 0 || dc === 0 || adr === adc) && clearPath(board, fr, fc, tr, tc);
		case "n": return adr === 2 && adc === 1 || adr === 1 && adc === 2;
		case "k": return adr <= 1 && adc <= 1;
		default: return false;
	}
}
function attacksSquare(board, from, to) {
	const [fr, fc] = from;
	const [tr, tc] = to;
	if (!inside(tr, tc)) return false;
	const piece = board[fr][fc];
	if (!piece) return false;
	const dr = tr - fr;
	const dc = tc - fc;
	const adr = Math.abs(dr);
	const adc = Math.abs(dc);
	if (piece.type === "p") return dr === (piece.color === "w" ? -1 : 1) && adc === 1;
	if (piece.type === "n") return adr === 2 && adc === 1 || adr === 1 && adc === 2;
	if (piece.type === "k") return adr <= 1 && adc <= 1;
	if (piece.type === "r") return (dr === 0 || dc === 0) && clearPath(board, fr, fc, tr, tc);
	if (piece.type === "b") return adr === adc && clearPath(board, fr, fc, tr, tc);
	if (piece.type === "q") return (dr === 0 || dc === 0 || adr === adc) && clearPath(board, fr, fc, tr, tc);
	return false;
}
function findKing(board, color) {
	for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) {
		const piece = board[row][col];
		if (piece?.type === "k" && piece.color === color) return [row, col];
	}
	return null;
}
function isInCheck(board, color) {
	const king = findKing(board, color);
	if (!king) return true;
	const opponent = color === "w" ? "b" : "w";
	for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) {
		const piece = board[row][col];
		if (!piece || piece.color !== opponent) continue;
		if (attacksSquare(board, [row, col], king)) return true;
	}
	return false;
}
function tryMove(board, from, to, color) {
	if (!pieceCanMove(board, from, to, color)) return null;
	if (board[to[0]][to[1]]?.type === "k") return null;
	const next = cloneBoard(board);
	next[to[0]][to[1]] = next[from[0]][from[1]];
	next[from[0]][from[1]] = null;
	const movedPiece = next[to[0]][to[1]];
	if (movedPiece?.type === "p" && (movedPiece.color === "w" && to[0] === 0 || movedPiece.color === "b" && to[0] === 7)) next[to[0]][to[1]] = {
		type: "q",
		color: movedPiece.color
	};
	if (isInCheck(next, color)) return null;
	return next;
}
function hasLegalMove(board, color) {
	for (let fr = 0; fr < 8; fr++) for (let fc = 0; fc < 8; fc++) {
		const piece = board[fr][fc];
		if (!piece || piece.color !== color) continue;
		for (let tr = 0; tr < 8; tr++) for (let tc = 0; tc < 8; tc++) if (tryMove(board, [fr, fc], [tr, tc], color)) return true;
	}
	return false;
}
function getGameState(board, turn) {
	const inCheck = isInCheck(board, turn);
	const hasMove = hasLegalMove(board, turn);
	if (inCheck && !hasMove) return {
		status: "checkmate",
		inCheck: true,
		winner: turn === "w" ? "b" : "w"
	};
	if (!inCheck && !hasMove) return {
		status: "stalemate",
		inCheck: false,
		winner: null
	};
	return {
		status: "playing",
		inCheck,
		winner: null
	};
}
function OnlineGame() {
	const navigate = useNavigate();
	const { user } = useAuth();
	const { gameId } = Route.useParams();
	const [game, setGame] = (0, import_react.useState)(null);
	const [board, setBoard] = (0, import_react.useState)(cloneBoard(START_BOARD));
	const [selected, setSelected] = (0, import_react.useState)(null);
	const [message, setMessage] = (0, import_react.useState)("Loading game...");
	const [connected, setConnected] = (0, import_react.useState)(false);
	const [result, setResult] = (0, import_react.useState)(null);
	const [showResult, setShowResult] = (0, import_react.useState)(false);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const myColor = (0, import_react.useMemo)(() => {
		if (!user || !game) return null;
		if (game.white_player === user.id) return "w";
		if (game.black_player === user.id) return "b";
		return null;
	}, [game, user]);
	function showGameStatus(currentGame, currentBoard) {
		if (currentGame.status === "waiting") {
			setMessage("Waiting for another player...");
			return;
		}
		if (currentGame.status === "finished") {
			if (currentGame.winner && user?.id === currentGame.winner) {
				setResult("won");
				setShowResult(true);
				setMessage("YOU WON!");
			} else if (currentGame.winner) {
				setResult("lost");
				setShowResult(true);
				setMessage("YOU LOST");
			} else {
				setResult("draw");
				setShowResult(true);
				setMessage("DRAW");
			}
			return;
		}
		const state = getGameState(currentBoard, currentGame.turn);
		if (state.status === "checkmate") {
			const winnerId = state.winner === "w" ? currentGame.white_player : currentGame.black_player;
			if (winnerId && user?.id === winnerId) {
				setResult("won");
				setShowResult(true);
				setMessage("CHECKMATE — YOU WON!");
			} else {
				setResult("lost");
				setShowResult(true);
				setMessage("CHECKMATE — YOU LOST!");
			}
			return;
		}
		if (state.status === "stalemate") {
			setResult("draw");
			setShowResult(true);
			setMessage("STALEMATE — DRAW!");
			return;
		}
		if (state.inCheck) {
			setMessage(currentGame.turn === "w" ? "WHITE IS IN CHECK!" : "BLACK IS IN CHECK!");
			return;
		}
		setMessage(currentGame.turn === "w" ? "White to move" : "Black to move");
	}
	(0, import_react.useEffect)(() => {
		let active = true;
		async function loadGame() {
			const { data, error } = await supabase.from("games").select("*").eq("id", gameId).single();
			if (!active) return;
			if (error) {
				setMessage(error.message);
				return;
			}
			const loaded = data;
			const loadedBoard = parseBoard(loaded.fen);
			setGame(loaded);
			setBoard(loadedBoard);
			showGameStatus(loaded, loadedBoard);
		}
		loadGame();
		const channel = supabase.channel(`chess-game-${gameId}`).on("postgres_changes", {
			event: "UPDATE",
			schema: "public",
			table: "games",
			filter: `id=eq.${gameId}`
		}, (payload) => {
			const updated = payload.new;
			const updatedBoard = parseBoard(updated.fen);
			setGame(updated);
			setBoard(updatedBoard);
			setSelected(null);
			showGameStatus(updated, updatedBoard);
		}).subscribe((status) => {
			setConnected(status === "SUBSCRIBED");
		});
		return () => {
			active = false;
			supabase.removeChannel(channel);
		};
	}, [gameId]);
	async function makeMove(from, to) {
		if (!game || !user || !myColor || busy) return;
		if (game.status !== "playing") return;
		if (game.turn !== myColor) {
			setMessage("Wait for your turn.");
			return;
		}
		const newBoard = tryMove(board, from, to, myColor);
		if (!newBoard) {
			setMessage("Illegal move.");
			return;
		}
		const nextTurn = myColor === "w" ? "b" : "w";
		const state = getGameState(newBoard, nextTurn);
		let status = "playing";
		let winner = null;
		if (state.status === "checkmate") {
			status = "finished";
			winner = myColor === "w" ? game.white_player : game.black_player;
		} else if (state.status === "stalemate") {
			status = "finished";
			winner = null;
		}
		setBoard(newBoard);
		setSelected(null);
		setBusy(true);
		const { error } = await supabase.from("games").update({
			fen: JSON.stringify(newBoard),
			turn: nextTurn,
			status,
			winner,
			updated_at: (/* @__PURE__ */ new Date()).toISOString()
		}).eq("id", game.id);
		setBusy(false);
		if (error) {
			setMessage(error.message);
			return;
		}
		const updatedGame = {
			...game,
			fen: JSON.stringify(newBoard),
			turn: nextTurn,
			status,
			winner
		};
		setGame(updatedGame);
		showGameStatus(updatedGame, newBoard);
	}
	async function resignGame() {
		if (!game || !user || !myColor || busy) return;
		if (game.status !== "playing") return;
		if (!window.confirm("Are you sure you want to resign?")) return;
		setBusy(true);
		const winner = myColor === "w" ? game.black_player : game.white_player;
		const { error } = await supabase.from("games").update({
			status: "finished",
			winner,
			updated_at: (/* @__PURE__ */ new Date()).toISOString()
		}).eq("id", game.id).eq("status", "playing");
		setBusy(false);
		if (error) {
			setMessage(error.message);
			return;
		}
		const updatedGame = {
			...game,
			status: "finished",
			winner
		};
		setGame(updatedGame);
		setResult("lost");
		setShowResult(true);
		setMessage("YOU RESIGNED");
	}
	function handleSquareClick(displayRow, displayCol) {
		if (!game || !user || !myColor || busy) return;
		if (game.status !== "playing") return;
		if (game.turn !== myColor) {
			setMessage("Wait for your turn.");
			return;
		}
		const actualRow = myColor === "b" ? 7 - displayRow : displayRow;
		const actualCol = myColor === "b" ? 7 - displayCol : displayCol;
		const piece = board[actualRow][actualCol];
		if (!selected) {
			if (piece && piece.color === myColor) {
				setSelected([actualRow, actualCol]);
				setMessage("Select a legal destination.");
			}
			return;
		}
		if (selected[0] === actualRow && selected[1] === actualCol) {
			setSelected(null);
			return;
		}
		if (piece && piece.color === myColor) {
			setSelected([actualRow, actualCol]);
			return;
		}
		makeMove(selected, [actualRow, actualCol]);
	}
	if (!game) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "text-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xl font-bold",
				children: "Loading game..."
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted-foreground",
				children: message
			})]
		})
	});
	const displayBoard = myColor === "b" ? [...board].reverse().map((row) => [...row].reverse()) : board;
	const displaySelected = selected && myColor === "b" ? [7 - selected[0], 7 - selected[1]] : selected;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "min-h-screen bg-background px-4 py-8",
		children: [showResult && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-5",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-2xl",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-7xl",
						children: result === "won" ? "🏆" : result === "lost" ? "😔" : "🤝"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-5 text-4xl font-black",
						children: result === "won" ? "YOU WON!" : result === "lost" ? "YOU LOST" : "DRAW"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-muted-foreground",
						children: result === "won" ? "Checkmate! Excellent game." : result === "lost" ? "Good game. Try again!" : "The game ended in a draw."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => {
							setShowResult(false);
							navigate({ to: "/online" });
						},
						className: "mt-7 w-full rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground transition-opacity hover:opacity-90",
						children: "Back to Online"
					})
				]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-3xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => navigate({ to: "/online" }),
					className: "mb-5 text-sm text-muted-foreground transition-colors hover:text-foreground",
					children: "← Back to Online"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-5 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground",
							children: "Multiplayer Chess"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
							className: "mt-2 text-3xl font-black",
							children: [
								game.white_username ?? "White",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mx-2 text-muted-foreground",
									children: "vs"
								}),
								game.black_username ?? "Waiting..."
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex flex-wrap justify-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "rounded-full border border-border px-3 py-1 text-sm",
								children: [
									"You are",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: myColor === "w" ? "White" : myColor === "b" ? "Black" : "Spectator" })
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `rounded-full px-3 py-1 text-sm ${connected ? "bg-green-500/15 text-green-400" : "bg-destructive/15 text-destructive"}`,
								children: connected ? "● Live" : "● Connecting..."
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: `mt-3 font-bold ${message.includes("CHECK") ? "text-red-500" : ""}`,
							children: message
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto max-w-[680px] overflow-hidden rounded-2xl border-4 border-border shadow-2xl",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-8",
						children: displayBoard.map((row, displayRow) => row.map((piece, displayCol) => {
							const dark = (displayRow + displayCol) % 2 === 1;
							const selectedHere = displaySelected?.[0] === displayRow && displaySelected?.[1] === displayCol;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => handleSquareClick(displayRow, displayCol),
								className: `
                          relative
                          aspect-square
                          flex
                          items-center
                          justify-center
                          select-none
                          ${dark ? "bg-[#9b4a00]" : "bg-[#fff3c4]"}
                          ${selectedHere ? "ring-4 ring-inset ring-yellow-400" : ""}
                          ${piece?.color === myColor ? "cursor-pointer" : "cursor-default"}
                        `,
								children: [piece && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `
                              relative
                              z-10
                              font-serif
                              text-[clamp(2.5rem,8vw,4.7rem)]
                              leading-none
                              ${piece.color === "w" ? "text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.95),0_0_2px_#000]" : "text-[#111] [text-shadow:0_1px_3px_rgba(255,255,255,0.8)]"}
                            `,
									children: PIECES[`${piece.color}${piece.type}`]
								}), selectedHere && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "pointer-events-none absolute inset-1 rounded-lg border-4 border-yellow-400" })]
							}, `${displayRow}-${displayCol}`);
						}))
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto mt-5 grid max-w-[680px] grid-cols-2 gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl border border-border bg-card p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs uppercase tracking-wide text-muted-foreground",
							children: "White"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 font-bold",
							children: game.white_username ?? "Waiting..."
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl border border-border bg-card p-4 text-right",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs uppercase tracking-wide text-muted-foreground",
							children: "Black"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 font-bold",
							children: game.black_username ?? "Waiting..."
						})]
					})]
				}),
				game.status === "playing" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto mt-4 max-w-[680px]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: busy,
						onClick: resignGame,
						className: "w-full rounded-xl border border-destructive/40 px-5 py-3 font-bold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50",
						children: "🏳️ Resign"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto mt-4 max-w-[680px] rounded-xl border border-border bg-card p-4 text-center",
					children: game.status === "waiting" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "Waiting for another player to join..."
					}) : game.status === "finished" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-bold",
						children: message
					}) : game.turn === myColor ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-bold",
						children: "Your turn — select a piece."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "Opponent's turn."
					})
				})
			]
		})]
	});
}
//#endregion
export { OnlineGame as component };
