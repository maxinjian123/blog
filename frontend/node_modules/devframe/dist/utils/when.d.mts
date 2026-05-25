//#region ../../node_modules/.pnpm/whenexpr@0.1.2/node_modules/whenexpr/dist/index.d.mts
//#region src/paths.d.ts
/**
 * Union of valid context paths for `T` — both flat keys (`keyof T`) and
 * `.`/`:`-separated nested paths. Mirrors the runtime `resolve()` lookup:
 * first a flat literal key, then a segmented path.
 *
 * @example
 * type P = ContextPaths<{ editor: { lang: string }, debug: boolean }>
 * // 'editor' | 'debug' | 'editor.lang' | 'editor:lang'
 */
type ContextPaths<T, P extends string = ''> = { [K in keyof T & string]: `${P}${K}` | (T[K] extends readonly unknown[] ? never : T[K] extends ((...args: never[]) => unknown) ? never : T[K] extends object ? ContextPaths<T[K], `${P}${K}.`> | ContextPaths<T[K], `${P}${K}:`> : never) }[keyof T & string]; //#endregion
//#region src/types.d.ts
/**
 * Branded error type surfaced at the call site of `evaluateWhen` when the
 * expression string fails static validation. The embedded message appears in
 * the TS error tooltip because `WhenExpressionError<M>` is not assignable from a
 * plain string literal.
 */
