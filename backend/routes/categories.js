const express = require('express')
const { auth } = require('../middleware/auth')
const { success, error, paginated } = require('../utils/response')
const { Category, Article } = require('../models')
const { Sequelize } = require('sequelize')
const { Op } = require('sequelize')

const router = express.Router()

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

router.post('/', auth, async (req, res, next) => {
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

    return success(res, category, '分类创建成功', 201)
  } catch (err) {
    next(err)
  }
})

router.put('/:id', auth, async (req, res, next) => {
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

    return success(res, category, '分类更新成功')
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', auth, async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id)
    if (!category) {
      return error(res, '分类不存在', 404)
    }

    await category.destroy()

    return success(res, null, '分类删除成功')
  } catch (err) {
    next(err)
  }
})

module.exports = router
