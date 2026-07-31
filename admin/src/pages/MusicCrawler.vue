<script setup lang="ts">
import {computed, h, onMounted, ref} from 'vue'
import api from '@/utils/api'
import {message, Modal} from 'ant-design-vue'
import {
  CaretRightOutlined,
  CheckCircleFilled,
  CloudDownloadOutlined,
  CustomerServiceOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  ImportOutlined,
  MoreOutlined,
  PictureOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  StopOutlined,
  SwapOutlined,
  UnorderedListOutlined,
  UploadOutlined
} from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import {useMusicStore} from '@/stores/music'
import PlaylistManage from './PlaylistManage.vue'

// 媒体库选择模式辅助函数
function formatSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

function formatDateTime(time: string): string {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const musicStore = useMusicStore()

type Tab = 'search' | 'playlist' | 'library' | 'playlists'

interface Song {
  song_mid: string
  song_id: string | number
  name: string
  singer: string
  album_name: string
  cover: string
  duration: number
  is_vip: boolean
  _selected?: boolean
}

interface MusicItem {
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
  lyric?: string
}

const activeTab = ref<Tab>('search')

// 平台选择
type Platform = 'netease' | 'qq'
const platforms = ref<{ id: Platform, label: string }[]>([
  {id: 'netease', label: '网易云音乐'},
  {id: 'qq', label: 'QQ音乐'}
])
const searchPlatform = ref<Platform>('netease')
const playlistPlatform = ref<Platform>('netease')

// 歌曲搜索
const searchKeyword = ref('')
const searchLoading = ref(false)
const searchSongs = ref<Song[]>([])

// 歌单导入
const playlistInput = ref('')
const playlistLoading = ref(false)
const playlistSongs = ref<Song[]>([])
const playlistName = ref('')

// 音乐库
const library = ref<MusicItem[]>([])
const libraryLoading = ref(false)
const libraryKeyword = ref('')
const libraryPage = ref(1)
const libraryPageSize = ref(20)
const libraryTotal = ref(0)

// 预览播放
const previewUrl = ref('')
const previewName = ref('')
const previewVisible = ref(false)
const previewLoading = ref(false)
const previewPlaying = ref(false)
const previewCurrentTime = ref(0)
const previewDuration = ref(0)
const previewVolume = ref(1)
const previewAudioEl = ref<HTMLAudioElement | null>(null)
let previewRafId: number | null = null

function formatPreviewTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function togglePreviewPlay() {
  const audio = previewAudioEl.value
  if (!audio) return
  if (audio.paused) {
    audio.play()
  } else {
    audio.pause()
  }
}

function onPreviewPlay() {
  previewPlaying.value = true
  startPreviewTimeSync()
}

function onPreviewPause() {
  previewPlaying.value = false
  stopPreviewTimeSync()
}

function onPreviewLoadedMetadata() {
  const audio = previewAudioEl.value
  if (audio) {
    previewDuration.value = audio.duration
  }
}

function onPreviewEnded() {
  previewPlaying.value = false
  previewCurrentTime.value = 0
  stopPreviewTimeSync()
}

function syncPreviewTime() {
  if (previewAudioEl.value && !previewAudioEl.value.paused) {
    previewCurrentTime.value = previewAudioEl.value.currentTime
  }
  previewRafId = requestAnimationFrame(syncPreviewTime)
}

function startPreviewTimeSync() {
  if (previewRafId === null) {
    previewRafId = requestAnimationFrame(syncPreviewTime)
  }
}

function stopPreviewTimeSync() {
  if (previewRafId !== null) {
    cancelAnimationFrame(previewRafId)
    previewRafId = null
  }
}

function handlePreviewSeek(e: MouseEvent) {
  const audio = previewAudioEl.value
  if (!audio || !previewDuration.value) return
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  const newTime = percent * previewDuration.value
  audio.currentTime = newTime
  previewCurrentTime.value = newTime
}

function handleVolumeChange(e: MouseEvent) {
  const audio = previewAudioEl.value
  if (!audio) return
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  audio.volume = percent
  previewVolume.value = percent
}

function onPreviewCancel() {
  previewUrl.value = ''
  previewPlaying.value = false
  previewCurrentTime.value = 0
  previewDuration.value = 0
  stopPreviewTimeSync()
}

// 手动上传
const uploadVisible = ref(false)
const uploadLoading = ref(false)
const uploadForm = ref({
  name: '',
  singer: '',
  album: '',
  storage: 'local' as 'local' | 'minio'
})
// 从媒体库选择模式
const uploadMode = ref<'file' | 'media'>('file')
const mediaMp3List = ref<any[]>([])
const mediaMp3Loading = ref(false)
const selectedMediaId = ref('')

async function fetchMediaMp3List() {
  mediaMp3Loading.value = true
  try {
    const res: any = await api.get('/media', { params: { mime: 'audio', pageSize: 200 } })
    const data = res.data || res
    mediaMp3List.value = (data?.list || []).map((item: any) => ({
      ...item,
      created_at: item.created_at || item.createdAt
    }))
  } catch {
    message.error('获取媒体库文件失败')
  } finally {
    mediaMp3Loading.value = false
  }
}

// 编辑音乐
const editVisible = ref(false)
const editLoading = ref(false)
const editForm = ref({
  id: '',
  name: '',
  singer: '',
  album: '',
  cover: '',
  play_url: '',
  storage: 'local' as 'local' | 'minio'
})
const editCoverFile = ref<File | null>(null)
const editLyricFile = ref<File | null>(null)
const editHasLyric = ref(false)

// 存储迁移
const migrateLoading = ref(false)
const uploadFileList = ref<File | null>(null)
const uploadCoverFile = ref<File | null>(null)
const uploadLyricFile = ref<File | null>(null)
const uploadDuration = ref<number>(0)

// 保存到服务器（单首弹窗）
const saveRemoteVisible = ref(false)
const saveRemoteLoading = ref(false)
const saveRemoteSong = ref<Song | null>(null)
const saveRemoteStorage = ref<'local' | 'minio'>('local')
const saveRemotePlatform = ref<Platform>('netease')

// 批量导入弹窗
const importVisible = ref(false)
const importLoading = ref(false)
const importStorage = ref<'local' | 'minio'>('local')
const importProgress = ref({current: 0, total: 0, name: ''})
const importSongs = ref<Song[]>([])
const importPlaylistName = ref('')
const importPlatform = ref<Platform>('netease')

const songColumns = [
  {title: '', key: 'index', width: 50, align: 'center' as const},
  {title: '歌曲名', dataIndex: 'name', key: 'name', ellipsis: true},
  {title: '歌手', dataIndex: 'singer', key: 'singer', width: 180, ellipsis: true},
  {title: '专辑', dataIndex: 'album_name', key: 'album_name', width: 180, ellipsis: true},
  {
    title: '时长',
    dataIndex: 'duration',
    key: 'duration',
    width: 80,
    customRender: ({text}: { text: number }) => {
      if (!text) return '-'
      const m = Math.floor(text / 60)
      const s = text % 60
      return `${m}:${String(s).padStart(2, '0')}`
    }
  },
  {title: '权限', key: 'is_vip', width: 70, align: 'center' as const},
  {title: '操作', key: 'action', width: 120, align: 'center' as const}
]

const libraryColumns = [
  {title: '封面', key: 'cover', width: 70, align: 'center' as const},
  {title: '歌名', dataIndex: 'name', key: 'name', width: 130, ellipsis: true},
  {title: '歌手', dataIndex: 'singer', key: 'singer', width: 130, ellipsis: true},
  {title: '专辑', dataIndex: 'album', key: 'album', width: 130, ellipsis: true},
  {
    title: '时长',
    dataIndex: 'duration',
    key: 'duration',
    width: 70,
    customRender: ({text}: { text: number }) => {
      if (!text) return '-'
      const m = Math.floor(text / 60)
      const s = text % 60
      return `${m}:${String(s).padStart(2, '0')}`
    }
  },
  {title: '播放链接', dataIndex: 'play_url', key: 'play_url', width: 300, ellipsis: true},
  {title: '状态', dataIndex: 'is_active', key: 'is_active', width: 70, align: 'center' as const},
  {title: '存储位置', dataIndex: 'source', key: 'source', width: 90, align: 'center' as const},
  {title: '原始来源', dataIndex: 'origin_platform', key: 'origin_platform', width: 100, align: 'center' as const},
  {
    title: '导入时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 140,
    customRender: ({text}: { text: string }) => text ? dayjs(text).format('YYYY-MM-DD HH:mm') : '-'
  },
  {title: '操作', key: 'action', width: 90, align: 'center' as const}
]

// 歌曲搜索
async function handleSearchSongs() {
  if (!searchKeyword.value.trim()) {
    message.warning('请输入搜索关键词')
    return
  }
  searchLoading.value = true
  try {
    const res: any = await api.get('/music/search-songs', {
      params: {keyword: searchKeyword.value, pageSize: 30, platform: searchPlatform.value}
    })
    searchSongs.value = (res.data?.list || []).map((s: Song) => ({...s, _selected: false}))
    if (searchSongs.value.length === 0) {
      message.info('未找到相关歌曲')
    }
  } catch {
    message.error('搜索失败')
  } finally {
    searchLoading.value = false
  }
}

// 歌单导入
async function handleLoadPlaylist() {
  if (!playlistInput.value.trim()) {
    message.warning('请输入歌单 ID 或链接')
    return
  }
  playlistLoading.value = true
  playlistSongs.value = []
  try {
    const res: any = await api.get(`/music/playlist/${encodeURIComponent(playlistInput.value.trim())}`, {
      params: {platform: playlistPlatform.value}
    })
    const data = res.data
    playlistName.value = data?.dissname || ''
    playlistSongs.value = (data?.songs || []).map((s: Song) => ({...s, _selected: false}))
    if (playlistSongs.value.length === 0) {
      message.info('歌单为空或加载失败')
    } else {
      message.success(`加载成功，共 ${playlistSongs.value.length} 首歌曲`)
    }
  } catch {
    message.error('加载歌单失败，请检查 ID 或链接是否正确')
  } finally {
    playlistLoading.value = false
  }
}

// 选中的歌曲
const selectedSearchSongs = computed(() => searchSongs.value.filter(s => s._selected))
const selectedPlaylistSongs = computed(() => playlistSongs.value.filter(s => s._selected))

// 全选
const searchSelectAll = computed({
  get: () => searchSongs.value.length > 0 && searchSongs.value.every(s => s._selected),
  set: (val: boolean) => searchSongs.value.forEach(s => {
    s._selected = val
  })
})

const playlistSelectAll = computed({
  get: () => playlistSongs.value.length > 0 && playlistSongs.value.every(s => s._selected),
  set: (val: boolean) => playlistSongs.value.forEach(s => {
    s._selected = val
  })
})

// 导入歌曲 - 打开弹窗选择保存源
function handleImport(songs: Song[], playlistName: string, platform: Platform) {
  const selected = songs.filter(s => s._selected)
  if (selected.length === 0) {
    message.warning('请选择要导入的歌曲')
    return
  }
  importSongs.value = selected
  importPlaylistName.value = playlistName
  importPlatform.value = platform
  importStorage.value = 'local'
  importProgress.value = {current: 0, total: selected.length, name: ''}
  importVisible.value = true
}

// 确认导入 - 逐首保存到服务器
async function handleImportSubmit() {
  importLoading.value = true
  let successCount = 0
  let failCount = 0
  let fallbackCount = 0

  for (let i = 0; i < importSongs.value.length; i++) {
    const song = importSongs.value[i]
    importProgress.value = {current: i + 1, total: importSongs.value.length, name: song.name}
    try {
      const res: any = await api.post('/music/save-remote', {
        song_mid: song.song_mid,
        name: song.name,
        singer: song.singer,
        album_name: song.album_name,
        cover: song.cover,
        duration: song.duration,
        storage: importStorage.value,
        playlist_name: importPlaylistName.value,
        platform: importPlatform.value
      })
      successCount++
      if (res.data?.fallback) fallbackCount++
      song._selected = false
    } catch {
      failCount++
    }
  }

  importLoading.value = false
  importVisible.value = false
  if (successCount > 0) {
    const fallbackTip = fallbackCount > 0 ? `（${fallbackCount} 首回退网易云）` : ''
    message.success(`成功保存 ${successCount} 首到${importStorage.value === 'minio' ? 'MinIO' : '本地'}${failCount > 0 ? `，失败 ${failCount} 首` : ''}${fallbackTip}`)
    await loadLibrary()
    activeTab.value = 'library'
  } else {
    message.error('全部保存失败，可能无法获取播放链接')
  }
}

// 预览播放
async function handlePreviewSong(song: Song, platform: Platform = 'netease') {
  previewLoading.value = true
  previewName.value = `${song.name} - ${song.singer}`
  previewVisible.value = true
  previewUrl.value = ''
  try {
    const res: any = await api.get(`/music/song-url/${song.song_mid}`, {
      params: {name: song.name, singer: song.singer, platform}
    })
    const url = res.data?.url
    if (!url) {
      message.warning('暂无播放链接（VIP 歌曲或版权限制）')
      previewVisible.value = false
      return
    }
    previewUrl.value = url
    // QQ 音乐回退提示
    if (res.data?.fallback) {
      message.info('QQ音乐无可用链接，已回退网易云')
    }
  } catch {
    message.error('获取播放链接失败')
    previewVisible.value = false
  } finally {
    previewLoading.value = false
  }
}

// 音乐库管理
async function loadLibrary() {
  libraryLoading.value = true
  try {
    const res: any = await api.get('/music', {
      params: {
        page: libraryPage.value,
        pageSize: libraryPageSize.value,
        keyword: libraryKeyword.value || undefined
      }
    })
    library.value = res.data?.list || []
    libraryTotal.value = res.data?.pagination?.total || 0
  } catch {
    message.error('加载音乐库失败')
  } finally {
    libraryLoading.value = false
  }
}

function handleLibrarySearch() {
  libraryPage.value = 1
  loadLibrary()
}

function handleLibraryChange(pag: { current: number; pageSize: number }) {
  libraryPage.value = pag.current
  libraryPageSize.value = pag.pageSize
  loadLibrary()
}

async function handleRefreshUrl(record: MusicItem) {
  // 手动上传的音乐不通过平台接口刷新链接
  if (record.origin_platform === 'upload') {
    message.warning('手动上传的音乐无需刷新链接，请检查文件是否被删除')
    return
  }
  try {
    await api.put(`/music/refresh-url/${record.id}`)
    message.success('播放链接已刷新')
    await loadLibrary()
  } catch {
    message.error('刷新失败（VIP 歌曲或版权限制）')
  }
}

async function handleToggleActive(record: MusicItem) {
  try {
    await api.put(`/music/${record.id}`, {is_active: !record.is_active})
    message.success(record.is_active ? '已禁用' : '已启用')
    await loadLibrary()
  } catch {
    message.error('操作失败')
  }
}

function handleDeleteMusic(record: MusicItem) {
  const isPlaying = musicStore.currentSong?.id === record.id
  Modal.confirm({
    title: '确认删除',
    icon: h(ExclamationCircleOutlined),
    content: `确定要删除「${record.name}」吗？${isPlaying ? '（当前正在播放，将自动跳转下一首）' : ''}`,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        await api.delete(`/music/${record.id}`)
        message.success('删除成功')
        await loadLibrary()
        // 删除的是当前播放的歌曲，自动跳转下一首
        if (isPlaying && musicStore.currentSong?.id !== record.id) {
          // 刷新后该歌曲已不在列表中，无需额外操作
          // 若列表为空，播放器会自动关闭
        } else if (isPlaying) {
          musicStore.next()
        }
      } catch {
        message.error('删除失败')
      }
    }
  })
}

