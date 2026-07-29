<script setup lang="ts">
import Footer from '@/components/layout/Footer.vue'
import NavBar from '@/components/layout/NavBar.vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import { useThemeStore } from '@/stores/theme'
import { useSiteStore } from '@/stores/site'
import { useHead, useSeoMeta } from '@unhead/vue'
import { computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

const themeStore = useThemeStore()
const siteStore = useSiteStore()
const route = useRoute()

const bgDecorStyle = computed(() => ({
  background: `radial-gradient(ellipse 60% 50% at 50% 0%, var(--color-primary) 0%, transparent 100%)`
}))

// 站点名称动态注入标题模板，logo 动态注入 favicon
const siteName = computed(() => siteStore.info.site_name || 'Blog')
const siteLogo = computed(() => siteStore.info.site_logo || '/logo.svg')

useSeoMeta({
  titleTemplate: () => `%s - ${siteName.value}`,
  description: () => siteStore.info.site_description || '一个基于 Vue3 的博客系统',
})

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
    { name: 'author', content: () => siteStore.info.author_name || 'Blog' },
    { name: 'robots', content: 'index, follow' },
  ],
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: () => siteLogo.value },
  ],
})

watch(
  () => route.path,
  () => {
    document.documentElement.lang = 'zh-CN'
  },
  { immediate: true }
)

onMounted(() => {
  themeStore.initTheme()
  siteStore.ensureLoaded()
})
</script>

<template>
  <div class="min-h-screen flex flex-col relative" :data-theme="themeStore.theme" style="background-color: var(--color-bg)">
    <div class="fixed top-0 left-0 right-0 h-64 pointer-events-none z-0 opacity-[0.03]" :style="bgDecorStyle"></div>

    <NavBar />
    <div class="flex-1 flex justify-center relative z-1">
      <div class="w-full flex gap-6 px-0 md:px-4 pt-14 md:pt-16" :class="route.name === 'Article' ? 'max-w-[1450px]' : 'max-w-7xl'">
        <main class="flex-1 min-w-0 pb-8" :class="route.name === 'Article' ? 'min-w-0 px-0' : 'md:pl-6 md:pr-0 px-4'">
          <router-view v-slot="{ Component, route }">
            <transition name="page-fade" mode="out-in">
              <component :is="Component" :key="route.path" />
            </transition>
          </router-view>
        </main>
        <Sidebar v-if="route.name !== 'Article'" class="hidden md:block w-64 lg:w-72 shrink-0" />
      </div>
    </div>
    <Footer />
  </div>
</template>

<style scoped>
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.2s ease;
}
.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}
</style>