type WhenExpressionError<M extends string> = string & {
  readonly __whenExpressionError: M;
};
type Ws = ' ' | '\t' | '\n' | '\r';
type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
type Lower = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z';
type Upper = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M' | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z';
type IdentStart = Lower | Upper | '_' | '$';
type IdentCont = IdentStart | Digit | '.' | ':';
type Op = '===' | '!==' | '==' | '!=' | '<=' | '>=' | '&&' | '||' | '<' | '>' | '+' | '-' | '*' | '/' | '%' | '!';
type Tok = {
  k: 'num';
  v: string;
} | {
  k: 'str';
  v: string;
} | {
  k: 'id';
  v: string;
} | {
  k: 'bool';
  v: 'true' | 'false';
} | {
  k: 'op';
  v: Op;
} | {
  k: 'lp';
} | {
  k: 'rp';
} | {
  k: 'eof';
};
interface TokErr {
  __err: string;
}
type Tokenize<S extends string, Acc extends Tok[] = []> = S extends '' ? [...Acc, {
  k: 'eof';
}] : S extends `${Ws}${infer R}` ? Tokenize<R, Acc> : S extends `===${infer R}` ? Tokenize<R, [...Acc, {
  k: 'op';
  v: '===';
}]> : S extends `!==${infer R}` ? Tokenize<R, [...Acc, {
  k: 'op';
  v: '!==';
}]> : S extends `==${infer R}` ? Tokenize<R, [...Acc, {
  k: 'op';
  v: '==';
}]> : S extends `!=${infer R}` ? Tokenize<R, [...Acc, {
  k: 'op';
  v: '!=';
}]> : S extends `<=${infer R}` ? Tokenize<R, [...Acc, {
  k: 'op';
  v: '<=';
}]> : S extends `>=${infer R}` ? Tokenize<R, [...Acc, {
  k: 'op';
  v: '>=';
}]> : S extends `&&${infer R}` ? Tokenize<R, [...Acc, {
  k: 'op';
  v: '&&';
}]> : S extends `||${infer R}` ? Tokenize<R, [...Acc, {
  k: 'op';
  v: '||';
}]> : S extends `<${infer R}` ? Tokenize<R, [...Acc, {
  k: 'op';
  v: '<';
}]> : S extends `>${infer R}` ? Tokenize<R, [...Acc, {
  k: 'op';
  v: '>';
}]> : S extends `+${infer R}` ? Tokenize<R, [...Acc, {
  k: 'op';
  v: '+';
}]> : S extends `-${infer R}` ? Tokenize<R, [...Acc, {
  k: 'op';
  v: '-';
}]> : S extends `*${infer R}` ? Tokenize<R, [...Acc, {
  k: 'op';
  v: '*';
}]> : S extends `/${infer R}` ? Tokenize<R, [...Acc, {
  k: 'op';
  v: '/';
}]> : S extends `%${infer R}` ? Tokenize<R, [...Acc, {
  k: 'op';
  v: '%';
}]> : S extends `!${infer R}` ? Tokenize<R, [...Acc, {
  k: 'op';
  v: '!';
}]> : S extends `(${infer R}` ? Tokenize<R, [...Acc, {
  k: 'lp';
}]> : S extends `)${infer R}` ? Tokenize<R, [...Acc, {
  k: 'rp';
}]> : S extends `"${infer R}` ? ConsumeStr<R, '', '"', Acc> : S extends `'${infer R}` ? ConsumeStr<R, '', '\'', Acc> : S extends `${infer C extends Digit}${infer R}` ? ConsumeNum<R, C, Acc> : S extends `${infer C extends IdentStart}${infer R}` ? ConsumeIdent<R, C, Acc> : {
  __err: `Unexpected character in "${S}"`;
};
type ConsumeNum<S extends string, N extends string, Acc extends Tok[]> = S extends `${infer C extends Digit}${infer R}` ? ConsumeNum<R, `${N}${C}`, Acc> : S extends `.${infer C extends Digit}${infer R}` ? ConsumeNumFrac<R, `${N}.${C}`, Acc> : Tokenize<S, [...Acc, {
  k: 'num';
  v: N;
}]>;
type ConsumeNumFrac<S extends string, N extends string, Acc extends Tok[]> = S extends `${infer C extends Digit}${infer R}` ? ConsumeNumFrac<R, `${N}${C}`, Acc> : Tokenize<S, [...Acc, {
  k: 'num';
  v: N;
}]>;
type ConsumeIdent<S extends string, N extends string, Acc extends Tok[]> = S extends `${infer C extends IdentCont}${infer R}` ? ConsumeIdent<R, `${N}${C}`, Acc> : Tokenize<S, [...Acc, ClassifyIdent<N>]>;
type ClassifyIdent<N extends string> = N extends 'true' ? {
  k: 'bool';
  v: 'true';
} : N extends 'false' ? {
  k: 'bool';
  v: 'false';
} : {
  k: 'id';
  v: N;
};
type ConsumeStr<S extends string, V extends string, Q extends '"' | '\'', Acc extends Tok[]> = S extends `${Q}${infer R}` ? Tokenize<R, [...Acc, {
  k: 'str';
  v: V;
}]> : S extends `\\${infer C}${infer R}` ? ConsumeStr<R, `${V}${C}`, Q, Acc> : S extends `${infer C}${infer R}` ? ConsumeStr<R, `${V}${C}`, Q, Acc> : {
  __err: 'Unterminated string literal';
};
type BinOp = '||' | '&&' | '==' | '!=' | '===' | '!==' | '<' | '>' | '<=' | '>=' | '+' | '-' | '*' | '/' | '%';
type UnOp = '!' | '-' | '+';
interface LitNode {
  t: 'lit';
  v: string;
}
interface KeyNode {
  t: 'key';
  v: string;
}
interface UnNode {
  t: 'un';
  op: UnOp;
  x: Ast;
}
interface BinNode {
  t: 'bin';
  op: BinOp;
  l: Ast;
  r: Ast;
}
type Ast = LitNode | KeyNode | UnNode | BinNode;
type Parse<Toks extends Tok[]> = ParseOr<Toks>;
type ParseOr<T extends Tok[]> = OrTail<ParseAnd<T>>;
type OrTail<R> = R extends [infer L extends Ast, infer Rest extends Tok[]] ? Rest extends [{
  k: 'op';
  v: '||';
}, ...infer After extends Tok[]] ? ParseAnd<After> extends [infer Rh extends Ast, infer Next extends Tok[]] ? OrTail<[{
  t: 'bin';
  op: '||';
  l: L;
  r: Rh;
}, Next]> : 'err' : R : R;
type ParseAnd<T extends Tok[]> = AndTail<ParseEq<T>>;
type AndTail<R> = R extends [infer L extends Ast, infer Rest extends Tok[]] ? Rest extends [{
  k: 'op';
  v: '&&';
}, ...infer After extends Tok[]] ? ParseEq<After> extends [infer Rh extends Ast, infer Next extends Tok[]] ? AndTail<[{
  t: 'bin';
  op: '&&';
  l: L;
  r: Rh;
}, Next]> : 'err' : R : R;
type ParseEq<T extends Tok[]> = EqTail<ParseRel<T>>;
type EqTail<R> = R extends [infer L extends Ast, infer Rest extends Tok[]] ? Rest extends [{
  k: 'op';
  v: infer O extends '==' | '!=';
}, ...infer After extends Tok[]] ? ParseValueRhs<After> extends [infer Rh extends Ast, infer Next extends Tok[]] ? EqTail<[{
  t: 'bin';
  op: O;
  l: L;
  r: Rh;
}, Next]> : 'err' : Rest extends [{
  k: 'op';
  v: infer O extends '===' | '!==';
}, ...infer After extends Tok[]] ? ParseRel<After> extends [infer Rh extends Ast, infer Next extends Tok[]] ? EqTail<[{
  t: 'bin';
  op: O;
  l: L;
  r: Rh;
}, Next]> : 'err' : R : R;
type ParseValueRhs<T extends Tok[]> = T extends [{
  k: 'id';
  v: infer V extends string;
}, ...infer R extends Tok[]] ? [{
  t: 'lit';
  v: V;
}, R] : T extends [{
  k: 'str';
  v: infer V extends string;
}, ...infer R extends Tok[]] ? [{
  t: 'lit';
  v: V;
}, R] : T extends [{
  k: 'num';
  v: infer V extends string;
}, ...infer R extends Tok[]] ? [{
  t: 'lit';
  v: V;
}, R] : T extends [{
  k: 'bool';
  v: infer V extends string;
}, ...infer R extends Tok[]] ? [{
  t: 'lit';
  v: V;
}, R] : 'err';
type ParseRel<T extends Tok[]> = RelTail<ParseAdd<T>>;
type RelTail<R> = R extends [infer L extends Ast, infer Rest extends Tok[]] ? Rest extends [{
  k: 'op';
  v: infer O extends '<=' | '>=' | '<' | '>';
}, ...infer After extends Tok[]] ? ParseAdd<After> extends [infer Rh extends Ast, infer Next extends Tok[]] ? RelTail<[{
  t: 'bin';
  op: O;
  l: L;
  r: Rh;
}, Next]> : 'err' : R : R;
type ParseAdd<T extends Tok[]> = AddTail<ParseMul<T>>;
type AddTail<R> = R extends [infer L extends Ast, infer Rest extends Tok[]] ? Rest extends [{
  k: 'op';
  v: infer O extends '+' | '-';
}, ...infer After extends Tok[]] ? ParseMul<After> extends [infer Rh extends Ast, infer Next extends Tok[]] ? AddTail<[{
  t: 'bin';
  op: O;
  l: L;
  r: Rh;
}, Next]> : 'err' : R : R;
type ParseMul<T extends Tok[]> = MulTail<ParseUnary<T>>;
type MulTail<R> = R extends [infer L extends Ast, infer Rest extends Tok[]] ? Rest extends [{
  k: 'op';
  v: infer O extends '*' | '/' | '%';
}, ...infer After extends Tok[]] ? ParseUnary<After> extends [infer Rh extends Ast, infer Next extends Tok[]] ? MulTail<[{
  t: 'bin';
  op: O;
  l: L;
  r: Rh;
}, Next]> : 'err' : R : R;
type ParseUnary<T extends Tok[]> = T extends [{
  k: 'op';
  v: infer O extends UnOp;
}, ...infer Rest extends Tok[]] ? ParseUnary<Rest> extends [infer X extends Ast, infer Next extends Tok[]] ? [{
  t: 'un';
  op: O;
  x: X;
}, Next] : 'err' : ParsePrimary<T>;
type ParsePrimary<T extends Tok[]> = T extends [{
  k: 'num';
  v: infer V extends string;
}, ...infer R extends Tok[]] ? [{
  t: 'lit';
  v: V;
}, R] : T extends [{
  k: 'str';
  v: infer V extends string;
}, ...infer R extends Tok[]] ? [{
  t: 'lit';
  v: V;
}, R] : T extends [{
  k: 'bool';
  v: infer V extends string;
}, ...infer R extends Tok[]] ? [{
  t: 'lit';
  v: V;
}, R] : T extends [{
  k: 'id';
  v: infer V extends string;
}, ...infer R extends Tok[]] ? [{
  t: 'key';
  v: V;
}, R] : T extends [{
  k: 'lp';
}, ...infer Rest extends Tok[]] ? ParseOr<Rest> extends [infer N extends Ast, infer After extends Tok[]] ? After extends [{
  k: 'rp';
}, ...infer Next extends Tok[]] ? [N, Next] : 'err' : 'err' : 'err';
type CollectKeys<N> = N extends KeyNode ? N['v'] : N extends UnNode ? CollectKeys<N['x']> : N extends {
  t: 'bin';
  op: '==' | '!=';
  l: infer L;
} ? CollectKeys<L> : N extends BinNode ? CollectKeys<N['l']> | CollectKeys<N['r']> : never;
/**
 * Validate a when-clause expression string `S` against context type `T`.
 * Returns `S` on success, or a `WhenExpressionError<Msg>` branded error string
 * that surfaces at the call site with a human-readable message.
 *
 * - Dynamic `string` expressions skip all validation.
 * - Wide context types (`object`, `any`, `unknown`, `Record<string, unknown>`,
 *   empty `{}`, etc.) still run **syntax** checking but skip **key** checking.
 * - Specific context types run full validation (syntax + keys).
 */
