<script setup lang="ts">
import { ref } from 'vue'
import api from '@/utils/api'

const email = ref('')
const loading = ref(false)
const result = ref<{ type: 'success' | 'info' | 'error'; message: string } | null>(null)
const confirmUrl = ref('')

async function handleSubmit() {
  if (!email.value.trim()) {
    result.value = { type: 'error', message: '请输入邮箱地址' }
    return
  }
  loading.value = true
  result.value = null
  try {
    const res = await api.post('/subscribers/subscribe', { email: email.value.trim() })
    const data = res.data?.data || res.data
    const msg = res.data?.message || '订阅请求已提交'
    result.value = { type: 'success', message: msg }
    if (data?.confirmUrl) {
      confirmUrl.value = data.confirmUrl
    }
    email.value = ''
  } catch (err: any) {
    result.value = {
      type: 'error',
      message: err?.response?.data?.message || '订阅失败，请稍后重试'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="subscribe-form">
    <div class="flex gap-2">
      <input
        v-model="email"
        type="email"
        placeholder="输入邮箱订阅更新"
        class="flex-1 px-3 py-2 rounded-lg text-sm outline-none transition-colors"
        style="background-color: var(--color-card); color: var(--color-text); border: 1px solid var(--color-border)"
        @keydown.enter="handleSubmit"
        :disabled="loading"
      />
      <button
        @click="handleSubmit"
        :disabled="loading"
        class="px-4 py-2 rounded-lg text-sm font-medium text-white border-0 cursor-pointer transition-all duration-200 hover:opacity-90 disabled:opacity-50"
        style="background: var(--gradient-primary)"
      >
        {{ loading ? '...' : '订阅' }}
      </button>
    </div>
    <Transition name="fade">
      <div v-if="result" class="mt-2 text-xs" :style="{ color: result.type === 'error' ? '#ef4444' : 'var(--color-primary)' }">
        {{ result.message }}
        <a
          v-if="confirmUrl"
          :href="confirmUrl"
          target="_blank"
          class="ml-1 underline"
        >点击确认订阅</a>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
