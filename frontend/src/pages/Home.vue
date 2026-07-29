<script setup lang="ts">
import {computed, onMounted, ref, watch} from 'vue'
import {useArticleStore} from '@/stores/article'
import {useSiteStore} from '@/stores/site'
import ArticleCard from '@/components/article/ArticleCard.vue'
import {usePageSeo} from '@/composables/useSeo'
import BackToTop from "@/components/common/BackToTop.vue";

const articleStore = useArticleStore()
const siteStore = useSiteStore()
const currentPage = ref(1)
const pageSize = 10
const layout = ref<'card' | 'list'>('card')


usePageSeo({
  title: '首页',
  description: () => siteStore.info.site_description || '个人技术博客，分享Vue、前端、全栈开发等技术文章',
  keywords: () => siteStore.info.site_name || 'Blog',
})

const stats = computed(() => [
  {label: '文章', value: articleStore.total},
  {label: '浏览', value: articleStore.articles.reduce((s, a) => s + (a.view_count || 0), 0)},
  {label: '点赞', value: articleStore.articles.reduce((s, a) => s + (a.like_count || 0), 0)},
])

const featuredArticle = computed(() =>
    articleStore.articles.find((a) => a.featured) || articleStore.articles[0]
)

onMounted(() => {
  const saved = localStorage.getItem('blog-home-layout') as 'card' | 'list' | null
  if (saved === 'card' || saved === 'list') {
    layout.value = saved
  }
  articleStore.fetchArticles({page: currentPage.value, pageSize})
})

function setLayout(value: 'card' | 'list') {
  layout.value = value
  localStorage.setItem('blog-home-layout', value)
}

function goToPage(page: number) {
  currentPage.value = page
  articleStore.fetchArticles({page, pageSize})
  window.scrollTo({top: 0, behavior: 'smooth'})
}

const totalPages = ref(1)
watch(() => articleStore.total, (t) => {
  totalPages.value = Math.max(1, Math.ceil(t / pageSize))
})
</script>

