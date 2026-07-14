import { get } from '@/services/request'
import type { Category } from '@/types/models'

export function fetchCategories() {
  return get<Category[]>('/categories')
}
