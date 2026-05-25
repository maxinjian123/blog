<script setup lang="ts">
import AiChatWidget from '@/components/ai/AiChatWidget.vue'
import Footer from '@/components/layout/Footer.vue'
import NavBar from '@/components/layout/NavBar.vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import { useThemeStore } from '@/stores/theme'
import { useHead, useSeoMeta } from '@unhead/vue'
import { computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

const themeStore = useThemeStore()
const route = useRoute()

const bgDecorStyle = computed(() => ({
  background: `radial-gradient(ellipse 60% 50% at 50% 0%, var(--color-primary) 0%, transparent 100%)`
}))

useSeoMeta({
  titleTemplate: '%s - TechMind Blog',
  description: '一个基于 Vue3 的博客系统',
})

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
    { name: 'author', content: 'TechMind' },
    { name: 'robots', content: 'index, follow' },
  ],
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/vite.svg' },
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
})
</script>

<template>
  <div class="min-h-screen flex flex-col relative" :data-theme="themeStore.theme" style="background-color: var(--color-bg)">
    <div class="fixed top-0 left-0 right-0 h-64 pointer-events-none z-0 opacity-[0.03]" :style="bgDecorStyle"></div>

    <NavBar />
    <div class="flex-1 flex justify-center relative z-1">
      <div class="w-full max-w-6xl flex gap-5 px-0 md:px-4 pt-14 md:pt-16">
        <main class="flex-1 min-w-0 md:pl-6 md:pr-0 px-4 pb-8">
          <router-view v-slot="{ Component, route }">
            <transition name="page-fade" mode="out-in">
              <component :is="Component" :key="route.path" />
            </transition>
          </router-view>
        </main>
        <Sidebar class="hidden md:block w-64 lg:w-72 shrink-0" />
      </div>
    </div>
    <Footer />
    <AiChatWidget />
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
