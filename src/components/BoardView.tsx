import { useState } from "react";
import type { Color, PieceSymbol, Square } from "chess.js";
import { themeById, type BoardTheme } from "@/lib/boardThemes";

// Solid glyphs for both colours so the CSS shading gives them 3D relief.
const GLYPHS: Record<PieceSymbol, string> = {
  k: "♚",
  q: "♛",
  r: "♜",
  b: "♝",
  n: "♞",
  p: "♟",
};

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1] as const;

export type BoardCell = { square: Square; type: PieceSymbol; color: Color } | null;

export function BoardView({
  board,
  selected,
  destinations,
  lastMove,
  flipped = false,
  theme = "green",
  checkSquare = null,
  showCoords = true,
  onSquareClick,
  onDropMove,
}: {
  board: BoardCell[][];
  selected: Square | null;
  destinations: Set<string>;
  lastMove?: { from: string; to: string } | null;
  flipped?: boolean;
  theme?: BoardTheme;
  checkSquare?: Square | null;
  showCoords?: boolean;
  onSquareClick: (square: Square) => void;
  onDropMove?: (from: Square, to: Square) => void;
}) {
  const rows = flipped ? [...board].reverse() : board;
  const ranks = flipped ? [...RANKS].reverse() : RANKS;
  const t = themeById(theme);
  const [dragFrom, setDragFrom] = useState<Square | null>(null);

  return (
    <div
      className="mx-auto w-full"
      style={{ maxWidth: "min(100%, 34rem, 78svh)" }}
    >
      <div
        className="grid aspect-square w-full grid-cols-8 grid-rows-8 overflow-hidden rounded-2xl border-4 shadow-[var(--shadow-board)]"
        style={{
          borderColor: t.frame,
          containerType: "inline-size",
          // One square = 1/8 of the board's own width, so it never overflows.
          ["--sq" as string]: "12.5cqw",
        }}
      >
      {rows.map((row, rIdx) => {
        const cells = flipped ? [...row].reverse() : row;
        const files = flipped ? [...FILES].reverse() : FILES;
        return (
          <div key={ranks[rIdx]} className="col-span-8 grid grid-cols-8">
            {cells.map((cell, fIdx) => {
              const square = `${files[fIdx]}${ranks[rIdx]}` as Square;
              const dark = (RANKS.indexOf(ranks[rIdx]) + FILES.indexOf(files[fIdx])) % 2 === 1;
              const isSelected = selected === square;
              const isTarget = destinations.has(square);
              const isLast = !!lastMove && (lastMove.from === square || lastMove.to === square);
              const isCheck = checkSquare === square;

              return (
                <button
                  key={square}
                  onClick={() => onSquareClick(square)}
                  aria-label={square}
                  draggable={!!cell && !!onDropMove}
                  onDragStart={() => {
                    setDragFrom(square);
                    onSquareClick(square);
                  }}
                  onDragOver={(e) => {
                    if (dragFrom && dragFrom !== square) e.preventDefault();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragFrom && dragFrom !== square) onDropMove?.(dragFrom, square);
                    setDragFrom(null);
                  }}
                  onDragEnd={() => setDragFrom(null)}
                  className="relative flex aspect-square w-full items-center justify-center transition-colors"
                  style={{
                    fontSize: "calc(var(--sq) * 0.78)",
                    lineHeight: 1,
                    backgroundColor: isSelected ? t.selected : isLast ? t.last : dark ? t.dark : t.light,
                    boxShadow: isCheck
                      ? "inset 0 0 0 calc(var(--sq) * 0.09) oklch(0.58 0.22 25 / 85%)"
                      : undefined,
                  }}
                >
                  {showCoords && fIdx === 0 && (
                    <span
                      className="pointer-events-none absolute left-[6%] top-[4%] font-semibold opacity-70"
                      style={{ fontSize: "calc(var(--sq) * 0.2)", color: dark ? t.light : t.dark }}
                    >
                      {ranks[rIdx]}
                    </span>
                  )}
                  {showCoords && rIdx === rows.length - 1 && (
                    <span
                      className="pointer-events-none absolute bottom-[3%] right-[6%] font-semibold opacity-70"
                      style={{ fontSize: "calc(var(--sq) * 0.2)", color: dark ? t.light : t.dark }}
                    >
                      {files[fIdx]}
                    </span>
                  )}
                  {isTarget && !cell && (
                    <span
                      className="absolute rounded-full"
                      style={{
                        width: "calc(var(--sq) * 0.28)",
                        height: "calc(var(--sq) * 0.28)",
                        background: t.hint,
                      }}
                    />
                  )}
                  {isTarget && cell && (
                    <span
                      className="absolute inset-[6%] rounded-full"
                      style={{ boxShadow: `inset 0 0 0 calc(var(--sq) * 0.08) ${t.hint}` }}
                    />
                  )}
                  {cell && <Piece type={cell.type} color={cell.color} />}
                </button>
              );
            })}
          </div>
        );
      })}
      </div>
    </div>
  );
}

function Piece({ type, color }: { type: PieceSymbol; color: Color }) {
  const white = color === "w";
  return (
    <span
      className="pointer-events-none relative select-none"
      style={{
        backgroundImage: white
          ? "linear-gradient(170deg, oklch(1 0 0) 0%, oklch(0.94 0.01 90) 45%, oklch(0.78 0.02 80) 100%)"
          : "linear-gradient(170deg, oklch(0.46 0.015 60) 0%, oklch(0.28 0.015 60) 45%, oklch(0.13 0.01 60) 100%)",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        filter: white
          ? "drop-shadow(0 1px 0 oklch(0.35 0.01 70)) drop-shadow(0 0.06em 0.05em oklch(0 0 0 / 45%))"
          : "drop-shadow(0 1px 0 oklch(0.7 0.01 70 / 45%)) drop-shadow(0 0.06em 0.05em oklch(0 0 0 / 55%))",
        transform: "translateY(-2%)",
      }}
    >
      {GLYPHS[type]}
    </span>
  );
}

