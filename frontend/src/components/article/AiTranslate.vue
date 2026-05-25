<script setup lang="ts">
import {ref} from 'vue'

const props = defineProps<{
  articleContent: string
}>()

const isTranslating = ref(false)
const translatedText = ref('')
const showTranslation = ref(false)
const error = ref('')

async function toggleTranslation() {
  if (showTranslation.value) {
    showTranslation.value = false
    return
  }

  if (translatedText.value) {
    showTranslation.value = true
    return
  }

  if (!props.articleContent) return

  isTranslating.value = true
  error.value = ''
  showTranslation.value = false

  try {
    // const res = await api.post('/ai/translate', {
    //   content: props.articleContent,
    //   targetLang: 'en',
    // })
    // const payload = res.data
    // const data = payload.data || payload
    // translatedText.value = data.translated || data.content || data.text || ''
    alert('翻译暂不可用')
    showTranslation.value = true
  } catch {
    error.value = '翻译服务暂时不可用，请稍后再试。'
  } finally {
    isTranslating.value = false
  }
}

function retry() {
  error.value = ''
  translatedText.value = ''
  toggleTranslation()
}
</script>

<template>
  <div v-if="articleContent" class="ai-translate mt-4 rounded-lg overflow-hidden"
       style="border: 1px solid var(--color-border); background-color: var(--color-card)">
    <div class="px-4 py-3">
      <button
          @click="toggleTranslation"
          :disabled="isTranslating"
          class="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg border-0 cursor-pointer transition-colors disabled:opacity-50"
          :class="showTranslation ? '' : ''"
          :style="{ backgroundColor: showTranslation ? 'var(--color-primary-light)' : 'var(--color-hover)', color: showTranslation ? 'var(--color-primary)' : 'var(--color-text-secondary)' }"
      >
        <svg v-if="!isTranslating" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2">
          <path d="M5 8l6 6"/>
          <path d="M4 14l6-6 2-3"/>
          <path d="M2 5h12"/>
          <path d="M7 2h1"/>
          <path d="M22 22l-5-10-5 10"/>
          <path d="M14 18h6"/>
        </svg>
        <span v-if="isTranslating"
              class="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
        <span>{{ isTranslating ? '翻译中...' : (showTranslation ? '查看原文' : '翻译为英文') }}</span>
      </button>
    </div>

    <Transition name="translate">
      <div v-if="showTranslation && translatedText" class="border-t" style="border-color: var(--color-border)">
        <div class="flex items-center justify-between px-4 py-2" style="background-color: var(--color-hover)">
          <div class="flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
            <span class="text-xs tracking-wider" style="color: var(--color-text-secondary)">AI TRANSLATION</span>
          </div>
          <button @click="showTranslation = false"
                  class="w-6 h-6 flex items-center justify-center rounded border-0 bg-transparent cursor-pointer hover:bg-primary/10 transition-colors"
                  style="color: var(--color-text-secondary)">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="18 15 12 9 6 15"/>
            </svg>
          </button>
        </div>
        <div class="p-4 text-sm leading-relaxed translate-result" v-html="translatedText"
             style="color: var(--color-text-secondary)"></div>
      </div>
    </Transition>

    <Transition name="translate-error">
      <div v-if="error && !isTranslating" class="flex items-center justify-between px-4 py-2 border-t"
           style="border-color: var(--color-border); background-color: var(--color-hover)">
        <p class="text-xs" style="color: var(--color-text-secondary)">{{ error }}</p>
        <button @click="retry" class="px-3 py-1 text-xs rounded border-0 cursor-pointer transition-colors"
                style="background-color: var(--color-primary); color: #fff">重试
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.translate-enter-active,
.translate-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.translate-enter-from,
.translate-leave-to {
  max-height: 0;
  opacity: 0;
}

.translate-enter-to,
.translate-leave-from {
  max-height: 6000px;
  opacity: 1;
}

.translate-error-enter-active,
.translate-error-leave-active {
  transition: all 0.25s ease;
}

.translate-error-enter-from,
.translate-error-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.translate-result :deep(h1),
.translate-result :deep(h2),
.translate-result :deep(h3) {
  color: var(--color-text);
  margin: 1.2em 0 0.5em;
}

.translate-result :deep(p) {
  margin-bottom: 1em;
}

.translate-result :deep(pre) {
  background-color: var(--color-bg);
  padding: 12px;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  overflow-x: auto;
  font-size: 0.85rem;
  margin: 1em 0;
}

.translate-result :deep(code) {
  background-color: var(--color-hover);
  padding: 0.15em 0.4em;
  border-radius: 3px;
  font-size: 0.88em;
  color: var(--color-primary);
}
</style>