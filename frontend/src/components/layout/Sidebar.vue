<script setup lang="ts">
import {onMounted, ref, computed} from 'vue'
import {useRouter} from 'vue-router'
import api from '@/utils/api'
import {GithubOutlined,FileTextOutlined} from '@ant-design/icons-vue'
import TagCloud from "@/components/common/TagCloud.vue";
import {useSiteStore} from '@/stores/site'

const router = useRouter()
const siteStore = useSiteStore()
const siteInfo = computed(() => siteStore.info)

interface Category {
  id: number
  name: string
  slug: string
  article_count?: number
}

interface Tag {
  id: number
  name: string
  slug: string
  article_count?: number
}

interface Article {
  id: number
  title: string
  slug: string
  created_at: string
}

interface Announcement {
  id: number
  content: string
}

const stats = ref({articles: 0, tags: 0, categories: 0})
const categories = ref<Category[]>([])
const tags = ref<Tag[]>([])
const recentPosts = ref<Article[]>([])
const announcement = ref<Announcement | null>(null)

onMounted(async () => {
  // 确保站点信息已加载（logo、名称、作者等）
  siteStore.ensureLoaded()

  try {
    const [statsRes, hotCatRes, hotTagRes, postsRes, announceRes] = await Promise.all([
      api.get('/admin/stats').catch(() => null),
      // 热门分类/标签：结合 Redis 动态计算（按已发布文章数降序）
      api.get('/categories/hot', {params: {limit: 10}}).catch(() => null),
      api.get('/tags/hot', {params: {limit: 20}}).catch(() => null),
      api.get('/articles', {params: {pageSize: 5}}).catch(() => null),
      api.get('/announcements/latest').catch(() => null),
    ])

    if (statsRes) {
      const d = statsRes.data.data || statsRes.data
      stats.value = {
        articles: d.totalArticles || d.articleCount || 0,
        tags: d.totalTags || d.tagCount || 0,
        categories: d.totalCategories || d.categoryCount || 0,
      }
    }
    if (hotCatRes) {
      const d = hotCatRes.data.data || hotCatRes.data
      categories.value = (Array.isArray(d) ? d : (d.list || [])).slice(0, 10)
    }
    if (hotTagRes) {
      const d = hotTagRes.data.data || hotTagRes.data
      tags.value = (Array.isArray(d) ? d : (d.list || [])).slice(0, 20)
    }
    if (postsRes) {
      const d = postsRes.data.data || postsRes.data
      recentPosts.value = (d.list || d.rows || []).slice(0, 5)
    }
    if (announceRes) {
      const d = announceRes.data.data || announceRes.data
      announcement.value = d
    }
  } catch {
    // silent
  }
})

function navigateTo(path: string) {
  router.push(path)
}
</script>

