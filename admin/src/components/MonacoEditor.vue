<template>
  <div class="monaco-editor-wrap">
    <div ref="containerEl" class="monaco-editor-container"></div>
    <div v-if="showPlaceholder" class="monaco-placeholder" @click="focusEditor">
      {{ placeholder }}
    </div>
    <div v-if="loading" class="monaco-loading">
      <a-spin size="small"/>
      <span>正在加载代码编辑器…</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref, shallowRef, watch} from 'vue'

const props = withDefaults(defineProps<{
  modelValue: string
  language?: 'html' | 'css' | 'javascript'
  placeholder?: string
}>(), {
  language: 'html',
  placeholder: ''
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const containerEl = ref<HTMLDivElement | null>(null)
const loading = ref(false)
const editor = shallowRef<any>(null)
const monaco = shallowRef<any>(null)
const focused = ref(false)

let syncingFromExternal = false

// 占位符：内容为空且未聚焦时显示
const showPlaceholder = computed(
  () => !!props.placeholder && !props.modelValue && !focused.value
)

function focusEditor() {
  editor.value?.focus()
}

// 语言映射：组件语言 -> Monaco 语言 id
function toMonacoLang(lang: string): string {
  if (lang === 'html') return 'html'
  if (lang === 'css') return 'css'
  return 'javascript'
}

onMounted(async () => {
  loading.value = true
  try {
    const {initMonaco} = await import('@/utils/monaco')
    const m = await initMonaco()
    monaco.value = m

    editor.value = m.editor.create(containerEl.value!, {
      value: props.modelValue || '',
      language: toMonacoLang(props.language),
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: {enabled: false},
      fontSize: 13,
      lineHeight: 21,
      tabSize: 2,
      insertSpaces: true,
      wordWrap: 'on',
      scrollBeyondLastLine: false,
      renderWhitespace: 'selection',
      suggestOnTriggerCharacters: true,
      quickSuggestions: {other: true, comments: false, strings: true},
      parameterHints: {enabled: true},
      // 常见代码提示快捷键
      acceptSuggestionOnEnter: 'smart'
    })

    // 内容变化 -> 通知父组件
    editor.value.onDidChangeModelContent(() => {
      if (syncingFromExternal) return
      emit('update:modelValue', editor.value.getValue())
    })

    // 焦点状态（用于占位符显隐）
    editor.value.onDidFocusEditorText(() => {
      focused.value = true
    })
    editor.value.onDidBlurEditorText(() => {
      focused.value = false
    })

    // 语言切换
    watch(
      () => props.language,
      (lang) => {
        if (editor.value && monaco.value) {
          const model = editor.value.getModel()
          monaco.value.editor.setModelLanguage(model, toMonacoLang(lang))
        }
      }
    )

    // 外部值同步（如打开编辑、撤销保存后的刷新）
    watch(
      () => props.modelValue,
      (v) => {
        if (!editor.value) return
        if (editor.value.getValue() !== (v || '')) {
          syncingFromExternal = true
          editor.value.setValue(v || '')
          syncingFromExternal = false
        }
      }
    )
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  editor.value?.dispose()
  editor.value = null
})
</script>

<style scoped>
.monaco-editor-wrap {
  position: relative;
  height: 620px;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  overflow: hidden;
  background: #1e1e1e;
}
.monaco-editor-container {
  width: 100%;
  height: 100%;
}
.monaco-placeholder {
  position: absolute;
  top: 9px;
  left: 60px;
  color: #6e6e6e;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 13px;
  pointer-events: none;
  z-index: 1;
}
.monaco-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #1e1e1e;
  color: #bbb;
  font-size: 13px;
  z-index: 2;
}
</style>