function handleMenuAction(key: string, record: MusicItem) {
  switch (key) {
    case 'play':
      handlePlayLibrary(record)
      break
    case 'refresh':
      handleRefreshUrl(record)
      break
    case 'edit':
      handleEditMusic(record)
      break
    case 'migrate':
      handleMigrateStorage(record)
      break
    case 'toggle':
      handleToggleActive(record)
      break
    case 'delete':
      handleDeleteMusic(record)
      break
  }
}

// 编辑音乐
function handleEditMusic(record: MusicItem) {
  editForm.value = {
    id: record.id,
    name: record.name,
    singer: record.singer,
    album: record.album,
    cover: record.cover,
    play_url: record.play_url,
    storage: (record.source === 'minio' ? 'minio' : 'local') as 'local' | 'minio'
  }
  editCoverFile.value = null
  editLyricFile.value = null
  editHasLyric.value = !!record.lyric
  editVisible.value = true
}

function handleEditCoverSelect(info: any) {
  if (info.fileList && info.fileList.length > 0) {
    const file = info.fileList[info.fileList.length - 1].originFileObj || info.fileList[info.fileList.length - 1]
    editCoverFile.value = file
  }
}

function handleEditLyricSelect(info: any) {
  if (info.fileList && info.fileList.length > 0) {
    const file = info.fileList[info.fileList.length - 1].originFileObj || info.fileList[info.fileList.length - 1]
    editLyricFile.value = file
  }
}

