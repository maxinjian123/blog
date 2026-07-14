const express = require('express');
const { auth, optionalAuth } = require('../middleware/auth');
const { success, error } = require('../utils/response');
const { Article, Category, Tag, Comment, VisitorLog } = require('../models');
const { Op, fn, col, literal } = require('sequelize');
const sequelize = require('../models').sequelize;
const redis = require('../utils/redis');

const router = express.Router();

router.get('/stats', optionalAuth, async (req, res, next) => {
  try {
    const isAuthenticated = !!req.user;

    if (!isAuthenticated) {
      const [articleCount, categoryCount, tagCount] = await Promise.all([
        Article.count({ where: { status: 'published' } }),
        Category.count(),
        Tag.count(),
      ]);

      return success(res, {
        totalArticles: articleCount,
        totalTags: tagCount,
        totalCategories: categoryCount,
        articleCount,
        tagCount,
        categoryCount,
      });
    }

    const [
      articleCount,
      publishedCount,
      draftCount,
      categoryCount,
      tagCount,
      commentCount,
      viewSum,
      likeSum,
      topArticles,
      recentComments
    ] = await Promise.all([
      Article.count(),
      Article.count({ where: { status: 'published' } }),
      Article.count({ where: { status: 'draft' } }),
      Category.count(),
      Tag.count(),
      Comment.count(),
      Article.sum('view_count'),
      Article.sum('like_count'),
      Article.findAll({
        attributes: ['id', 'title', 'view_count'],
        where: { status: 'published' },
        order: [['view_count', 'DESC']],
        limit: 5
      }),
      Comment.findAll({
        attributes: ['id', 'content', 'author_name', 'created_at'],
        include: [{
          model: Article,
          as: 'article',
          attributes: ['id', 'title']
        }],
        order: [['created_at', 'DESC']],
        limit: 5
      })
    ]);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayViews = await VisitorLog.count({
      where: {
        action: 'view',
        created_at: { [Op.gte]: todayStart }
      }
    });

    const weeklyViews = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const count = await VisitorLog.count({
        where: {
          action: 'view',
          created_at: { [Op.gte]: dayStart, [Op.lt]: dayEnd }
        }
      });
      weeklyViews.push(count);
    }

    const monthlyViews = [];
    for (let i = 29; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const count = await VisitorLog.count({
        where: {
          action: 'view',
          created_at: { [Op.gte]: dayStart, [Op.lt]: dayEnd }
        }
      });
      monthlyViews.push(count);
    }

    return success(res, {
      article_count: articleCount,
      published_count: publishedCount,
      draft_count: draftCount,
      category_count: categoryCount,
      tag_count: tagCount,
      comment_count: commentCount,
      total_views: viewSum || 0,
      total_likes: likeSum || 0,
      today_views: todayViews,
      weekly_views: weeklyViews,
      monthly_views: monthlyViews,
      top_articles: topArticles.map(a => ({
        id: a.id,
        title: a.title,
        view_count: a.view_count
      })),
      recent_comments: recentComments.map(c => ({
        id: c.id,
        content: c.content,
        username: c.author_name || 'Anonymous',
        article_title: c.article ? c.article.title : '',
        created_at: c.created_at
      }))
    });
  } catch (err) {
    next(err);
  }
});

// 获取访客来源统计（最近7天）
router.get('/stats/source', auth, async (req, res, next) => {
  try {
    const sourceStats = { search: 0, social: 0, direct: 0, other: 0 };
    
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      for (const source of ['search', 'social', 'direct', 'other']) {
        const key = `visit_source:${dateStr}:${source}`;
        const count = await redis.get(key);
        if (count) {
          sourceStats[source] += parseInt(count);
        }
      }
    }
    
    return success(res, sourceStats);
  } catch (err) {
    next(err);
  }
});

// 获取设备分布统计（最近7天）
router.get('/stats/device', auth, async (req, res, next) => {
  try {
    const deviceStats = { mobile: 0, tablet: 0, pc: 0 };
    
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      for (const device of ['mobile', 'tablet', 'pc']) {
        const key = `visit_device:${dateStr}:${device}`;
        const count = await redis.get(key);
        if (count) {
          deviceStats[device] += parseInt(count);
        }
      }
    }
    
    return success(res, deviceStats);
  } catch (err) {
    next(err);
  }
});

// 获取24小时活跃时段分布（今天）
router.get('/stats/hourly', auth, async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const hourlyStats = [];
    
    for (let hour = 0; hour < 24; hour++) {
      const key = `visit_hour:${today}:${hour}`;
      const count = await redis.get(key);
      hourlyStats.push(count ? parseInt(count) : 0);
    }
    
    return success(res, hourlyStats);
  } catch (err) {
    next(err);
  }
});

router.put('/settings', auth, async (req, res, next) => {
  try {
    const { site_name, site_description } = req.body;
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '..', '..', '.env.development');

    let envContent = fs.readFileSync(envPath, 'utf-8');

    if (site_name) {
      envContent = envContent.replace(/^APP_NAME=.*$/m, `APP_NAME=${site_name}`);
    }
    if (site_description) {
      if (envContent.includes('APP_DESCRIPTION=')) {
        envContent = envContent.replace(/^APP_DESCRIPTION=.*$/m, `APP_DESCRIPTION=${site_description}`);
      } else {
        envContent += `\nAPP_DESCRIPTION=${site_description}`;
      }
    }

    fs.writeFileSync(envPath, envContent);
    return success(res, null, 'Settings saved');
  } catch (err) {
    next(err);
  }
});

router.post('/cache/clear', auth, async (req, res, next) => {
  try {
    const redis = require('../utils/redis');
    if (redis.status === 'ready') {
      await redis.flushall();
    }
    return success(res, null, 'Cache cleared');
  } catch (err) {
    next(err);
  }
});

router.get('/export', auth, async (req, res, next) => {
  try {
    const articles = await Article.findAll({
      include: [
        { model: require('../models').Category, as: 'category' },
        { model: require('../models').Tag, as: 'tags', through: { attributes: [] } }
      ]
    });

    const exportData = {
      exported_at: new Date().toISOString(),
      articles: articles.map(a => ({
        title: a.title,
        content: a.content,
        summary: a.summary,
        status: a.status,
        category: a.category ? a.category.name : null,
        tags: a.tags ? a.tags.map(t => t.name) : [],
        created_at: a.created_at,
        view_count: a.view_count,
        like_count: a.like_count
      }))
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=blog-export.json');
    return res.json(exportData);
  } catch (err) {
    next(err);
  }
});

module.exports = router;