<script lang="ts">
// 完整默认工具栏（与文章编辑保持一致）
// 定义在模块作用域，供 withDefaults 默认值引用
const DEFAULT_TOOLBARS: any[] = [
  'bold',
  'underline',
  'italic',
  'strikeThrough',
  '-',
  'title',
  'sub',
  'sup',
  'quote',
  'unorderedList',
  'orderedList',
  'task',
  '-',
  'codeRow',
  'code',
  'link',
  'image',
  'table',
  'mermaid',
  'katex',
  '-',
  'revoke',
  'next',
  '-',
  0,
  1,
  2,
  3,
  '-',
  '=',
  'prettier',
  'fullscreen',
  'pageFullscreen',
  'preview',
  'previewOnly',
  'htmlPreview',
  'catalog'
]
</script>

<script setup lang="ts">
import {computed, useSlots} from 'vue'
import {MdEditor as BaseMdEditor} from 'md-editor-v3'
import type {Footers} from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import 'md-editor-v3/lib/preview.css'
import api from '@/utils/api'
import {message} from 'ant-design-vue'
import {useDarkMode} from '@/composables/useDarkMode'
import EmojiToolbar from './EmojiToolbar.vue'
import MarkToolbar from './MarkToolbar.vue'
import OriginalImgToolbar from './OriginalImgToolbar.vue'
import ExportPdfToolbar from './ExportPdfToolbar.vue'

interface UploadResult {
  url: string
  alt: string
  title: string
}

const model = defineModel<string>({default: ''})

const props = withDefaults(defineProps<{
  language?: string
  theme?: 'light' | 'dark'
  preview?: boolean
  previewTheme?: string
  codeTheme?: string
  showCodeRowNumber?: boolean
  footers?: Footers[]
  toolbars?: any[]
  placeholder?: string
  upload?: boolean
  onUploadImg?: (files: File[], callback: (urls: UploadResult[]) => void) => void
  showEmoji?: boolean
  showMark?: boolean
  showOriginalImg?: boolean
  showExportPdf?: boolean
  exportPdfTitle?: string
}>(), {
  language: 'zh-CN',
  preview: true,
  previewTheme: 'vuepress',
  codeTheme: 'github',
  showCodeRowNumber: true,
  footers: () => ['markdownTotal'],
  toolbars: () => DEFAULT_TOOLBARS,
  upload: true,
  showEmoji: true,
  showMark: false,
  showOriginalImg: false,
  showExportPdf: false,
  exportPdfTitle: '导出为PDF'
})

const emit = defineEmits<{
  (e: 'onGetCatalog', list: Array<{text: string; level: number}>): void
  (e: 'onChange', value: string): void
  (e: 'onSave', value: string): void
}>()

const slots = useSlots()
const {isDark} = useDarkMode()

const resolvedTheme = computed(() => props.theme || (isDark.value ? 'dark' : 'light'))

// 图片上传：优先使用调用方传入的处理器，否则走默认 /upload 接口
const uploadHandler = computed(() => {
  if (props.onUploadImg) return props.onUploadImg
  if (!props.upload) return undefined
  return async (
      files: File[],
      callback: (urls: UploadResult[]) => void
  ) => {
    const results = await Promise.all(
        files.map(async (file) => {
          const formData = new FormData()
          formData.append('file', file)
          try {
            const res: any = await api.post('/upload', formData, {
              headers: {'Content-Type': 'multipart/form-data'}
            })
            const url = res.data?.url || res.url
            return {url: typeof url === 'string' ? url : '', alt: file.name, title: file.name}
          } catch {
            message.error('图片上传失败')
            return {url: '', alt: file.name, title: `上传失败: ${file.name}`}
          }
        })
    )
    callback(results.filter((r) => r.url))
  }
})

function handleUpdate(value: string) {
  model.value = value
  emit('onChange', value)
}

function handleCatalog(list: Array<{text: string; level: number}>) {
  emit('onGetCatalog', list)
}
</script>

<template>
  <BaseMdEditor
      v-model="model"
      :language="language"
      :theme="resolvedTheme"
      :preview="preview"
      :preview-theme="previewTheme"
      :code-theme="codeTheme"
      :show-code-row-number="showCodeRowNumber"
      :footers="footers"
      :toolbars="toolbars"
      :placeholder="placeholder"
      :on-upload-img="uploadHandler"
      :on-save="(value: string) => emit('onSave', value)"
      @update:model-value="handleUpdate"
      @onGetCatalog="handleCatalog"
  >
    <template v-if="slots.defToolbars" #defToolbars>
      <slot name="defToolbars"/>
    </template>
    <template v-else #defToolbars>
      <EmojiToolbar v-if="showEmoji" title="表情"/>
      <MarkToolbar v-if="showMark" title="标记"/>
      <OriginalImgToolbar v-if="showOriginalImg" title="查看原图"/>
      <ExportPdfToolbar
          v-if="showExportPdf"
          :model-value="model"
          :language="language"
          :theme="resolvedTheme"
          :preview-theme="previewTheme"
          :code-theme="codeTheme"
          :title="exportPdfTitle"
          :modal-title="exportPdfTitle"
          export-btn-text="导出"
      />
    </template>
    <template v-if="slots.toolbar" #toolbar>
      <slot name="toolbar"/>
    </template>
    <template v-if="slots.textarea" #textarea>
      <slot name="textarea"/>
    </template>
    <template v-if="slots.input" #input>
      <slot name="input"/>
    </template>
    <template v-if="slots.preview" #preview>
      <slot name="preview"/>
    </template>
    <template v-if="slots.htmlPreview" #htmlPreview>
      <slot name="htmlPreview"/>
    </template>
    <template v-if="slots.catalog" #catalog>
      <slot name="catalog"/>
    </template>
  </BaseMdEditor>
</template>
