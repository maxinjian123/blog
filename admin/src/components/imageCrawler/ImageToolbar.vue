<script setup lang="ts">
import { computed } from 'vue'
import {
  SearchOutlined,
  PictureOutlined,
  SmileOutlined,
  CloudDownloadOutlined,
  CameraOutlined
} from '@ant-design/icons-vue'
import type { ImagePlatformId, ImagePlatform } from '@/composables/useImageCrawler'

const props = defineProps<{
  currentPlatform: ImagePlatformId
  keyword: string
  loading: boolean
  downloading: boolean
  minioEnabled: boolean
  targetStorage: 'local' | 'minio'
  selectedCount: number
  platforms: ImagePlatform[]
}>()

const emit = defineEmits<{
  (e: 'update:currentPlatform', v: ImagePlatformId): void
  (e: 'update:keyword', v: string): void
  (e: 'update:targetStorage', v: 'local' | 'minio'): void
  (e: 'platform-change'): void
  (e: 'search'): void
  (e: 'storage-change', v: 'local' | 'minio'): void
  (e: 'batch-download'): void
}>()

const currentPlatformId = computed({
  get: () => props.currentPlatform,
  set: (v: ImagePlatformId) => emit('update:currentPlatform', v)
})

const keywordModel = computed({
  get: () => props.keyword,
  set: (v: string) => emit('update:keyword', v)
})

const storageModel = computed({
  get: () => props.targetStorage,
  set: (v: 'local' | 'minio') => emit('update:targetStorage', v)
})

// a-radio-group 的 change 事件参数是 RadioChangeEvent，需从 e.target.value 取值
function onPlatformChange(e: any) {
  const val = e?.target?.value as ImagePlatformId
  if (val) {
    currentPlatformId.value = val
    emit('platform-change')
  }
}

function onStorageChange(val: 'local' | 'minio') {
  emit('storage-change', val)
}

// 各平台搜索框占位文本
const placeholderMap: Record<ImagePlatformId, string> = {
  bing: '搜索图片，如：风景、动漫、壁纸',
  baidu: '搜索图片，如：风景、动漫、壁纸',
  dogetu: '搜索表情包，如：狗、害羞、加油',
  pexels: 'Search photos, e.g. nature, ocean, city',
  pixabay: '搜索图片，如：花朵、星空、猫',
  unsplash: 'Search photos, e.g. minimal, coffee, mountain'
}

// 各平台图标组件
function platformIcon(id: ImagePlatformId) {
  if (id === 'dogetu') return SmileOutlined
  return PictureOutlined
}

// 当前平台是否需要 API Key
const currentNeedsApiKey = computed(() => {
  const p = props.platforms.find(it => it.id === props.currentPlatform)
  return !!p?.needsApiKey
})
</script>

<template>
  <a-card class="image-toolbar">
    <div class="toolbar-row">
      <!-- 平台切换（动态渲染，支持新增平台） -->
      <a-radio-group
        :value="currentPlatformId"
        @change="onPlatformChange"
        class="platform-radio"
      >
        <a-radio-button v-for="p in platforms" :key="p.id" :value="p.id">
          <component :is="p.id === 'pexels' || p.id === 'pixabay' || p.id === 'unsplash' ? CameraOutlined : platformIcon(p.id)" />
          {{ p.label }}
        </a-radio-button>
      </a-radio-group>
    </div>

    <a-alert
      v-if="currentNeedsApiKey"
      :message="`「${platforms.find(p => p.id === currentPlatform)?.label}」需要在「系统设置 → 图片抓取」中配置 API Key 才能使用`"
      type="info"
      show-icon
      style="margin-top: 12px"
    />

    <a-alert
      message="版权提示：图片来源网络，版权归原作者所有。请确认授权后再使用，商业用途请先联系原作者获取授权。"
      type="warning"
      show-icon
      style="margin-top: 12px"
    />

    <div class="toolbar-row" style="margin-top: 12px">
      <a-input-search
        v-model:value="keywordModel"
        :placeholder="placeholderMap[currentPlatform]"
        style="max-width: 480px"
        allow-clear
        enter-button
        @search="$emit('search')"
      >
        <template #enterButton>
          <a-button type="primary" :loading="loading">
            <search-outlined />
            搜索
          </a-button>
        </template>
      </a-input-search>

      <div class="right-controls">
        <span class="storage-label">下载到：</span>
        <a-select
          v-model:value="storageModel"
          style="width: 140px"
          @change="onStorageChange"
        >
          <a-select-option value="local">本地</a-select-option>
          <a-select-option value="minio" :disabled="!minioEnabled">MinIO</a-select-option>
        </a-select>

        <a-button
          type="primary"
          :loading="downloading"
          :disabled="selectedCount === 0"
          @click="$emit('batch-download')"
        >
          <cloud-download-outlined />
          批量下载 {{ selectedCount > 0 ? `(${selectedCount})` : '' }}
        </a-button>
      </div>
    </div>
  </a-card>
</template>

<style scoped>
.image-toolbar {
  margin-bottom: 16px;
}

.toolbar-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.platform-radio :deep(.ant-radio-button-wrapper) {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.right-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.storage-label {
  white-space: nowrap;
  color: rgba(0, 0, 0, 0.65);
}
</style>
