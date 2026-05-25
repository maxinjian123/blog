import { t as Reporter } from "../reporter-BQLWW-ip.mjs";

//#region src/reporters/node.d.ts
interface FileReporterOptions {
  /**
  * Path to the log file.
  * @default '.diagnostics.log'
  */
  logFile?: string;
}
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
declare function createFileReporter(options?: FileReporterOptions): Reporter;
//#endregion
export { FileReporterOptions, createFileReporter };
//# sourceMappingURL=node.d.mts.map