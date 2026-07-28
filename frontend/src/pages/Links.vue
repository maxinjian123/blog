<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/utils/api'

interface Link {
  id: string
  name: string
  url: string
  description: string | null
  avatar: string | null
  category: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

const links = ref<Link[]>([])
const loading = ref(false)
const activeCategory = ref<string>('全部')

const categories = computed(() => {
  const set = new Set<string>()
  links.value.forEach(l => {
    if (l.category) set.add(l.category)
  })
  return ['全部', ...Array.from(set)]
})

const filteredLinks = computed(() => {
  if (activeCategory.value === '全部') return links.value
  return links.value.filter(l => l.category === activeCategory.value)
})

onMounted(async () => {
  loading.value = true
  try {
    const res = await api.get('/links')
    const data = res.data.data || res.data
    links.value = Array.isArray(data) ? data : []
  } catch {
    links.value = []
  } finally {
    loading.value = false
  }
})

function getInitial(name: string): string {
  return name?.charAt(0)?.toUpperCase() || '?'
}

function avatarColor(name: string): string {
  const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
  ]
  let hash = 0
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}
</script>

<template>
  <div class="links-page mt-5">
    <!-- Page Header -->
    <div class="flex items-center gap-3 mb-8 pt-2">
      <div class="w-1 h-6 rounded-full" style="background: var(--gradient-primary)" />
      <h1 class="text-xl font-bold tracking-tight" style="color: var(--color-text)">友情链接</h1>
      <span v-if="!loading" class="text-sm font-medium px-2.5 py-0.5 rounded-full" style="background-color: var(--color-primary-light); color: var(--color-primary)">
        {{ links.length }} 个
      </span>
    </div>

    <!-- Intro -->
    <div class="rounded-xl p-5 mb-6 text-sm leading-relaxed"
         style="background-color: var(--color-card); border: 1px solid var(--color-border); box-shadow: var(--shadow-sm)">
      <p style="color: var(--color-text-secondary)">
        以下是与本站交流互助的伙伴站点，按分类整理。如需申请友链，请通过关于页面的联系方式与站长联系。
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-20">
      <div class="w-10 h-10 border-2 rounded-full animate-spin"
           style="border-color: var(--color-primary); border-top-color: transparent" />
    </div>

    <!-- Empty -->
    <div v-else-if="links.length === 0" class="text-center py-20">
      <svg class="w-20 h-20 mx-auto mb-4 opacity-15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="1" style="color: var(--color-primary)">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
      <p class="text-lg font-medium" style="color: var(--color-text)">暂无友链</p>
    </div>

    <template v-else>
      <!-- Category Filter -->
      <div v-if="categories.length > 2" class="flex flex-wrap gap-2 mb-6">
        <button
          v-for="cat in categories"
          :key="cat"
          @click="activeCategory = cat"
          class="px-3.5 py-1.5 text-xs font-medium rounded-full transition-all duration-200 cursor-pointer border"
          :style="activeCategory === cat
            ? 'background: var(--gradient-primary); color: #fff; border-color: transparent'
            : 'background-color: var(--color-card); color: var(--color-text-secondary); border-color: var(--color-border)'"
        >
          {{ cat }}
        </button>
      </div>

      <!-- Links Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
        <a
          v-for="link in filteredLinks"
          :key="link.id"
          :href="link.url"
          target="_blank"
          rel="noopener noreferrer"
          class="link-card group no-underline rounded-xl p-5 transition-all duration-300 hover:-translate-y-1"
          style="background-color: var(--color-card); border: 1px solid var(--color-border); box-shadow: var(--shadow-sm)"
        >
          <div class="flex items-start gap-3.5">
            <!-- Avatar -->
            <div
              class="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0 overflow-hidden transition-transform duration-300 group-hover:scale-110"
              :style="{ background: link.avatar ? 'transparent' : avatarColor(link.name) }"
            >
              <img
                v-if="link.avatar"
                :src="link.avatar"
                :alt="link.name"
                class="w-full h-full object-cover"
                @error="($event.target as HTMLImageElement).style.display = 'none'"
              />
              <span v-else>{{ getInitial(link.name) }}</span>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h3 class="text-base font-semibold truncate transition-colors"
                    style="color: var(--color-text)">
                  {{ link.name }}
                </h3>
                <svg class="w-3.5 h-3.5 opacity-30 group-hover:opacity-100 transition-opacity shrink-0"
                     style="color: var(--color-primary)"
                     viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M7 17l9.2-9.2M17 17V7H7"/>
                </svg>
              </div>
              <p v-if="link.description" class="text-xs leading-relaxed line-clamp-2"
                 style="color: var(--color-text-secondary)">
                {{ link.description }}
              </p>
              <p v-else class="text-xs italic" style="color: var(--color-text-secondary)">
                暂无描述
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div class="mt-4 pt-3 flex items-center justify-between text-xs"
               style="border-top: 1px solid var(--color-border)">
            <span v-if="link.category" class="px-2 py-0.5 rounded-full"
                  style="background-color: var(--color-primary-light); color: var(--color-primary)">
              {{ link.category }}
            </span>
            <span v-else></span>
            <span class="flex items-center gap-1" style="color: var(--color-text-secondary)">
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              {{ new Date(link.created_at).toLocaleDateString('zh-CN') }}
            </span>
          </div>
        </a>
      </div>
    </template>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.link-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}
</style>
