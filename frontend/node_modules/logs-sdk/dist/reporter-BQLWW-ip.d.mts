import { r as Diagnostic } from "./diagnostics-Bj3Nlu5u.mjs";

//#region src/reporter.d.ts
type Reporter = (diagnostic: Diagnostic, formatted: string) => void;
declare const consoleReporter: Reporter;
declare function createFetchReporter(url: string): Reporter;
//#endregion
export { consoleReporter as n, createFetchReporter as r, Reporter as t };
//# sourceMappingURL=reporter-BQLWW-ip.d.mts.map