const express = require('express');
const { auth, adminOnly } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');
const { MediaFile } = require('../models');
const { Op } = require('sequelize');
const { upload: uploadMiddleware, handleMulterError } = require('../middleware/upload');
const { uploadFile, deleteFile } = require('../services/storageService');
const config = require('../config');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

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

// 文件列表（支持按 storage 过滤、关键词搜索、分页）
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

module.exports = router;
