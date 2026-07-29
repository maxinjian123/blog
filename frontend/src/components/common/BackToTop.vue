<script setup lang="ts">
/**
 * 通用回到顶部按钮
 * - 自管理滚动监听、显隐控制
 * - 通过 props 调整阈值、位置、尺寸，适配不同页面
 * - 适配深/浅色主题（继承 CSS 变量）
 */
import {onBeforeUnmount, onMounted, ref} from 'vue'

interface Props {
  /** 滚动距离超过该值时显示按钮（px） */
  threshold?: number
  /** 距离右边的偏移（Tailwind 类或 CSS 长度） */
  right?: string
  /** 距离底部的偏移（Tailwind 类或 CSS 长度） */
  bottom?: string
  /** 按钮尺寸（px） */
  size?: number
  /** 提示文字 */
  title?: string
  /** z-index */
  zIndex?: number
}

const props = withDefaults(defineProps<Props>(), {
  threshold: 300,
  right: '1.5rem',
  bottom: '6rem',
  size: 44,
  title: '回到顶部',
  zIndex: 50
})

const visible = ref(false)

function handleScroll() {
  visible.value = window.scrollY > props.threshold
}

function scrollToTop() {
  window.scrollTo({top: 0, behavior: 'smooth'})
}

onMounted(() => {
  // 初始判断一次（页面刷新时已滚动）
  handleScroll()
  window.addEventListener('scroll', handleScroll, {passive: true})
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <Transition name="back-to-top-fade">
    <button
        v-if="visible"
        class="back-to-top"
        :title="title"
        :style="{
        right,
        bottom,
        width: size + 'px',
        height: size + 'px',
        zIndex
      }"
        @click="scrollToTop"
    >
      <svg
          class="back-to-top-icon"
          :width="Math.round(size || 44 * 0.45)"
          :height="Math.round(size || 44 * 0.45)"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          viewBox="0 0 24 24"
      >
        <polyline points="18 15 12 9 6 15"/>
      </svg>
    </button>
  </Transition>
</template>

<style scoped>
.back-to-top {
  position: fixed;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 9999px;
  cursor: pointer;
  background: var(--gradient-primary, linear-gradient(135deg, #49b1f5, #7dd3fc));
  color: #fff;
  box-shadow: 0 4px 16px rgba(73, 177, 245, 0.35);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.back-to-top:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(73, 177, 245, 0.45);
}

.back-to-top-icon {
  display: block;
}

/* 显隐过渡 */
.back-to-top-fade-enter-active,
.back-to-top-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.back-to-top-fade-enter-from,
.back-to-top-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
