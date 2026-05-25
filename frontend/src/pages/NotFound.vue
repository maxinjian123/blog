<script setup lang="ts">
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-[60vh] text-center">
    <div class="relative mb-6">
      <span class="text-[140px] md:text-[180px] font-black leading-none opacity-[0.04] select-none" style="color: var(--color-primary)">404</span>
      <h1 class="absolute inset-0 flex items-center justify-center text-5xl md:text-7xl font-black tracking-tight" style="color: var(--color-primary)">404</h1>
    </div>
    <h2 class="text-xl font-bold mb-2" style="color: var(--color-text)">页面未找到</h2>
    <p class="text-sm mb-8 max-w-xs" style="color: var(--color-text-secondary)">
      你正在寻找的页面可能已被移除或不存在
    </p>
    <router-link
      to="/"
      class="px-6 py-2.5 rounded-xl text-sm font-medium text-white no-underline transition-all duration-200 hover:shadow-md inline-flex items-center gap-2"
      style="background: var(--gradient-primary)"
    >
      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1"/></svg>
      返回首页
    </router-link>
  </div>
</template>