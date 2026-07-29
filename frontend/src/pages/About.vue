<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import api from '@/utils/api'
import { useSiteStore } from '@/stores/site'

const loading = ref(true)
const error = ref('')

const siteStore = useSiteStore()
const siteInfo = computed(() => siteStore.info)

// 站点统计（来自 /site/stats）
const stats = ref({
  article_count: 0,
  category_count: 0,
  tag_count: 0,
  comment_count: 0,
  visitor_count: 0,
  running_days: 0,
  since: ''
})

const statItems = [
  { key: 'article_count', label: '文章' },
  { key: 'category_count', label: '分类' },
  { key: 'tag_count', label: '标签' },
  { key: 'comment_count', label: '评论' },
  { key: 'visitor_count', label: '访问' },
  { key: 'running_days', label: '运行天数' }
] as const

onMounted(async () => {
  // 站点信息走 store（与全局共享一次请求）
  siteStore.ensureLoaded()
  try {
    const statsRes = await api.get('/site/stats')
    stats.value = { ...stats.value, ...(statsRes.data?.data || statsRes.data) }
  } catch (err: any) {
    error.value = err?.response?.data?.message || '页面加载失败'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="about-page">
    <div class="flex items-center gap-3 mb-8 pt-2">
      <div class="w-1 h-6" style="background: var(--gradient-primary)"/>
      <h1 class="text-xl font-bold tracking-tight" style="color: var(--color-text)">关于</h1>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-20">
      <div class="w-10 h-10 border-2 rounded-full animate-spin"
           style="border-color: var(--color-primary); border-top-color: transparent" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-20">
      <p class="text-base" style="color: var(--color-text-secondary)">{{ error }}</p>
    </div>

    <!-- Content -->
    <div v-else class="animate-fade-in space-y-6">
      <!-- 作者信息卡 -->
      <section class="about-card p-6 md:p-8">
        <div class="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div class="shrink-0">
            <img v-if="siteInfo.author_avatar" :src="siteInfo.author_avatar" :alt="siteInfo.author_name"
                 class="w-24 h-24 object-cover border"
                 style="border-color: var(--color-border)"/>
            <div v-else class="w-24 h-24 flex items-center justify-center text-3xl font-bold text-white"
                 style="background: var(--gradient-primary)">
              {{ (siteInfo.author_name || 'L').charAt(0).toUpperCase() }}
            </div>
          </div>
          <div class="flex-1 text-center md:text-left">
            <h2 class="text-2xl font-bold mb-1" style="color: var(--color-text)">
              {{ siteInfo.author_name || '博主' }}
            </h2>
            <p class="text-sm mb-3" style="color: var(--color-primary)">{{ siteInfo.author_bio }}</p>
            <p class="text-sm leading-relaxed" style="color: var(--color-text-secondary)">
              {{ siteInfo.site_description }}
            </p>
            <div v-if="siteInfo.author_email" class="mt-4 flex items-center justify-center md:justify-start gap-2">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                   style="color: var(--color-text-secondary)">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              <a :href="`mailto:${siteInfo.author_email}`" class="text-sm hover:underline"
                 style="color: var(--color-text-secondary)">
                {{ siteInfo.author_email }}
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- 站点数据 -->
      <section class="about-card p-6 md:p-8">
        <h2 class="section-title">站点数据</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-px" style="background-color: var(--color-border)">
          <div v-for="item in statItems" :key="item.key"
               class="text-center py-5 px-4" style="background-color: var(--color-card)">
            <div class="text-2xl font-bold tabular-nums" style="color: var(--color-primary)">
              {{ stats[item.key] }}
            </div>
            <div class="text-xs mt-1" style="color: var(--color-text-secondary)">{{ item.label }}</div>
          </div>
        </div>
        <div v-if="stats.since" class="text-xs mt-4 text-center" style="color: var(--color-text-secondary)">
          自 {{ stats.since }} 开始记录
        </div>
      </section>

      <!-- 关于本站 -->
      <section class="about-card p-6 md:p-8">
        <h2 class="section-title">关于本站</h2>
        <div class="space-y-3 text-sm leading-relaxed" style="color: var(--color-text-secondary)">
          <p>
            {{ siteInfo.site_name || '本站' }}是一个专注于技术分享的个人博客，记录开发过程中的学习、实践与思考，
            涵盖后端开发、前端工程、数据库与系统架构等方向。
          </p>
          <p>
            站点前端基于 Vue 3 + TypeScript 构建，后端使用 Node.js + Express + MySQL + Redis，
            通过 Docker 容器化部署。文章内容支持 Markdown 编写，并集成了 AI 辅助创作能力。
          </p>
          <p>
            如果文章内容对你有帮助，欢迎在评论区或留言板交流；如发现内容错误，也欢迎指正。
          </p>
        </div>
      </section>

      <!-- 快捷入口 -->
      <section class="about-card p-6 md:p-8">
        <h2 class="section-title">快捷入口</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <router-link to="/archive" class="quick-link">
            <span class="text-lg">📚</span>
            <span>文章归档</span>
          </router-link>
          <router-link to="/guestbook" class="quick-link">
            <span class="text-lg">💬</span>
            <span>留言板</span>
          </router-link>
          <router-link to="/links" class="quick-link">
            <span class="text-lg">🔗</span>
            <span>友情链接</span>
          </router-link>
          <router-link to="/search" class="quick-link">
            <span class="text-lg">🔍</span>
            <span>站内搜索</span>
          </router-link>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.about-card {
  background-color: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  box-shadow: var(--shadow-sm);
}

.section-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 1rem;
  padding-left: 0.6rem;
  border-left: 3px solid var(--color-primary);
}

.quick-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  border-radius: 2px;
  transition: all 0.2s ease;
}

.quick-link:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
  background-color: var(--color-hover);
}
</style>
