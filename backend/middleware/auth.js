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