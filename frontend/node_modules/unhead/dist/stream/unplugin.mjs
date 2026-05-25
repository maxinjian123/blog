import { createUnplugin } from 'unplugin';

const VIRTUAL_CLIENT_ID = "virtual:@unhead/streaming-client";
const VIRTUAL_IIFE_ID = "virtual:@unhead/streaming-iife.js";
const RESOLVED_ID = `\0${VIRTUAL_CLIENT_ID}`;
const RESOLVED_IIFE_ID = `\0${VIRTUAL_IIFE_ID}`;
const VIRTUAL_RE = /virtual:@unhead\/streaming/;
const RESOLVED_RE = /^\0virtual:@unhead\/streaming/;
let iifeCode;
let iifeCodeLoading;
async function loadIifeCode() {
  if (iifeCode)
    return;
  iifeCodeLoading ||= import('unhead/stream/iife').then((mod) => {
    iifeCode = mod.streamingIifeCode;
  });
  await iifeCodeLoading;
}
function resolveNonce(nonce) {
  if (!nonce)
    return void 0;
  return typeof nonce === "function" ? nonce() : nonce;
}
function buildClientStub(framework, streamKey, warnOnMissing) {
  const key = JSON.stringify(streamKey);
  const warnBranch = warnOnMissing ? `else{console.warn('[unhead] streaming client loaded but window['+${key}+'] is undefined; did the server call wrapStream()/renderSSRHeadShell()?')}` : "";
  return `import{createHead}from'${framework}/client'
const s=window[${key}];if(s){const q=s._q;s._q=[];const h=createHead({document});q.forEach(e=>h.push(e));s.push=e=>h.push(e);s._head=h}${warnBranch}`;
}
function buildStreamingPluginOptions(options) {
  const {
    framework,
    name,
    mode = "async",
    nonce,
    streamKey = "__unhead__",
    warnOnMissingServerBootstrap
  } = options;
  const state = {
    isBuild: false,
    ssr: false
  };
  function isSSRCall(hookThis, opts) {
    const envName = hookThis?.environment?.name;
    return envName === "ssr" || envName === "server" || opts?.ssr === true || state.ssr;
  }
  function warnEnabled() {
    return warnOnMissingServerBootstrap ?? !state.isBuild;
  }
  return {
    name: name ?? `${framework}:streaming`,
    enforce: "pre",
    async buildStart() {
      await loadIifeCode();
      if (mode === "async" && state.isBuild && typeof this.emitFile === "function") {
        if (!iifeCode)
          throw new Error("[unhead] Streaming IIFE not built. Run `pnpm build` in packages/unhead first.");
        state.emittedIifeFileName = this.emitFile({
          type: "asset",
          name: "unhead-streaming.js",
          source: iifeCode
        });
      }
    },
    resolveId: {
      filter: { id: VIRTUAL_RE },
      handler(id) {
        if (id === VIRTUAL_CLIENT_ID || id === `/${VIRTUAL_CLIENT_ID}`)
          return RESOLVED_ID;
        if (id === VIRTUAL_IIFE_ID || id === `/${VIRTUAL_IIFE_ID}`)
          return RESOLVED_IIFE_ID;
      }
    },
    load: {
      filter: { id: RESOLVED_RE },
      handler(id, opts) {
        const isSSR = isSSRCall(this, opts);
        if (id === RESOLVED_ID) {
          if (isSSR)
            return { code: "export {}", moduleType: "js" };
          return {
            code: buildClientStub(framework, streamKey, warnEnabled()),
            moduleType: "js"
          };
        }
        if (id === RESOLVED_IIFE_ID) {
          if (isSSR)
            return { code: "", moduleType: "js" };
          if (!iifeCode)
            throw new Error("[unhead] Streaming IIFE not built. Run `pnpm build` in packages/unhead first.");
          return { code: iifeCode, moduleType: "js" };
        }
      }
    },
    ...options.transform && options.filter ? {
      transform: {
        filter: { id: options.filter },
        handler(code, id, opts) {
          return options.transform(code, id, { ssr: isSSRCall(this, opts) });
        }
      }
    } : {},
    webpack(compiler) {
      const { name: n, target } = compiler.options;
      if (n === "server" || target === "node" || target === "async-node")
        state.ssr = true;
    },
    rspack(compiler) {
      const { name: n, target } = compiler.options;
      if (n === "server" || target === "node" || target === "async-node")
        state.ssr = true;
    },
    vite: {
      apply(_config, env) {
        if (env.isSsrBuild)
          state.ssr = true;
        if (env.command === "build")
          state.isBuild = true;
        return true;
      },
      configResolved(config) {
        if (config.command === "build")
          state.isBuild = true;
      },
      transformIndexHtml: {
        // `order: 'pre'` is separate from the plugin-level `enforce: 'pre'`:
        // it runs this HTML transform before other non-pre HTML transforms
        // so the virtual module `<script>` tags we inject go through the
        // full Vite plugin pipeline (resolveId/load) and aren't stripped or
        // rewritten by downstream HTML transforms.
        order: "pre",
        handler() {
          const nonceValue = resolveNonce(nonce);
          const nonceAttr = nonceValue ? { nonce: nonceValue } : {};
          if (mode === "inline") {
            if (!iifeCode)
              throw new Error("[unhead] Streaming IIFE not built. Run `pnpm build` in packages/unhead first.");
            return [{
              tag: "script",
              attrs: nonceAttr,
              children: iifeCode,
              injectTo: "head-prepend"
            }];
          }
          if (mode === "async") {
            const src = state.isBuild && state.emittedIifeFileName ? `/${state.emittedIifeFileName}` : `/${VIRTUAL_IIFE_ID}`;
            return [{
              tag: "script",
              attrs: { ...nonceAttr, async: true, src },
              injectTo: "head-prepend"
            }];
          }
          return [{
            tag: "script",
            attrs: nonceAttr,
            children: `import("/${VIRTUAL_CLIENT_ID}")`,
            injectTo: "head-prepend"
          }];
        }
      }
    }
  };
}
const createStreamingPlugin = createUnplugin(buildStreamingPluginOptions);

export { VIRTUAL_CLIENT_ID, VIRTUAL_IIFE_ID, buildStreamingPluginOptions, createStreamingPlugin };
