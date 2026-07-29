const express = require('express');
const { auth, adminOnly } = require('../middleware/auth');
const { success, error } = require('../utils/response');
const { Link } = require('../models');
const crypto = require('crypto');

const router = express.Router();

// 前台：获取已启用的友链列表；后台 ?all=true 获取全部
router.get('/', async (req, res, next) => {
  try {
    const { active, all } = req.query;
    const where = {};
    // 仅当不是后台 all 模式，且未显式请求 false 时，过滤启用
    if (all !== 'true' && active !== 'false') {
      where.is_active = true;
    }
    const links = await Link.findAll({
      where,
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
    });
    return success(res, links);
  } catch (err) {
    next(err);
  }
});

// 后台：创建友链
router.post('/', auth, adminOnly, async (req, res, next) => {
  try {
    const { name, url, description, avatar, category, sort_order, is_active } = req.body;
    if (!name || !url) {
      return error(res, '名称和地址不能为空', 400);
    }
    const link = await Link.create({
      id: crypto.randomUUID(),
      name,
      url,
      description: description || null,
      avatar: avatar || null,
      category: category || '友情链接',
      sort_order: sort_order || 0,
      is_active: is_active !== undefined ? is_active : true
    });
    return success(res, link, '友链创建成功', 201);
  } catch (err) {
    next(err);
  }
});

// 后台：更新友链
router.put('/:id', auth, adminOnly, async (req, res, next) => {
  try {
    const link = await Link.findByPk(req.params.id);
    if (!link) {
      return error(res, '友链不存在', 404);
    }
    const { name, url, description, avatar, category, sort_order, is_active } = req.body;
    await link.update({
      name: name !== undefined ? name : link.name,
      url: url !== undefined ? url : link.url,
      description: description !== undefined ? description : link.description,
      avatar: avatar !== undefined ? avatar : link.avatar,
      category: category !== undefined ? category : link.category,
      sort_order: sort_order !== undefined ? sort_order : link.sort_order,
      is_active: is_active !== undefined ? is_active : link.is_active
    });
    return success(res, link, '友链更新成功');
  } catch (err) {
    next(err);
  }
});

// 后台：删除友链
router.delete('/:id', auth, adminOnly, async (req, res, next) => {
  try {
    const link = await Link.findByPk(req.params.id);
    if (!link) {
      return error(res, '友链不存在', 404);
    }
    await link.destroy();
    return success(res, null, '友链删除成功');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
