<script setup lang="ts">
import { computed } from 'vue'
import SubscribeForm from './SubscribeForm.vue'
import { useSiteStore } from '@/stores/site'

const currentYear = new Date().getFullYear()
const siteStore = useSiteStore()
const siteName = computed(() => siteStore.info.site_name || 'Blog')
const siteLogo = computed(() => siteStore.info.site_logo || '')
</script>

<template>
  <footer class="text-center py-8 text-sm relative" style="color: var(--color-text-secondary)">
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-0.5 rounded-full" style="background: var(--gradient-primary); opacity: 0.6" />
    <div class="flex items-center justify-center gap-2 mb-3 mt-1">
      <div
        class="w-6 h-6 rounded-md flex items-center justify-center overflow-hidden"
        style="background: var(--gradient-primary)"
      >
        <img v-if="siteLogo" :src="siteLogo" alt="logo" class="w-full h-full object-cover" />
        <svg v-else class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      </div>
      <span class="font-bold tracking-tight" style="color: var(--color-text)">{{ siteName }}</span>
    </div>
    <!-- P6-6: 邮件订阅 -->
    <div class="max-w-md mx-auto mb-4 px-4">
      <p class="text-xs mb-2" style="color: var(--color-text-secondary)">订阅博客更新，第一时间收到新文章通知</p>
      <SubscribeForm />
    </div>
    <div class="flex justify-center gap-5 mb-3">
      <router-link to="/" class="hover:text-primary transition-colors text-xs font-medium">首页</router-link>
      <router-link to="/archive" class="hover:text-primary transition-colors text-xs font-medium">归档</router-link>
      <router-link to="/categories" class="hover:text-primary transition-colors text-xs font-medium">分类</router-link>
      <router-link to="/search" class="hover:text-primary transition-colors text-xs font-medium">搜索</router-link>
      <router-link to="/links" class="hover:text-primary transition-colors text-xs font-medium">友链</router-link>
      <router-link to="/about" class="hover:text-primary transition-colors text-xs font-medium">关于</router-link>
      <a href="/api/v1/rss" target="_blank" class="hover:text-primary transition-colors text-xs font-medium inline-flex items-center gap-1" title="RSS 订阅">
        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20A2.18 2.18 0 0 1 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1Z"/></svg>
        RSS
      </a>
    </div>
    <p class="text-xs opacity-60">&copy; {{ currentYear }} {{ siteName }}. Powered by Vue 3 + Tailwind CSS</p>
  </footer>
</template>