<template>
  <div class="home-page mt-5">
    <!-- Hero -->
    <section
        class="relative rounded-xl overflow-hidden mb-10 p-6 md:p-8 lg:p-10"
        style="background-color: var(--color-card); border: 1px solid var(--color-border); box-shadow: var(--shadow-sm)"
    >
      <div class="absolute inset-0 opacity-[0.04] pointer-events-none overflow-hidden">
        <div class="code-stream font-mono text-xs leading-relaxed whitespace-pre" style="color: var(--color-primary)">
          const blog = {
          write: (thought) => publish(thought),
          learn: (tech) => build(tech),
          share: (code) => commit(code),
          };
          for await (const idea of curiosity) {
          blog.write(await craft(idea));
          }
        </div>
      </div>

      <div class="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
        <div class="lg:col-span-5 space-y-5">
          <div class="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full"
               style="background-color: var(--color-primary-light); color: var(--color-primary)">
            <span class="w-1.5 h-1.5 rounded-full" style="background-color: var(--color-primary)"/>
            {{ siteStore.info.site_name }}
          </div>
          <h1 class="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight tracking-tight"
              style="color: var(--color-text)">
            记录代码，<br/>
            <span
                style="background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">沉淀思考</span>
          </h1>
          <p class="text-sm md:text-base leading-relaxed max-w-md" style="color: var(--color-text-secondary)">
            {{ siteStore.info.site_description }}
          </p>
          <div class="flex items-center gap-6">
            <div v-for="s in stats" :key="s.label" class="text-center">
              <div class="text-xl md:text-2xl font-bold tabular-nums" style="color: var(--color-text)">{{
                  s.value
                }}
              </div>
              <div class="text-xs" style="color: var(--color-text-secondary)">{{ s.label }}</div>
            </div>
          </div>
        </div>

        <div v-if="featuredArticle" class="lg:col-span-7">
          <router-link :to="`/article/${featuredArticle.id}`" class="block no-underline group">
            <article
                class="relative rounded-lg overflow-hidden transition-all duration-300 hover:-translate-y-1"
                style="border: 1px solid var(--color-border); box-shadow: var(--shadow-sm)"
            >
              <div class="aspect-video md:aspect-21/9 overflow-hidden relative"
                   style="background-color: var(--color-hover)">
                <img
                    v-if="featuredArticle.cover_image"
                    :src="featuredArticle.cover_image"
                    :alt="featuredArticle.title"
                    class="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="lazy"
                />
                <div v-else class="w-full h-full flex items-center justify-center"
                     style="color: var(--color-text-secondary)">
                  <svg class="w-16 h-16 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       stroke-width="1">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>
                <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"/>
                <div class="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="text-xs font-medium px-2 py-0.5 rounded-md"
                          style="background-color: var(--color-primary); color: #fff">
                      精选
                    </span>
                    <span v-if="featuredArticle.category" class="text-xs" style="color: rgba(255,255,255,0.8)">
                      {{ featuredArticle.category }}
                    </span>
                  </div>
                  <h2 class="text-lg md:text-xl font-bold text-white mb-1 line-clamp-2">{{ featuredArticle.title }}</h2>
                  <p v-if="featuredArticle.excerpt" class="text-sm line-clamp-2" style="color: rgba(255,255,255,0.75)">
                    {{ featuredArticle.excerpt }}
                  </p>
                </div>
              </div>
            </article>
          </router-link>
        </div>
      </div>
    </section>

    <!-- Toolbar -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div class="flex items-center gap-3">
        <div class="w-1 h-6 rounded-full" style="background: var(--gradient-primary)"/>
        <h2 class="text-xl font-bold tracking-tight" style="color: var(--color-text)">文章</h2>
        <span class="text-sm font-medium px-2.5 py-0.5 rounded-full"
              style="background-color: var(--color-primary-light); color: var(--color-primary)">
          {{ articleStore.total }} 篇
        </span>
      </div>

      <div class="flex items-center gap-1.5 p-1 rounded-lg"
           style="background-color: var(--color-card); border: 1px solid var(--color-border)">
        <button
            type="button"
            aria-label="卡片视图"
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 cursor-pointer border-0"
            :style="{
            background: layout === 'card' ? 'var(--gradient-primary)' : 'transparent',
            color: layout === 'card' ? '#fff' : 'var(--color-text-secondary)',
          }"
            @click="setLayout('card')"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
          卡片
        </button>
        <button
            type="button"
            aria-label="列表视图"
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 cursor-pointer border-0"
            :style="{
            background: layout === 'list' ? 'var(--gradient-primary)' : 'transparent',
            color: layout === 'list' ? '#fff' : 'var(--color-text-secondary)',
          }"
            @click="setLayout('list')"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
          列表
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="articleStore.loading" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div v-for="i in 6" :key="i" class="rounded-xl overflow-hidden" style="border: 1px solid var(--color-border)">
        <div class="skeleton aspect-video"/>
        <div class="p-5 space-y-3">
          <div class="skeleton h-4 w-24"/>
          <div class="skeleton h-5 w-3/4"/>
          <div class="skeleton h-4 w-full"/>
          <div class="skeleton h-4 w-1/2"/>
        </div>
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="articleStore.articles.length === 0" class="text-center py-20">
      <svg class="w-20 h-20 mx-auto mb-4 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="1" style="color: var(--color-primary)">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
      <p class="text-lg font-medium mb-2" style="color: var(--color-text)">暂无文章</p>
      <p class="text-sm" style="color: var(--color-text-secondary)">还没有发布任何文章</p>
    </div>

    <!-- List -->
    <div
        v-else
        class="animate-fade-in"
        :class="layout === 'card'
        ? 'grid grid-cols-1 md:grid-cols-2 gap-6'
        : 'flex flex-col gap-4'"
    >
      <router-link
          v-for="(article, idx) in articleStore.articles"
          :key="article.id"
          :to="`/article/${article.id}`"
          class="block no-underline"
          :style="{ animationDelay: `${idx * 40}ms` }"
      >
        <ArticleCard :article="article" :layout="layout"/>
      </router-link>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex justify-center gap-1.5 mt-10">
      <button
          :disabled="currentPage === 1"
          @click="goToPage(currentPage - 1)"
          class="w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-all duration-200 border-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          style="background-color: var(--color-card); color: var(--color-text-secondary); border: 1px solid var(--color-border)"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <button
          v-for="p in totalPages"
          :key="p"
          @click="goToPage(p)"
          class="w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 border-0 cursor-pointer"
          :style="{
          background: p === currentPage ? 'var(--gradient-primary)' : 'var(--color-card)',
          color: p === currentPage ? '#fff' : 'var(--color-text-secondary)',
          border: p === currentPage ? 'none' : '1px solid var(--color-border)',
          boxShadow: p === currentPage ? 'var(--shadow-sm)' : 'none',
        }"
      >
        {{ p }}
      </button>
      <button
          :disabled="currentPage === totalPages"
          @click="goToPage(currentPage + 1)"
          class="w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-all duration-200 border-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          style="background-color: var(--color-card); color: var(--color-text-secondary); border: 1px solid var(--color-border)"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    </div>
    <BackToTop/>
  </div>
</template>

<style scoped>
.code-stream {
  animation: drift 24s linear infinite;
  transform: translateY(0);
}

@keyframes drift {
  0% {
    transform: translateY(-10%);
  }
  100% {
    transform: translateY(-40%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .code-stream {
    animation: none;
  }
}
</style>
