import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  fetchArticles as getArticles,
  fetchArticle as getArticle,
  fetchArchive as getArchive,
  fetchComments as getComments,
  likeArticle,
  likeComment,
  postComment,
  type ArticleQuery,
  type CommentForm,
} from '@/services/api/article'
import type { Article, ArchiveYear, Comment } from '@/types/models'

export const useArticleStore = defineStore('article', () => {
  const articles = ref<Article[]>([])
  const recentArticles = ref<Article[]>([])
  const total = ref(0)
  const currentArticle = ref<Article | null>(null)
  const archive = ref<ArchiveYear[]>([])
  const comments = ref<Comment[]>([])
  const commentCursor = ref<string | null>(null)
  const hasMoreComments = ref(false)
  const loading = ref(false)

  async function fetchArticles(query: ArticleQuery = {}) {
    loading.value = true
    try {
      const res = await getArticles(query)
      articles.value = res.list
      total.value = res.pagination.total
      return res
    } finally {
      loading.value = false
    }
  }

  async function fetchRecentArticles(pageSize = 5) {
    loading.value = true
    try {
      const res = await getArticles({ pageSize })
      recentArticles.value = res.list
      total.value = res.pagination.total
      return res
    } finally {
      loading.value = false
    }
  }

  async function fetchArticle(id: string) {
    loading.value = true
    try {
      const res = await getArticle(id)
      currentArticle.value = res
      return res
    } finally {
      loading.value = false
    }
  }

  async function fetchArchive() {
    loading.value = true
    try {
      const res = await getArchive()
      archive.value = res.archive
      return res
    } finally {
      loading.value = false
    }
  }

  async function fetchComments(id: string, append = false) {
    if (loading.value) return
    loading.value = true
    try {
      const res = await getComments(id, commentCursor.value || undefined)
      if (append) {
        comments.value.push(...res.list)
      } else {
        comments.value = res.list
      }
      commentCursor.value = res.cursor
      hasMoreComments.value = res.hasMore
      return res
    } finally {
      loading.value = false
    }
  }

  async function submitComment(id: string, form: CommentForm) {
    const res = await postComment(id, form)

    // 如果有 parent_id，说明是回复，需要挂载到对应父评论的 replies 中
    if (res.parent_id) {
      const parent = findCommentById(comments.value, res.parent_id)
      if (parent) {
        if (!parent.replies) {
          parent.replies = []
        }
        res.parent_author_name = parent.author_name
        parent.replies.push(res)
      } else {
        comments.value.unshift(res)
      }
    } else {
      comments.value.unshift(res)
    }

    if (currentArticle.value) {
      currentArticle.value.comment_count = (currentArticle.value.comment_count || 0) + 1
    }
    return res
  }

  async function submitLikeArticle(id: string) {
    const res = await likeArticle(id)
    if (currentArticle.value && currentArticle.value.id === id) {
      currentArticle.value.like_count = res.like_count
    }
    return res
  }

  async function submitLikeComment(articleId: string, commentId: string) {
    const res = await likeComment(articleId, commentId)
    const comment = findCommentById(comments.value, commentId)
    if (comment) {
      comment.like_count = res.like_count
    }
    return res
  }

  function findCommentById(list: Comment[], id: string): Comment | null {
    for (const c of list) {
      if (c.id === id) return c
      if (c.replies?.length) {
        const found = findCommentById(c.replies, id)
        if (found) return found
      }
    }
    return null
  }

  function resetComments() {
    comments.value = []
    commentCursor.value = null
    hasMoreComments.value = false
  }

  return {
    articles,
    recentArticles,
    total,
    currentArticle,
    archive,
    comments,
    commentCursor,
    hasMoreComments,
    loading,
    fetchArticles,
    fetchRecentArticles,
    fetchArticle,
    fetchArchive,
    fetchComments,
    submitComment,
    submitLikeArticle,
    submitLikeComment,
    resetComments,
  }
})
