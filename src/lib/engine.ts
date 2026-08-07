import { Chess, type Move } from "chess.js";
import { detectOpening, openingByPly, type OpeningEntry } from "./openings";

export type BotStyle = "balanced" | "aggressive" | "defensive" | "greedy" | "wild" | "positional";

export type BotDef = {
  id: string;
  label: string;
  blurb: string;
  elo: number;
  tier: "Beginner" | "Intermediate" | "Advanced" | "Master";
  depth: number;
  blunder: number;
  budget: number;
  style: BotStyle;
};

/** Full bot roster — every personality is a separately rated opponent. */
export const BOTS: BotDef[] = [
  // Beginner
  { id: "pip", label: "Pip", blurb: "Just learned the moves", elo: 300, tier: "Beginner", depth: 1, blunder: 0.85, budget: 80, style: "wild" },
  { id: "bella", label: "Bella", blurb: "Loves pushing pawns", elo: 450, tier: "Beginner", depth: 1, blunder: 0.7, budget: 100, style: "balanced" },
  { id: "easy", label: "Rusty", blurb: "Blunders often", elo: 600, tier: "Beginner", depth: 1, blunder: 0.55, budget: 150, style: "greedy" },
  { id: "milo", label: "Milo", blurb: "Grabs every free piece", elo: 750, tier: "Beginner", depth: 2, blunder: 0.45, budget: 200, style: "greedy" },
  { id: "nova", label: "Nova", blurb: "Attacks with everything", elo: 900, tier: "Beginner", depth: 2, blunder: 0.38, budget: 250, style: "aggressive" },

  // Intermediate
  { id: "medium", label: "Casey", blurb: "Club beginner", elo: 1050, tier: "Intermediate", depth: 3, blunder: 0.28, budget: 400, style: "balanced" },
  { id: "sable", label: "Sable", blurb: "Sits back and defends", elo: 1200, tier: "Intermediate", depth: 3, blunder: 0.22, budget: 500, style: "defensive" },
  { id: "kite", label: "Kite", blurb: "Wild gambit player", elo: 1300, tier: "Intermediate", depth: 3, blunder: 0.2, budget: 550, style: "wild" },
  { id: "orin", label: "Orin", blurb: "Quiet positional grind", elo: 1400, tier: "Intermediate", depth: 4, blunder: 0.14, budget: 700, style: "positional" },
  { id: "hard", label: "Vera", blurb: "Sees basic tactics", elo: 1500, tier: "Intermediate", depth: 4, blunder: 0.1, budget: 900, style: "balanced" },

  // Advanced
  { id: "raze", label: "Raze", blurb: "Relentless attacker", elo: 1650, tier: "Advanced", depth: 5, blunder: 0.07, budget: 1100, style: "aggressive" },
  { id: "brick", label: "Brick", blurb: "Fortress builder", elo: 1750, tier: "Advanced", depth: 5, blunder: 0.06, budget: 1200, style: "defensive" },
  { id: "juno", label: "Juno", blurb: "Sharp tactician", elo: 1900, tier: "Advanced", depth: 6, blunder: 0.04, budget: 1600, style: "balanced" },
  { id: "atlas", label: "Atlas", blurb: "Squeezes small edges", elo: 2050, tier: "Advanced", depth: 6, blunder: 0.02, budget: 1900, style: "positional" },

  // Master
  { id: "sterling", label: "Sterling", blurb: "Strong club master", elo: 2200, tier: "Master", depth: 7, blunder: 0.01, budget: 2200, style: "balanced" },
  { id: "onyx", label: "Onyx", blurb: "Merciless attacker", elo: 2350, tier: "Master", depth: 7, blunder: 0, budget: 2600, style: "aggressive" },
  { id: "impossible", label: "Titan", blurb: "Deep search, no mercy", elo: 2500, tier: "Master", depth: 9, blunder: 0, budget: 3500, style: "balanced" },
];

export type BotLevel = string;

/** Legacy alias — the selectable bot list. */
export const BOT_LEVELS = BOTS;

export const BOT_TIERS: BotDef["tier"][] = ["Beginner", "Intermediate", "Advanced", "Master"];

export const getBot = (id: BotLevel): BotDef => BOTS.find((b) => b.id === id) ?? BOTS[5];


