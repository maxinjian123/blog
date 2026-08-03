<script setup lang="ts">
import {computed, onMounted, reactive, ref} from 'vue'
import api from '@/utils/api'
import {message, Modal} from 'ant-design-vue'
import {
  EyeOutlined,
  LockOutlined,
  MailOutlined,
  PictureOutlined,
  SaveOutlined,
  UploadOutlined,
  UserOutlined
} from '@ant-design/icons-vue'
import {useAuthStore} from '@/stores/auth'

const authStore = useAuthStore()

const loading = ref(false)
const saving = ref(false)
const passwordLoading = ref(false)
const avatarLoading = ref(false)

// 媒体库选择头像
const mediaModalVisible = ref(false)
const mediaLoading = ref(false)
const mediaList = ref<any[]>([])
const mediaPage = reactive({current: 1, pageSize: 24, total: 0})
const mediaFilter = reactive({storage: '' as '' | 'local' | 'minio', keyword: ''})

interface AdminProfile {
  id: number
  nickname: string
  username: string
  email: string
  avatar: string
  role: string
}

const profile = reactive<Partial<AdminProfile>>({
  id: 0,
  nickname: '',
  username: '',
  email: '',
  avatar: '',
  role: ''
})

const passwordForm = reactive({
  old_password: '',
  new_password: '',
  confirm_password: ''
})

const avatarUrl = computed(() => {
  return profile.avatar || ''
})

// 头像预览
const avatarPreviewVisible = ref(false)

async function fetchProfile() {
  loading.value = true
  try {
    const res: any = await api.get('/admin/profile')
    const data = res.data || res
    Object.assign(profile, data)
    // 同步更新 auth store 中的用户信息
    if (authStore.user) {
      authStore.user.nickname = data.nickname
      authStore.user.email = data.email
      authStore.user.avatar = data.avatar
      localStorage.setItem('admin_user', JSON.stringify(authStore.user))
    }
  } catch {
    message.error('获取个人信息失败')
  } finally {
    loading.value = false
  }
}

async function handleSaveProfile() {
  if (!profile.nickname?.trim()) {
    message.warning('请输入昵称')
    return
  }
  if (!profile.email?.trim()) {
    message.warning('请输入邮箱')
    return
  }

  saving.value = true
  try {
    await api.put('/admin/profile', {
      nickname: profile.nickname,
      email: profile.email,
      avatar: profile.avatar
    })
    message.success('个人信息已保存')
    await fetchProfile()
  } catch (err: any) {
    message.error(err?.response?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function handleChangePassword() {
  if (!passwordForm.old_password) {
    message.warning('请输入旧密码')
    return
  }
  if (!passwordForm.new_password) {
    message.warning('请输入新密码')
    return
  }
  if (passwordForm.new_password.length < 6) {
    message.warning('新密码至少6位')
    return
  }
  if (passwordForm.new_password !== passwordForm.confirm_password) {
    message.warning('两次输入的新密码不一致')
    return
  }

  passwordLoading.value = true
  try {
    await api.put('/admin/profile/password', {
      old_password: passwordForm.old_password,
      new_password: passwordForm.new_password
    })
    passwordForm.old_password = ''
    passwordForm.new_password = ''
    passwordForm.confirm_password = ''

    // 弹窗提示需要重新登录，3 秒后自动跳转
    let countdown = 3
    const modal = Modal.success({
      title: '密码修改成功',
      content: `密码已修改，为了账号安全需要重新登录。将在 ${countdown} 秒后自动跳转登录页...`,
      okText: '立即登录',
      okCancel: false,
      onOk: () => {
        clearTimeout(timer)
        authStore.logout()
        window.location.href = '/login'
      }
    })
    const timer = setInterval(() => {
      countdown--
      if (countdown <= 0) {
        clearInterval(timer)
        modal.destroy()
        authStore.logout()
        window.location.href = '/login'
      } else {
        modal.update({
          content: `密码已修改，为了账号安全需要重新登录。将在 ${countdown} 秒后自动跳转登录页...`
        })
      }
    }, 1000)
  } catch (err: any) {
    message.error(err?.response?.data?.message || '密码修改失败')
  } finally {
    passwordLoading.value = false
  }
}

function beforeAvatarUpload(file: File) {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp'
  if (!isJpgOrPng) {
    message.error('仅支持 JPG/PNG/WEBP 格式的头像')
    return false
  }
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    message.error('头像大小不能超过 2MB')
    return false
  }
  // 校验通过返回 true，交由 custom-request 执行上传
  return true
}

async function handleAvatarUpload({file}: any) {
  avatarLoading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file as File)
    const res: any = await api.post('/upload', formData, {
      headers: {'Content-Type': 'multipart/form-data'}
    })
    const data = res.data || res
    const url = data?.url || data?.data?.url || ''
    if (url) {
      profile.avatar = url
      message.success('头像上传成功，请记得点击保存')
    } else {
      message.error('头像上传失败')
    }
  } catch (err) {
    message.error('头像上传失败')
    console.error(err)
  } finally {
    avatarLoading.value = false
  }
}

