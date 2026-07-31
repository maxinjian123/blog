<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  FileOutlined,
  CloudOutlined,
  HddOutlined,
  SwapOutlined,
  CopyOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined
} from '@ant-design/icons-vue'
import type { MediaItem } from '@/composables/useMediaLibrary'
import {
  isImage,
  formatSize,
  fileIconColor,
  fileExt,
  mimeMainColor,
  mimeMainLabel,
  formatDateTime
} from '@/composables/mediaUtils'

const props = defineProps<{
  list: MediaItem[]
  loading: boolean
  minioEnabled: boolean
}>()

const emit = defineEmits<{
  preview: [item: MediaItem]
  copy: [item: MediaItem]
  rename: [item: MediaItem]
  delete: [item: MediaItem]
  migrate: [item: MediaItem, storage: 'local' | 'minio']
  batchMigrate: [ids: string[], storage: 'local' | 'minio']
}>()

// 多选状态
const selectedRowKeys = ref<string[]>([])

// 表格列定义
const columns = [
  { title: '文件', dataIndex: 'original_name', key: 'name', ellipsis: true, scopedSlots: { customRender: 'name' } },
  { title: '类型', key: 'mime', width: 100 },
  { title: '大小', dataIndex: 'size', key: 'size', width: 100 },
  { title: '存储源', key: 'storage', width: 100 },
  { title: '上传时间', dataIndex: 'created_at', key: 'created_at', width: 160 },
  { title: '操作', key: 'action', width: 180, align: 'center' as const, fixed: 'right' as const }
]

// 行选择配置
const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: string[]) => {
    selectedRowKeys.value = keys as string[]
  }
}))

// 清空选中
function clearSelection() {
  selectedRowKeys.value = []
}

// 批量迁移到 MinIO
function onBatchMigrateMinio() {
  if (selectedRowKeys.value.length === 0) return
  emit('batchMigrate', [...selectedRowKeys.value], 'minio')
}

// 批量迁移到本地
function onBatchMigrateLocal() {
  if (selectedRowKeys.value.length === 0) return
  emit('batchMigrate', [...selectedRowKeys.value], 'local')
}

// 暴露清空选中方法
defineExpose({ clearSelection })

function onMenuClick(key: string, item: MediaItem) {
  switch (key) {
    case 'preview':
      emit('preview', item)
      break
    case 'copy':
      emit('copy', item)
      break
    case 'rename':
      emit('rename', item)
      break
    case 'migrate-local':
      emit('migrate', item, 'local')
      break
    case 'migrate-minio':
      emit('migrate', item, 'minio')
      break
    case 'delete':
      emit('delete', item)
      break
  }
}
</script>

<template>
  <div class="media-table-wrapper">
    <!-- 批量操作栏 -->
    <div v-if="selectedRowKeys.length > 0" class="batch-bar">
      <div class="batch-info">
        <span class="batch-count">已选 {{ selectedRowKeys.length }} 项</span>
        <a-button type="link" size="small" @click="clearSelection">取消选择</a-button>
      </div>
      <div class="batch-actions">
        <a-button
          size="small"
          :disabled="!minioEnabled"
          @click="onBatchMigrateMinio"
        >
          <template #icon><CloudOutlined /></template>
          批量迁移到 MinIO
        </a-button>
        <a-button size="small" @click="onBatchMigrateLocal">
          <template #icon><HddOutlined /></template>
          批量迁移到本地
        </a-button>
      </div>
    </div>

    <a-table
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :row-key="(r: MediaItem) => r.id"
      :row-selection="rowSelection"
      :pagination="false"
      size="middle"
      :scroll="{ x: 900 }"
    >
      <template #bodyCell="{ column, record }">
        <!-- 文件名 + 缩略图 -->
        <template v-if="column.key === 'name'">
          <div class="file-name-cell">
            <div class="file-thumb">
              <img
                v-if="isImage(record.mime_type)"
                :src="record.url"
                :alt="record.original_name"
              />
              <FileOutlined
                v-else
                :style="{ color: fileIconColor(record.mime_type), fontSize: '20px' }"
              />
            </div>
            <div class="file-name-text">
              <div class="file-name" :title="record.original_name">{{ record.original_name }}</div>
              <div class="file-ext-text">{{ fileExt(record.original_name) }}</div>
            </div>
          </div>
        </template>

        <!-- 类型 -->
        <template v-if="column.key === 'mime'">
          <a-tag :color="mimeMainColor(record.mime_type)">
            {{ mimeMainLabel(record.mime_type) }}
          </a-tag>
          <div class="mime-detail">{{ record.mime_type }}</div>
        </template>

        <!-- 大小 -->
        <template v-if="column.key === 'size'">
          {{ formatSize(record.size) }}
        </template>

        <!-- 存储源 -->
        <template v-if="column.key === 'storage'">
          <a-tag :color="record.storage === 'minio' ? 'purple' : 'blue'">
            <CloudOutlined v-if="record.storage === 'minio'" />
            <HddOutlined v-else />
            {{ record.storage === 'minio' ? 'MinIO' : '本地' }}
          </a-tag>
        </template>

        <!-- 上传时间 -->
        <template v-if="column.key === 'created_at'">
          {{ formatDateTime(record.created_at) }}
        </template>

        <!-- 操作 -->
        <template v-if="column.key === 'action'">
          <a-space size="small">
            <a-tooltip title="预览">
              <a-button type="text" size="small" @click="emit('preview', record)">
                <EyeOutlined />
              </a-button>
            </a-tooltip>
            <a-tooltip title="复制链接">
              <a-button type="text" size="small" @click="emit('copy', record)">
                <CopyOutlined />
              </a-button>
            </a-tooltip>
            <a-tooltip title="重命名">
              <a-button type="text" size="small" @click="emit('rename', record)">
                <EditOutlined />
              </a-button>
            </a-tooltip>
            <a-dropdown :trigger="['click']" placement="bottomRight">
              <a-button type="text" size="small">
                <SwapOutlined />
              </a-button>
              <template #overlay>
                <a-menu @click="(info: any) => onMenuClick(info.key, record)">
                  <a-menu-item key="migrate-minio" :disabled="record.storage === 'minio' || !minioEnabled">
                    <template #icon><CloudOutlined /></template>
                    迁移到 MinIO
                  </a-menu-item>
                  <a-menu-item key="migrate-local" :disabled="record.storage === 'local'">
                    <template #icon><HddOutlined /></template>
                    迁移到本地
                  </a-menu-item>
                  <a-menu-divider />
                  <a-menu-item key="delete" danger>
                    <template #icon><DeleteOutlined /></template>
                    删除文件
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </a-space>
        </template>
      </template>

      <template #emptyText>
        <a-empty description="暂无文件" style="padding: 40px 0" />
      </template>
    </a-table>
  </div>
</template>

<style scoped>
.media-table-wrapper {
  background: #fff;
  border-radius: 4px;
}

.batch-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: #e6f4ff;
  border: 1px solid #91caff;
  border-radius: 4px;
  margin-bottom: 12px;
}

.batch-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.batch-count {
  font-weight: 500;
  color: #1677ff;
}

.batch-actions {
  display: flex;
  gap: 8px;
}

.file-name-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.file-thumb {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  overflow: hidden;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.file-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-name-text {
  min-width: 0;
  flex: 1;
}

.file-name {
  font-size: 13px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-ext-text {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.45);
}

.mime-detail {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.45);
  margin-top: 2px;
}
</style>
