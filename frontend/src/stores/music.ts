import { defineStore } from 'pinia'
import { ref, computed, shallowRef } from 'vue'
import { Howl } from 'howler'
import api from '@/utils/api'

export interface MusicItem {
  id: string
  song_id?: string
  name: string
  singer: string
  album: string
  cover: string
  play_url: string
  duration: number
  origin_platform: string
  playlist_name?: string
  lyric?: string
}

export type PlayMode = 'list' | 'random' | 'single'

/** LRC 一行：时间戳 + 文本 */
interface LrcLine {
  time: number
  text: string
}

/** 解析 LRC 文本为带时间戳的歌词行数组 */
function parseLrc(lrc: string): LrcLine[] {
  if (!lrc) return []
  const lines = lrc.split(/\r?\n/)
  const result: LrcLine[] = []
  const tagRe = /\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g
  for (const raw of lines) {
    const text = raw.replace(tagRe, '').trim()
    if (!text) continue
    tagRe.lastIndex = 0
    let m: RegExpExecArray | null
    const matches: number[] = []
    while ((m = tagRe.exec(raw)) !== null) {
      const mm = parseInt(m[1], 10)
      const ss = parseInt(m[2], 10)
      const ms = m[3] ? parseInt(m[3].padEnd(3, '0'), 10) : 0
      matches.push(mm * 60 + ss + ms / 1000)
    }
    if (matches.length === 0) continue
    for (const t of matches) result.push({ time: t, text })
  }
  result.sort((a, b) => a.time - b.time)
  return result
}

