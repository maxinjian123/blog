<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import api from '@/utils/api'
import { useAuthStore } from '@/stores/auth'
import { message } from 'ant-design-vue'

const authStore = useAuthStore()

const settings = reactive({
  siteName: '3D Blog',
  siteDescription: '一个融合AI能力的3D个人博客',
  adminEmail: '',
  backendPort: 3001,
  frontendPort: 5173,
  adminPort: 5174
})

const loading = ref(false)
const profileLoading = ref(false)

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

onMounted(() => {
  settings.adminEmail = authStore.user?.email || ''
})

async function handleSaveSettings() {
  loading.value = true
  try {
    await api.put('/admin/settings', {
      site_name: settings.siteName,
      site_description: settings.siteDescription
    })
    message.success('设置已保存')
  } catch {
    message.error('保存失败')
  } finally {
    loading.value = false
  }
}

async function handleChangePassword() {
  if (!passwordForm.oldPassword) {
    message.warning('请输入当前密码')
    return
  }
  if (!passwordForm.newPassword) {
    message.warning('请输入新密码')
    return
  }
  if (passwordForm.newPassword.length < 6) {
    message.warning('新密码至少6位')
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    message.warning('两次密码输入不一致')
    return
  }
  profileLoading.value = true
  try {
    await api.put('/auth/password', {
      old_password: passwordForm.oldPassword,
      new_password: passwordForm.newPassword
    })
    message.success('密码修改成功，请重新登录')
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    setTimeout(() => {
      authStore.logout()
      window.location.href = '/login'
    }, 1500)
  } catch {
    message.error('密码修改失败')
  } finally {
    profileLoading.value = false
  }
}

async function handleClearCache() {
  try {
    await api.post('/admin/cache/clear')
    message.success('缓存已清除')
  } catch {
    message.error('清除失败')
  }
}

async function handleExportData() {
  try {
    const res: any = await api.get('/admin/export', { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res]))
    const link = document.createElement('a')
    link.href = url
    link.download = `blog-export-${Date.now()}.json`
    link.click()
    window.URL.revokeObjectURL(url)
    message.success('导出成功')
  } catch {
    message.error('导出失败')
  }
}
</script>

<template>
  <div>
    <div class="page-header">
      <h2>系统设置</h2>
    </div>

    <a-row :gutter="[24, 24]">
      <a-col :xs="24" :lg="14">
        <div class="settings-section">
          <h3>基本信息</h3>
          <a-form layout="vertical">
            <a-form-item label="站点名称">
              <a-input v-model:value="settings.siteName" />
            </a-form-item>
            <a-form-item label="站点描述">
              <a-textarea
                v-model:value="settings.siteDescription"
                :rows="3"
              />
            </a-form-item>
            <a-form-item label="管理员邮箱">
              <a-input
                v-model:value="settings.adminEmail"
                disabled
                placeholder="从登录账户获取"
              />
            </a-form-item>
            <a-form-item>
              <a-button type="primary" :loading="loading" @click="handleSaveSettings">
                保存设置
              </a-button>
            </a-form-item>
          </a-form>
        </div>

        <div class="settings-section">
          <h3>修改密码</h3>
          <a-form layout="vertical">
            <a-form-item label="当前密码">
              <a-input-password v-model:value="passwordForm.oldPassword" />
            </a-form-item>
            <a-form-item label="新密码">
              <a-input-password v-model:value="passwordForm.newPassword" />
            </a-form-item>
            <a-form-item label="确认新密码">
              <a-input-password v-model:value="passwordForm.confirmPassword" />
            </a-form-item>
            <a-form-item>
              <a-button
                type="primary"
                :loading="profileLoading"
                @click="handleChangePassword"
              >
                修改密码
              </a-button>
            </a-form-item>
          </a-form>
        </div>
      </a-col>

      <a-col :xs="24" :lg="10">
        <div class="settings-section">
          <h3>系统信息</h3>
          <a-descriptions :column="1" bordered size="small">
            <a-descriptions-item label="后端端口">
              {{ settings.backendPort }}
            </a-descriptions-item>
            <a-descriptions-item label="前端端口">
              {{ settings.frontendPort }}
            </a-descriptions-item>
            <a-descriptions-item label="管理后台端口">
              {{ settings.adminPort }}
            </a-descriptions-item>
            <a-descriptions-item label="数据库">
              MySQL
            </a-descriptions-item>
            <a-descriptions-item label="AI 引擎">
              豆包 (Doubao)
            </a-descriptions-item>
            <a-descriptions-item label="向量化模型">
              nomic-embed-text (Ollama)
            </a-descriptions-item>
          </a-descriptions>
        </div>

        <div class="settings-section">
          <h3>维护工具</h3>
          <a-space direction="vertical" style="width: 100%">
            <a-button block @click="handleClearCache">
              清除缓存
            </a-button>
            <a-button block @click="handleExportData">
              导出数据
            </a-button>
          </a-space>
        </div>
      </a-col>
    </a-row>
  </div>
</template>