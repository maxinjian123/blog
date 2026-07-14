export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

export interface PaginationInfo {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface PaginatedData<T> {
  list: T[]
  pagination: PaginationInfo
}

export interface PaginatedResponse<T> extends ApiResponse<PaginatedData<T>> {}
