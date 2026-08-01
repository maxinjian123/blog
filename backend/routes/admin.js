const express = require('express');
const bcrypt = require('bcryptjs');
const { auth, optionalAuth, adminOnly } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');
const { Article, Category, Tag, Comment, VisitorLog, Message, User } = require('../models');
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
      recentComments,
      messageCount
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
      }),
      Message.count(),
    ]);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayViews = await VisitorLog.count({
      where: {
        action: 'view',
        created_at: { [Op.gte]: todayStart }
      }
    });

    // 近30天逐日访问量：一次 GROUP BY 查询代替逐日 COUNT，再按日期对齐补零
    const rangeStart = new Date();
    rangeStart.setDate(rangeStart.getDate() - 29);
    rangeStart.setHours(0, 0, 0, 0);

    const dailyRows = await VisitorLog.findAll({
      attributes: [
        [fn('DATE', col('created_at')), 'day'],
        [fn('COUNT', col('id')), 'count']
      ],
      where: {
        action: 'view',
        created_at: { [Op.gte]: rangeStart }
      },
      group: [fn('DATE', col('created_at'))],
      raw: true
    });

    const dailyMap = {};
    for (const row of dailyRows) {
      // DATE() 可能返回 Date 对象或字符串，统一成 YYYY-MM-DD
      const key = row.day instanceof Date
        ? `${row.day.getFullYear()}-${String(row.day.getMonth() + 1).padStart(2, '0')}-${String(row.day.getDate()).padStart(2, '0')}`
        : String(row.day).slice(0, 10);
      dailyMap[key] = Number(row.count);
    }

    const monthlyViews = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      monthlyViews.push(dailyMap[key] || 0);
    }
    const weeklyViews = monthlyViews.slice(-7);

    return success(res, {
      article_count: articleCount,
      published_count: publishedCount,
      draft_count: draftCount,
      category_count: categoryCount,
      tag_count: tagCount,
      comment_count: commentCount,
      total_views: viewSum || 0,
      message_count: messageCount || 0,
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
router.get('/stats/source', auth, adminOnly, async (req, res, next) => {
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
router.get('/stats/device', auth, adminOnly, async (req, res, next) => {
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
router.get('/stats/hourly', auth, adminOnly, async (req, res, next) => {
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

// 获取访客地域分布（近30天，按省份/城市聚合，供中国地图图表使用）
router.get('/stats/location', auth, adminOnly, async (req, res, next) => {
  try {
    const rangeStart = new Date();
    rangeStart.setDate(rangeStart.getDate() - 30);

    const baseWhere = {
      action: 'view',
      created_at: { [Op.gte]: rangeStart },
      province: { [Op.ne]: null }
    };

    const [provinceRows, cityRows] = await Promise.all([
      VisitorLog.findAll({
        attributes: ['province', [fn('COUNT', col('id')), 'count']],
        where: baseWhere,
        group: ['province'],
        order: [[literal('count'), 'DESC']],
        raw: true
      }),
      VisitorLog.findAll({
        attributes: ['province', 'city', [fn('COUNT', col('id')), 'count']],
        where: { ...baseWhere, city: { [Op.ne]: null } },
        group: ['province', 'city'],
        order: [[literal('count'), 'DESC']],
        limit: 20,
        raw: true
      })
    ]);

    return success(res, {
      provinces: provinceRows.map(r => ({ name: r.province, value: Number(r.count) })),
      cities: cityRows.map(r => ({ province: r.province, city: r.city, value: Number(r.count) }))
    });
  } catch (err) {
    next(err);
  }
});

// 获取最近访客明细（含地域信息）
router.get('/stats/recent-visitors', auth, adminOnly, async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const { count, rows } = await VisitorLog.findAndCountAll({
      attributes: ['id', 'article_id', 'ip', 'user_agent', 'action', 'province', 'city', 'created_at'],
      where: { action: 'view' },
      order: [['created_at', 'DESC']],
      limit: Number(pageSize),
      offset: (Number(page) - 1) * Number(pageSize),
      raw: true
    });

    // 关联文章标题
    const articleIds = [...new Set(rows.map(r => r.article_id).filter(Boolean))];
    const articles = articleIds.length ? await Article.findAll({
      where: { id: articleIds },
      attributes: ['id', 'title'],
      raw: true
    }) : [];
    const articleMap = new Map(articles.map(a => [a.id, a.title]));

    const list = rows.map(r => ({
      ...r,
      article_title: r.article_id ? (articleMap.get(r.article_id) || '已删除') : '直接访问',
      province: r.province || '未知',
      city: r.city || '未知'
    }));

    return paginated(res, { list, total: count, page, pageSize });
  } catch (err) {
    next(err);
  }
});

// 获取站点配置（按分类分组返回）
router.get('/settings', auth, adminOnly, async (req, res, next) => {
  try {
    const grouped = await require('../services/configService').getAllGrouped();
    return success(res, grouped);
  } catch (err) {
    next(err);
  }
});

// 保存站点配置（接收 key-value 数组，写入数据库并刷新内存缓存）
router.put('/settings', auth, adminOnly, async (req, res, next) => {
  try {
    const { configs } = req.body;
    if (!Array.isArray(configs) || configs.length === 0) {
      return error(res, '请提供要保存的配置项', 400);
    }

    const configService = require('../services/configService');
    const mailService = require('../services/mail');
    const storageService = require('../services/storageService');

    // 仅允许合法 key 写入（白名单）
    const allowedKeys = new Set([
      'site_name', 'site_description', 'site_url', 'site_logo', 'admin_email',
      'mail_host', 'mail_port', 'mail_secure', 'mail_user', 'mail_pass', 'mail_from_name',
      'upload_dir', 'upload_max_size', 'upload_default_storage',
      'minio_enabled', 'minio_endpoint', 'minio_port', 'minio_use_ssl',
      'minio_access_key', 'minio_secret_key', 'minio_bucket', 'minio_public_base_url', 'minio_region',
      'github_token',
      'pexels_api_key', 'pixabay_api_key', 'unsplash_api_key',
      'doubao_api_key', 'doubao_base_url', 'doubao_chat_model', 'doubao_image_model',
      'ollama_host', 'ollama_chat_enabled', 'ollama_chat_model'
    ]);

    const items = configs
      .filter(c => c.key && allowedKeys.has(c.key) && c.value !== undefined)
      .map(c => ({ key: c.key, value: c.value }));

    if (items.length === 0) {
      return error(res, '没有可保存的配置项', 400);
    }

    await configService.setConfigs(items);

    // 配置变更后重建邮件 transporter 与 MinIO 客户端
    mailService.resetTransporter();
    storageService.resetMinioClient();

    // AI 配置变更后重置豆包客户端，使新配置立即生效
    require('../services/ai/chat').resetDoubaoClient();
    require('../services/ai/image').resetImageClient();

    // 异步验证邮件配置，不阻塞响应
    mailService.verifyMailer().catch(() => {});

    res.locals.logMeta = {target_name: `系统配置（${items.length} 项）`};
    return success(res, null, '配置已保存');
  } catch (err) {
    next(err);
  }
});

router.post('/cache/clear', auth, adminOnly, async (req, res, next) => {
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

// 测试邮件发送：使用当前数据库中的邮件配置向指定邮箱发一封测试邮件
router.post('/test-mail', auth, adminOnly, async (req, res, next) => {
  try {
    const { to } = req.body;
    const mailService = require('../services/mail');
    if (!mailService.isMailEnabled()) {
      return error(res, '邮件服务未配置，请先填写邮箱账号和授权码', 400);
    }
    if (!to) {
      return error(res, '请输入收件邮箱', 400);
    }
    const config = require('../config');
    const ok = await mailService.sendReplyNotification({
      to,
      articleTitle: '测试邮件',
      replyContent: '这是一封来自博客后台的测试邮件，用于验证邮件服务配置是否正确。',
      replyAuthor: config.mail.fromName,
      // 用 0 作为占位 articleId，邮件中"查看详情"链接的地址
      // 来自 .env.development.development 的 COMMENT_REPLY_URL_PREFIX（未配置时回退到站点地址）
      articleId: 0,
      fallbackHost: config.site.url || '/'
    });
    if (!ok) {
      return error(res, '邮件发送失败，请检查 SMTP 配置', 500);
    }
    return success(res, null, '测试邮件已发送，请查收');
  } catch (err) {
    next(err);
  }
});

router.get('/export', auth, adminOnly, async (req, res, next) => {
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

// 获取当前管理员个人信息
router.get('/profile', auth, adminOnly, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    if (!user) {
      return error(res, '用户不存在', 404);
    }
    return success(res, user);
  } catch (err) {
    next(err);
  }
});

// 更新当前管理员个人信息（昵称、邮箱、头像）
router.put('/profile', auth, adminOnly, async (req, res, next) => {
  try {
    const { nickname, email, avatar } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return error(res, '用户不存在', 404);
    }

    const updates = {};
    if (nickname !== undefined) updates.nickname = nickname.trim();
    if (email !== undefined) updates.email = email.trim();
    if (avatar !== undefined) updates.avatar = avatar.trim();

    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updates.email)) {
        return error(res, '邮箱格式不正确', 400);
      }
      const existing = await User.findOne({
        where: { email: updates.email, id: { [Op.ne]: user.id } }
      });
      if (existing) {
        return error(res, '该邮箱已被其他用户使用', 409);
      }
    }

    await user.update(updates);
    const { password, ...rest } = user.toJSON();
    return success(res, rest, '个人信息已更新');
  } catch (err) {
    next(err);
  }
});

// 修改当前管理员密码（在个人信息模块中使用）
router.put('/profile/password', auth, adminOnly, async (req, res, next) => {
  try {
    const { old_password, new_password } = req.body;
    if (!old_password || !new_password) {
      return error(res, '旧密码和新密码不能为空', 400);
    }
    if (new_password.length < 6) {
      return error(res, '新密码至少需要6个字符', 400);
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return error(res, '用户不存在', 404);
    }

    const isMatch = await bcrypt.compare(old_password, user.password);
    if (!isMatch) {
      return error(res, '旧密码错误', 401);
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await user.update({ password: hashedPassword });
    return success(res, null, '密码修改成功');
  } catch (err) {
    next(err);
  }
});

module.exports = router;