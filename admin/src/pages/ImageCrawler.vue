<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useImageCrawler } from '@/composables/useImageCrawler'
import ImageToolbar from '@/components/imageCrawler/ImageToolbar.vue'
import ImageGrid from '@/components/imageCrawler/ImageGrid.vue'
import ImagePreviewModal from '@/components/imageCrawler/ImagePreviewModal.vue'
import type { ImageItem } from '@/composables/useImageCrawler'

const {
  loading,
  loadingMore,
  downloading,
  list,
  query,
  hasMore,
  minioEnabled,
  targetStorage,
  fetchUploadConfig,
  loadMore,
  handlePlatformChange,
  handleStorageChange,
  handleDownload,
  handleBatchDownload,
  handleSearch
} = useImageCrawler()

// ============ 预览弹窗 ============
const previewVisible = ref(false)
const previewItem = ref<ImageItem | null>(null)

function handlePreview(item: ImageItem) {
  previewItem.value = item
  previewVisible.value = true
}

// ============ 选中切换 ============
function handleToggleSelect(item: ImageItem) {
  item._selected = !item._selected
}

const selectedCount = ref(0)
function updateSelectedCount() {
  selectedCount.value = list.value.filter(i => i._selected).length
}

// 包装切换方法以同步选中数
function toggleSelect(item: ImageItem) {
  handleToggleSelect(item)
  updateSelectedCount()
}

function onDownload(item: ImageItem) {
  handleDownload(item)
}

async function onBatchDownload() {
  await handleBatchDownload()
  updateSelectedCount()
}

onMounted(() => {
  fetchUploadConfig()
})
</script>

<template>
  <div class="image-crawler-page">


    <ImageToolbar
      v-model:current-platform="query.platform"
      v-model:keyword="query.keyword"
      v-model:target-storage="targetStorage"
      :loading="loading"
      :downloading="downloading"
      :minio-enabled="minioEnabled"
      :selected-count="selectedCount"
      @platform-change="handlePlatformChange"
      @search="handleSearch"
      @storage-change="handleStorageChange"
      @batch-download="onBatchDownload"
    />

    <ImageGrid
      :list="list"
      :loading="loading"
      :loading-more="loadingMore"
      :has-more="hasMore"
      @preview="handlePreview"
      @download="onDownload"
      @toggle-select="toggleSelect"
      @load-more="loadMore"
    />

    <ImagePreviewModal
      v-model:open="previewVisible"
      :item="previewItem"
      :downloading="downloading"
      @download="onDownload"
    />
  </div>
</template>

<style scoped>
.image-crawler-page {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 120px);
}

.page-header {
  margin-bottom: 16px;
}

.page-desc {
  color: rgba(0, 0, 0, 0.45);
  font-size: 13px;
  margin-top: 4px;
}
</style>
