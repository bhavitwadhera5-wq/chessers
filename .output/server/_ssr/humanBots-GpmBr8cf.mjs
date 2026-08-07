import { t as Chess } from "../_libs/chess.js.mjs";
import { s as rankedMoves } from "./engine-BXikbV55.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/humanBots-GpmBr8cf.js
var HUMAN_BOTS = [
	{
		name: "liam_ortega",
		elo: 620,
		depth: 1,
		budget: 120,
		slip: .55,
		think: 1400
	},
	{
		name: "sofia_reyes",
		elo: 720,
		depth: 2,
		budget: 180,
		slip: .46,
		think: 1600
	},
	{
		name: "noah_bennett",
		elo: 830,
		depth: 2,
		budget: 220,
		slip: .4,
		think: 1800
	},
	{
		name: "ava_lindqvist",
		elo: 940,
		depth: 2,
		budget: 280,
		slip: .33,
		think: 2e3
	},
	{
		name: "mateo_silva",
		elo: 1040,
		depth: 3,
		budget: 380,
		slip: .27,
		think: 2200
	},
	{
		name: "chloe_dubois",
		elo: 1140,
		depth: 3,
		budget: 450,
		slip: .23,
		think: 2400
	},
	{
		name: "ethan_walsh",
		elo: 1240,
		depth: 3,
		budget: 520,
		slip: .2,
		think: 2400
	},
	{
		name: "priya_nair",
		elo: 1340,
		depth: 3,
		budget: 600,
		slip: .17,
		think: 2600
	},
	{
		name: "jonas_keller",
		elo: 1440,
		depth: 4,
		budget: 720,
		slip: .14,
		think: 2600
	},
	{
		name: "marina_costa",
		elo: 1540,
		depth: 4,
		budget: 850,
		slip: .11,
		think: 2800
	},
	{
		name: "arjun_mehta",
		elo: 1640,
		depth: 4,
		budget: 950,
		slip: .09,
		think: 2800
	},
	{
		name: "hannah_novak",
		elo: 1750,
		depth: 5,
		budget: 1100,
		slip: .07,
		think: 3e3
	},
	{
		name: "diego_ramos",
		elo: 1860,
		depth: 5,
		budget: 1250,
		slip: .05,
		think: 3e3
	},
	{
		name: "elena_petrova",
		elo: 1970,
		depth: 6,
		budget: 1500,
		slip: .04,
		think: 3200
	},
	{
		name: "yusuf_demir",
		elo: 2080,
		depth: 6,
		budget: 1750,
		slip: .03,
		think: 3200
	},
	{
		name: "kenji_tanaka",
		elo: 2200,
		depth: 7,
		budget: 2100,
		slip: .02,
		think: 3400
	},
	{
		name: "olivia_hart",
		elo: 2320,
		depth: 7,
		budget: 2500,
		slip: .01,
		think: 3400
	}
];
/** Picks an opponent close to the player's rating, with a little variety. */
function pickHumanBot(playerElo) {
	const target = playerElo + Math.round((Math.random() - .5) * 220);
	const pool = [...HUMAN_BOTS].sort((a, b) => Math.abs(a.elo - target) - Math.abs(b.elo - target)).slice(0, 3);
	return pool[Math.floor(Math.random() * pool.length)];
}
function humanBotByName(name) {
	return HUMAN_BOTS.find((b) => b.name === name) ?? null;
}
/** Chooses a move that feels human: mostly strong, occasionally casual. */
function humanBotMove(fen, bot) {
	const chess = new Chess(fen);
	const legal = chess.moves({ verbose: true });
	if (!legal.length) return null;
	if (Math.random() < bot.slip) {
		const captures = legal.filter((m) => m.captured);
		const pool = captures.length && Math.random() > .45 ? captures : legal;
		return pool[Math.floor(Math.random() * pool.length)];
	}
	const ranked = rankedMoves(fen, bot.depth, bot.budget);
	if (!ranked.length) return legal[0];
	const sign = chess.turn() === "w" ? 1 : -1;
	const top = ranked[0].score * sign;
	const tolerance = Math.max(15, 140 - bot.elo / 20);
	const close = ranked.filter((r) => top - r.score * sign <= tolerance);
	return close[Math.floor(Math.random() * close.length)].move;
}
/** Human-like pause before answering. */
function humanThinkDelay(bot) {
	return Math.round(bot.think * (.4 + Math.random()));
}
//#endregion
export { pickHumanBot as a, humanThinkDelay as i, humanBotByName as n, humanBotMove as r, HUMAN_BOTS as t };
