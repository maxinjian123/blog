import { createFrameworkPlugin } from '@unhead/bundler/framework';
import { u as unheadVueStreamingPlugin } from './shared/vue.D3FlIlye.mjs';
import 'unhead/stream/unplugin';
import 'unplugin';

const Unhead = createFrameworkPlugin({
  framework: "@unhead/vue",
  streamingPlugin: unheadVueStreamingPlugin
});

export { Unhead };
