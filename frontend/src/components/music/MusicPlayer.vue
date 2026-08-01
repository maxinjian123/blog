<script setup lang="ts">
import {computed, nextTick, onMounted, onUnmounted, ref, watch} from 'vue'
import {useMusicStore} from '@/stores/music'

const store = useMusicStore()
const DEFAULT_PLAYLIST_SHARE = '0ebdbd8c'

// 歌单列表滚动容器
const playlistScrollRef = ref<HTMLElement | null>(null)
// 多行歌词滚动容器
const lrcScrollRef = ref<HTMLElement | null>(null)
// 歌单列表展开状态（默认收起）
const showPlaylist = ref(false)
// 歌词模式：single 单行 / multi 多行
const lrcMode = ref<'single' | 'multi'>('single')
// 激活后自动展开
let initialized = false

onMounted(() => {
  if (!store.isActivated && !store.libraryLoaded) {
    void store.loadPlaylist(DEFAULT_PLAYLIST_SHARE, true)
  }
})
onUnmounted(() => {
  store.cleanup()
})

watch(
    () => store.isActivated,
    (act) => {
      if (act && !initialized) {
        initialized = true
        store.toggleSidebar(true)
      }
    },
    {immediate: store.isActivated}
)

function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) return '00:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function onProgressClick(e: MouseEvent) {
  if (store.duration <= 0) return
  const el = e.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  store.seek(pct * store.duration)
}

function onVolumeClick(e: MouseEvent) {
  const el = e.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  store.setVolume(pct)
}

// 当前多行歌词高亮索引
const currentLrcIndex = computed(() => {
  if (store.lrcLines.length === 0) return -1
  const t = store.currentTime
  let idx = -1
  for (let i = 0; i < store.lrcLines.length; i++) {
    if (store.lrcLines[i].time <= t) idx = i
    else break
  }
  return idx
})

// 多行歌词滚动到当前行
function scrollLrcIntoView() {
  if (!lrcScrollRef.value || currentLrcIndex.value < 0) return
  nextTick(() => {
    const el = lrcScrollRef.value!.querySelector<HTMLElement>('[data-lrc-current="true"]')
    el?.scrollIntoView({block: 'center', behavior: 'smooth'})
  })
}

watch(currentLrcIndex, () => {
  if (lrcMode.value === 'multi') setTimeout(scrollLrcIntoView, 50)
})

// 歌单列表滚动到当前歌曲
function scrollCurrentIntoView() {
  if (!playlistScrollRef.value) return
  nextTick(() => {
    const el = playlistScrollRef.value!.querySelector<HTMLElement>('[data-current="true"]')
    el?.scrollIntoView({block: 'nearest', behavior: 'smooth'})
  })
}

watch(
    () => store.currentIndex,
    () => setTimeout(scrollCurrentIntoView, 50),
    {flush: 'post'}
)
</script>

