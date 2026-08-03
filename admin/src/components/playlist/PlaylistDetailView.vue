<script setup lang="ts">
import {
  ArrowLeftOutlined,
  CustomerServiceOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  UnorderedListOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  ShareAltOutlined
} from '@ant-design/icons-vue'
import type { Playlist, PlaylistSongItem } from '@/composables/usePlaylistManage'
import {
  formatTime,
  coverUrl,
  originPlatformLabel,
  originPlatformColor
} from '@/composables/usePlaylistManage'

const props = defineProps<{
  loading: boolean
  playlist: Playlist | null
  songs: PlaylistSongItem[]
}>()

const emit = defineEmits<{
  back: []
  edit: [item: Playlist]
  toggle: [item: Playlist]
  share: [shareCode: string]
  addSongs: []
  playAll: []
  playSong: [record: PlaylistSongItem]
  removeSong: [record: PlaylistSongItem]
}>()

// 歌曲列表表格列
const songColumns = [
  { title: '序号', key: 'index', width: 60, align: 'center' as const },
  { title: '封面', key: 'cover', width: 70, align: 'center' as const },
  { title: '歌名', dataIndex: ['music', 'name'], key: 'name', ellipsis: true },
  { title: '歌手', dataIndex: ['music', 'singer'], key: 'singer', width: 160, ellipsis: true },
  { title: '专辑', dataIndex: ['music', 'album'], key: 'album', width: 160, ellipsis: true },
  {
    title: '时长',
    key: 'duration',
    width: 80,
    customRender: ({ record }: { record: PlaylistSongItem }) => {
      const d = record.music?.duration
      if (!d) return '-'
      const m = Math.floor(d / 60)
      const s = d % 60
      return `${m}:${String(s).padStart(2, '0')}`
    }
  },
  { title: '来源平台', key: 'origin_platform', width: 110, align: 'center' as const },
  { title: '操作', key: 'action', width: 140, align: 'center' as const, fixed: 'right' as const }
]
</script>

<template>
  <a-spin :spinning="loading">
    <!-- 顶部信息区 -->
    <div class="detail-header">
      <a-button @click="emit('back')">
        <template #icon>
          <ArrowLeftOutlined />
        </template>
        返回列表
      </a-button>

      <div class="detail-info" v-if="playlist">
        <div class="detail-cover">
          <img
            v-if="playlist.cover"
            :src="coverUrl(playlist.cover)"
            :alt="playlist.name"
            class="detail-cover-img"
          />
          <div v-else class="detail-cover-placeholder">
            <CustomerServiceOutlined />
          </div>
        </div>
        <div class="detail-meta">
          <div class="detail-title-row">
            <h2 class="detail-title">{{ playlist.name }}</h2>
            <a-tag :color="playlist.is_public ? 'green' : 'default'">
              {{ playlist.is_public ? '公开' : '私有' }}
            </a-tag>
          </div>
          <p class="detail-desc">{{ playlist.description || '暂无描述' }}</p>
          <div class="detail-stats">
            <a-statistic
              title="歌曲数"
              :value="playlist.song_count ?? songs.length"
              style="margin-right: 32px"
            >
              <template #prefix>
                <CustomerServiceOutlined />
              </template>
            </a-statistic>
            <a-statistic
              title="播放次数"
              :value="playlist.play_count ?? 0"
              style="margin-right: 32px"
            >
              <template #prefix>
                <PlayCircleOutlined />
              </template>
            </a-statistic>
            <div class="detail-time-stat">
              <div class="detail-time-label">创建时间</div>
              <div class="detail-time-value">{{ formatTime(playlist.created_at) }}</div>
            </div>
          </div>
          <div class="detail-actions">
            <a-button size="small" @click="emit('share', playlist.share_code)" :disabled="!playlist.share_code">
              <template #icon><ShareAltOutlined /></template>
              复制分享链接
            </a-button>
            <a-button size="small" @click="emit('edit', playlist)">
              <template #icon><EditOutlined /></template>
              编辑歌单
            </a-button>
            <a-button size="small" @click="emit('toggle', playlist)">
              <template #icon>
                <EyeInvisibleOutlined v-if="playlist.is_public" />
                <EyeOutlined v-else />
              </template>
              {{ playlist.is_public ? '设为私有' : '设为公开' }}
            </a-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 歌曲列表 -->
    <a-card class="songs-card">
      <template #title>
        <a-space>
          <UnorderedListOutlined />
          <span>歌曲列表</span>
          <a-tag color="blue">{{ songs.length }} 首</a-tag>
        </a-space>
      </template>
      <template #extra>
        <a-space>
          <a-button
            type="primary"
            ghost
            :disabled="songs.length === 0"
            @click="emit('playAll')"
          >
            <template #icon><PlayCircleOutlined /></template>
            播放全部
          </a-button>
          <a-button type="primary" @click="emit('addSongs')">
            <template #icon><PlusOutlined /></template>
            添加歌曲
          </a-button>
        </a-space>
      </template>

      <a-table
        :columns="songColumns"
        :data-source="songs"
        :loading="loading"
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
            <CustomerServiceOutlined v-else style="font-size: 24px; color: #ccc" />
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
                @click="emit('playSong', record)"
              >
                <template #icon><PlayCircleOutlined /></template>
                播放
              </a-button>
              <a-popconfirm
                title="确定要从歌单中移除这首歌曲吗？"
                ok-text="移除"
                ok-type="danger"
                cancel-text="取消"
                @confirm="emit('removeSong', record)"
              >
                <a-button type="link" size="small" danger>
                  <template #icon><DeleteOutlined /></template>
                  移除
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>

        <template #emptyText>
          <a-empty description="歌单暂无歌曲，点击右上角添加" style="padding: 40px 0" />
        </template>
      </a-table>
    </a-card>
  </a-spin>
</template>

<style scoped>
.detail-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.detail-info {
  display: flex;
  gap: 24px;
  background: var(--color-bg-container);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.detail-cover {
  flex-shrink: 0;
  width: 160px;
  height: 160px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--color-bg-fill);
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
  color: var(--color-text-disabled);
  background: linear-gradient(135deg, var(--color-bg-layout) 0%, var(--color-bg-fill) 100%);
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
  color: var(--color-text);
}

.detail-desc {
  margin: 0 0 16px 0;
  color: var(--color-text-secondary);
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
  color: var(--color-text-tertiary);
  margin-bottom: 4px;
}

.detail-time-value {
  font-size: 14px;
  color: var(--color-text);
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
