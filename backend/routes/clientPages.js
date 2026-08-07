const express = require('express');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { auth, adminOnly } = require('../middleware/auth');
const { success, error } = require('../utils/response');
const {
  buildBlogHelperScript,
  buildCommonJs,
  COMMON_JS_FILE,
  PAGE_STYLE_TEMPLATE,
  PAGE_SCRIPT_TEMPLATE,
  buildPageIndexHtml
} = require('../utils/clientPageTemplate');

/**
 * 自定义博客客户端页面（文件存储模式）
 * - 页面文件直接存放在后端静态资源目录 backend/public 下，通过链接直接访问
 * - 挂载于 /api/v1/client-pages：文件树 / 文件 / 目录 / 页面模板 的增删改查（管理员）
 */
const router = express.Router();

// 静态资源根目录（backend/public）
const ROOT = path.resolve(__dirname, '..', 'public');

// 在线编辑的文本文件大小上限（2MB）
const MAX_TEXT_SIZE = 2 * 1024 * 1024;

/**
 * 将前端提交的相对路径安全解析为根目录内的绝对路径
 * 拒绝 ..、.、空段等穿越/异常路径，防止越出 public 目录
 */
function resolveSafe(relPath) {
  const clean = String(relPath || '')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .trim();
  if (!clean) return ROOT;
  const segments = clean.split('/');
  if (segments.some((s) => s === '..' || s === '.' || s === '')) {
    const err = new Error('非法路径');
    err.status = 400;
    throw err;
  }
  const full = path.resolve(ROOT, clean);
  if (full !== ROOT && !full.startsWith(ROOT + path.sep)) {
    const err = new Error('非法路径');
    err.status = 400;
    throw err;
  }
  return full;
}

/** 递归遍历目录，生成文件树 */
async function walkDir(absDir, relDir) {
  const entries = await fsp.readdir(absDir, { withFileTypes: true });
  const nodes = [];
  for (const entry of entries) {
    const rel = relDir ? `${relDir}/${entry.name}` : entry.name;
    const abs = path.join(absDir, entry.name);
    if (entry.isDirectory()) {
      nodes.push({
        name: entry.name,
        path: rel,
        type: 'dir',
        children: await walkDir(abs, rel)
      });
    } else if (entry.isFile()) {
      let stat = null;
      try {
        stat = await fsp.stat(abs);
      } catch (e) {
        stat = null;
      }
      nodes.push({
        name: entry.name,
        path: rel,
        type: 'file',
        size: stat?.size || 0,
        updatedAt: stat?.mtime || null
      });
    }
  }
  // 目录在前、文件在后，各自按名称排序
  nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
    return a.name.localeCompare(b.name, 'zh-CN');
  });
  return nodes;
}

// ==================== 文件树 ====================

// 获取 public 目录完整文件树
router.get('/tree', auth, adminOnly, async (req, res, next) => {
  try {
    const tree = await walkDir(ROOT, '');
    return success(res, { root: path.basename(ROOT), tree });
  } catch (err) {
    next(err);
  }
});

// ==================== 文件操作 ====================

// 读取文件内容（仅文本文件可在线编辑）
router.get('/file', auth, adminOnly, async (req, res, next) => {
  try {
    const rel = req.query.path;
    if (!rel) return error(res, '请指定文件路径', 400);
    const abs = resolveSafe(rel);
    if (!fs.existsSync(abs)) return error(res, '文件不存在', 404);
    const stat = await fsp.stat(abs);
    if (!stat.isFile()) return error(res, '目标不是文件', 400);
    if (stat.size > MAX_TEXT_SIZE) return error(res, '文件过大，无法在线编辑', 400);

    const buf = await fsp.readFile(abs);
    // 判断是否为文本：前 8000 字节不含 NUL 字节
    const isText = !buf.subarray(0, 8000).includes(0);

    return success(res, {
      path: rel,
      name: path.basename(abs),
      size: stat.size,
      isText,
      content: isText ? buf.toString('utf8') : null,
      updatedAt: stat.mtime
    });
  } catch (err) {
    next(err);
  }
});

// 创建新文件（已存在时报错）
router.post('/file', auth, adminOnly, async (req, res, next) => {
  try {
    const { path: rel, content = '' } = req.body || {};
    if (!rel) return error(res, '请指定文件路径', 400);
    const abs = resolveSafe(rel);
    if (fs.existsSync(abs)) return error(res, '文件已存在', 409);
    await fsp.mkdir(path.dirname(abs), { recursive: true });
    await fsp.writeFile(abs, String(content), 'utf8');
    res.locals.logMeta = { target_name: rel };
    return success(res, { path: rel }, '文件已创建', 201);
  } catch (err) {
    next(err);
  }
});

// 写入 / 覆盖文件内容（保存时调用，自动创建父目录）
router.put('/file', auth, adminOnly, async (req, res, next) => {
  try {
    const { path: rel, content = '' } = req.body || {};
    if (!rel) return error(res, '请指定文件路径', 400);
    const abs = resolveSafe(rel);
    await fsp.mkdir(path.dirname(abs), { recursive: true });
    await fsp.writeFile(abs, String(content), 'utf8');
    res.locals.logMeta = { target_name: rel };
    return success(res, { path: rel }, '文件已保存');
  } catch (err) {
    next(err);
  }
});

