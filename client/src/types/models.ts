export interface User {
  id: string | number
  username: string
  avatar?: string
  nickname?: string
  role?: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  article_count?: number
}

export interface Tag {
  id: string
  name: string
  slug: string
  articleCount?: number
}

export interface Article {
  id: string
  title: string
  slug: string
  content: string
  summary?: string
  cover?: string
  status: 'draft' | 'published' | 'archived'
  view_count: number
  like_count: number
  comment_count?: number
  content_type: 'html' | 'markdown'
  published_at?: string
  created_at: string
  updated_at: string
  author?: User
  category?: Category
  tags?: Tag[]
  catalog?: Array<{ level: number; text: string; id: string }>
}

export interface Comment {
  id: string
  article_id: string
  user_id?: string | number
  parent_id?: string
  author_name: string
  author_email?: string
  avatar?: string
  content: string
  content_type: 'text' | 'markdown'
  is_approved: boolean
  is_ai_reply: boolean
  like_count: number
  created_at: string
  user?: User
  parent_author_name?: string
  replies: Comment[]
}

export interface Announcement {
  id: number
  content: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface SiteInfo {
  site_name: string
  author_email: string
  site_description: string
  author_name: string
  author_bio: string
  author_avatar?: string
}

export interface ArchiveYear {
  year: number
  months: Array<{
    month: number
    articles: Array<{ id: string; title: string; published_at: string }>
  }>
}

export interface Captcha {
  key: string
  svg: string
}
