//#region src/adapters/_shared.ts
/**
* Resolve the mount base path for a devframe's SPA. Hosted adapters
* (`vite`, `embedded`) default to `/__<id>/` so they don't collide
* with the host app; standalone adapters (`cli`, `spa`, `build`)
* default to `/` because they own the origin.
*
* The devframe author can override with `basePath` on the definition.
*/
function resolveBasePath(def, kind) {
	if (def.basePath) return normalizeBasePath(def.basePath);
	return kind === "standalone" ? "/" : `/__${def.id}/`;
}
function normalizeBasePath(base) {
	let out = base.startsWith("/") ? base : `/${base}`;
	if (!out.endsWith("/")) out = `${out}/`;
	return out.replace(/\/+/g, "/");
}
//#endregion
export { resolveBasePath as n, normalizeBasePath as t };
