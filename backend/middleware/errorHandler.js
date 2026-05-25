const { error } = require('../utils/response');

function errorHandler(err, req, res, _next) {
  console.error('[Error]', err.message || err);

  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map((e) => e.message);
    return error(res, '数据验证失败：' + messages.join('; '), 400, messages);
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const fields = err.errors.map((e) => e.path || e.message).join(', ');
    return error(res, `数据重复：${fields} 已存在`, 409, err.errors.map((e) => e.message));
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return error(res, '关联数据不存在，请检查关联字段是否正确', 400);
  }

  if (err.name === 'JsonWebTokenError') {
    return error(res, '登录凭证无效，请重新登录', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return error(res, '登录已过期，请重新登录', 401);
  }

  if (err.name === 'SyntaxError' && err.status === 400 && 'body' in err) {
    return error(res, '请求数据格式错误，请检查JSON格式', 400);
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return error(res, '上传文件过大，请压缩后重试', 413);
  }

  if (err.status) {
    return error(res, err.message || '请求处理失败', err.status);
  }

  if (err.message && err.message.includes('API')) {
    return error(res, 'AI 服务暂时不可用，请稍后再试', 503);
  }

  if (err.message && err.message.includes('ECONNREFUSED')) {
    return error(res, '服务连接失败，请检查服务是否正常运行', 503);
  }

  if (err.message && err.message.includes('ETIMEDOUT')) {
    return error(res, '请求超时，请稍后再试', 504);
  }

  return error(res, '服务器内部错误，请稍后再试', 500);
}

module.exports = errorHandler;
