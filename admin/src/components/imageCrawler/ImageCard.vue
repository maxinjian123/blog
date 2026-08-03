<script setup lang="ts">
import { DownloadOutlined, EyeOutlined, LinkOutlined } from '@ant-design/icons-vue'
import type { ImageItem } from '@/composables/useImageCrawler'

defineProps<{
  item: ImageItem
  selected: boolean
}>()

const emit = defineEmits<{
  (e: 'preview', item: ImageItem): void
  (e: 'download', item: ImageItem): void
  (e: 'toggle-select', item: ImageItem): void
}>()
</script>

<template>
  <div
    class="image-card"
    :class="{ selected }"
    @click="emit('toggle-select', item)"
  >
    <div class="card-cover">
      <img
        :src="item.thumb"
        :alt="item.title"
        loading="lazy"
        @error="(e: any) => (e.target.style.opacity = 0.3)"
      />
      <a-checkbox
        :checked="selected"
        class="card-checkbox"
        @click.stop
        @change="emit('toggle-select', item)"
      />
      <div class="card-overlay">
        <a-button
          type="primary"
          shape="circle"
          size="small"
          title="预览"
          @click.stop="emit('preview', item)"
        >
          <eye-outlined />
        </a-button>
        <a-button
          type="primary"
          shape="circle"
          size="small"
          ghost
          title="下载原图"
          @click.stop="emit('download', item)"
        >
          <download-outlined />
        </a-button>
        <a
          v-if="item.source_url"
          :href="item.source_url"
          target="_blank"
          rel="noopener"
          title="查看来源页"
          class="source-link"
          @click.stop
        >
          <link-outlined />
        </a>
      </div>
    </div>
    <div class="card-meta">
      <a-typography-text
        :content="item.title"
        :ellipsis="{ tooltip: item.title }"
        class="card-title"
      />
      <div class="card-source">
        <a-tag v-if="item.author" color="blue" :bordered="false">{{ item.author }}</a-tag>
        <span v-if="item.width && item.height" class="dim">{{ item.width }}×{{ item.height }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.image-card {
  position: relative;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--color-bg-container);
  transition: all 0.2s;
  cursor: pointer;
  break-inside: avoid;
}

.image-card:hover {
  border-color: #1677ff;
  box-shadow: 0 4px 12px rgba(22, 119, 255, 0.15);
  transform: translateY(-2px);
}

.image-card.selected {
  border-color: #1677ff;
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.4);
}

.card-cover {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: var(--color-bg-subtle);
}

.card-cover img {
  width: 100%;
  display: block;
  object-fit: cover;
  min-height: 120px;
  /* 限制最大高度：避免长图（如竖版壁纸）在瀑布流中撑得过大 */
  max-height: 300px;
}

.card-checkbox {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 2;
  background: var(--color-bg-container);
  border-radius: 4px;
  padding: 2px 6px;
}

.card-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.2s;
}

.image-card:hover .card-overlay {
  opacity: 1;
}

.source-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-bg-container);
  color: #1677ff;
  font-size: 14px;
}

.card-meta {
  padding: 8px 10px;
}

.card-title {
  display: block;
  font-size: 13px;
  margin-bottom: 4px;
}

.card-source {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.card-source :deep(.ant-tag) {
  margin-right: 0;
  font-size: 11px;
  line-height: 16px;
  padding: 0 4px;
}

.dim {
  color: var(--color-text-tertiary);
}
</style>