async function handleEditSubmit() {
  editLoading.value = true
  try {
    // 1. 如果选了新封面，先上传封面
    if (editCoverFile.value) {
      const coverForm = new FormData()
      coverForm.append('cover', editCoverFile.value)
      coverForm.append('storage', editForm.value.storage)
      await api.post(`/music/${editForm.value.id}/cover`, coverForm, {
        headers: {'Content-Type': 'multipart/form-data'}
      })
    }
    // 2. 如果选了新歌词文件，上传歌词
    if (editLyricFile.value) {
      const lyricForm = new FormData()
      lyricForm.append('lyric', editLyricFile.value)
      await api.post(`/music/${editForm.value.id}/lyric`, lyricForm, {
        headers: {'Content-Type': 'multipart/form-data'}
      })
    }
    // 3. 更新基本信息
    await api.put(`/music/${editForm.value.id}`, {
      name: editForm.value.name,
      singer: editForm.value.singer,
      album: editForm.value.album,
      cover: editCoverFile.value ? undefined : editForm.value.cover,
      play_url: editForm.value.play_url
    })
    message.success('更新成功')
    editVisible.value = false
    await loadLibrary()
  } catch {
    message.error('更新失败')
  } finally {
    editLoading.value = false
  }
}

// 存储位置迁移
function handleMigrateStorage(record: MusicItem) {
  const currentStorage = record.source === 'minio' ? 'MinIO' : (record.source === 'qq' ? '外链' : '本地')
  const targetStorage = record.source === 'minio' ? '本地' : 'MinIO'
  if (record.source === 'qq' || (record.play_url && !record.play_url.startsWith('/uploads/') && !record.play_url.includes('/minio/api/'))) {
    message.warning('外链音乐无法迁移存储位置')
    return
  }
  Modal.confirm({
    title: '迁移存储位置',
    icon: h(ExclamationCircleOutlined),
    content: `确定要将「${record.name}」从${currentStorage}迁移到${targetStorage}吗？迁移后会删除原位置的文件。`,
    okText: '迁移',
    okType: 'primary',
    cancelText: '取消',
    async onOk() {
      migrateLoading.value = true
      try {
        const target = record.source === 'minio' ? 'local' : 'minio'
        await api.post(`/music/${record.id}/migrate-storage`, {target_storage: target})
        message.success(`已迁移到${targetStorage}存储`)
        await loadLibrary()
      } catch {
        message.error('迁移失败')
      } finally {
        migrateLoading.value = false
      }
    }
  })
}

// 音乐库在线播放 - 触发全局播放器并自动加载整个音乐库
function handlePlayLibrary(record: MusicItem) {
  if (!record.play_url) {
    message.warning('暂无播放链接')
    return
  }
  // 调用全局音乐 store：加载整个音乐库，并从当前歌曲开始播放
  musicStore.loadLibrary(record.id)
}

// 原始来源平台展示
function originPlatformLabel(platform: string): string {
  switch (platform) {
    case 'netease':
      return '网易云音乐'
    case 'qq':
      return 'QQ音乐'
    case 'upload':
      return '手动上传'
    default:
      return platform || '-'
  }
}