type ValidateExpression<S extends string, T> = string extends S ? S : Tokenize<S> extends infer Toks ? Toks extends TokErr ? WhenExpressionError<`Syntax error: ${Toks['__err']}`> : Toks extends Tok[] ? Parse<Toks> extends [infer N extends Ast, [{
  k: 'eof';
}]] ? [keyof T] extends [never] ? S : string extends keyof T ? S : Exclude<CollectKeys<N>, ContextPaths<T>> extends infer Missing ? [Missing] extends [never] ? S : WhenExpressionError<`Unknown context key: "${Extract<Missing, string>}"`> : never : WhenExpressionError<'Syntax error in expression'> : never : never;
/**
 * A when-clause expression string validated against context type `T`.
 * Use inside your own typed define helpers to have TypeScript check `when`
 * fields at the call site.
 *
 * @example
 * interface AppCtx { mode: 'dev' | 'prod', debug: boolean }
 *
 * function defineCommand<const W extends string>(cmd: {
 *   name: string
 *   title: string
 *   when?: WhenExpression<AppCtx, W>
 * }): typeof cmd {
 *   return cmd
 * }
 *
 * defineCommand({ name: 'x', title: 'X', when: 'debug && mode == dev' })
 * defineCommand({ name: 'x', title: 'X', when: 'typo' })
 * //                                            ^^^^^ type error
 */
