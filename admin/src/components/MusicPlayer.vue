<script setup lang="ts">
import {computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch} from 'vue'
import {type MusicItem, useMusicStore} from '@/stores/music'
import {message} from 'ant-design-vue'
import {
  CloseOutlined,
  FolderOpenOutlined,
  MenuOutlined,
  MinusOutlined,
  PauseCircleOutlined,
  PictureOutlined,
  PlayCircleOutlined,
  RedoOutlined,
  ReloadOutlined,
  RetweetOutlined,
  SoundOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  SwapOutlined
} from '@ant-design/icons-vue'

const store = useMusicStore()

const audioEl = ref<HTMLAudioElement | null>(null)
const playlistVisible = ref(false)
const lyricVisible = ref(false)
const lyricBodyEl = ref<HTMLDivElement | null>(null)
const lyricPanelEl = ref<HTMLDivElement | null>(null)
const seekDragging = ref(false)
const volumeDragging = ref(false)
const retryCount = ref(0)  // 链接失效重试次数（单曲最多 1 次）
let rafId: number | null = null  // requestAnimationFrame ID，用于高频同步 currentTime

// 歌词面板拖拽状态
const lyricPos = ref({x: 20, y: -1}) // y=-1 表示未初始化，使用默认 bottom
const lyricDragging = ref(false)
const dragOffset = ref({x: 0, y: 0})
const dragStartPos = ref({x: 0, y: 0})
const dragMoved = ref(false)

const currentSong = computed(() => store.currentSong)
const playUrl = computed(() => currentSong.value?.play_url || '')

