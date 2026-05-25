import { t as launchEditor } from "../launch-editor-BbNhtg7b.mjs";
import { n as defineRpcFunction } from "../define-CW9gLnyG.mjs";
import { t as open } from "../open-DiQn6zCH.mjs";
import * as v from "valibot";
//#region src/recipes/open-helpers.ts
/**
* Prebuilt RPC action that opens a file in the user's configured editor.
*
* Registered name: `devframe:open-in-editor`.
*
* ```ts
* import { openInEditor } from 'devframe/recipes/open-helpers'
*
* defineDevframe({
*   id: 'my-tool',
*   name: 'My Tool',
*   setup(ctx) {
*     ctx.rpc.register(openInEditor)
*   },
* })
* ```
*/
const openInEditor = defineRpcFunction({
	name: "devframe:open-in-editor",
	type: "action",
	jsonSerializable: true,
	args: [v.string()],
	returns: v.void(),
	async handler(filename) {
		launchEditor(filename);
	}
});
/**
* Prebuilt RPC action that reveals a path in the OS file explorer.
*
* Registered name: `devframe:open-in-finder`.
*
* ```ts
* import { openInFinder } from 'devframe/recipes/open-helpers'
*
* ctx.rpc.register(openInFinder)
* ```
*/
const openInFinder = defineRpcFunction({
	name: "devframe:open-in-finder",
	type: "action",
	jsonSerializable: true,
	args: [v.string()],
	returns: v.void(),
	async handler(path) {
		await open(path);
	}
});
/**
* Convenience array bundling both helpers so callers can register them
* in a single `forEach`.
*
* ```ts
* import { openHelpers } from 'devframe/recipes/open-helpers'
*
* openHelpers.forEach(fn => ctx.rpc.register(fn))
* ```
*/
const openHelpers = [openInEditor, openInFinder];
//#endregion
export { openHelpers, openInEditor, openInFinder };
