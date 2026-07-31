import {defineStore} from 'pinia'
import api from '@/utils/api'
import {message} from 'ant-design-vue'

export interface MusicItem {
  id: string
  song_id: string
  name: string
  singer: string
  album: string
  cover: string
  play_url: string
  duration: number
  sort_order: number
  is_active: boolean
  source: string
  origin_platform: string
  playlist_name: string
  created_at: string
}

// 循环模式：列表循环 → 单曲循环 → 随机播放
export type PlayMode = 'list' | 'single' | 'shuffle'

interface MusicState {
  playlist: MusicItem[]          // 播放列表
  currentIndex: number           // 当前播放索引
  isPlaying: boolean             // 播放状态
  currentTime: number            // 当前播放时间（秒）
  duration: number               // 当前歌曲总时长（秒）
  volume: number                 // 音量 0-1
  playMode: PlayMode             // 循环模式
  isMinimized: boolean           // 是否最小化（悬浮球形态）
  isPlayerVisible: boolean       // 播放器是否显示（有歌曲时才显示）
  isLoadingList: boolean         // 列表加载中
  currentLyric: string           // 当前歌词文本（LRC）
  showLyric: boolean             // 是否显示歌词面板
  playbackToken: number          // 播放令牌，每次 setPlaylist/playSingle 递增，用于强制触发播放器重新加载
}