// 格式化时间 mm:ss
function formatTime(sec: number): string {
  if (!sec || isNaN(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

// 进度百分比（使用 liveCurrentTime 实现实时刷新）
const progressPercent = computed(() => {
  if (!store.duration || store.duration === 0) return 0
  return (liveCurrentTime.value / store.duration) * 100
})

// 音量百分比
const volumePercent = computed(() => Math.round(store.volume * 100))

// 循环模式图标与提示（不同模式用不同图标区分）
const playModeConfig = computed(() => {
  switch (store.playMode) {
    case 'single':
      return {icon: RedoOutlined, title: '单曲循环'}
    case 'shuffle':
      return {icon: SwapOutlined, title: '随机播放'}
    default:
      return {icon: RetweetOutlined, title: '列表循环'}
  }
})

// 进度条 hover 时间
const hoverTime = ref(0)
const hoverVisible = ref(false)

function onProgressHover(e: MouseEvent) {
  if (!store.duration) return
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  hoverTime.value = percent * store.duration
}

function onProgressEnter() {
  hoverVisible.value = true
}

function onProgressLeave() {
  hoverVisible.value = false
}

// ============ 音频事件 ============
// 实时 currentTime（不进入 store，避免高频响应式更新）
const liveCurrentTime = ref(0)

// 使用 requestAnimationFrame 高频同步 currentTime，弥补 timeupdate 事件频率不足
function syncTimeLoop() {
  if (audioEl.value && !audioEl.value.paused) {
    const t = audioEl.value.currentTime
    liveCurrentTime.value = t
    // 60Hz 直接计算并更新当前歌词行（shallowRef，仅在变化时触发更新）
    updateCurrentLyricIndex(t)
    updateLyricProgress(t)
  }
  rafId = requestAnimationFrame(syncTimeLoop)
}

function startTimeSync() {
  if (rafId === null) {
    rafId = requestAnimationFrame(syncTimeLoop)
  }
}

function stopTimeSync() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

function onTimeUpdate() {
  // timeupdate 事件触发时立即同步
  if (!seekDragging.value && audioEl.value) {
    const t = audioEl.value.currentTime
    liveCurrentTime.value = t
    updateCurrentLyricIndex(t)
    updateLyricProgress(t)
  }
}

function onLoadedMetadata() {
  if (audioEl.value) {
    store.setDuration(audioEl.value.duration)
  }
}

function onEnded() {
  // 单曲循环：直接重播当前歌曲
  if (store.playMode === 'single') {
    if (audioEl.value) {
      audioEl.value.currentTime = 0
      audioEl.value.play().catch(() => {
      })
    }
    store.setCurrentTime(0)
    store.play()
    return
  }
  // 列表循环 / 随机播放：切到下一首
  store.next()
}

function onPlay() {
  store.isPlaying = true
  retryCount.value = 0
  startTimeSync()
}

function onPause() {
  // 暂停时停止 rAF 循环，但保留 timeupdate 兜底
  stopTimeSync()
  if (audioEl.value) {
    store.setCurrentTime(audioEl.value.currentTime)
  }
}

async function onError() {
  // 播放链接失效：自动刷新一次
  if (retryCount.value === 0 && currentSong.value) {
    retryCount.value++
    message.loading({content: '播放链接失效，正在刷新...', key: 'music-refresh', duration: 0})
    const newUrl = await store.refreshCurrentUrl()
    message.destroy('music-refresh')
    if (newUrl) {
      await nextTick()
      try {
        audioEl.value?.load()
        audioEl.value?.play()
      } catch {
        // 忽略
      }
    } else {
      message.error('无法获取播放链接，已跳过')
      store.next()
    }
  }
}

// ============ 控制 ============
function togglePlay() {
  if (!audioEl.value) return
  if (store.isPlaying) {
    audioEl.value.pause()
    store.pause()
  } else {
    audioEl.value.play().catch(() => {
      // 自动播放可能被浏览器拦截
      message.warning('请点击播放按钮开始播放')
    })
  }
}

function handleNext() {
  store.next()
}

function handlePrev() {
  store.prev()
}

function handleSeek(e: MouseEvent) {
  if (!audioEl.value || !store.duration) return
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const percent = (e.clientX - rect.left) / rect.width
  const newTime = percent * store.duration
  audioEl.value.currentTime = newTime
  liveCurrentTime.value = newTime
  updateCurrentLyricIndex(newTime)
  updateLyricProgress(newTime)
  store.setCurrentTime(newTime)
}

// 进度条拖拽
function onSeekStart(e: MouseEvent) {
  seekDragging.value = true
  handleSeek(e)
  document.addEventListener('mousemove', onSeekMove)
  document.addEventListener('mouseup', onSeekEnd)
}

function onSeekMove(e: MouseEvent) {
  if (!seekDragging.value) return
  handleSeek(e)
}

function onSeekEnd() {
  seekDragging.value = false
  document.removeEventListener('mousemove', onSeekMove)
  document.removeEventListener('mouseup', onSeekEnd)
}

// 音量控制
function handleVolumeChange(v: number) {
  store.setVolume(v)
  if (audioEl.value) audioEl.value.volume = v
}

// ============ 播放列表 / 歌词 ============
function togglePlaylist() {
  playlistVisible.value = !playlistVisible.value
  if (playlistVisible.value) lyricVisible.value = false
}

function toggleLyric(e?: Event) {
  lyricVisible.value = !lyricVisible.value
  if (lyricVisible.value) {
    playlistVisible.value = false
    // 安全检查：如果面板位置不在可视区域内，重置到默认位置
    if (lyricPos.value.y !== -1) {
      const maxX = window.innerWidth - 388
      const maxY = window.innerHeight - 600
      if (lyricPos.value.x < 8 || lyricPos.value.x > maxX ||
          lyricPos.value.y < 8 || lyricPos.value.y > maxY) {
        lyricPos.value = {x: 20, y: -1}
      }
    }
    nextTick(scrollToActiveLyric)
  }
}

function playSong(index: number) {
  store.jumpTo(index)
}

// ============ LRC 歌词解析与高亮 ============
interface LyricLine {
  time: number
  text: string
}

const parsedLyrics = computed<LyricLine[]>(() => {
  if (!store.currentLyric) return []
  const lines = store.currentLyric.split('\n')
  const result: LyricLine[] = []
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g
  for (const line of lines) {
    const matches = [...line.matchAll(timeRegex)]
    const text = line.replace(timeRegex, '').trim()
    if (matches.length === 0 || !text) continue
    for (const m of matches) {
      const min = parseInt(m[1])
      const sec = parseInt(m[2])
      const ms = parseInt(m[3].padEnd(3, '0'))
      const time = min * 60 + sec + ms / 1000
      result.push({time, text})
    }
  }
  return result.sort((a, b) => a.time - b.time)
})

const currentLyricIndex = shallowRef(-1)

// 纯函数：根据当前时间和歌词列表找到当前行
function findCurrentLyricIndex(time: number, lyrics: LyricLine[]): number {
  if (lyrics.length === 0) return -1
  let idx = -1
  for (let i = 0; i < lyrics.length; i++) {
    if (lyrics[i].time <= time) idx = i
    else break
  }
  return idx
}

// 在 rAF 中直接计算并更新 shallowRef
function updateCurrentLyricIndex(time: number) {
  const idx = findCurrentLyricIndex(time, parsedLyrics.value)
  if (idx !== currentLyricIndex.value) {
    currentLyricIndex.value = idx
  }
}

// 根据与当前行的距离返回样式类
function getLyricLineClass(idx: number): string {
  return getDistanceClass(currentLyricIndex.value, idx)
}

// 纯函数：根据 active index 和当前行 idx 返回距离类
function getDistanceClass(active: number, idx: number): string {
  if (active < 0) return ''
  if (idx === active) return 'active'
  const dist = Math.abs(idx - active)
  if (dist === 1) return 'near'
  if (dist === 2) return 'far'
  return 'distant'
}

// 歌词行到下一行的进度百分比（用于当前行的视觉进度）
const currentLyricProgress = ref(0)

// 在 rAF 中直接更新进度
function updateLyricProgress(t: number) {
  const lyrics = parsedLyrics.value
  const idx = currentLyricIndex.value
  if (idx < 0 || idx >= lyrics.length) {
    if (currentLyricProgress.value !== 0) currentLyricProgress.value = 0
    return
  }
  const currentTime = lyrics[idx].time
  const nextTime = idx + 1 < lyrics.length ? lyrics[idx + 1].time : store.duration
  const duration = nextTime - currentTime
  if (duration <= 0) {
    if (currentLyricProgress.value !== 0) currentLyricProgress.value = 0
    return
  }
  const p = Math.min(1, Math.max(0, (t - currentTime) / duration))
  // 减少精度更新（每 0.5% 才更新），避免 60Hz DOM 操作
  const rounded = Math.round(p * 200) / 200
  if (rounded !== currentLyricProgress.value) {
    currentLyricProgress.value = rounded
  }
}

// 歌词滚动到当前高亮行
function scrollToActiveLyric() {
  if (!lyricBodyEl.value || !lyricVisible.value) return
  const activeEl = lyricBodyEl.value.querySelector('.lyric-line.active') as HTMLElement | null
  if (!activeEl) return
  const container = lyricBodyEl.value
  const containerHeight = container.clientHeight
  const lineTop = activeEl.offsetTop
  const lineHeight = activeEl.clientHeight
  container.scrollTo({
    top: lineTop - containerHeight / 2 + lineHeight / 2,
    behavior: 'smooth'
  })
}

watch(currentLyricIndex, () => {
  nextTick(scrollToActiveLyric)
})

// ============ 歌词点击跳转 ============
function seekToLyric(time: number) {
  if (!audioEl.value) return
  audioEl.value.currentTime = time
  liveCurrentTime.value = time
  updateCurrentLyricIndex(time)
  updateLyricProgress(time)
  store.setCurrentTime(time)
}

// ============ 歌词面板拖拽 ============
function onLyricHeaderMouseDown(e: MouseEvent) {
  // 关闭按钮上不触发拖拽
  const target = e.target as HTMLElement
  if (target.closest('.lyric-close-btn') || target.closest('button')) return
  if (!lyricPanelEl.value) return
  const rect = lyricPanelEl.value.getBoundingClientRect()
  dragOffset.value = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  }
  dragStartPos.value = {x: e.clientX, y: e.clientY}
  dragMoved.value = false
  lyricDragging.value = false
  document.addEventListener('mousemove', onLyricDragMove)
  document.addEventListener('mouseup', onLyricDragEnd)
  e.stopPropagation()
}

function onLyricDragMove(e: MouseEvent) {
  const dx = e.clientX - dragStartPos.value.x
  const dy = e.clientY - dragStartPos.value.y
  // 移动超过 4px 才认为是拖拽
  if (!dragMoved.value && Math.abs(dx) < 4 && Math.abs(dy) < 4) return
  // 第一次确认拖拽时，初始化位置（从 bottom 模式切换到 top 模式）
  if (!dragMoved.value && lyricPanelEl.value) {
    const rect = lyricPanelEl.value.getBoundingClientRect()
    // 只有之前是 bottom 模式时才需要初始化
    if (lyricPos.value.y === -1) {
      lyricPos.value = {x: rect.left, y: rect.top}
      // 同步更新 offset，因为此时 rect 还没变
      dragOffset.value = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
    }
    dragMoved.value = true
    lyricDragging.value = true
  }
  const panelW = lyricPanelEl.value?.offsetWidth || 380
  const panelH = lyricPanelEl.value?.offsetHeight || 520
  const maxX = window.innerWidth - panelW - 8
  const maxY = window.innerHeight - panelH - 80
  let nx = e.clientX - dragOffset.value.x
  let ny = e.clientY - dragOffset.value.y
  nx = Math.max(8, Math.min(nx, maxX))
  ny = Math.max(8, Math.min(ny, maxY))
  lyricPos.value = {x: nx, y: ny}
}

function onLyricDragEnd() {
  document.removeEventListener('mousemove', onLyricDragMove)
  document.removeEventListener('mouseup', onLyricDragEnd)
  // 延迟重置，避免 click 事件穿透
  setTimeout(() => {
    lyricDragging.value = false
  }, 0)
}

// 重置歌词面板位置（关闭时）
function resetLyricPosition() {
  lyricPos.value = {x: 20, y: -1}
  lyricVisible.value = false
}

// ============ 监听变化 ============
// 监听 playbackToken：所有切歌操作（setPlaylist/playSingle/next/prev/jumpTo/loadLibrary）都会递增 token
// 用 token 而非 currentIndex 作为重新加载信号源，可覆盖"同索引切歌"场景（如歌单点击播放当前歌）
watch(() => store.playbackToken, () => {
  retryCount.value = 0
  nextTick(() => {
    if (audioEl.value && playUrl.value) {
      audioEl.value.load()
      if (store.isPlaying) {
        audioEl.value.play().catch(() => {
          // 浏览器可能拦截自动播放
        })
      }
    }
  })
})

// 监听播放状态
watch(() => store.isPlaying, (val) => {
  if (!audioEl.value) return
  if (val) {
    audioEl.value.play().catch(() => {
      // 自动播放被拦截
    })
  } else {
    audioEl.value.pause()
  }
})

// 监听音量
watch(() => store.volume, (val) => {
  if (audioEl.value) audioEl.value.volume = val
})

// 监听 URL 变化（链接刷新后重新加载）
watch(playUrl, () => {
  nextTick(() => {
    if (audioEl.value) {
      audioEl.value.load()
      if (store.isPlaying) {
        audioEl.value.play().catch(() => {
        })
      }
    }
  })
})

// ============ 生命周期 ============
onMounted(() => {
  if (audioEl.value) {
    audioEl.value.volume = store.volume
    // 若初始化时已在播放，启动 rAF 同步
    if (!audioEl.value.paused) {
      startTimeSync()
    }
  }
})

onBeforeUnmount(() => {
  stopTimeSync()
  document.removeEventListener('mousemove', onSeekMove)
  document.removeEventListener('mouseup', onSeekEnd)
  document.removeEventListener('mousemove', onLyricDragMove)
  document.removeEventListener('mouseup', onLyricDragEnd)
})

// 暴露给父组件的方法（用于 MusicCrawler 触发播放）
defineExpose({
  playFromLibrary(song: MusicItem) {
    store.loadLibrary(song.id)
  },
  playSingle(song: MusicItem) {
    store.playSingle(song)
  }
})
</script>

<template>
  <!-- 隐藏的 audio 元素 -->
  <audio
      ref="audioEl"
      :src="playUrl"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoadedMetadata"
      @ended="onEnded"
      @play="onPlay"
      @pause="onPause"
      @error="onError"
      preload="metadata"
  />

  <!-- 全局播放器：仅当有歌曲且未关闭时显示 -->
  <template v-if="store.isPlayerVisible && currentSong">
    <!-- 最小化形态：右下角悬浮球 -->
    <div v-if="store.isMinimized" class="music-float-ball" @click="store.expand()">
      <div class="float-cover" :class="{rotating: store.isPlaying}">
        <img v-if="currentSong.cover" :src="currentSong.cover" :alt="currentSong.name"/>
        <PictureOutlined v-else/>
      </div>
      <div class="float-info">
        <div class="float-name">{{ currentSong.name }}</div>
        <div class="float-singer">{{ currentSong.singer }}</div>
      </div>
      <a-button
          type="text"
          size="small"
          class="float-play-btn"
          @click.stop="togglePlay"
      >
        <template #icon>
          <PauseCircleOutlined v-if="store.isPlaying"/>
          <PlayCircleOutlined v-else/>
        </template>
      </a-button>
    </div>

    <!-- 展开形态：底部播放条 -->
    <div v-else class="music-player-bar">
      <!-- 左侧：封面 + 歌曲信息 -->
      <div class="player-left">
        <div class="player-cover" :class="{rotating: store.isPlaying}" @click="toggleLyric($event)">
          <img v-if="currentSong.cover" :src="currentSong.cover" :alt="currentSong.name"/>
          <PictureOutlined v-else class="cover-placeholder"/>
        </div>
        <div class="player-info">
          <div class="player-name" :title="currentSong.name">{{ currentSong.name }}</div>
          <div class="player-singer" :title="currentSong.singer">{{ currentSong.singer }}</div>
        </div>
      </div>

      <!-- 中间：控制按钮 + 进度条 -->
      <div class="player-center">
        <div class="player-controls">
          <a-tooltip :title="playModeConfig.title">
            <a-button type="text" size="small" @click="store.togglePlayMode()" class="ctrl-btn">
              <template #icon>
                <component :is="playModeConfig.icon"/>
              </template>
            </a-button>
          </a-tooltip>
          <a-button type="text" size="small" @click="handlePrev" class="ctrl-btn" :disabled="!store.hasPrev">
            <template #icon>
              <StepBackwardOutlined/>
            </template>
          </a-button>
          <a-button
              type="primary"
              shape="circle"
              size="large"
              @click="togglePlay"
              class="play-btn"
          >
            <template #icon>
              <PauseCircleOutlined v-if="store.isPlaying"/>
              <PlayCircleOutlined v-else/>
            </template>
          </a-button>
          <a-button type="text" size="small" @click="handleNext" class="ctrl-btn" :disabled="!store.hasNext">
            <template #icon>
              <StepForwardOutlined/>
            </template>
          </a-button>
          <a-tooltip title="刷新链接">
            <a-button type="text" size="small" @click="store.refreshCurrentUrl()" class="ctrl-btn">
              <template #icon>
                <ReloadOutlined/>
              </template>
            </a-button>
          </a-tooltip>
        </div>
        <div class="player-progress">
          <span class="time-text">{{ formatTime(liveCurrentTime) }}</span>
          <a-tooltip
              :open="hoverVisible && store.duration > 0"
              :title="formatTime(hoverTime)"
              placement="top"
              :overlay-style="{pointerEvents: 'none'}"
          >
            <div
                class="progress-bar"
                @mousedown="onSeekStart"
                @mousemove="onProgressHover"
                @mouseenter="onProgressEnter"
                @mouseleave="onProgressLeave"
            >
              <div class="progress-fill" :style="{width: progressPercent + '%'}">
                <div class="progress-thumb"></div>
              </div>
            </div>
          </a-tooltip>
          <span class="time-text">{{ formatTime(store.duration) }}</span>
        </div>
      </div>

      <!-- 右侧：音量 + 列表 + 最小化 + 关闭 -->
      <div class="player-right">
        <a-tooltip :title="lyricVisible ? '隐藏歌词' : '显示歌词'">
          <a-button :type="lyricVisible ? 'primary' : 'text'" size="small" @click="toggleLyric($event)"
                    class="ctrl-btn">
            <template #icon>
              <FolderOpenOutlined/>
            </template>
          </a-button>
        </a-tooltip>
        <a-tooltip :title="playlistVisible ? '隐藏列表' : '播放列表'">
          <a-button type="text" size="small" @click="togglePlaylist" class="ctrl-btn"
                    :class="{active: playlistVisible}">
            <template #icon>
              <MenuOutlined/>
            </template>
            <span class="list-count" v-if="store.playlistCount">{{ store.playlistCount }}</span>
          </a-button>
        </a-tooltip>
        <div class="volume-wrap">
          <SoundOutlined class="volume-icon"/>
          <div class="volume-bar">
            <a-slider
                :value="volumePercent"
                :tip-formatter="(v: number) => `${v}%`"
                @change="(v: number) => handleVolumeChange(v / 100)"
                size="small"
                style="width: 80px"
            />
          </div>
        </div>
        <a-tooltip title="最小化">
          <a-button type="text" size="small" @click="store.minimize()" class="ctrl-btn">
            <template #icon>
              <MinusOutlined/>
            </template>
          </a-button>
        </a-tooltip>
        <a-tooltip title="关闭">
          <a-button type="text" size="small" @click="store.closePlayer()" class="ctrl-btn close-btn">
            <template #icon>
              <CloseOutlined/>
            </template>
          </a-button>
        </a-tooltip>
      </div>

      <!-- 播放列表面板 -->
      <transition name="slide-up">
        <div v-if="playlistVisible" class="playlist-panel">
          <div class="playlist-header">
            <span>播放列表（{{ store.playlistCount }} 首）</span>
            <a-button type="text" size="small" @click="playlistVisible = false">
              <template #icon>
                <CloseOutlined/>
              </template>
            </a-button>
          </div>
          <div class="playlist-body">
            <div
                v-for="(song, idx) in store.playlist"
                :key="song.id"
                class="playlist-item"
                :class="{active: idx === store.currentIndex}"
                @dblclick="playSong(idx)"
            >
              <span class="item-index">{{ idx === store.currentIndex ? '▶' : idx + 1 }}</span>
              <div class="item-info">
                <div class="item-name">{{ song.name }}</div>
                <div class="item-singer">{{ song.singer }}</div>
              </div>
              <span class="item-duration">{{ formatTime(song.duration) }}</span>
            </div>
          </div>
        </div>
      </transition>

    </div>

    <!-- 歌词面板（独立于播放条，避免事件冒泡） -->
    <transition name="lyric-panel">
      <div
          v-if="lyricVisible && !store.isMinimized"
          ref="lyricPanelEl"
          class="lyric-panel"
          :class="{dragging: lyricDragging}"
          :style="lyricPos.y === -1 ? {} : { left: lyricPos.x + 'px', top: lyricPos.y + 'px', bottom: 'auto' }"
          @click.stop
          @mousedown.stop
      >
        <!-- 封面图背景（使用 background-image 方式） -->
        <div
            v-if="currentSong.cover"
            class="lyric-cover-bg"
            :style="{backgroundImage: 'url(\'' + currentSong.cover + '\')'}"
        ></div>
        <div v-if="currentSong.cover" class="lyric-cover-overlay"></div>

        <div class="lyric-header" @mousedown="onLyricHeaderMouseDown" @click.stop>
          <div class="lyric-drag-hint">⋮⋮</div>
          <div class="lyric-song-info">
            <div class="lyric-song-name">{{ currentSong.name }}</div>
            <div class="lyric-song-singer">{{ currentSong.singer }}</div>
          </div>
          <a-button type="text" size="small" class="lyric-close-btn" @click="resetLyricPosition">
            <template #icon>
              <CloseOutlined/>
            </template>
          </a-button>
        </div>

        <div ref="lyricBodyEl" class="lyric-body">
          <div class="lyric-spacer"></div>
          <template v-if="parsedLyrics.length === 0">
            <div class="lyric-empty">
              <div class="lyric-empty-icon">♪</div>
              <div>暂无歌词</div>
            </div>
          </template>
          <div
              v-for="(line, idx) in parsedLyrics"
              :key="idx"
              v-memo="[currentLyricIndex === idx, getDistanceClass(currentLyricIndex, idx)]"
              class="lyric-line"
              :class="getLyricLineClass(idx)"
              @click="seekToLyric(line.time)"
          >
            <span class="lyric-text">{{ line.text }}</span>
            <div v-if="idx === currentLyricIndex" class="lyric-progress-bar">
              <div class="lyric-progress-fill" :style="{width: (currentLyricProgress * 100) + '%'}"></div>
            </div>
          </div>
          <div class="lyric-spacer"></div>
        </div>
      </div>
    </transition>
  </template>
</template>

<style scoped>
/* ============ 悬浮球 ============ */
.music-float-ball {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px 6px 6px;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 32px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: all 0.25s;
  border: 1px solid #f0f0f0;
}

.music-float-ball:hover {
  box-shadow: 0 6px 24px rgba(22, 119, 255, 0.2);
  transform: translateY(-2px);
}

.float-cover {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  flex-shrink: 0;
}

.float-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.float-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  max-width: 140px;
}

.float-name {
  font-size: 12px;
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.float-singer {
  font-size: 11px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.float-play-btn {
  font-size: 20px;
  color: #1677ff;
  flex-shrink: 0;
}

/* ============ 底部播放条 ============ */
.music-player-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  height: 70px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-top: 1px solid #f0f0f0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 16px;
}

/* 左侧：封面与信息 */
.player-left {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 240px;
  flex-shrink: 0;
}

.player-cover {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  flex-shrink: 0;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.player-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  font-size: 20px;
  color: #ccc;
}

.player-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.player-name {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}

.player-singer {
  font-size: 12px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}

/* 中间：控制与进度 */
.player-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.player-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ctrl-btn {
  color: #666;
  font-size: 16px;
}

.ctrl-btn:hover {
  color: #1677ff;
}

.ctrl-btn.active {
  color: #1677ff;
}

.play-btn {
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.player-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 500px;
}

.time-text {
  font-size: 11px;
  color: #999;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  min-width: 32px;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: #e8e8e8;
  border-radius: 2px;
  cursor: pointer;
  position: relative;
  transition: height 0.2s;
}

.progress-bar:hover {
  height: 6px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1677ff, #4096ff);
  border-radius: 2px;
  position: relative;
  transition: width 0.1s linear;
}

.progress-thumb {
  position: absolute;
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #1677ff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  opacity: 0;
  transition: opacity 0.2s;
}

.progress-bar:hover .progress-thumb {
  opacity: 1;
}

/* 右侧：音量与工具按钮 */
.player-right {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  position: relative;
}

.volume-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
}

.volume-icon {
  font-size: 14px;
  color: #666;
}

.close-btn:hover {
  color: #ff4d4f !important;
}

.list-count {
  font-size: 10px;
  margin-left: 2px;
}

/* ============ 播放列表面板 ============ */
.playlist-panel {
  position: absolute;
  right: 20px;
  bottom: 74px;
  width: 360px;
  max-height: 400px;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 10;
}

.playlist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.playlist-body {
  flex: 1;
  overflow-y: auto;
  max-height: 350px;
}

.playlist-body::-webkit-scrollbar {
  width: 6px;
}

.playlist-body::-webkit-scrollbar-thumb {
  background: #d9d9d9;
  border-radius: 3px;
}

.playlist-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.playlist-item:hover {
  background: #f5f5f5;
}

.playlist-item.active {
  background: #e6f4ff;
  color: #1677ff;
}

.playlist-item.active .item-name,
.playlist-item.active .item-singer,
.playlist-item.active .item-duration {
  color: #1677ff;
}

.item-index {
  width: 20px;
  font-size: 12px;
  color: #999;
  text-align: center;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 13px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-singer {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}

.item-duration {
  font-size: 12px;
  color: #999;
  flex-shrink: 0;
}

/* ============ 歌词面板 - 浅色磨砂玻璃 ============ */
.lyric-panel {
  position: fixed;
  left: 20px;
  bottom: 74px;
  width: 380px;
  height: 520px;
  border-radius: 16px;
  overflow: hidden;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  background: linear-gradient(160deg, #f8faff 0%, #f0f4ff 40%, #f5f8ff 100%);
  backdrop-filter: blur(24px) saturate(1.2);
  -webkit-backdrop-filter: blur(24px) saturate(1.2);
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.6) inset;
  user-select: none;
}

.lyric-panel.dragging {
  transition: none !important;
  cursor: grabbing;
  box-shadow: 0 24px 72px rgba(22, 119, 255, 0.2), 0 0 0 2px rgba(22, 119, 255, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.5) inset;
}

/* 封面图背景层 */
.lyric-cover-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

/* 封面图上的白色遮罩，保证歌词可读 */
.lyric-cover-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: rgba(255, 255, 255, 0.72);
}

.lyric-header {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  cursor: grab;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.6);
}

