<script setup lang="ts">
import {computed} from 'vue'
import {MdPreview as BaseMdPreview} from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import 'md-editor-v3/lib/preview.css'
import {useDarkMode} from '@/composables/useDarkMode'

const model = defineModel<string>({default: ''})

const props = withDefaults(defineProps<{
  language?: string
  theme?: 'light' | 'dark'
  previewTheme?: string
  showCodeRowNumber?: boolean
}>(), {
  language: 'zh-CN',
  previewTheme: 'cyanosis',
  showCodeRowNumber: false
})

const {isDark} = useDarkMode()
const resolvedTheme = computed(() => props.theme || (isDark.value ? 'dark' : 'light'))
</script>

<template>
  <BaseMdPreview
      v-bind="$attrs"
      :model-value="model"
      :language="language"
      :theme="resolvedTheme"
      :preview-theme="previewTheme"
      :show-code-row-number="showCodeRowNumber"
  />
</template>
