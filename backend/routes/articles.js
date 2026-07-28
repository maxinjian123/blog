const express = require('express')
const {auth, optionalAuth} = require('../middleware/auth')
const {success, error, paginated} = require('../utils/response')
const {Article, User, Category, Tag, Comment} = require('../models')
const {Op, Sequelize} = require('sequelize')
const {getQQInfo} = require('../services/qq')
const {sendReplyNotification} = require('../services/mail')
const captchaRouter = require('./captcha')
const verifyCaptcha = captchaRouter.verifyCaptcha
const redis = require('../utils/redis')
const {recordVisitStats} = require('../utils/visitStats')

const router = express.Router()

// 从 markdown 内容提取目录（h1-h6），跳过代码块内的 #
function extractCatalog(md) {
    if (!md || typeof md !== 'string') return []
    const catalog = []
    const lines = md.split('\n')
    let inCodeBlock = false
    for (const line of lines) {
        if (/^```/.test(line.trim())) { inCodeBlock = !inCodeBlock; continue }
        if (inCodeBlock) continue
        const m = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/)
        if (m) {
            const level = m[1].length
            const text = m[2].replace(/[`*_~]/g, '').trim()
            if (text) catalog.push({ text, level })
        }
    }
    return catalog
}

router.get('/archive', optionalAuth, async (req, res, next) => {
    try {
        const articles = await Article.findAll({
            where: {status: 'published'},
            attributes: ['id', 'title', 'published_at'],
            order: [['published_at', 'DESC']]
        })

        const archiveMap = {}

        for (const a of articles) {
            const d = new Date(a.published_at)
            const year = String(d.getFullYear())
            const month = String(d.getMonth() + 1).padStart(2, '0')
            if (!archiveMap[year]) archiveMap[year] = {}
            if (!archiveMap[year][month]) archiveMap[year][month] = []
            archiveMap[year][month].push({
                id: a.id,
                title: a.title,
                published_at: a.published_at
            })
        }

        const archiveList = Object.entries(archiveMap)
            .sort(([a], [b]) => Number(b) - Number(a))
            .map(([year, months]) => ({
                year: Number(year),
                months: Object.entries(months)
                    .sort(([a], [b]) => Number(b) - Number(a))
                    .map(([month, articles]) => ({
                        month: Number(month),
                        articles
                    }))
            }))

        return success(res, {archive: archiveList, total: articles.length})
    } catch (err) {
        next(err)
    }
})

router.get('/', optionalAuth, async (req, res, next) => {
    try {
        const {
            page = 1,
            pageSize = 10,
            status = '',
            category_id,
            tag_id,
            keyword,
            sort = 'created_at',
            order = 'DESC'
        } = req.query

        const where = {}

        // 检查请求来源：客户端请求（不携带status参数 或 非管理端请求）只返回已发布文章
        const isClient = req.headers['x-client-type'] === 'blog-client'
        if (isClient) {
            where.status = 'published'
        } else if (status) {
            where.status = status
        }

        if (category_id) where.category_id = category_id
        if (keyword) {
            where[Op.or] = [{title: {[Op.like]: `%${keyword}%`}}, {summary: {[Op.like]: `%${keyword}%`}}]
        }

        const include = [
            {model: User, as: 'author', attributes: ['id', 'username', 'avatar','nickname']},
            {model: Category, as: 'category', attributes: ['id', 'name', 'slug']},
            {model: Tag, as: 'tags', attributes: ['id', 'name', 'slug'], through: {attributes: []}}
        ]

        if (tag_id) {
            include[2].where = {id: tag_id}
        }

        const {count, rows} = await Article.findAndCountAll({
            where,
            // 返回已发布的
            include,
            order: [[sort, order]],
            limit: Number(pageSize),
            offset: (Number(page) - 1) * Number(pageSize),
            distinct: true
        })

        return paginated(res, {list: rows, total: count, page, pageSize})
    } catch (err) {
        next(err)
    }
})

