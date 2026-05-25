import { createStreamableHead as createStreamableHead$1 } from 'unhead/stream/client';
import { v as vueInstall } from '../shared/vue.Kp0sxz0n.mjs';
import { V as VueResolver } from '../shared/vue.CkLIG7eN.mjs';
export { V as VueHeadMixin } from '../shared/vue.BIIm5xba.mjs';
import 'vue';
import '../shared/vue.Cn5tnr29.mjs';
import 'unhead/plugins';
import 'unhead/utils';

// @__NO_SIDE_EFFECTS__
function createStreamableHead(options = {}) {
  const head = createStreamableHead$1({
    ...options,
    propResolvers: [VueResolver, ...options.propResolvers || []]
  });
  if (head) {
    head.install = vueInstall(head);
  }
  return head;
}

export { createStreamableHead };