// 打开媒体库弹窗
async function openMediaModal() {
  mediaModalVisible.value = true
  mediaPage.current = 1
  await fetchMediaImages()
}

// 获取媒体库图片列表（仅图片，支持按上传源和文件名筛选）
async function fetchMediaImages() {
  mediaLoading.value = true
  try {
    const res: any = await api.get('/media', {
      params: {
        page: mediaPage.current,
        pageSize: mediaPage.pageSize,
        mime: 'image',
        storage: mediaFilter.storage || undefined,
        keyword: mediaFilter.keyword || undefined
      }
    })
    const data = res.data || res
    mediaList.value = data?.list || []
    mediaPage.total = data?.pagination?.total || data?.total || 0
  } catch {
    message.error('加载媒体库失败')
    mediaList.value = []
  } finally {
    mediaLoading.value = false
  }
}

function handleMediaPageChange(page: number, pageSize: number) {
  mediaPage.current = page
  mediaPage.pageSize = pageSize
  fetchMediaImages()
}

// 筛选条件变更：重置到第一页并重新拉取
function handleMediaFilterChange() {
  mediaPage.current = 1
  fetchMediaImages()
}

// 从媒体库选择头像
function handleSelectMedia(item: any) {
  profile.avatar = item.url
  mediaModalVisible.value = false
  message.success('已选择头像，请记得点击保存')
}

function isImage(mime: string): boolean {
  return mime?.startsWith('image/') || false
}

onMounted(() => {
  fetchProfile()
})
</script>

