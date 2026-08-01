<script setup lang="ts">
import { computed } from 'vue'
import type { MusicItem } from '@/stores/music'

const props = defineProps<{
  visible: boolean
  playlist: MusicItem[]
  currentIndex: number
  playlistName: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'play', index: number): void
  (e: 'remove', index: number): void
}>()

const list = computed(() => props.playlist)
</script>

<template>
  <Teleport to="body">
    <Transition name="mp-drawer-fade">
      <div
        v-if="visible"
        class="mp-mask"
        @click.self="emit('close')"
      >
        <Transition name="mp-drawer-slide" appear>
          <div v-if="visible" class="mp-drawer">
            <header class="mp-drawer-header">
              <div class="mp-drawer-title">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
                <span class="mp-drawer-name">{{ playlistName || '播放列表' }}</span>
                <span class="mp-drawer-count">{{ list.length }} 首</span>
              </div>
              <button class="mp-close" title="关闭" @click="emit('close')">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </header>

            <div class="mp-drawer-body">
              <div v-if="list.length === 0" class="mp-empty">列表为空</div>
              <ul v-else class="mp-list">
                <li
                  v-for="(song, idx) in list"
                  :key="song.id + '-' + idx"
                  class="mp-item"
                  :class="{ 'mp-item-active': idx === currentIndex }"
                  @dblclick="emit('play', idx)"
                >
                  <div class="mp-item-index" :class="{ 'mp-playing': idx === currentIndex }">
                    <svg v-if="idx === currentIndex" class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    <span v-else>{{ idx + 1 }}</span>
                  </div>
                  <div class="mp-item-info">
                    <div class="mp-item-name">{{ song.name }}</div>
                    <div class="mp-item-meta">{{ song.singer }}{{ song.album ? ' · ' + song.album : '' }}</div>
                  </div>
                  <button
                    class="mp-item-remove"
                    title="移除"
                    @click.stop="emit('remove', idx)"
                  >
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.mp-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  z-index: 9998;
  display: flex;
  justify-content: flex-end;
}
.mp-drawer {
  width: 360px;
  max-width: 90vw;
  height: 100%;
  background: var(--color-card);
  border-left: 1px solid var(--color-border);
  box-shadow: var(--shadow-xl);
  display: flex;
  flex-direction: column;
}
.mp-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}
.mp-drawer-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text);
  min-width: 0;
}
.mp-drawer-name {
  font-weight: 600;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}
.mp-drawer-count {
  font-size: 12px;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}
.mp-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}
.mp-close:hover {
  background: var(--color-hover);
  color: var(--color-text);
}
.mp-drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}
.mp-empty {
  padding: 40px 16px;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 13px;
}
.mp-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.mp-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.mp-item:hover {
  background: var(--color-hover);
}
.mp-item-active {
  background: var(--color-primary-light);
}
.mp-item-index {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: var(--color-text-secondary);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}
.mp-playing {
  color: var(--color-primary);
}
.mp-item-info {
  flex: 1;
  min-width: 0;
}
.mp-item-name {
  font-size: 13px;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mp-item-active .mp-item-name {
  color: var(--color-primary);
  font-weight: 500;
}
.mp-item-meta {
  font-size: 11px;
  color: var(--color-text-secondary);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mp-item-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  opacity: 0;
  transition: all 0.15s ease;
  flex-shrink: 0;
}
.mp-item:hover .mp-item-remove {
  opacity: 1;
}
.mp-item-remove:hover {
  background: var(--color-accent);
  color: #fff;
}

/* 抽屉动画 */
.mp-drawer-fade-enter-active,
.mp-drawer-fade-leave-active {
  transition: opacity 0.25s ease;
}
.mp-drawer-fade-enter-from,
.mp-drawer-fade-leave-to {
  opacity: 0;
}
.mp-drawer-slide-enter-active,
.mp-drawer-slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.mp-drawer-slide-enter-from,
.mp-drawer-slide-leave-to {
  transform: translateX(100%);
}
</style>
