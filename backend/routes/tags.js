const express = require('express')
const {auth} = require('../middleware/auth')
const {success, error} = require('../utils/response')
const {Tag, Article, User} = require('../models')
const {Sequelize, Op, literal} = require('sequelize')
const {sequelize} = require('../models')

const router = express.Router()

router.get('/', async (req, res, next) => {
    try {
        const All = req.header('All')
        const page = parseInt(req.query.page) || 1
        const pageSize = parseInt(req.query.pageSize) || 10
        const sort = req.query.sort || 'id'
        const order = req.query.order || 'ASC'
        const keyword = req.query.keyword || ''

        const where = {}
        if (keyword) {
            where[Op.or] = [{name: {[Op.like]: `%${keyword}%`}}, {slug: {[Op.like]: `%${keyword}%`}}]
        }
        const offset = (page - 1) * pageSize

        if (All && All !== 'true') {
            //拼接分页
            where.limit = pageSize
            where.offset = offset
        }


        const articleCountLiteral = literal(`(
      SELECT COUNT(*)
      FROM article_tags
      WHERE article_tags.tag_id = Tag.id
    )`)

        const sortOrder = [[sort === 'articleCount' ? literal('articleCount') : sort, order]]

        const {count, rows} = await Tag.findAndCountAll({
            attributes: {
                include: [[articleCountLiteral, 'articleCount']]
            },
            where,
            order: sortOrder
        })

        return success(res, {
            list: rows,
            total: count,
            page: page,
            pageSize: pageSize,
            totalPages: Math.ceil(count / pageSize)
        })
    } catch (err) {
        next(err)
    }
})

router.get('/:id/articles', async (req, res, next) => {
    try {
        const tagId = req.params.id
        const page = parseInt(req.query.page) || 1
        const pageSize = parseInt(req.query.pageSize) || 10
        const keyword = req.query.keyword || ''

        const tag = await Tag.findByPk(tagId)
        if (!tag) {
            return error(res, '标签不存在', 404)
        }

        const where = {}
        if (keyword) {
            where[Op.or] = [{title: {[Op.like]: `%${keyword}%`}}, {status: {[Op.like]: `%${keyword}%`}}]
        }

        const {count, rows} = await Article.findAndCountAll({
            include: [
                {
                    model: Tag,
                    as: 'tags',
                    where: {id: tagId},
                    through: {attributes: []}
                },
                {
                    model: User,
                    as: 'author',
                    attributes: ['id', 'username', 'avatar']
                }
            ],
            where,
            attributes: ['id', 'title', 'status', 'summary', 'view_count', 'published_at', 'created_at', 'cover'],
            distinct: true,
            order: [['created_at', 'DESC']],
            limit: pageSize,
            offset: (page - 1) * pageSize
        })

        return success(res, {
            list: rows,
            total: count,
            page,
            pageSize,
            totalPages: Math.ceil(count / pageSize)
        })
    } catch (err) {
        next(err)
    }
})

router.post('/', auth, async (req, res, next) => {
    try {
        const {name, slug} = req.body

        if (!name) {
            return error(res, '标签名称不能为空', 400)
        }

        const tag = await Tag.create({
            name,
            slug: slug || name.toLowerCase().replace(/\s+/g, '-')
        })

        return success(res, tag, '标签创建成功', 201)
    } catch (err) {
        next(err)
    }
})

router.put('/:id', auth, async (req, res, next) => {
    try {
        const tag = await Tag.findByPk(req.params.id)
        if (!tag) {
            return error(res, '标签不存在', 404)
        }

        const {name, slug} = req.body

        await tag.update({
            name: name || tag.name,
            slug: slug || tag.slug
        })

        return success(res, tag, '标签更新成功')
    } catch (err) {
        next(err)
    }
})

router.delete('/:id', auth, async (req, res, next) => {
    try {
        const tag = await Tag.findByPk(req.params.id)
        if (!tag) {
            return error(res, '标签不存在', 404)
        }

        await tag.destroy()

        return success(res, null, '标签删除成功')
    } catch (err) {
        next(err)
    }
})

module.exports = router
