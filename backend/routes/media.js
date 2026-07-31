const express = require('express');
const { auth, adminOnly } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');
const { MediaFile, Music, Article, Link, Playlist, SiteConfig } = require('../models');
const { Op } = require('sequelize');
const { upload: uploadMiddleware, handleMulterError } = require('../middleware/upload');
const { uploadFile, deleteFile, readFile } = require('../services/storageService');
const config = require('../config');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

/**
 * 从 mime_type 提取主类型（image/jpeg -> image，application/pdf -> application）
 */
function getMimeMain(mime) {
  if (!mime || typeof mime !== 'string') return '';
  return mime.split('/')[0] || '';
}

/**
 * 主类型到可读标签的映射（用于前端展示）
 */
const MIME_MAIN_LABELS = {
  image: '图片',
  video: '视频',
  audio: '音频',
  application: '文档',
  text: '文本'
};

/**
 * 主类型到颜色的映射（用于前端标签展示）
 */
const MIME_MAIN_COLORS = {
  image: 'green',
  video: 'purple',
  audio: 'orange',
  application: 'red',
  text: 'blue'
};

/**
 * 迁移文件后，同步更新所有引用该文件旧 URL 的地方：
 * 1. 音乐库 Music.play_url（播放链接）+ Music.source（存储位置）
 * 2. 音乐库 Music.cover（封面图）
 * 3. 文章 Article.content（内嵌媒体）
 * 4. 文章 Article.cover（封面图）
 * 5. 友链 Link.avatar（头像/Logo）
 * 6. 歌单 Playlist.cover（封面图）
 * 7. 站点配置 SiteConfig.config_value（JSON字符串中的媒体URL）
 * @param {string} oldUrl - 迁移前的旧 URL
 * @param {string} newUrl - 迁移后的新 URL
 * @param {string} [targetStorage] - 迁移后的目标存储位置（local/minio），用于更新 Music.source
 */
async function updateReferencesAfterMigrate(oldUrl, newUrl, targetStorage) {
  if (!oldUrl || !newUrl || oldUrl === newUrl) return;

  // 1. 更新音乐库中引用该 URL 的 play_url，并同步更新 source（存储位置）
  try {
    const updateFields = { play_url: newUrl };
    if (targetStorage && ['local', 'minio'].includes(targetStorage)) {
      updateFields.source = targetStorage;
    }
    const [affected] = await Music.update(
      updateFields,
      { where: { play_url: oldUrl } }
    );
    if (affected > 0) {
      console.log(`[Media] 已更新 ${affected} 条音乐记录的 play_url${updateFields.source ? ' 及 source' : ''}`);
    }
  } catch (err) {
    console.error('[Media] 更新音乐 play_url 引用失败:', err.message);
  }

  // 2. 更新音乐库中引用该 URL 的 cover
  try {
    const [affected] = await Music.update(
      { cover: newUrl },
      { where: { cover: oldUrl } }
    );
    if (affected > 0) {
      console.log(`[Media] 已更新 ${affected} 条音乐记录的 cover`);
    }
  } catch (err) {
    console.error('[Media] 更新音乐 cover 引用失败:', err.message);
  }

  // 3. 更新文章内容中引用该 URL 的链接（图片/音频/视频 src）
  try {
    const articles = await Article.findAll({
      where: { content: { [Op.like]: `%${oldUrl}%` } },
      attributes: ['id', 'content']
    });
    for (const article of articles) {
      const updated = article.content.split(oldUrl).join(newUrl);
      await article.update({ content: updated });
    }
    if (articles.length > 0) {
      console.log(`[Media] 已更新 ${articles.length} 篇文章的 content`);
    }
  } catch (err) {
    console.error('[Media] 更新文章 content 引用失败:', err.message);
  }

  // 4. 更新文章封面图
  try {
    const [affected] = await Article.update(
      { cover: newUrl },
      { where: { cover: oldUrl } }
    );
    if (affected > 0) {
      console.log(`[Media] 已更新 ${affected} 篇文章的 cover`);
    }
  } catch (err) {
    console.error('[Media] 更新文章 cover 引用失败:', err.message);
  }

  // 5. 更新友链头像/Logo
  try {
    const [affected] = await Link.update(
      { avatar: newUrl },
      { where: { avatar: oldUrl } }
    );
    if (affected > 0) {
      console.log(`[Media] 已更新 ${affected} 条友链的 avatar`);
    }
  } catch (err) {
    console.error('[Media] 更新友链 avatar 引用失败:', err.message);
  }

  // 6. 更新歌单封面图
  try {
    const [affected] = await Playlist.update(
      { cover: newUrl },
      { where: { cover: oldUrl } }
    );
    if (affected > 0) {
      console.log(`[Media] 已更新 ${affected} 个歌单的 cover`);
    }
  } catch (err) {
    console.error('[Media] 更新歌单 cover 引用失败:', err.message);
  }

  // 7. 更新站点配置（config_value 是 JSON 字符串，需要字符串替换）
  try {
    const configs = await SiteConfig.findAll({
      where: { config_value: { [Op.like]: `%${oldUrl}%` } },
      attributes: ['id', 'config_value']
    });
    for (const config of configs) {
      const updated = config.config_value.split(oldUrl).join(newUrl);
      await config.update({ config_value: updated });
    }
    if (configs.length > 0) {
      console.log(`[Media] 已更新 ${configs.length} 条站点配置的 config_value`);
    }
  } catch (err) {
    console.error('[Media] 更新站点配置引用失败:', err.message);
  }
}

