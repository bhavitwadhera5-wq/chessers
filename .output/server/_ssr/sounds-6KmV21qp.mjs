import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { r as themeById } from "./boardThemes-CqnkWAfd.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/sounds-6KmV21qp.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var GLYPHS = {
	k: "♚",
	q: "♛",
	r: "♜",
	b: "♝",
	n: "♞",
	p: "♟"
};
var FILES = [
	"a",
	"b",
	"c",
	"d",
	"e",
	"f",
	"g",
	"h"
];
var RANKS = [
	8,
	7,
	6,
	5,
	4,
	3,
	2,
	1
];
function BoardView({ board, selected, destinations, lastMove, flipped = false, theme = "green", checkSquare = null, showCoords = true, onSquareClick, onDropMove }) {
	const rows = flipped ? [...board].reverse() : board;
	const ranks = flipped ? [...RANKS].reverse() : RANKS;
	const t = themeById(theme);
	const [dragFrom, setDragFrom] = (0, import_react.useState)(null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mx-auto w-full",
		style: { maxWidth: "min(100%, 34rem, 78svh)" },
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid aspect-square w-full grid-cols-8 grid-rows-8 overflow-hidden rounded-2xl border-4 shadow-[var(--shadow-board)]",
			style: {
				borderColor: t.frame,
				containerType: "inline-size",
				["--sq"]: "12.5cqw"
			},
			children: rows.map((row, rIdx) => {
				const cells = flipped ? [...row].reverse() : row;
				const files = flipped ? [...FILES].reverse() : FILES;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "col-span-8 grid grid-cols-8",
					children: cells.map((cell, fIdx) => {
						const square = `${files[fIdx]}${ranks[rIdx]}`;
						const dark = (RANKS.indexOf(ranks[rIdx]) + FILES.indexOf(files[fIdx])) % 2 === 1;
						const isSelected = selected === square;
						const isTarget = destinations.has(square);
						const isLast = !!lastMove && (lastMove.from === square || lastMove.to === square);
						const isCheck = checkSquare === square;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => onSquareClick(square),
							"aria-label": square,
							draggable: !!cell && !!onDropMove,
							onDragStart: () => {
								setDragFrom(square);
								onSquareClick(square);
							},
							onDragOver: (e) => {
								if (dragFrom && dragFrom !== square) e.preventDefault();
							},
							onDrop: (e) => {
								e.preventDefault();
								if (dragFrom && dragFrom !== square) onDropMove?.(dragFrom, square);
								setDragFrom(null);
							},
							onDragEnd: () => setDragFrom(null),
							className: "relative flex aspect-square w-full items-center justify-center transition-colors",
							style: {
								fontSize: "calc(var(--sq) * 0.78)",
								lineHeight: 1,
								backgroundColor: isSelected ? t.selected : isLast ? t.last : dark ? t.dark : t.light,
								boxShadow: isCheck ? "inset 0 0 0 calc(var(--sq) * 0.09) oklch(0.58 0.22 25 / 85%)" : void 0
							},
							children: [
								showCoords && fIdx === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "pointer-events-none absolute left-[6%] top-[4%] font-semibold opacity-70",
									style: {
										fontSize: "calc(var(--sq) * 0.2)",
										color: dark ? t.light : t.dark
									},
									children: ranks[rIdx]
								}),
								showCoords && rIdx === rows.length - 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "pointer-events-none absolute bottom-[3%] right-[6%] font-semibold opacity-70",
									style: {
										fontSize: "calc(var(--sq) * 0.2)",
										color: dark ? t.light : t.dark
									},
									children: files[fIdx]
								}),
								isTarget && !cell && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "absolute rounded-full",
									style: {
										width: "calc(var(--sq) * 0.28)",
										height: "calc(var(--sq) * 0.28)",
										background: t.hint
									}
								}),
								isTarget && cell && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "absolute inset-[6%] rounded-full",
									style: { boxShadow: `inset 0 0 0 calc(var(--sq) * 0.08) ${t.hint}` }
								}),
								cell && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Piece, {
									type: cell.type,
									color: cell.color
								})
							]
						}, square);
					})
				}, ranks[rIdx]);
			})
		})
	});
}
function Piece({ type, color }) {
	const white = color === "w";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "pointer-events-none relative select-none",
		style: {
			backgroundImage: white ? "linear-gradient(170deg, oklch(1 0 0) 0%, oklch(0.94 0.01 90) 45%, oklch(0.78 0.02 80) 100%)" : "linear-gradient(170deg, oklch(0.46 0.015 60) 0%, oklch(0.28 0.015 60) 45%, oklch(0.13 0.01 60) 100%)",
			WebkitBackgroundClip: "text",
			backgroundClip: "text",
			color: "transparent",
			filter: white ? "drop-shadow(0 1px 0 oklch(0.35 0.01 70)) drop-shadow(0 0.06em 0.05em oklch(0 0 0 / 45%))" : "drop-shadow(0 1px 0 oklch(0.7 0.01 70 / 45%)) drop-shadow(0 0.06em 0.05em oklch(0 0 0 / 55%))",
			transform: "translateY(-2%)"
		},
		children: GLYPHS[type]
	});
}
var SOUND_KEY = "clickchess.sound";
var ctx = null;
function context() {
	if (typeof window === "undefined") return null;
	const Ctor = window.AudioContext ?? window.webkitAudioContext;
	if (!Ctor) return null;
	if (!ctx) ctx = new Ctor();
	if (ctx.state === "suspended") ctx.resume();
	return ctx;
}
var TONES = {
	move: {
		freq: 320,
		to: 240,
		dur: .08,
		type: "triangle"
	},
	capture: {
		freq: 180,
		to: 90,
		dur: .13,
		type: "square"
	},
	check: {
		freq: 660,
		to: 880,
		dur: .14,
		type: "triangle"
	},
	end: {
		freq: 520,
		to: 180,
		dur: .4,
		type: "sine"
	},
	wrong: {
		freq: 200,
		to: 120,
		dur: .2,
		type: "sawtooth"
	}
};
function soundEnabled() {
	if (typeof window === "undefined") return true;
	return window.localStorage.getItem(SOUND_KEY) !== "off";
}
function setSoundEnabled(on) {
	if (typeof window === "undefined") return;
	window.localStorage.setItem(SOUND_KEY, on ? "on" : "off");
}
function playSound(name) {
	if (!soundEnabled()) return;
	const audio = context();
	if (!audio) return;
	const t = TONES[name];
	const osc = audio.createOscillator();
	const gain = audio.createGain();
	osc.type = t.type;
	osc.frequency.setValueAtTime(t.freq, audio.currentTime);
	osc.frequency.exponentialRampToValueAtTime(t.to, audio.currentTime + t.dur);
	gain.gain.setValueAtTime(.09, audio.currentTime);
	gain.gain.exponentialRampToValueAtTime(1e-4, audio.currentTime + t.dur);
	osc.connect(gain).connect(audio.destination);
	osc.start();
	osc.stop(audio.currentTime + t.dur + .02);
}
/** Picks the right cue for a move that was just played. */
function playMoveSound(opts) {
	if (opts.over) return playSound("end");
	if (opts.check) return playSound("check");
	return playSound(opts.captured ? "capture" : "move");
}
//#endregion
export { soundEnabled as a, setSoundEnabled as i, playMoveSound as n, playSound as r, BoardView as t };