const VALUE: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

const PST: Record<string, number[]> = {
  p: [
    0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5,
    10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20,
    -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
  n: [
    -50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10,
    0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10,
    5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50,
  ],
  b: [
    -20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0,
    -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10,
    -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20,
  ],
  r: [
    0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0,
    0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0,
    5, 5, 0, 0, 0,
  ],
  q: [
    -20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10,
    -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0,
    0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20,
  ],
  k: [
    -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40,
    -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30,
    -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0,
    10, 30, 20,
  ],
};

/** Static evaluation from White's point of view, in centipawns. */
export function evaluate(chess: Chess): number {
  if (chess.isCheckmate()) return chess.turn() === "w" ? -100000 : 100000;
  if (chess.isDraw() || chess.isStalemate()) return 0;

  let score = 0;
  const board = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const cell = board[r][f];
      if (!cell) continue;
      const idx = cell.color === "w" ? r * 8 + f : (7 - r) * 8 + f;
      const v = VALUE[cell.type] + (PST[cell.type]?.[idx] ?? 0);
      score += cell.color === "w" ? v : -v;
    }
  }
  return score;
}

function ordered(chess: Chess): Move[] {
  const moves = chess.moves({ verbose: true }) as Move[];
  return moves.sort((a, b) => scoreMove(b) - scoreMove(a));
}

function scoreMove(m: Move): number {
  let s = 0;
  if (m.captured) s += 10 * VALUE[m.captured] - VALUE[m.piece];
  if (m.promotion) s += 800;
  if (m.san.includes("+")) s += 50;
  return s;
}

const TIMEOUT = { timeout: true } as const;
let deadline = Infinity;

/** Capture-only search so the bot stops hanging pieces at the horizon. */
function quiesce(chess: Chess, alpha: number, beta: number): number {
  const stand = evaluate(chess);
  const maximizing = chess.turn() === "w";
  if (maximizing) {
    if (stand >= beta) return beta;
    if (stand > alpha) alpha = stand;
  } else {
    if (stand <= alpha) return alpha;
    if (stand < beta) beta = stand;
  }

  const caps = (chess.moves({ verbose: true }) as Move[])
    .filter((m) => m.captured || m.promotion)
    .sort((a, b) => scoreMove(b) - scoreMove(a));

  for (const m of caps) {
    chess.move(m);
    const val = quiesce(chess, alpha, beta);
    chess.undo();
    if (maximizing) {
      if (val >= beta) return beta;
      if (val > alpha) alpha = val;
    } else {
      if (val <= alpha) return alpha;
      if (val < beta) beta = val;
    }
  }
  return maximizing ? alpha : beta;
}

function search(chess: Chess, depth: number, alpha: number, beta: number): number {
  if (Date.now() > deadline) throw TIMEOUT;
  if (chess.isGameOver()) return evaluate(chess);
  if (depth === 0) return quiesce(chess, alpha, beta);
  const maximizing = chess.turn() === "w";
  let best = maximizing ? -Infinity : Infinity;

  for (const m of ordered(chess)) {
    chess.move(m);
    const val = search(chess, depth - 1, alpha, beta);
    chess.undo();
    if (maximizing) {
      best = Math.max(best, val);
      alpha = Math.max(alpha, val);
    } else {
      best = Math.min(best, val);
      beta = Math.min(beta, val);
    }
    if (beta <= alpha) break;
  }
  return best;
}

