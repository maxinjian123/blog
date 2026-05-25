import { a as DiagnosticLevel, c as Overrides, i as DiagnosticDefinition, l as SourceLocation, n as DefineDiagnosticsOptions, o as DiagnosticsMethods, r as Diagnostic, s as DiagnosticsResult, t as CodeFactory, u as defineDiagnostics } from "./diagnostics-Bj3Nlu5u.mjs";
import { i as renderFrame, n as formatTag, r as plainFormatter, t as Formatter } from "./format-DgJgN-2u.mjs";
import { n as consoleReporter, r as createFetchReporter, t as Reporter } from "./reporter-BQLWW-ip.mjs";

//#region src/error.d.ts
declare class CodedError extends Error {
  readonly diagnostic: Diagnostic;
  constructor(diagnostic: Diagnostic);
}
//#endregion
//#region src/logger.d.ts
interface DiagnosticActions extends Diagnostic {
  throw: () => never;
  warn: () => void;
  error: () => void;
  log: () => void;
  format: () => string;
}
type ActionFactories<T> = { [K in keyof T as T[K] extends ((...args: any[]) => Diagnostic) ? K : never]: T[K] extends ((...args: infer A) => Diagnostic) ? (...args: A) => DiagnosticActions : never };
type MergeFactories<D extends readonly any[]> = D extends readonly [infer First, ...infer Rest] ? ActionFactories<First> & MergeFactories<Rest> : {};
interface LoggerMethods {
  throw: (diagnostic: Diagnostic) => never;
  warn: (diagnostic: Diagnostic) => void;
  error: (diagnostic: Diagnostic) => void;
  log: (diagnostic: Diagnostic) => void;
  format: (diagnostic: Diagnostic) => string;
}
type Logger<D extends readonly any[]> = MergeFactories<D> & LoggerMethods;
interface CreateLoggerOptions<D extends readonly any[]> {
  diagnostics: [...D];
  formatter?: Formatter;
  reporters?: Reporter | Reporter[];
  captureStack?: boolean;
}
declare function createLogger<const D extends readonly any[]>(options: CreateLoggerOptions<D>): Logger<D>;
//#endregion
export { type CodeFactory, CodedError, type CreateLoggerOptions, type DefineDiagnosticsOptions, type Diagnostic, type DiagnosticActions, type DiagnosticDefinition, type DiagnosticLevel, type DiagnosticsMethods, type DiagnosticsResult, type Formatter, type Logger, type LoggerMethods, type MergeFactories, type Overrides, type Reporter, type SourceLocation, consoleReporter, createFetchReporter, createLogger, defineDiagnostics, formatTag, plainFormatter, renderFrame };
//# sourceMappingURL=index.d.mts.map