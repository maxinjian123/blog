import type { Article } from '@/stores/article'

/**
 * 将后端文章对象映射为前端 Article 结构。
 * 与 stores/article.ts 中的映射保持一致，供首页多数据源场景（杂志版/瀑布流）复用。
 */
export function mapArticle(a: any): Article {
  return {
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
    author: a.author?.nickname || a.author || '',
    created_at: a.created_at || a.createdAt || '',
    updated_at: a.updated_at || a.updatedAt || '',
    published: a.status === 'published',
    featured: a.featured || false,
    view_count: a.view_count || 0,
    like_count: a.like_count || 0,
    comment_count: a.comment_count || 0,
    catalog: a.catalog || [],
  }
}

/** 从响应中解包文章列表 */
export function unwrapArticleList(payload: any): any[] {
  const data = payload?.data || payload
  return data?.list || data?.rows || []
}
