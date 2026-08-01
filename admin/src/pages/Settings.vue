<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import api from '@/utils/api'
import { useAuthStore } from '@/stores/auth'
import { message, Modal } from 'ant-design-vue'
import {
  MailOutlined,
  CloudUploadOutlined,
  InfoCircleOutlined,
  KeyOutlined,
  UploadOutlined,
  PictureOutlined,
  RobotOutlined
} from '@ant-design/icons-vue'

const authStore = useAuthStore()
const activeTab = ref<'site' | 'mail' | 'upload' | 'image_crawler' | 'ai'>('site')

const loading = ref(false)
const saving = ref(false)
const testingMail = ref(false)

// 站点 Logo 上传
const logoUploading = ref(false)
const logoMediaModalVisible = ref(false)
const logoMediaLoading = ref(false)
const logoMediaList = ref<any[]>([])
const logoMediaPage = reactive({ current: 1, pageSize: 24, total: 0 })
const logoMediaFilter = reactive({ storage: '' as '' | 'local' | 'minio', keyword: '' })

function beforeLogoUpload(file: File) {
  const isImg = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp' || file.type === 'image/svg+xml'
  if (!isImg) {
    message.error('仅支持 JPG/PNG/WEBP/SVG 格式的 Logo')
    return false
  }
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    message.error('Logo 大小不能超过 2MB')
    return false
  }
  return true
}

async function handleLogoUpload({ file }: any) {
  logoUploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file as File)
    const res: any = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    const data = res.data || res
    const url = data?.url || data?.data?.url || ''
    if (url) {
      siteForm.site_logo = url
      message.success('Logo 上传成功，请记得点击保存')
    } else {
      message.error('Logo 上传失败')
    }
  } catch {
    message.error('Logo 上传失败')
  } finally {
    logoUploading.value = false
  }
}

async function openLogoMediaModal() {
  logoMediaModalVisible.value = true
  logoMediaPage.current = 1
  await fetchLogoMediaImages()
}

async function fetchLogoMediaImages() {
  logoMediaLoading.value = true
  try {
    const res: any = await api.get('/media', {
      params: {
        page: logoMediaPage.current,
        pageSize: logoMediaPage.pageSize,
        mime: 'image',
        storage: logoMediaFilter.storage || undefined,
        keyword: logoMediaFilter.keyword || undefined
      }
    })
    const data = res.data || res
    logoMediaList.value = data?.list || []
    logoMediaPage.total = data?.pagination?.total || data?.total || 0
  } catch {
    message.error('加载媒体库失败')
    logoMediaList.value = []
  } finally {
    logoMediaLoading.value = false
  }
}

function handleLogoMediaPageChange(page: number, pageSize: number) {
  logoMediaPage.current = page
  logoMediaPage.pageSize = pageSize
  fetchLogoMediaImages()
}

function handleLogoMediaFilterChange() {
  logoMediaPage.current = 1
  fetchLogoMediaImages()
}

function handleSelectLogoMedia(item: any) {
  siteForm.site_logo = item.url
  logoMediaModalVisible.value = false
  message.success('已选择 Logo，请记得点击保存')
}

function isImage(mime: string): boolean {
  return mime?.startsWith('image/') || false
}

// 配置数据（从后端加载的分组结构）
const grouped = ref<Record<string, Record<string, { value: string; description: string }>>>({})

// 站点信息表单
const siteForm = reactive({
  site_name: '',
  site_description: '',
  site_url: '',
  site_logo: '',
  admin_email: ''
})

// 邮件配置表单
const mailForm = reactive({
  mail_host: 'smtp.qq.com',
  mail_port: '465',
  mail_secure: 'true',
  mail_user: '',
  mail_pass: '',
  mail_from_name: 'LinzyBlog'
})

