<script setup lang="ts">
import {
  FileOutlined,
  EyeOutlined,
  CopyOutlined,
  EditOutlined,
  DeleteOutlined,
  CloudOutlined,
  HddOutlined,
  SwapOutlined,
  MoreOutlined
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

defineProps<{
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
}>()

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
  <a-spin :spinning="loading">
    <div v-if="list.length > 0" class="media-grid">
      <div v-for="item in list" :key="item.id" class="media-card">
        <!-- 预览区 -->
        <div class="media-preview" @click="emit('preview', item)">
          <img v-if="isImage(item.mime_type)" :src="item.url" :alt="item.original_name" />
          <div v-else class="file-placeholder">
            <FileOutlined :style="{ color: fileIconColor(item.mime_type), fontSize: '48px' }" />
            <div class="file-ext">{{ fileExt(item.original_name) }}</div>
          </div>
          <div class="media-overlay">
            <EyeOutlined />
          </div>
        </div>

        <!-- 信息区 -->
        <div class="media-info">
          <div class="media-name" :title="item.original_name">{{ item.original_name }}</div>
          <div class="media-meta">
            <a-tag :color="item.storage === 'minio' ? 'purple' : 'blue'" style="margin: 0">
              <CloudOutlined v-if="item.storage === 'minio'" />
              <HddOutlined v-else />
              {{ item.storage === 'minio' ? 'MinIO' : '本地' }}
            </a-tag>
            <a-tag :color="mimeMainColor(item.mime_type)" style="margin: 0">
              {{ mimeMainLabel(item.mime_type) }}
            </a-tag>
            <span class="media-size">{{ formatSize(item.size) }}</span>
          </div>
          <div class="media-date">{{ formatDateTime(item.created_at) }}</div>
        </div>

        <!-- 操作区 -->
        <div class="media-actions">
          <a-tooltip title="复制链接">
            <a-button type="text" size="small" @click="emit('copy', item)">
              <CopyOutlined />
            </a-button>
          </a-tooltip>
          <a-tooltip title="重命名">
            <a-button type="text" size="small" @click="emit('rename', item)">
              <EditOutlined />
            </a-button>
          </a-tooltip>
          <!-- 更多操作：迁移 + 删除 -->
          <a-dropdown :trigger="['click']" placement="bottomRight">
            <a-button type="text" size="small">
              <MoreOutlined />
            </a-button>
            <template #overlay>
              <a-menu @click="(info: any) => onMenuClick(info.key, item)">
                <a-menu-item key="migrate-minio" :disabled="item.storage === 'minio' || !minioEnabled">
                  <template #icon><CloudOutlined /></template>
                  迁移到 MinIO
                </a-menu-item>
                <a-menu-item key="migrate-local" :disabled="item.storage === 'local'">
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
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <a-empty
      v-else-if="!loading"
      description="暂无文件，点击右上角上传"
      style="padding: 60px 0"
    />
  </a-spin>
</template>

<style scoped>
.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.media-card {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  transition: all 0.2s;
}

.media-card:hover {
  border-color: #1677ff;
  box-shadow: 0 4px 12px rgba(22, 119, 255, 0.12);
}

.media-preview {
  position: relative;
  width: 100%;
  height: 160px;
  background: #f5f5f5;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.media-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.file-ext {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  font-weight: 600;
}

.media-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 28px;
  opacity: 0;
  transition: opacity 0.2s;
}

.media-preview:hover .media-overlay {
  opacity: 1;
}

.media-info {
  padding: 10px 12px;
}

.media-name {
  font-size: 13px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 6px;
}

.media-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.media-size {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}

.media-date {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.35);
}

.media-actions {
  display: flex;
  justify-content: space-around;
  border-top: 1px solid #f0f0f0;
  padding: 4px 0;
}
</style>
