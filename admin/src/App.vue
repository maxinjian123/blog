<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { AppstoreOutlined, CommentOutlined, DashboardOutlined, FileTextOutlined, LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined, NotificationOutlined, SettingOutlined, TagsOutlined, UserOutlined } from '@ant-design/icons-vue'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { computed, h, ref, watch } from 'vue'

import { useRoute, useRouter } from 'vue-router'
dayjs.locale('zh-cn')

const locale = ref(zhCN)

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const collapsed = ref(false)
const selectedKeys = ref<string[]>([])

const menuItems = [
  { key: '/', icon: h(DashboardOutlined), label: '仪表盘' },
  {
    key: 'content',
    icon: h(FileTextOutlined),
    label: '内容管理',
    children: [
      { key: '/articles', icon: h(FileTextOutlined), label: '文章管理' },
      { key: '/categories', icon: h(AppstoreOutlined), label: '分类管理' },
      { key: '/tags', icon: h(TagsOutlined), label: '标签管理' }
    ]
  },
  { key: '/comments', icon: h(CommentOutlined), label: '评论管理' },
  { key: '/announcements', icon: h(NotificationOutlined), label: '公告管理' },
  { key: '/settings', icon: h(SettingOutlined), label: '系统设置' }
]

function updateSelectedKeys() {
  const path = route.path
  if (path === '/') {
    selectedKeys.value = ['/']
  } else if (path.startsWith('/articles')) {
    selectedKeys.value = ['/articles']
  } else if (path.startsWith('/categories')) {
    selectedKeys.value = ['/categories']
  } else if (path.startsWith('/tags')) {
    selectedKeys.value = ['/tags']
  } else if (path.startsWith('/comments')) {
    selectedKeys.value = ['/comments']
  } else if (path.startsWith('/announcements')) {
    selectedKeys.value = ['/announcements']
  } else if (path.startsWith('/settings')) {
    selectedKeys.value = ['/settings']
  }
}

watch(() => route.path, updateSelectedKeys, { immediate: true })

function handleMenuClick({ key }: { key: string }) {
  router.push(key)
}

async function handleLogout() {
  authStore.logout()
  await router.push('/login')
}

const isLoginPage = computed(() => route.path === '/login')
</script>

<template>
  <a-config-provider :locale="locale">
    <div v-if="isLoginPage" class="login-layout">
      <router-view />
    </div>
    <a-layout v-else class="admin-layout">
      <a-layout-sider v-model:collapsed="collapsed" :trigger="null" collapsible class="admin-sider">
        <div class="logo">
          <img src="/vite.svg" alt="logo" class="logo-img" />
          <span v-show="!collapsed" class="logo-text">3D Blog</span>
        </div>
        <a-menu v-model:selectedKeys="selectedKeys" theme="dark" mode="inline" :items="menuItems" @click="handleMenuClick" />
      </a-layout-sider>
      <a-layout>
        <a-layout-header class="admin-header">
          <div class="header-left">
            <component :is="collapsed ? MenuUnfoldOutlined : MenuFoldOutlined" class="trigger" @click="collapsed = !collapsed" />
          </div>
          <div class="header-right">
            <a-dropdown>
              <a-space class="user-info">
                <a-avatar size="small">
                  <template #icon>
                    <UserOutlined />
                  </template>
                </a-avatar>
                <span>{{ authStore.user?.username || '管理员' }}</span>
              </a-space>
              <template #overlay>
                <a-menu>
                  <a-menu-item key="logout" @click="handleLogout">
                    <LogoutOutlined />
                    <span style="margin-left: 8px">退出登录</span>
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>
        </a-layout-header>
        <a-layout-content class="admin-content">
          <router-view />
        </a-layout-content>
      </a-layout>
    </a-layout>
  </a-config-provider>
</template>

<style scoped>
.admin-layout {
  min-height: 100vh;
}

.admin-sider {
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  z-index: 10;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 16px;
  overflow: hidden;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-img {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.logo-text {
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  white-space: nowrap;
}

.admin-header {
  background: #fff;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  z-index: 9;
}

.header-left .trigger {
  font-size: 18px;
  cursor: pointer;
  transition: color 0.3s;
}

.header-left .trigger:hover {
  color: #1677ff;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  cursor: pointer;
}

.admin-content {
  margin: 24px;
  padding: 24px;
  background: #fff;
  border-radius: 8px;
  overflow: auto;
  height: calc(100vh - 112px);
}

.login-layout {
  min-height: 100vh;
}
</style>
