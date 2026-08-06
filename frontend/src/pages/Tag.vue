<script setup lang="ts">
import {computed, onMounted, ref, watch} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import ArticleCard from '@/components/article/ArticleCard.vue'
import api from '@/utils/api'
import {LeftOutlined} from "@ant-design/icons-vue";
import {Tag} from "@/stores/article.ts";

const route = useRoute()
const router = useRouter()

interface Article {
  id: number
  title: string
  cover?: string
  summary?: string
  category?: { name: string; slug: string }
  tags?: Tag[]
  author?: { username: string }
  view_count?: number
  created_at: string
}

const id = computed(() => route.params.id as string)
const name = computed(() => route.params.name as string)
const articles = ref<Article[]>([])
const total = ref(0)
const loading = ref(false)
const currentPage = ref(1)
const pageSize = 10

onMounted(() => {
  fetchArticles()
})

watch(id, (newId) => {
  // 路由离开时 id 会变为 undefined，避免发出杂散请求
  if (!newId || route.name !== 'Tag') return
  currentPage.value = 1
  fetchArticles()
})

async function fetchArticles() {
  loading.value = true
  try {
    const res = await api.get(`/tags/${id.value}/articles`, {
      params: {page: currentPage.value, pageSize}
    })
    const data = res.data.data || res.data
    articles.value = data.list || []
    total.value = data.total || 0
  } catch {
    articles.value = []
  } finally {
    loading.value = false
  }
}

function goBack() {
  // 无历史记录（直接打开本页）时回退首页，避免空白
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push('/')
  }
}
</script>

<template>
  <div class="tag-page mt-5 max-w-[960px] mx-auto px-4 lg:px-8">
    <!-- 注意：根节点外不可有注释，dev 模式下会形成多根 fragment，导致 App.vue 的 <transition mode="out-in"> 卡死、全站导航空白 -->

    <!-- 返回按钮 -->
    <button
        @click="goBack"
        class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm
        rounded-lg transition-all duration-200 mb-6 border bg-transparent cursor-pointer hover:-translate-x-1"
        style="color: var(--color-text-secondary); border-color: var(--color-border)"
    >
      <LeftOutlined/>
      返回
    </button>

    <!-- 标签标题 -->
    <div class="flex items-center gap-3 mb-8 pt-2">
      <div class="w-1 h-6 rounded-full" style="background: var(--gradient-primary)"/>
      <h1 class="text-xl font-bold tracking-tight" style="color: var(--color-text)">
        <span class="text-sm font-normal mr-2" style="color: var(--color-text-secondary)">标签</span>
        {{ name }}
      </h1>
      <span v-if="!loading" class="text-sm font-medium px-2.5 py-0.5 rounded-full"
            style="background-color: var(--color-primary-light); color: var(--color-primary)">
        {{ total }} 篇
      </span>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center py-20">
      <div class="w-10 h-10 border-2 rounded-full animate-spin"
           style="border-color: var(--color-primary); border-top-color: transparent"/>
    </div>

    <!-- 空状态 -->
    <div v-else-if="articles.length === 0" class="text-center py-20">
      <svg class="w-20 h-20 mx-auto mb-4 opacity-15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="1" style="color: var(--color-primary)">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
        <line x1="7" y1="7" x2="7.01" y2="7"/>
      </svg>
      <p class="text-lg font-medium mb-4" style="color: var(--color-text)">该标签下暂无文章</p>
      <router-link to="/" class="text-sm font-medium hover:underline" style="color: var(--color-primary)">返回首页
      </router-link>
    </div>

    <!-- 文章列表：列表式卡片，封面仅作小图展示 -->
    <div v-else class="space-y-4 animate-fade-in">
      <router-link
          v-for="article in articles"
          :key="article.id"
          :to="`/article/${article.id}`"
          class="block no-underline"
      >
        <ArticleCard
            layout="list"
            :article="{
            id: String(article.id),
            title: article.title,
            slug: '',
            excerpt: article.summary || '',
            content: '',
            content_type: 'html',
            cover_image: article.cover || '',
            category: article.category?.name || '',
            category_slug: article.category?.slug || '',
            tags: article.tags as Tag[],
            author: article.author?.username || '',
            created_at: article.created_at,
            updated_at: '',
            published: true,
            featured: false,
            view_count: article.view_count || 0,
            like_count: (article as any).like_count || 0,
            comment_count: (article as any).comment_count || 0,
            catalog: (article as any).catalog || [],
            article_type: (article as any).article_type || 'original',
            original_url: (article as any).original_url || '',
            original_authorized: !!((article as any).original_authorized),
            creation_declaration: (article as any).creation_declaration || 'none',
          }"
        />
      </router-link>
    </div>
  </div>
</template>