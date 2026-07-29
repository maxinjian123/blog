const express = require('express');
const { auth, adminOnly } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');
const { Comment, Article, User } = require('../models');
const ai = require('../services/ai');
const { loadPrompt, replacePlaceholders } = require('../utils');
const { Op } = require('sequelize');

const router = express.Router();

// 递归获取所有子评论ID
async function getAllChildIds(parentId) {
  const children = await Comment.findAll({
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

router.get('/', auth, adminOnly, async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, approved, keyword } = req.query;

    const where = {};
    if (approved !== undefined) {
      where.is_approved = approved === 'true';
    }
    if (keyword) {
      where.content = { [Op.like]: `%${keyword}%` };
    }

    const { count, rows } = await Comment.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'avatar', 'role'] },
        { model: Article, as: 'article', attributes: ['id', 'title', 'slug'] },
        { model: Comment, as: 'parent', attributes: ['id', 'author_name'], required: false }
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

router.put('/:id', auth, adminOnly, async (req, res, next) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    if (!comment) {
      return error(res, '评论不存在', 404);
    }

    const { approved } = req.body;
    if (approved !== undefined) {
      comment.is_approved = approved;
      await comment.save();
    }

    return success(res, comment, '评论状态已更新');
  } catch (err) {
    next(err);
  }
});

router.post('/:id/ai-reply', auth, adminOnly, async (req, res, next) => {
  try {
    const comment = await Comment.findByPk(req.params.id, {
      include: [{ model: Article, as: 'article', attributes: ['id', 'title', 'summary'] }]
    });
    if (!comment) {
      return error(res, '评论不存在', 404);
    }

    const adminUser = await User.findOne({ where: { role: 'admin' } });
    const adminEmail = adminUser ? adminUser.email : 'admin@techmind.com';

    const promptTemplate = await loadPrompt('comment-reply-prompt.txt');
    const systemPrompt = replacePlaceholders(promptTemplate, {
      commentContent: comment.content,
      articleTitle: comment.article ? comment.article.title : '未知',
      articleSummary: comment.article ? (comment.article.summary || '暂无摘要') : '暂无摘要'
    });

    const reply = await ai.chat.chatSimple(comment.content, systemPrompt);

    const replyComment = await Comment.create({
      article_id: comment.article_id,
      parent_id: comment.id,
      author_name: 'AI回复',
      author_email: adminEmail,
      content: reply,
      content_type: 'markdown',
      is_ai_reply: true,
      is_approved: true
    });

    return success(res, replyComment, 'AI回复已生成');
  } catch (err) {
    next(err);
  }
});

// 获取指定评论的所有回复对话（递归获取完整线程）
router.get('/:id/replies', auth, adminOnly, async (req, res, next) => {
  try {
    const comment = await Comment.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'avatar', 'role'] },
        { model: Article, as: 'article', attributes: ['id', 'title', 'slug'] },
        { model: Comment, as: 'parent', attributes: ['id', 'author_name'], required: false }
      ]
    });
    if (!comment) {
      return error(res, '评论不存在', 404);
    }

    const childIds = await getAllChildIds(req.params.id);
    const allIds = [req.params.id, ...childIds];

    const allReplies = await Comment.findAll({
      where: { id: allIds },
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'avatar', 'role'] },
        { model: Comment, as: 'parent', attributes: ['id', 'author_name'], required: false }
      ],
      order: [['created_at', 'ASC']]
    });

    return success(res, { thread: allReplies, total: allReplies.length });
  } catch (err) {
    next(err);
  }
});

// 管理员手动回复评论
router.post('/:id/reply', auth, adminOnly, async (req, res, next) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    if (!comment) {
      return error(res, '评论不存在', 404);
    }

    const { content, content_type = 'markdown' } = req.body;
    if (!content) {
      return error(res, '回复内容不能为空', 400);
    }

    const replyComment = await Comment.create({
      article_id: comment.article_id,
      user_id: req.user.id,
      parent_id: comment.id,
      author_name: req.user.username,
      author_email: req.user.email,
      avatar: req.user.avatar,
      content,
      content_type: ['markdown', 'text'].includes(content_type) ? content_type : 'text',
      is_approved: true
    });

    const result = await Comment.findByPk(replyComment.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'avatar', 'role'] }
      ]
    });

    return success(res, result, '回复成功');
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', auth, adminOnly, async (req, res, next) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    if (!comment) {
      return error(res, '评论不存在', 404);
    }

    const childIds = await getAllChildIds(req.params.id);
    const allIds = [req.params.id, ...childIds];

    await Comment.destroy({ where: { id: allIds } });

    return success(res, { deletedCount: allIds.length }, `已删除 ${allIds.length} 条评论`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
