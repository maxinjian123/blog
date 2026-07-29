const express = require('express');
const { auth, optionalAuth, adminOnly } = require('../middleware/auth');
const { success, error } = require('../utils/response');
const { Announcement } = require('../models');

const router = express.Router();

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const announcements = await Announcement.findAll({
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
    });
    return success(res, announcements);
  } catch (err) {
    next(err);
  }
});

router.get('/latest', optionalAuth, async (req, res, next) => {
  try {
    const announcement = await Announcement.findOne({
      where: { is_active: true },
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
    });
    return success(res, announcement || { content: '暂无公告' });
  } catch (err) {
    next(err);
  }
});

router.post('/', auth, adminOnly, async (req, res, next) => {
  try {
    const { content, is_active, sort_order } = req.body;
    if (!content) {
      return error(res, '公告内容不能为空', 400);
    }
    const announcement = await Announcement.create({
      content,
      is_active: is_active !== undefined ? is_active : true,
      sort_order: sort_order || 0
    });
    return success(res, announcement, '公告创建成功', 201);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', auth, adminOnly, async (req, res, next) => {
  try {
    const announcement = await Announcement.findByPk(req.params.id);
    if (!announcement) {
      return error(res, '公告不存在', 404);
    }
    const { content, is_active, sort_order } = req.body;
    await announcement.update({
      content: content !== undefined ? content : announcement.content,
      is_active: is_active !== undefined ? is_active : announcement.is_active,
      sort_order: sort_order !== undefined ? sort_order : announcement.sort_order,
    });
    return success(res, announcement, '公告更新成功');
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', auth, adminOnly, async (req, res, next) => {
  try {
    const announcement = await Announcement.findByPk(req.params.id);
    if (!announcement) {
      return error(res, '公告不存在', 404);
    }
    await announcement.destroy();
    return success(res, null, '公告删除成功');
  } catch (err) {
    next(err);
  }
});

module.exports = router;