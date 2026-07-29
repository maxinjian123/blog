const express = require('express')
const {auth, adminOnly} = require('../middleware/auth')
const { success, error, paginated } = require('../utils/response')
const { Category, Article } = require('../models')
const { Sequelize } = require('sequelize')
const { Op } = require('sequelize')
const redis = require('../utils/redis')

const router = express.Router()

// 清除热门分类缓存（分类增删改时调用）
function clearHotCategoriesCache() {
  if (redis.status !== 'ready') return
  // 清除所有 limit 变体的缓存
  redis.keys('blog:hot:categories:*').then(keys => {
    if (keys && keys.length) redis.del(...keys)
  }).catch(() => {})
}

router.get('/', async (req, res, next) => {
  try {
    const categories = await Category.findAll({
      attributes: {
        include: [
          [
            Sequelize.literal(`(
              SELECT COUNT(*)
              FROM articles AS a
              WHERE a.category_id = Category.id
                AND a.status = 'published'
            )`),
            'article_count'
          ]
        ]
      },
      order: [['id', 'ASC']]
    })
    return success(res, categories)
  } catch (err) {
    next(err)
  }
})

/**
 * 热门分类（结合 Redis 缓存动态计算，按已发布文章数降序）
 * GET /categories/hot?limit=10
 * 缓存 key: blog:hot:categories，TTL 10 分钟
 */
router.get('/hot', async (req, res, next) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50)
  const cacheKey = `blog:hot:categories:${limit}`
  try {
    // 优先读 Redis 缓存
    if (redis.status === 'ready') {
      const cached = await redis.get(cacheKey).catch(() => null)
      if (cached) {
        try { return success(res, JSON.parse(cached)) } catch (_) { /* 解析失败则回源 */ }
      }
    }

    const rows = await Category.findAll({
      attributes: [
        'id', 'name', 'slug', 'description',
        [Sequelize.literal(`(
          SELECT COUNT(*)
          FROM articles AS a
          WHERE a.category_id = Category.id
            AND a.status = 'published'
        )`), 'article_count']
      ],
      having: Sequelize.literal(`(
        SELECT COUNT(*)
        FROM articles AS a
        WHERE a.category_id = Category.id
          AND a.status = 'published'
      ) > 0`),
      order: [[Sequelize.literal('article_count'), 'DESC']],
      limit,
      raw: true
    })

    // 写入 Redis 缓存（失败不影响响应）
    if (redis.status === 'ready') {
      redis.set(cacheKey, JSON.stringify(rows), 'EX', 600).catch(() => {})
    }
    return success(res, rows)
  } catch (err) {
    next(err)
  }
})

router.post('/', auth, adminOnly, async (req, res, next) => {
  try {
    const { name, slug, description } = req.body

    if (!name) {
      return error(res, '分类名称不能为空', 400)
    }

    const category = await Category.create({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description
    })
    clearHotCategoriesCache()

    return success(res, category, '分类创建成功', 201)
  } catch (err) {
    next(err)
  }
})

router.put('/:id', auth, adminOnly, async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id)
    if (!category) {
      return error(res, '分类不存在', 404)
    }

    const { name, slug, description } = req.body

    await category.update({
      name: name || category.name,
      slug: slug || category.slug,
      description: description !== undefined ? description : category.description
    })
    clearHotCategoriesCache()

    return success(res, category, '分类更新成功')
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', auth, adminOnly, async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id)
    if (!category) {
      return error(res, '分类不存在', 404)
    }

    await category.destroy()
    clearHotCategoriesCache()

    return success(res, null, '分类删除成功')
  } catch (err) {
    next(err)
  }
})

module.exports = router