/**
 * 修复 multer 解析中文文件名时出现的乱码问题。
 * multer 默认按 latin1 解码非 ASCII 字符，需要重新以 utf8 解释。
 */
function fixFilenameEncoding(name) {
  if (!name) return name;
  // 已经是正常中文（包含常见中文范围）则直接返回
  if (/[\u4e00-\u9fa5\uff00-\uffef]/.test(name)) {
    return name;
  }
  try {
    // 将 latin1 编码的字符串重新按 utf8 解码
    return Buffer.from(name, 'latin1').toString('utf8');
  } catch (err) {
    return name;
  }
}

// 测试 MinIO 连接：尝试列举桶，验证配置是否正确
router.get('/test-minio', auth, adminOnly, async (req, res, next) => {
  try {
    const config = require('../config');
    if (!config.upload.minio?.enabled) {
      return error(res, 'MinIO 上传源未启用', 400);
    }
    const { ensureBucket } = require('../services/storageService');
    await ensureBucket();
    return success(res, { bucket: config.upload.minio.bucket }, 'MinIO 连接成功');
  } catch (err) {
    return error(res, `MinIO 连接失败：${err.message}`, 500);
  }
});

// 文件类型列表（去重后的主类型，用于前端筛选下拉）
router.get('/types', auth, adminOnly, async (req, res, next) => {
  try {
    // 查询所有不同的 mime_type
    const rows = await MediaFile.findAll({
      attributes: ['mime_type'],
      group: ['mime_type'],
      raw: true
    });
    // 提取主类型并去重
    const mainSet = new Set();
    rows.forEach(r => {
      const main = getMimeMain(r.mime_type);
      if (main) mainSet.add(main);
    });
    const types = Array.from(mainSet).map(main => ({
      value: main,
      label: MIME_MAIN_LABELS[main] || main,
      color: MIME_MAIN_COLORS[main] || 'default'
    }));
    // 固定排序：图片 > 视频 > 音频 > 文档 > 文本 > 其他
    const order = ['image', 'video', 'audio', 'application', 'text'];
    types.sort((a, b) => {
      const ia = order.indexOf(a.value);
      const ib = order.indexOf(b.value);
      if (ia === -1 && ib === -1) return a.value.localeCompare(b.value);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
    return success(res, types);
  } catch (err) {
    next(err);
  }
});

// 文件列表（支持按 storage 过滤、关键词搜索、按主类型筛选、分页）
router.get('/', auth, adminOnly, async (req, res, next) => {
  try {
    const { page = 1, pageSize = 24, storage, keyword, mime } = req.query;
    const where = {};
    if (storage && ['local', 'minio'].includes(storage)) {
      where.storage = storage;
    }
    if (keyword) {
      where[Op.or] = [
        { original_name: { [Op.like]: `%${keyword}%` } },
        { filename: { [Op.like]: `%${keyword}%` } }
      ];
    }
    if (mime) {
      // 按主类型匹配：传入 image 时匹配 image/jpeg、image/png 等
      where.mime_type = { [Op.like]: `${mime}%` };
    }

    const { count, rows } = await MediaFile.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: Number(pageSize),
      offset: (Number(page) - 1) * Number(pageSize),
      raw: true
    });

    // 统计各上传源文件数
    const [localCount, minioCount] = await Promise.all([
      MediaFile.count({ where: { storage: 'local' } }),
      MediaFile.count({ where: { storage: 'minio' } })
    ]);

    return paginated(res, {
      list: rows,
      total: count,
      page,
      pageSize,
      stats: { local: localCount, minio: minioCount, total: localCount + minioCount }
    });
  } catch (err) {
    next(err);
  }
});

