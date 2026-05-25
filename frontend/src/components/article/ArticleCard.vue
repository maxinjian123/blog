<script setup lang="ts">
import type { Article } from '@/stores/article'

defineProps<{
  article: Article
}>()

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
<!--  {{article}}-->
  <article
    class="article-card group cursor-pointer rounded-sm overflow-hidden transition-all duration-300"
    style="background-color: var(--color-card); border: 1px solid var(--color-border); box-shadow: var(--shadow-sm)"
  >
    <div class="aspect-video overflow-hidden relative w-full" style="background-color: var(--color-hover);height: 200px;">
      <img
        v-if="article.cover_image"
        :src="article.cover_image"
        :alt="article.title"
        class="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        loading="lazy"
      />
      <div v-else class="w-full h-full flex flex-col items-center justify-center gap-2">
        <svg class="w-12 h-12 opacity-25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="color: var(--color-primary)">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
      <div
        class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        :style="{ background: 'var(--gradient-card-hover)' }"
      />
    </div>
    <div class="p-4 md:p-5">
      <div class="flex items-center gap-2 mb-2.5">
        <span
          v-if="article.category"
          class="text-xs px-2 py-0.5 rounded-md font-medium"
          style="background-color: var(--color-primary-light); color: var(--color-primary)"
        >
          {{ article.category }}
        </span>
        <span class="text-xs" style="color: var(--color-text-secondary)">{{ formatDate(article.created_at) }}</span>
      </div>
      <h3
        class="text-base md:text-lg font-bold mb-2 line-clamp-2 leading-snug transition-colors duration-200 group-hover:text-primary"
        style="color: var(--color-text)"
      >
        {{ article.title }}
      </h3>
      <p v-if="article.excerpt" class="text-sm line-clamp-2 leading-relaxed mb-0" style="color: var(--color-text-secondary)">
        {{ article.excerpt }}
      </p>
      <div class="flex items-center gap-3 mt-3 text-xs" style="color: var(--color-text-secondary)">
        <span class="flex items-center gap-1">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          {{ article.view_count || 0 }}
        </span>
        <span class="flex items-center gap-1">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
          {{ article.like_count || 0 }}
        </span>
        <span v-if="article.author" class="flex items-center gap-1">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          {{ article.author }}
        </span>
      </div>
    </div>
  </article>
</template>