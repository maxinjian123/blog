import { ref, reactive, computed } from 'vue'
import api from '@/utils/api'
import { message } from 'ant-design-vue'

/**
 * 文章抓取平台类型
 */
export type ArticlePlatformId = 'juejin' | 'zhihu' | 'csdn' | 'rss'

export interface ArticlePlatform {
  id: ArticlePlatformId
  label: string
  type: 'article'
  /** 平台可能受限（反爬/需验证码），用于前端提示 */
  unstable?: boolean
}

export interface ArticleItem {
  id: string
  title: string
  summary: string
  cover: string
  author: string
  source_url: string
  publish_time: number
  /** 平台前缀唯一键（跨平台去重选择用） */
  _key?: string
}

export interface Category {
  id: string
  name: string
  slug: string
}

export interface PreviewData {
  title: string
  author: string
  source_url: string
  source_platform: string
  publish_time: number
  cover: string
  content: string
  truncated: boolean
}

export interface ImportResult {
  imported: number
  failed: number
  results: Array<{ id: string; title: string; slug: string; summary: string; tags: string[]; source_url: string }>
  failed_list: Array<{ title: string; reason: string }>
}

/**
 * 文章抓取管理逻辑 composable
 * 封装平台列表、搜索、预览、导入等数据操作
 */
export function useArticleCrawler() {
  // ============ 平台列表 ============
  const platforms = ref<ArticlePlatform[]>([
    { id: 'juejin', label: '掘金', type: 'article' },
    { id: 'csdn', label: 'CSDN', type: 'article' },
    { id: 'rss', label: '通用 RSS', type: 'article' },
    { id: 'zhihu', label: '知乎', type: 'article' }
  ])

  // ============ 搜索状态 ============
  const loading = ref(false)
  const list = ref<ArticleItem[]>([])
  const total = ref(0)
  const query = reactive({
    keyword: '',
    platform: 'juejin' as ArticlePlatformId,
    page: 1,
    pageSize: 10,
    rss_url: ''
  })
  const selectedRowKeys = ref<string[]>([])

  const isRss = computed(() => query.platform === 'rss')
  const hasMore = computed(() => list.value.length < total.value)

  // ============ 导入配置 ============
  const importConfig = reactive({
    autoSummary: true,
    autoTags: true,
    category_id: '' as string
  })
  const categories = ref<Category[]>([])
  const importing = ref(false)
  const importResult = ref<ImportResult | null>(null)

  // ============ 预览 ============
  const previewVisible = ref(false)
  const previewLoading = ref(false)
  const previewData = ref<PreviewData | null>(null)

  /**
   * 搜索文章（服务端分页）
   */
  async function fetchList() {
    if (!query.keyword.trim()) {
      message.warning('请输入搜索关键词')
      return
    }
    if (isRss.value && !query.rss_url.trim()) {
      message.warning('请填写 RSS 源地址')
      return
    }
    loading.value = true
    try {
      const params: Record<string, any> = {
        keyword: query.keyword.trim(),
        platform: query.platform,
        page: query.page,
        pageSize: query.pageSize
      }
      if (isRss.value) {
        params.rss_url = query.rss_url.trim()
      }
      const res: any = await api.get('/article-crawler/search', { params })
      const data = res.data || res
      list.value = (data?.list || []).map((it: ArticleItem) => ({ ...it, _key: `${query.platform}-${it.id}` }))
      total.value = data?.total || 0
      selectedRowKeys.value = []
    } catch (err: any) {
      message.error(err?.response?.data?.message || '搜索失败')
    } finally {
      loading.value = false
    }
  }

  /**
   * 切换平台时清空结果
   */
  function handlePlatformChange() {
    list.value = []
    total.value = 0
    query.page = 1
    selectedRowKeys.value = []
  }

  /**
   * 表格翻页/改每页条数
   */
  async function handleTableChange(pagination: { current?: number; pageSize?: number }) {
    query.page = pagination.current || 1
    query.pageSize = pagination.pageSize || 10
    await fetchList()
  }

  /**
   * 预览文章正文
   */
  async function fetchPreview(item: ArticleItem) {
    previewVisible.value = true
    previewLoading.value = true
    previewData.value = null
    try {
      const res: any = await api.post('/article-crawler/preview', {
        platform: query.platform,
        item,
        rss_url: isRss.value ? query.rss_url.trim() : undefined
      })
      previewData.value = res.data
    } catch (err: any) {
      message.error(err?.response?.data?.message || '预览失败')
      previewVisible.value = false
    } finally {
      previewLoading.value = false
    }
  }

  /**
   * 导入选中的文章为草稿
   */
  async function handleImport(): Promise<ImportResult | null> {
    if (selectedRowKeys.value.length === 0) {
      message.warning('请至少选择一篇文章')
      return null
    }
    const selected = list.value.filter(it => !!it._key && selectedRowKeys.value.includes(it._key))
    if (selected.length === 0) {
      message.warning('请至少选择一篇文章')
      return null
    }
    const items = selected.map(it => ({
      platform: query.platform,
      item: it,
      rss_url: isRss.value ? query.rss_url.trim() : undefined
    }))
    importing.value = true
    try {
      const res: any = await api.post('/article-crawler/import', {
        items,
        autoSummary: importConfig.autoSummary,
        autoTags: importConfig.autoTags,
        category_id: importConfig.category_id || undefined
      })
      const result: ImportResult = res.data || { imported: 0, failed: 0, results: [], failed_list: [] }
      importResult.value = result
      message.success(res.message || `成功导入 ${result.imported} 篇，失败 ${result.failed} 篇`)
      if (result.imported > 0) {
        // 已导入成功的在原列表中标记，避免重复选择导入
        const importedUrls = new Set(result.results.map(r => r.source_url))
        list.value = list.value.filter(it => !importedUrls.has(it.source_url))
        total.value = Math.max(0, total.value - result.imported)
        selectedRowKeys.value = []
      }
      return result
    } catch (err: any) {
      message.error(err?.response?.data?.message || '导入失败')
      return null
    } finally {
      importing.value = false
    }
  }

  /**
   * 加载分类列表（导入时选择分类）
   */
  async function fetchCategories() {
    try {
      const res: any = await api.get('/categories')
      categories.value = res.data || res || []
    } catch {
      // 忽略
    }
  }

  return {
    platforms,
    loading,
    list,
    total,
    query,
    isRss,
    hasMore,
    selectedRowKeys,
    importConfig,
    categories,
    importing,
    importResult,
    previewVisible,
    previewLoading,
    previewData,
    fetchList,
    handlePlatformChange,
    handleTableChange,
    fetchPreview,
    handleImport,
    fetchCategories
  }
}