function originPlatformColor(platform: string): string {
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

// 手动上传 - 打开弹窗并重置表单、预加载数据
function openUploadModal() {
  uploadForm.value = {name: '', singer: '', album: '', storage: 'local'}
  uploadFileList.value = null
  uploadCoverFile.value = null
  uploadLyricFile.value = null
  uploadDuration.value = 0
  uploadMode.value = 'file'
  selectedMediaId.value = ''
  mediaMp3List.value = []
  // 预加载媒体库音频文件列表
  fetchMediaMp3List()
  uploadVisible.value = true
}

// 从音频文件提取时长（秒）
function extractAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const audio = new Audio()
    audio.preload = 'metadata'
    audio.src = url
    audio.onloadedmetadata = () => {
      const dur = audio.duration
      URL.revokeObjectURL(url)
      resolve(isFinite(dur) ? Math.round(dur) : 0)
    }
    audio.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(0)
    }
  })
}

// 从音频 URL 提取时长（秒）——用于媒体库选择模式
function extractAudioDurationFromUrl(url: string): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio()
    audio.preload = 'metadata'
    audio.crossOrigin = 'anonymous'
    audio.src = url
    audio.onloadedmetadata = () => {
      const dur = audio.duration
      resolve(isFinite(dur) ? Math.round(dur) : 0)
    }
    audio.onerror = () => {
      resolve(0)
    }
  })
}

// 媒体库选择模式 - 选中某个音频文件
function handleMediaSelect(item: any) {
  selectedMediaId.value = item.id
  uploadDuration.value = 0
  if (!uploadForm.value.name) {
    uploadForm.value.name = item.original_name.replace(/\.[^.]+$/, '')
  }
  // 从 URL 加载音频元数据获取时长
  extractAudioDurationFromUrl(item.url).then(dur => {
    // 仅当选中的仍是当前项时才更新，避免竞态
    if (selectedMediaId.value === item.id) {
      uploadDuration.value = dur
    }
  })
}

function handleFileSelect(info: any) {
  if (info.fileList && info.fileList.length > 0) {
    const file = info.fileList[info.fileList.length - 1].originFileObj || info.fileList[info.fileList.length - 1]
    uploadFileList.value = file
    uploadDuration.value = 0
    // 自动填充歌曲名
    if (!uploadForm.value.name && file.name) {
      uploadForm.value.name = file.name.replace(/\.[^.]+$/, '')
    }
    // 异步提取时长
    extractAudioDuration(file).then(dur => {
      uploadDuration.value = dur
    })
  }
}

function handleCoverSelect(info: any) {
  if (info.fileList && info.fileList.length > 0) {
    const file = info.fileList[info.fileList.length - 1].originFileObj || info.fileList[info.fileList.length - 1]
    uploadCoverFile.value = file
  }
}

function handleLyricSelect(info: any) {
  if (info.fileList && info.fileList.length > 0) {
    const file = info.fileList[info.fileList.length - 1].originFileObj || info.fileList[info.fileList.length - 1]
    uploadLyricFile.value = file
  }
}

function handleFileRemove() {
  uploadFileList.value = null
}

function handleCoverRemove() {
  uploadCoverFile.value = null
}

function handleLyricRemove() {
  uploadLyricFile.value = null
}

async function handleUploadSubmit() {
  uploadLoading.value = true
  try {
    if (uploadMode.value === 'media') {
      // 从媒体库选择模式
      if (!selectedMediaId.value) {
        message.warning('请选择媒体库中的音频文件')
        uploadLoading.value = false
        return
      }
      // 若选择了封面图片，先上传到媒体库获取 URL
      let coverUrl = ''
      if (uploadCoverFile.value) {
        const coverFormData = new FormData()
        coverFormData.append('file', uploadCoverFile.value)
        coverFormData.append('storage', 'local')
        const coverRes: any = await api.post('/media', coverFormData, {
          headers: {'Content-Type': 'multipart/form-data'}
        })
        coverUrl = coverRes.data?.url || ''
      }
      await api.post('/music/upload-from-media', {
        media_id: selectedMediaId.value,
        name: uploadForm.value.name,
        singer: uploadForm.value.singer,
        album: uploadForm.value.album,
        cover: coverUrl,
        duration: uploadDuration.value
      })
      message.success('创建成功')
    } else {
      // 本地文件上传模式
      if (!uploadFileList.value) {
        message.warning('请选择音乐文件')
        uploadLoading.value = false
        return
      }
      const formData = new FormData()
      formData.append('file', uploadFileList.value)
      if (uploadCoverFile.value) {
        formData.append('cover', uploadCoverFile.value)
      }
      if (uploadLyricFile.value) {
        formData.append('lyric', uploadLyricFile.value)
      }
      formData.append('name', uploadForm.value.name)
      formData.append('singer', uploadForm.value.singer)
      formData.append('album', uploadForm.value.album)
      formData.append('storage', uploadForm.value.storage)
      formData.append('duration', String(uploadDuration.value))

      await api.post('/music/upload', formData, {
        headers: {'Content-Type': 'multipart/form-data'}
      })
      message.success('上传成功')
    }
    uploadVisible.value = false
    await loadLibrary()
    activeTab.value = 'library'
  } catch {
    message.error('操作失败')
  } finally {
    uploadLoading.value = false
  }
}

// 保存搜索到的音乐到服务器
function handleSaveRemote(song: Song, platform: Platform) {
  saveRemoteSong.value = song
  saveRemoteStorage.value = 'local'
  saveRemotePlatform.value = platform
  saveRemoteVisible.value = true
}

async function handleSaveRemoteSubmit() {
  if (!saveRemoteSong.value) return
  saveRemoteLoading.value = true
  try {
    const song = saveRemoteSong.value
    const res: any = await api.post('/music/save-remote', {
      song_mid: song.song_mid,
      name: song.name,
      singer: song.singer,
      album_name: song.album_name,
      cover: song.cover,
      duration: song.duration,
      storage: saveRemoteStorage.value,
      platform: saveRemotePlatform.value
    })
    const fallbackTip = res.data?.fallback ? '（QQ音乐无可用链接，已回退网易云）' : ''
    message.success(`「${song.name}」已保存到${saveRemoteStorage.value === 'minio' ? 'MinIO' : '本地'}${fallbackTip}`)
    saveRemoteVisible.value = false
    await loadLibrary()
  } catch {
    message.error('保存失败，可能无法获取播放链接')
  } finally {
    saveRemoteLoading.value = false
  }
}

onMounted(() => {
  loadLibrary()
})
</script>