/** Scores every root move with iterative deepening, best-first. */
export function rankedMoves(
  fen: string,
  depth: number,
  budgetMs = 4000,
): { move: Move; score: number }[] {
  const chess = new Chess(fen);
  let moves = ordered(chess);
  if (!moves.length) return [];

  const maximizing = chess.turn() === "w";
  deadline = Date.now() + budgetMs;
  let finalScores = new Map<string, number>();

  // Iterative deepening: keep the deepest fully-searched result within budget.
  for (let d = 1; d <= depth; d++) {
    const scores = new Map<string, number>();
    try {
      let alpha = -Infinity;
      let beta = Infinity;
      for (const m of moves) {
        chess.move(m);
        const val = search(chess, d - 1, alpha, beta);
        chess.undo();
        scores.set(m.san, val);
        if (maximizing) alpha = Math.max(alpha, val);
        else beta = Math.min(beta, val);
      }
    } catch {
      break; // out of time — keep the previous depth's answer
    }
    finalScores = scores;
    moves = [...moves].sort((a, b) => {
      const sa = scores.get(a.san) ?? (maximizing ? -Infinity : Infinity);
      const sb = scores.get(b.san) ?? (maximizing ? -Infinity : Infinity);
      return maximizing ? sb - sa : sa - sb;
    });
    const top = finalScores.get(moves[0].san) ?? 0;
    if (Math.abs(top) > 90000) break; // forced mate found
  }
  deadline = Infinity;

  const fallback = evaluate(chess);
  return moves.map((m) => ({ move: m, score: finalScores.get(m.san) ?? fallback }));
}

/** Best move for the side to move at a given search depth. */
export function bestMove(
  fen: string,
  depth: number,
  budgetMs = 4000,
): { move: Move | null; score: number } {
  const chess = new Chess(fen);
  const ranked = rankedMoves(fen, depth, budgetMs);
  if (!ranked.length) return { move: null, score: evaluate(chess) };
  return { move: ranked[0].move, score: ranked[0].score };
}

const CENTER = new Set(["d4", "d5", "e4", "e5", "c4", "c5", "f4", "f5"]);

/** Personality bonus in centipawns, from the moving side's point of view. */
function styleBonus(m: Move, style: BotStyle): number {
  const cap = m.captured ? VALUE[m.captured] : 0;
  const check = m.san.includes("+") || m.san.includes("#");
  switch (style) {
    case "aggressive":
      return (check ? 70 : 0) + cap * 0.25 + (m.piece !== "p" ? 15 : 0);
    case "greedy":
      return cap * 0.6 + (m.promotion ? 60 : 0);
    case "defensive":
      return (m.san === "O-O" || m.san === "O-O-O" ? 60 : 0) - (check ? 20 : 0) + (cap ? 10 : 25);
    case "positional":
      return (
        (CENTER.has(m.to) ? 35 : 0) +
        (m.san.startsWith("O-O") ? 55 : 0) +
        (m.piece === "n" || m.piece === "b" ? 15 : 0)
      );
    case "wild":
      return (check ? 50 : 0) + Math.random() * 90 - (m.piece === "q" ? 0 : 10);
    default:
      return 0;
  }
}

