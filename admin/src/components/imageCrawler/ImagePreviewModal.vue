<script setup lang="ts">
import { DownloadOutlined, LinkOutlined } from '@ant-design/icons-vue'
import type { ImageItem } from '@/composables/useImageCrawler'

defineProps<{
  open: boolean
  item: ImageItem | null
  downloading: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'download', item: ImageItem): void
}>()

function close() {
  emit('update:open', false)
}
</script>

<template>
  <a-modal
    :open="open"
    :title="item?.title || '图片预览'"
    :footer="null"
    width="80%"
    wrap-class-name="image-preview-modal"
    @update:open="emit('update:open', $event)"
    @cancel="close"
  >
    <div v-if="item" class="preview-container">
      <div class="preview-image-wrap">
        <img
          :src="item.original"
          :alt="item.title"
          class="preview-image"
          @error="(e: any) => { if (item) e.target.src = item.thumb }"
        />
      </div>
      <div class="preview-meta">
        <a-descriptions :column="1" size="small" bordered>
          <a-descriptions-item label="标题">{{ item.title }}</a-descriptions-item>
          <a-descriptions-item v-if="item.author" label="作者">{{ item.author }}</a-descriptions-item>
          <a-descriptions-item v-if="item.width && item.height" label="尺寸">
            {{ item.width }} × {{ item.height }}
          </a-descriptions-item>
          <a-descriptions-item v-if="item.format" label="格式">{{ item.format }}</a-descriptions-item>
          <a-descriptions-item v-if="item.source_url" label="来源">
            <a :href="item.source_url" target="_blank" rel="noopener">
              <link-outlined />
              查看来源页
            </a>
          </a-descriptions-item>
        </a-descriptions>

        <a-alert
          message="版权提示"
          description="本图片来源于网络，版权归原作者所有。请确认授权后再使用，商业用途请先联系原作者获取授权。"
          type="warning"
          show-icon
          style="margin-top: 12px"
        />

        <div class="preview-actions">
          <a-button
            type="primary"
            size="large"
            :loading="downloading"
            @click="emit('download', item)"
          >
            <download-outlined />
            下载原图到媒体库
          </a-button>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<style scoped>
.preview-container {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.preview-image-wrap {
  flex: 1;
  min-width: 0;
  max-height: 70vh;
  overflow: auto;
  background: var(--color-bg-subtle);
  border-radius: 6px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.preview-image {
  max-width: 100%;
  max-height: 70vh;
  display: block;
  object-fit: contain;
}

.preview-meta {
  width: 320px;
  flex-shrink: 0;
}

.preview-actions {
  margin-top: 16px;
  display: flex;
  gap: 8px;
}

@media (max-width: 900px) {
  .preview-container {
    flex-direction: column;
  }
  .preview-meta {
    width: 100%;
  }
}
</style>