<template>
  <div class="music-crawler">
    <a-tabs v-model:activeKey="activeTab">
      <!-- 歌曲搜索 -->
      <a-tab-pane key="search">
        <template #tab>
          <span><SearchOutlined/> 音乐搜索</span>
        </template>

        <a-card>
          <div class="platform-bar">
            <span class="platform-label">音乐平台：</span>
            <a-radio-group v-model:value="searchPlatform" button-style="solid" size="small">
              <a-radio-button v-for="p in platforms" :key="p.id" :value="p.id">{{ p.label }}</a-radio-button>
            </a-radio-group>
          </div>
          <div class="search-bar">
            <a-input-search
                v-model:value="searchKeyword"
                placeholder="输入歌曲名、歌手名..."
                style="max-width: 500px"
                enter-button="搜索"
                size="large"
                :loading="searchLoading"
                @search="handleSearchSongs"
            >
              <template #prefix>
                <SearchOutlined/>
              </template>
            </a-input-search>
          </div>

          <template v-if="searchSongs.length > 0">
            <div class="toolbar">
              <a-checkbox v-model:checked="searchSelectAll">全选 ({{ searchSongs.length }} 首)</a-checkbox>
              <a-button
                  type="primary"
                  :loading="importLoading"
                  :disabled="selectedSearchSongs.length === 0"
                  @click="handleImport(searchSongs, '', searchPlatform)"
              >
                <template #icon>
                  <ImportOutlined/>
                </template>
                导入选中 ({{ selectedSearchSongs.length }})
              </a-button>
            </div>

            <a-table
                :columns="songColumns"
                :data-source="searchSongs"
                :loading="searchLoading"
                :pagination="{
                  pageSize: 10,
                  showSizeChanger: true,
                  pageSizeOptions: ['10', '20', '30', '50'],
                  showTotal: (t: number) => `共 ${t} 首`
                }"
                :row-key="(r: Song) => r.song_mid"
                size="middle"
                :row-class-name="(record: Song) => record._selected ? 'row-selected' : ''"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'index'">
                  <a-checkbox :checked="record._selected" @change="() => record._selected = !record._selected"/>
                </template>
                <template v-if="column.key === 'is_vip'">
                  <a-tag :color="record.is_vip ? 'red' : 'green'">
                    {{ record.is_vip ? 'VIP' : '免费' }}
                  </a-tag>
                </template>
                <template v-if="column.key === 'action'">
                  <a-space size="small">
                    <a-button type="link" size="small" @click="handlePreviewSong(record, searchPlatform)">
                      <template #icon>
                        <PlayCircleOutlined/>
                      </template>
                      播放
                    </a-button>
                    <a-button type="link" size="small" style="color: #52c41a"
                              @click="handleSaveRemote(record, searchPlatform)">
                      <template #icon>
                        <CloudDownloadOutlined/>
                      </template>
                      保存
                    </a-button>
                  </a-space>
                </template>
              </template>
            </a-table>
          </template>
          <a-empty v-else-if="!searchLoading" description="输入关键词搜索音乐歌曲" style="padding: 60px 0"/>
        </a-card>
      </a-tab-pane>

      <!-- 歌单导入 -->
      <a-tab-pane key="playlist">
        <template #tab>
          <span><UnorderedListOutlined/> 歌单导入</span>
        </template>

        <a-card>
          <div class="platform-bar">
            <span class="platform-label">音乐平台：</span>
            <a-radio-group v-model:value="playlistPlatform" button-style="solid" size="small">
              <a-radio-button v-for="p in platforms" :key="p.id" :value="p.id">{{ p.label }}</a-radio-button>
            </a-radio-group>
          </div>
          <div class="search-bar">
            <a-input-search
                v-model:value="playlistInput"
                :placeholder="playlistPlatform === 'qq' ? '输入 QQ 音乐歌单 ID 或链接（如 7654261081 或 https://y.qq.com/n/ryqq/playlist/7654261081）' : '输入网易云歌单 ID 或链接（如 3778678 或 https://music.163.com/#/playlist?id=3778678）'"
                style="max-width: 600px"
                enter-button="加载歌单"
                size="large"
                :loading="playlistLoading"
                @search="handleLoadPlaylist"
            />
          </div>

          <template v-if="playlistSongs.length > 0">
            <div class="toolbar">
              <a-space>
                <CustomerServiceOutlined style="color: #1677ff"/>
                <span class="playlist-title">{{ playlistName }}</span>
                <a-tag>{{ playlistSongs.length }} 首</a-tag>
              </a-space>
              <a-button
                  type="primary"
                  :loading="importLoading"
                  :disabled="selectedPlaylistSongs.length === 0"
                  @click="handleImport(playlistSongs, playlistName, playlistPlatform)"
              >
                <template #icon>
                  <ImportOutlined/>
                </template>
                导入选中 ({{ selectedPlaylistSongs.length }})
              </a-button>
            </div>

            <div class="select-all-bar">
              <a-checkbox v-model:checked="playlistSelectAll">全选 ({{ playlistSongs.length }} 首)</a-checkbox>
            </div>

            <a-table
                :columns="songColumns"
                :data-source="playlistSongs"
                :loading="playlistLoading"
                :pagination="{
                  pageSize: 10,
                  showSizeChanger: true,
                  pageSizeOptions: ['10', '20', '30', '50'],
                  showTotal: (t: number) => `共 ${t} 首`
                }"
                :row-key="(r: Song) => r.song_mid"
                size="middle"
                :row-class-name="(record: Song) => record._selected ? 'row-selected' : ''"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'index'">
                  <a-checkbox :checked="record._selected" @change="() => record._selected = !record._selected"/>
                </template>
                <template v-if="column.key === 'is_vip'">
                  <a-tag :color="record.is_vip ? 'red' : 'green'">
                    {{ record.is_vip ? 'VIP' : '免费' }}
                  </a-tag>
                </template>
                <template v-if="column.key === 'action'">
                  <a-space size="small">
                    <a-button type="link" size="small" @click="handlePreviewSong(record, playlistPlatform)">
                      <template #icon>
                        <PlayCircleOutlined/>
                      </template>
                      播放
                    </a-button>
                    <a-button type="link" size="small" style="color: #52c41a"
                              @click="handleSaveRemote(record, playlistPlatform)">
                      <template #icon>
                        <CloudDownloadOutlined/>
                      </template>
                      保存
                    </a-button>
                  </a-space>
                </template>
              </template>
            </a-table>
          </template>
          <a-empty v-else-if="!playlistLoading" description="输入歌单 ID 或链接加载歌曲列表" style="padding: 60px 0"/>
        </a-card>
      </a-tab-pane>

      <!-- 音乐库管理 -->
      <a-tab-pane key="library">
        <template #tab>
          <span><CustomerServiceOutlined/> 音乐库管理</span>
        </template>

        <a-card title="音乐库管理">
          <template #extra>
            <a-space>
              <a-button type="primary" @click="openUploadModal">
                <template #icon>
                  <UploadOutlined/>
                </template>
                上传音乐
              </a-button>
              <a-input-search
                  v-model:value="libraryKeyword"
                  placeholder="搜索歌曲、歌手、专辑..."
                  style="width: 240px"
                  allow-clear
                  @search="handleLibrarySearch"
              >
                <template #enterButton>
                  <SearchOutlined/>
                </template>
              </a-input-search>
            </a-space>
          </template>

          <a-table
              :columns="libraryColumns"
              :data-source="library"
              :loading="libraryLoading"
              :pagination="{
                current: libraryPage,
                pageSize: libraryPageSize,
                total: libraryTotal,
                showSizeChanger: true,
                showTotal: (t: number) => `共 ${t} 首`
              }"
              :row-key="(r: MusicItem) => r.id"
              @change="handleLibraryChange"
              size="middle"
              :scroll="{ x: 1500 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'cover'">
                <a-image
                    v-if="record.cover"
                    :src="record.cover"
                    :width="40"
                    :height="40"
                    style="border-radius: 4px; object-fit: cover"
                />
                <CustomerServiceOutlined v-else style="font-size: 24px; color: #ccc"/>
              </template>
              <template v-if="column.key === 'play_url'">
                <a-typography-text
                    v-if="record.play_url"
                    :content="record.play_url"
                    :ellipsis="{ tooltip: record.play_url }"
                    style="max-width: 180px; font-size: 12px; color: #999"
                />
                <span v-else style="color: #ccc">无</span>
              </template>
              <template v-if="column.key === 'source'">
                <a-tag :color="record.source === 'minio' ? 'blue' : 'green'">
                  {{
                    record.source === 'minio' ? 'MinIO' : record.source === 'local' ? '本地' : record.source === 'qq' ? 'QQ音乐' : record.source
                  }}
                </a-tag>
              </template>
              <template v-if="column.key === 'origin_platform'">
                <a-tag :color="originPlatformColor(record.origin_platform)">
                  {{ originPlatformLabel(record.origin_platform) }}
                </a-tag>
              </template>
              <template v-if="column.key === 'is_active'">
                <a-tag :color="record.is_active ? 'green' : 'default'">
                  {{ record.is_active ? '启用' : '禁用' }}
                </a-tag>
              </template>
              <template v-if="column.key === 'action'">
                <a-dropdown :trigger="['click']">
                  <a-button size="small" type="text">
                    <template #icon>
                      <MoreOutlined/>
                    </template>
                  </a-button>
                  <template #overlay>
                    <a-menu @click="(info: any) => handleMenuAction(info.key, record)">
                      <a-menu-item key="play" :disabled="!record.play_url">
                        <template #icon>
                          <PlayCircleOutlined/>
                        </template>
                        在线播放
                      </a-menu-item>
                      <a-menu-item key="edit">
                        <template #icon>
                          <EditOutlined/>
                        </template>
                        编辑
                      </a-menu-item>
                      <a-menu-item key="refresh">
                        <template #icon>
                          <ReloadOutlined/>
                        </template>
                        刷新链接
                      </a-menu-item>
                      <a-menu-item key="migrate"
                                   :disabled="!record.play_url || (!record.play_url.startsWith('/uploads/') && !record.play_url.includes('/minio/api/'))">
                        <template #icon>
                          <SwapOutlined/>
                        </template>
                        迁移存储
                      </a-menu-item>
                      <a-menu-item key="toggle">
                        <template #icon>
                          <CaretRightOutlined v-if="!record.is_active"/>
                          <StopOutlined v-else/>
                        </template>
                        {{ record.is_active ? '禁用' : '启用' }}
                      </a-menu-item>
                      <a-menu-divider/>
                      <a-menu-item key="delete" danger>
                        <template #icon>
                          <DeleteOutlined/>
                        </template>
                        删除
                      </a-menu-item>
                    </a-menu>
                  </template>
                </a-dropdown>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-tab-pane>

      <!-- 歌单管理 Tab -->
      <a-tab-pane key="playlists">
        <template #tab>
          <span>
            <UnorderedListOutlined/>
            歌单管理
          </span>
        </template>
        <PlaylistManage/>
      </a-tab-pane>
    </a-tabs>

    <!-- 试听弹窗 -->
    <a-modal
        v-model:open="previewVisible"
        :title="`正在播放：${previewName}`"
        :footer="null"
        width="440px"
        :closable="true"
        @cancel="onPreviewCancel"
        class="preview-modal"
    >
      <a-spin :spinning="previewLoading">
        <div v-if="previewUrl" class="preview-player">
          <div class="preview-disc" :class="{ playing: previewPlaying }">
            <div class="preview-disc-inner">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
          </div>
          <div class="preview-info">
            <div class="preview-title">{{ previewName }}</div>
            <div class="preview-time">{{ formatPreviewTime(previewCurrentTime) }} /
              {{ formatPreviewTime(previewDuration) }}
            </div>
          </div>
          <div class="preview-seek-bar" @click="handlePreviewSeek">
            <div class="preview-seek-track">
              <div class="preview-seek-fill"
                   :style="{width: previewDuration ? (previewCurrentTime / previewDuration * 100) + '%' : '0%'}"></div>
            </div>
          </div>
          <div class="preview-controls">
            <button class="preview-btn preview-btn-play" @click="togglePreviewPlay">
              <svg v-if="!previewPlaying" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            </button>
            <div class="preview-volume">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" class="preview-volume-icon">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
              </svg>
              <div class="preview-volume-bar" @click="handleVolumeChange">
                <div class="preview-volume-fill" :style="{width: (previewVolume * 100) + '%'}"></div>
              </div>
            </div>
          </div>
          <audio
              ref="previewAudioEl"
              :src="previewUrl"
              autoplay
              @play="onPreviewPlay"
              @pause="onPreviewPause"
              @loadedmetadata="onPreviewLoadedMetadata"
              @ended="onPreviewEnded"
          >
            您的浏览器不支持音频播放
          </audio>
        </div>
        <div v-else-if="!previewLoading" class="preview-empty">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
          <span>暂无播放链接</span>
        </div>
      </a-spin>
    </a-modal>

    <!-- 手动上传弹窗 -->
    <a-modal
        v-model:open="uploadVisible"
        title="上传音乐到音乐库"
        :confirm-loading="uploadLoading"
        @ok="handleUploadSubmit"
        ok-text="上传"
        cancel-text="取消"
        width="600px"
    >
      <a-form layout="vertical" style="margin-top: 16px">
        <!-- 来源模式切换 -->
        <a-form-item label="文件来源">
          <a-radio-group v-model:value="uploadMode" button-style="solid">
            <a-radio-button value="file">本地文件上传</a-radio-button>
            <a-radio-button value="media">从媒体库选择</a-radio-button>
          </a-radio-group>
        </a-form-item>

        <!-- 本地文件上传模式 -->
        <template v-if="uploadMode === 'file'">
          <a-form-item label="音乐文件" required>
            <a-upload
                :before-upload="() => false"
                :max-count="1"
                accept=".mp3,.m4a,.aac,.ogg,.wav,.flac,audio/*"
                @change="handleFileSelect"
                @remove="handleFileRemove"
            >
              <a-button>
                <template #icon>
                  <FolderOpenOutlined/>
                </template>
                选择音乐文件
              </a-button>
            </a-upload>
            <div style="color: #999; font-size: 12px; margin-top: 4px">
              支持 MP3 / M4A / AAC / OGG / WAV / FLAC，最大 50MB
            </div>
          </a-form-item>
        </template>

        <!-- 媒体库选择模式 -->
        <template v-else>
          <a-form-item label="从媒体库选择音频文件" required>
            <a-spin :spinning="mediaMp3Loading">
              <div v-if="mediaMp3List.length > 0" class="media-select-list">
                <div
                    v-for="item in mediaMp3List"
                    :key="item.id"
                    class="media-select-item"
                    :class="{selected: selectedMediaId === item.id}"
                    @click="handleMediaSelect(item)"
                >
                  <div class="media-select-info">
                    <div class="media-select-name">{{ item.original_name }}</div>
                    <div class="media-select-meta">
                      <span>{{ item.mime_type }}</span>
                      <span>{{ formatSize(item.size) }}</span>
                      <span>{{ formatDateTime(item.created_at) }}</span>
                    </div>
                  </div>
                  <div class="media-select-check">
                    <CheckCircleFilled v-if="selectedMediaId === item.id" style="color: #1677ff; font-size: 18px"/>
                    <div v-else class="media-select-radio"></div>
                  </div>
                </div>
              </div>
              <a-empty v-else description="媒体库暂无音频文件" style="padding: 20px 0"/>
            </a-spin>
            <div style="color: #999; font-size: 12px; margin-top: 4px">
              选择媒体库中已有的音频文件，直接引用其 URL（不重复上传）
            </div>
          </a-form-item>
        </template>
        <a-form-item label="封面图片（可选）">
          <a-upload
              :before-upload="() => false"
              :max-count="1"
              accept=".jpg,.jpeg,.png,.webp,.gif,image/*"
              @change="handleCoverSelect"
              @remove="handleCoverRemove"
          >
            <a-button>
              <template #icon>
                <PictureOutlined/>
              </template>
              选择封面图片
            </a-button>
          </a-upload>
          <div style="color: #999; font-size: 12px; margin-top: 4px">
            支持 JPG / PNG / WEBP / GIF
          </div>
        </a-form-item>
        <a-form-item label="歌词文件（可选）">
          <a-upload
              :before-upload="() => false"
              :max-count="1"
              accept=".lrc,text/plain"
              @change="handleLyricSelect"
              @remove="handleLyricRemove"
          >
            <a-button>
              <template #icon>
                <FileTextOutlined/>
              </template>
              选择 LRC 歌词文件
            </a-button>
          </a-upload>
          <div style="color: #999; font-size: 12px; margin-top: 4px">
            支持 .lrc 格式歌词文件
          </div>
        </a-form-item>
        <a-form-item label="歌曲名">
          <a-input v-model:value="uploadForm.name" placeholder="留空则使用文件名"/>
        </a-form-item>
        <a-form-item label="歌手">
          <a-input v-model:value="uploadForm.singer" placeholder="歌手名"/>
        </a-form-item>
        <a-form-item label="专辑">
          <a-input v-model:value="uploadForm.album" placeholder="专辑名（可选）"/>
        </a-form-item>
        <a-form-item v-if="uploadMode === 'file'" label="保存到">
          <a-radio-group v-model:value="uploadForm.storage">
            <a-radio value="local">本地存储</a-radio>
            <a-radio value="minio">MinIO 存储</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 编辑音乐弹窗 -->
    <a-modal
        v-model:open="editVisible"
        title="编辑音乐"
        :confirm-loading="editLoading"
        @ok="handleEditSubmit"
        ok-text="保存"
        cancel-text="取消"
        width="560px"
    >
      <a-form layout="vertical" style="margin-top: 16px">
        <a-form-item label="歌曲名">
          <a-input v-model:value="editForm.name" placeholder="歌曲名"/>
        </a-form-item>
        <a-form-item label="歌手">
          <a-input v-model:value="editForm.singer" placeholder="歌手名"/>
        </a-form-item>
        <a-form-item label="专辑">
          <a-input v-model:value="editForm.album" placeholder="专辑名"/>
        </a-form-item>
        <a-form-item label="封面 URL">
          <a-input v-model:value="editForm.cover" placeholder="封面图片 URL（可留空）"/>
        </a-form-item>
        <a-form-item label="上传新封面（可选）">
          <a-upload
              :before-upload="() => false"
              :max-count="1"
              accept=".jpg,.jpeg,.png,.webp,.gif,image/*"
              @change="handleEditCoverSelect"
          >
            <a-button>
              <template #icon>
                <PictureOutlined/>
              </template>
              选择新封面
            </a-button>
          </a-upload>
          <div v-if="editForm.cover" style="margin-top: 8px">
            <img :src="editForm.cover" alt="封面预览" style="max-width: 100px; max-height: 100px; border-radius: 4px"/>
          </div>
        </a-form-item>
        <a-form-item label="封面存储到">
          <a-radio-group v-model:value="editForm.storage">
            <a-radio value="local">本地存储</a-radio>
            <a-radio value="minio">MinIO 存储</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="播放链接">
          <a-input v-model:value="editForm.play_url" placeholder="播放链接 URL"/>
        </a-form-item>
        <a-form-item label="歌词文件（.lrc）">
          <div style="margin-bottom: 8px">
            <a-tag v-if="editHasLyric && !editLyricFile" color="green">已存在歌词</a-tag>
            <a-tag v-else-if="editLyricFile" color="blue">已选择新歌词文件</a-tag>
            <a-tag v-else color="default">暂无歌词</a-tag>
          </div>
          <a-upload
              :before-upload="() => false"
              :max-count="1"
              accept=".lrc,text/plain"
              @change="handleEditLyricSelect"
          >
            <a-button>
              <template #icon>
                <FileTextOutlined/>
              </template>
              {{ editHasLyric ? '替换歌词文件' : '选择歌词文件' }}
            </a-button>
          </a-upload>
          <div style="color: #999; font-size: 12px; margin-top: 4px">
            上传 .lrc 格式歌词文件，替换现有歌词
          </div>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 保存到服务器弹窗 -->
    <a-modal
        v-model:open="saveRemoteVisible"
        title="保存音乐到服务器"
        :confirm-loading="saveRemoteLoading"
        @ok="handleSaveRemoteSubmit"
        ok-text="保存"
        cancel-text="取消"
        width="440px"
    >
      <div style="margin: 16px 0">
        <p style="margin-bottom: 16px">
          即将保存：<strong>{{ saveRemoteSong?.name }}</strong>
          <span style="color: #999"> - {{ saveRemoteSong?.singer }}</span>
          <a-tag :color="saveRemotePlatform === 'qq' ? 'orange' : 'red'" style="margin-left: 8px">
            {{ saveRemotePlatform === 'qq' ? 'QQ音乐' : '网易云音乐' }}
          </a-tag>
        </p>
        <p style="color: #999; margin-bottom: 16px">
          系统将{{
            saveRemotePlatform === 'qq' ? '从 QQ 音乐获取播放链接，VIP 歌曲会自动回退网易云' : '从网易云音乐获取播放链接'
          }}，下载音频文件后保存到选定存储源，并添加到音乐库。
          <br/>VIP 或版权受限歌曲可能无法获取链接。
        </p>
        <a-form layout="vertical">
          <a-form-item label="选择保存源" required>
            <a-radio-group v-model:value="saveRemoteStorage">
              <a-radio value="local">本地存储</a-radio>
              <a-radio value="minio">MinIO 存储</a-radio>
            </a-radio-group>
          </a-form-item>
        </a-form>
      </div>
    </a-modal>

    <!-- 批量导入弹窗 -->
    <a-modal
        v-model:open="importVisible"
        title="导入歌曲到服务器"
        :confirm-loading="importLoading"
        @ok="handleImportSubmit"
        ok-text="开始保存"
        cancel-text="取消"
        width="480px"
        :mask-closable="!importLoading"
        :closable="!importLoading"
    >
      <div style="margin: 16px 0">
        <p style="margin-bottom: 12px">
          即将保存 <strong>{{ importSongs.length }}</strong> 首歌曲到服务器并添加到音乐库。
          <a-tag :color="importPlatform === 'qq' ? 'orange' : 'red'" style="margin-left: 8px">
            {{ importPlatform === 'qq' ? 'QQ音乐' : '网易云音乐' }}
          </a-tag>
        </p>
        <p style="color: #999; margin-bottom: 16px">
          系统将{{
            importPlatform === 'qq' ? '从 QQ 音乐获取播放链接，VIP 歌曲会自动回退网易云' : '从网易云音乐获取播放链接'
          }}，下载音频后保存到选定存储源。
          <br/>过程可能需要一些时间，请耐心等待。
        </p>
        <a-form layout="vertical">
          <a-form-item label="选择保存源" required>
            <a-radio-group v-model:value="importStorage" :disabled="importLoading">
              <a-radio value="local">本地存储</a-radio>
              <a-radio value="minio">MinIO 存储</a-radio>
            </a-radio-group>
          </a-form-item>
        </a-form>
        <div v-if="importLoading" style="margin-top: 16px">
          <a-progress
              :percent="Math.round(importProgress.current / importProgress.total * 100)"
              :format="() => `${importProgress.current}/${importProgress.total}`"
          />
          <p style="text-align: center; color: #999; margin-top: 8px; font-size: 12px">
            正在保存：{{ importProgress.name }}
          </p>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