// 上传配置表单
const uploadForm = reactive({
  upload_dir: './uploads',
  upload_max_size: '10mb',
  upload_default_storage: 'local',
  minio_enabled: 'false',
  minio_endpoint: 'http://111.228.9.147:9000',
  minio_port: '9000',
  minio_use_ssl: 'false',
  minio_access_key: 'admin',
  minio_secret_key: 'admin123',
  minio_bucket: 'blog',
  minio_public_base_url: 'http://111.228.9.147:9000',
  minio_region: ''
})

// 修改密码表单
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const profileLoading = ref(false)

// 爬虫配置表单
const crawlerForm = reactive({
  github_token: ''
})

// 图片抓取平台 API Key 表单
const imageCrawlerForm = reactive({
  pexels_api_key: '',
  pixabay_api_key: '',
  unsplash_api_key: ''
})

// AI 配置表单（豆包 + Ollama）
const aiForm = reactive({
  doubao_api_key: '',
  doubao_base_url: 'https://ark.cn-beijing.volces.com/api/v3',
  doubao_chat_model: '',
  doubao_image_model: '',
  ollama_host: 'http://localhost:11434',
  ollama_chat_enabled: 'true',
  ollama_chat_model: ''
})

// 记录敏感字段是否已配置（后端不返回明文，仅返回 hasValue 标志）
// 用于输入框 placeholder 提示：已配置时显示"已配置（不显示明文），如需修改请输入新值"
const sensitiveHasValue = reactive<Record<string, boolean>>({
  mail_pass: false,
  minio_secret_key: false,
  github_token: false,
  pexels_api_key: false,
  pixabay_api_key: false,
  unsplash_api_key: false,
  doubao_api_key: false
})

// 是否启用 MinIO（计算属性）
const minioEnabledBool = computed({
  get: () => uploadForm.minio_enabled === 'true',
  set: (v: boolean) => { uploadForm.minio_enabled = v ? 'true' : 'false' }
})

const mailSecureBool = computed({
  get: () => mailForm.mail_secure === 'true',
  set: (v: boolean) => { mailForm.mail_secure = v ? 'true' : 'false' }
})

const ollamaEnabledBool = computed({
  get: () => aiForm.ollama_chat_enabled === 'true',
  set: (v: boolean) => { aiForm.ollama_chat_enabled = v ? 'true' : 'false' }
})

