<script setup lang="ts">
import {computed, h, onMounted, reactive, ref} from 'vue'
import api from '@/utils/api'
import {message, Modal} from 'ant-design-vue'
import {
  ArrowLeftOutlined,
  CustomerServiceOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  LinkOutlined,
  MoreOutlined,
  PictureOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  ShareAltOutlined,
  UnorderedListOutlined
} from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import {useMusicStore} from '@/stores/music'

const musicStore = useMusicStore()

// 歌单类型
interface Playlist {
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
interface PlaylistSongItem {
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
interface MusicItem {
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

// 视图状态：list 列表 / detail 详情
const view = ref<'list' | 'detail'>('list')

// 歌单列表
const playlists = ref<Playlist[]>([])
const listLoading = ref(false)

// 当前查看的歌单详情
const currentPlaylist = ref<Playlist | null>(null)
const playlistSongs = ref<PlaylistSongItem[]>([])
const detailLoading = ref(false)

// 创建/编辑弹窗
const formVisible = ref(false)
const formLoading = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const form = reactive({
  id: '',
  name: '',
  description: '',
  cover: ''
})

// 封面上传
const coverFile = ref<File | null>(null)
const coverStorage = ref<'local' | 'minio'>('local')

// 添加歌曲弹窗
const addSongsVisible = ref(false)
const addSongsLoading = ref(false)
const musicLibrary = ref<MusicItem[]>([])
const musicLibraryLoading = ref(false)
const musicKeyword = ref('')
const selectedMusicIds = ref<string[]>([])

// 歌单歌曲列表表格列
const songColumns = [
  {title: '序号', key: 'index', width: 60, align: 'center' as const},
  {title: '封面', key: 'cover', width: 70, align: 'center' as const},
  {title: '歌名', dataIndex: ['music', 'name'], key: 'name', ellipsis: true},
  {title: '歌手', dataIndex: ['music', 'singer'], key: 'singer', width: 160, ellipsis: true},
  {title: '专辑', dataIndex: ['music', 'album'], key: 'album', width: 160, ellipsis: true},
  {
    title: '时长',
    key: 'duration',
    width: 80,
    customRender: ({record}: { record: PlaylistSongItem }) => {
      const d = record.music?.duration
      if (!d) return '-'
      const m = Math.floor(d / 60)
      const s = d % 60
      return `${m}:${String(s).padStart(2, '0')}`
    }
  },
  {title: '来源平台', key: 'origin_platform', width: 110, align: 'center' as const},
  {title: '操作', key: 'action', width: 140, align: 'center' as const, fixed: 'right' as const}
]

// 添加歌曲弹窗的音乐库表格列
const musicColumns = [
  {title: '歌名', dataIndex: 'name', key: 'name', ellipsis: true},
  {title: '歌手', dataIndex: 'singer', key: 'singer', width: 150, ellipsis: true},
  {title: '专辑', dataIndex: 'album', key: 'album', width: 150, ellipsis: true},
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
  {title: '来源', dataIndex: 'origin_platform', key: 'origin_platform', width: 100, align: 'center' as const},
  {title: '状态', key: 'status', width: 90, align: 'center' as const}
]

// 已添加歌曲的 music_id 集合（用于禁用已存在歌曲）
const existingMusicIds = computed(() => new Set(playlistSongs.value.map(s => s.music_id)))

// 过滤后的音乐库（搜索 + 隐藏已添加）
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

// 行选择配置（添加歌曲弹窗）
const rowSelection = computed(() => ({
  selectedRowKeys: selectedMusicIds.value,
  onChange: (keys: string[]) => {
    selectedMusicIds.value = keys
  },
  getCheckboxProps: (record: MusicItem) => ({
    disabled: existingMusicIds.value.has(record.id)
  })
}))

// 加载歌单列表
async function loadPlaylists() {
  listLoading.value = true
  try {
    const res: any = await api.get('/playlists')
    const list = res.data?.list || res.data || []
    // 兼容 createdAt / created_at 两种字段名
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

// 加载歌单详情（含歌曲列表）
async function loadPlaylistDetail(id: string) {
  detailLoading.value = true
  try {
    const res: any = await api.get(`/playlists/${id}`)
    const data = res.data || {}
    // 后端 include 关联返回的字段为 playlistSongs，统一映射为 songs
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

// 点击歌单卡片进入详情
function handleViewDetail(item: Playlist) {
  view.value = 'detail'
  currentPlaylist.value = {...item}
  playlistSongs.value = []
  loadPlaylistDetail(item.id)
}

// 返回列表视图
function handleBackToList() {
  view.value = 'list'
  currentPlaylist.value = null
  playlistSongs.value = []
  loadPlaylists()
}

// 打开创建弹窗
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

// 打开编辑弹窗
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

// 封面文件选择
function handleCoverSelect(info: any) {
  if (info.fileList && info.fileList.length > 0) {
    const file = info.fileList[info.fileList.length - 1].originFileObj || info.fileList[info.fileList.length - 1]
    coverFile.value = file
  }
}

// 提交创建/编辑
async function handleFormSubmit() {
  if (!form.name.trim()) {
    message.warning('请输入歌单名称')
    return
  }
  formLoading.value = true
  try {
    if (formMode.value === 'create') {
      // 创建歌单
      const res: any = await api.post('/playlists', {
        name: form.name.trim(),
        description: form.description.trim(),
        cover: form.cover.trim()
      })
      const newId = res.data?.id
      // 若选了封面文件，上传封面
      if (newId && coverFile.value) {
        const coverForm = new FormData()
        coverForm.append('cover', coverFile.value)
        coverForm.append('storage', coverStorage.value)
        await api.post(`/playlists/${newId}/cover`, coverForm, {
          headers: {'Content-Type': 'multipart/form-data'}
        })
      }
      message.success('创建成功')
    } else {
      // 更新歌单基本信息
      await api.put(`/playlists/${form.id}`, {
        name: form.name.trim(),
        description: form.description.trim(),
        cover: form.cover.trim()
      })
      // 若选了新封面文件，上传封面
      if (coverFile.value) {
        const coverForm = new FormData()
        coverForm.append('cover', coverFile.value)
        coverForm.append('storage', coverStorage.value)
        await api.post(`/playlists/${form.id}/cover`, coverForm, {
          headers: {'Content-Type': 'multipart/form-data'}
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
  } catch {
    message.error(formMode.value === 'create' ? '创建失败' : '更新失败')
  } finally {
    formLoading.value = false
  }
}

// 删除歌单
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

// 复制分享链接
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
      // 降级方案：使用 textarea
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

// 切换歌单公开状态
async function handleTogglePublic(item: Playlist) {
  try {
    await api.put(`/playlists/${item.id}`, {is_public: !item.is_public})
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

// 打开添加歌曲弹窗
async function handleOpenAddSongs() {
  if (!currentPlaylist.value) return
  addSongsVisible.value = true
  selectedMusicIds.value = []
  musicKeyword.value = ''
  await loadMusicLibrary()
}

// 加载音乐库
async function loadMusicLibrary() {
  musicLibraryLoading.value = true
  try {
    const res: any = await api.get('/music', {
      params: {page: 1, pageSize: 500}
    })
    musicLibrary.value = (res.data?.list || []).filter((m: MusicItem) => m.is_active)
  } catch {
    message.error('加载音乐库失败')
  } finally {
    musicLibraryLoading.value = false
  }
}

// 确认添加歌曲
async function handleAddSongsSubmit() {
  if (selectedMusicIds.value.length === 0) {
    message.warning('请选择要添加的歌曲')
    return
  }
  if (!currentPlaylist.value) return
  addSongsLoading.value = true
  try {
    const res: any = await api.post(`/playlists/${currentPlaylist.value.id}/songs`, {
      music_ids: selectedMusicIds.value
    })
    const added = res.data?.added ?? 0
    const skipped = res.data?.skipped ?? 0
    if (added > 0) {
      message.success(`添加成功 ${added} 首${skipped > 0 ? `，跳过 ${skipped} 首已存在` : ''}`)
    } else {
      message.warning('没有新歌曲被添加（所选歌曲可能已存在）')
    }
    addSongsVisible.value = false
    await loadPlaylistDetail(currentPlaylist.value.id)
  } catch {
    message.error('添加歌曲失败')
  } finally {
    addSongsLoading.value = false
  }
}

// 从歌单移除歌曲
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
        await api.delete(`/playlists/${currentPlaylist.value!.id}/songs/${record.id}`)
        message.success('已移除')
        await loadPlaylistDetail(currentPlaylist.value!.id)
      } catch {
        message.error('移除失败')
      }
    }
  })
}

// 卡片下拉菜单操作
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

// 来源平台标签文本
function originPlatformLabel(platform: string): string {
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

// 将歌单歌曲项转换为音乐播放器可用的格式
function buildPlayableList(): any[] {
  const songs: any[] = []
  playlistSongs.value.forEach((item) => {
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

// 格式化时间
function formatTime(time: string): string {
  return time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
}

// 格式化封面 URL（处理相对路径）
function coverUrl(cover: string): string {
  if (!cover) return ''
  if (cover.startsWith('http') || cover.startsWith('//') || cover.startsWith('/')) {
    return cover.startsWith('//') ? `https:${cover}` : cover
  }
  return cover
}

// 暴露刷新方法给父组件
defineExpose({refresh: loadPlaylists})

onMounted(() => {
  loadPlaylists()
})
</script>

<template>
  <div class="playlist-manage">
    <!-- 列表视图 -->
    <template v-if="view === 'list'">
      <div class="toolbar">
        <h2 class="page-title">
          <CustomerServiceOutlined/>
          歌单管理
          <span class="page-subtitle">共 {{ playlists.length }} 个歌单</span>
        </h2>
        <a-space>
          <a-button @click="loadPlaylists" :loading="listLoading">
            <template #icon>
              <ReloadOutlined/>
            </template>
            刷新
          </a-button>
          <a-button type="primary" @click="handleOpenCreate">
            <template #icon>
              <PlusOutlined/>
            </template>
            创建歌单
          </a-button>
        </a-space>
      </div>

      <a-spin :spinning="listLoading">
        <div v-if="playlists.length > 0" class="playlist-grid">
          <div
              v-for="item in playlists"
              :key="item.id"
              class="playlist-card"
              @click="handleViewDetail(item)"
          >
            <!-- 封面 -->
            <div class="card-cover">
              <img
                  v-if="item.cover"
                  :src="coverUrl(item.cover)"
                  :alt="item.name"
                  class="cover-img"
              />
              <div v-else class="cover-placeholder">
                <CustomerServiceOutlined class="placeholder-icon"/>
              </div>
              <!-- 公开/私有标签 -->
              <div class="cover-badge">
                <a-tag :color="item.is_public ? 'green' : 'default'" style="margin: 0">
                  {{ item.is_public ? '公开' : '私有' }}
                </a-tag>
              </div>
              <!-- 操作菜单 -->
              <div class="cover-actions" @click.stop>
                <a-dropdown :trigger="['click']" placement="bottomRight">
                  <a-button size="small" type="primary" ghost @click.stop>
                    <template #icon>
                      <MoreOutlined/>
                    </template>
                  </a-button>
                  <template #overlay>
                    <a-menu @click="(info: any) => handleCardMenuAction(info.key, item)">
                      <a-menu-item key="view">
                        <template #icon>
                          <EyeOutlined/>
                        </template>
                        查看详情
                      </a-menu-item>
                      <a-menu-item key="edit">
                        <template #icon>
                          <EditOutlined/>
                        </template>
                        编辑歌单
                      </a-menu-item>
                      <a-menu-item key="toggle">
                        <template #icon>
                          <EyeInvisibleOutlined v-if="item.is_public"/>
                          <EyeOutlined v-else/>
                        </template>
                        {{ item.is_public ? '设为私有' : '设为公开' }}
                      </a-menu-item>
                      <a-menu-item key="share" :disabled="!item.share_code">
                        <template #icon>
                          <ShareAltOutlined/>
                        </template>
                        复制分享链接
                      </a-menu-item>
                      <a-menu-divider/>
                      <a-menu-item key="delete" danger>
                        <template #icon>
                          <DeleteOutlined/>
                        </template>
                        删除歌单
                      </a-menu-item>
                    </a-menu>
                  </template>
                </a-dropdown>
              </div>
            </div>

            <!-- 信息 -->
            <div class="card-body">
              <a-tooltip :title="item.name">
                <h3 class="card-title">{{ item.name }}</h3>
              </a-tooltip>
              <p class="card-desc">{{ item.description || '暂无描述' }}</p>
              <div class="card-stats">
                <span class="stat-item">
                  <CustomerServiceOutlined/>
                  {{ item.song_count ?? 0 }} 首
                </span>
                <span class="stat-item">
                  <PlayCircleOutlined/>
                  {{ item.play_count ?? 0 }} 次播放
                </span>
              </div>
              <div class="card-footer">
                <span class="card-time">{{ formatTime(item.created_at) }}</span>
                <a-button
                    type="link"
                    size="small"
                    :disabled="!item.share_code"
                    @click.stop="handleCopyShareLink(item.share_code)"
                >
                  <template #icon>
                    <LinkOutlined/>
                  </template>
                  分享
                </a-button>
              </div>
            </div>
          </div>
        </div>

        <a-empty
            v-else-if="!listLoading"
            description="暂无歌单，点击右上角创建第一个歌单"
            style="padding: 80px 0"
        >
          <template #image>
            <CustomerServiceOutlined style="font-size: 64px; color: #d9d9d9"/>
          </template>
        </a-empty>
      </a-spin>
    </template>

    <!-- 详情视图 -->
    <template v-else>
      <a-spin :spinning="detailLoading">
        <!-- 顶部信息区 -->
        <div class="detail-header">
          <a-button @click="handleBackToList">
            <template #icon>
              <ArrowLeftOutlined/>
            </template>
            返回列表
          </a-button>

          <div class="detail-info" v-if="currentPlaylist">
            <div class="detail-cover">
              <img
                  v-if="currentPlaylist.cover"
                  :src="coverUrl(currentPlaylist.cover)"
                  :alt="currentPlaylist.name"
                  class="detail-cover-img"
              />
              <div v-else class="detail-cover-placeholder">
                <CustomerServiceOutlined/>
              </div>
            </div>
            <div class="detail-meta">
              <div class="detail-title-row">
                <h2 class="detail-title">{{ currentPlaylist.name }}</h2>
                <a-tag :color="currentPlaylist.is_public ? 'green' : 'default'">
                  {{ currentPlaylist.is_public ? '公开' : '私有' }}
                </a-tag>
              </div>
              <p class="detail-desc">{{ currentPlaylist.description || '暂无描述' }}</p>
              <div class="detail-stats">
                <a-statistic title="歌曲数" :value="currentPlaylist.song_count ?? playlistSongs.length"
                             style="margin-right: 32px">
                  <template #prefix>
                    <CustomerServiceOutlined/>
                  </template>
                </a-statistic>
                <a-statistic title="播放次数" :value="currentPlaylist.play_count ?? 0" style="margin-right: 32px">
                  <template #prefix>
                    <PlayCircleOutlined/>
                  </template>
                </a-statistic>
                <div class="detail-time-stat">
                  <div class="detail-time-label">创建时间</div>
                  <div class="detail-time-value">{{ formatTime(currentPlaylist.created_at) }}</div>
                </div>
              </div>
              <div class="detail-actions" v-if="currentPlaylist.share_code">
                <a-button size="small" @click="handleCopyShareLink(currentPlaylist.share_code)">
                  <template #icon>
                    <ShareAltOutlined/>
                  </template>
                  复制分享链接
                </a-button>
                <a-button size="small" @click="handleOpenEdit(currentPlaylist)">
                  <template #icon>
                    <EditOutlined/>
                  </template>
                  编辑歌单
                </a-button>
                <a-button
                    size="small"
                    @click="handleTogglePublic(currentPlaylist)"
                >
                  <template #icon>
                    <EyeInvisibleOutlined v-if="currentPlaylist.is_public"/>
                    <EyeOutlined v-else/>
                  </template>
                  {{ currentPlaylist.is_public ? '设为私有' : '设为公开' }}
                </a-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 歌曲列表 -->
        <a-card class="songs-card">
          <template #title>
            <a-space>
              <UnorderedListOutlined/>
              <span>歌曲列表</span>
              <a-tag color="blue">{{ playlistSongs.length }} 首</a-tag>
            </a-space>
          </template>
          <template #extra>
            <a-space>
              <a-button
                  type="primary"
                  ghost
                  :disabled="playlistSongs.length === 0"
                  @click="handlePlayAll"
              >
                <template #icon>
                  <PlayCircleOutlined/>
                </template>
                播放全部
              </a-button>
              <a-button type="primary" @click="handleOpenAddSongs">
                <template #icon>
                  <PlusOutlined/>
                </template>
                添加歌曲
              </a-button>
            </a-space>
          </template>

          <a-table
              :columns="songColumns"
              :data-source="playlistSongs"
              :loading="detailLoading"
              :row-key="(r: PlaylistSongItem) => r.id"
              :pagination="{
                pageSize: 20,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50', '100'],
                showTotal: (t: number) => `共 ${t} 首`
              }"
              size="middle"
              :scroll="{ x: 1100 }"
          >
            <template #bodyCell="{ column, record, index }">
              <template v-if="column.key === 'index'">
                {{ index + 1 }}
              </template>
              <template v-if="column.key === 'cover'">
                <a-image
                    v-if="record.music?.cover"
                    :src="coverUrl(record.music.cover)"
                    :width="40"
                    :height="40"
                    style="border-radius: 4px; object-fit: cover"
                />
                <CustomerServiceOutlined v-else style="font-size: 24px; color: #ccc"/>
              </template>
              <template v-if="column.key === 'origin_platform'">
                <a-tag :color="originPlatformColor(record.music?.origin_platform)">
                  {{ originPlatformLabel(record.music?.origin_platform) }}
                </a-tag>
              </template>
              <template v-if="column.key === 'action'">
                <a-space size="small">
                  <a-button
                      type="link"
                      size="small"
                      :disabled="!record.music?.play_url"
                      @click="handlePlaySong(record)"
                  >
                    <template #icon>
                      <PlayCircleOutlined/>
                    </template>
                    播放
                  </a-button>
                  <a-popconfirm
                      title="确定要从歌单中移除这首歌曲吗？"
                      ok-text="移除"
                      ok-type="danger"
                      cancel-text="取消"
                      @confirm="handleRemoveSong(record)"
                  >
                    <a-button type="link" size="small" danger>
                      <template #icon>
                        <DeleteOutlined/>
                      </template>
                      移除
                    </a-button>
                  </a-popconfirm>
                </a-space>
              </template>
            </template>

            <template #emptyText>
              <a-empty description="歌单暂无歌曲，点击右上角添加" style="padding: 40px 0"/>
            </template>
          </a-table>
        </a-card>
      </a-spin>
    </template>

    <!-- 创建/编辑歌单弹窗 -->
    <a-modal
        v-model:open="formVisible"
        :title="formMode === 'create' ? '创建歌单' : '编辑歌单'"
        :confirm-loading="formLoading"
        @ok="handleFormSubmit"
        :ok-text="formMode === 'create' ? '创建' : '保存'"
        cancel-text="取消"
        width="560px"
    >
      <a-form layout="vertical" style="margin-top: 16px">
        <a-form-item label="歌单名称" required>
          <a-input
              v-model:value="form.name"
              placeholder="请输入歌单名称"
              :maxlength="100"
              show-count
          />
        </a-form-item>
        <a-form-item label="描述（可选）">
          <a-textarea
              v-model:value="form.description"
              placeholder="请输入歌单描述"
              :rows="3"
              :maxlength="500"
              show-count
          />
        </a-form-item>
        <a-form-item label="封面 URL（可选）">
          <a-input
              v-model:value="form.cover"
              placeholder="封面图片 URL，可留空"
          />
        </a-form-item>
        <a-form-item label="上传封面文件（可选）">
          <a-upload
              :before-upload="() => false"
              :max-count="1"
              accept=".jpg,.jpeg,.png,.webp,.gif,image/*"
              @change="handleCoverSelect"
          >
            <a-button>
              <template #icon>
                <PictureOutlined/>
              </template>
              选择封面图片
            </a-button>
          </a-upload>
          <div style="color: #999; font-size: 12px; margin-top: 4px">
            支持 JPG / PNG / WEBP / GIF，上传后将覆盖 URL 设置
          </div>
          <div v-if="coverFile" style="margin-top: 8px; color: #52c41a; font-size: 12px">
            已选择：{{ coverFile.name }}
          </div>
          <div v-else-if="form.cover" style="margin-top: 8px">
            <img
                :src="coverUrl(form.cover)"
                alt="封面预览"
                style="max-width: 100px; max-height: 100px; border-radius: 4px; object-fit: cover"
            />
          </div>
        </a-form-item>
        <a-form-item v-if="coverFile" label="封面存储到">
          <a-radio-group v-model:value="coverStorage">
            <a-radio value="local">本地存储</a-radio>
            <a-radio value="minio">MinIO 存储</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 添加歌曲弹窗 -->
    <a-modal
        v-model:open="addSongsVisible"
        title="添加歌曲到歌单"
        :confirm-loading="addSongsLoading"
        @ok="handleAddSongsSubmit"
        ok-text="添加选中"
        cancel-text="取消"
        width="900px"
        :ok-button-props="{disabled: selectedMusicIds.length === 0}"
    >
      <div class="add-songs-toolbar">
        <a-input-search
            v-model:value="musicKeyword"
            placeholder="搜索歌名、歌手、专辑..."
            style="width: 320px"
            allow-clear
        >
          <template #prefix>
            <SearchOutlined/>
          </template>
        </a-input-search>
        <span class="add-songs-tip">
          已选 {{ selectedMusicIds.length }} 首 · 已添加 {{ existingMusicIds.size }} 首
        </span>
      </div>

      <a-table
          :columns="musicColumns"
          :data-source="filteredMusic"
          :loading="musicLibraryLoading"
          :row-key="(r: MusicItem) => r.id"
          :row-selection="rowSelection"
          :pagination="{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (t: number) => `共 ${t} 首`
          }"
          size="small"
          :scroll="{ y: 400 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'origin_platform'">
            <a-tag :color="originPlatformColor(record.origin_platform)">
              {{ originPlatformLabel(record.origin_platform) }}
            </a-tag>
          </template>
          <template v-if="column.key === 'status'">
            <a-tag v-if="existingMusicIds.has(record.id)" color="default">已添加</a-tag>
            <a-tag v-else color="blue">可添加</a-tag>
          </template>
        </template>

        <template #emptyText>
          <a-empty
              :description="musicKeyword ? '未找到匹配的歌曲' : '音乐库暂无可用歌曲'"
              style="padding: 30px 0"
          />
        </template>
      </a-table>
    </a-modal>
  </div>
</template>

<style scoped>
.playlist-manage {
  max-width: 100%;
}

/* 顶部工具栏 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-subtitle {
  font-size: 13px;
  color: #999;
  font-weight: normal;
  margin-left: 4px;
}

/* 卡片网格 */
.playlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.playlist-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid #f0f0f0;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
}

.playlist-card:hover {
  border-color: #1677ff;
  box-shadow: 0 4px 16px rgba(22, 119, 255, 0.15);
  transform: translateY(-2px);
}

/* 卡片封面 */
.card-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  background: #f5f5f5;
  overflow: hidden;
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f2f5 0%, #e6e6e6 100%);
}

.placeholder-icon {
  font-size: 64px;
  color: #d9d9d9;
}

.cover-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 2;
}

.cover-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  opacity: 0;
  transition: opacity 0.3s;
}

.playlist-card:hover .cover-actions {
  opacity: 1;
}

/* 卡片信息 */
.card-body {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.card-title {
  margin: 0 0 6px 0;
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #333;
}

.card-desc {
  margin: 0 0 10px 0;
  font-size: 12px;
  color: #999;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 36px;
}

.card-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 10px;
  font-size: 12px;
  color: #666;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px solid #f5f5f5;
}

.card-time {
  font-size: 12px;
  color: #bbb;
}

/* 详情视图 */
.detail-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.detail-info {
  display: flex;
  gap: 24px;
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

.detail-cover {
  flex-shrink: 0;
  width: 160px;
  height: 160px;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
}

.detail-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.detail-cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 56px;
  color: #d9d9d9;
  background: linear-gradient(135deg, #f0f2f5 0%, #e6e6e6 100%);
}

.detail-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.detail-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.detail-title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #333;
}

.detail-desc {
  margin: 0 0 16px 0;
  color: #666;
  font-size: 14px;
  line-height: 1.6;
}

.detail-stats {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.detail-time-stat {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.detail-time-label {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
  margin-bottom: 4px;
}

.detail-time-value {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.85);
  font-weight: 500;
}

.detail-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.songs-card {
  margin-bottom: 20px;
}

/* 添加歌曲弹窗 */
.add-songs-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.add-songs-tip {
  font-size: 13px;
  color: #666;
}

/* 响应式 */
@media (max-width: 768px) {
  .detail-info {
    flex-direction: column;
  }

  .detail-cover {
    width: 100%;
    height: 200px;
  }

  .detail-stats {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
