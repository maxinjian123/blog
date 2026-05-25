import { createHead as createHead$1 } from 'unhead/server';
export { propsToString, renderSSRHead, transformHtmlTemplate } from 'unhead/server';
import { v as vueInstall } from './shared/vue.Kp0sxz0n.mjs';
import { V as VueResolver } from './shared/vue.CkLIG7eN.mjs';
export { V as VueHeadMixin } from './shared/vue.BIIm5xba.mjs';
import 'vue';
import './shared/vue.Cn5tnr29.mjs';
import 'unhead/plugins';
import 'unhead/utils';

// @__NO_SIDE_EFFECTS__
function createHead(options = {}) {
  const head = createHead$1({
    ...options,
    propResolvers: [VueResolver]
  });
  head.install = vueInstall(head);
  return head;
}

export { createHead };