.lyric-header:active {
  cursor: grabbing;
}

.lyric-drag-hint {
  font-size: 12px;
  color: #ccc;
  margin-right: 8px;
  letter-spacing: -2px;
  line-height: 1;
  cursor: grab;
}

.lyric-drag-hint:hover {
  color: #999;
}

.lyric-song-info {
  min-width: 0;
  flex: 1;
}

.lyric-song-name {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: 0.3px;
}

.lyric-song-singer {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
  letter-spacing: 0.2px;
}

.lyric-close-btn {
  color: #999 !important;
  flex-shrink: 0;
  cursor: pointer;
}

.lyric-close-btn:hover {
  color: #ff4d4f !important;
  background: rgba(255, 77, 79, 0.08) !important;
}

.lyric-body {
  position: relative;
  z-index: 2;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 24px;
  scroll-behavior: smooth;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.15) transparent;
  mask-image: linear-gradient(
      180deg,
      transparent 0%,
      rgba(0, 0, 0, 0.5) 10%,
      #000 22%,
      #000 78%,
      rgba(0, 0, 0, 0.5) 90%,
      transparent 100%
  );
  -webkit-mask-image: linear-gradient(
      180deg,
      transparent 0%,
      rgba(0, 0, 0, 0.5) 10%,
      #000 22%,
      #000 78%,
      rgba(0, 0, 0, 0.5) 90%,
      transparent 100%
  );
}