<template>
  <div
      class="sp-wrap"
      :class="{'sp-open': store.sidebarOpen, 'sp-visible': store.isActivated}"
  >
    <!-- 切换按钮 -->
    <button
        v-if="store.isActivated"
        class="sp-toggle-btn glass"
        :title="store.sidebarOpen ? '收起播放器' : '展开播放器'"
        @click="store.toggleSidebar()"
    >
      <span v-if="!store.sidebarOpen" class="sp-toggle-fab" :class="{'sp-rotating': store.isPlaying}">
        <img v-if="store.currentSong?.cover" :src="store.currentSong.cover" alt=""/>
        <svg v-else class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
        </svg>
      </span>
      <svg v-if="store.sidebarOpen" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
      <svg v-else class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
           stroke-linecap="round" stroke-linejoin="round">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </button>

    <!-- 主面板 -->
    <Transition name="sp-panel">
      <aside v-show="store.sidebarOpen && store.isActivated" class="sp-panel glass">
        <!-- 1. 顶部：封面 + 信息 + 歌词 -->
        <div class="sp-top">
          <div class="sp-cover-wrap">
            <div class="sp-cover" :class="{'sp-rotating': store.isPlaying}">
              <img v-if="store.currentSong?.cover" :src="store.currentSong.cover" :alt="store.currentSong.name"/>
              <div v-else class="sp-cover-ph">
                <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                     stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 18V5l12-2v13"/>
                  <circle cx="6" cy="18" r="3"/>
                  <circle cx="18" cy="16" r="3"/>
                </svg>
              </div>
            </div>
          </div>

          <div class="sp-top-info">
            <div class="sp-song-name" :title="store.currentSong?.name">
              {{ store.currentSong?.name || '未在播放' }}
            </div>
            <div class="sp-song-singer">{{ store.currentSong?.singer || '' }}</div>
            <!-- 单行歌词（可点击切换多行） -->
            <div
                v-if="lrcMode === 'single'"
                class="sp-lyric-single"
                :class="{'sp-lyric-clickable': store.lrcLines.length > 0}"
                :title="store.lrcLines.length > 0 ? '点击展开多行歌词' : ''"
                @click="store.lrcLines.length > 0 && (lrcMode = 'multi')"
            >
              <span v-if="store.currentLyricLine">{{ store.currentLyricLine }}</span>
              <span v-else class="sp-lyric-empty">暂无歌词</span>
            </div>
          </div>
        </div>

        <!-- 多行歌词面板（展开时替换顶部歌词区域） -->
        <Transition name="sp-lrc">
          <div v-if="lrcMode === 'multi'" class="sp-lyric-multi-wrap">
            <div class="sp-lyric-multi-header">
              <span class="sp-lyric-multi-title">歌词</span>
              <button class="sp-lyric-close" title="收起歌词" @click="lrcMode = 'single'">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                     stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
            </div>
            <div ref="lrcScrollRef" class="sp-lyric-multi">
              <div
                  v-for="(line, i) in store.lrcLines"
                  :key="i"
                  class="sp-lrc-line"
                  :class="{'sp-lrc-line-active': i === currentLrcIndex}"
                  :data-lrc-current="i === currentLrcIndex ? 'true' : 'false'"
              >{{ line.text }}
              </div>
              <div v-if="store.lrcLines.length === 0" class="sp-lrc-empty-multi">暂无歌词</div>
            </div>
          </div>
        </Transition>

        <!-- 2. 进度条 -->
        <div
            class="sp-progress"
            :class="{'sp-progress-disabled': store.duration <= 0}"
            @click="onProgressClick"
        >
          <div class="sp-progress-bg"></div>
          <div class="sp-progress-fill" :style="{width: store.progressPercent + '%'}"></div>
          <div class="sp-progress-thumb" :style="{left: store.progressPercent + '%'}"></div>
        </div>
        <div class="sp-time-row">
          <span>{{ formatTime(store.currentTime) }}</span>
          <span>{{ formatTime(store.duration) }}</span>
        </div>

        <!-- 3. 控制按钮 -->
        <div class="sp-controls">
          <button class="sp-ctl" title="上一首" @click="store.prev()">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zM9.5 12l8.5 6V6z"/>
            </svg>
          </button>
          <button class="sp-ctl sp-ctl-primary" :title="store.isPlaying ? '暂停' : '播放'" @click="store.togglePlay()">
            <svg v-if="!store.isPlaying" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            <svg v-else class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 5h4v14H6zM14 5h4v14h-4z"/>
            </svg>
          </button>
          <button class="sp-ctl" title="下一首" @click="store.next()">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 6h2v12h-2zM6 18l8.5-6L6 6z"/>
            </svg>
          </button>
          <!-- 随机播放 -->
          <button
              class="sp-ctl sp-ctl-sm"
              :class="{'sp-ctl-on': store.isRandomMode}"
              :title="store.isRandomMode ? '关闭随机播放' : '开启随机播放'"
              @click="store.toggleRandomMode()"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
              <polyline points="16 3 21 3 21 8"/>
              <line x1="4" y1="20" x2="21" y2="3"/>
              <polyline points="21 16 21 21 16 21"/>
              <line x1="15" y1="15" x2="21" y2="21"/>
              <line x1="4" y1="4" x2="9" y2="9"/>
            </svg>
          </button>
          <!-- 歌单列表按钮（默认收起，点击向下展开） -->
          <button
              class="sp-ctl sp-ctl-sm"
              :class="{'sp-ctl-on': showPlaylist}"
              :title="showPlaylist ? '收起歌单' : '展开歌单'"
              @click="showPlaylist = !showPlaylist"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <circle cx="3.5" cy="6" r="1.2" fill="currentColor"/>
              <circle cx="3.5" cy="12" r="1.2" fill="currentColor"/>
              <circle cx="3.5" cy="18" r="1.2" fill="currentColor"/>
            </svg>
          </button>
        </div>

        <!-- 音量 -->
        <div class="sp-vol-wrap">
          <svg class="w-3 h-3" :style="{opacity: store.volume < 0.05 ? 0.4 : 1}" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path v-if="store.volume > 0.01" d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
          </svg>
          <div class="sp-vol-bar" @click="onVolumeClick">
            <div class="sp-vol-bg"></div>
            <div class="sp-vol-fill" :style="{width: (store.volume * 100) + '%'}"></div>
          </div>
        </div>

        <!-- 4. 歌单列表（默认收起，点击按钮向下展开） -->
        <Transition name="sp-pl">
          <div v-show="showPlaylist" class="sp-pl-section">
            <div class="sp-pl-header">
              <span class="sp-pl-current" :title="store.playlistName">
                《{{ store.playlistName || '全部歌曲' }}》
              </span>
              <span class="sp-pl-count">{{ store.playlistCount }} 首</span>
            </div>
            <div
                ref="playlistScrollRef"
                class="sp-pl-list"
                :class="{'sp-pl-list-empty': store.playlistCount === 0}"
            >
              <div v-if="store.playlistCount === 0" class="sp-pl-empty">
                <span>歌单为空</span>
              </div>
              <button
                  v-for="(s, i) in store.playlist"
                  :key="s.id + '-' + i"
                  class="sp-pl-item"
                  :class="{'sp-pl-item-current': i === store.currentIndex}"
                  :data-current="i === store.currentIndex ? 'true' : 'false'"
                  :title="s.name"
                  @click="store.playByIndex(i, true)"
              >
                <span class="sp-pl-idx">
                  <span v-if="i === store.currentIndex" class="sp-pl-idx-play">
                    <svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  </span>
                  <span v-else>{{ i + 1 < 10 ? '0' + (i + 1) : i + 1 }}</span>
                </span>
                <span class="sp-pl-info">
                  <span class="sp-pl-name">{{ s.name }}</span>
                  <span class="sp-pl-singer">{{ s.singer }}</span>
                </span>
              </button>
            </div>
          </div>
        </Transition>

        <!-- 加载/错误提示 -->
        <Transition name="sp-tip">
          <div v-if="store.isLoading" class="sp-tip sp-tip-loading">加载中…</div>
          <div v-else-if="store.errorMsg" class="sp-tip sp-tip-err">{{ store.errorMsg }}</div>
        </Transition>
      </aside>
    </Transition>
  </div>
