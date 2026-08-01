const jwt = require('jsonwebtoken');
const config = require('../config');
const { error } = require('../utils/response');

function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, '请先登录', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;

    // 滑动续期：剩余有效期不足阈值时，签发新 token 通过响应头返回
    // 前端 axios 响应拦截器检测到 X-New-Token 后自动更新本地存储
    const now = Math.floor(Date.now() / 1000);
    const remaining = (decoded.exp || 0) - now;
    if (remaining > 0 && remaining < config.jwt.refreshThreshold) {
      const newToken = jwt.sign(
        { id: decoded.id, username: decoded.username, email: decoded.email, role: decoded.role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );
      res.setHeader('X-New-Token', newToken);
    }

    next();
  } catch (err) {
    return error(res, '登录凭证无效或已过期', 401);
  }
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      req.user = decoded;
    } catch (err) {
      // 可选鉴权：令牌无效时以游客身份继续
    }
  }
  next();
}

// 需要管理员角色（须在 auth 之后使用）
function adminOnly(req, res, next) {
  if (!req.user) {
    return error(res, '请先登录', 401);
  }
  if (req.user.role !== 'admin') {
    return error(res, '需要管理员权限', 403);
  }
  next();
}

module.exports = { auth, optionalAuth, adminOnly };