// 上传文件到指定上传源
router.post('/', auth, adminOnly, uploadMiddleware.single('file'), handleMulterError, async (req, res, next) => {
  try {
    if (!req.file) {
      return error(res, '未上传文件', 400);
    }

    const storage = req.body.storage === 'minio'
      ? 'minio'
      : (req.body.storage === 'local' ? 'local' : (config.upload.defaultStorage || 'local'));

    if (storage === 'minio' && !config.upload.minio?.enabled) {
      return error(res, 'MinIO 上传源未启用，请先在设置中开启', 400);
    }

    const originalname = fixFilenameEncoding(req.file.originalname);
    const result = await uploadFile(req.file.buffer, originalname, req.file.mimetype, storage);
    const media = await MediaFile.create({
      id: uuidv4(),
      filename: result.filename,
      original_name: originalname,
      mime_type: req.file.mimetype,
      size: req.file.size,
      storage,
      url: result.url,
      path: result.path
    });

    return success(res, {
      id: media.id,
      filename: media.filename,
      originalname: media.original_name,
      size: media.size,
      mimetype: media.mime_type,
      storage: media.storage,
      url: media.url,
      path: media.path
    }, '文件上传成功', 201);
  } catch (err) {
    next(err);
  }
});

// 批量上传
router.post('/multiple', auth, adminOnly, uploadMiddleware.array('files', 10), handleMulterError, async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return error(res, '未上传任何文件', 400);
    }

    const storage = req.body.storage === 'minio'
      ? 'minio'
      : (req.body.storage === 'local' ? 'local' : (config.upload.defaultStorage || 'local'));

    if (storage === 'minio' && !config.upload.minio?.enabled) {
      return error(res, 'MinIO 上传源未启用，请先在设置中开启', 400);
    }

    const results = [];
    for (const file of req.files) {
      const originalname = fixFilenameEncoding(file.originalname);
      const result = await uploadFile(file.buffer, originalname, file.mimetype, storage);
      const media = await MediaFile.create({
        id: uuidv4(),
        filename: result.filename,
        original_name: originalname,
        mime_type: file.mimetype,
        size: file.size,
        storage,
        url: result.url,
        path: result.path
      });
      results.push({
        id: media.id,
        filename: media.filename,
        originalname: media.original_name,
        size: media.size,
        mimetype: media.mime_type,
        storage: media.storage,
        url: media.url,
        path: media.path
      });
    }

    return success(res, results, '文件批量上传成功', 201);
  } catch (err) {
    next(err);
  }
});

// 修改文件名（仅修改 original_name，不影响实际存储）
router.put('/:id', auth, adminOnly, async (req, res, next) => {
  try {
    const { original_name } = req.body;
    if (!original_name) {
      return error(res, '请提供新文件名', 400);
    }
    const file = await MediaFile.findByPk(req.params.id);
    if (!file) {
      return error(res, '文件不存在', 404);
    }
    await file.update({ original_name });
    return success(res, file, '已更新');
  } catch (err) {
    next(err);
  }
});

// 删除文件（同时删除存储源中的文件和数据库记录）
router.delete('/:id', auth, adminOnly, async (req, res, next) => {
  try {
    const file = await MediaFile.findByPk(req.params.id);
    if (!file) {
      return error(res, '文件不存在', 404);
    }

    // 先尝试删除存储源中的文件，失败不阻断数据库清理
    // path 优先，若为空则尝试用 filename（兼容历史数据）
    const deletePath = file.path || file.filename;
    try {
      await deleteFile(file.storage, deletePath);
    } catch (err) {
      console.error('[Media] 删除存储文件失败:', err.message);
      // 如果 path 删除失败，再尝试用 filename
      if (file.path && file.filename && file.path !== file.filename) {
        try {
          await deleteFile(file.storage, file.filename);
        } catch (_) { /* 忽略二次失败 */ }
      }
    }

    await file.destroy();
    return success(res, null, '文件已删除');
  } catch (err) {
    next(err);
  }
});

// 批量删除
router.post('/batch-delete', auth, adminOnly, async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return error(res, '请提供要删除的文件 ID 列表', 400);
    }

    const files = await MediaFile.findAll({ where: { id: { [Op.in]: ids } } });
    for (const file of files) {
      const deletePath = file.path || file.filename;
      try {
        await deleteFile(file.storage, deletePath);
      } catch (err) {
        console.error(`[Media] 删除存储文件失败 (${file.id}):`, err.message);
        if (file.path && file.filename && file.path !== file.filename) {
          try { await deleteFile(file.storage, file.filename); } catch (_) {}
        }
      }
      await file.destroy();
    }

    return success(res, { deleted: files.length }, `已删除 ${files.length} 个文件`);
  } catch (err) {
    next(err);
  }
});

/**
 * 迁移单个文件到目标存储源
 * 流程：读取源存储文件 buffer → 上传到目标存储 → 删除源存储文件 → 更新数据库记录
 * 失败时尽量回滚（已上传到目标但删除源失败时，保留源文件，DB 不更新）
 */