export const useMusicStore = defineStore('music', () => {
  // 播放列表
  const playlist = ref<MusicItem[]>([])
  // 当前播放索引
  const currentIndex = ref(-1)
  // 播放状态
  const isPlaying = ref(false)
  // 播放模式：列表循环 / 单曲循环 / 随机
  const playMode = ref<PlayMode>('list')
  // 当前歌词（LRC 原文）
  const currentLyric = ref('')
  // 已解析的歌词行
  const lrcLines = ref<LrcLine[]>([])
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
  // 当前播放时间（秒）
  const currentTime = ref(0)
  // 当前歌曲总时长（秒）
  const duration = ref(0)
  // 音量（0-1）
  const volume = ref(0.7)
  // 当前播放列表名称（来自公开歌单）
  const playlistName = ref('')
  // 是否显示播放列表抽屉（旧：保留向后兼容；新播放器内嵌列表无需此字段）
  const isPlaylistDrawerOpen = ref(false)
  // 侧边播放器是否展开（左侧面板）
  const sidebarOpen = ref(false)
  // 随机播放开关（UI 层：和 playMode === 'random' 互相同步）
  const isRandomMode = computed(() => playMode.value === 'random')

  // Howl 实例使用 shallowRef 避免 Vue 深度代理
  const howl = shallowRef<Howl | null>(null)
  // 进度轮询定时器
  let progressTimer: number | null = null

  const currentSong = computed(() =>
    currentIndex.value >= 0 && currentIndex.value < playlist.value.length
      ? playlist.value[currentIndex.value]
      : null
  )

  const playlistCount = computed(() => playlist.value.length)

  /** 根据当前播放时间获取单行歌词 */
  const currentLyricLine = computed(() => {
    if (lrcLines.value.length === 0) return ''
    const t = currentTime.value
    let line = ''
    for (const item of lrcLines.value) {
      if (item.time <= t) line = item.text
      else break
    }
    return line
  })

  /** 进度百分比（0-100） */
  const progressPercent = computed(() => {
    if (duration.value <= 0) return 0
    return Math.min(100, (currentTime.value / duration.value) * 100)
  })

  /** 停止进度轮询 */
  function stopProgressTimer() {
    if (progressTimer !== null) {
      clearInterval(progressTimer)
      progressTimer = null
    }
  }

  /** 启动进度轮询 */
  function startProgressTimer() {
    stopProgressTimer()
    progressTimer = window.setInterval(() => {
      if (howl.value) {
        currentTime.value = howl.value.seek() as number
      }
    }, 250)
  }

  /** 卸载当前 Howl 实例 */
  function unloadHowl() {
    stopProgressTimer()
    if (howl.value) {
      try {
        howl.value.unload()
      } catch {
        /* noop */
      }
      howl.value = null
    }
  }

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

  /** 加载公开歌单并替换当前播放列表 */
  async function loadPlaylist(shareCode: string, autoPlay = false) {
    if (isLoading.value) return
    isLoading.value = true
    errorMsg.value = ''
    try {
      const res = await api.get(`/playlists/public/${shareCode}`)
      const d = res.data?.data || res.data
      const songs: any[] = d?.songs || []
      playlistName.value = d?.name || ''
      const items: MusicItem[] = songs
        .filter((s: any) => !!s?.play_url)
        .map((s: any) => ({
          id: String(s.id),
          name: s.name || '',
          singer: s.singer || '',
          album: s.album || '',
          cover: s.cover || '',
          play_url: s.play_url,
          duration: Number(s.duration) || 0,
          origin_platform: s.origin_platform || '',
          playlist_name: d?.name || '',
          lyric: s.lyric || '',
        }))
      playlist.value = items
      libraryLoaded.value = true
      if (items.length > 0) {
        isActivated.value = true
        isExpanded.value = true
        playByIndex(0, autoPlay)
      }
    } catch (e: any) {
      errorMsg.value = '加载歌单失败'
      console.error('[music] loadPlaylist error', e)
    } finally {
      isLoading.value = false
    }
  }

  /** 加载当前歌曲歌词（优先用歌曲自带 lyric 字段，无则请求接口） */
  async function loadLyric(song: MusicItem) {
    if (!song) {
      currentLyric.value = ''
      lrcLines.value = []
      return
    }
    // 优先用歌单接口已返回的 lyric 字段
    if (song.lyric) {
      currentLyric.value = song.lyric
      lrcLines.value = parseLrc(song.lyric)
      return
    }
    try {
      const res = await api.get(`/music/public/lyric/${song.id}`)
      const d = res.data?.data || res.data
      const lrc = d?.lrc || ''
      currentLyric.value = lrc
      lrcLines.value = parseLrc(lrc)
    } catch {
      currentLyric.value = ''
      lrcLines.value = []
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

  /** 内部：根据当前歌曲创建 Howl 实例 */
  function createHowl(song: MusicItem, autoPlay: boolean) {
    unloadHowl()
    if (!song.play_url) return
    const instance = new Howl({
      src: [song.play_url],
      html5: true,
      volume: volume.value,
      format: ['mp3', 'flac', 'wav', 'ogg', 'm4a'],
      onload: () => {
        duration.value = instance.duration() || song.duration || 0
      },
      onplay: () => {
        isPlaying.value = true
        startProgressTimer()
      },
      onpause: () => {
        isPlaying.value = false
        stopProgressTimer()
      },
      onstop: () => {
        isPlaying.value = false
        stopProgressTimer()
      },
      onend: () => {
        stopProgressTimer()
        onSongEnded()
      },
      onplayerror: () => {
        // 浏览器自动播放限制：保持暂停态，等待用户点击
        isPlaying.value = false
      },
      onloaderror: async () => {
        // 链接失效时尝试刷新一次
        const newUrl = await refreshUrl(song)
        if (newUrl && newUrl !== song.play_url) {
          song.play_url = newUrl
          createHowl(song, autoPlay)
        } else {
          errorMsg.value = '音频加载失败：' + song.name
          isPlaying.value = false
        }
      },
    })
    howl.value = instance
    if (autoPlay) {
      instance.play()
    }
  }

  /** 播放指定索引的歌曲 */
  function playByIndex(index: number, autoPlay = true) {
    if (index < 0 || index >= playlist.value.length) return
    currentIndex.value = index
    isActivated.value = true
    isExpanded.value = true
    currentTime.value = 0
    duration.value = playlist.value[index].duration || 0
    const song = playlist.value[index]
    loadLyric(song)
    createHowl(song, autoPlay)
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
    if (!howl.value) {
      // 未创建实例时直接播放
      playByIndex(currentIndex.value, true)
      return
    }
    if (isPlaying.value) {
      howl.value.pause()
    } else {
      howl.value.play()
    }
  }

  /** 切换播放模式 */
  function cyclePlayMode() {
    const order: PlayMode[] = ['list', 'single', 'random']
    const idx = order.indexOf(playMode.value)
    playMode.value = order[(idx + 1) % order.length]
  }

  /** 当前歌曲播放结束（由 Howl 'end' 事件触发） */
  function onSongEnded() {
    if (playMode.value === 'single') {
      // 单曲循环：重新播放当前歌曲
      playByIndex(currentIndex.value, true)
    } else {
      next()
    }
  }

  /** 跳转到指定时间（秒） */
  function seek(time: number) {
    if (!howl.value) return
    howl.value.seek(time)
    currentTime.value = time
  }

  /** 设置音量（0-1） */
  function setVolume(v: number) {
    const val = Math.max(0, Math.min(1, v))
    volume.value = val
    if (howl.value) howl.value.volume(val)
  }

  /** 最小化播放器（变为悬浮球） */
  function minimize() {
    isExpanded.value = false
  }

  /** 展开播放器 */
  function expand() {
    isExpanded.value = true
  }

  /** 打开/关闭播放列表抽屉 */
  function togglePlaylistDrawer(val?: boolean) {
    isPlaylistDrawerOpen.value = val ?? !isPlaylistDrawerOpen.value
  }

  /** 展开/收起左侧播放器侧边面板 */
  function toggleSidebar(val?: boolean) {
    sidebarOpen.value = val ?? !sidebarOpen.value
    if (sidebarOpen.value) {
      isExpanded.value = true
    }
  }

  /** 切换随机播放开关（与 playMode 联动：开启 → random，关闭 → 退回 list） */
  function toggleRandomMode() {
    if (playMode.value === 'random') {
      playMode.value = 'list'
    } else {
      playMode.value = 'random'
    }
  }

  /** 从播放列表移除指定歌曲 */
  function removeFromPlaylist(index: number) {
    if (index < 0 || index >= playlist.value.length) return
    const wasPlaying = isPlaying.value
    playlist.value.splice(index, 1)
    if (playlist.value.length === 0) {
      // 列表清空：停止播放
      unloadHowl()
      currentIndex.value = -1
      isPlaying.value = false
      currentLyric.value = ''
      lrcLines.value = []
      currentTime.value = 0
      duration.value = 0
      isExpanded.value = false
      isPlaylistDrawerOpen.value = false
      return
    }
    if (index < currentIndex.value) {
      // 移除在当前之前的歌曲：索引前移
      currentIndex.value -= 1
    } else if (index === currentIndex.value) {
      // 移除的就是当前歌曲：重新加载同位置新歌曲
      const newIndex = Math.min(index, playlist.value.length - 1)
      currentIndex.value = newIndex
      playByIndex(newIndex, wasPlaying)
    }
    // index > currentIndex：当前歌曲索引不变，无需操作
  }

  /** 清理资源（组件卸载时调用） */
  function cleanup() {
    unloadHowl()
  }

  return {
    // state
    playlist,
    currentIndex,
    isPlaying,
    playMode,
    currentLyric,
    lrcLines,
    isExpanded,
    isActivated,
    libraryLoaded,
    isLoading,
    errorMsg,
    currentTime,
    duration,
    volume,
    playlistName,
    isPlaylistDrawerOpen,
    sidebarOpen,
    // computed
    currentSong,
    playlistCount,
    currentLyricLine,
    progressPercent,
    isRandomMode,
    // actions
    loadLibrary,
    loadPlaylist,
    loadLyric,
    refreshUrl,
    playByIndex,
    playSong,
    playPlaylist,
    next,
    prev,
    togglePlay,
    cyclePlayMode,
    onSongEnded,
    seek,
    setVolume,
    minimize,
    expand,
    togglePlaylistDrawer,
    toggleSidebar,
    toggleRandomMode,
    removeFromPlaylist,
    cleanup,
  }
})
