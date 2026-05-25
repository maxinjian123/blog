import { createDomRenderer, createDebouncedFn, createHead as createHead$1 } from 'unhead/client';
export { renderDOMHead } from 'unhead/client';
import { v as vueInstall } from './shared/vue.Kp0sxz0n.mjs';
export { V as VueHeadMixin } from './shared/vue.BIIm5xba.mjs';
import 'vue';
import './shared/vue.Cn5tnr29.mjs';
import 'unhead/plugins';
import 'unhead/utils';
import './shared/vue.CkLIG7eN.mjs';

// @__NO_SIDE_EFFECTS__
function createHead(options = {}) {
  const domRenderer = createDomRenderer();
  let head;
  const debouncedRenderer = createDebouncedFn(() => domRenderer(head), (fn) => setTimeout(fn, 0));
  head = createHead$1({ render: debouncedRenderer, ...options });
  head.install = vueInstall(head);
  return head;
}

export { createHead };
