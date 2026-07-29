const express = require('express');
const crypto = require('crypto');
const { auth, adminOnly } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');
const { Subscriber } = require('../models');
const { Op } = require('sequelize');
const config = require('../config');
const { sendSubscribeConfirmation, sendSubscribeSuccess } = require('../services/mail');

const router = express.Router();

// 邮件链接点击后在浏览器中展示的简单结果页
function renderResultPage(res, { title, message, ok = true }) {
  const color = ok ? '#49B1F5' : '#f56c6c';
  const siteUrl = config.site?.url || '';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<title>${title}</title></head>` +
    `<body style="margin:0;font-family:'Microsoft YaHei',sans-serif;background:#f5f7fa;display:flex;align-items:center;justify-content:center;min-height:100vh">` +
    `<div style="background:#fff;padding:40px 48px;box-shadow:0 4px 16px rgba(0,0,0,0.08);text-align:center;max-width:420px">` +
    `<div style="width:56px;height:56px;line-height:56px;margin:0 auto 16px;background:${color};color:#fff;font-size:28px">${ok ? '✓' : '!'}</div>` +
    `<h2 style="color:#333;font-size:20px;margin:0 0 8px">${title}</h2>` +
    `<p style="color:#666;font-size:14px;line-height:1.6;margin:0 0 20px">${message}</p>` +
    (siteUrl ? `<a href="${siteUrl}" style="display:inline-block;background:${color};color:#fff;padding:10px 28px;text-decoration:none;font-size:14px">返回首页</a>` : '') +
    `</div></body></html>`);
}

// 前台订阅
router.post('/subscribe', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return error(res, '请输入有效的邮箱地址', 400);
    }

    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || null;

    // 查找已有记录
    let sub = await Subscriber.findOne({ where: { email } });

    if (sub) {
      if (sub.status === 'active') {
        return success(res, { status: 'active' }, '该邮箱已订阅，无需重复操作');
      }
      if (sub.status === 'unsubscribed') {
        // 重新订阅：重置状态为 pending，刷新 token
        sub.status = 'pending';
        sub.token = crypto.randomBytes(32).toString('hex');
        sub.ip = ip;
        await sub.save();
      }
      // pending 状态：提示已发送确认邮件
    } else {
      sub = await Subscriber.create({ email, status: 'pending', ip });
    }

    const baseUrl = config.site?.url || `${req.protocol}://${req.get('host')}`;
    // 确认链接直接指向后端确认接口（浏览器打开后返回 HTML 结果页）
    const confirmUrl = `${baseUrl}/api/v1/subscribers/confirm/${sub.token}`;

    // 发送订阅确认邮件（pending 状态都重发，避免首封丢失后无法确认）
    let mailSent = false;
    if (sub.status === 'pending') {
      mailSent = await sendSubscribeConfirmation({ to: email, confirmUrl });
    }

    // 邮件未配置/发送失败时返回确认链接保底，便于开发调试
    const isDev = process.env.NODE_ENV !== 'production';

    return success(res, {
      status: sub.status,
      confirmUrl: (isDev || !mailSent) ? confirmUrl : undefined
    }, mailSent ? '确认邮件已发送，请查收邮箱完成确认' : '订阅请求已提交，请通过确认链接完成订阅');
  } catch (err) {
    next(err);
  }
});

// 确认订阅（邮件链接在浏览器中打开，返回 HTML 结果页）
router.get('/confirm/:token', async (req, res, next) => {
  try {
    const sub = await Subscriber.findOne({ where: { token: req.params.token } });
    if (!sub) {
      return renderResultPage(res, { title: '链接无效', message: '确认链接无效或已过期，请重新订阅。', ok: false });
    }
    if (sub.status === 'active') {
      return renderResultPage(res, { title: '已确认订阅', message: `${sub.email} 已确认订阅，无需重复操作。` });
    }
    sub.status = 'active';
    await sub.save();

    // 订阅确认成功后发送欢迎邮件（异步，不阻塞响应）
    sendSubscribeSuccess({ to: sub.email }).catch(() => {});

    return renderResultPage(res, { title: '订阅成功', message: `${sub.email} 已成功订阅，新文章发布时将第一时间通知你。` });
  } catch (err) {
    next(err);
  }
});

// 取消订阅（邮件链接在浏览器中打开，返回 HTML 结果页）
router.get('/unsubscribe/:token', async (req, res, next) => {
  try {
    const sub = await Subscriber.findOne({ where: { token: req.params.token } });
    if (!sub) {
      return renderResultPage(res, { title: '链接无效', message: '退订链接无效。', ok: false });
    }
    sub.status = 'unsubscribed';
    await sub.save();
    return renderResultPage(res, { title: '已退订', message: `${sub.email} 已成功退订，不会再收到邮件通知。` });
  } catch (err) {
    next(err);
  }
});

// 后台管理：订阅列表
router.get('/admin', auth, adminOnly, async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, status, keyword } = req.query;

    const where = {};
    if (status && ['pending', 'active', 'unsubscribed'].includes(status)) {
      where.status = status;
    }
    if (keyword) {
      where.email = { [Op.like]: `%${keyword}%` };
    }

    const { count, rows } = await Subscriber.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: Number(pageSize),
      offset: (Number(page) - 1) * Number(pageSize)
    });

    return paginated(res, { list: rows, total: count, page, pageSize });
  } catch (err) {
    next(err);
  }
});

// 后台管理：删除订阅
router.delete('/:id', auth, adminOnly, async (req, res, next) => {
  try {
    const sub = await Subscriber.findByPk(req.params.id);
    if (!sub) {
      return error(res, '订阅记录不存在', 404);
    }
    await sub.destroy();
    return success(res, null, '已删除');
  } catch (err) {
    next(err);
  }
});

// 后台管理：统计
router.get('/admin/stats', auth, adminOnly, async (req, res, next) => {
  try {
    const [total, active, pending, unsubscribed] = await Promise.all([
      Subscriber.count(),
      Subscriber.count({ where: { status: 'active' } }),
      Subscriber.count({ where: { status: 'pending' } }),
      Subscriber.count({ where: { status: 'unsubscribed' } })
    ]);
    return success(res, { total, active, pending, unsubscribed });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
