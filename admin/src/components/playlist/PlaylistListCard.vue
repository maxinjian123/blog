<script setup lang="ts">
import {
  CustomerServiceOutlined,
  PlayCircleOutlined,
  LinkOutlined,
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

function onMenuClick(key: string, item: Playlist) {
  // 卡片本身点击会触发 view，菜单点击需要阻止冒泡
  emit('menuAction', key, item)
}
</script>

<template>
  <a-spin :spinning="loading">
    <div v-if="list.length > 0" class="playlist-grid">
      <div
        v-for="item in list"
        :key="item.id"
        class="playlist-card"
        @click="emit('view', item)"
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
            <CustomerServiceOutlined class="placeholder-icon" />
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
                  <MoreOutlined />
                </template>
              </a-button>
              <template #overlay>
                <a-menu @click="(info: any) => onMenuClick(info.key, item)">
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
                      <EyeInvisibleOutlined v-if="item.is_public" />
                      <EyeOutlined v-else />
                    </template>
                    {{ item.is_public ? '设为私有' : '设为公开' }}
                  </a-menu-item>
                  <a-menu-item key="share" :disabled="!item.share_code">
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
              <CustomerServiceOutlined />
              {{ item.song_count ?? 0 }} 首
            </span>
            <span class="stat-item">
              <PlayCircleOutlined />
              {{ item.play_count ?? 0 }} 次播放
            </span>
          </div>
          <div class="card-footer">
            <span class="card-time">{{ formatTime(item.created_at) }}</span>
            <a-button
              type="link"
              size="small"
              :disabled="!item.share_code"
              @click.stop="emit('share', item.share_code)"
            >
              <template #icon>
                <LinkOutlined />
              </template>
              分享
            </a-button>
          </div>
        </div>
      </div>
    </div>

    <a-empty
      v-else-if="!loading"
      description="暂无歌单，点击右上角创建第一个歌单"
      style="padding: 80px 0"
    >
      <template #image>
        <CustomerServiceOutlined style="font-size: 64px; color: #d9d9d9" />
      </template>
    </a-empty>
  </a-spin>
</template>

<style scoped>
.playlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 220px));
  gap: 14px;
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

.card-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
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
  font-size: 48px;
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
</style>
