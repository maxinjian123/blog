import { ref, reactive, computed } from 'vue'
import api from '@/utils/api'
import { message, Modal } from 'ant-design-vue'
import { h } from 'vue'
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'

export interface MediaItem {
  id: string
  filename: string
  original_name: string
  mime_type: string
  size: number
  storage: 'local' | 'minio'
  url: string
  path: string
  created_at: string
}

export interface MediaTypeOption {
  value: string
  label: string
  color: string
}

export type StorageFilter = '' | 'local' | 'minio'
export type LayoutMode = 'card' | 'table'

/**
 * 媒体库管理逻辑 composable
 * 封装列表查询、上传、删除、重命名、迁移、类型加载等数据操作
 * 供 MediaLibrary 容器组件及其子组件共享使用
 */
export function useMediaLibrary() {
  // ============ 列表状态 ============
  const list = ref<MediaItem[]>([])
  const loading = ref(false)
  const total = ref(0)
  const stats = ref({ local: 0, minio: 0, total: 0 })

  // 查询条件
  const query = reactive({
    page: 1,
    pageSize: 10,
    storage: '' as StorageFilter,
    keyword: '',
    mime: ''  // 主类型筛选
  })

  // ============ 类型列表 ============
  const types = ref<MediaTypeOption[]>([])
  const typesLoading = ref(false)

  // ============ MinIO 启用状态 ============
  const minioEnabled = ref(false)

  // ============ 计算属性 ============
  const storageTabs = computed(() => [
    { key: '' as StorageFilter, label: '全部', count: stats.value.total },
    { key: 'local' as StorageFilter, label: '本地', count: stats.value.local },
    {
      key: 'minio' as StorageFilter,
      label: 'MinIO',
      count: stats.value.minio,
      disabled: !minioEnabled.value
    }
  ])

  // ============ 查询方法 ============
  async function fetchList() {
    loading.value = true
    try {
      const res: any = await api.get('/media', {
        params: {
          page: query.page,
          pageSize: query.pageSize,
          storage: query.storage || undefined,
          keyword: query.keyword || undefined,
          mime: query.mime || undefined
        }
      })
      const data = res.data || res
      // 兼容后端返回的 createdAt（camelCase）字段，统一映射为 created_at
      list.value = (data?.list || []).map((item: any) => ({
        ...item,
        created_at: item.created_at || item.createdAt
      }))
      total.value = data?.pagination?.total ?? data?.total ?? 0
      if (data?.stats) {
        stats.value = data.stats
      }
    } catch (err) {
      console.error('获取媒体列表失败:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchTypes() {
    typesLoading.value = true
    try {
      const res: any = await api.get('/media/types')
      const data = res.data || res
      types.value = Array.isArray(data) ? data : (data?.data || [])
    } catch (err) {
      console.error('获取文件类型列表失败:', err)
    } finally {
      typesLoading.value = false
    }
  }

  async function fetchUploadConfig() {
    try {
      const res: any = await api.get('/admin/settings')
      const grouped = res.data || res || {}
      const upload = grouped.upload || {}
      minioEnabled.value = upload.minio_enabled?.value === 'true'
    } catch {
      // 忽略
    }
  }

  // ============ 查询条件变更 ============
  function handleStorageChange(key: StorageFilter) {
    query.storage = key
    query.page = 1
    fetchList()
  }

  function handleSearch() {
    query.page = 1
    fetchList()
  }

  function handleMimeChange() {
    query.page = 1
    fetchList()
  }

  function handlePageChange(page: number, pageSize: number) {
    query.page = page
    query.pageSize = pageSize
    fetchList()
  }

  // ============ 删除 ============
  function handleDelete(item: MediaItem) {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除文件「${item.original_name}」吗？此操作不可恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        try {
          await api.delete(`/media/${item.id}`)
          message.success('文件已删除')
          await fetchList()
        } catch {
          message.error('删除失败')
        }
      }
    })
  }

  // ============ 重命名 ============
  async function handleRenameSubmit(id: string, newName: string) {
    if (!newName?.trim()) {
      message.warning('请输入文件名')
      return false
    }
    try {
      await api.put(`/media/${id}`, { original_name: newName })
      message.success('已重命名')
      await fetchList()
      return true
    } catch {
      message.error('重命名失败')
      return false
    }
  }

  // ============ 单文件迁移 ============
  async function handleMigrate(item: MediaItem, targetStorage: 'local' | 'minio') {
    if (item.storage === targetStorage) {
      message.info('文件已在目标存储源，无需迁移')
      return false
    }
    if (targetStorage === 'minio' && !minioEnabled.value) {
      message.error('MinIO 未启用，无法迁移')
      return false
    }
    const targetLabel = targetStorage === 'minio' ? 'MinIO' : '本地'
    const sourceLabel = item.storage === 'minio' ? 'MinIO' : '本地'
    Modal.confirm({
      title: '确认迁移',
      icon: h(ExclamationCircleOutlined),
      content: `确定要将「${item.original_name}」从${sourceLabel}迁移到${targetLabel}吗？迁移后将删除原存储位置的文件。`,
      okText: '迁移',
      cancelText: '取消',
      async onOk() {
        const hide = message.loading(`正在迁移到${targetLabel}...`, 0)
        try {
          await api.post(`/media/${item.id}/migrate`, { storage: targetStorage })
          hide()
          message.success(`已迁移到${targetLabel}`)
          await fetchList()
        } catch (err: any) {
          hide()
          const msg = err?.response?.data?.message || '迁移失败'
          message.error(msg)
        }
      }
    })
    return true
  }

  // ============ 批量迁移 ============
  async function handleBatchMigrate(ids: string[], targetStorage: 'local' | 'minio') {
    if (ids.length === 0) {
      message.warning('请先选择要迁移的文件')
      return
    }
    if (targetStorage === 'minio' && !minioEnabled.value) {
      message.error('MinIO 未启用，无法迁移')
      return
    }
    const targetLabel = targetStorage === 'minio' ? 'MinIO' : '本地'
    Modal.confirm({
      title: '确认批量迁移',
      icon: h(ExclamationCircleOutlined),
      content: `确定要将选中的 ${ids.length} 个文件迁移到${targetLabel}吗？迁移后将删除原存储位置的文件。`,
      okText: '迁移',
      cancelText: '取消',
      async onOk() {
        const hide = message.loading(`正在批量迁移到${targetLabel}...`, 0)
        try {
          const res: any = await api.post('/media/batch-migrate', {
            ids,
            storage: targetStorage
          })
          hide()
          const data = res.data?.data || res.data || {}
          const succeeded = data.succeeded?.length ?? 0
          const failed = data.failed?.length ?? 0
          if (failed > 0) {
            message.warning(`成功 ${succeeded} 个，失败 ${failed} 个`)
          } else {
            message.success(`成功迁移 ${succeeded} 个文件到${targetLabel}`)
          }
          await fetchList()
        } catch (err: any) {
          hide()
          const msg = err?.response?.data?.message || '批量迁移失败'
          message.error(msg)
        }
      }
    })
  }

  // ============ 复制链接 ============
  async function handleCopyUrl(item: MediaItem) {
    let url = item.url
    if (item.storage === 'local' && url.startsWith('/uploads/')) {
      // Electron 桌面端：用后端地址拼接，Web 端用 origin
      const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI
      if (isElectron) {
        const base = localStorage.getItem('admin_api_base_url') || ''
        url = base ? `${base}${url}` : url
      } else {
        url = `${window.location.origin}${url}`
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      message.success('链接已复制')
    } catch {
      const input = document.createElement('textarea')
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      message.success('链接已复制')
    }
  }

  return {
    // 状态
    list,
    loading,
    total,
    stats,
    query,
    types,
    typesLoading,
    minioEnabled,
    storageTabs,
    // 查询
    fetchList,
    fetchTypes,
    fetchUploadConfig,
    handleStorageChange,
    handleSearch,
    handleMimeChange,
    handlePageChange,
    // 操作
    handleDelete,
    handleRenameSubmit,
    handleMigrate,
    handleBatchMigrate,
    handleCopyUrl
  }
}
