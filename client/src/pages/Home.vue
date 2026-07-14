<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useArticleStore } from '@/stores/article'
import ArticleCard from '@/components/ArticleCard.vue'
import AppPagination from '@/components/AppPagination.vue'

type LayoutType = 'list' | 'card'

const route = useRoute()
const router = useRouter()
const articleStore = useArticleStore()

const page = ref(Number(route.query.page) || 1)
const pageSize = ref(10)
const layout = ref<LayoutType>((localStorage.getItem('home-layout') as LayoutType) || 'list')

async function loadArticles() {
  await articleStore.fetchArticles({
    page: page.value,
    pageSize: pageSize.value,
  })
}

function onPageChange(newPage: number) {
  page.value = newPage
  router.push({ query: { ...route.query, page: String(newPage) } })
}

function toggleLayout(newLayout: LayoutType) {
  if (layout.value === newLayout) return
  layout.value = newLayout
  localStorage.setItem('home-layout', newLayout)
}

watch(page, loadArticles, { immediate: false })

onMounted(() => {
  loadArticles()
})
</script>

<template>
  <div class="home-page">
    <lay-card title="最新文章" class="blog-card home-card">
      <template #extra>
        <div class="layout-switcher">
          <button
            class="layout-btn"
            :class="{ active: layout === 'list' }"
            title="列表布局"
            @click="toggleLayout('list')"
          >
            <svg class="icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <rect x="3" y="5" width="18" height="4" rx="1" />
              <rect x="3" y="11" width="18" height="4" rx="1" />
              <rect x="3" y="17" width="18" height="4" rx="1" />
            </svg>
          </button>
          <button
            class="layout-btn"
            :class="{ active: layout === 'card' }"
            title="卡片布局"
            @click="toggleLayout('card')"
          >
            <svg class="icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </button>
        </div>
      </template>
      <lay-loading :loading="articleStore.loading" tip="加载中...">
        <template v-if="articleStore.articles.length">
          <div class="article-list" :class="`is-${layout}`">
            <ArticleCard
              v-for="article in articleStore.articles"
              :key="article.id"
              :article="article"
              :layout="layout"
            />
          </div>
          <AppPagination
            :page="page"
            :page-size="pageSize"
            :total="articleStore.total"
            @change="onPageChange"
          />
        </template>
        <lay-empty v-else description="暂无文章" />
      </lay-loading>
    </lay-card>
  </div>
</template>

<style scoped>
.home-card :deep(.layui-card-header) {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.layout-switcher {
  display: flex;
  align-items: center;
  gap: 8px;
}

.layout-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background: #fff;
  color: #999;
  cursor: pointer;
  transition: all 0.2s;
}

.layout-btn:hover {
  color: #16baaa;
  border-color: #16baaa;
}

.layout-btn.active {
  color: #fff;
  background: #16baaa;
  border-color: #16baaa;
}

.layout-btn .icon {
  width: 16px;
  height: 16px;
}

.article-list {
  display: flex;
  flex-direction: column;
}

.article-list.is-card {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

@media (min-width: 1200px) {
  .article-list.is-card {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .article-list.is-card {
    grid-template-columns: 1fr;
  }
}
</style>
