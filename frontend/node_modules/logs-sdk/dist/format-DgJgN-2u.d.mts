import { r as Diagnostic } from "./diagnostics-Bj3Nlu5u.mjs";

//#region src/format.d.ts
type Formatter = (diagnostic: Diagnostic) => string;
declare function formatTag(d: Diagnostic): string;
declare function renderFrame(d: Diagnostic): string;
declare const plainFormatter: Formatter;
//#endregion
export { renderFrame as i, formatTag as n, plainFormatter as r, Formatter as t };
//# sourceMappingURL=format-DgJgN-2u.d.mts.map