</template>

<style scoped>
.sp-wrap {
  position: fixed;
  bottom: 10px;
  left: 10px;
  z-index: 55;
  pointer-events: none;
}

.sp-visible {
  pointer-events: auto;
}

/* 切换按钮 */
.sp-toggle-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 64px;
  border-radius: 0 8px 8px 0;
  border: 1px solid var(--color-border);
  border-left: none;
  color: var(--color-text);
  background: var(--color-card);
  cursor: pointer;
  left: 0;
  z-index: 56;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0;
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow-md);
}

.sp-open .sp-toggle-btn {
  left: 280px;
}

.sp-toggle-fab {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gradient-primary);
  flex-shrink: 0;
}

.sp-toggle-fab img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 主面板 */
.sp-panel {
  position: relative;
  width: 280px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: var(--color-card);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  padding: 12px;
  overflow: hidden;
  backdrop-filter: saturate(1.2) blur(6px);
  -webkit-backdrop-filter: saturate(1.2) blur(6px);
}

.sp-panel-enter-active,
.sp-panel-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
}

.sp-panel-enter-from,
.sp-panel-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

/* 1. 顶部 */
.sp-top {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-shrink: 0;
}

.sp-cover-wrap {
  flex-shrink: 0;
}

.sp-cover {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--color-hover);
  border: 2px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
}

