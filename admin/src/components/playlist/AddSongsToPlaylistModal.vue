<script setup lang="ts">
import { SearchOutlined } from '@ant-design/icons-vue'
import type { MusicItem, PlaylistSongItem } from '@/composables/usePlaylistManage'
import {
  originPlatformLabel,
  originPlatformColor
} from '@/composables/usePlaylistManage'

const props = defineProps<{
  open: boolean
  loading: boolean
  musicLibrary: MusicItem[]
  musicLibraryLoading: boolean
  selectedMusicIds: string[]
  playlistSongs: PlaylistSongItem[]
  filteredMusic: MusicItem[]
  rowSelection: any
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: []
}>()

// 搜索关键词双向绑定
const musicKeyword = defineModel<string>('musicKeyword', { required: true })

// 表格列
const musicColumns = [
  { title: '歌名', dataIndex: 'name', key: 'name', ellipsis: true },
  { title: '歌手', dataIndex: 'singer', key: 'singer', width: 150, ellipsis: true },
  { title: '专辑', dataIndex: 'album', key: 'album', width: 150, ellipsis: true },
  {
    title: '时长',
    dataIndex: 'duration',
    key: 'duration',
    width: 70,
    customRender: ({ text }: { text: number }) => {
      if (!text) return '-'
      const m = Math.floor(text / 60)
      const s = text % 60
      return `${m}:${String(s).padStart(2, '0')}`
    }
  },
  { title: '来源', dataIndex: 'origin_platform', key: 'origin_platform', width: 100, align: 'center' as const },
  { title: '状态', key: 'status', width: 90, align: 'center' as const }
]

// 已添加歌曲 id 集合（用于状态列显示）
function isExisting(musicId: string): boolean {
  return props.playlistSongs.some(s => s.music_id === musicId)
}
</script>

<template>
  <a-modal
    :open="open"
    title="添加歌曲到歌单"
    :confirm-loading="loading"
    @ok="emit('submit')"
    @update:open="(v: boolean) => emit('update:open', v)"
    ok-text="添加选中"
    cancel-text="取消"
    width="900px"
    :ok-button-props="{ disabled: selectedMusicIds.length === 0 }"
  >
    <div class="add-songs-toolbar">
      <a-input-search
        v-model:value="musicKeyword"
        placeholder="搜索歌名、歌手、专辑..."
        style="width: 320px"
        allow-clear
      >
        <template #prefix>
          <SearchOutlined />
        </template>
      </a-input-search>
      <span class="add-songs-tip">
        已选 {{ selectedMusicIds.length }} 首 · 已添加 {{ playlistSongs.length }} 首
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
          <a-tag v-if="isExisting(record.id)" color="default">已添加</a-tag>
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
</template>

<style scoped>
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
</style>
