import { ref, reactive, computed } from 'vue'
import api from '@/utils/api'
import { message } from 'ant-design-vue'

/**
 * 图片抓取平台类型
 */
export type ImagePlatformId = 'bing' | 'baidu' | 'dogetu' | 'pexels' | 'pixabay' | 'unsplash'

export interface ImagePlatform {
  id: ImagePlatformId
  label: string
  type: 'image' | 'meme'
  /** 是否需要 API Key（用于前端提示） */
  needsApiKey?: boolean
}

export interface ImageItem {
  id: string
  title: string
  thumb: string
  original: string
  source_url: string
  author: string
  width: number
  height: number
  format: string
  _selected?: boolean
}

export interface DownloadResult {
  id: string
  original_name: string
  url: string
  storage: 'local' | 'minio'
}

/**
 * 图片抓取管理逻辑 composable
 * 封装平台列表、搜索、单/批量下载等数据操作
 */
export function useImageCrawler() {
  // ============ 平台列表 ============
  const platforms = ref<ImagePlatform[]>([
    { id: 'bing', label: 'Bing 图片', type: 'image' },
    { id: 'baidu', label: '百度图片', type: 'image' },
    { id: 'dogetu', label: 'dogetu 表情包', type: 'meme' },
    { id: 'pexels', label: 'Pexels', type: 'image', needsApiKey: true },
    { id: 'pixabay', label: 'Pixabay', type: 'image', needsApiKey: true },
    { id: 'unsplash', label: 'Unsplash', type: 'image', needsApiKey: true }
  ])

  // ============ 搜索状态 ============
  const loading = ref(false) // 首次/重置加载
  const loadingMore = ref(false) // 触底加载下一页
  const downloading = ref(false)
  const list = ref<ImageItem[]>([])
  const total = ref(0)
  const query = reactive({
    keyword: '',
    platform: 'bing' as ImagePlatformId,
    page: 1,
    pageSize: 20
  })

  // 是否还有更多（触底加载依据）
  const hasMore = computed(() => list.value.length < total.value && !reachedEnd.value)

  // 连续空加载计数：连续多次追加无新数据则视为到底，停止触底加载
  const emptyFetchCount = ref(0)
  const reachedEnd = ref(false)

  // ============ MinIO 启用状态 ============
  const minioEnabled = ref(false)

  // ============ 下载目标存储 ============
  const targetStorage = ref<'local' | 'minio'>('local')

  /**
   * 拉取 MinIO 启用状态，决定下载目标选项是否可用
   */
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

  /**
   * 搜索图片/表情包
   * @param reset true=重置并替换列表（搜索/切换平台）；false=追加下一页（触底加载）
   */
  async function fetchList(reset = true) {
    if (!query.keyword.trim()) {
      message.warning('请输入搜索关键词')
      return
    }
    if (reset) {
      loading.value = true
    } else {
      loadingMore.value = true
    }
    try {
      const res: any = await api.get('/image-crawler/search', {
        params: {
          keyword: query.keyword,
          platform: query.platform,
          page: query.page,
          pageSize: query.pageSize
        }
      })
      const data = res.data || res
      const mapped: ImageItem[] = (data?.list || []).map((item: ImageItem) => ({ ...item, _selected: false }))
      if (reset) {
        list.value = mapped
        emptyFetchCount.value = 0
        reachedEnd.value = false
      } else {
        // 追加模式：去重（同一 id 不重复添加）
        const existingIds = new Set(list.value.map(i => i.id))
        let newItems = mapped.filter(i => !existingIds.has(i.id))
        // 兜底：接口返回了新数据但 id 全部与已有重复（不同平台 id 策略差异）时，
        // 强制追加，避免页面数据停滞不渲染
        if (newItems.length === 0 && mapped.length > 0) {
          newItems = mapped.map((it, idx) => ({ ...it, id: `${it.id}-p${query.page}-${idx}` }))
        }
        if (newItems.length > 0) {
          list.value.push(...newItems)
          emptyFetchCount.value = 0
        } else {
          // 连续 2 次无新数据则停止触底加载
          emptyFetchCount.value += 1
          if (emptyFetchCount.value >= 2) {
            reachedEnd.value = true
          }
        }
      }
      total.value = data?.total || 0
    } catch (err: any) {
      const msg = err?.response?.data?.message || '搜索失败'
      message.error(msg)
    } finally {
      loading.value = false
      loadingMore.value = false
    }
  }

  /**
   * 触底加载下一页（防重入：加载中或已到末尾则忽略）
   */
  async function loadMore() {
    if (loading.value || loadingMore.value) return
    if (!hasMore.value) return
    query.page += 1
    await fetchList(false)
  }

  /**
   * 切换平台时清空结果
   */
  function handlePlatformChange() {
    list.value = []
    total.value = 0
    query.page = 1
  }

  /**
   * 切换存储目标时校验 MinIO
   */
  function handleStorageChange(val: 'local' | 'minio') {
    if (val === 'minio' && !minioEnabled.value) {
      message.warning('MinIO 未启用，已切换回本地')
      targetStorage.value = 'local'
      return
    }
    targetStorage.value = val
  }

  /**
   * 单张下载
   */
  async function handleDownload(item: ImageItem) {
    downloading.value = true
    try {
      const res: any = await api.post('/image-crawler/download', {
        platform: query.platform,
        storage: targetStorage.value,
        item
      })
      message.success(`已下载到${targetStorage.value === 'minio' ? 'MinIO' : '本地'}：${item.title}`)
      return res.data
    } catch (err: any) {
      const msg = err?.response?.data?.message || '下载失败'
      message.error(msg)
      return null
    } finally {
      downloading.value = false
    }
  }

  /**
   * 批量下载选中的图片
   */
  async function handleBatchDownload() {
    const selected = list.value.filter(i => i._selected)
    if (selected.length === 0) {
      message.warning('请先选择要下载的图片')
      return
    }
    downloading.value = true
    try {
      const hide = message.loading(`正在下载 ${selected.length} 张图片...`, 0)
      const res: any = await api.post('/image-crawler/batch-download', {
        platform: query.platform,
        storage: targetStorage.value,
        items: selected
      })
      hide()
      const data = res.data?.data || res.data || {}
      const succeeded = data.succeeded?.length ?? 0
      const failed = data.failed?.length ?? 0
      if (failed > 0) {
        message.warning(`成功 ${succeeded} 张，失败 ${failed} 张`)
      } else {
        message.success(`成功下载 ${succeeded} 张图片`)
      }
      // 清空选中
      list.value.forEach(i => (i._selected = false))
    } catch (err: any) {
      const msg = err?.response?.data?.message || '批量下载失败'
      message.error(msg)
    } finally {
      downloading.value = false
    }
  }

  /**
   * 切换全选/反选
   */
  function handleSelectAll(checked: boolean) {
    list.value.forEach(i => (i._selected = checked))
  }

  function handleSearch() {
    query.page = 1
    fetchList(true)
  }

  return {
    platforms,
    loading,
    loadingMore,
    downloading,
    list,
    total,
    query,
    hasMore,
    minioEnabled,
    targetStorage,
    fetchUploadConfig,
    fetchList,
    loadMore,
    handlePlatformChange,
    handleStorageChange,
    handleDownload,
    handleBatchDownload,
    handleSelectAll,
    handleSearch
  }
}