router.get('/:id', optionalAuth, async (req, res, next) => {
    try {
        const article = await Article.findByPk(req.params.id, {
            include: [
                {model: User, as: 'author', attributes: ['id', 'username', 'avatar']},
                {model: Category, as: 'category', attributes: ['id', 'name', 'slug']},
                {model: Tag, as: 'tags', attributes: ['id', 'name', 'slug'], through: {attributes: []}}
            ]
        })

        if (!article) {
            return error(res, '文章不存在', 404)
        }

        // 阅读量限流：单IP24小时内最多增加3次阅读量
        const ip = req.ip || req.headers['x-forwarded-for'] || '0.0.0.0'
        const viewKey = `article_view:${req.params.id}:${ip}`
        const viewCount = await redis.get(viewKey)

        if (!viewCount || parseInt(viewCount) < 3) {
            // 未达上限，增加阅读量
            await article.increment('view_count')
            if (!viewCount) {
                await redis.set(viewKey, '1', 'EX', 86400) // 24小时
            } else {
                const ttl = await redis.ttl(viewKey)
                await redis.set(viewKey, String(parseInt(viewCount) + 1), 'EX', ttl > 0 ? ttl : 86400)
            }
            
            // 记录访客统计信息（来源、设备、小时分布）
            const referer = req.headers['referer'] || req.headers['referrer'] || ''
            const userAgent = req.headers['user-agent'] || ''
            await recordVisitStats({ referer, userAgent, redis })
        }

        // 获取评论数
        const commentCount = await Comment.count({
            where: {article_id: req.params.id, is_approved: true}
        })

        const result = article.toJSON()
        result.comment_count = commentCount

        return success(res, result)
    } catch (err) {
        next(err)
    }
})

// F1: 相关文章推荐（同标签优先，同分类兜底，排除当前文章，返回3篇）
router.get('/:id/related', async (req, res, next) => {
    try {
        const current = await Article.findByPk(req.params.id, {
            include: [{model: Tag, as: 'tags', attributes: ['id'], through: {attributes: []}}]
        })
        if (!current) return error(res, '文章不存在', 404)

        const tagIds = current.tags?.map(t => t.id) || []
        const limit = Number(req.query.limit) || 3
        const excludeId = req.params.id

        let related = []
        // 优先：共享至少1个标签的文章，按共享标签数降序
        if (tagIds.length) {
            related = await Article.findAll({
                where: {
                    id: {[Op.ne]: excludeId},
                    status: 'published'
                },
                include: [
                    {model: User, as: 'author', attributes: ['id', 'username', 'avatar']},
                    {model: Category, as: 'category', attributes: ['id', 'name', 'slug']},
                    {model: Tag, as: 'tags', attributes: ['id', 'name', 'slug'], through: {attributes: []}}
                ],
                order: [['published_at', 'DESC']],
                limit: 20
            })
            // 计算共享标签数，按共享数降序，取前 limit
            related = related
                .map(a => {
                    const shared = (a.tags || []).filter(t => tagIds.includes(t.id)).length
                    return {article: a, shared}
                })
                .filter(x => x.shared > 0)
                .sort((a, b) => b.shared - a.shared || new Date(b.article.published_at) - new Date(a.article.published_at))
                .slice(0, limit)
                .map(x => x.article)
        }

        // 兜底：同分类文章
        if (related.length < limit) {
            const existingIds = new Set([excludeId, ...related.map(a => a.id)])
            const fill = await Article.findAll({
                where: {
                    id: {[Op.notIn]: [...existingIds]},
                    status: 'published',
                    category_id: current.category_id
                },
                include: [
                    {model: User, as: 'author', attributes: ['id', 'username', 'avatar']},
                    {model: Category, as: 'category', attributes: ['id', 'name', 'slug']},
                    {model: Tag, as: 'tags', attributes: ['id', 'name', 'slug'], through: {attributes: []}}
                ],
                order: [['published_at', 'DESC']],
                limit: limit - related.length
            })
            related = related.concat(fill)
        }

        // 最后兜底：最新文章
        if (related.length < limit) {
            const existingIds = new Set([excludeId, ...related.map(a => a.id)])
            const fill = await Article.findAll({
                where: {
                    id: {[Op.notIn]: [...existingIds]},
                    status: 'published'
                },
                include: [
                    {model: User, as: 'author', attributes: ['id', 'username', 'avatar']},
                    {model: Category, as: 'category', attributes: ['id', 'name', 'slug']},
                    {model: Tag, as: 'tags', attributes: ['id', 'name', 'slug'], through: {attributes: []}}
                ],
                order: [['published_at', 'DESC']],
                limit: limit - related.length
            })
            related = related.concat(fill)
        }

        // 精简字段
        const data = related.map(a => ({
            id: a.id,
            title: a.title,
            slug: a.slug,
            summary: a.summary,
            cover: a.cover,
            published_at: a.published_at,
            view_count: a.view_count,
            category: a.category,
            tags: a.tags
        }))

        return success(res, data)
    } catch (err) {
        next(err)
    }
})