export const useMusicStore = defineStore('music', {
  state: (): MusicState => ({
    playlist: [],
    currentIndex: -1,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    playMode: 'list',
    isMinimized: false,
    isPlayerVisible: false,
    isLoadingList: false,
    currentLyric: '',
    showLyric: false,
    playbackToken: 0
  }),

  getters: {
    currentSong: (state): MusicItem | null => {
      return state.currentIndex >= 0 && state.currentIndex < state.playlist.length
        ? state.playlist[state.currentIndex]
        : null
    },
    hasNext: (state): boolean => {
      return state.playlist.length > 1
    },
    hasPrev: (state): boolean => {
      return state.playlist.length > 1
    },
    playlistCount: (state): number => state.playlist.length
  },

  actions: {
    /**
     * 加载音乐库全部已启用歌曲作为播放列表
     * 若提供 startId，则从该歌曲开始播放
     */
    async loadLibrary(startId?: string) {
      this.isLoadingList = true
      try {
        const res: any = await api.get('/music', {
          params: {is_active: true, pageSize: 500}
        })
        const list: MusicItem[] = res.data?.data?.list || res.data?.list || []
        if (list.length === 0) {
          message.info('音乐库暂无可用歌曲')
          return
        }
        this.playlist = list
        // 计算起始索引
        if (startId) {
          const idx = list.findIndex(s => s.id === startId)
          this.currentIndex = idx >= 0 ? idx : 0
        } else if (this.currentIndex < 0 || this.currentIndex >= list.length) {
          this.currentIndex = 0
        }
        this.isPlayerVisible = true
        this.isPlaying = true
        this.playbackToken++  // 强制触发播放器重新加载
        // 预加载歌词
        this.fetchLyric()
      } catch {
        message.error('加载音乐库失败')
      } finally {
        this.isLoadingList = false
      }
    },

    /**
     * 单首播放（不影响现有列表，若歌曲已在列表则切换，否则插入）
     */
    playSingle(song: MusicItem) {
      const idx = this.playlist.findIndex(s => s.id === song.id)
      if (idx >= 0) {
        this.currentIndex = idx
      } else {
        this.playlist.push(song)
        this.currentIndex = this.playlist.length - 1
      }
      this.isPlayerVisible = true
      this.isPlaying = true
      this.currentTime = 0
      this.playbackToken++  // 强制触发播放器重新加载
      this.fetchLyric()
    },

    /**
     * 设置播放列表并从第一首开始
     */
    setPlaylist(list: MusicItem[], startIndex = 0) {
      this.playlist = list
      this.currentIndex = Math.max(0, Math.min(startIndex, list.length - 1))
      this.isPlayerVisible = true
      this.isPlaying = true
      this.currentTime = 0
      this.playbackToken++  // 强制触发播放器重新加载
      this.fetchLyric()
    },

    togglePlay() {
      if (this.currentIndex < 0) return
      this.isPlaying = !this.isPlaying
    },

    play() {
      if (this.currentIndex < 0) return
      this.isPlaying = true
    },

    pause() {
      this.isPlaying = false
    },

    next() {
      if (this.playlist.length === 0) return
      if (this.playMode === 'single') {
        // 单曲循环：索引不变，重置时间，保持播放状态
        // 实际重播由组件 onEnded 处理（audioEl.currentTime = 0 + play）
        this.currentTime = 0
        this.isPlaying = true
        return
      }
      if (this.playMode === 'shuffle') {
        // 随机播放
        if (this.playlist.length === 1) {
          this.currentTime = 0
          this.isPlaying = true
          return
        }
        let nextIdx = this.currentIndex
        while (nextIdx === this.currentIndex) {
          nextIdx = Math.floor(Math.random() * this.playlist.length)
        }
        this.currentIndex = nextIdx
      } else {
        // 列表循环
        this.currentIndex = (this.currentIndex + 1) % this.playlist.length
      }
      this.currentTime = 0
      this.isPlaying = true
      this.playbackToken++  // 强制触发播放器重新加载
      this.fetchLyric()
    },

    prev() {
      if (this.playlist.length === 0) return
      if (this.playMode === 'shuffle') {
        this.next()
        return
      }
      this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length
      this.currentTime = 0
      this.isPlaying = true
      this.playbackToken++  // 强制触发播放器重新加载
      this.fetchLyric()
    },

    /**
     * 跳到指定索引播放
     */
    jumpTo(index: number) {
      if (index < 0 || index >= this.playlist.length) return
      this.currentIndex = index
      this.currentTime = 0
      this.isPlaying = true
      this.playbackToken++  // 强制触发播放器重新加载
      this.fetchLyric()
    },

    setCurrentTime(time: number) {
      this.currentTime = time
    },

    setDuration(d: number) {
      this.duration = d
    },

    setVolume(v: number) {
      this.volume = Math.max(0, Math.min(1, v))
    },

    togglePlayMode() {
      const modes: PlayMode[] = ['list', 'single', 'shuffle']
      const idx = modes.indexOf(this.playMode)
      this.playMode = modes[(idx + 1) % modes.length]
    },

    minimize() {
      this.isMinimized = true
    },

    expand() {
      this.isMinimized = false
    },

    toggleMinimize() {
      this.isMinimized = !this.isMinimized
    },

    closePlayer() {
      this.isPlaying = false
      this.isPlayerVisible = false
      this.currentTime = 0
      this.currentIndex = -1
      this.currentLyric = ''
    },

    /**
     * 播放链接失效时自动刷新
     * 手动上传的音乐不走音乐 API 刷新
     */
    async refreshCurrentUrl(): Promise<string | null> {
      const song = this.currentSong
      if (!song) return null
      // 手动上传的音乐：链接为本地/MinIO 存储，不走第三方音乐 API
      if (song.origin_platform === 'upload') {
        message.info('手动上传的音乐无需刷新链接，请检查文件是否被删除')
        return null
      }
      try {
        const res: any = await api.put(`/music/refresh-url/${song.id}`)
        const newUrl = res.data?.data?.play_url || res.data?.play_url
        if (newUrl) {
          // 更新列表中的链接
          const idx = this.currentIndex
          if (idx >= 0) {
            this.playlist[idx] = {...this.playlist[idx], play_url: newUrl}
          }
          if (res.data?.data?.fallback || res.data?.fallback) {
            message.info('原链接失效，已回退网易云获取新链接')
          }
          return newUrl
        }
        return null
      } catch {
        message.error('链接刷新失败（VIP 歌曲或版权限制）')
        return null
      }
    },

    /**
     * 获取当前歌曲歌词
     */
    async fetchLyric() {
      const song = this.currentSong
      if (!song) {
        this.currentLyric = ''
        return
      }
      // 手动上传的歌曲：直接使用数据库中的 lyric 字段（如果有）
      if (song.origin_platform === 'upload') {
        // 需要单独请求获取 lyric 字段（列表接口未返回）
        try {
          const res: any = await api.get(`/music/lyric/${song.id}`)
          const data = res.data?.data || res.data
          this.currentLyric = data?.lrc || ''
        } catch {
          this.currentLyric = ''
        }
        return
      }
      try {
        const res: any = await api.get(`/music/lyric/${song.id}`)
        const data = res.data?.data || res.data
        this.currentLyric = data?.lrc || ''
      } catch {
        this.currentLyric = ''
      }
    },

    toggleLyric() {
      this.showLyric = !this.showLyric
    }
  }
})
