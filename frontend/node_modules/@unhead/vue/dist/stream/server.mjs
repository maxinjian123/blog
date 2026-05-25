import { createStreamableHead as createStreamableHead$1, prepareStreamingTemplate, renderSSRHeadSuspenseChunk } from 'unhead/stream/server';
export { createBootstrapScript, prepareStreamingTemplate, renderSSRHeadShell, renderSSRHeadSuspenseChunk, renderShell, wrapStream } from 'unhead/stream/server';
import { v as vueInstall } from '../shared/vue.Kp0sxz0n.mjs';
import { V as VueResolver } from '../shared/vue.CkLIG7eN.mjs';
import 'vue';

function createStreamableHead(options = {}) {
  const { head } = createStreamableHead$1({
    ...options,
    propResolvers: [VueResolver]
  });
  const vueHead = head;
  vueHead.install = vueInstall(vueHead);
  const encoder = new TextEncoder();
  const flushPatch = (controller) => {
    const patch = renderSSRHeadSuspenseChunk(vueHead);
    if (patch)
      controller.enqueue(encoder.encode(`<script>${patch};document.currentScript.remove()<\/script>`));
  };
  return {
    head: vueHead,
    wrapStream: (stream, template) => new ReadableStream({
      async start(controller) {
        try {
          const { shell, end } = prepareStreamingTemplate(vueHead, template);
          controller.enqueue(encoder.encode(shell));
          const reader = stream.getReader();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done)
                break;
              controller.enqueue(value);
              flushPatch(controller);
            }
          } finally {
            reader.releaseLock();
          }
          flushPatch(controller);
          controller.enqueue(encoder.encode(end));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    })
  };
}

export { createStreamableHead };
