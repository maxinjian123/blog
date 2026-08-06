<template>
  <pre class="code-block"><code class="hljs" v-html="html"></code></pre>
</template>

<script setup lang="ts">
import {computed} from 'vue'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import json from 'highlight.js/lib/languages/json'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import bash from 'highlight.js/lib/languages/bash'
import 'highlight.js/styles/atom-one-dark.css'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('json', json)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('css', css)
hljs.registerLanguage('bash', bash)

const props = withDefaults(defineProps<{
  code?: string
  language?: 'javascript' | 'typescript' | 'json' | 'xml' | 'css' | 'bash'
}>(), {
  code: '',
  language: 'javascript'
})

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const html = computed(() => {
  if (!props.code) return ''
  try {
    if (hljs.getLanguage(props.language)) {
      return hljs.highlight(props.code, {language: props.language}).value
    }
  } catch (e) {
    // 忽略，走自动检测
  }
  try {
    return hljs.highlightAuto(props.code).value
  } catch (e) {
    return escapeHtml(props.code)
  }
})
</script>

<style scoped>
.code-block {
  background: #1e1e1e;
  border-radius: 8px;
  padding: 16px;
  font-size: 12.5px;
  line-height: 1.7;
  overflow: auto;
  font-family: 'Consolas', 'Courier New', monospace;
  margin: 0;
}
.code-block :deep(code.hljs) {
  background: transparent;
  padding: 0;
}
</style>
