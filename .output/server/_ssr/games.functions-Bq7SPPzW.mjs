import { n as createServerFn } from "./server-BPEUc65i.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-FXaLlSDC.mjs";
import { t as createServerRpc } from "./createServerRpc-COdVRNLR.mjs";
import { t as Chess } from "../_libs/chess.js.mjs";
import { a as pickHumanBot, n as humanBotByName } from "./humanBots-Dol-gB05.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/games.functions-Bq7SPPzW.js
var START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
/**
* Return the colour belonging to a real logged-in player.
*/
function getPlayerColor(game, userId) {
	if (game.white_id === userId) return "w";
	if (game.black_id === userId) return "b";
	return null;
}
/**
* Get the username stored on the bot seat.
*
* Bot seats have a NULL player ID and the bot name
* is stored in the corresponding username column.
*/
function getBotName(game) {
	if (game.white_id === null && game.white_username) return game.white_username;
	if (game.black_id === null && game.black_username) return game.black_username;
	return null;
}
/**
* Find an opponent or create a new waiting game.
*
* This version only uses columns that exist in your
* current games table.
*/
var findOrCreateGame_createServerFn_handler = createServerRpc({
	id: "7c89d1e873fad3f4339751da3a4b7f5bc5c54ccaad6d7c651c68d5492d4fc749",
	name: "findOrCreateGame",
	filename: "src/lib/games.functions.ts"
}, (opts) => findOrCreateGame.__executeServer(opts));
var findOrCreateGame = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(findOrCreateGame_createServerFn_handler, async ({ data, context }) => {
	const { supabase, userId } = context;
	const wanted = (data.opponentUsername ?? "").trim().toLowerCase() || null;
	const requestedColor = data.color ?? "random";
	const myColor = requestedColor === "random" ? Math.random() < .5 ? "w" : "b" : requestedColor;
	const { data: me } = await supabase.from("profiles").select("username").eq("id", userId).maybeSingle();
	const myUsername = me?.username ?? "Player";
	let invitedUsername = null;
	if (wanted) {
		const { data: target } = await supabase.from("profiles").select("id, username").eq("username", wanted).maybeSingle();
		if (target && target.id !== userId) invitedUsername = target.username;
	}
	const freeColumn = myColor === "w" ? "white_id" : "black_id";
	const opponentColumn = myColor === "w" ? "black_id" : "white_id";
	const { data: waitingGames, error: waitingError } = await supabase.from("games").select("id, white_id, black_id, white_username, black_username, status, fen, turn, winner, created_at").eq("status", "waiting").is(freeColumn, null).not(opponentColumn, "is", null).order("created_at", { ascending: true }).limit(20);
	if (waitingError) throw new Error(`Could not find waiting games: ${waitingError.message}`);
	let chosenGame = waitingGames?.find((game) => {
		const opponentName = myColor === "w" ? game.black_username : game.white_username;
		return invitedUsername !== null && opponentName === invitedUsername;
	}) ?? null;
	if (!chosenGame) chosenGame = waitingGames?.[0] ?? null;
	if (chosenGame) {
		const updateData = myColor === "w" ? {
			white_id: userId,
			white_username: myUsername,
			status: "active",
			fen: chosenGame.fen && chosenGame.fen !== "start" ? chosenGame.fen : START_FEN
		} : {
			black_id: userId,
			black_username: myUsername,
			status: "active",
			fen: chosenGame.fen && chosenGame.fen !== "start" ? chosenGame.fen : START_FEN
		};
		const { data: joined, error: joinError } = await supabase.from("games").update(updateData).eq("id", chosenGame.id).eq("status", "waiting").is(freeColumn, null).select("id").maybeSingle();
		if (joinError) throw new Error(`Could not join the game: ${joinError.message}`);
		if (joined) return {
			gameId: joined.id,
			mode: "joined",
			opponent: myColor === "w" ? chosenGame.black_username : chosenGame.white_username,
			color: myColor,
			unknownUsername: wanted !== null && invitedUsername === null
		};
	}
	const insertData = myColor === "w" ? {
		white_id: userId,
		black_id: null,
		white_username: myUsername,
		black_username: null,
		status: "waiting",
		fen: START_FEN,
		turn: "w",
		winner: null
	} : {
		white_id: null,
		black_id: userId,
		white_username: null,
		black_username: myUsername,
		status: "waiting",
		fen: START_FEN,
		turn: "w",
		winner: null
	};
	const { data: created, error: createError } = await supabase.from("games").insert(insertData).select("id").single();
	if (createError || !created) throw new Error(createError?.message ?? "Could not create a game.");
	return {
		gameId: created.id,
		mode: invitedUsername ? "invited" : "open",
		opponent: invitedUsername,
		color: myColor,
		unknownUsername: wanted !== null && invitedUsername === null
	};
});
var makeMove_createServerFn_handler = createServerRpc({
	id: "4729b461ab9e7f95edbc2066531e6119c7ef1c4ef291f5167be40c95b0ca16f9",
	name: "makeMove",
	filename: "src/lib/games.functions.ts"
}, (opts) => makeMove.__executeServer(opts));
var makeMove = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(makeMove_createServerFn_handler, async ({ data, context }) => {
	const { supabase, userId } = context;
	const { data: game, error: gameError } = await supabase.from("games").select("id, white_id, black_id, white_username, black_username, status, fen, turn, winner").eq("id", data.gameId).maybeSingle();
	if (gameError) throw new Error(`Could not load game: ${gameError.message}`);
	if (!game) throw new Error("Game not found.");
	if (game.status !== "active") throw new Error("This game is not in play.");
	const myColor = getPlayerColor(game, userId);
	if (!myColor) throw new Error("You are not a player in this game.");
	const fen = game.fen === "start" || !game.fen ? START_FEN : game.fen;
	const chess = new Chess(fen);
	if (chess.turn() !== myColor) throw new Error("It is not your turn.");
	try {
		chess.move({
			from: data.from,
			to: data.to,
			promotion: "q"
		});
	} catch {
		throw new Error("Illegal move.");
	}
	const over = chess.isGameOver();
	let winner = null;
	if (over) {
		if (chess.isCheckmate()) winner = chess.turn() === "w" ? "black" : "white";
		else winner = "draw";
	}
	const nextStatus = over ? "finished" : "active";
	const nextTurn = chess.turn();
	const { error: saveError } = await supabase.from("games").update({
		fen: chess.fen(),
		turn: nextTurn,
		status: nextStatus,
		winner,
		updated_at: (/* @__PURE__ */ new Date()).toISOString()
	}).eq("id", game.id);
	if (saveError) throw new Error(`Could not save your move: ${saveError.message}`);
	return {
		fen: chess.fen(),
		status: nextStatus,
		turn: nextTurn,
		winner
	};
});
var claimTimeout_createServerFn_handler = createServerRpc({
	id: "54831cd06c61e074e7534b463a8cd8b493da9baa80e973f1404530dc5ff100d0",
	name: "claimTimeout",
	filename: "src/lib/games.functions.ts"
}, (opts) => claimTimeout.__executeServer(opts));
var claimTimeout = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(claimTimeout_createServerFn_handler, async () => {
	return {
		ok: false,
		reason: "Clock support is not enabled in the current games table."
	};
});
var resignGame_createServerFn_handler = createServerRpc({
	id: "c53c2b171816dd0c5a50865e9569ff93244d2193ffbb0da9d33ce4953ed6aa75",
	name: "resignGame",
	filename: "src/lib/games.functions.ts"
}, (opts) => resignGame.__executeServer(opts));
var resignGame = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(resignGame_createServerFn_handler, async ({ data, context }) => {
	const { supabase, userId } = context;
	const { data: game, error } = await supabase.from("games").select("id, white_id, black_id, status").eq("id", data.gameId).maybeSingle();
	if (error) throw new Error(error.message);
	if (!game) throw new Error("Game not found.");
	const myColor = getPlayerColor(game, userId);
	if (!myColor) throw new Error("You are not a player in this game.");
	if (game.status !== "active") throw new Error("This game is not in play.");
	const winner = myColor === "w" ? "black" : "white";
	const { error: updateError } = await supabase.from("games").update({
		status: "finished",
		winner,
		updated_at: (/* @__PURE__ */ new Date()).toISOString()
	}).eq("id", game.id);
	if (updateError) throw new Error(updateError.message);
	return {
		ok: true,
		winner
	};
});
var agreeDraw_createServerFn_handler = createServerRpc({
	id: "b76842116856c5549ee4b720305aa5b9ee88c3d7fd6bb32282a47c0e0af7745a",
	name: "agreeDraw",
	filename: "src/lib/games.functions.ts"
}, (opts) => agreeDraw.__executeServer(opts));
var agreeDraw = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(agreeDraw_createServerFn_handler, async ({ data, context }) => {
	const { supabase, userId } = context;
	const { data: game, error } = await supabase.from("games").select("id, white_id, black_id, status").eq("id", data.gameId).maybeSingle();
	if (error) throw new Error(error.message);
	if (!game) throw new Error("Game not found.");
	if (game.white_id !== userId && game.black_id !== userId) throw new Error("You are not a player in this game.");
	if (game.status !== "active") throw new Error("This game is not in play.");
	const { error: updateError } = await supabase.from("games").update({
		status: "finished",
		winner: "draw",
		updated_at: (/* @__PURE__ */ new Date()).toISOString()
	}).eq("id", game.id);
	if (updateError) throw new Error(updateError.message);
	return {
		ok: true,
		winner: "draw"
	};
});
var fillWithBot_createServerFn_handler = createServerRpc({
	id: "fa9fc95427da78d1e177c789a6ba700580cada50f5fb424a81eee4e1c4e568fe",
	name: "fillWithBot",
	filename: "src/lib/games.functions.ts"
}, (opts) => fillWithBot.__executeServer(opts));
var fillWithBot = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(fillWithBot_createServerFn_handler, async ({ data, context }) => {
	const { supabase, userId } = context;
	const { data: game, error } = await supabase.from("games").select("id, white_id, black_id, white_username, black_username, status, fen, turn, winner").eq("id", data.gameId).maybeSingle();
	if (error) throw new Error(error.message);
	if (!game) throw new Error("Game not found.");
	if (game.white_id !== userId && game.black_id !== userId) throw new Error("You are not a player in this game.");
	if (game.status !== "waiting") return {
		filled: false,
		botName: getBotName(game)
	};
	if (game.white_id && game.black_id) return {
		filled: false,
		botName: null
	};
	const { data: profile } = await supabase.from("profiles").select("elo").eq("id", userId).maybeSingle();
	const bot = pickHumanBot(profile?.elo ?? 1200);
	const updateData = game.white_id === userId ? {
		black_id: null,
		black_username: bot.name,
		status: "active",
		fen: game.fen === "start" || !game.fen ? START_FEN : game.fen,
		turn: game.turn || "w",
		updated_at: (/* @__PURE__ */ new Date()).toISOString()
	} : {
		white_id: null,
		white_username: bot.name,
		status: "active",
		fen: game.fen === "start" || !game.fen ? START_FEN : game.fen,
		turn: game.turn || "w",
		updated_at: (/* @__PURE__ */ new Date()).toISOString()
	};
	const { data: updated, error: updateError } = await supabase.from("games").update(updateData).eq("id", game.id).eq("status", "waiting").select("id, white_id, black_id, white_username, black_username, status, fen, turn").maybeSingle();
	if (updateError) throw new Error(`Could not start the bot game: ${updateError.message}`);
	if (!updated) return {
		filled: false,
		botName: null
	};
	return {
		filled: true,
		botName: bot.name,
		botElo: bot.elo
	};
});
var botPlayMove_createServerFn_handler = createServerRpc({
	id: "79f7500f37bcbd972b3ae9fafeb36e137de69c0cf837f0143fcac4fb35fe9b36",
	name: "botPlayMove",
	filename: "src/lib/games.functions.ts"
}, (opts) => botPlayMove.__executeServer(opts));
var botPlayMove = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => data).handler(botPlayMove_createServerFn_handler, async ({ data, context }) => {
	const { supabase, userId } = context;
	const { data: game, error } = await supabase.from("games").select("id, white_id, black_id, white_username, black_username, status, fen, turn, winner").eq("id", data.gameId).maybeSingle();
	if (error) throw new Error(error.message);
	if (!game) throw new Error("Game not found.");
	if (game.status !== "active") throw new Error("This game is not in play.");
	const myColor = getPlayerColor(game, userId);
	if (!myColor) throw new Error("You are not a player in this game.");
	const botColor = myColor === "w" ? "b" : "w";
	const botName = getBotName(game);
	if (!botName) throw new Error("This game does not have a computer opponent.");
	const bot = humanBotByName(botName);
	if (!bot) throw new Error("The computer opponent could not be found.");
	if ((botColor === "w" ? game.white_id : game.black_id) !== null) throw new Error("That seat is occupied by a player.");
	const fen = game.fen === "start" || !game.fen ? START_FEN : game.fen;
	const chess = new Chess(fen);
	if (chess.turn() !== botColor) throw new Error("It is not the opponent's turn.");
	try {
		chess.move({
			from: data.from,
			to: data.to,
			promotion: "q"
		});
	} catch {
		throw new Error("Illegal bot move.");
	}
	const over = chess.isGameOver();
	let winner = null;
	if (over) {
		if (chess.isCheckmate()) winner = chess.turn() === "w" ? "black" : "white";
		else winner = "draw";
	}
	const nextStatus = over ? "finished" : "active";
	const { error: saveError } = await supabase.from("games").update({
		fen: chess.fen(),
		turn: chess.turn(),
		status: nextStatus,
		winner,
		updated_at: (/* @__PURE__ */ new Date()).toISOString()
	}).eq("id", game.id);
	if (saveError) throw new Error(`Could not save the bot move: ${saveError.message}`);
	return {
		fen: chess.fen(),
		status: nextStatus,
		turn: chess.turn(),
		winner,
		botName,
		botElo: bot.elo
	};
});
//#endregion
export { agreeDraw_createServerFn_handler, botPlayMove_createServerFn_handler, claimTimeout_createServerFn_handler, fillWithBot_createServerFn_handler, findOrCreateGame_createServerFn_handler, makeMove_createServerFn_handler, resignGame_createServerFn_handler };
