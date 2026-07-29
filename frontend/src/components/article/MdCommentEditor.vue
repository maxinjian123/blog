<script setup lang="ts">
import {ref, watch} from 'vue'
import {MdEditor, type ToolbarNames} from 'md-editor-v3'
import {Emoji} from '@vavt/v3-extension'
import '@vavt/v3-extension/lib/asset/Emoji.css';
import 'md-editor-v3/lib/style.css'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  theme: 'dark' | 'light'
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const text = ref(props.modelValue)

watch(() => props.modelValue, (val) => {
  if (text.value !== val) text.value = val
})

watch(text, (val) => {
  emit('update:modelValue', val)
})

// 工具栏配置：0 对应 defToolbars 插槽中的 Emoji 组件
// 注：已移除图片上传按钮，客户端评论不再支持直接上传图片
const toolbars: ToolbarNames[] = [
  'bold',
  'italic',
  'strikeThrough',
  '-',
  'quote',
  'code',
  'link',
  '-',
  0,
  '-',
  '=',
  'preview',
  'previewOnly'
]
</script>

<template>
  <div class="md-comment-editor" style="--md-color: var(--color-primary)">
    <MdEditor
        v-model="text"
        language="zh-CN"
        :theme="theme"
        :toolbars="toolbars"
        :show-code-row-number="false"
        :placeholder="placeholder || '支持 Markdown 语法，尝试 **加粗**、*斜体*、`代码` 等'"
        :footers="[]"
        style="height: 320px"
    >
      <template #defToolbars>
        <Emoji title="表情" />
      </template>
    </MdEditor>
  </div>
</template>

<style>
/* 评论场景编辑器样式调整 */
.md-comment-editor .md-editor {
  border-radius: 6px;
  overflow: hidden;
}

.md-comment-editor .md-editor-toolbar {
  padding: 4px 8px;
  border-radius: 6px 6px 0 0;
}

.md-comment-editor .md-editor-content {
  height: 280px;
}

.md-comment-editor .md-editor-preview-wrapper {
  max-height: 280px;
  overflow-y: auto;
}
</style>