globalThis.__nitro_main__ = import.meta.url;
import { n as HTTPError, r as defineLazyEventHandler, t as H3Core } from "./_libs/h3+rou3+srvx.mjs";
import { t as HookableCore } from "./_libs/hookable.mjs";
import { r as FastResponse } from "./_libs/h3-v2+rou3+srvx.mjs";
//#region #nitro-vite-setup
function lazyService(loader) {
	let promise, mod;
	return { fetch(req) {
		if (mod) return mod.fetch(req);
		if (!promise) promise = loader().then((_mod) => mod = _mod.default || _mod);
		return promise.then((mod) => mod.fetch(req));
	} };
}
var services = { ["ssr"]: lazyService(() => import("./_ssr/ssr.mjs")) };
globalThis.__nitro_vite_envs__ = services;
//#endregion
//#region #nitro/virtual/public-assets-data
var public_assets_data_default = {
	"/favicon.ico": {
		"type": "image/vnd.microsoft.icon",
		"etag": "\"4f95-3RXc3p2mhEAs1WBwaIvE0Y0uu0Y\"",
		"mtime": "2026-08-05T09:03:11.865Z",
		"size": 20373,
		"path": "../public/favicon.ico"
	},
	"/assets/admin-DvlAdYlu.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2305-o4wp3NRUe+xi0FPF23Ybm1Z6lb0\"",
		"mtime": "2026-08-08T14:34:17.941Z",
		"size": 8965,
		"path": "../public/assets/admin-DvlAdYlu.js"
	},
	"/assets/auth-middleware-BZkxow0i.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1285-5qV2ZOmz49O8tsT/t/SZIGHZyMs\"",
		"mtime": "2026-08-08T14:34:17.944Z",
		"size": 4741,
		"path": "../public/assets/auth-middleware-BZkxow0i.js"
	},
	"/assets/chess-BXi67RA8.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8835-WhZYX8P9n2T9erbBXnJHfOJm0dU\"",
		"mtime": "2026-08-08T14:34:17.945Z",
		"size": 34869,
		"path": "../public/assets/chess-BXi67RA8.js"
	},
	"/assets/engine-_B75_aV9.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3de4-7vxVINgHPi6m+MUGkqBzqdt0q20\"",
		"mtime": "2026-08-08T14:34:17.946Z",
		"size": 15844,
		"path": "../public/assets/engine-_B75_aV9.js"
	},
	"/assets/humanBots-X-WOuPpv.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1075-ZouS6AEtD0ihK0Tti7eW4RX4pDo\"",
		"mtime": "2026-08-08T14:34:17.955Z",
		"size": 4213,
		"path": "../public/assets/humanBots-X-WOuPpv.js"
	},
	"/robots.txt": {
		"type": "text/plain; charset=utf-8",
		"etag": "\"17-ZZkCVrbr4BSdjt/K43J0tq8+Qq4\"",
		"mtime": "2026-08-05T09:03:11.916Z",
		"size": 23,
		"path": "../public/robots.txt"
	},
	"/assets/link-B1IGguQQ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"621e-rvjVYMH0+8fHBmLtOqoGyEq3OwQ\"",
		"mtime": "2026-08-08T14:34:17.973Z",
		"size": 25118,
		"path": "../public/assets/link-B1IGguQQ.js"
	},
	"/assets/MoveList-DlzveD04.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1ec6-dfoQ4lm3uiIO0IV3Fkg7JD3oVgw\"",
		"mtime": "2026-08-08T14:34:17.940Z",
		"size": 7878,
		"path": "../public/assets/MoveList-DlzveD04.js"
	},
	"/assets/online-CL29t0Zo.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1039-FRyGqEnvCXz5e215WNeRRTuhdlo\"",
		"mtime": "2026-08-08T14:34:18.055Z",
		"size": 4153,
		"path": "../public/assets/online-CL29t0Zo.js"
	},
	"/assets/play._gameId-CBwdQPAg.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3963-68rBoWD33KJ9Jn8ibOBlwEFWzZo\"",
		"mtime": "2026-08-08T14:34:18.056Z",
		"size": 14691,
		"path": "../public/assets/play._gameId-CBwdQPAg.js"
	},
	"/assets/puzzles-BXo_rc-X.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"242d-L7NTxvJe1ZXbvMrZGB9iqebw9ZU\"",
		"mtime": "2026-08-08T14:34:18.071Z",
		"size": 9261,
		"path": "../public/assets/puzzles-BXo_rc-X.js"
	},
	"/assets/routes-D9_ttoNZ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1519-VSVj6d3l/7+iooaSHiVKYDLKbRo\"",
		"mtime": "2026-08-08T14:34:18.072Z",
		"size": 5401,
		"path": "../public/assets/routes-D9_ttoNZ.js"
	},
	"/assets/solo-CNCqHGjq.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2c3d-Xc5sWnYohBY/AVQabUZOxpDnfhM\"",
		"mtime": "2026-08-08T14:34:18.072Z",
		"size": 11325,
		"path": "../public/assets/solo-CNCqHGjq.js"
	},
	"/assets/sounds-BoFMYbmX.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"11ec-N7IvXGT5Qp/E1g+JFuCkJ6NZEic\"",
		"mtime": "2026-08-08T14:34:18.083Z",
		"size": 4588,
		"path": "../public/assets/sounds-BoFMYbmX.js"
	},
	"/assets/index-MGQ-OU9S.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7f778-Y/j5aaDfR0zDVDT+uB3iGygH514\"",
		"mtime": "2026-08-08T14:34:17.939Z",
		"size": 522104,
		"path": "../public/assets/index-MGQ-OU9S.js"
	},
	"/assets/useRouter-Dpb7RwMI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2144-OAWOWZt+i/sSs5fMTIk74KvSiew\"",
		"mtime": "2026-08-08T14:34:18.084Z",
		"size": 8516,
		"path": "../public/assets/useRouter-Dpb7RwMI.js"
	},
	"/assets/styles-BFqo-SFZ.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"1360c-j6T7fPWXTRLynV9X3Xg3iuigEWI\"",
		"mtime": "2026-08-08T14:34:18.124Z",
		"size": 79372,
		"path": "../public/assets/styles-BFqo-SFZ.css"
	},
	"/assets/leaderboard-BcT2NKGr.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"10a7-e6v3kxgKwR60lxzq64iVNr5YvDU\"",
		"mtime": "2026-08-08T14:34:17.971Z",
		"size": 4263,
		"path": "../public/assets/leaderboard-BcT2NKGr.js"
	},
	"/favicon.png": {
		"type": "image/png",
		"etag": "\"d289c-wBvosycn9Z/dmfASAx+qR3MxEPw\"",
		"mtime": "2026-08-06T09:01:50.647Z",
		"size": 862364,
		"path": "../public/favicon.png"
	}
};
//#endregion
//#region #nitro/virtual/public-assets
var publicAssetBases = {};
function isPublicAssetURL(id = "") {
	if (public_assets_data_default[id]) return true;
	for (const base in publicAssetBases) if (id.startsWith(base)) return true;
	return false;
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/route-rules.mjs
var headers = ((m) => function headersRouteRule(event) {
	for (const [key, value] of Object.entries(m.options || {})) event.res.headers.set(key, value);
});
//#endregion
//#region #nitro/virtual/routing
var findRouteRules = /* @__PURE__ */ (() => {
	const $0 = [{
		name: "headers",
		route: "/assets/**",
		handler: headers,
		options: { "cache-control": "public, max-age=31536000, immutable" }
	}];
	return (m, p) => {
		let r = [];
		if (p.charCodeAt(p.length - 1) === 47) p = p.slice(0, -1) || "/";
		let s = p.split("/");
		if (s.length > 1) {
			if (s[1] === "assets") r.unshift({
				data: $0,
				params: { "_": s.slice(2).join("/") }
			});
		}
		return r;
	};
})();
var _lazy_bhW5Lp = defineLazyEventHandler(() => import("./_chunks/ssr-renderer.mjs"));
var findRoute = /* @__PURE__ */ (() => {
	const data = {
		route: "/**",
		handler: _lazy_bhW5Lp
	};
	return ((_m, p) => {
		return {
			data,
			params: { "_": p.slice(1) }
		};
	});
})();
[].filter(Boolean);
//#endregion
//#region node_modules/nitro/dist/runtime/internal/error/prod.mjs
var errorHandler = (error, event) => {
	const res = defaultHandler(error, event);
	return new FastResponse(typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2), res);
};
function defaultHandler(error, event) {
	const unhandled = error.unhandled ?? !HTTPError.isError(error);
	const { status = 500, statusText = "" } = unhandled ? {} : error;
	if (status === 404) {
		const url = event.url || new URL(event.req.url);
		const baseURL = "/";
		if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) return {
			status: 302,
			headers: new Headers({ location: `${baseURL}${url.pathname.slice(1)}${url.search}` })
		};
	}
	const headers = new Headers(unhandled ? {} : error.headers);
	headers.set("content-type", "application/json; charset=utf-8");
	return {
		status,
		statusText,
		headers,
		body: {
			error: true,
			...unhandled ? {
				status,
				unhandled: true
			} : typeof error.toJSON === "function" ? error.toJSON() : {
				status,
				statusText,
				message: error.message
			}
		}
	};
}
//#endregion
//#region #nitro/virtual/error-handler
var errorHandlers = [errorHandler];
async function error_handler_default(error, event) {
	for (const handler of errorHandlers) try {
		const response = await handler(error, event, { defaultHandler });
		if (response) return response;
	} catch (error) {
		console.error(error);
	}
}
//#endregion
//#region #nitro/virtual/app
function createNitroApp() {
	const captureError = (error, errorCtx) => {
		if (errorCtx?.event) {
			const errors = errorCtx.event.req.context?.nitro?.errors;
			if (errors) errors.push({
				error,
				context: errorCtx
			});
		}
	};
	const h3App = createH3App({ onError(error, event) {
		return error_handler_default(error, event);
	} });
	let appHandler = (req) => {
		req.context ||= {};
		req.context.nitro = req.context.nitro || { errors: [] };
		return h3App.fetch(req);
	};
	return {
		fetch: appHandler,
		h3: h3App,
		hooks: void 0,
		captureError
	};
}
function createH3App(config) {
	const h3App = new H3Core(config);
	h3App["~findRoute"] = (event) => findRoute(event.req.method, event.url.pathname);
	h3App["~getMiddleware"] = (event, route) => {
		const pathname = event.url.pathname;
		const method = event.req.method;
		const middleware = [];
		const routeRules = getRouteRules(method, pathname);
		event.context.routeRules = routeRules?.routeRules;
		if (routeRules?.routeRuleMiddleware.length) middleware.push(...routeRules.routeRuleMiddleware);
		if (route?.data?.middleware?.length) middleware.push(...route.data.middleware);
		return middleware;
	};
	return h3App;
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/app.mjs
var APP_ID = "default";
function useNitroApp() {
	let instance = useNitroApp._instance;
	if (instance) return instance;
	instance = useNitroApp._instance = createNitroApp();
	globalThis.__nitro__ = globalThis.__nitro__ || {};
	globalThis.__nitro__[APP_ID] = instance;
	return instance;
}
function useNitroHooks() {
	const nitroApp = useNitroApp();
	const hooks = nitroApp.hooks;
	if (hooks) return hooks;
	return nitroApp.hooks = new HookableCore();
}
function getRouteRules(method, pathname) {
	const m = findRouteRules(method, pathname);
	if (!m?.length) return { routeRuleMiddleware: [] };
	const routeRules = {};
	for (const layer of m) for (const rule of layer.data) {
		const currentRule = routeRules[rule.name];
		if (currentRule) {
			if (rule.options === false) {
				delete routeRules[rule.name];
				continue;
			}
			if (typeof currentRule.options === "object" && typeof rule.options === "object") currentRule.options = {
				...currentRule.options,
				...rule.options
			};
			else currentRule.options = rule.options;
			currentRule.route = rule.route;
			currentRule.params = {
				...currentRule.params,
				...layer.params
			};
		} else if (rule.options !== false) routeRules[rule.name] = {
			...rule,
			params: layer.params
		};
	}
	const middleware = [];
	const orderedRules = Object.values(routeRules).sort((a, b) => (a.handler?.order || 0) - (b.handler?.order || 0));
	for (const rule of orderedRules) {
		if (rule.options === false || !rule.handler) continue;
		middleware.push(rule.handler(rule));
	}
	return {
		routeRules,
		routeRuleMiddleware: middleware
	};
}
//#endregion
//#region node_modules/nitro/dist/presets/cloudflare/runtime/_module-handler.mjs
function createHandler(hooks) {
	const nitroApp = useNitroApp();
	const nitroHooks = useNitroHooks();
	return {
		async fetch(request, env, context) {
			globalThis.__env__ = env;
			augmentReq(request, {
				env,
				context
			});
			const ctxExt = {};
			const url = new URL(request.url);
			if (hooks.fetch) {
				const res = await hooks.fetch(request, env, context, url, ctxExt);
				if (res) return res;
			}
			return await nitroApp.fetch(request);
		},
		scheduled(controller, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:scheduled", {
				controller,
				env,
				context
			}) || Promise.resolve());
		},
		email(message, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:email", {
				message,
				event: message,
				env,
				context
			}) || Promise.resolve());
		},
		queue(batch, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:queue", {
				batch,
				event: batch,
				env,
				context
			}) || Promise.resolve());
		},
		tail(traces, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:tail", {
				traces,
				env,
				context
			}) || Promise.resolve());
		},
		trace(traces, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:trace", {
				traces,
				env,
				context
			}) || Promise.resolve());
		}
	};
}
function augmentReq(cfReq, ctx) {
	const req = cfReq;
	req.ip = cfReq.headers.get("cf-connecting-ip") || void 0;
	req.runtime ??= { name: "cloudflare" };
	req.runtime.cloudflare = {
		...req.runtime.cloudflare,
		...ctx
	};
	req.waitUntil = ctx.context?.waitUntil.bind(ctx.context);
}
//#endregion
//#region node_modules/nitro/dist/presets/cloudflare/runtime/cloudflare-module.mjs
var cloudflare_module_default = createHandler({ fetch(cfRequest, env, context, url) {
	if (env.ASSETS && isPublicAssetURL(url.pathname)) return env.ASSETS.fetch(cfRequest);
} });
//#endregion
export { cloudflare_module_default as default };
