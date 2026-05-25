import { V as ValidationRuleId } from './shared/unhead.Dl_lRDXb.mjs';
export { a as RuleConfig, b as RuleSeverity, R as RulesConfig, d as VALIDATION_RULE_IDS, c as ValidationRuleOptions } from './shared/unhead.Dl_lRDXb.mjs';

declare const URL_META_KEYS: Set<string>;
declare const KNOWN_META_PROPERTIES: Set<string>;
declare const KNOWN_META_NAMES: Set<string>;
declare const TAG_PRIORITY_ALIASES: readonly ["critical", "high", "low"];
type TagPriorityAlias = typeof TAG_PRIORITY_ALIASES[number];
/**
 * Deprecated v2 tag-prop names with their v3 replacement, used by both the
 * runtime validate plugin and the eslint plugin.
 */
declare const DEPRECATED_PROPS: Record<string, {
    replacement: string;
    ruleId: 'deprecated-prop-children' | 'deprecated-prop-hid-vmid' | 'deprecated-prop-body';
}>;

declare function levenshtein(a: string, b: string): number;
declare function findClosestMatch(value: string, knownSet: Set<string>): string | undefined;

/**
 * Materialized view of a single head tag (`<meta>`, `<link>`, `<script>`, etc.)
 * suitable for parser-agnostic predicate checks. Adapters in the eslint-plugin
 * and the CLI walk their respective ASTs and produce one of these per tag.
 *
 * `props` only contains entries whose value is statically resolvable to a
 * primitive. `keys` contains every key that appeared in the source, including
 * those whose value couldn't be resolved (computed expressions, identifier
 * references, etc.). Predicates that need to know "did this key appear at all"
 * read `keys`; predicates that need the value read `props`.
 */
interface TagInput {
    /** Tag list this came from in the head input (`meta` / `link` / `script` / `noscript` / `style`). */
    tagType: 'meta' | 'link' | 'script' | 'noscript' | 'style';
    /** Statically-resolvable props. */
    props: Record<string, string | number | boolean>;
    /** Every prop name that appeared in source, resolvable or not. */
    keys: Set<string>;
    /** Adapter-supplied opaque marker for the whole tag literal. */
    loc?: unknown;
    /** Adapter-supplied opaque marker for individual prop values. */
    propLocs?: Record<string, unknown>;
    /** Whether this tag literal lives inside an array element (vs standalone, e.g. inside `defineLink(...)`). */
    inArray?: boolean;
}
/**
 * Top-level head input passed to `useHead` / `useSeoMeta`. Only the scalar
 * top-level keys we actually validate are surfaced; tag-array predicates run
 * against per-tag {@link TagInput}s instead.
 */
interface HeadInputView {
    /** Name of the calling composable (`useHead`, `useSeoMeta`, …). */
    callee: string;
    /** Statically-resolvable scalar props (currently `title`, `titleTemplate`). */
    props: Record<string, string>;
    /** Every top-level key that appeared, resolvable or not. */
    keys: Set<string>;
    loc?: unknown;
    propLocs?: Record<string, unknown>;
}
/**
 * A logical fix described in source-agnostic terms. Each adapter knows how to
 * translate this into either an ESLint `RuleFixer` call or a `magic-string`
 * edit.
 */
type PredicateFix = {
    type: 'rename-prop';
    key: string;
    newKey: string;
}
/** Replace the value half of `key: value` with literal source text. */
 | {
    type: 'replace-prop-value';
    key: string;
    newSource: string;
}
/** Replace the entire `key: value` pair with literal source text. */
 | {
    type: 'replace-prop';
    key: string;
    newSource: string;
}
/** Insert source text immediately after the named prop (caller supplies the leading `, `). */
 | {
    type: 'insert-after-prop';
    afterKey: string;
    insert: string;
}
/** Remove a property and its surrounding comma. */
 | {
    type: 'remove-prop';
    key: string;
}
/** Wrap the whole tag literal with a call expression: `wrapWith(<tag>)`. */
 | {
    type: 'wrap-tag';
    wrapWith: string;
};
interface DiagnosticSuggestion {
    /** Already-formatted, human-readable suggestion label. */
    message: string;
    fix: PredicateFix;
}
interface Diagnostic {
    ruleId: ValidationRuleId;
    /** Already-formatted, human-readable diagnostic message. */
    message: string;
    /**
     * Optional narrowed location:
     * - `{ kind: 'tag' }` (default) → `tag.loc`
     * - `{ kind: 'prop-key', key }` → key half of the named prop
     * - `{ kind: 'prop-value', key }` → value half of the named prop
     * - `{ kind: 'prop', key }` → whole `key: value` pair
     */
    at?: {
        kind: 'tag';
    } | {
        kind: 'prop-key';
        key: string;
    } | {
        kind: 'prop-value';
        key: string;
    } | {
        kind: 'prop';
        key: string;
    };
    /** Autofix to apply when the diagnostic is unambiguous. */
    fix?: PredicateFix;
    /** Editor suggestions when an autofix would be too risky to apply blindly. */
    suggestions?: DiagnosticSuggestion[];
}
/**
 * Optional context passed by the adapter. Predicates that don't need any of
 * these should ignore the argument entirely.
 */
