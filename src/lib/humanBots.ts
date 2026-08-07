import { Chess, type Move } from "chess.js";
import { rankedMoves } from "./engine";

/** Human-looking stand-in opponents used when nobody is in the lobby. */
export type HumanBot = {
  name: string;
  elo: number;
  /** Search depth and time budget for this persona. */
  depth: number;
  budget: number;
  /** Chance of playing a casual, non-best move. */
  slip: number;
  /** Typical thinking time in ms. */
  think: number;
};

export const HUMAN_BOTS: HumanBot[] = [
  { name: "liam_ortega", elo: 620, depth: 1, budget: 120, slip: 0.55, think: 1400 },
  { name: "sofia_reyes", elo: 720, depth: 2, budget: 180, slip: 0.46, think: 1600 },
  { name: "noah_bennett", elo: 830, depth: 2, budget: 220, slip: 0.4, think: 1800 },
  { name: "ava_lindqvist", elo: 940, depth: 2, budget: 280, slip: 0.33, think: 2000 },
  { name: "mateo_silva", elo: 1040, depth: 3, budget: 380, slip: 0.27, think: 2200 },
  { name: "chloe_dubois", elo: 1140, depth: 3, budget: 450, slip: 0.23, think: 2400 },
  { name: "ethan_walsh", elo: 1240, depth: 3, budget: 520, slip: 0.2, think: 2400 },
  { name: "priya_nair", elo: 1340, depth: 3, budget: 600, slip: 0.17, think: 2600 },
  { name: "jonas_keller", elo: 1440, depth: 4, budget: 720, slip: 0.14, think: 2600 },
  { name: "marina_costa", elo: 1540, depth: 4, budget: 850, slip: 0.11, think: 2800 },
  { name: "arjun_mehta", elo: 1640, depth: 4, budget: 950, slip: 0.09, think: 2800 },
  { name: "hannah_novak", elo: 1750, depth: 5, budget: 1100, slip: 0.07, think: 3000 },
  { name: "diego_ramos", elo: 1860, depth: 5, budget: 1250, slip: 0.05, think: 3000 },
  { name: "elena_petrova", elo: 1970, depth: 6, budget: 1500, slip: 0.04, think: 3200 },
  { name: "yusuf_demir", elo: 2080, depth: 6, budget: 1750, slip: 0.03, think: 3200 },
  { name: "kenji_tanaka", elo: 2200, depth: 7, budget: 2100, slip: 0.02, think: 3400 },
  { name: "olivia_hart", elo: 2320, depth: 7, budget: 2500, slip: 0.01, think: 3400 },
];

/** Picks an opponent close to the player's rating, with a little variety. */
export function pickHumanBot(playerElo: number): HumanBot {
  const target = playerElo + Math.round((Math.random() - 0.5) * 220);
  const sorted = [...HUMAN_BOTS].sort(
    (a, b) => Math.abs(a.elo - target) - Math.abs(b.elo - target),
  );
  const pool = sorted.slice(0, 3);
  return pool[Math.floor(Math.random() * pool.length)];
}

export function humanBotByName(name: string): HumanBot | null {
  return HUMAN_BOTS.find((b) => b.name === name) ?? null;
}

/** Chooses a move that feels human: mostly strong, occasionally casual. */
export function humanBotMove(fen: string, bot: HumanBot): Move | null {
  const chess = new Chess(fen);
  const legal = chess.moves({ verbose: true }) as Move[];
  if (!legal.length) return null;

  if (Math.random() < bot.slip) {
    // Casual choice: prefer a capture or a developing move, not a blunder hunt.
    const captures = legal.filter((m) => m.captured);
    const pool = captures.length && Math.random() > 0.45 ? captures : legal;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  const ranked = rankedMoves(fen, bot.depth, bot.budget);
  if (!ranked.length) return legal[0];
  const sign = chess.turn() === "w" ? 1 : -1;
  const top = ranked[0].score * sign;
  // Humans rarely find the single best move; accept near-best options.
  const tolerance = Math.max(15, 140 - bot.elo / 20);
  const close = ranked.filter((r) => top - r.score * sign <= tolerance);
  return close[Math.floor(Math.random() * close.length)].move;
}

/** Human-like pause before answering. */
export function humanThinkDelay(bot: HumanBot): number {
  return Math.round(bot.think * (0.4 + Math.random()));
}

