<script setup lang="ts">
import { computed, ref } from 'vue'
import ImageCard from './ImageCard.vue'
import type { ImageItem } from '@/composables/useImageCrawler'

const props = defineProps<{
  list: ImageItem[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
}>()

const emit = defineEmits<{
  (e: 'preview', item: ImageItem): void
  (e: 'download', item: ImageItem): void
  (e: 'toggle-select', item: ImageItem): void
  (e: 'load-more'): void
}>()

const selectedCount = computed(() => props.list.filter(i => i._selected).length)
const allSelected = computed(() => props.list.length > 0 && props.list.every(i => i._selected))
const indeterminate = computed(() => {
  const sel = props.list.filter(i => i._selected).length
  return sel > 0 && sel < props.list.length
})

function handleSelectAll(e: any) {
  const checked = e?.target?.checked ?? !allSelected.value
  props.list.forEach(item => {
    if (item._selected !== checked) {
      emit('toggle-select', item)
    }
  })
}

// ============ 触底无限滚动（节流 + 防抖） ============
const scrollRef = ref<HTMLElement | null>(null)
const TRIGGER_THRESHOLD = 160 // 距底部多少 px 触发加载

/**
 * 节流：限制滚动事件触发频率（200ms 内最多触发一次触底检测）
 */
function throttle(fn: () => void, wait: number) {
  let last = 0
  let timer: any = null
  return (...args: any[]) => {
    const now = Date.now()
    if (now - last >= wait) {
      last = now
      fn(...args as [])
    } else if (!timer) {
      // 尾沿：wait 结束前若仍在滚动则执行一次，保证能触底
      timer = setTimeout(() => {
        last = Date.now()
        timer = null
        fn(...args as [])
      }, wait - (now - last))
    }
  }
}

/**
 * 防抖：触底后 150ms 内只发出一次 load-more（避免连续滚动反复触发）
 */
function debounce(fn: () => void, wait: number) {
  let timer: any = null
  return () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      fn()
    }, wait)
  }
}

const debouncedLoadMore = debounce(() => {
  if (props.loading || props.loadingMore || !props.hasMore) return
  emit('load-more')
}, 150)

const throttledOnScroll = throttle(() => {
  const el = scrollRef.value
  if (!el) return
  const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
  if (distFromBottom <= TRIGGER_THRESHOLD) {
    debouncedLoadMore()
  }
}, 200)

function onScroll() {
  throttledOnScroll()
}
</script>

<template>
  <div class="image-grid-wrapper">
    <!-- 顶部全选条 -->
    <div v-if="list.length" class="grid-toolbar">
      <a-checkbox
        :checked="allSelected"
        :indeterminate="indeterminate"
        @change="handleSelectAll"
      >
        全选
      </a-checkbox>
      <span class="selected-count">已选 {{ selectedCount }} / {{ list.length }} 张</span>
      <span v-if="hasMore" class="hint">滚动到底部加载更多</span>
    </div>

    <a-spin :spinning="loading">
      <!-- 滚动容器：触底触发 load-more -->
      <div v-if="list.length" ref="scrollRef" class="image-grid-scroll" @scroll.passive="onScroll">
        <!-- 瀑布流网格：CSS columns 实现，无需第三方库 -->
        <div class="image-grid">
          <ImageCard
            v-for="item in list"
            :key="item.id"
            :item="item"
            :selected="!!item._selected"
            @preview="emit('preview', $event)"
            @download="emit('download', $event)"
            @toggle-select="emit('toggle-select', $event)"
          />
        </div>

        <!-- 底部加载状态 -->
        <div class="grid-footer">
          <template v-if="loadingMore">
            <a-spin size="small" />
            <span class="footer-text">正在加载更多...</span>
          </template>
          <template v-else-if="!hasMore">
            <span class="footer-text">—— 已经到底啦 ——</span>
          </template>
          <template v-else>
            <span class="footer-text">上拉加载更多</span>
          </template>
        </div>
      </div>

      <a-empty
        v-else-if="!loading"
        description="暂无搜索结果，请输入关键词搜索"
        style="padding: 60px 0"
      />
    </a-spin>
  </div>
</template>

<style scoped>
.image-grid-wrapper {
  min-height: 300px;
}

.grid-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 0 12px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 16px;
}

.selected-count {
  color: rgba(0, 0, 0, 0.45);
  font-size: 13px;
}

.hint {
  color: rgba(0, 0, 0, 0.25);
  font-size: 12px;
}

/* 滚动容器：独立滚动，高度撑满剩余视口 */
.image-grid-scroll {
  overflow-y: auto;
  max-height: calc(100vh - 380px);
  padding-right: 4px;
}

/* 瀑布流布局：使用 CSS columns，每个卡片 break-inside: avoid */
.image-grid {
  column-count: 4;
  column-gap: 16px;
}

@media (max-width: 1400px) {
  .image-grid { column-count: 3; }
}

@media (max-width: 900px) {
  .image-grid { column-count: 2; }
}

@media (max-width: 600px) {
  .image-grid { column-count: 1; }
}

.grid-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 0 8px;
  color: rgba(0, 0, 0, 0.45);
  font-size: 13px;
}

.footer-text {
  font-size: 13px;
}
</style>