// F3: 上下篇导航（按 published_at 排序）
router.get('/:id/neighbors', async (req, res, next) => {
    try {
        const current = await Article.findByPk(req.params.id, {attributes: ['id', 'published_at']})
        if (!current) return error(res, '文章不存在', 404)

        const baseInclude = [
            {model: User, as: 'author', attributes: ['id', 'username', 'avatar']},
            {model: Category, as: 'category', attributes: ['id', 'name', 'slug']}
        ]

        // prev: published_at < current，取最近一篇
        const prev = await Article.findOne({
            where: {
                id: {[Op.ne]: req.params.id},
                status: 'published',
                published_at: {[Op.lt]: current.published_at}
            },
            include: baseInclude,
            order: [['published_at', 'DESC']]
        })

        // next: published_at > current，取最早一篇
        const next = await Article.findOne({
            where: {
                id: {[Op.ne]: req.params.id},
                status: 'published',
                published_at: {[Op.gt]: current.published_at}
            },
            include: baseInclude,
            order: [['published_at', 'ASC']]
        })

        const pick = a => a ? {
            id: a.id,
            title: a.title,
            slug: a.slug,
            cover: a.cover,
            published_at: a.published_at,
            category: a.category
        } : null

        return success(res, {prev: pick(prev), next: pick(next)})
    } catch (err) {
        next(err)
    }
})

router.post('/', auth, async (req, res, next) => {
    try {
        const {title, slug, content, summary, cover, status, category_id, tags, content_type, catalog} = req.body
        if (!title || !content) {
            return error(res, '标题和内容不能为空', 400)
        }
        const article = await Article.create({
            title,
            slug:
                slug ||
                title
                    .toLowerCase()
                    .replace(/\s+/g, '-')
                    .replace(/[^a-z0-9-]/g, ''),
            content,
            summary,
            cover,
            status: status || 'draft',
            author_id: req.user.id,
            published_at: status === 'published' ? new Date() : null,
            category_id,
            content_type: ['html', 'markdown'].includes(content_type) ? content_type : 'html',
            catalog: catalog || (content_type === 'markdown' ? extractCatalog(content) : null)
        })

        if (tags && Array.isArray(tags)) {
            const tagInstances = await Promise.all(
                tags.map(async tagName => {
                    const [tag] = await Tag.findOrCreate({
                        where: {name: tagName},
                        defaults: {name: tagName, slug: tagName.toLowerCase().replace(/\s+/g, '-')}
                    })
                    return tag
                })
            )
            await article.setTags(tagInstances)
        }

        const result = await Article.findByPk(article.id, {
            include: [
                {model: User, as: 'author', attributes: ['id', 'username', 'avatar']},
                {model: Category, as: 'category'},
                {model: Tag, as: 'tags', through: {attributes: []}}
            ]
        })

        return success(res, result, '文章创建成功', 201)
    } catch (err) {
        next(err)
    }
})