<template>
  <div>
    <div class="page-header">
      <h2>个人信息</h2>
    </div>

    <a-spin :spinning="loading">
      <a-row :gutter="[24, 24]">
        <!-- 基本信息 -->
        <a-col :xs="24" :lg="14">
          <div class="profile-section">
            <h3>基本信息</h3>
            <a-form layout="vertical">
              <a-form-item label="用户名">
                <a-input v-model:value="profile.username" disabled>
                  <template #prefix>
                    <UserOutlined/>
                  </template>
                </a-input>
              </a-form-item>
              <a-form-item label="角色">
                <a-tag color="blue">{{ profile.role === 'admin' ? '管理员' : profile.role }}</a-tag>
              </a-form-item>
              <a-form-item label="昵称" required>
                <a-input v-model:value="profile.nickname" placeholder="请输入昵称">
                  <template #prefix>
                    <UserOutlined/>
                  </template>
                </a-input>
              </a-form-item>
              <a-form-item label="邮箱" required>
                <a-input v-model:value="profile.email" placeholder="请输入邮箱">
                  <template #prefix>
                    <MailOutlined/>
                  </template>
                </a-input>
              </a-form-item>
              <a-form-item>
                <a-button type="primary" :loading="saving" @click="handleSaveProfile">
                  <template #icon>
                    <SaveOutlined/>
                  </template>
                  保存信息
                </a-button>
              </a-form-item>
            </a-form>
          </div>
        </a-col>

        <!-- 头像与密码 -->
        <a-col :xs="24" :lg="10">
          <div class="profile-section">
            <h3>头像设置</h3>
            <div class="avatar-wrapper">
              <div class="avatar-preview-box"
                   :title="profile.avatar ? '点击预览大图' : ''">
                <a-image :width="120" style="border-radius: 50%" :src="avatarUrl" :icon="UserOutlined"/>
              </div>
              <div class="avatar-upload">
                <a-space direction="vertical" :size="8">
                  <a-upload
                      :show-upload-list="false"
                      :before-upload="beforeAvatarUpload"
                      :custom-request="handleAvatarUpload"
                  >
                    <a-button :loading="avatarLoading">
                      <template #icon>
                        <UploadOutlined/>
                      </template>
                      上传头像
                    </a-button>
                  </a-upload>
                  <a-button @click="openMediaModal">
                    <template #icon>
                      <PictureOutlined/>
                    </template>
                    从媒体库选择
                  </a-button>
                  <a-button v-if="profile.avatar" type="link" danger size="small" @click="profile.avatar = ''">
                    移除头像
                  </a-button>
                </a-space>
                <div class="upload-tip">支持 JPG/PNG/WEBP，最大 2MB</div>
              </div>
            </div>
          </div>

          <div class="profile-section">
            <h3>修改密码</h3>
            <a-form layout="vertical">
              <a-form-item label="旧密码">
                <a-input-password v-model:value="passwordForm.old_password" placeholder="请输入旧密码">
                  <template #prefix>
                    <LockOutlined/>
                  </template>
                </a-input-password>
              </a-form-item>
              <a-form-item label="新密码">
                <a-input-password v-model:value="passwordForm.new_password" placeholder="请输入新密码">
                  <template #prefix>
                    <LockOutlined/>
                  </template>
                </a-input-password>
              </a-form-item>
              <a-form-item label="确认新密码">
                <a-input-password v-model:value="passwordForm.confirm_password" placeholder="请再次输入新密码">
                  <template #prefix>
                    <LockOutlined/>
                  </template>
                </a-input-password>
              </a-form-item>
              <a-form-item>
                <a-button type="primary" danger :loading="passwordLoading" @click="handleChangePassword">
                  修改密码
                </a-button>
              </a-form-item>
            </a-form>
          </div>
        </a-col>
      </a-row>
    </a-spin>

    <!-- 媒体库选择头像弹窗 -->
    <a-modal
        v-model:open="mediaModalVisible"
        title="从媒体库选择头像"
        width="760px"
        :footer="null"
        @cancel="mediaModalVisible = false"
    >
      <div class="media-filter-bar">
        <a-select
            v-model:value="mediaFilter.storage"
            style="width: 140px"
            placeholder="全部类型"
            allow-clear
            @change="handleMediaFilterChange"
        >
          <a-select-option value="local">本地</a-select-option>
          <a-select-option value="minio">MinIO</a-select-option>
        </a-select>
        <a-input-search
            v-model:value="mediaFilter.keyword"
            placeholder="按文件名搜索"
            style="width: 240px"
            allow-clear
            @search="handleMediaFilterChange"
        />
      </div>
      <a-spin :spinning="mediaLoading">
        <div v-if="mediaList.length" class="media-grid">
          <div
              v-for="item in mediaList"
              :key="item.id"
              class="media-item"
              @click="handleSelectMedia(item)"
              :title="`选择 ${item.original_name} 作为头像`"
          >
            <img v-if="isImage(item.mime_type)" :src="item.url" :alt="item.original_name"/>
            <div v-else class="media-placeholder">
              <PictureOutlined style="font-size: 32px; color: #999"/>
            </div>
            <div class="media-name" :title="item.original_name">{{ item.original_name }}</div>
            <div class="media-storage-tag" :class="item.storage">{{ item.storage === 'minio' ? 'MinIO' : '本地' }}</div>
          </div>
        </div>
        <a-empty v-else-if="!mediaLoading" description="媒体库暂无图片"/>
      </a-spin>
      <div v-if="mediaPage.total > mediaPage.pageSize" style="margin-top: 16px; text-align: right">
        <a-pagination
            :current="mediaPage.current"
            :page-size="mediaPage.pageSize"
            :total="mediaPage.total"
            size="small"
            show-size-changer
            @change="handleMediaPageChange"
        />
      </div>
    </a-modal>

    <!-- 头像大图预览 -->
    <a-modal
        v-model:open="avatarPreviewVisible"
        title="头像预览"
        :footer="null"
        @cancel="avatarPreviewVisible = false"
    >
      <div class="avatar-full-preview">
        <img v-if="profile.avatar" :src="profile.avatar" alt="头像预览" style="width: 100%"/>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
.profile-section {
  background: var(--color-bg-container);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 20px 24px;
  margin-bottom: 16px;
}

.profile-section h3 {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 20px;
  color: var(--color-text);
}

.avatar-wrapper {
  display: flex;
  align-items: center;
  gap: 24px;
}

.avatar-upload {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.upload-tip {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  max-height: 480px;
  overflow-y: auto;
  padding: 4px;
}

.media-item {
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: 6px;
  overflow: hidden;
  transition: border-color 0.2s;
  background: var(--color-bg-subtle);
}

.media-item:hover {
  border-color: #1677ff;
}

.media-item img {
  width: 100%;
  height: 100px;
  object-fit: cover;
  display: block;
}

.media-placeholder {
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-fill);
}

.media-name {
  font-size: 12px;
  color: var(--color-text-secondary);
  padding: 4px 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
