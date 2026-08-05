<script setup lang="ts">
import { onMounted, ref } from 'vue'
import api from '@/utils/api'
import { mapArticle, unwrapArticleList } from '@/utils/articleMapper'
import type { Article } from '@/stores/article'
import { useSiteStore } from '@/stores/site'
import { usePageSeo } from '@/composables/useSeo'
import HomeHero from '@/components/home/HomeHero.vue'
import HomeStats from '@/components/home/HomeStats.vue'
import HomeArticleList from '@/components/home/HomeArticleList.vue'
import BackToTop from '@/components/common/BackToTop.vue'

const siteStore = useSiteStore()

const featuredArticle = ref<Article | null>(null)

usePageSeo({
  title: '首页',
  description: () => siteStore.info.site_description || '个人技术博客，分享Vue、前端、全栈开发等技术文章',
  keywords: () => siteStore.info.site_name || 'Blog',
})

onMounted(async () => {
  // 单独拉取精选文章用于 Hero 大图：
  // 直接走 api（不经 articleStore），避免与 HomeArticleList 的列表请求并发写同一 store 产生竞态
  try {
    const res: any = await api.get('/articles', { params: { featured: true, pageSize: 1 } })
    const payload = res.data?.data || res.data
    const list = unwrapArticleList(payload)
    featuredArticle.value = list[0] ? mapArticle(list[0]) : null
  } catch {
    featuredArticle.value = null
  }
})
</script>

<template>
  <div class="home-page mt-5">
    <HomeHero :featured-article="featuredArticle">
      <template #description>
        {{ siteStore.info.site_description }}
      </template>
    </HomeHero>

    <HomeStats/>

    <div class="mt-10">
      <HomeArticleList/>
    </div>

    <BackToTop/>
  </div>
</template>
