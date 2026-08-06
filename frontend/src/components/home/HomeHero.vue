<script setup lang="ts">
import type { Article } from '@/stores/article'

defineProps<{
  featuredArticle: Article | null
}>()

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
</script>

<template>
  <section
    class="relative rounded-xl overflow-hidden mb-10"
    style="background-color: var(--color-card); border: 1px solid var(--color-border); box-shadow: var(--shadow-md)"
  >
    <!-- 背景装饰：渐变光晕 + 代码流 -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        class="absolute -top-24 -right-16 w-96 h-96 rounded-full blur-3xl opacity-[0.12]"
        style="background: var(--gradient-primary)"
      />
      <div
        class="absolute -bottom-32 -left-20 w-80 h-80 rounded-full blur-3xl opacity-[0.08]"
        style="background: var(--gradient-warm)"
      />
      <div class="absolute inset-0 opacity-[0.035] code-stream font-mono text-xs leading-relaxed whitespace-pre" style="color: var(--color-primary)">
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

    <div class="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 p-6 md:p-8 lg:p-10 items-center">
      <!-- 左：站点信息 -->
      <div class="lg:col-span-5 space-y-5">
        <div class="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full"
             style="background-color: var(--color-primary-light); color: var(--color-primary)">
          <span class="w-1.5 h-1.5 rounded-full animate-pulse-soft" style="background-color: var(--color-primary)"/>
          欢迎来到
        </div>
        <h1 class="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight tracking-tight" style="color: var(--color-text)">
          记录代码，<br/>
          <span class="text-gradient">沉淀思考</span>
        </h1>
        <p class="text-sm md:text-base leading-relaxed max-w-md" style="color: var(--color-text-secondary)">
          <slot name="description"/>
        </p>
        <div class="flex flex-wrap items-center gap-3 pt-1">
          <router-link
            to="/archive"
            class="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
            style="background: var(--gradient-primary); box-shadow: 0 4px 14px rgba(73,177,245,0.35)"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
            </svg>
            浏览归档
          </router-link>
          <router-link
            to="/about"
            class="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 hover:-translate-y-0.5"
            style="background-color: var(--color-card); color: var(--color-text); border: 1px solid var(--color-border)"
          >
            关于我
          </router-link>
        </div>
      </div>

      <!-- 右：精选文章大图 -->
      <div class="lg:col-span-7">
        <router-link v-if="featuredArticle" :to="`/article/${featuredArticle.id}`" class="block no-underline group">
          <article class="relative rounded-lg overflow-hidden" style="border: 1px solid var(--color-border); box-shadow: var(--shadow-md)">
            <div class="aspect-video md:aspect-21/9 overflow-hidden relative" style="background-color: var(--color-hover)">
              <img
                v-if="featuredArticle.cover_image"
                :src="featuredArticle.cover_image"
                :alt="featuredArticle.title"
                class="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                loading="lazy"
              />
              <div v-else class="w-full h-full flex items-center justify-center" style="color: var(--color-text-secondary)">
                <svg class="w-16 h-16 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
              <div class="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent"/>
              <div class="absolute top-3 left-3 flex items-center gap-2">
                <span class="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md"
                      style="background: var(--gradient-primary); color: #fff">
                  <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  精选
                </span>
                <span v-if="featuredArticle.category" class="text-xs font-medium px-2 py-0.5 rounded-md" style="background-color: rgba(255,255,255,0.18); color: rgba(255,255,255,0.9)">
                  {{ featuredArticle.category }}
                </span>
                <span v-if="featuredArticle.article_type && featuredArticle.article_type !== 'original'"
                      class="text-xs font-medium px-2 py-0.5 rounded-md"
                      style="background-color: rgba(255,255,255,0.18); color: rgba(255,255,255,0.9)">
                  {{ featuredArticle.article_type === 'repost' ? '转载' : '翻译' }}
                </span>
              </div>
              <div class="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                <h2 class="text-lg md:text-xl font-bold text-white mb-1 line-clamp-2 group-hover:underline">{{ featuredArticle.title }}</h2>
                <p v-if="featuredArticle.excerpt" class="text-sm line-clamp-2 mb-2" style="color: rgba(255,255,255,0.75)">
                  {{ featuredArticle.excerpt }}
                </p>
                <div class="flex items-center gap-4 text-xs" style="color: rgba(255,255,255,0.7)">
                  <span>{{ formatDate(featuredArticle.created_at) }}</span>
                  <span class="flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    {{ featuredArticle.view_count || 0 }} 阅读
                  </span>
                  <span class="flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/></svg>
                    {{ featuredArticle.like_count || 0 }}
                  </span>
                </div>
              </div>
            </div>
          </article>
        </router-link>

        <!-- 无精选文章时的占位 -->
        <div v-else class="rounded-lg flex flex-col items-center justify-center text-center p-10"
             style="border: 1px dashed var(--color-border); background-color: var(--color-hover)">
          <div class="w-16 h-16 rounded-full flex items-center justify-center mb-4" style="background: var(--gradient-primary)">
            <svg class="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <p class="text-sm font-medium" style="color: var(--color-text)">还没有精选文章</p>
          <p class="text-xs mt-1" style="color: var(--color-text-secondary)">可在管理后台为文章开启「精选」</p>
        </div>
      </div>
    </div>
  </section>
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
