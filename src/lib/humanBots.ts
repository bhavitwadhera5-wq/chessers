import { Chess, type Move } from "chess.js";
import { rankedMoves } from "./engine";

/**
 * Human-like computer opponents used for online matches.
 *
 * There are exactly 50 unique bots.
 */
export type HumanBot = {
  name: string;
  elo: number;
  depth: number;
  budget: number;
  slip: number;
  think: number;
};

export const HUMAN_BOTS: HumanBot[] = [
  { name: "Riley Carter", elo: 520, depth: 1, budget: 100, slip: 0.62, think: 1500 },
  { name: "Maya Brooks", elo: 580, depth: 1, budget: 110, slip: 0.59, think: 1550 },
  { name: "Leo Morgan", elo: 640, depth: 1, budget: 120, slip: 0.55, think: 1600 },
  { name: "Nora Bennett", elo: 700, depth: 2, budget: 150, slip: 0.51, think: 1650 },
  { name: "Evan Parker", elo: 760, depth: 2, budget: 170, slip: 0.47, think: 1700 },
  { name: "Zoe Mitchell", elo: 820, depth: 2, budget: 190, slip: 0.43, think: 1750 },
  { name: "Kai Anderson", elo: 880, depth: 2, budget: 210, slip: 0.40, think: 1800 },

  { name: "Luna Foster", elo: 940, depth: 2, budget: 240, slip: 0.36, think: 1850 },
  { name: "Adam Wilson", elo: 1000, depth: 2, budget: 270, slip: 0.34, think: 1900 },
  { name: "Mia Sullivan", elo: 1060, depth: 2, budget: 300, slip: 0.31, think: 1950 },
  { name: "Ryan Cooper", elo: 1120, depth: 3, budget: 340, slip: 0.29, think: 2000 },
  { name: "Ivy Richardson", elo: 1180, depth: 3, budget: 380, slip: 0.27, think: 2050 },

  { name: "Daniel Hayes", elo: 1240, depth: 3, budget: 420, slip: 0.25, think: 2100 },
  { name: "Sana Kapoor", elo: 1300, depth: 3, budget: 460, slip: 0.23, think: 2150 },
  { name: "Max Turner", elo: 1360, depth: 3, budget: 500, slip: 0.21, think: 2200 },
  { name: "Ella Wright", elo: 1420, depth: 3, budget: 540, slip: 0.19, think: 2250 },
  { name: "Aiden Scott", elo: 1480, depth: 4, budget: 600, slip: 0.18, think: 2300 },

  { name: "Layla Evans", elo: 1540, depth: 4, budget: 660, slip: 0.16, think: 2350 },
  { name: "Owen Murphy", elo: 1600, depth: 4, budget: 720, slip: 0.15, think: 2400 },
  { name: "Amara Singh", elo: 1660, depth: 4, budget: 780, slip: 0.14, think: 2450 },
  { name: "Lucas Martin", elo: 1720, depth: 4, budget: 840, slip: 0.13, think: 2500 },
  { name: "Hana Kim", elo: 1780, depth: 5, budget: 920, slip: 0.12, think: 2550 },

  { name: "Nathan Reed", elo: 1840, depth: 5, budget: 1000, slip: 0.11, think: 2600 },
  { name: "Anaya Shah", elo: 1900, depth: 5, budget: 1080, slip: 0.10, think: 2650 },
  { name: "Caleb Walker", elo: 1960, depth: 5, budget: 1160, slip: 0.095, think: 2700 },
  { name: "Elise Laurent", elo: 2020, depth: 6, budget: 1240, slip: 0.09, think: 2750 },
  { name: "Theo Harrison", elo: 2080, depth: 6, budget: 1320, slip: 0.085, think: 2800 },

  { name: "Meera Joshi", elo: 2140, depth: 6, budget: 1400, slip: 0.08, think: 2850 },
  { name: "Julian Ross", elo: 2200, depth: 6, budget: 1500, slip: 0.075, think: 2900 },
  { name: "Ayla Demir", elo: 2260, depth: 7, budget: 1600, slip: 0.07, think: 2950 },
  { name: "Marcus Bell", elo: 2320, depth: 7, budget: 1700, slip: 0.065, think: 3000 },
  { name: "Freya Nielsen", elo: 2380, depth: 7, budget: 1800, slip: 0.06, think: 3050 },

  { name: "Victor Chen", elo: 2440, depth: 7, budget: 1900, slip: 0.055, think: 3100 },
  { name: "Alina Rossi", elo: 2500, depth: 7, budget: 2000, slip: 0.05, think: 3150 },
  { name: "Samuel King", elo: 2560, depth: 8, budget: 2150, slip: 0.045, think: 3200 },
  { name: "Nadia Petrov", elo: 2620, depth: 8, budget: 2300, slip: 0.04, think: 3250 },
  { name: "Arthur Blake", elo: 2680, depth: 8, budget: 2450, slip: 0.035, think: 3300 },

  { name: "Yuna Takahashi", elo: 2740, depth: 8, budget: 2600, slip: 0.032, think: 3350 },
  { name: "Sebastian Cole", elo: 2800, depth: 8, budget: 2750, slip: 0.029, think: 3400 },
  { name: "Aarav Malhotra", elo: 2860, depth: 9, budget: 2900, slip: 0.026, think: 3450 },
  { name: "Isla Thompson", elo: 2920, depth: 9, budget: 3050, slip: 0.023, think: 3500 },
  { name: "Dmitri Volkov", elo: 2980, depth: 9, budget: 3200, slip: 0.020, think: 3550 },

  { name: "Sofia Alvarez", elo: 3040, depth: 9, budget: 3350, slip: 0.018, think: 3600 },
  { name: "Kenji Nakamura", elo: 3100, depth: 10, budget: 3500, slip: 0.016, think: 3650 },
  { name: "Elena Markovic", elo: 3160, depth: 10, budget: 3700, slip: 0.014, think: 3700 },
  { name: "William Sterling", elo: 3220, depth: 10, budget: 3900, slip: 0.012, think: 3750 },
  { name: "Aria Montgomery", elo: 3280, depth: 10, budget: 4100, slip: 0.010, think: 3800 },
  { name: "Alexander Volkov", elo: 3340, depth: 11, budget: 4300, slip: 0.008, think: 3850 },
];

