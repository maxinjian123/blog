<script setup lang="ts">
import {
  CustomerServiceOutlined,
  PlayCircleOutlined,
  MoreOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  EditOutlined,
  ShareAltOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue'
import type { Playlist } from '@/composables/usePlaylistManage'
import { formatTime, coverUrl } from '@/composables/usePlaylistManage'

defineProps<{
  list: Playlist[]
  loading: boolean
}>()

const emit = defineEmits<{
  view: [item: Playlist]
  edit: [item: Playlist]
  toggle: [item: Playlist]
  share: [shareCode: string]
  delete: [item: Playlist]
  menuAction: [key: string, item: Playlist]
}>()

const columns = [
  { title: '封面', key: 'cover', width: 80, align: 'center' as const },
  { title: '歌单名', dataIndex: 'name', key: 'name', ellipsis: true },
  { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true, width: 280 },
  { title: '歌曲数', key: 'song_count', width: 90, align: 'center' as const },
  { title: '播放次数', key: 'play_count', width: 100, align: 'center' as const },
  { title: '状态', key: 'is_public', width: 90, align: 'center' as const },
  { title: '创建时间', key: 'created_at', width: 160 },
  { title: '操作', key: 'action', width: 90, align: 'center' as const, fixed: 'right' as const }
]
</script>

<template>
  <a-table
    :columns="columns"
    :data-source="list"
    :loading="loading"
    :row-key="(r: Playlist) => r.id"
    :pagination="{
      pageSize: 20,
      showSizeChanger: true,
      pageSizeOptions: ['10', '20', '50', '100'],
      showTotal: (t: number) => `共 ${t} 个歌单`
    }"
    size="middle"
    :scroll="{ x: 1100 }"
  >
    <template #bodyCell="{ column, record }">
      <!-- 封面 -->
      <template v-if="column.key === 'cover'">
        <div class="table-cover-cell" @click="emit('view', record)">
          <img
            v-if="record.cover"
            :src="coverUrl(record.cover)"
            :alt="record.name"
          />
          <div v-else class="cover-fallback">
            <CustomerServiceOutlined />
          </div>
        </div>
      </template>

      <!-- 歌单名（可点击进入详情） -->
      <template v-if="column.key === 'name'">
        <a-button type="link" @click="emit('view', record)" style="padding: 0">
          {{ record.name }}
        </a-button>
      </template>

      <!-- 描述 -->
      <template v-if="column.key === 'description'">
        <span class="desc-text">{{ record.description || '暂无描述' }}</span>
      </template>

      <!-- 歌曲数 -->
      <template v-if="column.key === 'song_count'">
        <span class="num-cell">
          <CustomerServiceOutlined style="margin-right: 4px; color: #1677ff" />
          {{ record.song_count ?? 0 }}
        </span>
      </template>

      <!-- 播放次数 -->
      <template v-if="column.key === 'play_count'">
        <span class="num-cell">
          <PlayCircleOutlined style="margin-right: 4px; color: #52c41a" />
          {{ record.play_count ?? 0 }}
        </span>
      </template>

      <!-- 状态 -->
      <template v-if="column.key === 'is_public'">
        <a-tag :color="record.is_public ? 'green' : 'default'">
          {{ record.is_public ? '公开' : '私有' }}
        </a-tag>
      </template>

      <!-- 创建时间 -->
      <template v-if="column.key === 'created_at'">
        {{ formatTime(record.created_at) }}
      </template>

      <!-- 操作 -->
      <template v-if="column.key === 'action'">
        <a-dropdown :trigger="['click']" placement="bottomRight">
          <a-button type="text" size="small">
            <MoreOutlined />
          </a-button>
          <template #overlay>
            <a-menu @click="(info: any) => emit('menuAction', info.key, record)">
              <a-menu-item key="view">
                <template #icon><EyeOutlined /></template>
                查看详情
              </a-menu-item>
              <a-menu-item key="edit">
                <template #icon><EditOutlined /></template>
                编辑歌单
              </a-menu-item>
              <a-menu-item key="toggle">
                <template #icon>
                  <EyeInvisibleOutlined v-if="record.is_public" />
                  <EyeOutlined v-else />
                </template>
                {{ record.is_public ? '设为私有' : '设为公开' }}
              </a-menu-item>
              <a-menu-item key="share" :disabled="!record.share_code">
                <template #icon><ShareAltOutlined /></template>
                复制分享链接
              </a-menu-item>
              <a-menu-divider />
              <a-menu-item key="delete" danger>
                <template #icon><DeleteOutlined /></template>
                删除歌单
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </template>
    </template>

    <template #emptyText>
      <a-empty description="暂无歌单，点击右上角创建第一个歌单" style="padding: 40px 0">
        <template #image>
          <CustomerServiceOutlined style="font-size: 48px; color: #d9d9d9" />
        </template>
      </a-empty>
    </template>
  </a-table>
</template>

<style scoped>
.table-cover-cell {
  width: 56px;
  height: 56px;
  border-radius: 6px;
  overflow: hidden;
  background: var(--color-bg-fill);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin: 0 auto;
}

.table-cover-cell:hover {
  opacity: 0.85;
}

.table-cover-cell img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-fallback {
  font-size: 24px;
  color: var(--color-text-disabled);
}

.desc-text {
  color: var(--color-text-tertiary);
  font-size: 13px;
}

.num-cell {
  display: inline-flex;
  align-items: center;
  font-size: 13px;
}
</style>
