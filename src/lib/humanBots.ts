// src/lib/humanBots.ts

import { Chess, type Move } from "chess.js";
import { rankedMoves } from "./engine";

/**
 * Human-looking stand-in opponents used when nobody
 * is available in the multiplayer lobby.
 */
export type HumanBot = {
  name: string;
  elo: number;

  /**
   * Search depth and time budget for this bot.
   */
  depth: number;
  budget: number;

  /**
   * Chance of playing a casual/non-best move.
   */
  slip: number;

  /**
   * Typical thinking time in milliseconds.
   */
  think: number;
};

/**
 * Bot personalities.
 *
 * Lower ELO:
 * - searches less deeply
 * - makes more casual moves
 * - thinks for less time
 *
 * Higher ELO:
 * - searches deeper
 * - makes fewer mistakes
 * - thinks for longer
 */
export const HUMAN_BOTS: HumanBot[] = [
  {
    name: "liam_ortega",
    elo: 620,
    depth: 1,
    budget: 120,
    slip: 0.55,
    think: 1400,
  },

  {
    name: "sofia_reyes",
    elo: 720,
    depth: 2,
    budget: 180,
    slip: 0.46,
    think: 1600,
  },

  {
    name: "noah_bennett",
    elo: 830,
    depth: 2,
    budget: 220,
    slip: 0.40,
    think: 1800,
  },

  {
    name: "ava_lindqvist",
    elo: 940,
    depth: 2,
    budget: 280,
    slip: 0.33,
    think: 2000,
  },

  {
    name: "mateo_silva",
    elo: 1040,
    depth: 3,
    budget: 380,
    slip: 0.27,
    think: 2200,
  },

  {
    name: "chloe_dubois",
    elo: 1140,
    depth: 3,
    budget: 450,
    slip: 0.23,
    think: 2400,
  },

  {
    name: "ethan_walsh",
    elo: 1240,
    depth: 3,
    budget: 520,
    slip: 0.20,
    think: 2400,
  },

  {
    name: "priya_nair",
    elo: 1340,
    depth: 3,
    budget: 600,
    slip: 0.17,
    think: 2600,
  },

  {
    name: "jonas_keller",
    elo: 1440,
    depth: 4,
    budget: 720,
    slip: 0.14,
    think: 2600,
  },

  {
    name: "marina_costa",
    elo: 1540,
    depth: 4,
    budget: 850,
    slip: 0.11,
    think: 2800,
  },

  {
    name: "arjun_mehta",
    elo: 1640,
    depth: 4,
    budget: 950,
    slip: 0.09,
    think: 2800,
  },

  {
    name: "hannah_novak",
    elo: 1750,
    depth: 5,
    budget: 1100,
    slip: 0.07,
    think: 3000,
  },

  {
    name: "diego_ramos",
    elo: 1860,
    depth: 5,
    budget: 1250,
    slip: 0.05,
    think: 3000,
  },

  {
    name: "elena_petrova",
    elo: 1970,
    depth: 6,
    budget: 1500,
    slip: 0.04,
    think: 3200,
  },

  {
    name: "yusuf_demir",
    elo: 2080,
    depth: 6,
    budget: 1750,
    slip: 0.03,
    think: 3200,
  },

  {
    name: "kenji_tanaka",
    elo: 2200,
    depth: 7,
    budget: 2100,
    slip: 0.02,
    think: 3400,
  },

  {
    name: "olivia_hart",
    elo: 2320,
    depth: 7,
    budget: 2500,
    slip: 0.01,
    think: 3400,
  },
];

/**
 * Pick a bot close to the player's ELO.
 *
 * A small amount of randomness prevents the exact
 * same opponent from always being selected.
 */
export function pickHumanBot(playerElo: number): HumanBot {
  const target =
    playerElo +
    Math.round((Math.random() - 0.5) * 220);

  const sorted = [...HUMAN_BOTS].sort(
    (a, b) =>
      Math.abs(a.elo - target) -
      Math.abs(b.elo - target),
  );

  /*
   * Take the three closest bots and randomly choose
   * one of them.
   */
  const pool = sorted.slice(0, 3);

  return pool[
    Math.floor(Math.random() * pool.length)
  ];
}

/**
 * Find a bot from the name stored in the games table.
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
 * Choose a legal move for the bot.
 *
 * The server supplies the FEN, so the bot can never
 * intentionally make an illegal chess move.
 */
export function humanBotMove(
  fen: string,
  bot: HumanBot,
): Move | null {
  const chess = new Chess(fen);

  /*
   * Get every legal move.
   */
  const legal = chess.moves({
    verbose: true,
  }) as Move[];

  /*
   * No legal moves means checkmate or stalemate.
   */
  if (!legal.length) {
    return null;
  }

  /*
   * Occasionally play a casual move.
   *
   * This makes lower-ELO bots feel more human instead
   * of always playing the engine's best move.
   */
  if (Math.random() < bot.slip) {
    const captures = legal.filter(
      (move) => move.captured,
    );

    /*
     * Sometimes prefer a capture, otherwise choose
     * any legal move.
     */
    const pool =
      captures.length &&
      Math.random() > 0.45
        ? captures
        : legal;

    return pool[
      Math.floor(Math.random() * pool.length)
    ];
  }

  /*
   * For the normal case, use the chess engine to rank
   * legal moves.
   */
  const ranked = rankedMoves(
    fen,
    bot.depth,
    bot.budget,
  );

  /*
   * Safety fallback.
   */
  if (!ranked.length) {
    return legal[0];
  }

  /*
   * Engine scores are interpreted according to the
   * side whose turn it is.
   */
  const sign =
    chess.turn() === "w"
      ? 1
      : -1;

  const top =
    ranked[0].score * sign;

  /*
   * Humans don't always choose the absolute best move.
   *
   * Stronger bots have a smaller tolerance and therefore
   * usually choose stronger moves.
   */
  const tolerance = Math.max(
    15,
    140 - bot.elo / 20,
  );

  const close = ranked.filter(
    (candidate) =>
      top -
        candidate.score * sign <=
      tolerance,
  );

  /*
   * Choose randomly from the near-best moves.
   */
  return close[
    Math.floor(Math.random() * close.length)
  ].move;
}

/**
 * Human-like thinking delay.
 *
 * The route/server can use this before requesting the
 * bot's move so the bot doesn't respond instantly.
 */
export function humanThinkDelay(
  bot: HumanBot,
): number {
  return Math.round(
    bot.think *
      (0.4 + Math.random()),
  );
}