type WhenExpression$1<T, S extends string> = S & ValidateExpression<S, T>; //#endregion
//#region src/index.d.ts
//#endregion
//#region src/utils/when.d.ts
/**
 * Context object for evaluating `when` expressions.
 *
 * Built-in variables:
 * - `clientType` — `'embedded' | 'standalone'`
 * - `dockOpen` — whether the dock panel is open
 * - `paletteOpen` — whether the command palette is open
 * - `dockSelectedId` — ID of the selected dock entry (empty string if none)
 *
 * Plugins can add namespaced variables using dot or colon separators:
 * - `vite.mode`, `vite:mode` — stored as `{ 'vite.mode': 'development' }` or nested `{ vite: { mode: 'development' } }`
 *
 * Supported operators: `!`, `==`, `!=`, `===`, `!==`, `<`, `<=`, `>`, `>=`,
 * `&&`, `||`, `+`, `-`, `*`, `/`, `%`. Parentheses, number and string literals
 * are also supported.
 */
interface WhenContext {
  clientType: 'embedded' | 'standalone';
  dockOpen: boolean;
  paletteOpen: boolean;
  dockSelectedId: string;
  /** Allow custom context variables from plugins */
  [key: string]: unknown;
}
/**
 * A statically-validated `when` expression string. Used inside `define*`
 * helpers to surface unknown context keys and syntax errors as TypeScript
 * errors at the call site.
 */
type WhenExpression<T, S extends string> = WhenExpression$1<T, S>;
/** Options for `evaluateWhen`. */
interface EvaluateWhenOptions {
  /**
   * Throw when the expression references a context key that does not exist.
   *
   * @default false
   */
  strict?: boolean;
}
/**
 * Evaluate a when-clause expression string against a context object.
 *
 * @example
 * evaluateWhen('dockOpen && clientType == embedded', ctx)
 */
declare function evaluateWhen<T extends object, const E extends string>(expression: E & WhenExpression$1<T, E>, context: T, options?: EvaluateWhenOptions): boolean;
/**
 * Resolve a context value by key. Supports namespaced keys with `.` or `:`
 * separators. Returns `undefined` for unknown keys.
 */
declare function resolveContextValue<T extends Record<string, unknown>>(key: string, context: T): unknown;
//#endregion
export { EvaluateWhenOptions, WhenContext, type WhenExpression, evaluateWhen, resolveContextValue };