.sp-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sp-cover-ph {
  color: var(--color-primary);
}

.sp-top-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sp-song-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sp-song-singer {
  font-size: 11px;
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sp-lyric-single {
  font-size: 11px;
  line-height: 1.3;
  color: var(--color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--color-primary-light);
  margin-top: 2px;
  min-height: 20px;
  display: flex;
  align-items: center;
}

.sp-lyric-clickable {
  cursor: pointer;
}

.sp-lyric-clickable:hover {
  opacity: 0.8;
}

.sp-lyric-empty {
  color: var(--color-text-secondary);
  opacity: 0.7;
}

/* 多行歌词 */
.sp-lyric-multi-wrap {
  margin-top: 8px;
  border-radius: 8px;
  background: var(--color-hover);
  overflow: hidden;
  flex-shrink: 0;
  max-height: 200px;
  display: flex;
  flex-direction: column;
}

.sp-lyric-multi-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  border-bottom: 1px solid var(--color-border);
}

.sp-lyric-multi-title {
  font-size: 10px;
  color: var(--color-text-secondary);
  font-weight: 600;
}

.sp-lyric-close {
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  border-radius: 4px;
}

.sp-lyric-close:hover {
  color: var(--color-primary);
  background: var(--color-hover);
}

.sp-lyric-multi {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  scroll-behavior: smooth;
  mask-image: linear-gradient(to bottom, transparent 0, #000 12%, #000 88%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 12%, #000 88%, transparent 100%);
}

.sp-lrc-line {
  font-size: 11px;
  line-height: 1.6;
  color: var(--color-text-secondary);
  text-align: center;
  padding: 2px 4px;
  transition: color 0.2s ease, transform 0.2s ease;
}

.sp-lrc-line-active {
  color: var(--color-primary);
  font-weight: 600;
  transform: scale(1.03);
}

.sp-lrc-empty-multi {
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 11px;
  padding: 20px 0;
}

.sp-lrc-enter-active, .sp-lrc-leave-active {
  transition: max-height 0.3s ease, opacity 0.3s ease;
}

.sp-lrc-enter-from, .sp-lrc-leave-to {
  max-height: 0;
  opacity: 0;
}

/* 2. 进度条 */
.sp-progress {
  margin-top: 10px;
  height: 10px;
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.sp-progress-disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.sp-progress-bg {
  position: absolute;
  left: 0;
  right: 0;
  height: 3px;
  border-radius: 2px;
  background: var(--color-border);
}

.sp-progress-fill {
  position: absolute;
  left: 0;
  height: 3px;
  border-radius: 2px;
  background: var(--gradient-primary);
  transition: width 0.15s linear;
}

.sp-progress-thumb {
  position: absolute;
  top: 50%;
  width: 8px;
  height: 8px;
  margin-left: -4px;
  border-radius: 50%;
  background: var(--color-primary);
  border: 2px solid var(--color-card);
  transform: translateY(-50%);
  box-shadow: var(--shadow-sm);
}

.sp-time-row {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--color-text-secondary);
  font-variant-numeric: tabular-nums;
  margin-top: 2px;
  flex-shrink: 0;
}

/* 3. 控制 */
.sp-controls {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-shrink: 0;
}

.sp-ctl {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
  flex-shrink: 0;
}

.sp-ctl:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.sp-ctl-primary {
  width: 40px;
  height: 40px;
  border: none;
  background: var(--gradient-primary);
  color: #fff;
  box-shadow: var(--shadow-md);
}

.sp-ctl-primary:hover {
  color: #fff;
  transform: translateY(-1px);
}

.sp-ctl-sm {
  width: 28px;
  height: 28px;
}

.sp-ctl-on {
  color: var(--color-primary);
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

/* 音量 */
.sp-vol-wrap {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.sp-vol-bar {
  flex: 1;
  height: 8px;
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.sp-vol-bg {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  border-radius: 2px;
  background: var(--color-border);
}

.sp-vol-fill {
  position: absolute;
  left: 0;
  height: 2px;
  border-radius: 2px;
  background: var(--color-primary);
}

/* 4. 歌单列表（默认收起） */
.sp-pl-section {
  margin-top: 8px;
  border-top: 1px dashed var(--color-border);
  padding-top: 6px;
  flex-shrink: 0;
  max-height: 280px;
  display: flex;
  flex-direction: column;
}

.sp-pl-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  gap: 4px;
  flex-shrink: 0;
  margin-bottom: 4px;
}

.sp-pl-current {
  color: var(--color-primary);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.sp-pl-count {
  color: var(--color-text-secondary);
  font-size: 10px;
  flex-shrink: 0;
}

.sp-pl-list {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.sp-pl-list-empty {
  padding: 8px;
}

.sp-pl-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  font-size: 11px;
  padding: 12px 0;
}

.sp-pl-item {
  width: 100%;
  display: grid;
  grid-template-columns: 22px 1fr;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border-radius: 6px;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  color: var(--color-text);
  font: inherit;
  transition: background-color 0.15s ease;
}

.sp-pl-item:hover {
  background: var(--color-hover);
}

.sp-pl-item-current {
  background: var(--color-primary-light);
}

.sp-pl-idx {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: var(--color-text-secondary);
  font-variant-numeric: tabular-nums;
}

.sp-pl-item-current .sp-pl-idx {
  color: var(--color-primary);
}

.sp-pl-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.sp-pl-name {
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sp-pl-item-current .sp-pl-name {
  color: var(--color-primary);
  font-weight: 600;
}

.sp-pl-singer {
  font-size: 9.5px;
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sp-pl-enter-active, .sp-pl-leave-active {
  transition: max-height 0.3s ease, opacity 0.3s ease, margin-top 0.3s ease, padding-top 0.3s ease;
}

.sp-pl-enter-from, .sp-pl-leave-to {
  max-height: 0;
  opacity: 0;
  margin-top: 0;
  padding-top: 0;
}

/* 提示 */
.sp-tip {
  margin-top: 4px;
  text-align: center;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  flex-shrink: 0;
}

.sp-tip-loading {
  background: var(--color-hover);
  color: var(--color-text-secondary);
}

.sp-tip-err {
  background: #fff1f0;
  color: var(--color-accent);
}

.sp-tip-enter-active, .sp-tip-leave-active {
  transition: opacity 0.2s ease;
}

.sp-tip-enter-from, .sp-tip-leave-to {
  opacity: 0;
}

/* 旋转 */
.sp-rotating {
  animation: sp-rotate 14s linear infinite;
}

@keyframes sp-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 移动端 */
@media (max-width: 768px) {
  .sp-wrap {
    bottom: 8px;
    left: 8px;
  }

  .sp-panel {
    width: min(260px, 88vw);
    padding: 10px;
  }

  .sp-open .sp-toggle-btn {
    left: min(260px, 88vw);
  }

  .sp-cover {
    width: 50px;
    height: 50px;
  }

  .sp-ctl {
    width: 30px;
    height: 30px;
  }

  .sp-ctl-primary {
    width: 36px;
    height: 36px;
  }

  .sp-ctl-sm {
    width: 26px;
    height: 26px;
  }

  .sp-song-name {
    font-size: 12px;
  }

  .sp-lyric-single {
    font-size: 10.5px;
  }
}

@media (max-width: 360px) {
  .sp-panel {
    width: 86vw;
  }

  .sp-open .sp-toggle-btn {
    left: 86vw;
  }
}

/* 滚动条 */
.sp-pl-list::-webkit-scrollbar,
.sp-lyric-multi::-webkit-scrollbar {
  width: 3px;
}

.sp-pl-list::-webkit-scrollbar-track,
.sp-lyric-multi::-webkit-scrollbar-track {
  background: transparent;
}

.sp-pl-list::-webkit-scrollbar-thumb,
.sp-lyric-multi::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 2px;
}
</style>
