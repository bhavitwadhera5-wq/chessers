import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Chess, type Square } from "chess.js";
import { BoardView } from "@/components/BoardView";
import { BOARD_THEMES, THEME_KEY, type BoardTheme } from "@/lib/boardThemes";
import { playSound } from "@/lib/sounds";
import {
  dailyPuzzle,
  markDailyDone,
  randomPuzzle,
  readPuzzleStats,
  writePuzzleResult,
  type Puzzle,
  type PuzzleStats,
} from "@/lib/puzzles";

export const Route = createFileRoute("/puzzles")({
  head: () => ({
    meta: [
      { title: "Chess Puzzles & Daily Tactic — Chessers" },
      {
        name: "description",
        content:
          "Solve mate-in-one chess puzzles, build a solving streak and climb your puzzle rating with a fresh daily tactic.",
      },
      { property: "og:title", content: "Chess Puzzles & Daily Tactic — Chessers" },
      {
        property: "og:description",
        content: "Tactics trainer with puzzle rating, streaks and a new daily puzzle every day.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Puzzles,
});

type Phase = "solving" | "solved" | "failed";

function Puzzles() {
  const [mode, setMode] = useState<"daily" | "random">("daily");
  const [puzzle, setPuzzle] = useState<Puzzle>(() => dailyPuzzle());
  const [chess, setChess] = useState(() => new Chess(puzzle.fen));
  const [selected, setSelected] = useState<Square | null>(null);
  const [phase, setPhase] = useState<Phase>("solving");
  const [stats, setStats] = useState<PuzzleStats | null>(null);
  const [theme, setTheme] = useState<BoardTheme>("green");
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    setStats(readPuzzleStats());
    const saved = window.localStorage.getItem(THEME_KEY) as BoardTheme | null;
    if (saved && BOARD_THEMES.some((t) => t.id === saved)) setTheme(saved);
  }, []);

  const load = (next: Puzzle, nextMode: "daily" | "random") => {
    setMode(nextMode);
    setPuzzle(next);
    setChess(new Chess(next.fen));
    setSelected(null);
    setShowHint(false);
    setPhase("solving");
  };

  const board = useMemo(() => chess.board(), [chess]);
  const destinations = useMemo(() => {
    if (!selected || phase !== "solving") return new Set<string>();
    return new Set(chess.moves({ square: selected, verbose: true }).map((m) => m.to));
  }, [chess, selected, phase]);

  const attempt = (from: Square, to: Square) => {
    if (phase !== "solving") return;
    const legal = chess.moves({ square: from, verbose: true }).some((m) => m.to === to);
    if (!legal) return;
    setSelected(null);

    if (from === puzzle.from && to === puzzle.to) {
      const next = new Chess(chess.fen());
      next.move({ from, to, promotion: "q" });
      setChess(next);
      playSound("end");
      setPhase("solved");
      const updated = writePuzzleResult(true);
      if (mode === "daily") markDailyDone();
      setStats({ ...updated, dailyDone: mode === "daily" ? true : updated.dailyDone });
    } else {
      playSound("wrong");
      setPhase("failed");
      setStats(writePuzzleResult(false));
    }
  };

  const onSquareClick = (square: Square) => {
    if (phase !== "solving") return;
    const piece = chess.get(square);
    if (piece && piece.color === chess.turn()) {
      setSelected(square === selected ? null : square);
      return;
    }
    if (selected) attempt(selected, square);
  };

  const retry = () => load(puzzle, mode);
  const next = () => load(randomPuzzle(puzzle.id), "random");

  return (
    <main className="flex min-h-screen flex-col items-center bg-background px-4 py-8">
      <div className="w-full max-w-3xl">
        <header className="mb-6 text-center">
          <Link
            to="/"
            className="text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground"
          >
            ← Home
          </Link>
          <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-foreground">
            Puzzles
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Find the mate in one. {puzzle.side === "w" ? "White" : "Black"} to play.
          </p>
        </header>

        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Puzzle rating" value={stats?.rating ?? "—"} />
          <Stat label="Streak" value={stats?.streak ?? "—"} />
          <Stat label="Best streak" value={stats?.best ?? "—"} />
          <Stat label="Solved" value={stats?.solved ?? "—"} />
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => load(dailyPuzzle(), "daily")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "daily"
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            Daily puzzle{stats?.dailyDone ? " ✓" : ""}
          </button>
          <button
            onClick={next}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "random"
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            Random puzzle
          </button>
        </div>

        <div className="flex w-full flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-center">
          <BoardView
            board={board}
            selected={selected}
            destinations={destinations}
            lastMove={phase === "solved" ? { from: puzzle.from, to: puzzle.to } : null}
            flipped={puzzle.side === "b"}
            theme={theme}
            checkSquare={null}
            onSquareClick={onSquareClick}
            onDropMove={attempt}
          />

          <aside className="flex w-full flex-col gap-3 sm:w-52">
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Theme
              </p>
              <p className="mt-1 text-sm font-medium text-card-foreground">{puzzle.theme}</p>
              {phase === "solving" && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {showHint ? `Move the piece on ${puzzle.from}.` : "Stuck? Take a hint."}
                </p>
              )}
              {phase === "solved" && (
                <p className="mt-2 text-sm font-semibold text-primary">Solved — {puzzle.san}</p>
              )}
              {phase === "failed" && (
                <p className="mt-2 text-sm font-semibold text-destructive">
                  Not it. The answer was {puzzle.san}.
                </p>
              )}
            </div>

            {phase === "solving" && (
              <button
                onClick={() => setShowHint(true)}
                className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
              >
                Hint
              </button>
            )}
            {phase !== "solving" && (
              <button
                onClick={next}
                className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Next puzzle
              </button>
            )}
            {phase === "failed" && (
              <button
                onClick={retry}
                className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
              >
                Try again
              </button>
            )}

            <div className="rounded-xl border border-border bg-card p-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Board
              </p>
              <div className="flex flex-wrap gap-1.5">
                {BOARD_THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id);
                      window.localStorage.setItem(THEME_KEY, t.id);
                    }}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      theme === t.id
                        ? "bg-primary text-primary-foreground"
                        : "border border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 text-center">
      <p className="text-lg font-semibold text-card-foreground">{value}</p>
      <p className="text-[0.7rem] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

