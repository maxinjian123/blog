const express = require('express')
const {auth, optionalAuth, adminOnly} = require('../middleware/auth')
const {success, error, paginated} = require('../utils/response')
const {Article, User, Category, Tag, Comment, ArticleVersion, VisitorLog} = require('../models')
const config = require('../config')
const {Op, Sequelize} = require('sequelize')
const {getQQInfo} = require('../services/qq')
const {sendReplyNotification} = require('../services/mail')
const captchaRouter = require('./captcha')
const verifyCaptcha = captchaRouter.verifyCaptcha
const redis = require('../utils/redis')
const {recordVisitStats} = require('../utils/visitStats')
const {resolveIpLocation} = require('../utils/ipLocation')

const router = express.Router()

// 清除热门分类/标签缓存（文章增删改时调用，因为热门排行依赖文章数）
function clearHotCaches() {
  if (redis.status !== 'ready') return
  Promise.all([
    redis.keys('blog:hot:categories:*'),
    redis.keys('blog:hot:tags:*')
  ]).then(([catKeys, tagKeys]) => {
    const all = [...(catKeys || []), ...(tagKeys || [])]
    if (all.length) redis.del(...all)
  }).catch(() => {})
}

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
            where: {
                status: 'published',
                published_at: {[Op.ne]: null}
            },
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
            featured,
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

        if (featured !== undefined) {
            where.featured = featured === 'true' || featured === true
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

        // P6-4: 排序字段白名单
        const allowedSort = ['created_at', 'view_count', 'like_count', 'published_at', 'updated_at']
        const safeSort = allowedSort.includes(sort) ? sort : 'created_at'
        const safeOrder = String(order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

        const {count, rows} = await Article.findAndCountAll({
            where,
            // 返回已发布的
            include,
            order: [[safeSort, safeOrder]],
            limit: Number(pageSize),
            offset: (Number(page) - 1) * Number(pageSize),
            distinct: true
        })

        return paginated(res, {list: rows, total: count, page, pageSize})
    } catch (err) {
        next(err)
    }
})

