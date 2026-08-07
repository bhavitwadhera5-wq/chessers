export type Puzzle = {
  id: number;
  fen: string;
  theme: string;
  from: string;
  to: string;
  san: string;
  side: "w" | "b";
};

/** Every puzzle is a verified mate-in-one with exactly one solution. */
export const PUZZLES: Puzzle[] = [
  { id: 1, fen: "6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1", theme: "Back rank", from: "a1", to: "a8", san: "Ra8#", side: "w" },
  { id: 2, fen: "r5k1/8/8/8/8/8/5PPP/6K1 b - - 0 1", theme: "Back rank", from: "a8", to: "a1", san: "Ra1#", side: "b" },
  { id: 3, fen: "6k1/6pp/8/8/8/8/5PPP/4Q1K1 w - - 0 1", theme: "Queen finish", from: "e1", to: "e8", san: "Qe8#", side: "w" },
  { id: 4, fen: "4q1k1/5ppp/8/8/8/8/6PP/6K1 b - - 0 1", theme: "Queen finish", from: "e8", to: "e1", san: "Qe1#", side: "b" },
  { id: 5, fen: "6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1", theme: "Knight mate", from: "g5", to: "f7", san: "Nf7#", side: "w" },
  { id: 6, fen: "6k1/8/8/8/6n1/8/6PP/6RK b - - 0 1", theme: "Knight mate", from: "g4", to: "f2", san: "Nf2#", side: "b" },
  { id: 7, fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1", theme: "Scholar's finish", from: "f3", to: "f7", san: "Qxf7#", side: "w" },
  { id: 8, fen: "rnb1k1nr/pppp1ppp/5q2/2b1p3/4P3/2N5/PPPP1PPP/R1BQKBNR b - - 0 1", theme: "Scholar's finish", from: "f6", to: "f2", san: "Qxf2#", side: "b" },
  { id: 9, fen: "6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1", theme: "Back rank", from: "d1", to: "d8", san: "Rd8#", side: "w" },
  { id: 10, fen: "3r2k1/5ppp/8/8/8/8/5PPP/6K1 b - - 0 1", theme: "Back rank", from: "d8", to: "d1", san: "Rd1#", side: "b" },
  { id: 11, fen: "3r2k1/5ppp/8/8/8/8/5PPP/3RR1K1 w - - 0 1", theme: "Trade into mate", from: "d1", to: "d8", san: "Rxd8#", side: "w" },
  { id: 12, fen: "3rr1k1/5ppp/8/8/8/8/5PPP/3R2K1 b - - 0 1", theme: "Trade into mate", from: "d8", to: "d1", san: "Rxd1#", side: "b" },
  { id: 13, fen: "k7/8/1K6/8/8/8/8/7R w - - 0 1", theme: "Rook mate", from: "h1", to: "h8", san: "Rh8#", side: "w" },
  { id: 14, fen: "7r/8/8/8/8/1k6/8/K7 b - - 0 1", theme: "Rook mate", from: "h8", to: "h1", san: "Rh1#", side: "b" },
  { id: 15, fen: "6k1/4Rppp/8/8/8/8/8/6K1 w - - 0 1", theme: "Back rank", from: "e7", to: "e8", san: "Re8#", side: "w" },
  { id: 16, fen: "6k1/8/8/8/8/8/4rPPP/6K1 b - - 0 1", theme: "Back rank", from: "e2", to: "e1", san: "Re1#", side: "b" },
  { id: 17, fen: "1k6/1P6/1K6/8/8/8/8/7R w - - 0 1", theme: "Rook mate", from: "h1", to: "h8", san: "Rh8#", side: "w" },
  { id: 18, fen: "7r/8/8/8/8/1k6/1p6/1K6 b - - 0 1", theme: "Rook mate", from: "h8", to: "h1", san: "Rh1#", side: "b" },
  { id: 19, fen: "7k/6pp/8/8/8/8/8/5R1K w - - 0 1", theme: "Back rank", from: "f1", to: "f8", san: "Rf8#", side: "w" },
  { id: 20, fen: "5r1k/8/8/8/8/8/6PP/7K b - - 0 1", theme: "Back rank", from: "f8", to: "f1", san: "Rf1#", side: "b" },
  { id: 21, fen: "2r3k1/5ppp/8/8/8/8/5PPP/2R3K1 w - - 0 1", theme: "Trade into mate", from: "c1", to: "c8", san: "Rxc8#", side: "w" },
  { id: 22, fen: "2r3k1/5ppp/8/8/8/8/5PPP/2R3K1 b - - 0 1", theme: "Trade into mate", from: "c8", to: "c1", san: "Rxc1#", side: "b" },
  { id: 23, fen: "4k3/8/4K3/8/8/8/8/7R w - - 0 1", theme: "Rook mate", from: "h1", to: "h8", san: "Rh8#", side: "w" },
  { id: 24, fen: "7r/8/8/8/8/4k3/8/4K3 b - - 0 1", theme: "Rook mate", from: "h8", to: "h1", san: "Rh1#", side: "b" },
  { id: 25, fen: "r6k/6pp/8/8/8/8/8/R5RK w - - 0 1", theme: "Back rank", from: "a1", to: "a8", san: "Rxa8#", side: "w" },
  { id: 26, fen: "r5rk/8/8/8/8/8/6PP/R6K b - - 0 1", theme: "Back rank", from: "a8", to: "a1", san: "Rxa1#", side: "b" },
];

const RATING_KEY = "clickchess.puzzleRating";
const STREAK_KEY = "clickchess.puzzleStreak";
const BEST_KEY = "clickchess.puzzleBest";
const SOLVED_KEY = "clickchess.puzzleSolved";
const DAILY_KEY = "clickchess.dailyDone";

export const START_PUZZLE_RATING = 800;

/** Same puzzle for everyone, changes at midnight local time. */
export function dailyPuzzle(date = new Date()): Puzzle {
  const key = Number(
    `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(
      date.getDate(),
    ).padStart(2, "0")}`,
  );
  return PUZZLES[key % PUZZLES.length];
}

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function randomPuzzle(exclude?: number): Puzzle {
  const pool = PUZZLES.filter((p) => p.id !== exclude);
  return pool[Math.floor(Math.random() * pool.length)];
}

function num(key: string, fallback: number) {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

export type PuzzleStats = {
  rating: number;
  streak: number;
  best: number;
  solved: number;
  dailyDone: boolean;
};

export function readPuzzleStats(): PuzzleStats {
  return {
    rating: num(RATING_KEY, START_PUZZLE_RATING),
    streak: num(STREAK_KEY, 0),
    best: num(BEST_KEY, 0),
    solved: num(SOLVED_KEY, 0),
    dailyDone:
      typeof window !== "undefined" && window.localStorage.getItem(DAILY_KEY) === todayKey(),
  };
}

export function writePuzzleResult(solved: boolean): PuzzleStats {
  const prev = readPuzzleStats();
  const rating = Math.max(400, prev.rating + (solved ? 15 : -12));
  const streak = solved ? prev.streak + 1 : 0;
  const best = Math.max(prev.best, streak);
  const total = prev.solved + (solved ? 1 : 0);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(RATING_KEY, String(rating));
    window.localStorage.setItem(STREAK_KEY, String(streak));
    window.localStorage.setItem(BEST_KEY, String(best));
    window.localStorage.setItem(SOLVED_KEY, String(total));
  }
  return { rating, streak, best, solved: total, dailyDone: prev.dailyDone };
}

export function markDailyDone() {
  if (typeof window !== "undefined") window.localStorage.setItem(DAILY_KEY, todayKey());
}

