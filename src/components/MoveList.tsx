import { useMemo, useState } from "react";
import { Chess, type Move, type PieceSymbol } from "chess.js";

const GLYPH: Record<PieceSymbol, string> = { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" };
const VALUE: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

function capturedBy(history: Move[], color: "w" | "b") {
  return history
    .filter((m) => m.color === color && m.captured)
    .map((m) => m.captured as PieceSymbol)
    .sort((a, b) => VALUE[b] - VALUE[a]);
}

function toPgn(history: Move[], whiteLabel: string, blackLabel: string) {
  const replay = new Chess();
  for (const m of history) {
    try {
      replay.move({ from: m.from, to: m.to, promotion: m.promotion });
    } catch {
      break;
    }
  }
  replay.setHeader("Event", "Chessers");
  replay.setHeader("Date", new Date().toISOString().slice(0, 10).replace(/-/g, "."));
  replay.setHeader("White", whiteLabel);
  replay.setHeader("Black", blackLabel);
  return replay.pgn();
}

/** Notation panel with captured material and PGN export. */
export function MoveList({
  history,
  whiteLabel = "White",
  blackLabel = "Black",
  onSelectPly,
  activePly,
}: {
  history: Move[];
  whiteLabel?: string;
  blackLabel?: string;
  onSelectPly?: (ply: number) => void;
  activePly?: number;
}) {
  const [copied, setCopied] = useState(false);

  const pairs = useMemo(() => {
    const rows: { no: number; white?: Move; black?: Move }[] = [];
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
  const balance =
    whiteTaken.reduce((s, p) => s + VALUE[p], 0) - blackTaken.reduce((s, p) => s + VALUE[p], 0);

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

  return (
    <div className="w-full rounded-xl border border-border bg-card p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Moves</p>
        {balance !== 0 && (
          <span className="text-xs font-medium text-muted-foreground">
            {balance > 0 ? "White" : "Black"} +{Math.abs(balance)}
          </span>
        )}
      </div>

      <div className="mb-2 space-y-1 text-sm leading-none">
        <CapturedRow label={whiteLabel} pieces={whiteTaken} />
        <CapturedRow label={blackLabel} pieces={blackTaken} />
      </div>

      <div className="max-h-56 overflow-y-auto pr-1">
        {pairs.length === 0 ? (
          <p className="py-2 text-xs text-muted-foreground">No moves yet.</p>
        ) : (
          <ol className="space-y-0.5 text-sm">
            {pairs.map((row) => (
              <li key={row.no} className="grid grid-cols-[2rem_1fr_1fr] items-center gap-1">
                <span className="text-xs text-muted-foreground">{row.no}.</span>
                <PlyButton
                  move={row.white}
                  ply={(row.no - 1) * 2 + 1}
                  activePly={activePly}
                  onSelectPly={onSelectPly}
                />
                <PlyButton
                  move={row.black}
                  ply={(row.no - 1) * 2 + 2}
                  activePly={activePly}
                  onSelectPly={onSelectPly}
                />
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={copyPgn}
          className="flex-1 rounded-md border border-border px-2 py-1.5 text-xs font-medium text-foreground hover:bg-secondary"
        >
          {copied ? "Copied!" : "Copy PGN"}
        </button>
        <button
          onClick={downloadPgn}
          className="flex-1 rounded-md border border-border px-2 py-1.5 text-xs font-medium text-foreground hover:bg-secondary"
        >
          Download
        </button>
      </div>
    </div>
  );
}

function PlyButton({
  move,
  ply,
  activePly,
  onSelectPly,
}: {
  move?: Move;
  ply: number;
  activePly?: number;
  onSelectPly?: (ply: number) => void;
}) {
  if (!move) return <span />;
  return (
    <button
      onClick={() => onSelectPly?.(ply)}
      className={`rounded px-1.5 py-0.5 text-left font-medium transition-colors ${
        activePly === ply ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"
      }`}
    >
      {move.san}
    </button>
  );
}

function CapturedRow({ label, pieces }: { label: string; pieces: PieceSymbol[] }) {
  return (
    <p className="flex items-center gap-1 text-xs text-muted-foreground">
      <span className="w-16 shrink-0 truncate">{label}</span>
      <span className="text-base text-foreground">{pieces.map((p) => GLYPH[p]).join("") || "—"}</span>
    </p>
  );
}