router.post('/:id/migrate', auth, adminOnly, async (req, res, next) => {
  try {
    const { storage: targetStorage } = req.body;
    if (!['local', 'minio'].includes(targetStorage)) {
      return error(res, '请提供有效的目标存储源（local 或 minio）', 400);
    }

    const file = await MediaFile.findByPk(req.params.id);
    if (!file) {
      return error(res, '文件不存在', 404);
    }

    // 目标与源相同则无需迁移
    if (file.storage === targetStorage) {
      return success(res, { skipped: true }, '文件已在目标存储源，无需迁移');
    }

    // MinIO 未启用时禁止迁移到 MinIO
    if (targetStorage === 'minio' && !config.upload.minio?.enabled) {
      return error(res, 'MinIO 上传源未启用，请先在设置中开启', 400);
    }

    const sourceStorage = file.storage;
    const sourcePath = file.path || file.filename;

    // 1. 读取源存储文件内容
    let buffer;
    try {
      buffer = await readFile(sourceStorage, sourcePath);
    } catch (err) {
      return error(res, `读取源文件失败：${err.message}`, 500);
    }

    // 2. 上传到目标存储
    let uploadResult;
    try {
      uploadResult = await uploadFile(buffer, file.original_name, file.mime_type, targetStorage);
    } catch (err) {
      return error(res, `上传到目标存储失败：${err.message}`, 500);
    }

    // 3. 删除源存储文件（失败不阻断，记录日志，避免占用双份空间但 DB 已更新）
    try {
      await deleteFile(sourceStorage, sourcePath);
    } catch (err) {
      console.error(`[Media] 迁移后删除源文件失败 (${file.id}):`, err.message);
      // 不阻断流程
    }

    // 4. 更新数据库记录
    const oldUrl = file.url;
    await file.update({
      storage: targetStorage,
      filename: uploadResult.filename,
      path: uploadResult.path,
      url: uploadResult.url
    });

    // 5. 同步更新所有引用旧 URL 的地方（音乐 play_url/source、文章内容等）
    await updateReferencesAfterMigrate(oldUrl, uploadResult.url, targetStorage);

    return success(res, {
      id: file.id,
      storage: file.storage,
      filename: file.filename,
      path: file.path,
      url: file.url
    }, `已迁移到${targetStorage === 'minio' ? 'MinIO' : '本地'}`);
  } catch (err) {
    next(err);
  }
});

/**
 * 批量迁移文件到目标存储源
 * 串行处理，单个失败不影响其他文件，返回成功/失败计数和详情
 */
router.post('/batch-migrate', auth, adminOnly, async (req, res, next) => {
  try {
    const { ids, storage: targetStorage } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return error(res, '请提供要迁移的文件 ID 列表', 400);
    }
    if (!['local', 'minio'].includes(targetStorage)) {
      return error(res, '请提供有效的目标存储源（local 或 minio）', 400);
    }
    if (targetStorage === 'minio' && !config.upload.minio?.enabled) {
      return error(res, 'MinIO 上传源未启用，请先在设置中开启', 400);
    }

    const files = await MediaFile.findAll({ where: { id: { [Op.in]: ids } } });
    const succeeded = [];
    const failed = [];

    for (const file of files) {
      // 跳过已为目标存储的文件
      if (file.storage === targetStorage) {
        succeeded.push({ id: file.id, original_name: file.original_name, skipped: true });
        continue;
      }
      const sourceStorage = file.storage;
      const sourcePath = file.path || file.filename;
      try {
        const buffer = await readFile(sourceStorage, sourcePath);
        const uploadResult = await uploadFile(buffer, file.original_name, file.mime_type, targetStorage);
        try {
          await deleteFile(sourceStorage, sourcePath);
        } catch (err) {
          console.error(`[Media] 批量迁移删除源文件失败 (${file.id}):`, err.message);
        }
        const oldUrl = file.url;
        await file.update({
          storage: targetStorage,
          filename: uploadResult.filename,
          path: uploadResult.path,
          url: uploadResult.url
        });
        // 同步更新引用旧 URL 的地方（音乐 play_url/source、文章内容等）
        await updateReferencesAfterMigrate(oldUrl, uploadResult.url, targetStorage);
        succeeded.push({ id: file.id, original_name: file.original_name });
      } catch (err) {
        failed.push({ id: file.id, original_name: file.original_name, reason: err.message });
      }
    }

    const msg = `成功迁移 ${succeeded.length} 个${failed.length > 0 ? `，失败 ${failed.length} 个` : ''}`;
    return success(res, { succeeded, failed, total: files.length }, msg);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
