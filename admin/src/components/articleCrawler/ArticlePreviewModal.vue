<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'
import dayjs from 'dayjs'
import type { PreviewData } from '@/composables/useArticleCrawler'

const props = defineProps<{
  open: boolean
  loading: boolean
  data: PreviewData | null
}>()

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
}>()

marked.setOptions({ gfm: true, breaks: true })

// 预览内容渲染为 HTML
const previewHtml = computed(() => {
  if (!props.data?.content) return ''
  try {
    return marked.parse(props.data.content) as string
  } catch {
    return `<pre>${props.data.content}</pre>`
  }
})

function formatDate(ts: number): string {
  if (!ts) return ''
  return dayjs(ts).format('YYYY-MM-DD HH:mm')
}
</script>

<template>
  <a-modal
    :open="open"
    @update:open="emit('update:open', $event)"
    :footer="null"
    width="860px"
    :title="data?.title || '文章预览'"
  >
    <div v-if="loading" style="text-align: center; padding: 48px 0">
      <a-spin tip="正在抓取正文...">
        <div style="width: 200px; height: 40px" />
      </a-spin>
    </div>
    <template v-else-if="data">
      <div class="preview-meta">
        <span v-if="data.author">作者：{{ data.author }}</span>
        <span v-if="data.publish_time">发布于 {{ formatDate(data.publish_time) }}</span>
        <a v-if="data.source_url" :href="data.source_url" target="_blank" rel="noopener">查看原文</a>
      </div>
      <a-alert
        v-if="data.truncated"
        message="内容较长，预览已截断，完整内容请导入后查看"
        type="warning"
        show-icon
        style="margin-bottom: 12px"
      />
      <div class="preview-body" v-html="previewHtml"></div>
    </template>
  </a-modal>
</template>

<style scoped>
.preview-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
  color: rgba(0, 0, 0, 0.65);
  font-size: 13px;
}
.preview-body {
  max-height: 60vh;
  overflow: auto;
  line-height: 1.75;
  font-size: 14px;
}
.preview-body :deep(img) {
  max-width: 100%;
}
.preview-body :deep(pre) {
  background: #f6f8fa;
  padding: 12px;
  border-radius: 6px;
  overflow: auto;
}
.preview-body :deep(code) {
  background: #f6f8fa;
  padding: 2px 4px;
  border-radius: 4px;
}
.preview-body :deep(pre code) {
  background: transparent;
  padding: 0;
}
.preview-body :deep(blockquote) {
  border-left: 4px solid #d9d9d9;
  margin-left: 0;
  padding-left: 12px;
  color: rgba(0, 0, 0, 0.65);
}
.preview-body :deep(table) {
  border-collapse: collapse;
}
.preview-body :deep(th),
.preview-body :deep(td) {
  border: 1px solid #d9d9d9;
  padding: 6px 10px;
}
</style>
