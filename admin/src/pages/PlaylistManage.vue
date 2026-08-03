<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  CustomerServiceOutlined,
  ReloadOutlined,
  PlusOutlined,
  AppstoreOutlined,
  UnorderedListOutlined
} from '@ant-design/icons-vue'
import { usePlaylistManage, type PlaylistLayout } from '@/composables/usePlaylistManage'
import PlaylistListCard from '@/components/playlist/PlaylistListCard.vue'
import PlaylistListTable from '@/components/playlist/PlaylistListTable.vue'
import PlaylistDetailView from '@/components/playlist/PlaylistDetailView.vue'
import PlaylistFormModal from '@/components/playlist/PlaylistFormModal.vue'
import AddSongsToPlaylistModal from '@/components/playlist/AddSongsToPlaylistModal.vue'

// 歌单管理逻辑（composable 管理所有状态和操作）
const {
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
  existingMusicIds,
  filteredMusic,
  rowSelection,
  loadPlaylists,
  loadPlaylistDetail,
  handleViewDetail,
  handleBackToList,
  handleOpenCreate,
  handleOpenEdit,
  handleCoverSelect,
  handleFormSubmit,
  handleCopyShareLink,
  handleTogglePublic,
  handleCardMenuAction,
  handleOpenAddSongs,
  handleAddSongsSubmit,
  handleRemoveSong,
  handlePlaySong,
  handlePlayAll
} = usePlaylistManage()

// ============ 列表布局模式（localStorage 持久化） ============
const LAYOUT_KEY = 'playlist-list-layout'
const layout = ref<PlaylistLayout>(
  (localStorage.getItem(LAYOUT_KEY) as PlaylistLayout) || 'card'
)

function handleLayoutChange(v: PlaylistLayout) {
  layout.value = v
  localStorage.setItem(LAYOUT_KEY, v)
}

// ============ 表单提交包装 ============
async function onFormSubmit() {
  await handleFormSubmit()
}

// ============ 添加歌曲提交包装 ============
async function onAddSongsSubmit() {
  await handleAddSongsSubmit()
}

// ============ 暴露刷新方法给父组件 ============
defineExpose({ refresh: loadPlaylists })

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
          <CustomerServiceOutlined />
          歌单管理
          <span class="page-subtitle">共 {{ playlists.length }} 个歌单</span>
        </h2>
        <div class="toolbar-actions">
          <a-radio-group
            :value="layout"
            button-style="solid"
            size="small"
            @change="(e: any) => handleLayoutChange(e.target.value as PlaylistLayout)"
          >
            <a-radio-button value="card">
              <AppstoreOutlined />
              <span class="layout-label">卡片</span>
            </a-radio-button>
            <a-radio-button value="table">
              <UnorderedListOutlined />
              <span class="layout-label">列表</span>
            </a-radio-button>
          </a-radio-group>

          <a-button @click="loadPlaylists" :loading="listLoading">
            <template #icon><ReloadOutlined /></template>
            刷新
          </a-button>
          <a-button type="primary" @click="handleOpenCreate">
            <template #icon><PlusOutlined /></template>
            创建歌单
          </a-button>
        </div>
      </div>

      <!-- 卡片布局 -->
      <PlaylistListCard
        v-if="layout === 'card'"
        :list="playlists"
        :loading="listLoading"
        @view="handleViewDetail"
        @edit="handleOpenEdit"
        @toggle="handleTogglePublic"
        @share="handleCopyShareLink"
        @delete="(item: any) => handleCardMenuAction('delete', item)"
        @menu-action="handleCardMenuAction"
      />

      <!-- 列表布局 -->
      <PlaylistListTable
        v-else
        :list="playlists"
        :loading="listLoading"
        @view="handleViewDetail"
        @edit="handleOpenEdit"
        @toggle="handleTogglePublic"
        @share="handleCopyShareLink"
        @menu-action="handleCardMenuAction"
      />
    </template>

    <!-- 详情视图 -->
    <template v-else>
      <PlaylistDetailView
        :loading="detailLoading"
        :playlist="currentPlaylist"
        :songs="playlistSongs"
        @back="handleBackToList"
        @edit="handleOpenEdit"
        @toggle="handleTogglePublic"
        @share="handleCopyShareLink"
        @add-songs="handleOpenAddSongs"
        @play-all="handlePlayAll"
        @play-song="handlePlaySong"
        @remove-song="handleRemoveSong"
      />
    </template>

    <!-- 创建/编辑歌单弹窗 -->
    <PlaylistFormModal
      v-model:open="formVisible"
      :loading="formLoading"
      :mode="formMode"
      v-model:name="form.name"
      v-model:description="form.description"
      v-model:cover="form.cover"
      v-model:cover-storage="coverStorage"
      :cover-file="coverFile"
      @cover-select="handleCoverSelect"
      @submit="onFormSubmit"
    />

    <!-- 添加歌曲弹窗 -->
    <AddSongsToPlaylistModal
      v-model:open="addSongsVisible"
      :loading="addSongsLoading"
      :music-library="musicLibrary"
      :music-library-loading="musicLibraryLoading"
      v-model:music-keyword="musicKeyword"
      :selected-music-ids="selectedMusicIds"
      :playlist-songs="playlistSongs"
      :filtered-music="filteredMusic"
      :row-selection="rowSelection"
      @submit="onAddSongsSubmit"
    />
  </div>
</template>

<style scoped>
.playlist-manage {
  max-width: 100%;
}

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
  color: var(--color-text-tertiary);
  font-weight: normal;
  margin-left: 4px;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.layout-label {
  margin-left: 4px;
}
</style>
