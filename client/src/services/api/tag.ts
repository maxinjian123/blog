import { get } from '@/services/request'
import type { Tag, Article } from '@/types/models'
import type { PaginatedData } from '@/types/api'

export interface TagQuery {
  page?: number
  pageSize?: number
  keyword?: string
  sort?: string
  order?: 'ASC' | 'DESC'
}

export function fetchTags(params: TagQuery = {}) {
  return get<PaginatedData<Tag>>('/tags', { params })
}

export function fetchTagArticles(id: string, page = 1, pageSize = 10, keyword = '') {
  return get<PaginatedData<Article>>(`/tags/${id}/articles`, {
    params: { page, pageSize, keyword },
  })
}
