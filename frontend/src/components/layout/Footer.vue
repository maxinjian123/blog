<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="text-center py-8 text-sm relative" style="color: var(--color-text-secondary)">
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-0.5 rounded-full" style="background: var(--gradient-primary); opacity: 0.6" />
    <div class="flex items-center justify-center gap-2 mb-3 mt-1">
      <div
        class="w-6 h-6 rounded-md flex items-center justify-center"
        style="background: var(--gradient-primary)"
      >
        <svg class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      </div>
      <span class="font-bold tracking-tight" style="color: var(--color-text)">LinzyBlog</span>
    </div>
    <div class="flex justify-center gap-5 mb-3">
      <router-link to="/" class="hover:text-primary transition-colors text-xs font-medium">首页</router-link>
      <router-link to="/archive" class="hover:text-primary transition-colors text-xs font-medium">归档</router-link>
      <router-link to="/categories" class="hover:text-primary transition-colors text-xs font-medium">分类</router-link>
      <router-link to="/search" class="hover:text-primary transition-colors text-xs font-medium">搜索</router-link>
      <router-link to="/about" class="hover:text-primary transition-colors text-xs font-medium">关于</router-link>
    </div>
    <p class="text-xs opacity-60">&copy; {{ currentYear }} LinzyBlog. Powered by Vue 3 + Tailwind CSS</p>
  </footer>
</template>