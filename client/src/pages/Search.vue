<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useArticleStore } from '@/stores/article'
import ArticleCard from '@/components/ArticleCard.vue'
import AppPagination from '@/components/AppPagination.vue'

const route = useRoute()
const router = useRouter()
const articleStore = useArticleStore()

const keyword = ref((route.query.q as string) || '')
const page = ref(Number(route.query.page) || 1)
const pageSize = ref(10)

async function search() {
  await articleStore.fetchArticles({
    page: page.value,
    pageSize: pageSize.value,
    keyword: keyword.value,
  })
}

function onSearch() {
  page.value = 1
  router.push({ query: { q: keyword.value, page: '1' } })
}

function onPageChange(newPage: number) {
  page.value = newPage
  router.push({ query: { ...route.query, page: String(newPage) } })
}

watch([() => route.query.q, page], () => {
  keyword.value = (route.query.q as string) || ''
  search()
})

onMounted(() => {
  search()
})
</script>

<template>
  <lay-card title="搜索文章" class="blog-card">
    <div class="search-form">
      <lay-input
        v-model="keyword"
        placeholder="输入关键词搜索..."
        @keyup.enter="onSearch"
      >
        <template #suffix>
          <lay-button type="primary" @click="onSearch">
            <lay-icon type="layui-icon-search" /> 搜索
          </lay-button>
        </template>
      </lay-input>
    </div>

    <lay-loading :loading="articleStore.loading" tip="搜索中...">
      <template v-if="articleStore.articles.length">
        <p class="search-result">共找到 {{ articleStore.total }} 篇文章</p>
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
      <lay-empty v-else-if="keyword" description="未找到相关文章" />
      <lay-empty v-else description="输入关键词开始搜索" />
    </lay-loading>
  </lay-card>
</template>

<style scoped>
.search-form {
  margin-bottom: 24px;
}

.search-result {
  color: #999;
  font-size: 13px;
  margin: 0 0 16px;
}
</style>
