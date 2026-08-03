<script setup lang="ts">
import {computed} from 'vue'
import {
  AppstoreOutlined,
  CloudOutlined,
  FileOutlined,
  HddOutlined,
  ReloadOutlined,
  UnorderedListOutlined,
  UploadOutlined
} from '@ant-design/icons-vue'
import type {LayoutMode, MediaTypeOption, StorageFilter} from '@/composables/useMediaLibrary'

const props = defineProps<{
  // 存储源 tabs 配置
  storageTabs: Array<{
    key: StorageFilter
    label: string
    count: number
    disabled?: boolean
  }>
  // 当前存储源
  currentStorage: StorageFilter
  // 关键词
  keyword: string
  // 文件类型列表
  types: MediaTypeOption[]
  typesLoading: boolean
  // 当前选中的类型
  currentMime: string
  // 当前布局模式
  layout: LayoutMode
  // 加载状态
  loading: boolean
  // MinIO 是否启用
  minioEnabled: boolean
}>()

const emit = defineEmits<{
  'update:keyword': [value: string]
  'update:currentMime': [value: string]
  'update:layout': [value: LayoutMode]
  refresh: []
  upload: []
  storageChange: [key: StorageFilter]
  search: []
  mimeChange: []
}>()

// 存储源 tabs 配置（带图标）
const tabsWithIcon = computed(() =>
    props.storageTabs.map(t => ({
      ...t,
      icon: t.key === 'local' ? HddOutlined : t.key === 'minio' ? CloudOutlined : FileOutlined
    }))
)

function onKeywordInput(e: Event) {
  const v = (e.target as HTMLInputElement).value
  emit('update:keyword', v)
}

function onMimeChange(v: string) {
  emit('update:currentMime', v)
  emit('mimeChange')
}
</script>

<template>
  <div class="media-toolbar">
    <!-- 顶部操作行 -->
    <div class="toolbar-row">
      <h2 class="page-title">媒体库</h2>
      <div class="toolbar-actions">
        <a-radio-group
            :value="layout"
            button-style="solid"
            size="small"
            @change="(e: any) => emit('update:layout', e.target.value as LayoutMode)"
        >
          <a-radio-button value="card">
            <AppstoreOutlined/>
            <span class="layout-label">卡片</span>
          </a-radio-button>
          <a-radio-button value="table">
            <UnorderedListOutlined/>
            <span class="layout-label">列表</span>
          </a-radio-button>
        </a-radio-group>

        <a-button :loading="loading" @click="emit('refresh')">
          <template #icon>
            <ReloadOutlined/>
          </template>
          刷新
        </a-button>
        <a-button type="primary" @click="emit('upload')">
          <template #icon>
            <UploadOutlined/>
          </template>
          上传文件
        </a-button>
      </div>
    </div>

    <!-- 存储源切换 -->
    <div class="storage-tabs">
      <div
          v-for="tab in tabsWithIcon"
          :key="tab.key"
          class="storage-tab"
          :class="{ active: currentStorage === tab.key, disabled: tab.disabled }"
          @click="!tab.disabled && emit('storageChange', tab.key)"
      >
        <component :is="tab.icon"/>
        <span class="label">{{ tab.label }}</span>
        <a-badge
            :count="tab.count"
            :number-style="{ backgroundColor: '#1677ff' }"
            :overflow-count="9999"
        />
      </div>
    </div>

    <!-- 筛选行：搜索 + 类型筛选 -->
    <div class="filter-row">
      <a-input-search
          :value="keyword"
          placeholder="搜索文件名"
          allow-clear
          style="max-width: 300px"
          @input="onKeywordInput"
          @search="emit('search')"
      />
      <a-select
          :value="currentMime"
          placeholder="按文件类型筛选"
          allow-clear
          style="width: 180px"
          :loading="typesLoading"
          @change="onMimeChange"
      >
        <a-select-option value="">全部类型</a-select-option>
        <a-select-option
            v-for="t in types"
            :key="t.value"
            :value="t.value"
        >
          <a-tag :color="t.color" style="margin-right: 4px">{{ t.label }}</a-tag>
          <span style="color: rgba(0,0,0,0.45); font-size: 12px">{{ t.value }}/*</span>
        </a-select-option>
      </a-select>
    </div>
  </div>
</template>

<style scoped>
.media-toolbar {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toolbar-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.layout-label {
  margin-left: 4px;
}

.storage-tabs {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.storage-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.storage-tab:hover:not(.disabled) {
  border-color: #1677ff;
  color: #1677ff;
}

.storage-tab.active {
  background: var(--color-primary-bg);
  border-color: #1677ff;
  color: #1677ff;
}

.storage-tab.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.storage-tab .label {
  font-size: 14px;
}

.filter-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
