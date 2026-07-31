<script setup lang="ts">
import {onMounted, ref} from 'vue'
import {type LayoutMode, type MediaItem, useMediaLibrary} from '@/composables/useMediaLibrary'
import MediaToolbar from '@/components/media/MediaToolbar.vue'
import MediaCardList from '@/components/media/MediaCardList.vue'
import MediaTableList from '@/components/media/MediaTableList.vue'
import MediaUploadDrawer from '@/components/media/MediaUploadDrawer.vue'
import MediaPreviewModal from '@/components/media/MediaPreviewModal.vue'
import MediaRenameModal from '@/components/media/MediaRenameModal.vue'

// 媒体库逻辑（composable 管理所有状态和操作）
const {
  list,
  loading,
  total,
  stats,
  query,
  types,
  typesLoading,
  minioEnabled,
  storageTabs,
  fetchList,
  fetchTypes,
  fetchUploadConfig,
  handleStorageChange,
  handleSearch,
  handleMimeChange,
  handlePageChange,
  handleDelete,
  handleRenameSubmit,
  handleMigrate,
  handleBatchMigrate,
  handleCopyUrl
} = useMediaLibrary()

// ============ 布局模式（localStorage 持久化） ============
const LAYOUT_KEY = 'media-library-layout'
const layout = ref<LayoutMode>(
    (localStorage.getItem(LAYOUT_KEY) as LayoutMode) || 'card'
)

function handleLayoutChange(v: LayoutMode) {
  layout.value = v
  localStorage.setItem(LAYOUT_KEY, v)
}

// ============ 上传抽屉 ============
const uploadDrawerOpen = ref(false)
const defaultUploadStorage = ref<'local' | 'minio'>('local')

function handleUploadClick() {
  defaultUploadStorage.value =
      minioEnabled.value && query.storage === 'minio'
          ? 'minio'
          : 'local'
  uploadDrawerOpen.value = true
}

// 上传成功后刷新列表和类型
function handleUploaded() {
  fetchList()
  fetchTypes()
}

// ============ 预览弹窗 ============
const previewVisible = ref(false)
const previewItem = ref<MediaItem | null>(null)

function handlePreview(item: MediaItem) {
  previewItem.value = item
  previewVisible.value = true
}

// ============ 重命名弹窗 ============
const renameVisible = ref(false)
const renameLoading = ref(false)
const renameItem = ref<{ id: string; original_name: string } | null>(null)

function handleRename(item: MediaItem) {
  renameItem.value = {id: item.id, original_name: item.original_name}
  renameVisible.value = true
}

async function handleRenameModalSubmit(id: string, newName: string) {
  renameLoading.value = true
  const ok = await handleRenameSubmit(id, newName)
  renameLoading.value = false
  if (ok) {
    renameVisible.value = false
  }
}

// ============ 表格列表 ref（批量操作后清空选中） ============
const tableListRef = ref<InstanceType<typeof MediaTableList> | null>(null)

// 单文件迁移：直接调用 composable
function handleMigrateItem(item: MediaItem, storage: 'local' | 'minio') {
  handleMigrate(item, storage)
}

// 批量迁移：调用 composable，迁移后清空选中
function handleBatchMigrateItems(ids: string[], storage: 'local' | 'minio') {
  handleBatchMigrate(ids, storage)
}

// ============ 初始化 ============
onMounted(() => {
  fetchUploadConfig()
  fetchTypes()
  fetchList()
})
</script>

<template>
  <div class="media-library">
    <!-- 顶部工具栏 -->
    <MediaToolbar
        :storage-tabs="storageTabs"
        :current-storage="query.storage"
        v-model:keyword="query.keyword"
        v-model:current-mime="query.mime"
        v-model:layout="layout"
        :types="types"
        :types-loading="typesLoading"
        :loading="loading"
        :minio-enabled="minioEnabled"
        @refresh="fetchList"
        @upload="handleUploadClick"
        @storage-change="handleStorageChange"
        @search="handleSearch"
        @mime-change="handleMimeChange"
        @update:layout="handleLayoutChange"
    />

    <!-- 列表区域：根据布局模式切换 -->
    <div class="media-content">
      <MediaCardList
          v-if="layout === 'card'"
          :list="list"
          :loading="loading"
          :minio-enabled="minioEnabled"
          @preview="handlePreview"
          @copy="handleCopyUrl"
          @rename="handleRename"
          @delete="handleDelete"
          @migrate="handleMigrateItem"
      />
      <MediaTableList
          v-else
          ref="tableListRef"
          :list="list"
          :loading="loading"
          :minio-enabled="minioEnabled"
          @preview="handlePreview"
          @copy="handleCopyUrl"
          @rename="handleRename"
          @delete="handleDelete"
          @migrate="handleMigrateItem"
          @batch-migrate="handleBatchMigrateItems"
      />
    </div>

    <!-- 分页 -->
    <div v-if="total > 0" class="pagination-wrapper">
      <a-pagination
          v-model:current="query.page"
          v-model:page-size="query.pageSize"
          :total="total"
          :page-size-options="['10', '20']"
          :show-size-changer="true"
          :show-quick-jumper="true"
          :show-total="(t: number) => `共 ${t} 个文件`"
          @change="handlePageChange"
      />
    </div>

    <!-- 上传抽屉 -->
    <MediaUploadDrawer
        v-model:open="uploadDrawerOpen"
        :minio-enabled="minioEnabled"
        :default-storage="defaultUploadStorage"
        @uploaded="handleUploaded"
    />

    <!-- 预览弹窗 -->
    <MediaPreviewModal
        v-model:open="previewVisible"
        :item="previewItem"
    />

    <!-- 重命名弹窗 -->
    <MediaRenameModal
        v-model:open="renameVisible"
        :loading="renameLoading"
        :item="renameItem"
        @submit="handleRenameModalSubmit"
    />
  </div>
</template>

<style scoped>
.media-library {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.media-content {
  min-height: 300px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
}
</style>
