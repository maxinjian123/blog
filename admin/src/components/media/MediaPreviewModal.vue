<script setup lang="ts">
import { FileOutlined } from '@ant-design/icons-vue'
import type { MediaItem } from '@/composables/useMediaLibrary'
import {
  isImage,
  isVideo,
  isPdf,
  isAudio,
  fileIconColor,
  formatSize,
  formatDateTime
} from '@/composables/mediaUtils'

const props = defineProps<{
  open: boolean
  item: MediaItem | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()
</script>

<template>
  <a-modal
    :open="open"
    :title="item?.original_name"
    :footer="null"
    width="800px"
    @update:open="(v: boolean) => emit('update:open', v)"
  >
    <div v-if="item" class="preview-content">
      <!-- 图片预览 -->
      <div v-if="isImage(item.mime_type)" class="preview-image-wrapper">
        <img :src="item.url" :alt="item.original_name" />
      </div>
      <!-- 视频预览 -->
      <div v-else-if="isVideo(item.mime_type)" class="preview-video-wrapper">
        <video :src="item.url" controls style="max-width: 100%; max-height: 500px" />
      </div>
      <!-- 音频预览 -->
      <div v-else-if="isAudio(item.mime_type)" class="preview-audio-wrapper">
        <audio :src="item.url" controls style="width: 100%" />
      </div>
      <!-- PDF 预览 -->
      <div v-else-if="isPdf(item.mime_type)" class="preview-pdf-wrapper">
        <iframe :src="item.url" style="width: 100%; height: 500px; border: none" />
      </div>
      <!-- 其他文件 -->
      <div v-else class="preview-file-wrapper">
        <FileOutlined :style="{ color: fileIconColor(item.mime_type), fontSize: '80px' }" />
        <p>该文件类型不支持预览</p>
        <a :href="item.url" target="_blank">下载文件</a>
      </div>

      <a-descriptions :column="2" bordered size="small" style="margin-top: 16px">
        <a-descriptions-item label="文件名" :span="2">{{ item.original_name }}</a-descriptions-item>
        <a-descriptions-item label="存储名">{{ item.filename }}</a-descriptions-item>
        <a-descriptions-item label="类型">{{ item.mime_type }}</a-descriptions-item>
        <a-descriptions-item label="大小">{{ formatSize(item.size) }}</a-descriptions-item>
        <a-descriptions-item label="存储源">
          <a-tag :color="item.storage === 'minio' ? 'purple' : 'blue'">
            {{ item.storage === 'minio' ? 'MinIO' : '本地' }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="上传时间" :span="2">
          {{ formatDateTime(item.created_at, true) }}
        </a-descriptions-item>
        <a-descriptions-item label="访问 URL" :span="2">
          <a-typography-link
            :href="item.url"
            target="_blank"
            :copyable="{ text: item.url }"
            style="word-break: break-all"
          >
            {{ item.url }}
          </a-typography-link>
        </a-descriptions-item>
      </a-descriptions>
    </div>
  </a-modal>
</template>

<style scoped>
.preview-content {
  text-align: center;
}

.preview-image-wrapper {
  max-height: 500px;
  overflow: auto;
  display: flex;
  justify-content: center;
}

.preview-image-wrapper img {
  max-width: 100%;
  max-height: 500px;
  object-fit: contain;
}

.preview-video-wrapper,
.preview-audio-wrapper,
.preview-pdf-wrapper {
  padding: 12px 0;
}

.preview-file-wrapper {
  padding: 40px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--color-text-tertiary);
}
</style>
