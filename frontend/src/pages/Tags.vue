<script setup lang="ts">
import {onMounted, ref} from 'vue'
import api from '@/utils/api'
import TagCloud from "@/components/common/TagCloud.vue";

interface Tag {
  id: number
  name: string
  slug: string
  color?: string
  article_count?: number
}

const tags = ref<Tag[] >([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await api.get('/tags', {
      headers: {
        'All': 'true'
      }
    })
    const data = res.data.data || res.data
    tags.value = data.list.map((item: Tag) => {
      return {
        ...item,
        color: getRandomColor()
      }
    })
  } catch {
    tags.value = []
  } finally {
    loading.value = false
  }
})
// 随机颜色
const getRandomColor = () => {
  const arr = ['#006666', '#009999', '#333333', '#660099', '#990066', '#CC0099', '#CC3300', '#FF9900', '#006633']
  return arr[Math.floor(Math.random() * arr.length)]
}
</script>

<template>
  <div class="tags-page mt-5">
    <div class="flex items-center gap-3 mb-8 pt-2">
      <div class="w-1 h-6 rounded-full" style="background: var(--gradient-primary)"/>
      <h1 class="text-xl font-bold tracking-tight" style="color: var(--color-text)">标签</h1>
      <span v-if="!loading" class="text-sm font-medium px-2.5 py-0.5 rounded-full"
            style="background-color: var(--color-primary-light); color: var(--color-primary)">
        {{ tags.length }} 个
      </span>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <div class="w-10 h-10 border-2 rounded-full animate-spin"
           style="border-color: var(--color-primary); border-top-color: transparent"/>
    </div>

    <div v-else-if="tags.length === 0" class="text-center py-20">
      <svg class="w-20 h-20 mx-auto mb-4 opacity-15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="1" style="color: var(--color-primary)">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
        <line x1="7" y1="7" x2="7.01" y2="7"/>
      </svg>
      <p class="text-lg font-medium" style="color: var(--color-text)">暂无标签</p>
    </div>

    <div v-else class="flex flex-wrap gap-3 animate-fade-in">
      <router-link
          v-for="tag in tags"
          :key="tag.id"
          :to="`/tag/${tag.id}/${tag.name}`"
          class="card-elevated px-5 py-3 no-underline group cursor-pointer rounded-xl! flex flex-col items-center gap-1.5 transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
      >
        <div
            class="w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
            :style="{
              background: tag.color,
            }">
          <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
            <line x1="7" y1="7" x2="7.01" y2="7"/>
          </svg>
        </div>
        <span class="text-sm font-semibold group-hover:text-primary transition-colors" style="color: var(--color-text)">{{
            tag.name
          }}</span>
        <span v-if="tag.article_count !== undefined" class="text-xs"
              style="color: var(--color-text-secondary)">{{ tag.article_count }} 篇</span>
      </router-link>

<!--      <tag-cloud :tags="tags" width="200" height="100" radius="250"></tag-cloud>-->
    </div>
  </div>
</template>