import api from '@/utils/api'
import {defineStore} from 'pinia'
import {computed, ref} from 'vue'

export interface Article {
    id: string
    title: string
    slug: string
    excerpt: string
    content: string
    content_type: string
    tags: Tag[]
    cover_image: string
    category: string
    category_slug: string
    author: string
    created_at: string
    updated_at: string
    published: boolean
    featured: boolean
    view_count: number
    like_count: number
    comment_count: number
    similarity?: number
    catalog: Array<{ text: string; level: number }>
}

export interface Tag {
    id: string
    name: string
    slug: string
}

export interface ArticleListResponse {
    articles: Article[]
    total: number
    page: number
    pageSize: number
}

export const useArticleStore = defineStore('article', () => {
    const articles = ref<Article[]>([])
    const currentArticle = ref<Article | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)
    const total = ref(0)
    const page = ref(1)
    const pageSize = ref(12)

    const featuredArticles = computed(() =>
        articles.value.filter((a) => a.featured)
    )

    const articlesByCategory = computed(() => {
        const map: Record<string, Article[]> = {}
        articles.value.forEach((a) => {
            if (!map[a.category_slug]) map[a.category_slug] = []
            map[a.category_slug].push(a)
        })
        return map
    })

    async function fetchArticles(params?: {
        page?: number
        pageSize?: number
        category_id?: string
        keyword?: string
        featured?: boolean
    }) {
        loading.value = true
        error.value = null
        try {
            const res = await api.get('/articles', {params})
            const payload = res.data
            const data = payload.data || payload
            const list = data.list || data.rows || []
            articles.value = list.map((a: any) => ({
                id: String(a.id),
                title: a.title,
                slug: a.slug,
                excerpt: a.summary || '',
                content: a.content || '',
                content_type: a.content_type || 'html',
                cover_image: a.cover || '',
                category: a.category?.name || a.category || '',
                category_slug: a.category?.slug || a.category_slug || '',
                tags: (a.tags || []).map((t: any) => (typeof t === 'string' ? t : t.name)),
                author: a.author?.username || a.author || '',
                created_at: a.created_at || a.createdAt || '',
                updated_at: a.updated_at || a.updatedAt || '',
                published: a.status === 'published',
                featured: a.featured || false,
                view_count: a.view_count || a.viewCount || 0,
                like_count: a.like_count || 0,
                comment_count: a.comment_count || 0,
                similarity: a.similarity,
                catalog: a.catalog || []
            }))
            total.value = data.pagination?.total || data.total || 0
            page.value = data.page || 1
            pageSize.value = data.pageSize || 12
        } catch (e: any) {
            error.value = e?.response?.data?.message || '加载文章失败'
        } finally {
            loading.value = false
        }
    }

    async function fetchArticle(id: string) {
        loading.value = true
        error.value = null
        try {
            const res = await api.get(`/articles/${id}`)
            const payload = res.data
            const a = payload.data || payload
            currentArticle.value = {
                id: String(a.id),
                title: a.title,
                slug: a.slug,
                excerpt: a.summary || '',
                content: a.content || '',
                content_type: a.content_type || 'html',
                cover_image: a.cover || '',
                category: a.category?.name || '',
                category_slug: a.category?.slug || '',
                tags: a.tags,
                author: a.author?.username || '',
                created_at: a.created_at || '',
                updated_at: a.updated_at || '',
                published: a.status === 'published',
                featured: a.featured || false,
                view_count: a.view_count || 0,
                like_count: a.like_count || 0,
                comment_count: a.comment_count || 0,
                catalog: a.catalog || []
            }
            return currentArticle.value
        } catch (e: any) {
            error.value = e?.response?.data?.message || '加载文章失败'
            return null
        } finally {
            loading.value = false
        }
    }

    async function fetchArticlesByCategory(slug: string) {
        return fetchArticles({category_id: slug})
    }

    async function searchArticles(query: string) {
        loading.value = true
        error.value = null
        try {
            const res = await api.get('/articles/search/vector', {
                params: {q: query, limit: pageSize.value}
            })
            const payload = res.data
            const data = payload.data || payload
            const list = data.list || data.rows || []
            articles.value = list.map((a: any) => ({
                id: String(a.id),
                title: a.title,
                slug: a.slug,
                excerpt: a.summary || '',
                content: a.content || '',
                content_type: a.content_type || 'html',
                cover_image: a.cover || '',
                category: a.category?.name || a.category || '',
                category_slug: a.category?.slug || a.category_slug || '',
                tags: (a.tags || []).map((t: any) => (typeof t === 'string' ? t : t.name)),
                author: a.author?.username || a.author || '',
                created_at: a.created_at || a.createdAt || '',
                updated_at: a.updated_at || a.updatedAt || '',
                published: a.status === 'published',
                featured: a.featured || false,
                view_count: a.view_count || a.viewCount || 0,
                like_count: a.like_count || 0,
                comment_count: a.comment_count || 0,
                similarity: a.similarity,
                catalog: a.catalog || []
            }))
            total.value = data.pagination?.total || data.total || 0
            page.value = 1
        } catch (e: any) {
            error.value = e?.response?.data?.message || '搜索失败'
        } finally {
            loading.value = false
        }
    }

    return {
        articles,
        currentArticle,
        loading,
        error,
        total,
        page,
        pageSize,
        featuredArticles,
        articlesByCategory,
        fetchArticles,
        fetchArticle,
        fetchArticlesByCategory,
        searchArticles,
    }
})