<template>
  <aside class="sidebar py-6 flex flex-col gap-5">
    <!--  头像与信息 -->
    <div class="flex mt-5 flex-col items-center">
      <div
          class="w-20 h-20 rounded-full flex items-center justify-center mb-3 transition-transform duration-300 hover:scale-105 overflow-hidden"
          style="background: var(--gradient-primary); box-shadow: var(--shadow-md)"
      >
        <img
            v-if="siteInfo?.author_avatar"
            :src="siteInfo.author_avatar"
            :alt="siteInfo?.author_name || 'avatar'"
            class="w-full h-full object-cover"
        />
        <svg v-else class="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="1.5">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
      <h2 class="text-base font-bold tracking-tight" style="color: var(--color-text)">
        {{ siteInfo?.author_name || 'Linzy' }}
      </h2>
      <p class="text-xs mt-0.5 font-medium" style="color: var(--color-primary)">
        {{ siteInfo?.author_bio || 'Backend Developer' }}
      </p>
    </div>

    <!--  统计信息 -->
    <div class="flex mt-2 justify-center gap-3 text-center">
      <button @click="navigateTo('/')" class="flex flex-col items-center group cursor-pointer bg-transparent border-0">
        <span class="text-lg font-bold group-hover:text-primary transition-colors"
              style="color: var(--color-text)">{{ stats.articles }}</span>
        <span class="text-xs font-medium mt-0.5 transition-colors group-hover:text-primary"
              style="color: var(--color-text-secondary)">文章</span>
      </button>
      <div class="w-px h-8 self-center" style="background-color: var(--color-border)"/>
      <button @click="navigateTo('/categories')"
              class="flex flex-col items-center group cursor-pointer bg-transparent border-0">
        <span class="text-lg font-bold group-hover:text-primary transition-colors"
              style="color: var(--color-text)">{{ stats.categories }}</span>
        <span class="text-xs font-medium mt-0.5 transition-colors group-hover:text-primary"
              style="color: var(--color-text-secondary)">分类</span>
      </button>
      <div class="w-px h-8 self-center" style="background-color: var(--color-border)"/>
      <button @click="navigateTo('/tags')"
              class="flex flex-col items-center group cursor-pointer bg-transparent border-0">
        <span class="text-lg font-bold group-hover:text-primary transition-colors"
              style="color: var(--color-text)">{{ stats.tags }}</span>
        <span class="text-xs font-medium mt-0.5 transition-colors group-hover:text-primary"
              style="color: var(--color-text-secondary)">标签</span>
      </button>
    </div>

    <!--  社交链接 -->
    <div class="flex mt-3 justify-center gap-2">
      <a href="https://github.com/maxinjian123" target="_blank"
         class="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 hover:-translate-y-0.5"
         style="border: 1px solid var(--color-border); color: var(--color-text-secondary)" title="GitHub">
        <GithubOutlined/>
      </a>
    </div>

    <!-- 公告 -->
    <div class="rounded-sm p-3.5 mt-3 text-sm leading-relaxed"
         style="background-color: var(--color-primary-light); border-left: 3px solid var(--color-primary)">
      <div class="flex items-center gap-1.5 mb-1.5">
        <FileTextOutlined style="color: #1a6da8"/>
        <span class="text-xs font-semibold" style="color: var(--color-primary)">公告</span>
      </div>
      <p style="color: var(--color-text-secondary)">{{ announcement?.content || '欢迎来到我的博客 🚀' }}</p>
    </div>

    <!-- Categories -->
    <div v-if="categories.length" class="card-elevated mt-3 p-4 rounded-sm!">
      <h3 class="text-xs font-semibold uppercase tracking-wider mb-3" style="color: var(--color-text)"><span
          style="color: var(--color-primary)">#</span> 分类</h3>
      <ul class="space-y-0.5">
        <li v-for="cat in categories" :key="cat.id">
          <router-link :to="`/category/${cat.id}/${cat.name}`"
                       class="flex justify-between items-center text-sm py-1.5 px-2.5 rounded-lg transition-all duration-200 hover:translate-x-1"
                       style="color: var(--color-text-secondary)">
            <span class="truncate">{{ cat.name }}</span>
            <svg class="w-3.5 h-3.5 shrink-0 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </router-link>
        </li>
      </ul>
    </div>

    <!-- Tags -->
    <div v-if="tags.length" class="card-elevated p-4 mt-3 rounded-sm!">
      <h3 class="text-xs font-semibold uppercase tracking-wider mb-3" style="color: var(--color-text)"><span
          style="color: var(--color-primary)">#</span> 标签</h3>
      <div class="flex flex-wrap gap-1.5">
        <router-link v-for="tag in tags" :key="tag.id" :to="`/tag/${tag.id}/${tag.name}`"
                     class="text-xs px-2.5 py-1 rounded-md transition-all duration-200 hover:-translate-y-0.5"
                     style="background-color: var(--color-hover); color: var(--color-text-secondary)">
          {{ tag.name }}
        </router-link>
<!--      <TagCloud :tags="tags"/>-->

      </div>
    </div>

    <!-- Recent Posts -->
    <div v-if="recentPosts.length" class="card-elevated p-4 mt-3 rounded-sm!">
      <h3 class="text-xs font-semibold uppercase tracking-wider mb-3" style="color: var(--color-text)"><span
          style="color: var(--color-primary)">#</span> 最新文章</h3>
      <ul class="space-y-2">
        <li v-for="post in recentPosts" :key="post.id">
          <router-link :to="`/article/${post.id}`"
                       class="flex items-start gap-2 text-sm transition-all duration-200 hover:translate-x-1 group"
                       style="color: var(--color-text-secondary)">
            <span class="text-xs mt-0.5 shrink-0 transition-colors group-hover:text-primary"
                  style="color: var(--color-primary)">◆</span>
            <span class="line-clamp-2 leading-snug group-hover:text-primary transition-colors">{{ post.title }}</span>
          </router-link>
        </li>
      </ul>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  position: sticky;
  top: 3.5rem;
  overflow-y: auto;
}

.sidebar::-webkit-scrollbar {
  width: 4px;
}

.sidebar::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 2px;
}
</style>