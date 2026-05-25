/**
 * Lightweight CSS minifier in pure JS (no native deps).
 * Strips comments and collapses whitespace while preserving string literals.
 */
declare function minifyCSS(code: string): string;

/**
 * Lightweight JS minifier in pure JS (no native deps).
 * Strips comments and collapses whitespace while preserving string literals.
 */
declare function minifyJS(code: string): string;

/**
 * Minify JSON by re-serializing (strips whitespace).
 * Returns the original string unchanged if parsing fails.
 */
declare function minifyJSON(code: string): string;

export { minifyCSS, minifyJS, minifyJSON };
