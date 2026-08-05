<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useStatsStore } from '@/stores/stats'

const statsStore = useStatsStore()

onMounted(() => {
  statsStore.ensureLoaded()
})

const items = computed(() => [
  { label: '文章', value: statsStore.stats.article_count, gradient: 'linear-gradient(135deg, #49B1F5, #63c4f7)', icon: 'article' },
  { label: '分类', value: statsStore.stats.category_count, gradient: 'linear-gradient(135deg, #34d399, #6ee7b7)', icon: 'category' },
  { label: '标签', value: statsStore.stats.tag_count, gradient: 'linear-gradient(135deg, #a78bfa, #c4b5fd)', icon: 'tag' },
  { label: '评论', value: statsStore.stats.comment_count, gradient: 'linear-gradient(135deg, #fbbf24, #fcd34d)', icon: 'comment' },
  { label: '访客', value: statsStore.stats.visitor_count, gradient: 'linear-gradient(135deg, #fb7185, #fda4af)', icon: 'visitor' },
  { label: '运行天数', value: statsStore.stats.running_days, gradient: 'linear-gradient(135deg, #38bdf8, #7dd3fc)', icon: 'calendar' },
])

function formatValue(v: number) {
  if (!v) return '0'
  if (v >= 10000) return `${(v / 10000).toFixed(1)}w`
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`
  return String(v)
}
</script>

<template>
  <div class="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
    <div
      v-for="item in items"
      :key="item.label"
      class="card-elevated flex items-center gap-3 p-3 md:p-4 group"
    >
      <div
        class="w-9 h-9 md:w-10 md:h-10 shrink-0 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
        :style="{ background: item.gradient }"
      >
        <svg v-if="item.icon === 'article'" class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
        <svg v-else-if="item.icon === 'category'" class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        <svg v-else-if="item.icon === 'tag'" class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
        </svg>
        <svg v-else-if="item.icon === 'comment'" class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <svg v-else-if="item.icon === 'visitor'" class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
        </svg>
        <svg v-else class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </div>
      <div class="min-w-0">
        <div class="text-lg md:text-xl font-bold tabular-nums leading-tight" style="color: var(--color-text)">
          {{ formatValue(item.value) }}
        </div>
        <div class="text-xs truncate" style="color: var(--color-text-secondary)">{{ item.label }}</div>
      </div>
    </div>
  </div>
</template>
