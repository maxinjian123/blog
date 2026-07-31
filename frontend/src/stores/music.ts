import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/utils/api'

export interface MusicItem {
  id: string
  song_id: string
  name: string
  singer: string
  album: string
  cover: string
  play_url: string
  duration: number
  origin_platform: string
  playlist_name: string
}

export type PlayMode = 'list' | 'random' | 'single'

export const useMusicStore = defineStore('music', () => {
  // 播放列表
  const playlist = ref<MusicItem[]>([])
  // 当前播放索引
  const currentIndex = ref(-1)
  // 播放状态
  const isPlaying = ref(false)
  // 播放模式：列表循环 / 单曲循环 / 随机
  const playMode = ref<PlayMode>('list')
  // 当前歌词（LRC 文本）
  const currentLyric = ref('')
  // 是否显示完整播放器（false 时只显示悬浮球）
  const isExpanded = ref(false)
  // 播放器是否已激活（曾经播放过任何歌曲）
  const isActivated = ref(false)
  // 库已加载标记（避免重复请求）
  const libraryLoaded = ref(false)
  // 库加载中
  const isLoading = ref(false)
  // 错误信息
  const errorMsg = ref('')

  const currentSong = computed(() =>
    currentIndex.value >= 0 && currentIndex.value < playlist.value.length
      ? playlist.value[currentIndex.value]
      : null
  )

  const playlistCount = computed(() => playlist.value.length)

  /** 加载音乐库中所有启用的歌曲 */
  async function loadLibrary(force = false) {
    if (libraryLoaded.value && !force) return
    if (isLoading.value) return
    isLoading.value = true
    errorMsg.value = ''
    try {
      const res = await api.get('/music/public', { params: { limit: 500 } })
      const d = res.data?.data || res.data
      playlist.value = (d?.list || []).filter((s: MusicItem) => !!s.play_url)
      libraryLoaded.value = true
    } catch (e: any) {
      errorMsg.value = '加载音乐库失败'
      console.error('[music] loadLibrary error', e)
    } finally {
      isLoading.value = false
    }
  }

  /** 加载当前歌曲歌词 */
  async function loadLyric(song: MusicItem) {
    if (!song) {
      currentLyric.value = ''
      return
    }
    try {
      const res = await api.get(`/music/public/lyric/${song.id}`)
      const d = res.data?.data || res.data
      currentLyric.value = d?.lrc || ''
    } catch {
      currentLyric.value = ''
    }
  }

  /** 刷新播放链接（失效时调用） */
  async function refreshUrl(song: MusicItem): Promise<string> {
    try {
      const res = await api.put(`/music/public/refresh-url/${song.id}`)
      const d = res.data?.data || res.data
      const newUrl = d?.play_url || ''
      if (newUrl) {
        // 同步更新本地缓存
        const idx = playlist.value.findIndex(s => s.id === song.id)
        if (idx >= 0) {
          playlist.value[idx] = { ...playlist.value[idx], play_url: newUrl }
        }
      }
      return newUrl
    } catch {
      return ''
    }
  }

  /** 播放指定索引的歌曲 */
  function playByIndex(index: number) {
    if (index < 0 || index >= playlist.value.length) return
    currentIndex.value = index
    isPlaying.value = true
    isActivated.value = true
    isExpanded.value = true
    loadLyric(playlist.value[index])
  }

  /** 播放指定歌曲（若不在列表中则加入列表） */
  function playSong(song: MusicItem) {
    const idx = playlist.value.findIndex(s => s.id === song.id)
    if (idx >= 0) {
      playByIndex(idx)
    } else {
      playlist.value.push(song)
      playByIndex(playlist.value.length - 1)
    }
  }

  /** 播放整个列表（重置列表） */
  function playPlaylist(list: MusicItem[], startIndex = 0) {
    playlist.value = [...list]
    if (list.length > 0) {
      playByIndex(Math.max(0, Math.min(startIndex, list.length - 1)))
    }
  }

  /** 下一首（根据播放模式） */
  function next() {
    if (playlist.value.length === 0) return
    if (playMode.value === 'random') {
      const r = Math.floor(Math.random() * playlist.value.length)
      playByIndex(r)
    } else {
      const nextIdx = (currentIndex.value + 1) % playlist.value.length
      playByIndex(nextIdx)
    }
  }

  /** 上一首 */
  function prev() {
    if (playlist.value.length === 0) return
    const prevIdx = (currentIndex.value - 1 + playlist.value.length) % playlist.value.length
    playByIndex(prevIdx)
  }

  /** 切换播放/暂停 */
  function togglePlay() {
    if (!currentSong.value) return
    isPlaying.value = !isPlaying.value
  }

  /** 切换播放模式 */
  function cyclePlayMode() {
    const order: PlayMode[] = ['list', 'single', 'random']
    const idx = order.indexOf(playMode.value)
    playMode.value = order[(idx + 1) % order.length]
  }

  /** 当前歌曲播放结束（由 audio 标签触发） */
  function onSongEnded() {
    if (playMode.value === 'single') {
      // 单曲循环：重新播放当前歌曲
      isPlaying.value = false
      // 短暂延时后重新播放，触发 audio 重新加载
      setTimeout(() => {
        isPlaying.value = true
      }, 50)
    } else {
      next()
    }
  }

  /** 最小化播放器 */
  function minimize() {
    isExpanded.value = false
  }

  /** 展开播放器 */
  function expand() {
    isExpanded.value = true
  }

  /** 从播放列表移除指定歌曲 */
  function removeFromPlaylist(index: number) {
    if (index < 0 || index >= playlist.value.length) return
    const wasCurrent = index === currentIndex.value
    playlist.value.splice(index, 1)
    if (playlist.value.length === 0) {
      currentIndex.value = -1
      isPlaying.value = false
      currentLyric.value = ''
      return
    }
    if (index < currentIndex.value) {
      currentIndex.value -= 1
    } else if (index === currentIndex.value) {
      // 移除的就是