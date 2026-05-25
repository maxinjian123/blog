import { UnpluginInstance } from 'unplugin';
import { Plugin } from 'vite';
import { V as VitePluginOptions } from './shared/bundler.LjD9SWtb.mjs';

/**
 * Per-framework factory config. `framework` is the package name (e.g.
 * `@unhead/vue`) used internally by the base bundler to import runtime
 * plugins from the right path; `streamingPlugin` is the framework's
 * streaming unplugin instance (as returned by `createUnplugin`).
 */
interface FrameworkPluginConfig<S> {
    framework: string;
    streamingPlugin: UnpluginInstance<S | undefined, boolean>;
}
interface UnheadFrameworkOptions<S> extends VitePluginOptions {
    /** Enable streaming SSR support. */
    streaming?: true | S | false;
    /**
     * Inject the runtime `ValidatePlugin`. **Vite-only**: ignored by `.webpack()`,
     * `.rspack()`, and `.rollup()` because injection happens via the Vite
     * `CreateHeadTransform` plugin, which has no equivalent on other bundlers.
     */
    validate?: VitePluginOptions['validate'];
    /**
     * Enable the Vite Devtools integration. **Vite-only**: ignored by `.webpack()`,
     * `.rspack()`, and `.rollup()` since `unheadDevtools` depends on
     * `@vitejs/devtools-kit`.
     */
    devtools?: VitePluginOptions['devtools'];
}
/**
 * Shape returned by the unified framework factory. Mirrors the subset of
 * `UnpluginInstance` methods that Nuxt's `addBuildPlugin` consumes, so a
 * call site can forward the factory object directly.
 *
 * Note: `rollup()` is provided for completeness (e.g. SSG static builds)
 * but does **not** detect SSR context. `SSRStaticReplace` always sees
 * `ssr=false` here because rollup has no equivalent of vite's
 * `env.isSsrBuild` or webpack's `compiler.options.name === 'server'` hook;
 * `head.ssr` references will always be statically rewritten to `false`.
 * Use `.vite()` or `.webpack()` for SSR builds.
 */
interface UnheadBundlerFactory {
    vite: () => Plugin[];
    webpack: () => any[];
    rspack: () => any[];
    rollup: () => any[];
}
/**
 * Unified framework factory. Returns an object with per-bundler dispatch
 * methods so consumers (e.g. Nuxt's `addBuildPlugin`) can forward it
 * directly without per-bundler imports.
 *
 * @example
 * ```ts
 * // framework-side:
 * export const Unhead = createFrameworkPlugin({
 *   framework: '@unhead/vue',
 *   streamingPlugin: unheadVueStreamingPlugin,
 * })
 *
 * // consumer-side (vite):
 * plugins: [...Unhead({ streaming: true }).vite()]
 *
 * // consumer-side (nuxt kit):
 * addBuildPlugin(Unhead({ streaming: true }))
 * ```
 */
declare function createFrameworkPlugin<S>({ framework, streamingPlugin }: FrameworkPluginConfig<S>): (options?: UnheadFrameworkOptions<S>) => UnheadBundlerFactory;

export { createFrameworkPlugin };
export type { FrameworkPluginConfig, UnheadBundlerFactory, UnheadFrameworkOptions };
