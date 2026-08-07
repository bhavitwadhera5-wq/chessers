import { n as createServerFn } from "./server-TUNRzD0E.mjs";
import { t as createSsrRpc } from "./createSsrRpc-Z4YZpYFL.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-T8rJsk6L.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/games.functions-DZG7yZnb.js
/** Applies online rating changes once per finished game (service role). */
var findOrCreateGame = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((data) => data).handler(createSsrRpc("7c89d1e873fad3f4339751da3a4b7f5bc5c54ccaad6d7c651c68d5492d4fc749"));
var makeMove = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((data) => data).handler(createSsrRpc("4729b461ab9e7f95edbc2066531e6119c7ef1c4ef291f5167be40c95b0ca16f9"));
/** Ends a game when the side to move has run out of time. */
var claimTimeout = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((data) => data).handler(createSsrRpc("54831cd06c61e074e7534b463a8cd8b493da9baa80e973f1404530dc5ff100d0"));
var resignGame = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((data) => data).handler(createSsrRpc("c53c2b171816dd0c5a50865e9569ff93244d2193ffbb0da9d33ce4953ed6aa75"));
var agreeDraw = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((data) => data).handler(createSsrRpc("b76842116856c5549ee4b720305aa5b9ee88c3d7fd6bb32282a47c0e0af7745a"));
/** Seats a human-like computer opponent when the lobby is empty. */
var fillWithBot = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((data) => data).handler(createSsrRpc("fa9fc95427da78d1e177c789a6ba700580cada50f5fb424a81eee4e1c4e568fe"));
/** Applies the computer opponent's move, requested by the human's client. */
var botPlayMove = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((data) => data).handler(createSsrRpc("79f7500f37bcbd972b3ae9fafeb36e137de69c0cf837f0143fcac4fb35fe9b36"));
//#endregion
export { findOrCreateGame as a, fillWithBot as i, botPlayMove as n, makeMove as o, claimTimeout as r, resignGame as s, agreeDraw as t };
