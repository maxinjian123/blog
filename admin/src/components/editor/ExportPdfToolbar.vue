<script setup lang="ts">
import {ExportPDF} from '@vavt/v3-extension'
import '@vavt/v3-extension/lib/asset/ExportPDF.css'

withDefaults(defineProps<{
  modelValue?: string
  language?: string
  theme?: 'light' | 'dark'
  previewTheme?: string
  codeTheme?: string
  title?: string
  modalTitle?: string
  exportBtnText?: string
}>(), {
  modelValue: '',
  language: 'zh-CN',
  theme: 'light',
  previewTheme: 'vuepress',
  codeTheme: 'github',
  title: '导出为PDF',
  modalTitle: '导出为PDF',
  exportBtnText: '导出'
})
</script>

<template>
  <ExportPDF
      v-bind="$attrs"
      :model-value="modelValue"
      :language="language"
      :theme="theme"
      :preview-theme="previewTheme"
      :code-theme="codeTheme"
      :title="title"
      :modal-title="modalTitle"
      :export-btn-text="exportBtnText"
  />
</template>
