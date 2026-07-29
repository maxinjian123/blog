const express = require('express');
const { auth, adminOnly } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');
const { Message, User } = require('../models');
const { Op } = require('sequelize');
const { createRateLimit } = require('../utils/rateLimit');

const router = express.Router();

// 前台留言限流：每个 IP 每分钟最多 3 条
const guestbookRateLimiter = createRateLimit({
  keyPrefix: 'rate:guestbook',
  maxRequests: 3,
  windowSeconds: 60
});

// 递归获取所有子留言ID
async function getAllChildIds(parentId) {
  const children = await Message.findAll({
    where: { parent_id: parentId },
    attributes: ['id']
  });
  const ids = children.map(c => c.id);
  for (const child of children) {
    const grandChildIds = await getAllChildIds(child.id);
    ids.push(...grandChildIds);
  }
  return ids;
}

// 前台留言列表（只返回已通过审核的顶级留言 + 递归子回复）
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;

    const { count, rows } = await Message.findAndCountAll({
      where: {
        parent_id: null,
        is_approved: true
      },
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'avatar', 'role'] }
      ],
      order: [['created_at', 'DESC']],
      limit: Number(pageSize),
      offset: (Number(page) - 1) * Number(pageSize)
    });

    const list = await Promise.all(rows.map(async (m) => {
      const childIds = await getAllChildIds(m.id);
      const replies = childIds.length ? await Message.findAll({
        where: { id: childIds, is_approved: true },
        include: [
          { model: User, as: 'user', attributes: ['id', 'username', 'avatar', 'role'] },
          { model: Message, as: 'parent', attributes: ['id', 'author_name'], required: false }
        ],
        order: [['created_at', 'ASC']]
      }) : [];
      return {
        ...m.toJSON(),
        replies
      };
    }));

    return paginated(res, { list, total: count, page, pageSize });
  } catch (err) {
    next(err);
  }
});

// 前台发表留言
const MAX_CONTENT = 2000;
router.post('/', guestbookRateLimiter, async (req, res, next) => {
  try {
    const { author_name, author_email, content, parent_id } = req.body;
    if (!content || !content.trim()) {
      return error(res, '留言内容不能为空', 400);
    }
    if (content.length > MAX_CONTENT) {
      return error(res, `留言内容不能超过 ${MAX_CONTENT} 字`, 400);
    }
    if (!author_name || !author_name.trim()) {
      return error(res, '昵称不能为空', 400);
    }
    if (author_name.length > 50) {
      return error(res, '昵称长度不能超过 50 字', 400);
    }
    if (author_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(author_email)) {
      return error(res, '邮箱格式不正确', 400);
    }

    const message = await Message.create({
      parent_id: parent_id || null,
      author_name: author_name.trim(),
      author_email: author_email || null,
      content: content.trim(),
      content_type: 'text',
      ip: req.headers['x-real-ip'] || req.ip,
      is_approved: true
    });

    const result = await Message.findByPk(message.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'avatar', 'role'] },
        { model: Message, as: 'parent', attributes: ['id', 'author_name'], required: false }
      ]
    });

    return success(res, result, '留言成功', 201);
  } catch (err) {
    next(err);
  }
});

// 前台点赞
router.post('/:id/like', async (req, res, next) => {
  try {
    const message = await Message.findByPk(req.params.id);
    if (!message) {
      return error(res, '留言不存在', 404);
    }
    message.like_count = (message.like_count || 0) + 1;
    await message.save();
    return success(res, { like_count: message.like_count });
  } catch (err) {
    next(err);
  }
});

// 后台管理：留言列表
router.get('/admin', auth, adminOnly, async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, approved, keyword } = req.query;

    const where = {};
    if (approved !== undefined) {
      where.is_approved = approved === 'true';
    }
    if (keyword) {
      where.content = { [Op.like]: `%${keyword}%` };
    }

    const { count, rows } = await Message.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'avatar', 'role'] },
        { model: Message, as: 'parent', attributes: ['id', 'author_name'], required: false }
      ],
      order: [['created_at', 'DESC']],
      limit: Number(pageSize),
      offset: (Number(page) - 1) * Number(pageSize),
      distinct: true
    });

    return paginated(res, { list: rows, total: count, page, pageSize });
  } catch (err) {
    next(err);
  }
});

// 后台管理：审核状态
router.put('/:id', auth, adminOnly, async (req, res, next) => {
  try {
    const message = await Message.findByPk(req.params.id);
    if (!message) {
      return error(res, '留言不存在', 404);
    }

    const { approved } = req.body;
    if (approved !== undefined) {
      message.is_approved = approved;
      await message.save();
    }

    return success(res, message, '留言状态已更新');
  } catch (err) {
    next(err);
  }
});

// 后台管理：查看完整回复对话
router.get('/:id/replies', auth, adminOnly, async (req, res, next) => {
  try {
    const message = await Message.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'avatar', 'role'] },
        { model: Message, as: 'parent', attributes: ['id', 'author_name'], required: false }
      ]
    });
    if (!message) {
      return error(res, '留言不存在', 404);
    }

    const childIds = await getAllChildIds(req.params.id);
    const allIds = [req.params.id, ...childIds];

    const thread = await Message.findAll({
      where: { id: allIds },
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'avatar', 'role'] },
        { model: Message, as: 'parent', attributes: ['id', 'author_name'], required: false }
      ],
      order: [['created_at', 'ASC']]
    });

    return success(res, { thread, total: thread.length });
  } catch (err) {
    next(err);
  }
});

// 后台管理：管理员手动回复
router.post('/:id/reply', auth, adminOnly, async (req, res, next) => {
  try {
    const message = await Message.findByPk(req.params.id);
    if (!message) {
      return error(res, '留言不存在', 404);
    }

    const { content, content_type = 'markdown' } = req.body;
    if (!content) {
      return error(res, '回复内容不能为空', 400);
    }

    const reply = await Message.create({
      user_id: req.user.id,
      parent_id: message.id,
      author_name: req.user.username,
      author_email: req.user.email,
      avatar: req.user.avatar,
      content,
      content_type: ['markdown', 'text'].includes(content_type) ? content_type : 'text',
      is_approved: true
    });

    const result = await Message.findByPk(reply.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'avatar', 'role'] }
      ]
    });

    return success(res, result, '回复成功');
  } catch (err) {
    next(err);
  }
});

// 后台管理：删除留言（级联删除子留言）
router.delete('/:id', auth, adminOnly, async (req, res, next) => {
  try {
    const message = await Message.findByPk(req.params.id);
    if (!message) {
      return error(res, '留言不存在', 404);
    }

    const childIds = await getAllChildIds(req.params.id);
    const allIds = [req.params.id, ...childIds];

    await Message.destroy({ where: { id: allIds } });
    return success(res, { deletedCount: allIds.length }, `已删除 ${allIds.length} 条留言`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
