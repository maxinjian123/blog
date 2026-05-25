<script setup lang="ts">
import {onMounted, onUnmounted, ref} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {useThemeStore} from '@/stores/theme'
import Sidebar from '@/components/layout/Sidebar.vue'
import {CloseOutlined, MenuOutlined} from '@ant-design/icons-vue'

const router = useRouter()
const route = useRoute()
const themeStore = useThemeStore()

const isMobileMenuOpen = ref(false)
const isScrolled = ref(false)
const scrollProgress = ref(0)

const navLinks = [
  {
    to: '/',
    label: '首页',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
  },
  {
    to: '/categories',
    label: '分类',
    icon: 'M3 9a2 2 0 012-2h1.16a2 2 0 012.592.592l.316.316A2 2 0 0114.84 9H19a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V9z'
  },
  {
    to: '/tags',
    label: '标签',
    icon: 'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z M7 7h.01'
  },
  {
    to: '/archive',
    label: '归档',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
  },
  {to: '/search', label: '搜索', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'},
  {to: '/about', label: '关于', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'},
]

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
  document.body.style.overflow = isMobileMenuOpen.value ? 'hidden' : ''
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false
  document.body.style.overflow = ''
}

function navigateTo(path: string) {
  closeMobileMenu()
  router.push(path)
}

function handleScroll() {
  isScrolled.value = window.scrollY > 10
  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
  scrollProgress.value = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, {passive: true})
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  document.body.style.overflow = ''
})
</script>

<template>
  <nav
      class="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      :class="(isScrolled || isMobileMenuOpen) ? 'glass shadow-sm' : ''"
      style="border-bottom: 1px solid var(--color-border)"
  >
    <div
        class="absolute bottom-0 left-0 h-0.5 transition-all duration-150 rounded-r-full"
        :style="{ width: scrollProgress + '%', background: 'var(--gradient-primary)' }"
    />

    <div class="h-14 md:h-16 max-w-6xl mx-auto px-4 flex items-center justify-between">
      <router-link
          to="/"
          class="flex items-center gap-2.5 no-underline group"
          @click="closeMobileMenu"
      >
        <div
            class="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:shadow-md"
            style="background: var(--gradient-primary)"
        >

          <svg class="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
        </div>
        <span class="text-lg font-bold tracking-tight" style="color: var(--color-text)">
          Linzy<span class="text-gradient">Blog</span>
        </span>
      </router-link>

      <div class="hidden md:flex items-center gap-1">
        <button
            v-for="link in navLinks"
            :key="link.to"
            @click="navigateTo(link.to)"
            class="relative px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer border-0 bg-transparent"
            :style="{
            color: isActive(link.to) ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            backgroundColor: isActive(link.to) ? 'var(--color-primary-light)' : 'transparent',
          }"
        >
          {{ link.label }}
          <span
              v-if="isActive(link.to)"
              class="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
              style="background: var(--gradient-primary)"
          />
        </button>

        <div class="w-px h-5 mx-1.5" style="background-color: var(--color-border)"/>

        <button
            class="w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200 cursor-pointer border bg-transparent hover:shadow-sm"
            :style="{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }"
            @click="themeStore.toggleTheme()"
            :title="themeStore.isDark ? '切换浅色模式' : '切换深色模式'"
        >
          <svg v-if="themeStore.isDark" class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
          <svg v-else class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </button>
      </div>

      <div class="flex md:hidden items-center gap-1.5">
        <button
            class="w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200 cursor-pointer border bg-transparent"
            :style="{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }"
            @click="themeStore.toggleTheme()"
        >

          <svg v-if="themeStore.isDark" class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
          <svg v-else class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </button>
        <button
            class="w-9 h-9 flex items-center justify-center rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
            @click="toggleMobileMenu"
            style="color: var(--color-text)"
        >
          <MenuOutlined v-if="!isMobileMenuOpen" class="w-5 h-5"/>
          <CloseOutlined v-else class="w-5 h-5"/>
        </button>
      </div>
    </div>

  </nav>

  <Teleport to="body">
    <Transition name="mobile-menu">
      <div
          v-if="isMobileMenuOpen"
          class="md:hidden fixed top-0 left-0 right-0 bottom-0 overflow-y-auto"
          style="z-index: 9999; background-color: var(--color-bg); padding-top: 64px"
      >
        <!-- Close button (replaces hamburger) -->
        <div class="fixed top-3 right-4 z-[10000]">
          <button
              class="w-9 h-9 flex items-center justify-center rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
              @click="toggleMobileMenu"
              style="color: var(--color-text)"
          >
            <CloseOutlined class="w-5 h-5"/>
          </button>
        </div>

        <div class="px-4 py-3 border-b" style="border-color: var(--color-border)">
          <button
              v-for="link in navLinks"
              :key="link.to"
              @click="navigateTo(link.to)"
              class="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer border-0 bg-transparent my-0.5"
              :style="{
              color: isActive(link.to) ? 'var(--color-primary)' : 'var(--color-text)',
              backgroundColor: isActive(link.to) ? 'var(--color-primary-light)' : 'transparent',
            }"
          >
            <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
              <path :d="link.icon"/>
            </svg>
            {{ link.label }}
          </button>
        </div>
        <div class="px-4 py-2">
          <Sidebar/>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.mobile-menu-enter-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.mobile-menu-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.mobile-menu-enter-from {
  opacity: 0;
  transform: translateY(-12px);
}

.mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>