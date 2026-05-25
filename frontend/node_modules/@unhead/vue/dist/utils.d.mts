import { PropResolver, ResolvableHead } from 'unhead/types';
export * from 'unhead/utils';

declare const VueResolver: PropResolver;

/**
 * @deprecated Use head.resolveTags() instead.
 */
declare function resolveUnrefHeadInput(input: any): ResolvableHead;

export { VueResolver, resolveUnrefHeadInput };
