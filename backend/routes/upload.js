const express = require('express');
const { auth, adminOnly } = require('../middleware/auth');
const { success, error } = require('../utils/response');
const { upload, handleMulterError } = require('../middleware/upload');
const { uploadFile } = require('../services/storageService');
const { MediaFile } = require('../models');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

const router = express.Router();

/**
 * 修复 multer 解析中文文件名时出现的乱码问题。
 * multer 默认按 latin1 解码非 ASCII 字符，需要重新以 utf8 解释。
 */
function fixFilenameEncoding(name) {
  if (!name) return name;
  if (/[\u4e00-\u9fa5\uff00-\uffef]/.test(name)) {
    return name;
  }
  try {
    return Buffer.from(name, 'latin1').toString('utf8');
  } catch (err) {
    return name;
  }
}

// 通用上传：支持 storage 参数（local / minio），默认走配置中的 defaultStorage
router.post('/', auth, adminOnly, upload.single('file'), handleMulterError, async (req, res, next) => {
  try {
    if (!req.file) {
      return error(res, '未上传文件', 400);
    }

    const storage = req.body.storage && req.body.storage === 'minio'
      ? 'minio'
      : (req.body.storage === 'local' ? 'local' : (config.upload.defaultStorage || 'local'));

    if (storage === 'minio' && !config.upload.minio?.enabled) {
      return error(res, 'MinIO 上传源未启用，请先在设置中开启', 400);
    }

    const originalname = fixFilenameEncoding(req.file.originalname);
    const result = await uploadFile(req.file.buffer, originalname, req.file.mimetype, storage);

    // 记录到媒体库
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
router.post('/multiple', auth, adminOnly, upload.array('files', 10), handleMulterError, async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return error(res, '未上传任何文件', 400);
    }

    const storage = req.body.storage && req.body.storage === 'minio'
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

module.exports = router;
