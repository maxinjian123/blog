<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useArticleStore } from '@/stores/article'
import ArticleCard from '@/components/ArticleCard.vue'
import AppPagination from '@/components/AppPagination.vue'

const route = useRoute()
const router = useRouter()
const articleStore = useArticleStore()

const categoryId = computed(() => route.params.id as string)
const categoryName = computed(() => (route.params.name as string) || '分类')
const page = ref(Number(route.query.page) || 1)
const pageSize = ref(10)

async function loadArticles() {
  await articleStore.fetchArticles({
    page: page.value,
    pageSize: pageSize.value,
    category_id: categoryId.value,
  })
}

function onPageChange(newPage: number) {
  page.value = newPage
  router.push({ query: { ...route.query, page: String(newPage) } })
}

watch([categoryId, page], loadArticles)

onMounted(() => {
  loadArticles()
})
</script>

<template>
  <lay-card :title="`分类：${categoryName}`" class="blog-card">
    <lay-loading :loading="articleStore.loading" tip="加载中...">
      <template v-if="articleStore.articles.length">
        <ArticleCard
          v-for="article in articleStore.articles"
          :key="article.id"
          :article="article"
        />
        <AppPagination
          :page="page"
          :page-size="pageSize"
          :total="articleStore.total"
          @change="onPageChange"
        />
      </template>
      <lay-empty v-else description="该分类下暂无文章" />
    </lay-loading>
  </lay-card>
</template>