/*
 * Safety checks.
 * These make sure we really have 50 different bots.
 */
if (HUMAN_BOTS.length !== 50) {
  throw new Error(
    `Expected 50 bots, but found ${HUMAN_BOTS.length}.`,
  );
}

if (
  new Set(HUMAN_BOTS.map((bot) => bot.name)).size !==
  HUMAN_BOTS.length
) {
  throw new Error("HUMAN_BOTS contains duplicate names.");
}

/**
 * Pick a bot near the player's rating.
 */
export function pickHumanBot(
  playerElo: number,
): HumanBot {
  const target =
    playerElo +
    Math.round(
      (Math.random() - 0.5) * 240,
    );

  const sorted = [...HUMAN_BOTS].sort(
    (a, b) =>
      Math.abs(a.elo - target) -
      Math.abs(b.elo - target),
  );

  // Choose randomly from the five closest bots.
  const pool = sorted.slice(0, 5);

  return pool[
    Math.floor(Math.random() * pool.length)
  ];
}

/**
 * Find a bot by name.
 */
export function humanBotByName(
  name: string,
): HumanBot | null {
  return (
    HUMAN_BOTS.find(
      (bot) => bot.name === name,
    ) ?? null
  );
}

/**
 * Generate a human-like bot move.
 */
export function humanBotMove(
  fen: string,
  bot: HumanBot,
): Move | null {
  const chess = new Chess(fen);

  const legal = chess.moves({
    verbose: true,
  }) as Move[];

  if (!legal.length) {
    return null;
  }

  /*
   * Occasionally make a less-than-perfect move.
   * Lower rated bots do this more often.
   */
  if (Math.random() < bot.slip) {
    const captures = legal.filter(
      (move) => move.captured,
    );

    const pool =
      captures.length > 0 &&
      Math.random() > 0.45
        ? captures
        : legal;

    return pool[
      Math.floor(Math.random() * pool.length)
    ];
  }

  /*
   * Otherwise use the existing chess engine.
   */
  const ranked = rankedMoves(
    fen,
    bot.depth,
    bot.budget,
  );

  if (!ranked.length) {
    return legal[0];
  }

  const sign =
    chess.turn() === "w" ? 1 : -1;

  const top =
    ranked[0].score * sign;

  /*
   * Strong bots choose moves closer to
   * the engine's best move.
   */
  const tolerance = Math.max(
    10,
    150 - bot.elo / 24,
  );

  const close = ranked.filter(
    (item) =>
      top -
        item.score * sign <=
      tolerance,
  );

  return close[
    Math.floor(Math.random() * close.length)
  ].move;
}

/**
 * Human-like thinking delay.
 */
export function humanThinkDelay(
  bot: HumanBot,
): number {
  return Math.round(
    bot.think *
      (0.4 + Math.random()),
  );
}