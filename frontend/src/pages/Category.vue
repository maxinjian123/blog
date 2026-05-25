<script setup lang="ts">
import {computed, onMounted, ref, watch} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {useArticleStore} from '@/stores/article'
import ArticleCard from '@/components/article/ArticleCard.vue'
import {LeftOutlined} from '@ant-design/icons-vue'

const route = useRoute()
const router = useRouter()
const articleStore = useArticleStore()

const id = computed(() => route.params.id as string)
const name = computed(() => route.params.name as string)
const currentPage = ref(1)
const pageSize = ref(10)

onMounted(() => {
  articleStore.fetchArticlesByCategory(id.value)
})

watch(id, (newId) => {
  currentPage.value = 1
  articleStore.fetchArticlesByCategory(newId)
})

function goBack() {
  router.back()
}
</script>

<template>
  <div class="category-page mt-5">
    <button
        @click="goBack"
        class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm
        rounded-lg transition-all duration-200 mb-6 border bg-transparent cursor-pointer hover:-translate-x-1"
        style="color: var(--color-text-secondary); border-color: var(--color-border)"
    >
      <LeftOutlined/>
      返回
    </button>
    <div class="flex items-center gap-3 mb-8 pt-2">

      <div class="w-1 h-6 rounded-full" style="background: var(--gradient-primary)"/>
      <h1 class="text-xl font-bold tracking-tight" style="color: var(--color-text)">{{ name }}</h1>
      <span v-if="!articleStore.loading" class="text-sm font-medium px-2.5 py-0.5 rounded-full"
            style="background-color: var(--color-primary-light); color: var(--color-primary)">
        {{ articleStore.total }} 篇
      </span>
    </div>

    <div v-if="articleStore.loading" class="flex justify-center py-20">
      <div class="w-10 h-10 border-2 rounded-full animate-spin"
           style="border-color: var(--color-primary); border-top-color: transparent"/>
    </div>

    <div v-else-if="articleStore.articles.length === 0" class="text-center py-20">
      <svg class="w-20 h-20 mx-auto mb-4 opacity-15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="1" style="color: var(--color-primary)">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
      <p class="text-lg font-medium mb-4" style="color: var(--color-text)">该分类下暂无文章</p>
      <router-link to="/" class="text-sm font-medium hover:underline" style="color: var(--color-primary)">返回首页
      </router-link>
    </div>

    <div v-else class="space-y-6 animate-fade-in">
      <router-link
          v-for="article in articleStore.articles"
          :key="article.id"
          :to="`/article/${article.id}`"
          class="block no-underline"
      >
        <ArticleCard :article="article"/>
      </router-link>
    </div>
  </div>
</template>