router.put('/:id', auth, async (req, res, next) => {
    try {
        const article = await Article.findByPk(req.params.id)
        if (!article) {
            return error(res, '文章不存在', 404)
        }

        const {title, slug, content, summary, cover, status, category_id, tags, content_type, catalog} = req.body

        await article.update({
            title: title || article.title,
            slug: slug || article.slug,
            content: content || article.content,
            summary: summary !== undefined ? summary : article.summary,
            cover: cover !== undefined ? cover : article.cover,
            status: status || article.status,
            published_at: status === 'published' ? new Date() : null,
            category_id: category_id !== undefined ? category_id : article.category_id,
            content_type: content_type !== undefined ? (['html', 'markdown'].includes(content_type) ? content_type : article.content_type) : article.content_type,
            catalog: catalog !== undefined ? catalog : (content && (content_type === 'markdown' || (content_type === undefined && article.content_type === 'markdown')) ? extractCatalog(content) : article.catalog)
        })

        if (tags && Array.isArray(tags)) {
            const tagInstances = await Promise.all(
                tags.map(async tagName => {
                    const [tag] = await Tag.findOrCreate({
                        where: {name: tagName},
                        defaults: {name: tagName, slug: tagName.toLowerCase().replace(/\s+/g, '-')}
                    })
                    return tag
                })
            )
            await article.setTags(tagInstances)
        }

        const result = await Article.findByPk(article.id, {
            include: [
                {model: User, as: 'author', attributes: ['id', 'username', 'avatar']},
                {model: Category, as: 'category'},
                {model: Tag, as: 'tags', through: {attributes: []}}
            ]
        })

        return success(res, result, '文章更新成功')
    } catch (err) {
        next(err)
    }
})

router.delete('/:id', auth, async (req, res, next) => {
    try {
        const article = await Article.findByPk(req.params.id)
        if (!article) {
            return error(res, '文章不存在', 404)
        }

        await article.destroy()

        return success(res, null, '文章删除成功')
    } catch (err) {
        next(err)
    }
})

router.post('/batch-delete', auth, async (req, res, next) => {
    try {
        const {ids} = req.body
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return error(res, 'ids参数不能为空', 400)
        }

        await Article.destroy({where: {id: {[Op.in]: ids}}})

        return success(res, null, `成功删除 ${ids.length} 篇文章`)
    } catch (err) {
        next(err)
    }
})

router.get('/:id/comments', async (req, res, next) => {
    try {
        const {cursor, pageSize = 30} = req.query

        const where = {
            article_id: req.params.id,
            is_approved: true
        }

        if (cursor) {
            where.id = {[Op.lt]: cursor}
        }

        const rows = await Comment.findAll({
            where,
            order: [
                ['created_at', 'DESC'],
                ['id', 'DESC']
            ],
            limit: Number(pageSize),
            include: [{model: User, as: 'user', attributes: ['id', 'username', 'avatar', 'role']}],
            raw: true,
            nest: true
        })

        // 获取所有父评论的作者名（用于回复显示）
        const parentIds = rows.filter(c => c.parent_id).map(c => c.parent_id)
        const parentAuthors = {}
        if (parentIds.length > 0) {
            const parents = await Comment.findAll({
                where: {id: {[Op.in]: [...new Set(parentIds)]}},
                attributes: ['id', 'author_name'],
                raw: true
            })
            parents.forEach(p => {
                parentAuthors[p.id] = p.author_name
            })
        }

        // 组织无限层级嵌套评论
        const commentMap = new Map()
        const rootComments = []

        for (const c of rows) {
            commentMap.set(c.id, {
                ...c,
                user: c.user?.id ? c.user : null,
                parent_author_name: c.parent_id ? parentAuthors[c.parent_id] || null : null,
                replies: []
            })
        }

        for (const c of rows) {
            const node = commentMap.get(c.id)
            if (c.parent_id && commentMap.has(c.parent_id)) {
                commentMap.get(c.parent_id).replies.push(node)
            } else if (!c.parent_id) {
                rootComments.push(node)
            }
        }

        const hasMore = rows.length === Number(pageSize)
        const lastCursor = rows.length > 0 ? rows[rows.length - 1].id : null

        return success(res, {
            list: rootComments,
            cursor: lastCursor,
            hasMore,
            total: rootComments.length
        })
    } catch (err) {
        next(err)
    }
})

