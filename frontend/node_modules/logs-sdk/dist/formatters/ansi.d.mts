import { t as Formatter } from "../format-DgJgN-2u.mjs";

//#region src/formatters/ansi.d.ts
interface Colors {
  red: (s: string) => string;
  yellow: (s: string) => string;
  cyan: (s: string) => string;
  gray: (s: string) => string;
  bold: (s: string) => string;
  dim: (s: string) => string;
}
declare function ansiFormatter(colors: Colors): Formatter;
//#endregion
export { Colors, ansiFormatter };
//# sourceMappingURL=ansi.d.mts.map