interface PredicateContext {
    /**
     * Map of canonical helper names (`defineLink`, `defineScript`) to the local
     * binding they're imported under (`'defineLink'` for an unaliased import,
     * `'dl'` for `import { defineLink as dl }`). Predicates emit fixes using
     * the local binding so renamed imports stay valid.
     */
    importedHelpers?: Map<string, string>;
}
type TagPredicate = (tag: TagInput, ctx?: PredicateContext) => Diagnostic[];
type HeadInputPredicate = (input: HeadInputView, ctx?: PredicateContext) => Diagnostic[];

declare const emptyMetaContent: TagPredicate;

declare const noDeprecatedProps: TagPredicate;

declare const noHtmlInTitle: HeadInputPredicate;

declare const noUnknownMeta: TagPredicate;

declare const nonAbsoluteCanonical: TagPredicate;

declare const numericTagPriority: TagPredicate;

/**
 * Suggests wrapping per-tag object literals with their `defineX` helper so
 * the v3 discriminated-union types narrow correctly.
 *
 * Adapter responsibilities:
 * - Only call this for tags that live inside an array (`tag.inArray === true`).
 * - Pass `ctx.importedHelpers` so the predicate knows when to surface a hard
 *   autofix (helper already imported) vs a suggestion (would need an import).
 */
declare const preferDefineHelpers: TagPredicate;

declare const preloadMissingAs: TagPredicate;
declare const preloadFontCrossorigin: TagPredicate;

declare const robotsConflict: TagPredicate;

declare const deferOnModuleScript: TagPredicate;
declare const scriptSrcWithContent: TagPredicate;

declare const twitterHandleMissingAt: TagPredicate;

declare const viewportUserScalable: TagPredicate;

/**
 * Subset of the runtime `HeadTag` shape this adapter needs. We don't import
 * `HeadTag` from `../types` to keep the predicate module free of runtime
 * coupling — anything compatible with this shape works.
 */
interface RuntimeHeadTag {
    tag: string;
    props: Record<string, any>;
    innerHTML?: string;
    textContent?: string;
    /** Top-level priority field on resolved runtime tags. */
    tagPriority?: string | number;
}
/**
 * Adapt a runtime tag (post-resolve `HeadTag`) into a {@link TagInput} that
 * predicates can read. Coerces `props.content` to a string and lowercases
 * `meta[name]` to mirror HTML's case-insensitive `name=` semantics, matching
 * the runtime `ValidatePlugin`'s pre-existing behaviour.
 *
 * Returns `undefined` when the tag is not one of the validated tag types
 * (`title`, `base`, etc. are handled separately).
 */
declare function tagInputFromRuntime(tag: RuntimeHeadTag): TagInput | undefined;
/**
 * Adapt a `<title>` runtime tag (`tag.tag === 'title'`) into a
 * {@link HeadInputView} so the `no-html-in-title` predicate can run against
 * the resolved title text.
 */
declare function titleInputFromRuntime(titleTag: RuntimeHeadTag): HeadInputView | undefined;

declare const tagPredicates: {
    'defer-on-module-script': TagPredicate;
    'empty-meta-content': TagPredicate;
    'no-deprecated-props': TagPredicate;
    'no-unknown-meta': TagPredicate;
    'non-absolute-canonical': TagPredicate;
    'numeric-tag-priority': TagPredicate;
    'preload-font-crossorigin': TagPredicate;
    'preload-missing-as': TagPredicate;
    'robots-conflict': TagPredicate;
    'script-src-with-content': TagPredicate;
    'twitter-handle-missing-at': TagPredicate;
    'viewport-user-scalable': TagPredicate;
};
/** Migration-only tag predicates — opt-in via the `migration` config preset. */
declare const migrationTagPredicates: {
    'prefer-define-helpers': TagPredicate;
};
declare const headInputPredicates: {
    'no-html-in-title': HeadInputPredicate;
};

export { DEPRECATED_PROPS, KNOWN_META_NAMES, KNOWN_META_PROPERTIES, TAG_PRIORITY_ALIASES, URL_META_KEYS, ValidationRuleId, deferOnModuleScript, emptyMetaContent, findClosestMatch, headInputPredicates, levenshtein, migrationTagPredicates, noDeprecatedProps, noHtmlInTitle, noUnknownMeta, nonAbsoluteCanonical, numericTagPriority, preferDefineHelpers, preloadFontCrossorigin, preloadMissingAs, robotsConflict, scriptSrcWithContent, tagInputFromRuntime, tagPredicates, titleInputFromRuntime, twitterHandleMissingAt, viewportUserScalable };
export type { Diagnostic, DiagnosticSuggestion, HeadInputPredicate, HeadInputView, PredicateContext, PredicateFix, RuntimeHeadTag, TagInput, TagPredicate, TagPriorityAlias };