router.post('/:id/comments', async (req, res, next) => {
    try {
        const {content, qq_number, parent_id, content_type, captcha_key, captcha_code} = req.body

        if (!content) {
            return error(res, '评论内容不能为空', 400)
        }
        if (!qq_number || !/^\d{5,12}$/.test(qq_number)) {
            return error(res, '请输入有效的QQ号', 400)
        }
        // 验证码校验
        if (!captcha_key || !captcha_code) {
            return error(res, '请输入验证码', 400)
        }
        const captchaValid = await verifyCaptcha(captcha_key, captcha_code)
        if (!captchaValid) {
            return error(res, '验证码错误或已过期', 400)
        }

        const article = await Article.findByPk(req.params.id)
        if (!article) {
            return error(res, '文章不存在', 404)
        }

        let parentComment = null
        if (parent_id) {
            parentComment = await Comment.findByPk(parent_id)
            if (!parentComment) {
                return error(res, '回复的评论不存在', 404)
            }
        }

        // 通过 QQ 号获取头像和昵称
        const qqInfo = await getQQInfo(qq_number)
        const qqEmail = `${qq_number}@qq.com`
        let authorName = qqInfo.nickname || `QQ用户_${qq_number}`
        if (qqInfo.nickname.trim().length <= 0) {
            authorName = `QQ用户_${qq_number}`
        }
        // 使用getQQAvatar()兜底
        const avatar = qqInfo.avatar || getQQAvatar(qq_number) || null

        const comment = await Comment.create({
            article_id: req.params.id,
            user_id: req.user ? req.user.id : null,
            parent_id: parent_id || null,
            author_name: authorName,
            author_email: qqEmail,
            avatar,
            content,
            content_type: ['markdown', 'text'].includes(content_type) ? content_type : 'text'
        })

        // 回复通知邮件
        if (parentComment && parentComment.author_email) {
            const articleUrl = `${req.protocol}://${req.get('host')}/article/${req.params.id}`
            sendReplyNotification({
                to: parentComment.author_email,
                articleTitle: article.title,
                replyContent: content.substring(0, 200),
                replyAuthor: authorName,
                articleUrl
            }).catch(() => {
            })
        }

        return success(res, comment, '评论发表成功', 201)
    } catch (err) {
        next(err)
    }
})

// 评论点赞 - 每个IP每24小时只能对同一条评论点赞一次
router.post('/:id/comments/:commentId/like', async (req, res, next) => {
    try {
        const articleId = req.params.id
        const commentId = req.params.commentId
        const ip = req.ip || req.headers['x-forwarded-for'] || '0.0.0.0'

        const comment = await Comment.findOne({
            where: {id: commentId, article_id: articleId, is_approved: true}
        })
        if (!comment) {
            return error(res, '评论不存在', 404)
        }

        // 检查IP是否在24小时内已点赞
        const likeKey = `comment_like:${commentId}:${ip}`
        const alreadyLiked = await redis.get(likeKey)
        if (alreadyLiked) {
            return error(res, '您今天已经点过赞了，24小时后再来吧', 400)
        }

        // 点赞：like_count +1, Redis记录24小时
        await comment.increment('like_count')
        await redis.set(likeKey, '1', 'EX', 86400) // 24小时

        // 重新获取最新数据
        await comment.reload()

        return success(res, {like_count: comment.like_count, id: comment.id}, '点赞成功')
    } catch (err) {
        next(err)
    }
})

// 文章点赞 - 每IP每24小时只能对同一篇文章点赞一次（基于Redis）
router.post('/:id/like', async (req, res, next) => {
    try {
        const article = await Article.findByPk(req.params.id)
        if (!article) {
            return error(res, '文章不存在', 404)
        }

        const ip = req.ip || req.headers['x-forwarded-for'] || '0.0.0.0'
        const likeKey = `article_like:${req.params.id}:${ip}`
        const alreadyLiked = await redis.get(likeKey)
        if (alreadyLiked) {
            return error(res, '您今天已经点过赞了，24小时后再来吧', 400)
        }

        await article.increment('like_count')
        await redis.set(likeKey, '1', 'EX', 86400) // 24小时
        await article.reload()

        return success(res, {like_count: article.like_count, id: article.id}, '点赞成功')
    } catch (err) {
        next(err)
    }
})

module.exports = router
