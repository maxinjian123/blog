const express = require('express');
const { Article } = require('../models');
const { success, error } = require('../utils/response');
const redis = require('../utils/redis');

const router = express.Router();

// 记录文章分享 - POST /api/v1/articles/:id/share
router.post('/:id/share', async (req, res, next) => {
  try {
    const articleId = req.params.id;
    
    const article = await Article.findByPk(articleId);
    if (!article) {
      return error(res, '文章不存在', 404);
    }

    // 使用 Redis 记录分享次数，按天聚合
    const today = new Date().toISOString().split('T')[0];
    const shareKey = `article_share:${articleId}:${today}`;
    
    // 增加分享计数
    await redis.incr(shareKey);
    await redis.expire(shareKey, 86400 * 7); // 7天过期

    return success(res, null, '分享记录成功');
  } catch (err) {
    next(err);
  }
});

// 获取文章分享次数 - GET /api/v1/articles/:id/share-count
router.get('/:id/share-count', async (req, res, next) => {
  try {
    const articleId = req.params.id;
    
    const article = await Article.findByPk(articleId);
    if (!article) {
      return error(res, '文章不存在', 404);
    }

    // 获取最近7天的分享次数
    let totalShares = 0;
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const shareKey = `article_share:${articleId}:${dateStr}`;
      const count = await redis.get(shareKey);
      if (count) {
        totalShares += parseInt(count);
      }
    }

    return success(res, { share_count: totalShares });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
