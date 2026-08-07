import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { t as Chess } from "../_libs/chess.js.mjs";
import { u as reviewGame } from "./engine-BXikbV55.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/MoveList-DNL6uaMB.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var TAG_COLOR = {
	Best: "text-accent",
	Great: "text-accent",
	Good: "text-foreground",
	Inaccuracy: "text-primary",
	Mistake: "text-primary",
	Blunder: "text-destructive"
};
function GameOverDialog({ open, headline, detail, history, whiteLabel, blackLabel, extra, reportSlot, onReview, onClose, onRematch }) {
	const [review, setReview] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!open) {
			setReview(null);
			setBusy(false);
		}
	}, [open]);
	if (!open) return null;
	const runReview = () => {
		setBusy(true);
		setTimeout(() => {
			const result = reviewGame(history);
			setReview(result);
			onReview?.(result);
			setBusy(false);
		}, 30);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-h-[88vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-panel)]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-serif text-2xl font-bold text-card-foreground",
					children: headline
				}),
				detail && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: detail
				}),
				extra && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4",
					children: extra
				}),
				!review ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: runReview,
					disabled: busy || history.length === 0,
					className: "mt-5 w-full rounded-lg bg-primary px-4 py-2.5 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50",
					children: busy ? "Analysing every move…" : "Game review & scorecard"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-2 gap-3",
							children: [[whiteLabel, review.accuracy.w], [blackLabel, review.accuracy.b]].map(([name, acc]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-xl border border-border p-3 text-center",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate text-xs uppercase tracking-wide text-muted-foreground",
										children: name
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-1 text-2xl font-bold text-foreground",
										children: [acc, "%"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted-foreground",
										children: "accuracy"
									})
								]
							}, name))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-xl border border-border px-3 py-2 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs uppercase tracking-wide text-muted-foreground",
								children: "Opening"
							}), review.opening ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-0.5 text-foreground",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono text-xs text-muted-foreground",
										children: review.opening.eco
									}),
									" ",
									review.opening.name,
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-muted-foreground",
										children: [" · book to move ", Math.ceil(review.opening.ply / 2)]
									})
								]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-0.5 text-muted-foreground",
								children: "Unnamed / irregular opening"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-2 gap-3 text-xs",
							children: [[whiteLabel, review.fairPlay.w], [blackLabel, review.fairPlay.b]].map(([name, fp]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-xl border border-border p-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate uppercase tracking-wide text-muted-foreground",
										children: name
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-1 text-foreground",
										children: ["Engine match ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "font-semibold",
											children: [fp.engineMatch, "%"]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: fp.suspicion === "high" ? "text-destructive" : fp.suspicion === "review" ? "text-primary" : "text-accent",
										children: [
											"Fair play:",
											" ",
											fp.suspicion === "high" ? "engine-like" : fp.suspicion === "review" ? "worth a look" : "clean"
										]
									})
								]
							}, name))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-3 gap-2 text-center text-xs",
							children: Object.entries(review.counts).map(([tag, n]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-lg border border-border px-2 py-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: `text-base font-semibold ${TAG_COLOR[tag]}`,
									children: n
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-muted-foreground",
									children: tag
								})]
							}, tag))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "max-h-56 overflow-y-auto rounded-xl border border-border",
							children: review.moves.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between border-b border-border px-3 py-1.5 text-sm last:border-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-muted-foreground",
									children: [
										Math.ceil(m.ply / 2),
										m.color === "w" ? "." : "…",
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-foreground",
											children: m.san
										}),
										m.eco && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "ml-1 text-xs text-muted-foreground",
											children: [
												m.eco,
												" ",
												m.opening
											]
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: TAG_COLOR[m.tag],
									children: m.book ? "Book" : m.tag
								})]
							}, m.ply))
						})
					]
				}),
				reportSlot && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-5",
					children: reportSlot
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 flex gap-2",
					children: [onRematch && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: onRematch,
						className: "flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary",
						children: "New game"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: onClose,
						className: "flex-1 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-secondary-foreground",
						children: "Close"
					})]
				})
			]
		})
	});
}
var GLYPH = {
	k: "♚",
	q: "♛",
	r: "♜",
	b: "♝",
	n: "♞",
	p: "♟"
};
var VALUE = {
	p: 1,
	n: 3,
	b: 3,
	r: 5,
	q: 9,
	k: 0
};
function capturedBy(history, color) {
	return history.filter((m) => m.color === color && m.captured).map((m) => m.captured).sort((a, b) => VALUE[b] - VALUE[a]);
}
function toPgn(history, whiteLabel, blackLabel) {
	const replay = new Chess();
	for (const m of history) try {
		replay.move({
			from: m.from,
			to: m.to,
			promotion: m.promotion
		});
	} catch {
		break;
	}
	replay.setHeader("Event", "Chessers");
	replay.setHeader("Date", (/* @__PURE__ */ new Date()).toISOString().slice(0, 10).replace(/-/g, "."));
	replay.setHeader("White", whiteLabel);
	replay.setHeader("Black", blackLabel);
	return replay.pgn();
}
/** Notation panel with captured material and PGN export. */
function MoveList({ history, whiteLabel = "White", blackLabel = "Black", onSelectPly, activePly }) {
	const [copied, setCopied] = (0, import_react.useState)(false);
	const pairs = (0, import_react.useMemo)(() => {
		const rows = [];
		history.forEach((m, i) => {
			const no = Math.floor(i / 2) + 1;
			const row = rows[no - 1] ?? { no };
			if (i % 2 === 0) row.white = m;
			else row.black = m;
			rows[no - 1] = row;
		});
		return rows;
	}, [history]);
	const whiteTaken = capturedBy(history, "w");
	const blackTaken = capturedBy(history, "b");
	const balance = whiteTaken.reduce((s, p) => s + VALUE[p], 0) - blackTaken.reduce((s, p) => s + VALUE[p], 0);
	const copyPgn = async () => {
		const pgn = toPgn(history, whiteLabel, blackLabel);
		try {
			await navigator.clipboard.writeText(pgn);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch {
			setCopied(false);
		}
	};
	const downloadPgn = () => {
		const blob = new Blob([toPgn(history, whiteLabel, blackLabel)], { type: "application/x-chess-pgn" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "click-chess.pgn";
		a.click();
		URL.revokeObjectURL(url);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "w-full rounded-xl border border-border bg-card p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-2 flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium uppercase tracking-wide text-muted-foreground",
					children: "Moves"
				}), balance !== 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-xs font-medium text-muted-foreground",
					children: [
						balance > 0 ? "White" : "Black",
						" +",
						Math.abs(balance)
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-2 space-y-1 text-sm leading-none",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CapturedRow, {
					label: whiteLabel,
					pieces: whiteTaken
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CapturedRow, {
					label: blackLabel,
					pieces: blackTaken
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "max-h-56 overflow-y-auto pr-1",
				children: pairs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "py-2 text-xs text-muted-foreground",
					children: "No moves yet."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "space-y-0.5 text-sm",
					children: pairs.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "grid grid-cols-[2rem_1fr_1fr] items-center gap-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-xs text-muted-foreground",
								children: [row.no, "."]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlyButton, {
								move: row.white,
								ply: (row.no - 1) * 2 + 1,
								activePly,
								onSelectPly
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlyButton, {
								move: row.black,
								ply: (row.no - 1) * 2 + 2,
								activePly,
								onSelectPly
							})
						]
					}, row.no))
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: copyPgn,
					className: "flex-1 rounded-md border border-border px-2 py-1.5 text-xs font-medium text-foreground hover:bg-secondary",
					children: copied ? "Copied!" : "Copy PGN"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: downloadPgn,
					className: "flex-1 rounded-md border border-border px-2 py-1.5 text-xs font-medium text-foreground hover:bg-secondary",
					children: "Download"
				})]
			})
		]
	});
}
function PlyButton({ move, ply, activePly, onSelectPly }) {
	if (!move) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		onClick: () => onSelectPly?.(ply),
		className: `rounded px-1.5 py-0.5 text-left font-medium transition-colors ${activePly === ply ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"}`,
		children: move.san
	});
}
function CapturedRow({ label, pieces }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
		className: "flex items-center gap-1 text-xs text-muted-foreground",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "w-16 shrink-0 truncate",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-base text-foreground",
			children: pieces.map((p) => GLYPH[p]).join("") || "—"
		})]
	});
}
//#endregion
export { MoveList as n, GameOverDialog as t };