// 删除文件
router.delete('/file', auth, adminOnly, async (req, res, next) => {
  try {
    const rel = req.query.path;
    if (!rel) return error(res, '请指定文件路径', 400);
    const abs = resolveSafe(rel);
    if (!fs.existsSync(abs)) return error(res, '文件不存在', 404);
    const stat = await fsp.stat(abs);
    if (!stat.isFile()) return error(res, '目标不是文件', 400);
    await fsp.unlink(abs);
    res.locals.logMeta = { target_name: rel };
    return success(res, null, '文件已删除');
  } catch (err) {
    next(err);
  }
});

// ==================== 目录操作 ====================

// 创建目录（可递归）
router.post('/dir', auth, adminOnly, async (req, res, next) => {
  try {
    const { path: rel } = req.body || {};
    if (!rel) return error(res, '请指定目录路径', 400);
    const abs = resolveSafe(rel);
    if (fs.existsSync(abs)) return error(res, '目录已存在', 409);
    await fsp.mkdir(abs, { recursive: true });
    res.locals.logMeta = { target_name: rel };
    return success(res, { path: rel }, '目录已创建', 201);
  } catch (err) {
    next(err);
  }
});

// 删除目录（递归）
router.delete('/dir', auth, adminOnly, async (req, res, next) => {
  try {
    const rel = req.query.path;
    if (!rel) return error(res, '请指定目录路径', 400);
    const abs = resolveSafe(rel);
    if (abs === ROOT) return error(res, '不能删除根目录', 400);
    if (!fs.existsSync(abs)) return error(res, '目录不存在', 404);
    const stat = await fsp.stat(abs);
    if (!stat.isDirectory()) return error(res, '目标不是目录', 400);
    await fsp.rm(abs, { recursive: true, force: true });
    res.locals.logMeta = { target_name: rel };
    return success(res, null, '目录已删除');
  } catch (err) {
    next(err);
  }
});

// 重命名 / 移动
router.put('/rename', auth, adminOnly, async (req, res, next) => {
  try {
    const { from, to } = req.body || {};
    if (!from || !to) return error(res, '请指定源路径与目标路径', 400);
    const fromAbs = resolveSafe(from);
    const toAbs = resolveSafe(to);
    if (fromAbs === ROOT || toAbs === ROOT) return error(res, '不能移动根目录', 400);
    if (!fs.existsSync(fromAbs)) return error(res, '源文件或目录不存在', 404);
    if (fs.existsSync(toAbs)) return error(res, '目标已存在', 409);
    await fsp.mkdir(path.dirname(toAbs), { recursive: true });
    await fsp.rename(fromAbs, toAbs);
    res.locals.logMeta = { target_name: `${from} → ${to}` };
    return success(res, { from, to }, '重命名成功');
  } catch (err) {
    next(err);
  }
});

// ==================== 页面模板 ====================

/** 确保 public 根目录的公共封装脚本（common.js）存在，缺失时写入最新模板 */
async function ensureCommonJs() {
  const target = path.join(__dirname, '..', 'public', COMMON_JS_FILE);
  try {
    if (!fs.existsSync(target)) {
      await fsp.writeFile(target, buildCommonJs(), 'utf8');
      console.log(`[ClientPages] 已生成公共封装脚本 public/${COMMON_JS_FILE}`);
    }
  } catch (err) {
    console.error(`[ClientPages] 生成 public/${COMMON_JS_FILE} 失败:`, err.message);
  }
}

// 新建页面：在 public/<name>/ 下创建 index.html / style.css / script.js 模板
router.post('/page', auth, adminOnly, async (req, res, next) => {
  try {
    const { name } = req.body || {};
    const title = String(name || '').trim();
    // 目录名：转小写、空格转连字符，保留字母数字中文与连字符；去除路径分隔符等危险字符
    let slug = title
      .toLowerCase()
      .replace(/[\s_]+/g, '-')
      .replace(/[^a-z0-9-\u4e00-\u9fa5]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    if (!slug) return error(res, '页面名称需包含字母、数字或中文', 400);

    const rel = slug; // 页面直接存放于 public 根目录
    const abs = resolveSafe(rel);
    if (fs.existsSync(abs)) return error(res, '页面已存在', 409);

    // 页面模板通过 <script src="/common.js"> 引用公共封装脚本，确保其存在
    await ensureCommonJs();
    await fsp.mkdir(abs, { recursive: true });
    await fsp.writeFile(path.join(abs, 'index.html'), buildPageIndexHtml(title || slug), 'utf8');
    await fsp.writeFile(path.join(abs, 'style.css'), PAGE_STYLE_TEMPLATE, 'utf8');
    await fsp.writeFile(path.join(abs, 'script.js'), PAGE_SCRIPT_TEMPLATE, 'utf8');

    res.locals.logMeta = { target_name: title || slug };
    return success(res, { path: rel }, '页面已创建', 201);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
module.exports.ensureCommonJs = ensureCommonJs;
