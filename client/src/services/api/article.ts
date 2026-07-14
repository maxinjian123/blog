import { get, post } from '@/services/request'
import type { Article, ArchiveYear, Comment } from '@/types/models'
import type { PaginatedData } from '@/types/api'

export interface ArticleQuery {
  page?: number
  pageSize?: number
  category_id?: string
  tag_id?: string
  keyword?: string
  sort?: string
  order?: 'ASC' | 'DESC'
}

export function fetchArticles(params: ArticleQuery = {}) {
  return get<PaginatedData<Article>>('/articles', { params })
}

export function fetchArticle(id: string) {
  return get<Article>(`/articles/${id}`)
}

export function fetchArchive() {
  return get<{ archive: ArchiveYear[]; total: number }>('/articles/archive')
}

export function likeArticle(id: string) {
  return post<{ like_count: number; id: string }>(`/articles/${id}/like`)
}

export function fetchComments(id: string, cursor?: string, pageSize = 30) {
  return get<{ list: Comment[]; cursor: string | null; hasMore: boolean; total: number }>(
    `/articles/${id}/comments`,
    { params: { cursor, pageSize } }
  )
}

export interface CommentForm {
  content: string
  qq_number: string
  parent_id?: string
  content_type?: 'text' | 'markdown'
  captcha_key: string
  captcha_code: string
}

export function postComment(id: string, data: CommentForm) {
  return post<Comment>(`/articles/${id}/comments`, data)
}

export function likeComment(articleId: string, commentId: string) {
  return post<{ like_count: number; id: string }>(`/articles/${articleId}/comments/${commentId}/like`)
}
