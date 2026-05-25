import { createReadStream } from "node:fs";
import { extname, join, normalize, resolve, sep } from "pathe";
import { defineHandler, withBase } from "h3";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { lookup } from "mrmime";
//#region src/utils/serve-static.ts
const HTML_EXTENSIONS = [".html", ".htm"];
async function statFile(abs) {
	try {
		const s = await stat(abs);
		if (!s.isFile()) return null;
		return {
			abs,
			size: s.size,
			mtime: s.mtime
		};
	} catch {
		return null;
	}
}
async function resolveTarget(absDir, urlPath, indexNames, single) {
	let cleaned;
	try {
		cleaned = decodeURIComponent(urlPath || "/");
	} catch {
		return null;
	}
	cleaned = cleaned.replace(/[?#].*$/, "");
	if (cleaned.endsWith("/")) cleaned = cleaned.slice(0, -1);
	if (cleaned.startsWith("/")) cleaned = cleaned.slice(1);
	const abs = normalize(join(absDir, cleaned));
	if (abs !== absDir && !abs.startsWith(absDir + sep)) return null;
	const direct = await statFile(abs);
	if (direct) return direct;
	try {
		if ((await stat(abs)).isDirectory()) for (const name of indexNames) {
			const candidate = await statFile(join(abs, name));
			if (candidate) return candidate;
		}
	} catch {}
	if (!extname(cleaned)) for (const ext of HTML_EXTENSIONS) {
		const candidate = await statFile(abs + ext);
		if (candidate) return candidate;
	}
	const fallbackIndex = indexNames[0];
	if (single && fallbackIndex && !/\.[a-z0-9]+$/i.test(cleaned)) {
		const indexFile = await statFile(join(absDir, fallbackIndex));
		if (indexFile) return indexFile;
	}
	return null;
}
function contentTypeFor(abs) {
	const type = lookup(abs);
	if (!type) return "application/octet-stream";
	if (type === "text/html") return "text/html; charset=utf-8";
	return type;
}
function staticHeadersFor(file) {
	return {
		"Content-Type": contentTypeFor(file.abs),
		"Content-Length": String(file.size),
		"Last-Modified": file.mtime.toUTCString(),
		"Cache-Control": "no-store"
	};
}
function applyStaticHeadersToNode(res, file) {
	for (const [k, v] of Object.entries(staticHeadersFor(file))) res.setHeader(k, v);
}
function normalizeOptions(options) {
	return {
		indexNames: options?.indexNames ?? ["index.html"],
		single: options?.single ?? true
	};
}
/**
* h3 event handler that serves files from `dir` with SPA fallback.
*
* Drop-in replacement for `fromNodeMiddleware(sirv(dir, { dev: true, single: true }))`
* when the surrounding server is an h3 app — no `Cache-Control` beyond
* `no-store`, `Content-Type` resolved via `mrmime`, and a miss with no
* file extension falls back to `<dir>/index.html` so client-side routing
* works.
*/
function serveStaticHandler(dir, options) {
	const absDir = resolve(dir);
	const opts = normalizeOptions(options);
	return defineHandler(async (event) => {
		const method = event.req.method;
		if (method !== "GET" && method !== "HEAD") {
			event.res.status = 405;
			event.res.headers.set("Allow", "GET, HEAD");
			return "";
		}
		const file = await resolveTarget(absDir, event.url.pathname, opts.indexNames, opts.single);
		if (!file) {
			event.res.status = 404;
			return "";
		}
		for (const [k, v] of Object.entries(staticHeadersFor(file))) event.res.headers.set(k, v);
		if (method === "HEAD") return "";
		return Readable.toWeb(createReadStream(file.abs));
	});
}
/**
* Mount {@link serveStaticHandler} on an h3 app at `base`, handling the
* route pattern and prefix-stripping required by h3 v2.
*
* h3 v2's `app.use(base, handler)` only matches the exact `base` path and
* does not strip the prefix from `event.url.pathname`. Static serving
* needs both subpath matching (`/base/**`) and the URL stripped so the
* file resolver sees paths relative to `dir` — this helper bundles both.
*/
function mountStaticHandler(app, base, dir, options) {
	const trimmed = base.replace(/\/$/, "");
	const handler = serveStaticHandler(dir, options);
	if (trimmed === "") {
		app.use("/**", handler);
		return;
	}
	app.use(`${trimmed}/**`, withBase(trimmed, handler));
}
/**
* Connect/Express-style Node middleware variant of {@link serveStaticHandler}.
*
* Use when mounting onto `viteServer.middlewares.use(base, …)` or any other
* Connect stack — avoids forcing the host package to depend on h3 just to
* adapt an event handler back into Node middleware.
*/
function serveStaticNodeMiddleware(dir, options) {
	const absDir = resolve(dir);
	const opts = normalizeOptions(options);
	return (req, res, next) => {
		(async () => {
			const method = req.method;
			if (method !== "GET" && method !== "HEAD") {
				if (next) {
					next();
					return;
				}
				res.statusCode = 405;
				res.setHeader("Allow", "GET, HEAD");
				res.end();
				return;
			}
			const file = await resolveTarget(absDir, req.url ?? "/", opts.indexNames, opts.single);
			if (!file) {
				if (next) {
					next();
					return;
				}
				res.statusCode = 404;
				res.end();
				return;
			}
			applyStaticHeadersToNode(res, file);
			if (method === "HEAD") {
				res.end();
				return;
			}
			createReadStream(file.abs).pipe(res);
		})().catch((err) => {
			if (next) {
				next(err instanceof Error ? err : new Error(String(err)));
				return;
			}
			res.statusCode = 500;
			res.end();
		});
	};
}
//#endregion
export { mountStaticHandler, serveStaticHandler, serveStaticNodeMiddleware };