/** Picks the bot's move using its strength and personality. */
export function botMove(fen: string, level: BotLevel): Move | null {
  const chess = new Chess(fen);
  const moves = chess.moves({ verbose: true }) as Move[];
  if (!moves.length) return null;

  const bot = getBot(level);
  if (bot.blunder && Math.random() < bot.blunder) {
    const captures = moves.filter((m) => m.captured);
    const pool = captures.length && Math.random() > 0.5 ? captures : moves;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  const ranked = rankedMoves(fen, bot.depth, bot.budget);
  if (!ranked.length) return moves[0];
  const sign = chess.turn() === "w" ? 1 : -1;
  const top = ranked[0].score * sign;
  // Personality only chooses between moves that are objectively close to best.
  const tolerance = bot.style === "balanced" ? 0 : Math.max(20, 120 - bot.elo / 25);
  const pool = ranked.filter((r) => top - r.score * sign <= tolerance);
  if (pool.length <= 1) return ranked[0].move;

  let choice = pool[0];
  let bestAdj = -Infinity;
  for (const r of pool) {
    const adj = r.score * sign + styleBonus(r.move, bot.style);
    if (adj > bestAdj) {
      bestAdj = adj;
      choice = r;
    }
  }
  return choice.move;
}



export type ReviewMove = {
  ply: number;
  san: string;
  color: "w" | "b";
  loss: number;
  tag: "Best" | "Great" | "Good" | "Inaccuracy" | "Mistake" | "Blunder";
  /** Book opening reached after this move, when the line is named. */
  eco?: string;
  opening?: string;
  book?: boolean;
};

export type FairPlayStat = {
  engineMatch: number;
  accuracy: number;
  moves: number;
  suspicion: "clean" | "review" | "high";
};

export type ReviewSummary = {
  moves: ReviewMove[];
  accuracy: { w: number; b: number };
  counts: Record<ReviewMove["tag"], number>;
  opening: (OpeningEntry & { ply: number }) | null;
  fairPlay: { w: FairPlayStat; b: FairPlayStat };
};

function tagFor(loss: number): ReviewMove["tag"] {
  if (loss <= 10) return "Best";
  if (loss <= 30) return "Great";
  if (loss <= 70) return "Good";
  if (loss <= 150) return "Inaccuracy";
  if (loss <= 300) return "Mistake";
  return "Blunder";
}

function suspicionOf(match: number, accuracy: number, moves: number): FairPlayStat["suspicion"] {
  if (moves < 12) return "clean";
  if (match >= 92 && accuracy >= 97) return "high";
  if (match >= 82 && accuracy >= 93) return "review";
  return "clean";
}

/** Reviews a finished game move by move using a shallow search. */
export function reviewGame(history: Move[], depth = 2): ReviewSummary {
  const chess = new Chess();
  const moves: ReviewMove[] = [];
  const counts: Record<ReviewMove["tag"], number> = {
    Best: 0,
    Great: 0,
    Good: 0,
    Inaccuracy: 0,
    Mistake: 0,
    Blunder: 0,
  };
  const losses: { w: number[]; b: number[] } = { w: [], b: [] };
  const matches: { w: number[]; b: number[] } = { w: [], b: [] };

  const sanList = history.map((m) => m.san);
  const bookLine = detectOpening(sanList);
  const perPly = openingByPly(sanList);

  history.forEach((m, i) => {
    const color = chess.turn() as "w" | "b";
    const top = bestMove(chess.fen(), depth);
    const before = top.score;
    chess.move({ from: m.from, to: m.to, promotion: m.promotion });
    const after = bestMove(chess.fen(), Math.max(1, depth - 1)).score;
    const raw = color === "w" ? before - after : after - before;
    const loss = Math.max(0, Math.min(1000, Math.round(raw)));
    const tag = tagFor(loss);
    counts[tag] += 1;
    losses[color].push(loss);
    matches[color].push(top.move?.san === m.san ? 1 : 0);
    const book = perPly[i];
    moves.push({
      ply: i + 1,
      san: m.san,
      color,
      loss,
      tag,
      eco: book?.eco,
      opening: book?.name,
      book: Boolean(bookLine && i < bookLine.ply),
    });
  });

  const acc = (list: number[]) =>
    list.length
      ? Math.round(
          (list.reduce((sum, l) => sum + 100 * Math.exp(-l / 180), 0) / list.length) * 10,
        ) / 10
      : 100;

  const stat = (color: "w" | "b"): FairPlayStat => {
    const list = matches[color];
    const match = list.length
      ? Math.round((list.reduce((a, b) => a + b, 0) / list.length) * 1000) / 10
      : 0;
    const accuracy = acc(losses[color]);
    return {
      engineMatch: match,
      accuracy,
      moves: list.length,
      suspicion: suspicionOf(match, accuracy, list.length),
    };
  };

  return {
    moves,
    accuracy: { w: acc(losses.w), b: acc(losses.b) },
    counts,
    opening: bookLine,
    fairPlay: { w: stat("w"), b: stat("b") },
  };
}

/** Standard Elo update. result: 1 win, 0.5 draw, 0 loss. */
export function nextElo(current: number, opponent: number, result: number, k = 32) {
  const expected = 1 / (1 + 10 ** ((opponent - current) / 400));
  return Math.round(current + k * (result - expected));
}

/** Each bot has its own separate rating, seeded near its strength. */
export function startElo(level: BotLevel): number {
  return Math.max(300, getBot(level).elo - 200);
}

const eloKey = (level: BotLevel) => `clickchess.elo.${level}`;

export function readElo(level: BotLevel): number {
  if (typeof window === "undefined") return startElo(level);
  const raw = window.localStorage.getItem(eloKey(level));
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : startElo(level);
}

export function writeElo(level: BotLevel, value: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(eloKey(level), String(Math.max(100, value)));
}

export function readAllElo(): Record<string, number> {
  return Object.fromEntries(BOTS.map((b) => [b.id, readElo(b.id)]));
}


