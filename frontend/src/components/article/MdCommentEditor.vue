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
const toolbars: ToolbarNames[] = [
  'bold',
  'italic',
  'strikeThrough',
  '-',
  'quote',
  'code',
  'link',
  'image',
  '-',
  0,
  '-',
  '=',
  'preview',
  'previewOnly'
]

// 图片上传处理函数
async function handleUploadImg(
  files: Array<File>,
  callback: (urls: Array<{ url: string; alt: string; title: string }>) => void
) {
  const results = await Promise.all(
    files.map(async (file) => {
      const formData = new FormData()
      formData.append('file', file)

      try {
        const token = localStorage.getItem('token') || ''
        const res = await fetch('/api/v1/comment-upload', {
          method: 'POST',
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
          },
          body: formData,
        })

        if (!res.ok) {
          throw new Error(`上传失败: ${res.status}`)
        }

        const data = await res.json()
        const fileData = data.data || data
        const url = fileData.url || fileData.path || fileData

        return {
          url: typeof url === 'string' ? url : '',
          alt: file.name,
          title: file.name
        }
      } catch (err) {
        console.error('[Comment] 图片上传失败:', err)
        return {
          url: '',
          alt: file.name,
          title: `上传失败: ${file.name}`
        }
      }
    })
  )

  const validResults = results.filter(r => r.url)
  if (validResults.length > 0) {
    callback(validResults)
  }
}
</script>

<template>
  <div class="md-comment-editor" style="--md-color: var(--color-primary)">
    <MdEditor
        v-model="text"
        language="zh-CN"
        :preview="false"
        :theme="theme"
        :toolbars="toolbars"
        :show-code-row-number="false"
        :placeholder="placeholder || '支持 Markdown 语法，尝试 **加粗**、*斜体*、`代码` 等'"
        :footers="[]"
        :on-upload-img="handleUploadImg"
        style="height: 250px"
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
  height: 300px;
}

.md-comment-editor .md-editor-preview-wrapper {
  max-height: 200px;
  overflow-y: auto;
}
</style>