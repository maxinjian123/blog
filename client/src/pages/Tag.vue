<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTagStore } from '@/stores/tag'
import ArticleCard from '@/components/ArticleCard.vue'
import AppPagination from '@/components/AppPagination.vue'

const route = useRoute()
const router = useRouter()
const tagStore = useTagStore()

const tagId = computed(() => route.params.id as string)
const tagName = computed(() => (route.params.name as string) || '标签')
const page = ref(Number(route.query.page) || 1)
const pageSize = ref(10)

async function loadArticles() {
  await tagStore.fetchTagArticles(tagId.value, page.value, pageSize.value)
}

function onPageChange(newPage: number) {
  page.value = newPage
  router.push({ query: { ...route.query, page: String(newPage) } })
}

watch([tagId, page], loadArticles)

onMounted(() => {
  loadArticles()
})
</script>

<template>
  <lay-card :title="`标签：${tagName}`" class="blog-card">
    <lay-loading :loading="tagStore.loading" tip="加载中...">
      <template v-if="tagStore.tagArticles.length">
        <ArticleCard
          v-for="article in tagStore.tagArticles"
          :key="article.id"
          :article="article"
        />
        <AppPagination
          :page="page"
          :page-size="pageSize"
          :total="tagStore.total"
          @change="onPageChange"
        />
      </template>
      <lay-empty v-else description="该标签下暂无文章" />
    </lay-loading>
  </lay-card>
</template>