.lyric-body::-webkit-scrollbar {
  width: 4px;
}

.lyric-body::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 2px;
}

.lyric-body::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

.lyric-spacer {
  height: 40%;
  min-height: 180px;
  flex-shrink: 0;
}

.lyric-empty {
  text-align: center;
  color: #bbb;
  font-size: 14px;
  padding: 60px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.lyric-empty-icon {
  font-size: 36px;
  opacity: 0.4;
  animation: lyric-pulse 2s ease-in-out infinite;
  color: #1677ff;
}

@keyframes lyric-pulse {
  0%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.1);
  }
}

.lyric-line {
  position: relative;
  text-align: center;
  padding: 10px 8px;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, opacity;
  border-radius: 8px;
}

.lyric-text {
  display: inline-block;
  font-size: 14px;
  line-height: 1.8;
  color: #444;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.9);
}

.lyric-line.near .lyric-text {
  font-size: 14px;
  color: #333;
}

.lyric-line.far .lyric-text {
  font-size: 13px;
  color: #555;
}

.lyric-line.distant .lyric-text {
  font-size: 12px;
  color: #777;
}

.lyric-line.active {
  padding: 14px 8px;
}

.lyric-line.active .lyric-text {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.6;
  color: #0958d9;
  transform: scale(1.02);
  letter-spacing: 1px;
  text-shadow: 0 1px 3px rgba(255, 255, 255, 1), 0 0 12px rgba(22, 119, 255, 0.25);
}

.lyric-line:hover .lyric-text {
  color: #1677ff !important;
}

.lyric-progress-bar {
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 3px;
  background: rgba(22, 119, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.lyric-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1677ff, #4096ff);
  border-radius: 2px;
  transition: width 0.2s linear;
}

.lyric-line:hover {
  background: rgba(22, 119, 255, 0.06);
}

/* ============ 封面旋转动画 ============ */
.rotating {
  animation: rotate 12s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* ============ 过渡动画 ============ */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.25s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.lyric-panel-enter-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.lyric-panel-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.lyric-panel-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.96);
}

.lyric-panel-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}
</style>