// 从分组数据填充表单
function applyGroupedToForms() {
  const site = grouped.value.site || {}
  siteForm.site_name = site.site_name?.value || ''
  siteForm.site_description = site.site_description?.value || ''
  siteForm.site_url = site.site_url?.value || ''
  siteForm.site_logo = site.site_logo?.value || '/logo.svg'
  siteForm.admin_email = site.admin_email?.value || authStore.user?.email || ''

  const mail = grouped.value.mail || {}
  mailForm.mail_host = mail.mail_host?.value || 'smtp.qq.com'
  mailForm.mail_port = mail.mail_port?.value || '465'
  mailForm.mail_secure = mail.mail_secure?.value || 'true'
  mailForm.mail_user = mail.mail_user?.value || ''
  mailForm.mail_pass = mail.mail_pass?.value || ''
  mailForm.mail_from_name = mail.mail_from_name?.value || 'LinzyBlog'
  // 记录敏感字段是否已配置
  sensitiveHasValue.mail_pass = !!mail.mail_pass?.hasValue

  const upload = grouped.value.upload || {}
  uploadForm.upload_dir = upload.upload_dir?.value || './uploads'
  uploadForm.upload_max_size = upload.upload_max_size?.value || '10mb'
  uploadForm.upload_default_storage = upload.upload_default_storage?.value || 'local'
  uploadForm.minio_enabled = upload.minio_enabled?.value || 'false'
  uploadForm.minio_endpoint = upload.minio_endpoint?.value || 'http://111.228.9.147:9000'
  uploadForm.minio_port = upload.minio_port?.value || '9000'
  uploadForm.minio_use_ssl = upload.minio_use_ssl?.value || 'false'
  uploadForm.minio_access_key = upload.minio_access_key?.value || 'admin'
  uploadForm.minio_secret_key = upload.minio_secret_key?.value || ''
  uploadForm.minio_bucket = upload.minio_bucket?.value || 'blog'
  uploadForm.minio_public_base_url = upload.minio_public_base_url?.value || 'http://111.228.9.147:9000'
  uploadForm.minio_region = upload.minio_region?.value || ''
  sensitiveHasValue.minio_secret_key = !!upload.minio_secret_key?.hasValue

  const crawler = grouped.value.crawler || {}
  crawlerForm.github_token = crawler.github_token?.value || ''
  sensitiveHasValue.github_token = !!crawler.github_token?.hasValue

  const imageCrawler = grouped.value.image_crawler || {}
  imageCrawlerForm.pexels_api_key = imageCrawler.pexels_api_key?.value || ''
  imageCrawlerForm.pixabay_api_key = imageCrawler.pixabay_api_key?.value || ''
  imageCrawlerForm.unsplash_api_key = imageCrawler.unsplash_api_key?.value || ''
  sensitiveHasValue.pexels_api_key = !!imageCrawler.pexels_api_key?.hasValue
  sensitiveHasValue.pixabay_api_key = !!imageCrawler.pixabay_api_key?.hasValue
  sensitiveHasValue.unsplash_api_key = !!imageCrawler.unsplash_api_key?.hasValue

  const ai = grouped.value.ai || {}
  aiForm.doubao_api_key = ai.doubao_api_key?.value || ''
  aiForm.doubao_base_url = ai.doubao_base_url?.value || 'https://ark.cn-beijing.volces.com/api/v3'
  aiForm.doubao_chat_model = ai.doubao_chat_model?.value || ''
  aiForm.doubao_image_model = ai.doubao_image_model?.value || ''
  aiForm.ollama_host = ai.ollama_host?.value || 'http://localhost:11434'
  aiForm.ollama_chat_enabled = ai.ollama_chat_enabled?.value || 'true'
  aiForm.ollama_chat_model = ai.ollama_chat_model?.value || ''
  sensitiveHasValue.doubao_api_key = !!ai.doubao_api_key?.hasValue
}

async function fetchSettings() {
  loading.value = true
  try {
    const res: any = await api.get('/admin/settings')
    grouped.value = res.data || res || {}
    applyGroupedToForms()
  } catch {
    message.error('加载配置失败')
  } finally {
    loading.value = false
  }
}

// 通用保存：传入表单对象 -> 转 configs 数组
async function saveConfigs(formObj: Record<string, string>, successMsg = '配置已保存') {
  saving.value = true
  try {
    const configs = Object.entries(formObj).map(([key, value]) => ({ key, value: String(value) }))
    await api.put('/admin/settings', { configs })
    message.success(successMsg)
    // 重新拉取，确保前后端一致
    await fetchSettings()
  } catch {
    message.error('保存失败')
  } finally {
    saving.value = false
  }
}

function handleSaveSite() {
  return saveConfigs({ ...siteForm }, '站点信息已保存')
}

function handleSaveMail() {
  return saveConfigs({ ...mailForm }, '邮件配置已保存')
}

function handleSaveUpload() {
  return saveConfigs({ ...uploadForm }, '上传配置已保存')
}

function handleSaveCrawler() {
  return saveConfigs({ ...crawlerForm }, 'GitHub Token 已保存')
}

function handleSaveImageCrawler() {
  return saveConfigs({ ...imageCrawlerForm }, '图片抓取 API Key 已保存')
}

function handleSaveAI() {
  return saveConfigs({ ...aiForm }, 'AI 配置已保存')
}

