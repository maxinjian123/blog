const express = require('express');
const { optionalAuth } = require('../middleware/auth');
const { success } = require('../utils/response');
const { User, Article, Category, Tag, Comment, VisitorLog, sequelize } = require('../models');
const config = require('../config');
const clientApiDocs = require('../services/clientApiDocs');

const router = express.Router();

// 自定义页面开发参考：常用公开接口文档（动态提供，管理端「接口文档」页签从此接口获取，不硬编码）
router.get('/api-docs', async (req, res, next) => {
  try {
    return success(res, clientApiDocs);
  } catch (err) {
    next(err);
  }
});

router.get('/info', optionalAuth, async (req, res, next) => {
  try {
    const admin = await User.findOne({
      where: { role: 'admin' },
      attributes: ['id', 'nickname', 'email', 'avatar', 'role']
    });

    const siteInfo = {
      site_name: config.site?.name || 'Blog',
      site_url: config.site?.url || '',
      site_logo: config.site?.logo || '/logo.svg',
      author_email: admin?.email || config.adminEmail || '',
      site_description: config.site?.description || '记录技术学习与思考的个人博客',
      author_name: admin?.nickname || 'Linzy',
      author_bio: 'Backend Developer',
      author_avatar: admin?.avatar || null,
    };

    return success(res, siteInfo);
  } catch (err) {
    next(err);
  }
});

// P5-2: 站点统计数据（关于页展示）
router.get('/stats', async (req, res, next) => {
  try {
    const [articleCount, categoryCount, tagCount, commentCount, visitorCount, firstArticle] = await Promise.all([
      Article.count({ where: { status: 'published' } }),
      Category.count(),
      Tag.count(),
      Comment.count(),
      VisitorLog.count(),
      Article.findOne({ where: { status: 'published' }, order: [['created_at', 'ASC']], attributes: ['created_at'] })
    ]);

    const since = firstArticle?.created_at ? new Date(firstArticle.created_at) : new Date();
    const days = Math.max(1, Math.floor((Date.now() - since.getTime()) / (1000 * 60 * 60 * 24)));

    return success(res, {
      article_count: articleCount,
      category_count: categoryCount,
      tag_count: tagCount,
      comment_count: commentCount,
      visitor_count: visitorCount,
      running_days: days,
      since: since.toISOString().split('T')[0]
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;