<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { SettingOutlined } from '@ant-design/icons-vue'
import { useImageCrawler } from '@/composables/useImageCrawler'
import ImageToolbar from '@/components/imageCrawler/ImageToolbar.vue'
import ImageGrid from '@/components/imageCrawler/ImageGrid.vue'
import ImagePreviewModal from '@/components/imageCrawler/ImagePreviewModal.vue'
import type { ImageItem, ImagePlatform } from '@/composables/useImageCrawler'

const {
  platforms,
  loading,
  loadingMore,
  downloading,
  list,
  total,
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

const router = useRouter()

// ============ 平台分组：按来源类型分组，便于用户理解各平台差异 ============
const platformGroups = computed(() => {
  return [
    {
      label: '搜索引擎',
      desc: '抓取自 Bing / 百度，覆盖面广，但版权状态需自行确认',
      items: platforms.value.filter(p => ['bing', 'baidu'].includes(p.id))
    },
    {
      label: '免费图库',
      desc: '通过官方 API 获取，授权清晰，可用于商用',
      items: platforms.value.filter(p => ['pexels', 'pixabay', 'unsplash'].includes(p.id))
    },
    {
      label: '表情包',
      desc: '搜索表情包与梗图',
      items: platforms.value.filter(p => p.id === 'dogetu')
    }
  ].filter(g => g.items.length > 0)
})

// 当前选中平台所属分组
const currentGroup = computed(() => {
  return platformGroups.value.find(g => g.items.some(p => p.id === query.platform))
})

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

// 跳转到设置页配置 API Key
function gotoSettings() {
  router.push({ name: 'Settings', query: { tab: 'image_crawler' } })
}

onMounted(() => {
  fetchUploadConfig()
})
</script>

<template>
  <div class="image-crawler-page">
    <!-- 页面标题区 -->
    <header class="page-head">
      <div class="head-main">
        <h1 class="page-title">图片抓取</h1>
        <p class="page-subtitle">
          从多平台搜索图片与表情包，下载到媒体库后可在文章与媒体管理中引用。
        </p>
      </div>
      <div class="head-meta">
        <a-button size="small" @click="gotoSettings">
          <template #icon>
            <SettingOutlined />
          </template>
          API Key 配置
        </a-button>
      </div>
    </header>

    <!-- 平台分组选择 -->
    <section class="platform-section">
      <div v-for="group in platformGroups" :key="group.label" class="platform-group">
        <div class="group-label">
          <span class="group-name">{{ group.label }}</span>
          <span class="group-desc">{{ group.desc }}</span>
        </div>
        <div class="group-items">
          <button
            v-for="p in group.items"
            :key="p.id"
            type="button"
            class="platform-chip"
            :class="{ active: query.platform === p.id }"
            @click="() => { query.platform = p.id; handlePlatformChange() }"
          >
            <span class="chip-label">{{ p.label }}</span>
            <span v-if="p.needsApiKey" class="chip-badge">API</span>
          </button>
        </div>
      </div>
    </section>

    <!-- 搜索 + 操作栏 -->
    <ImageToolbar
      v-model:current-platform="query.platform"
      v-model:keyword="query.keyword"
      v-model:target-storage="targetStorage"
      :platforms="platforms"
      :loading="loading"
      :downloading="downloading"
      :minio-enabled="minioEnabled"
      :selected-count="selectedCount"
      :show-platform-radio="false"
      @platform-change="handlePlatformChange"
      @search="handleSearch"
      @storage-change="handleStorageChange"
      @batch-download="onBatchDownload"
    />

    <!-- 结果统计条 -->
    <div v-if="list.length > 0 || loading" class="result-bar">
      <template v-if="list.length > 0">
        <span class="stat-item">
          共 <strong>{{ total }}</strong> 张
        </span>
        <span class="stat-sep">·</span>
        <span class="stat-item">已加载 <strong>{{ list.length }}</strong> 张</span>
        <template v-if="selectedCount > 0">
          <span class="stat-sep">·</span>
          <span class="stat-item stat-selected">已选 <strong>{{ selectedCount }}</strong> 张</span>
        </template>
      </template>
      <span v-else class="stat-hint">
        {{ currentGroup ? `在「${currentGroup.label}」中搜索` : '输入关键词开始搜索' }}
      </span>
    </div>

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
  gap: 20px;
  min-height: calc(100vh - 120px);
  --ic-ink: #0F172A;
  --ic-muted: #64748B;
  --ic-rule: #E2E8F0;
  --ic-mist: #F8FAFC;
  --ic-accent: #1677FF;
  --ic-accent-soft: #E6F4FF;
}

[data-theme='dark'] .image-crawler-page {
  --ic-ink: rgba(255, 255, 255, 0.85);
  --ic-muted: rgba(255, 255, 255, 0.45);
  --ic-rule: rgba(255, 255, 255, 0.12);
  --ic-mist: #262626;
  --ic-accent: #1677ff;
  --ic-accent-soft: #111a2c;
}

/* ============ 页面标题 ============ */
.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--ic-rule);
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--ic-ink);
  margin: 0;
  letter-spacing: -0.01em;
}

.page-subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--ic-muted);
  line-height: 1.5;
}

.head-meta {
  flex-shrink: 0;
}

/* ============ 平台分组选择 ============ */
.platform-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  background: var(--ic-mist);
  border: 1px solid var(--ic-rule);
  border-radius: 8px;
}

.platform-group {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 16px;
  align-items: start;
}

@media (max-width: 720px) {
  .platform-group {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}

.group-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.group-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--ic-ink);
  letter-spacing: 0.02em;
}

.group-desc {
  font-size: 11px;
  color: var(--ic-muted);
  line-height: 1.5;
}

.group-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.platform-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid var(--ic-rule);
  background: var(--color-bg-container);
  border-radius: 999px;
  font-size: 13px;
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
  line-height: 1.4;
}

.platform-chip:hover {
  border-color: var(--ic-accent);
  color: var(--ic-accent);
  transform: translateY(-1px);
}

.platform-chip.active {
  background: var(--ic-accent);
  border-color: var(--ic-accent);
  color: #fff;
  box-shadow: 0 2px 8px rgba(22, 119, 255, 0.25);
}

.platform-chip.active .chip-badge {
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
}

.chip-label {
  font-weight: 500;
}

.chip-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  background: var(--ic-accent-soft);
  color: var(--ic-accent);
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  line-height: 1.4;
}

/* ============ 结果统计条 ============ */
.result-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 12px;
  color: var(--ic-muted);
  background: var(--ic-mist);
  border-radius: 6px;
  border: 1px solid var(--ic-rule);
}

.result-bar strong {
  color: var(--ic-ink);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  margin: 0 2px;
}

.stat-selected strong {
  color: var(--ic-accent);
}

.stat-sep {
  color: var(--ic-rule);
}

.stat-hint {
  color: var(--ic-muted);
}
</style>
