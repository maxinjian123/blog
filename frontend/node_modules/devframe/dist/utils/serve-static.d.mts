import { IncomingMessage, ServerResponse } from "node:http";
import { EventHandler, H3 } from "h3";

//#region src/utils/serve-static.d.ts
interface ServeStaticOptions {
  /** Default: `['index.html']`. */
  indexNames?: string[];
  /** SPA fallback to `indexNames[0]` on miss. Default: `true`. */
  single?: boolean;
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
declare function serveStaticHandler(dir: string, options?: ServeStaticOptions): EventHandler;
/**
 * Mount {@link serveStaticHandler} on an h3 app at `base`, handling the
 * route pattern and prefix-stripping required by h3 v2.
 *
 * h3 v2's `app.use(base, handler)` only matches the exact `base` path and
 * does not strip the prefix from `event.url.pathname`. Static serving
 * needs both subpath matching (`/base/**`) and the URL stripped so the
 * file resolver sees paths relative to `dir` — this helper bundles both.
 */
declare function mountStaticHandler(app: H3, base: string, dir: string, options?: ServeStaticOptions): void;
/**
 * Connect/Express-style Node middleware variant of {@link serveStaticHandler}.
 *
 * Use when mounting onto `viteServer.middlewares.use(base, …)` or any other
 * Connect stack — avoids forcing the host package to depend on h3 just to
 * adapt an event handler back into Node middleware.
 */
declare function serveStaticNodeMiddleware(dir: string, options?: ServeStaticOptions): (req: IncomingMessage, res: ServerResponse, next?: (err?: Error) => void) => void;
//#endregion
export { ServeStaticOptions, mountStaticHandler, serveStaticHandler, serveStaticNodeMiddleware };