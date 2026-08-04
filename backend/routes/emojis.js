const express = require('express');
const {auth, adminOnly} = require('../middleware/auth');
const {success, error, paginated} = require('../utils/response');
const {Op} = require('sequelize');
const {Emoji} = require('../models');
const emojiService = require('../services/emojiService');

const router = express.Router();

/**
 * @swagger
 * /emojis:
 *   get:
 *     summary: 获取编辑器可用表情（公开）
 *     tags: [表情管理]
 */
router.get('/', async (req, res, next) => {
  try {
    const list = await emojiService.listEnabled();
    return success(res, {
      list,
      emojis: list.map((e) => e.emoji)
    });
  } catch (err) {
    next(err);
  }
});

// 以下接口均需要管理员权限
router.use(auth, adminOnly);

/**
 * @swagger
 * /emojis/admin:
 *   get:
 *     summary: 分页查询表情（管理后台）
 *     tags: [表情管理]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: keyword
 *         schema: { type: string }
 *         description: 表情/名称关键字
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: enabled
 *         schema: { type: string, enum: [true, false] }
 */
router.get('/admin', async (req, res, next) => {
  try {
    const {
      page = 1, pageSize = 20,
      keyword, category, enabled
    } = req.query;

    const where = {};
    if (keyword) {
      const kw = `%${keyword}%`;
      where[Op.or] = [
        {emoji: {[Op.like]: kw}},
        {name: {[Op.like]: kw}}
      ];
    }
    if (category) where.category = category;
    if (enabled !== undefined && enabled !== '') {
      where.enabled = String(enabled) === 'true';
    }

    const {count, rows} = await Emoji.findAndCountAll({
      where,
      order: [['sort_order', 'ASC'], ['id', 'ASC']],
      limit: Number(pageSize),
      offset: (Number(page) - 1) * Number(pageSize)
    });

    return paginated(res, {
      list: rows,
      total: count,
      page: Number(page),
      pageSize: Number(pageSize)
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /emojis/admin/categories:
 *   get:
 *     summary: 获取表情分类列表（管理后台）
 *     tags: [表情管理]
 *     security:
 *       - BearerAuth: []
 */
router.get('/admin/categories', async (req, res, next) => {
  try {
    const rows = await Emoji.findAll({
      attributes: ['category'],
      group: ['category'],
      order: [['category', 'ASC']],
      raw: true
    });
    return success(res, rows.map((r) => r.category).filter(Boolean));
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /emojis:
 *   post:
 *     summary: 新增表情
 *     tags: [表情管理]
 *     security:
 *       - BearerAuth: []
 */
router.post('/', async (req, res, next) => {
  try {
    const {emoji, name, category, sort_order, enabled} = req.body || {};
    if (!emoji || !String(emoji).trim()) {
      return error(res, '表情内容不能为空', 400);
    }
    const exists = await Emoji.findOne({where: {emoji: String(emoji).trim()}});
    if (exists) {
      return error(res, '该表情已存在', 409);
    }

    const record = await Emoji.create({
      emoji: String(emoji).trim(),
      name: name || '',
      category: category || 'default',
      sort_order: sort_order !== undefined ? Number(sort_order) : 0,
      enabled: enabled !== undefined ? !!enabled : true
    });
    res.locals.logMeta = {target_name: `${record.emoji} ${record.name || ''}`.trim()};
    return success(res, record, '表情创建成功');
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /emojis/import-default:
 *   post:
 *     summary: 补充缺失的默认表情
 *     tags: [表情管理]
 *     security:
 *       - BearerAuth: []
 */
router.post('/import-default', async (req, res, next) => {
  try {
    const added = await emojiService.insertDefaultEmojis();
    res.locals.logMeta = {target_name: `补充 ${added} 个默认表情`};
    return success(res, {added}, `已补充 ${added} 个默认表情`);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /emojis/{id}:
 *   put:
 *     summary: 更新表情
 *     tags: [表情管理]
 *     security:
 *       - BearerAuth: []
 */
router.put('/:id', async (req, res, next) => {
  try {
    const record = await Emoji.findByPk(req.params.id);
    if (!record) {
      return error(res, '表情不存在', 404);
    }

    const {emoji, name, category, sort_order, enabled} = req.body || {};
    if (emoji !== undefined) {
      const value = String(emoji).trim();
      if (!value) return error(res, '表情内容不能为空', 400);
      const exists = await Emoji.findOne({where: {emoji: value, id: {[Op.ne]: record.id}}});
      if (exists) return error(res, '该表情已存在', 409);
      record.emoji = value;
    }
    if (name !== undefined) record.name = name;
    if (category !== undefined) record.category = category || 'default';
    if (sort_order !== undefined) record.sort_order = Number(sort_order) || 0;
    if (enabled !== undefined) record.enabled = !!enabled;

    await record.save();
    res.locals.logMeta = {target_name: `${record.emoji} ${record.name || ''}`.trim()};
    return success(res, record, '表情更新成功');
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /emojis/{id}:
 *   delete:
 *     summary: 删除表情
 *     tags: [表情管理]
 *     security:
 *       - BearerAuth: []
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const record = await Emoji.findByPk(req.params.id);
    if (!record) {
      return error(res, '表情不存在', 404);
    }
    const label = `${record.emoji} ${record.name || ''}`.trim();
    await record.destroy();
    res.locals.logMeta = {target_name: label};
    return success(res, null, '表情删除成功');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
