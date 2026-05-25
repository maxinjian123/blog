import { appendFileSync } from "node:fs";
//#region src/reporters/node.ts
/**
* Creates a reporter that appends diagnostics as NDJSON to a local file.
* Each diagnostic is written as a single JSON line.
*
* @example
* ```ts
* import { createFileReporter } from 'logs-sdk/reporters/node'
*
* const log = createLogger({
*   diagnostics: [diagnostics],
*   reporters: [consoleReporter, createFileReporter()],
* })
* ```
*/
function createFileReporter(options) {
	const logFile = options?.logFile ?? ".diagnostics.log";
	return (diagnostic, _formatted) => {
		try {
			appendFileSync(logFile, `${JSON.stringify(diagnostic)}\n`);
		} catch (err) {
			console.error(`[logs-sdk]: Failed to write log to "${logFile}":`, err);
		}
	};
}
//#endregion
export { createFileReporter };

//# sourceMappingURL=node.mjs.map