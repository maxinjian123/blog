import { SafeInputPlugin, FlatMetaPlugin } from 'unhead/plugins';
import { walkResolver } from 'unhead/utils';
import { hasInjectionContext, inject, ref, getCurrentScope, watchEffect, getCurrentInstance, onBeforeUnmount, onDeactivated, onActivated } from 'vue';
import { h as headSymbol } from './vue.Kp0sxz0n.mjs';
import { V as VueResolver } from './vue.CkLIG7eN.mjs';

// @__NO_SIDE_EFFECTS__
function injectHead() {
  if (hasInjectionContext()) {
    const instance = inject(headSymbol);
    if (instance) {
      return instance;
    }
  }
  throw new Error("useHead() was called without provide context, ensure you call it through the setup() function.");
}
function useHead(input, options = {}) {
  const head = options.head || /* @__PURE__ */ injectHead();
  return head.ssr ? head.push(input || {}, options) : clientUseHead(head, input, options);
}
function clientUseHead(head, input, options = {}) {
  const deactivated = ref(false);
  if (options.onRendered) {
    const scope = getCurrentScope();
    if (scope) {
      const _onRendered = options.onRendered;
      options = { ...options, onRendered: (ctx) => scope.run(() => _onRendered(ctx)) };
    }
  }
  let entry;
  watchEffect(() => {
    const i = deactivated.value ? {} : walkResolver(input, VueResolver);
    if (entry) {
      entry.patch(i);
    } else {
      entry = head.push(i, options);
    }
  });
  const vm = getCurrentInstance();
  if (vm) {
    onBeforeUnmount(() => {
      entry.dispose();
    });
    onDeactivated(() => {
      deactivated.value = true;
    });
    onActivated(() => {
      deactivated.value = false;
    });
  }
  return entry;
}
function useHeadSafe(input = {}, options = {}) {
  const head = options.head || /* @__PURE__ */ injectHead();
  head.use(SafeInputPlugin);
  options._safe = true;
  return useHead(input, options);
}
function useSeoMeta(input = {}, options = {}) {
  const head = options.head || /* @__PURE__ */ injectHead();
  head.use(FlatMetaPlugin);
  const { title, titleTemplate, ...meta } = input;
  return useHead({
    title,
    titleTemplate,
    _flatMeta: meta
  }, options);
}
const useServerHead = useHead;
const useServerHeadSafe = useHeadSafe;
const useServerSeoMeta = useSeoMeta;

export { useHeadSafe as a, useSeoMeta as b, useServerHead as c, useServerHeadSafe as d, useServerSeoMeta as e, injectHead as i, useHead as u };
