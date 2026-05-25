import { DeprecationsPlugin } from 'unhead/legacy';
import { PromisesPlugin, TemplateParamsPlugin, AliasSortingPlugin } from 'unhead/plugins';
import { createHead as createHead$1 } from './client.mjs';
import { createHead as createHead$2 } from './server.mjs';
export { V as VueHeadMixin } from './shared/vue.BIIm5xba.mjs';
export { renderDOMHead } from 'unhead/client';
import './shared/vue.Kp0sxz0n.mjs';
import 'unhead/server';
import './shared/vue.CkLIG7eN.mjs';
import 'vue';
import './shared/vue.Cn5tnr29.mjs';
import 'unhead/utils';

const legacyPlugins = [DeprecationsPlugin, PromisesPlugin, TemplateParamsPlugin, AliasSortingPlugin];
// @__NO_SIDE_EFFECTS__
function createHead(options = {}) {
  return createHead$1({
    ...options,
    plugins: [...legacyPlugins, ...options.plugins || []]
  });
}
// @__NO_SIDE_EFFECTS__
function createServerHead(options = {}) {
  return createHead$2({
    ...options,
    plugins: [...legacyPlugins, ...options.plugins || []]
  });
}

export { createHead$1 as createClientHead, createHead, createServerHead, legacyPlugins };
