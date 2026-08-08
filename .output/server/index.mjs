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
	"/assets/admin-gNgiIvfZ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2305-dExLhE1UH9F6BSUGGJug7lN4tj0\"",
		"mtime": "2026-08-08T14:22:09.373Z",
		"size": 8965,
		"path": "../public/assets/admin-gNgiIvfZ.js"
	},
	"/robots.txt": {
		"type": "text/plain; charset=utf-8",
		"etag": "\"17-ZZkCVrbr4BSdjt/K43J0tq8+Qq4\"",
		"mtime": "2026-08-05T09:03:11.916Z",
		"size": 23,
		"path": "../public/robots.txt"
	},
	"/assets/auth-middleware-XdDP2SK3.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1285-WmA+tw3f2Lch4GYPULSC5ICLqBk\"",
		"mtime": "2026-08-08T14:22:09.375Z",
		"size": 4741,
		"path": "../public/assets/auth-middleware-XdDP2SK3.js"
	},
	"/assets/chess-ChQH7pbr.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8836-OQu9tF1csjjui1hWoGGgzKVmFJ4\"",
		"mtime": "2026-08-08T14:22:09.376Z",
		"size": 34870,
		"path": "../public/assets/chess-ChQH7pbr.js"
	},
	"/assets/engine-BniCeKTo.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3de4-g2fHC5UkmtzJSTFn5ewmZVMTLVo\"",
		"mtime": "2026-08-08T14:22:09.378Z",
		"size": 15844,
		"path": "../public/assets/engine-BniCeKTo.js"
	},
	"/assets/humanBots-DB633ST7.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1075-FGqIsgeUnjCpkbbLm4meQGFDSEs\"",
		"mtime": "2026-08-08T14:22:09.379Z",
		"size": 4213,
		"path": "../public/assets/humanBots-DB633ST7.js"
	},
	"/assets/leaderboard-Btzv8Ilx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"10a7-RvPn6XQwpwMC7wLDxAlp4Ig4vWk\"",
		"mtime": "2026-08-08T14:22:09.381Z",
		"size": 4263,
		"path": "../public/assets/leaderboard-Btzv8Ilx.js"
	},
	"/assets/link-DlYYoJf6.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6694-Qfnj6XX32BIkiSLtBQlGX2FHW4Q\"",
		"mtime": "2026-08-08T14:22:09.383Z",
		"size": 26260,
		"path": "../public/assets/link-DlYYoJf6.js"
	},
	"/assets/MoveList-BK2LGLrv.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1ec6-lyCjO0ZZfs9TEZYOjFRLOKElka8\"",
		"mtime": "2026-08-08T14:22:09.372Z",
		"size": 7878,
		"path": "../public/assets/MoveList-BK2LGLrv.js"
	},
	"/assets/index-C5uXOZoA.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7f6a1-Ea2voWGBKvSyfrT/7OdBlzmq6Es\"",
		"mtime": "2026-08-08T14:22:09.371Z",
		"size": 521889,
		"path": "../public/assets/index-C5uXOZoA.js"
	},
	"/assets/online-B2_d-qHB.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1039-79YxiM47Iq0IcT8xSvB0E7H3iFY\"",
		"mtime": "2026-08-08T14:22:09.384Z",
		"size": 4153,
		"path": "../public/assets/online-B2_d-qHB.js"
	},
	"/assets/play._gameId-DL6A1QZ2.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3963-CWcn0+fxXOG9Okhrq535r3Qxs10\"",
		"mtime": "2026-08-08T14:22:09.385Z",
		"size": 14691,
		"path": "../public/assets/play._gameId-DL6A1QZ2.js"
	},
	"/assets/puzzles-BCsViUG6.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"242b-mggqtSJ2ZIihHYUKjBZmNV6C0gU\"",
		"mtime": "2026-08-08T14:22:09.386Z",
		"size": 9259,
		"path": "../public/assets/puzzles-BCsViUG6.js"
	},
	"/assets/routes-BHOAwNla.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1519-6613oWwjh/khcnTZI2cFQ8iIPjs\"",
		"mtime": "2026-08-08T14:22:09.387Z",
		"size": 5401,
		"path": "../public/assets/routes-BHOAwNla.js"
	},
	"/assets/solo-Bb40LgUp.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2c3d-6ulj1e51SQDe/6QI37W2B9nPO1g\"",
		"mtime": "2026-08-08T14:22:09.390Z",
		"size": 11325,
		"path": "../public/assets/solo-Bb40LgUp.js"
	},
	"/assets/sounds-BoFMYbmX.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"11ec-N7IvXGT5Qp/E1g+JFuCkJ6NZEic\"",
		"mtime": "2026-08-08T14:22:09.392Z",
		"size": 4588,
		"path": "../public/assets/sounds-BoFMYbmX.js"
	},
	"/assets/useRouter-Dpb7RwMI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2144-OAWOWZt+i/sSs5fMTIk74KvSiew\"",
		"mtime": "2026-08-08T14:22:09.393Z",
		"size": 8516,
		"path": "../public/assets/useRouter-Dpb7RwMI.js"
	},
	"/assets/styles-BFqo-SFZ.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"1360c-j6T7fPWXTRLynV9X3Xg3iuigEWI\"",
		"mtime": "2026-08-08T14:22:09.394Z",
		"size": 79372,
		"path": "../public/assets/styles-BFqo-SFZ.css"
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
