<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSiteStore } from '@/stores/site'
import { useCategoryStore } from '@/stores/category'
import { useTagStore } from '@/stores/tag'
import { useArticleStore } from '@/stores/article'
import { formatDate, formatNumber } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const siteStore = useSiteStore()
const categoryStore = useCategoryStore()
const tagStore = useTagStore()
const articleStore = useArticleStore()

const activeMenu = computed(() => route.path === '/' ? '/' : `/${route.path.split('/')[1]}`)

const menuItems = [
  { id: '/', label: '首页' },
  { id: '/categories', label: '分类' },
  { id: '/tags', label: '标签' },
  { id: '/archive', label: '归档' },
  { id: '/search', label: '搜索' },
  { id: '/about', label: '关于' },
]

function goTo(path: string) {
  router.push(path)
}

onMounted(() => {
  siteStore.fetchSiteInfo()
  siteStore.fetchAnnouncements()
  categoryStore.fetchCategories()
  tagStore.fetchTags(1, 20)
  articleStore.fetchRecentArticles(5)
})
</script>

<template>
  <div class="blog-layout">
    <header class="blog-header">
      <div class="blog-header-inner">
        <div class="blog-logo" @click="router.push('/')">{{ siteStore.siteInfo?.site_name || 'TechMind Blog' }}</div>
        <lay-menu :selected-key="activeMenu" theme="light" class="blog-menu">
          <lay-menu-item v-for="item in menuItems" :key="item.id" :id="item.id" @click="goTo(item.id)">
            {{ item.label }}
          </lay-menu-item>
        </lay-menu>
      </div>
    </header>

    <div class="blog-container">
      <main class="blog-main">
        <router-view />
      </main>

      <aside class="blog-sidebar">
        <!-- 站点信息 -->
        <lay-card class="blog-card" title="站点信息">
          <div class="site-info">
            <img
              v-if="siteStore.siteInfo?.author_avatar"
              :src="siteStore.siteInfo.author_avatar"
              class="site-avatar"
              alt="avatar"
            />
            <div v-else class="site-avatar">{{ siteStore.siteInfo?.author_name?.[0] || 'B' }}</div>
            <h3>{{ siteStore.siteInfo?.author_name || '博主' }}</h3>
            <p>{{ siteStore.siteInfo?.author_bio || '' }}</p>
            <p class="site-desc">{{ siteStore.siteInfo?.site_description || '' }}</p>
          </div>
        </lay-card>

        <!-- 统计 -->
        <lay-card class="blog-card" title="站点统计">
          <div class="stat-grid">
            <div class="stat-item">
              <div class="stat-value">{{ formatNumber(articleStore.total) }}</div>
              <div class="stat-label">文章</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ formatNumber(categoryStore.categories.length) }}</div>
              <div class="stat-label">分类</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ formatNumber(tagStore.tags.length) }}</div>
              <div class="stat-label">标签</div>
            </div>
          </div>
        </lay-card>

        <!-- 公告 -->
        <lay-card v-if="siteStore.announcements.some(i => i.is_active)" class="blog-card" title="公告">
          <div
            v-for="a in siteStore.announcements.filter(i => i.is_active)"
            :key="a.id"
            class="announcement-item"
          >
            {{ a.content }}
          </div>
        </lay-card>

        <!-- 分类 -->
        <lay-card class="blog-card" title="分类">
          <div class="category-list">
            <lay-tag
              v-for="c in categoryStore.categories"
              :key="c.id"
              color="blue"
              style="margin: 4px; cursor: pointer;"
              @click="router.push(`/category/${c.id}/${c.slug}`)"
            >
              {{ c.name }}
              <lay-badge v-if="c.article_count" :value="c.article_count" />
            </lay-tag>
          </div>
        </lay-card>

        <!-- 标签云 -->
        <lay-card v-if="tagStore.tags.length" class="blog-card" title="标签">
          <div class="tag-cloud">
            <lay-tag
              v-for="tag in tagStore.tags.slice(0, 20)"
              :key="tag.id"
              color="cyan"
              style="margin: 4px; cursor: pointer;"
              @click="router.push(`/tag/${tag.id}/${tag.slug}`)"
            >
              {{ tag.name }}
            </lay-tag>
          </div>
        </lay-card>

        <!-- 最新文章 -->
        <lay-card class="blog-card" title="最新文章">
          <div class="article-list">
            <div
              v-for="a in articleStore.recentArticles"
              :key="a.id"
              class="recent-article"
              @click="router.push(`/article/${a.id}`)"
            >
              <div class="recent-title">{{ a.title }}</div>
              <div class="recent-meta">{{ formatDate(a.published_at || a.created_at) }}</div>
            </div>
          </div>
        </lay-card>
      </aside>
    </div>

    <footer class="blog-footer">
      <p>© {{ new Date().getFullYear() }} {{ siteStore.siteInfo?.site_name || 'TechMind Blog' }}. All rights reserved.</p>
    </footer>
  </div>
</template>

<style scoped>
.blog-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.blog-header {
  background: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}

.blog-header-inner {
  max-width: var(--blog-max-width);
  margin: 0 auto;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 24px;
}

.blog-logo {
  font-size: 20px;
  font-weight: 600;
  color: #16baaa;
  cursor: pointer;
  white-space: nowrap;
}

.blog-menu {
  flex: 1;
  border: none !important;
}

.site-info {
  text-align: center;
}

.site-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #16baaa;
  color: #fff;
  font-size: 24px;
}

.site-info h3 {
  margin: 12px 0 4px;
}

.site-info p {
  margin: 0;
  color: #666;
  font-size: 13px;
}

.site-desc {
  margin-top: 8px !important;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  text-align: center;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #16baaa;
}

.stat-label {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.announcement-item {
  padding: 8px 0;
  font-size: 13px;
  color: #666;
  border-bottom: 1px dashed #eee;
}

.announcement-item:last-child {
  border-bottom: none;
}

.category-list {
  display: flex;
  flex-wrap: wrap;
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  margin: -4px;
}

.article-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recent-article {
  cursor: pointer;
}

.recent-title {
  font-size: 14px;
  color: #333;
  line-height: 1.4;
}

.recent-title:hover {
  color: #16baaa;
}

.recent-meta {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.blog-footer {
  background: #fff;
  text-align: center;
  padding: 24px 16px;
  color: #999;
  font-size: 13px;
  margin-top: auto;
}
</style>