.music-crawler {
  max-width: 100%;
}

.search-bar {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.platform-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 8px;
}

.platform-label {
  color: #666;
  margin-right: 8px;
  font-size: 13px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  margin-bottom: 8px;
}

.playlist-title {
  font-size: 15px;
  font-weight: 600;
}

.select-all-bar {
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #fafafa;
  border-radius: 4px;
}

:deep(.row-selected) {
  background-color: #e6f4ff;
}

/* ============ 试听播放器 ============ */
.preview-modal :deep(.ant-modal-content) {
  border-radius: 16px;
  overflow: hidden;
}

.preview-modal :deep(.ant-modal-header) {
  margin-bottom: 0;
  padding: 16px 24px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.preview-player {
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.preview-disc {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.35);
  animation: preview-disc-spin 3s linear infinite;
  animation-play-state: paused;
}

.preview-disc.playing {
  animation-play-state: running;
}

@keyframes preview-disc-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.preview-disc-inner {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.preview-info {
  text-align: center;
}

.preview-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 4px;
}

.preview-time {
  font-size: 12px;
  color: #999;
  font-variant-numeric: tabular-nums;
}

.preview-seek-bar {
  width: 100%;
  cursor: pointer;
  padding: 4px 0;
}

.preview-seek-track {
  width: 100%;
  height: 4px;
  background: #e8e8e8;
  border-radius: 2px;
  overflow: hidden;
  transition: height 0.15s;
}

.preview-seek-bar:hover .preview-seek-track {
  height: 6px;
}

.preview-seek-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 2px;
  transition: width 0.1s linear;
}