// 测试邮件发送
async function handleTestMail() {
  // mail_pass 为敏感字段：表单值可能为空（未修改时后端不返回明文）
  // 只要 mail_user 已填且 mail_pass 已配置过（sensitiveHasValue）或本次新填，即可测试
  if (!mailForm.mail_user) {
    message.warning('请先填写发件人邮箱账号')
    return
  }
  if (!mailForm.mail_pass && !sensitiveHasValue.mail_pass) {
    message.warning('请先填写 SMTP 授权码')
    return
  }
  // 先保存再测试（mail_pass 为空时后端会跳过更新，保留原值）
  await handleSaveMail()
  testingMail.value = true
  try {
    const res: any = await api.post('/admin/test-mail', { to: mailForm.mail_user })
    message.success(res?.message || '测试邮件已发送，请查收')
  } catch (err: any) {
    message.error(err?.response?.data?.message || '测试邮件发送失败')
  } finally {
    testingMail.value = false
  }
}

// 测试 MinIO 连接
async function handleTestMinio() {
  if (!uploadForm.minio_endpoint || !uploadForm.minio_access_key) {
    message.warning('请先填写 MinIO 配置')
    return
  }
  await handleSaveUpload()
  try {
    const res: any = await api.get('/media/test-minio')
    message.success(res?.message || 'MinIO 连接成功')
  } catch (err: any) {
    message.error(err?.response?.data?.message || 'MinIO 连接失败')
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
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''

    // 弹窗提示需要重新登录，3 秒后自动跳转
    let countdown = 3
    const modal = Modal.success({
      title: '密码修改成功',
      content: `密码已修改，为了账号安全需要重新登录。将在 ${countdown} 秒后自动跳转登录页...`,
      okText: '立即登录',
      okCancel: false,
      onOk: () => {
        clearInterval(timer)
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

onMounted(() => {
  fetchSettings()
})
</script>

<template>
  <div>
    <div class="page-header">
      <h2>系统设置</h2>
    </div>

    <a-spin :spinning="loading">
      <a-tabs v-model:activeKey="activeTab" type="card">
        <!-- 站点信息 -->
        <a-tab-pane key="site">
          <template #tab>
            <span><info-circle-outlined /> 站点信息</span>
          </template>
          <div class="settings-section">
            <a-form layout="vertical" style="max-width: 600px">
              <a-form-item label="站点名称">
                <a-input v-model:value="siteForm.site_name" placeholder="如：LinzyBlog" />
              </a-form-item>
              <a-form-item label="站点 Logo" help="用于客户端导航栏、管理端侧边栏及浏览器标签页图标">
                <div class="logo-setting">
                  <div class="logo-preview">
                    <img v-if="siteForm.site_logo" :src="siteForm.site_logo" alt="logo" />
                    <div v-else class="logo-placeholder">
                      <PictureOutlined style="font-size: 24px; color: #999" />
                    </div>
                  </div>
                  <div class="logo-actions">
                    <a-space direction="vertical" :size="8">
                      <a-upload
                        :show-upload-list="false"
                        :before-upload="beforeLogoUpload"
                        :custom-request="handleLogoUpload"
                      >
                        <a-button :loading="logoUploading">
                          <template #icon><UploadOutlined /></template>
                          上传 Logo
                        </a-button>
                      </a-upload>
                      <a-button @click="openLogoMediaModal">
                        <template #icon><PictureOutlined /></template>
                        从媒体库选择
                      </a-button>
                    </a-space>
                    <a-input v-model:value="siteForm.site_logo" placeholder="/logo.svg 或完整 URL" style="margin-top: 8px" />
                    <div class="upload-tip">支持 JPG/PNG/WEBP/SVG，建议尺寸 128x128，最大 2MB</div>
                  </div>
                </div>
              </a-form-item>
              <a-form-item label="站点描述">
                <a-textarea v-model:value="siteForm.site_description" :rows="3" />
              </a-form-item>
              <a-form-item label="站点地址" help="用于邮件链接、sitemap 等">
                <a-input v-model:value="siteForm.site_url" placeholder="https://example.com" />
              </a-form-item>
              <a-form-item label="管理员邮箱">
                <a-input v-model:value="siteForm.admin_email" placeholder="admin@example.com" />
              </a-form-item>
              <a-form-item>
                <a-button type="primary" :loading="saving" @click="handleSaveSite">保存设置</a-button>
              </a-form-item>
            </a-form>
          </div>
        </a-tab-pane>

        <!-- 邮件配置 -->
        <a-tab-pane key="mail">
          <template #tab>
            <span><mail-outlined /> 邮件配置</span>
          </template>
          <div class="settings-section">
            <a-alert
              message="QQ 邮箱需在邮箱设置中开启 SMTP 服务并使用授权码作为密码"
              type="info"
              show-icon
              style="margin-bottom: 16px"
            />
            <a-form layout="vertical" style="max-width: 600px">
              <a-row :gutter="16">
                <a-col :span="14">
                  <a-form-item label="SMTP 服务器">
                    <a-input v-model:value="mailForm.mail_host" />
                  </a-form-item>
                </a-col>
                <a-col :span="10">
                  <a-form-item label="端口">
                    <a-input v-model:value="mailForm.mail_port" />
                  </a-form-item>
                </a-col>
              </a-row>
              <a-form-item label="启用 SSL">
                <a-switch v-model:checked="mailSecureBool" />
                <span style="margin-left: 12px; color: rgba(0,0,0,0.45)">
                  {{ mailSecureBool ? '已启用 (465 通常启用)' : '未启用 (587 通常关闭)' }}
                </span>
              </a-form-item>
              <a-form-item label="发件人邮箱账号">
                <a-input v-model:value="mailForm.mail_user" placeholder="例：xxx@qq.com" />
              </a-form-item>
              <a-form-item label="SMTP 授权码">
                <a-input-password
                  v-model:value="mailForm.mail_pass"
                  :placeholder="sensitiveHasValue.mail_pass ? '已配置（不显示明文），如需修改请输入新值' : '邮箱授权码，非登录密码'"
                />
              </a-form-item>
              <a-form-item label="发件人显示名称">
                <a-input v-model:value="mailForm.mail_from_name" />
              </a-form-item>
              <a-space>
                <a-button type="primary" :loading="saving" @click="handleSaveMail">保存配置</a-button>
                <a-button :loading="testingMail" @click="handleTestMail">发送测试邮件</a-button>
              </a-space>
            </a-form>
          </div>
        </a-tab-pane>

        <!-- 上传配置 -->
        <a-tab-pane key="upload">
          <template #tab>
            <span><cloud-upload-outlined /> 上传配置</span>
          </template>

          <div class="settings-section">
            <h3>本地上传</h3>
            <a-form layout="vertical" style="max-width: 600px">
              <a-row :gutter="16">
                <a-col :span="14">
                  <a-form-item label="上传目录">
                    <a-input v-model:value="uploadForm.upload_dir" placeholder="./uploads" />
                  </a-form-item>
                </a-col>
                <a-col :span="10">
                  <a-form-item label="文件大小上限">
                    <a-input v-model:value="uploadForm.upload_max_size" placeholder="10mb" />
                  </a-form-item>
                </a-col>
              </a-row>
            </a-form>
          </div>

          <div class="settings-section">
            <h3>默认上传源</h3>
            <a-form layout="vertical" style="max-width: 600px">
              <a-form-item label="默认上传源" help="未指定时使用的上传源">
                <a-radio-group v-model:value="uploadForm.upload_default_storage">
                  <a-radio value="local">本地</a-radio>
                  <a-radio value="minio" :disabled="uploadForm.minio_enabled !== 'true'">MinIO</a-radio>
                </a-radio-group>
              </a-form-item>
            </a-form>
          </div>

          <div class="settings-section">
            <h3>
              <a-switch v-model:checked="minioEnabledBool" size="small" style="margin-right: 8px" />
              MinIO 对象存储
            </h3>
            <a-alert
              message="MinIO 配置用于将文件上传到对象存储，启用后可在媒体库中选择上传源"
              type="info"
              show-icon
              style="margin-bottom: 16px"
            />
            <a-form layout="vertical" style="max-width: 600px" :disabled="!minioEnabledBool">
              <a-row :gutter="16">
                <a-col :span="14">
                  <a-form-item label="服务地址">
                    <a-input v-model:value="uploadForm.minio_endpoint" placeholder="http://111.228.9.147:9000" />
                  </a-form-item>
                </a-col>
                <a-col :span="10">
                  <a-form-item label="端口">
                    <a-input v-model:value="uploadForm.minio_port" />
                  </a-form-item>
                </a-col>
              </a-row>
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item label="AccessKey">
                    <a-input v-model:value="uploadForm.minio_access_key" />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="SecretKey">
                    <a-input-password
                      v-model:value="uploadForm.minio_secret_key"
                      :placeholder="sensitiveHasValue.minio_secret_key ? '已配置（不显示明文），如需修改请输入新值' : ''"
                    />
                  </a-form-item>
                </a-col>
              </a-row>
              <a-row :gutter="16">
                <a-col :span="8">
                  <a-form-item label="桶名">
                    <a-input v-model:value="uploadForm.minio_bucket" />
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item label="Region" help="非空时覆盖默认 region">
                    <a-input v-model:value="uploadForm.minio_region" placeholder="us-east-1" />
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item label="公开访问基址" help="用于拼接文件 URL">
                    <a-input v-model:value="uploadForm.minio_public_base_url" />
                  </a-form-item>
                </a-col>
              </a-row>
              <a-space>
                <a-button type="primary" :loading="saving" @click="handleSaveUpload">保存配置</a-button>
                <a-button :disabled="!minioEnabledBool" @click="handleTestMinio">测试连接</a-button>
              </a-space>
            </a-form>
          </div>
        </a-tab-pane>

        <!-- 图片抓取平台 API Key -->
        <a-tab-pane key="image_crawler">
          <template #tab>
            <span><picture-outlined /> 图片抓取</span>
          </template>
          <div class="settings-section">
            <a-alert
              message="Pexels / Pixabay / Unsplash 提供免费图片 API，需注册账号申请 API Key 后填入下方。保存后即可在「图片抓取」页面使用对应平台。"
              type="info"
              show-icon
              style="margin-bottom: 16px"
            />
            <a-form layout="vertical" style="max-width: 600px">
              <a-form-item label="Pexels API Key" help="在 https://www.pexels.com/api/ 注册申请">
                <a-input-password
                  v-model:value="imageCrawlerForm.pexels_api_key"
                  :placeholder="sensitiveHasValue.pexels_api_key ? '已配置（不显示明文），如需修改请输入新值' : '563492ad6f9170000100000xxxxx...'"
                  allow-clear
                />
              </a-form-item>
              <a-form-item label="Pixabay API Key" help="在 https://pixabay.com/accounts/register/ 注册后在账户页面获取">
                <a-input-password
                  v-model:value="imageCrawlerForm.pixabay_api_key"
                  :placeholder="sensitiveHasValue.pixabay_api_key ? '已配置（不显示明文），如需修改请输入新值' : '12345678-xxxx-xxxx-xxxx-xxxxxxxxxxxx'"
                  allow-clear
                />
              </a-form-item>
              <a-form-item label="Unsplash Access Key" help="在 https://unsplash.com/developers 注册应用后获取 Access Key">
                <a-input-password
                  v-model:value="imageCrawlerForm.unsplash_api_key"
                  :placeholder="sensitiveHasValue.unsplash_api_key ? '已配置（不显示明文），如需修改请输入新值' : 'dQxxx...'"
                  allow-clear
                />
              </a-form-item>
              <a-form-item>
                <a-button type="primary" :loading="saving" @click="handleSaveImageCrawler">
                  保存 API Key
                </a-button>
              </a-form-item>
            </a-form>
          </div>
        </a-tab-pane>

        <!-- AI 配置 -->
        <a-tab-pane key="ai">
          <template #tab>
            <span><robot-outlined /> AI 配置</span>
          </template>
          <div class="settings-section">
            <h3>云端模型（OpenAI 兼容）</h3>
            <a-alert
              message="支持所有兼容 OpenAI 接口格式的云端模型服务（豆包/DeepSeek/Kimi/OpenAI/通义千问等）。填入服务方提供的 Base URL、API Key 与模型 ID 即可接入。"
              type="info"
              show-icon
              style="margin-bottom: 16px"
            />
            <a-form layout="vertical" style="max-width: 600px">
              <a-form-item label="API Key" help="服务方控制台获取的 API Key">
                <a-input-password
                  v-model:value="aiForm.doubao_api_key"
                  :placeholder="sensitiveHasValue.doubao_api_key ? '已配置（不显示明文），如需修改请输入新值' : 'sk-xxxxxxxxxxxxxxxxxxxx'"
                  allow-clear
                />
              </a-form-item>
              <a-form-item label="Base URL" help="OpenAI 兼容 API 基址">
                <a-input v-model:value="aiForm.doubao_base_url" placeholder="https://ark.cn-beijing.volces.com/api/v3" />
              </a-form-item>
              <a-form-item label="对话模型 ID" help="服务方提供的对话模型标识（豆包填接入点 ep-xxx，其他服务填对应模型名）">
                <a-input v-model:value="aiForm.doubao_chat_model" placeholder="doubao-seed-2-0-mini-260428" />
              </a-form-item>
              <a-form-item label="图片生成模型 ID" help="图片生成模型标识，用于文章封面生成（无图片生成需求可留空）">
                <a-input v-model:value="aiForm.doubao_image_model" placeholder="doubao-seedream-4-5-251128" />
              </a-form-item>
            </a-form>
          </div>

          <div class="settings-section">
            <h3>
              <a-switch v-model:checked="ollamaEnabledBool" size="small" style="margin-right: 8px" />
              Ollama（本地对话模型）
            </h3>
            <a-alert
              message="Ollama 提供本地对话能力，启用后优先使用本地模型，不可用时自动降级到云端模型"
              type="info"
              show-icon
              style="margin-bottom: 16px"
            />
            <a-form layout="vertical" style="max-width: 600px" :disabled="!ollamaEnabledBool">
              <a-form-item label="服务地址" help="Ollama API 地址">
                <a-input v-model:value="aiForm.ollama_host" placeholder="http://localhost:11434" />
              </a-form-item>
              <a-form-item label="对话模型" help="本地部署的模型名称">
                <a-input v-model:value="aiForm.ollama_chat_model" placeholder="glm4:9b" />
              </a-form-item>
            </a-form>
          </div>

          <div class="settings-section">
            <a-button type="primary" :loading="saving" @click="handleSaveAI">
              保存 AI 配置
            </a-button>
          </div>
        </a-tab-pane>

        <!-- 安全 -->
        <a-tab-pane key="security">
          <template #tab>
            <span><key-outlined /> 安全与维护</span>
          </template>
          <a-row :gutter="[24, 24]">
            <a-col :xs="24" :lg="14">
              <div class="settings-section">
                <h3>修改密码</h3>
                <a-form layout="vertical" style="max-width: 400px">
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
                    <a-button type="primary" :loading="profileLoading" @click="handleChangePassword">
                      修改密码
                    </a-button>
                  </a-form-item>
                </a-form>
              </div>
            </a-col>
            <a-col :xs="24" :lg="10">
              <div class="settings-section">
                <h3>维护工具</h3>
                <a-space direction="vertical" style="width: 100%">
                  <a-button block @click="handleClearCache">清除缓存</a-button>
                  <a-button block @click="handleExportData">导出数据</a-button>
                </a-space>
              </div>
              <div class="settings-section">
                <h3>系统信息</h3>
                <a-descriptions :column="1" bordered size="small">
                  <a-descriptions-item label="数据库">MySQL</a-descriptions-item>
                  <a-descriptions-item label="AI 引擎">豆包 (Doubao)</a-descriptions-item>
                  <a-descriptions-item label="向量化模型">nomic-embed-text (Ollama)</a-descriptions-item>
                  <a-descriptions-item label="对象存储">MinIO (可启用)</a-descriptions-item>
                </a-descriptions>
              </div>
              <div class="settings-section">
                <h3>GitHub 抓取配置</h3>
                <a-form layout="vertical">
                  <a-form-item
                    label="Personal Access Token"
                    help="用于 GitHub 仓库搜索与内容爬取，配置后可将限流从 60次/小时提升至 5000次/小时"
                  >
                    <a-input-password
                      v-model:value="crawlerForm.github_token"
                      :placeholder="sensitiveHasValue.github_token ? '已配置（不显示明文），如需修改请输入新值' : 'ghp_xxxxxxxxxxxxxxxxxxxx'"
                      allow-clear
                    />
                  </a-form-item>
                  <a-form-item>
                    <a-button type="primary" :loading="saving" @click="handleSaveCrawler">
                      保存 Token
                    </a-button>
                  </a-form-item>
                </a-form>
              </div>
            </a-col>
          </a-row>
        </a-tab-pane>
      </a-tabs>
    </a-spin>

    <!-- Logo 媒体库选择弹窗 -->
    <a-modal
      v-model:open="logoMediaModalVisible"
      title="从媒体库选择 Logo"
      width="760px"
      :footer="null"
      @cancel="logoMediaModalVisible = false"
    >
      <div class="media-filter-bar">
        <a-select
          v-model:value="logoMediaFilter.storage"
          style="width: 140px"
          placeholder="全部类型"
          allow-clear
          @change="handleLogoMediaFilterChange"
        >
          <a-select-option value="local">本地</a-select-option>
          <a-select-option value="minio">MinIO</a-select-option>
        </a-select>
        <a-input-search
          v-model:value="logoMediaFilter.keyword"
          placeholder="按文件名搜索"
          style="width: 240px"
          allow-clear
          @search="handleLogoMediaFilterChange"
        />
      </div>
      <a-spin :spinning="logoMediaLoading">
        <div v-if="logoMediaList.length" class="media-grid">
          <div
            v-for="item in logoMediaList"
            :key="item.id"
            class="media-item"
            @click="handleSelectLogoMedia(item)"
          >
            <img v-if="isImage(item.mime_type)" :src="item.url" :alt="item.original_name" />
            <div v-else class="media-placeholder">
              <PictureOutlined style="font-size: 32px; color: #999" />
            </div>
            <div class="media-name" :title="item.original_name">{{ item.original_name }}</div>
          </div>
        </div>
        <a-empty v-else-if="!logoMediaLoading" description="媒体库暂无图片" />
      </a-spin>
      <div v-if="logoMediaPage.total > logoMediaPage.pageSize" style="margin-top: 16px; text-align: right">
        <a-pagination
          :current="logoMediaPage.current"
          :page-size="logoMediaPage.pageSize"
          :total="logoMediaPage.total"
          size="small"
          show-size-changer
          @change="handleLogoMediaPageChange"
        />
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
.settings-section {
  padding: 20px 24px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  margin-bottom: 16px;
}

.settings-section h3 {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
}

.logo-setting {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.logo-preview {
  width: 96px;
  height: 96px;
  flex-shrink: 0;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
}

.logo-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 6px;
}

.logo-placeholder {
  color: #999;
}

.logo-actions {
  flex: 1;
}

.upload-tip {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  margin-top: 4px;
}

.media-filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
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
  background: #fafafa;
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
  background: #f5f5f5;
}

.media-name {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.65);
  padding: 4px 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
