import { ref, reactive, computed } from 'vue'
import api from '@/utils/api'
import { message, Modal } from 'ant-design-vue'
import { h } from 'vue'
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import { useMusicStore } from '@/stores/music'

// 歌单类型
export interface Playlist {
  id: string
  name: string
  description: string
  cover: string
  is_public: boolean
  share_code: string
  play_count: number
  song_count?: number
  created_at: string
}

// 歌单歌曲项
export interface PlaylistSongItem {
  id: string
  playlist_id: string
  music_id: string
  sort_order: number
  music: {
    id: string
    song_id?: string
    name: string
    singer: string
    album: string
    cover: string
    play_url: string
    duration: number
    origin_platform: string
  }
}

// 音乐库项
export interface MusicItem {
  id: string
  name: string
  singer: string
  album: string
  cover: string
  play_url: string
  duration: number
  origin_platform: string
  is_active: boolean
}

export type PlaylistLayout = 'card' | 'table'

/**
 * 歌单管理逻辑 composable
 * 封装歌单的增删改查、歌曲管理、播放、分享等数据操作
 */
export function usePlaylistManage() {
  const musicStore = useMusicStore()

  // ============ 视图状态 ============
  const view = ref<'list' | 'detail'>('list')

  // ============ 歌单列表 ============
  const playlists = ref<Playlist[]>([])
  const listLoading = ref(false)

  // ============ 歌单详情 ============
  const currentPlaylist = ref<Playlist | null>(null)
  const playlistSongs = ref<PlaylistSongItem[]>([])
  const detailLoading = ref(false)

  // ============ 创建/编辑表单 ============
  const formVisible = ref(false)
  const formLoading = ref(false)
  const formMode = ref<'create' | 'edit'>('create')
  const form = reactive({
    id: '',
    name: '',
    description: '',
    cover: ''
  })
  const coverFile = ref<File | null>(null)
  const coverStorage = ref<'local' | 'minio'>('local')

  // ============ 添加歌曲弹窗 ============
  const addSongsVisible = ref(false)
  const addSongsLoading = ref(false)
  const musicLibrary = ref<MusicItem[]>([])
  const musicLibraryLoading = ref(false)
  const musicKeyword = ref('')
  const selectedMusicIds = ref<string[]>([])

  // ============ 计算属性 ============
  // 已添加歌曲的 music_id 集合
  const existingMusicIds = computed(
    () => new Set(playlistSongs.value.map(s => s.music_id))
  )

  // 过滤后的音乐库
  const filteredMusic = computed(() => {
    const kw = musicKeyword.value.trim().toLowerCase()
    return musicLibrary.value.filter(m => {
      if (existingMusicIds.value.has(m.id)) return false
      if (!kw) return true
      return (
        m.name?.toLowerCase().includes(kw) ||
        m.singer?.toLowerCase().includes(kw) ||
        m.album?.toLowerCase().includes(kw)
      )
    })
  })

  // 行选择配置
  const rowSelection = computed(() => ({
    selectedRowKeys: selectedMusicIds.value,
    onChange: (keys: string[]) => {
      selectedMusicIds.value = keys
    },
    getCheckboxProps: (record: MusicItem) => ({
      disabled: existingMusicIds.value.has(record.id)
    })
  }))

  // ============ 加载歌单列表 ============
  async function loadPlaylists() {
    listLoading.value = true
    try {
      const res: any = await api.get('/playlists')
      const list = res.data?.list || res.data || []
      playlists.value = list.map((p: any) => ({
        ...p,
        created_at: p.created_at || p.createdAt
      }))
    } catch {
      message.error('加载歌单列表失败')
    } finally {
      listLoading.value = false
    }
  }

  // ============ 加载歌单详情 ============
  async function loadPlaylistDetail(id: string) {
    detailLoading.value = true
    try {
      const res: any = await api.get(`/playlists/${id}`)
      const data = res.data || {}
      const songs = data.playlistSongs || data.songs || []
      currentPlaylist.value = {
        id: data.id,
        name: data.name,
        description: data.description,
        cover: data.cover,
        is_public: data.is_public,
        share_code: data.share_code,
        play_count: data.play_count,
        song_count: songs.length || data.song_count || 0,
        created_at: data.created_at || data.createdAt
      }
      playlistSongs.value = songs
    } catch {
      message.error('加载歌单详情失败')
    } finally {
      detailLoading.value = false
    }
  }

  // ============ 视图切换 ============
  function handleViewDetail(item: Playlist) {
    view.value = 'detail'
    currentPlaylist.value = { ...item }
    playlistSongs.value = []
    loadPlaylistDetail(item.id)
  }

  function handleBackToList() {
    view.value = 'list'
    currentPlaylist.value = null
    playlistSongs.value = []
    loadPlaylists()
  }

  // ============ 创建/编辑表单 ============
  function handleOpenCreate() {
    formMode.value = 'create'
    form.id = ''
    form.name = ''
    form.description = ''
    form.cover = ''
    coverFile.value = null
    coverStorage.value = 'local'
    formVisible.value = true
  }

  function handleOpenEdit(item: Playlist) {
    formMode.value = 'edit'
    form.id = item.id
    form.name = item.name
    form.description = item.description || ''
    form.cover = item.cover || ''
    coverFile.value = null
    coverStorage.value = 'local'
    formVisible.value = true
  }

  function handleCoverSelect(info: any) {
    if (info.fileList && info.fileList.length > 0) {
      const file =
        info.fileList[info.fileList.length - 1].originFileObj ||
        info.fileList[info.fileList.length - 1]
      coverFile.value = file
    }
  }

  async function handleFormSubmit() {
    if (!form.name.trim()) {
      message.warning('请输入歌单名称')
      return false
    }
    formLoading.value = true
    try {
      if (formMode.value === 'create') {
        const res: any = await api.post('/playlists', {
          name: form.name.trim(),
          description: form.description.trim(),
          cover: form.cover.trim()
        })
        const newId = res.data?.id
        if (newId && coverFile.value) {
          const coverForm = new FormData()
          coverForm.append('cover', coverFile.value)
          coverForm.append('storage', coverStorage.value)
          await api.post(`/playlists/${newId}/cover`, coverForm, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
        }
        message.success('创建成功')
      } else {
        await api.put(`/playlists/${form.id}`, {
          name: form.name.trim(),
          description: form.description.trim(),
          cover: form.cover.trim()
        })
        if (coverFile.value) {
          const coverForm = new FormData()
          coverForm.append('cover', coverFile.value)
          coverForm.append('storage', coverStorage.value)
          await api.post(`/playlists/${form.id}/cover`, coverForm, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
        }
        message.success('更新成功')
      }
      formVisible.value = false
      if (view.value === 'list') {
        await loadPlaylists()
      } else if (currentPlaylist.value && formMode.value === 'edit') {
        await loadPlaylistDetail(currentPlaylist.value.id)
      }
      return true
    } catch {
      message.error(formMode.value === 'create' ? '创建失败' : '更新失败')
      return false
    } finally {
      formLoading.value = false
    }
  }

  // ============ 删除歌单 ============
  function handleDeletePlaylist(item: Playlist) {
    Modal.confirm({
      title: '确认删除',
      icon: h(ExclamationCircleOutlined),
      content: `确定要删除歌单「${item.name}」吗？歌单内的歌曲引用将被移除。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        try {
          await api.delete(`/playlists/${item.id}`)
          message.success('删除成功')
          loadPlaylists()
        } catch {
          message.error('删除失败')
        }
      }
    })
  }

  // ============ 复制分享链接 ============
  async function handleCopyShareLink(shareCode: string) {
    if (!shareCode) {
      message.warning('该歌单暂无分享码')
      return
    }
    const link = `${window.location.origin}/api/v1/playlists/public/${shareCode}`
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(link)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = link
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      message.success('分享链接已复制')
    } catch {
      message.error('复制失败，请手动复制：' + link)
    }
  }

  // ============ 切换歌单公开状态 ============
  async function handleTogglePublic(item: Playlist) {
    try {
      await api.put(`/playlists/${item.id}`, { is_public: !item.is_public })
      message.success(item.is_public ? '已设为私有' : '已设为公开')
      if (view.value === 'detail' && currentPlaylist.value?.id === item.id) {
        await loadPlaylistDetail(item.id)
      } else {
        loadPlaylists()
      }
    } catch {
      message.error('操作失败')
    }
  }

  // ============ 卡片菜单操作 ============
  function handleCardMenuAction(key: string, item: Playlist) {
    switch (key) {
      case 'view':
        handleViewDetail(item)
        break
      case 'edit':
        handleOpenEdit(item)
        break
      case 'toggle':
        handleTogglePublic(item)
        break
      case 'share':
        handleCopyShareLink(item.share_code)
        break
      case 'delete':
        handleDeletePlaylist(item)
        break
    }
  }

  // ============ 添加歌曲 ============
  async function handleOpenAddSongs() {
    if (!currentPlaylist.value) return
    addSongsVisible.value = true
    selectedMusicIds.value = []
    musicKeyword.value = ''
    await loadMusicLibrary()
  }

  async function loadMusicLibrary() {
    musicLibraryLoading.value = true
    try {
      const res: any = await api.get('/music', {
        params: { page: 1, pageSize: 500 }
      })
      musicLibrary.value = (res.data?.list || []).filter(
        (m: MusicItem) => m.is_active
      )
    } catch {
      message.error('加载音乐库失败')
    } finally {
      musicLibraryLoading.value = false
    }
  }

  async function handleAddSongsSubmit() {
    if (selectedMusicIds.value.length === 0) {
      message.warning('请选择要添加的歌曲')
      return false
    }
    if (!currentPlaylist.value) return false
    addSongsLoading.value = true
    try {
      const res: any = await api.post(
        `/playlists/${currentPlaylist.value.id}/songs`,
        { music_ids: selectedMusicIds.value }
      )
      const added = res.data?.added ?? 0
      const skipped = res.data?.skipped ?? 0
      if (added > 0) {
        message.success(
          `添加成功 ${added} 首${skipped > 0 ? `，跳过 ${skipped} 首已存在` : ''}`
        )
      } else {
        message.warning('没有新歌曲被添加（所选歌曲可能已存在）')
      }
      addSongsVisible.value = false
      await loadPlaylistDetail(currentPlaylist.value.id)
      return true
    } catch {
      message.error('添加歌曲失败')
      return false
    } finally {
      addSongsLoading.value = false
    }
  }

  // ============ 从歌单移除歌曲 ============
  function handleRemoveSong(record: PlaylistSongItem) {
    if (!currentPlaylist.value) return
    Modal.confirm({
      title: '确认移除',
      icon: h(ExclamationCircleOutlined),
      content: `确定要从歌单中移除「${record.music?.name || '该歌曲'}」吗？`,
      okText: '移除',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        try {
          await api.delete(
            `/playlists/${currentPlaylist.value!.id}/songs/${record.id}`
          )
          message.success('已移除')
          await loadPlaylistDetail(currentPlaylist.value!.id)
        } catch {
          message.error('移除失败')
        }
      }
    })
  }

  // ============ 播放歌单 ============
  // 将歌单歌曲项转换为音乐播放器可用的格式
  function buildPlayableList(): any[] {
    const songs: any[] = []
    playlistSongs.value.forEach(item => {
      const music = item.music
      if (!music) return
      songs.push({
        ...music,
        song_id: music.song_id || '',
        sort_order: item.sort_order,
        is_active: true,
        source: music.origin_platform,
        playlist_name: ''
      })
    })
    return songs
  }

  // 播放歌单内单首歌曲（从该曲开始播放整个歌单）
  function handlePlaySong(record: PlaylistSongItem) {
    if (!record.music?.play_url) {
      message.warning('该歌曲暂无播放链接')
      return
    }
    const songs = buildPlayableList()
    if (songs.length === 0) return
    const playIndex = songs.findIndex(s => s.id === record.music!.id)
    musicStore.setPlaylist(songs, Math.max(0, playIndex))
  }

  // 播放整个歌单
  function handlePlayAll() {
    const songs = buildPlayableList()
    const playable = songs.filter(s => s.play_url)
    if (playable.length === 0) {
      message.warning('歌单暂无可播放的歌曲')
      return
    }
    musicStore.setPlaylist(playable, 0)
  }

  return {
    // 状态
    view,
    playlists,
    listLoading,
    currentPlaylist,
    playlistSongs,
    detailLoading,
    formVisible,
    formLoading,
    formMode,
    form,
    coverFile,
    coverStorage,
    addSongsVisible,
    addSongsLoading,
    musicLibrary,
    musicLibraryLoading,
    musicKeyword,
    selectedMusicIds,
    // 计算属性
    existingMusicIds,
    filteredMusic,
    rowSelection,
    // 方法
    loadPlaylists,
    loadPlaylistDetail,
    handleViewDetail,
    handleBackToList,
    handleOpenCreate,
    handleOpenEdit,
    handleCoverSelect,
    handleFormSubmit,
    handleDeletePlaylist,
    handleCopyShareLink,
    handleTogglePublic,
    handleCardMenuAction,
    handleOpenAddSongs,
    handleAddSongsSubmit,
    handleRemoveSong,
    handlePlaySong,
    handlePlayAll
  }
}

// ============ 纯函数工具（供子组件复用） ============

// 来源平台标签文本
export function originPlatformLabel(platform: string): string {
  switch (platform) {
    case 'netease':
      return '网易云'
    case 'qq':
      return 'QQ音乐'
    case 'upload':
      return '手动上传'
    default:
      return platform || '-'
  }
}

// 来源平台标签颜色
export function originPlatformColor(platform: string): string {
  switch (platform) {
    case 'netease':
      return 'red'
    case 'qq':
      return 'orange'
    case 'upload':
      return 'purple'
    default:
      return 'default'
  }
}

// 格式化时间
export function formatTime(time: string): string {
  return time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
}

// 格式化封面 URL
export function coverUrl(cover: string): string {
  if (!cover) return ''
  if (
    cover.startsWith('http') ||
    cover.startsWith('//') ||
    cover.startsWith('/')
  ) {
    return cover.startsWith('//') ? `https:${cover}` : cover
  }
  return cover
}