.preview-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  justify-content: center;
}

.preview-btn {
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: #333;
  transition: color 0.15s, transform 0.15s;
}

.preview-btn:hover {
  color: #667eea;
}

.preview-btn:active {
  transform: scale(0.92);
}

.preview-btn-play {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  box-shadow: 0 2px 12px rgba(102, 126, 234, 0.35);
}

.preview-btn-play:hover {
  color: #fff;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.5);
}

.preview-volume {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-volume-icon {
  color: #999;
}

.preview-volume-bar {
  width: 80px;
  height: 4px;
  background: #e8e8e8;
  border-radius: 2px;
  cursor: pointer;
  overflow: hidden;
}

.preview-volume-fill {
  height: 100%;
  background: #667eea;
  border-radius: 2px;
  transition: width 0.1s;
}

.preview-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 0;
  color: #bbb;
}

.preview-empty svg {
  color: #ddd;
}

/* ============ 媒体库选择列表 ============ */
.media-select-list {
  max-height: 280px;
  overflow-y: auto;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
}

.media-select-list::-webkit-scrollbar {
  width: 5px;
}

.media-select-list::-webkit-scrollbar-thumb {
  background: #d9d9d9;
  border-radius: 3px;
}

.media-select-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  cursor: pointer;
  border-bottom: 1px solid #f5f5f5;
  transition: background 0.15s;
}

.media-select-item:last-child {
  border-bottom: none;
}

.media-select-item:hover {
  background: #fafafa;
}

.media-select-item.selected {
  background: #e6f4ff;
}

.media-select-info {
  min-width: 0;
  flex: 1;
}

.media-select-name {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.media-select-meta {
  display: flex;
  gap: 12px;
  margin-top: 3px;
  font-size: 11px;
  color: #999;
}

.media-select-check {
  flex-shrink: 0;
  margin-left: 12px;
  display: flex;
  align-items: center;
}

.media-select-radio {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #d9d9d9;
}
</style>