// P4-5: 批量导出文章（JSON 格式）
router.get('/export', auth, adminOnly, async (req, res, next) => {
    try {
        const { ids, status } = req.query
        const where = {}
        if (ids) {
            const idArr = String(ids).split(',').map(s => s.trim()).filter(Boolean)
            if (idArr.length) where.id = { [Op.in]: idArr }
        }
        if (status) where.status = status

        const articles = await Article.findAll({
            where,
            include: [
                { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
                { model: Tag, as: 'tags', attributes: ['id', 'name', 'slug'], through: { attributes: [] } }
            ],
            order: [['created_at', 'DESC']]
        })

        const payload = articles.map(a => ({
            title: a.title,
            slug: a.slug,
            content: a.content,
            content_type: a.content_type,
            summary: a.summary,
            cover: a.cover,
            status: a.status,
            catalog: a.catalog,
            category_name: a.category ? a.category.name : null,
            tags: a.tags ? a.tags.map(t => t.name) : [],
            published_at: a.published_at
        }))

        const exportData = {
            version: 1,
            exported_at: new Date().toISOString(),
            count: payload.length,
            articles: payload
        }

        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.setHeader('Content-Disposition', `attachment; filename="articles-export-${Date.now()}.json"`)
        return res.json(exportData)
    } catch (err) {
        next(err)
    }
})

// P4-5: 批量导入文章（JSON 格式）
router.post('/import', auth, adminOnly, async (req, res, next) => {
    try {
        const data = req.body
        const articles = Array.isArray(data) ? data : (data && Array.isArray(data.articles) ? data.articles : null)
        if (!articles) {
            return error(res, '导入数据格式不正确，需为文章数组或 { articles: [...] }', 400)
        }

        const results = { success: 0, failed: 0, skipped: 0, errors: [] }

        for (let i = 0; i < articles.length; i++) {
            const item = articles[i]
            try {
                if (!item.title || !item.content) {
                    results.skipped++
                    results.errors.push(`第 ${i + 1} 篇：标题或内容为空，已跳过`)
                    continue
                }

                // slug 唯一性处理：若已存在则追加随机后缀
                let slug = item.slug || item.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
                if (slug) {
                    const exist = await Article.findOne({ where: { slug }, attributes: ['id'] })
                    if (exist) slug = `${slug}-${Date.now().toString(36)}`
                }

                // 按名称匹配分类
                let categoryId = null
                if (item.category_name) {
                    const cat = await Category.findOne({ where: { name: item.category_name } })
                    if (cat) categoryId = cat.id
                }

                const contentType = ['html', 'markdown'].includes(item.content_type) ? item.content_type : 'markdown'
                const article = await Article.create({
                    title: item.title,
                    slug,
                    content: item.content,
                    content_type: contentType,
                    summary: item.summary || null,
                    cover: item.cover || null,
                    status: item.status || 'draft',
                    catalog: item.catalog || (contentType === 'markdown' ? extractCatalog(item.content) : null),
                    category_id: categoryId,
                    author_id: req.user.id,
                    published_at: item.status === 'published' ? (item.published_at || new Date()) : null
                })

                // 标签 findOrCreate
                if (Array.isArray(item.tags) && item.tags.length) {
                    const tagInstances = await Promise.all(
                        item.tags.filter(Boolean).map(async tagName => {
                            const [tag] = await Tag.findOrCreate({
                                where: { name: tagName },
                                defaults: { name: tagName, slug: tagName.toLowerCase().replace(/\s+/g, '-') }
                            })
                            return tag
                        })
                    )
                    await article.setTags(tagInstances)
                }

                results.success++
            } catch (e) {
                results.failed++
                results.errors.push(`第 ${i + 1} 篇「${item.title || '无标题'}」：${e.message}`)
            }
        }
        if (results.success > 0) clearHotCaches()

        return success(res, results, `导入完成：成功 ${results.success} 篇，跳过 ${results.skipped} 篇，失败 ${results.failed} 篇`)
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

            // 落库访客日志（仪表盘"近7天访问量"数据源），异步解析IP归属地，不阻塞响应
            const articleId = req.params.id
            resolveIpLocation(ip)
                .then(location => VisitorLog.create({
                    article_id: articleId,
                    ip,
                    user_agent: userAgent.slice(0, 500),
                    action: 'view',
                    province: location.province,
                    city: location.city
                }))
                .catch(err => console.error('记录访客日志失败:', err.message))
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

// P4-2: 草稿预览（需登录，不受 published 状态限制，不计阅读量）
router.get('/:id/preview', auth, adminOnly, async (req, res, next) => {
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
        const result = article.toJSON()
        result.comment_count = 0
        result.is_preview = true
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

router.post('/', auth, adminOnly, async (req, res, next) => {
    try {
        const {title, slug, content, summary, cover, status, category_id, tags, content_type, catalog, featured} = req.body
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
            featured: !!featured,
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
        clearHotCaches()

        res.locals.logMeta = {target_id: article.id, target_name: article.title}
        return success(res, result, '文章创建成功', 201)
    } catch (err) {
        next(err)
    }
})

router.put('/:id', auth, adminOnly, async (req, res, next) => {
    try {
        const article = await Article.findByPk(req.params.id)
        if (!article) {
            return error(res, '文章不存在', 404)
        }

        const {title, slug, content, summary, cover, status, category_id, tags, content_type, catalog, scheduled_at, featured} = req.body

        // P4-1: 保存版本历史（仅当内容或标题变更时）
        const titleChanged = title && title !== article.title
        const contentChanged = content && content !== article.content
        if (titleChanged || contentChanged) {
            await ArticleVersion.create({
                article_id: article.id,
                title: article.title,
                content: article.content,
                summary: article.summary,
                cover: article.cover,
                category_id: article.category_id,
                content_type: article.content_type,
                catalog: article.catalog,
                created_by: req.user?.id || null
            })
            // 仅保留最近 10 个版本
            const versionCount = await ArticleVersion.count({ where: { article_id: article.id } })
            if (versionCount > 10) {
                const oldVersions = await ArticleVersion.findAll({
                    where: { article_id: article.id },
                    order: [['created_at', 'ASC']],
                    limit: versionCount - 10,
                    attributes: ['id']
                })
                await ArticleVersion.destroy({
                    where: { id: oldVersions.map(v => v.id) }
                })
            }
        }

        // P4-2: 处理定时发布
        let finalStatus = status || article.status
        let finalScheduledAt = scheduled_at !== undefined ? scheduled_at : article.scheduled_at
        let finalPublishedAt = article.published_at
        if (finalStatus === 'published') {
            finalPublishedAt = new Date()
            finalScheduledAt = null
        } else if (finalStatus === 'draft' && finalScheduledAt) {
            // 草稿 + 定时时间 = 等待发布
        }

        await article.update({
            title: title || article.title,
            slug: slug || article.slug,
            content: content || article.content,
            summary: summary !== undefined ? summary : article.summary,
            cover: cover !== undefined ? cover : article.cover,
            status: finalStatus,
            published_at: finalPublishedAt,
            scheduled_at: finalScheduledAt,
            category_id: category_id !== undefined ? category_id : article.category_id,
            featured: featured !== undefined ? !!featured : article.featured,
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
        clearHotCaches()

        res.locals.logMeta = {target_id: article.id, target_name: result.title}
        return success(res, result, '文章更新成功')
    } catch (err) {
        next(err)
    }
})

router.delete('/:id', auth, adminOnly, async (req, res, next) => {
    try {
        const article = await Article.findByPk(req.params.id)
        if (!article) {
            return error(res, '文章不存在', 404)
        }

        // P4-1: 删除文章时一并删除其版本历史
        await ArticleVersion.destroy({ where: { article_id: article.id } })
        await article.destroy()
        clearHotCaches()

        res.locals.logMeta = {target_id: req.params.id, target_name: article.title}
        return success(res, null, '文章删除成功')
    } catch (err) {
        next(err)
    }
})

// P4-1: 获取文章版本历史列表
router.get('/:id/versions', auth, adminOnly, async (req, res, next) => {
    try {
        const article = await Article.findByPk(req.params.id)
        if (!article) {
            return error(res, '文章不存在', 404)
        }
        const versions = await ArticleVersion.findAll({
            where: { article_id: req.params.id },
            order: [['created_at', 'DESC']],
            attributes: ['id', 'title', 'summary', 'version_note', 'content_type', 'created_by', 'created_at']
        })
        return success(res, versions)
    } catch (err) {
        next(err)
    }
})

// P4-1: 获取单个版本详情（含完整内容，用于对比/恢复）
router.get('/:id/versions/:versionId', auth, adminOnly, async (req, res, next) => {
    try {
        const version = await ArticleVersion.findByPk(req.params.versionId)
        if (!version || version.article_id !== req.params.id) {
            return error(res, '版本不存在', 404)
        }
        return success(res, version)
    } catch (err) {
        next(err)
    }
})

// P4-1: 恢复到指定版本（将版本内容写回文章，同时保存当前为新版本）
router.post('/:id/versions/:versionId/restore', auth, adminOnly, async (req, res, next) => {
    try {
        const article = await Article.findByPk(req.params.id)
        if (!article) {
            return error(res, '文章不存在', 404)
        }
        const version = await ArticleVersion.findByPk(req.params.versionId)
        if (!version || version.article_id !== article.id) {
            return error(res, '版本不存在', 404)
        }
        // 先保存当前内容为新版本
        await ArticleVersion.create({
            article_id: article.id,
            title: article.title,
            content: article.content,
            summary: article.summary,
            cover: article.cover,
            category_id: article.category_id,
            content_type: article.content_type,
            catalog: article.catalog,
            version_note: `恢复前自动保存（恢复到 ${version.created_at.toLocaleString('zh-CN')}）`,
            created_by: req.user?.id || null
        })
        // 将版本内容写回文章
        await article.update({
            title: version.title,
            content: version.content,
            summary: version.summary,
            cover: version.cover,
            category_id: version.category_id,
            content_type: version.content_type,
            catalog: version.catalog
        })
        // 清理超出 10 个的旧版本
        const versionCount = await ArticleVersion.count({ where: { article_id: article.id } })
        if (versionCount > 10) {
            const oldVersions = await ArticleVersion.findAll({
                where: { article_id: article.id },
                order: [['created_at', 'ASC']],
                limit: versionCount - 10,
                attributes: ['id']
            })
            await ArticleVersion.destroy({ where: { id: oldVersions.map(v => v.id) } })
        }
        const result = await Article.findByPk(article.id, {
            include: [
                {model: User, as: 'author', attributes: ['id', 'username', 'avatar']},
                {model: Category, as: 'category'},
                {model: Tag, as: 'tags', through: {attributes: []}}
            ]
        })
        return success(res, result, '已恢复到指定版本')
    } catch (err) {
        next(err)
    }
})

router.post('/batch-delete', auth, adminOnly, async (req, res, next) => {
    try {
        const {ids} = req.body
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return error(res, 'ids参数不能为空', 400)
        }

        await Article.destroy({where: {id: {[Op.in]: ids}}})
        clearHotCaches()

        return success(res, null, `成功删除 ${ids.length} 篇文章`)
    } catch (err) {
        next(err)
    }
})

router.get('/:id/comments', async (req, res, next) => {
    try {
        const {cursor, pageSize = 30, sort = 'latest'} = req.query

        const baseWhere = {
            article_id: req.params.id,
            is_approved: true
        }

        // 评论总数（含回复）
        const total = await Comment.count({where: baseWhere})

        // 顶层评论分页：latest 按时间倒序（游标用 id）；hot 按点赞数倒序（游标用偏移量）
        const rootWhere = {...baseWhere, parent_id: null}
        let order
        let offset = 0
        if (sort === 'hot') {
            order = [
                ['like_count', 'DESC'],
                ['created_at', 'DESC'],
                ['id', 'DESC']
            ]
            offset = cursor ? Number(cursor) || 0 : 0
        } else {
            order = [
                ['created_at', 'DESC'],
                ['id', 'DESC']
            ]
            if (cursor) {
                rootWhere.id = {[Op.lt]: cursor}
            }
        }

        const roots = await Comment.findAll({
            where: rootWhere,
            order,
            limit: Number(pageSize),
            offset,
            include: [{model: User, as: 'user', attributes: ['id', 'username', 'avatar', 'role']}],
            raw: true,
            nest: true
        })

        // 逐层加载本页顶层评论的全部后代回复，保证线程完整
        const replies = []
        let parentIds = roots.map(c => c.id)
        while (parentIds.length > 0) {
            const children = await Comment.findAll({
                where: {...baseWhere, parent_id: {[Op.in]: parentIds}},
                order: [['created_at', 'ASC'], ['id', 'ASC']],
                include: [{model: User, as: 'user', attributes: ['id', 'username', 'avatar', 'role']}],
                raw: true,
                nest: true
            })
            if (children.length === 0) break
            replies.push(...children)
            parentIds = children.map(c => c.id)
        }

        const rows = [...roots, ...replies]

        // 获取所有父评论的作者名（用于回复显示）
        const replyParentIds = rows.filter(c => c.parent_id).map(c => c.parent_id)
        const parentAuthors = {}
        if (replyParentIds.length > 0) {
            const parents = await Comment.findAll({
                where: {id: {[Op.in]: [...new Set(replyParentIds)]}},
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

        const hasMore = roots.length === Number(pageSize)
        // hot 模式用累计偏移量作为游标，latest 模式用末条顶层评论 id
        const lastCursor = sort === 'hot'
            ? String(offset + roots.length)
            : (roots.length > 0 ? roots[roots.length - 1].id : null)

        return success(res, {
            list: rootComments,
            cursor: lastCursor,
            hasMore,
            total
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

        // 评论通知邮件
        // - 一级评论（直接对文章）：通知博主（admin 用户邮箱）
        // - 回复评论：通知被回复者；如果是博主本人被回复则不重复发（避免博主收到自己回复自己的邮件）
        const notifyCtx = {
            articleId: req.params.id,
            commentId: comment.id,
            articleTitle: article.title,
            replyContent: content.substring(0, 200),
            replyAuthor: authorName,
            fallbackHost: `${req.protocol}://${req.get('host')}`
        }

        if (parentComment) {
            // 回复评论场景：只通知被回复者
            if (parentComment.author_email) {
                sendReplyNotification({
                    ...notifyCtx,
                    to: parentComment.author_email
                }).catch(() => {})
            }
        } else {
            // 一级评论场景：通知博主
            // 博主邮箱优先取 site_config 中的 admin_email，回退到 admin 用户的 email
            let adminEmail = null
            if (config.adminEmail) {
                adminEmail = config.adminEmail
            } else {
                const admin = await User.findOne({ where: { role: 'admin' }, attributes: ['email'] })
                adminEmail = admin?.email || null
            }
            // 避免博主自己评论自己时重复发邮件
            if (adminEmail && adminEmail !== qqEmail) {
                sendReplyNotification({
                    ...notifyCtx,
                    to: adminEmail
                }).catch(() => {})
            }
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
