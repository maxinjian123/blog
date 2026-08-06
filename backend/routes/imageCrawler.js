const express = require('express');
const { auth, adminOnly } = require('../middleware/auth');
const { success, error } = require('../utils/response');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const imageCrawler = require('../services/imageCrawler');
const { uploadFile } = require('../services/storageService');
const { MediaFile } = require('../models');

const router = express.Router();

/**
 * 单次批量下载上限
 */
const MAX_BATCH = 20;

/**
 * 各平台的版权 / 许可说明（写入 MediaFile.license，便于后续追溯）
 */
const PLATFORM_LICENSES = {
  bing: 'Bing 图片搜索结果，版权归原作者所有',
  baidu: '百度图片搜索结果，版权归原作者所有',
  dogetu: 'dogetu.com',
  pexels: 'Pexels License（免费商用，无需署名）',
  pixabay: 'Pixabay Content License（免费商用，无需署名）',
  unsplash: 'Unsplash License（免费商用，需署名摄影师）'
};

function getPlatformLicense(platform) {
  return PLATFORM_LICENSES[platform] || `${platform} 来源图片，版权归原作者所有`;
}

/**
 * @swagger
 * /image-crawler/platforms:
 *   get:
 *     summary: 列出可用的图片抓取平台
 *     tags: [图片抓取]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 平台列表
 */
router.get('/platforms', auth, adminOnly, async (req, res, next) => {
  try {
    const list = imageCrawler.listAllPlatforms();
    return success(res, list);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /image-crawler/search:
 *   get:
 *     summary: 按关键词搜索图片或表情包
 *     tags: [图片抓取]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: keyword
 *         required: true
 *         description: 搜索关键词
 *         schema: { type: string }
 *       - in: query
 *         name: platform
 *         required: true
 *         description: 图片平台
 *         schema: { type: string, enum: [bing, baidu, dogetu, pexels, pixabay, unsplash] }
 *       - in: query
 *         name: page
 *         description: 页码
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         description: 每页数量
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: 搜索结果
 */
router.get('/search', auth, adminOnly, async (req, res, next) => {
  try {
    const { keyword, platform, page = 1, pageSize = 20 } = req.query;
    if (!keyword || !String(keyword).trim()) {
      return error(res, '请输入搜索关键词', 400);
    }
    if (!platform) {
      return error(res, '请选择平台', 400);
    }

    const result = await imageCrawler.searchImages(
      String(keyword).trim(),
      Number(page),
      Number(pageSize),
      String(platform)
    );

    return success(res, result, `共找到 ${result.total} 个结果`);
  } catch (err) {
    if (err.code === 'INVALID_PLATFORM') {
      return error(res, err.message, 400);
    }
    next(err);
  }
});

/**
 * @swagger
 * /image-crawler/download:
 *   post:
 *     summary: 下载单张图片到本地/MinIO 媒体库
 *     tags: [图片抓取]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               platform: { type: string, enum: [bing, baidu, dogetu, pexels, pixabay, unsplash], description: 图片平台（必填） }
 *               storage: { type: string, enum: [local, minio], description: 存储源，默认 local }
 *               item:
 *                 type: object
 *                 description: search 接口返回的列表项（含下载地址等）
 *     responses:
 *       200:
 *         description: 下载结果
 */
router.post('/download', auth, adminOnly, async (req, res, next) => {
  try {
    const { platform, storage, item } = req.body;
    if (!platform || !item) {
      return error(res, '参数缺失：platform 和 item 必填', 400);
    }
    const targetStorage = storage === 'minio' ? 'minio' : 'local';
    if (targetStorage === 'minio' && !config.upload.minio?.enabled) {
      return error(res, 'MinIO 上传源未启用，请先在设置中开启', 400);
    }

    const file = await imageCrawler.fetchOriginal(item, platform);

    // 上传到目标存储
    const uploadResult = await uploadFile(file.buffer, file.filename, file.mimetype, targetStorage);

    // 写入 MediaFile（含来源元数据，用于版权标注）
    const media = await MediaFile.create({
      id: uuidv4(),
      filename: uploadResult.filename,
      original_name: item.title || file.filename,
      mime_type: file.mimetype,
      size: file.buffer.length,
      storage: targetStorage,
      url: uploadResult.url,
      path: uploadResult.path,
      author: item.author || '',
      source_url: item.source_url || '',
      license: getPlatformLicense(platform),
      source_platform: platform
    });

    return success(res, {
      id: media.id,
      filename: media.filename,
      original_name: media.original_name,
      mimetype: media.mime_type,
      size: media.size,
      storage: media.storage,
      url: media.url,
      author: media.author,
      source_url: media.source_url,
      license: media.license
    }, '图片已下载到媒体库', 201);
  } catch (err) {
    if (err.code === 'INVALID_PLATFORM') {
      return error(res, err.message, 400);
    }
    next(err);
  }
});

/**
 * @swagger
 * /image-crawler/batch-download:
 *   post:
 *     summary: 批量下载图片到本地/MinIO 媒体库
 *     tags: [图片抓取]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               platform: { type: string, enum: [bing, baidu, dogetu, pexels, pixabay, unsplash], description: 图片平台（必填） }
 *               storage: { type: string, enum: [local, minio], description: 存储源，默认 local }
 *               items:
 *                 type: array
 *                 items: { type: object }
 *                 description: search 接口返回的列表项数组（最多 20 个）
 *     responses:
 *       200:
 *         description: 批量下载结果
 */
router.post('/batch-download', auth, adminOnly, async (req, res, next) => {
  try {
    const { platform, storage, items } = req.body;
    if (!platform || !Array.isArray(items) || items.length === 0) {
      return error(res, '请提供平台和图片列表', 400);
    }
    if (items.length > MAX_BATCH) {
      return error(res, `单次最多下载 ${MAX_BATCH} 张图片`, 400);
    }
    const targetStorage = storage === 'minio' ? 'minio' : 'local';
    if (targetStorage === 'minio' && !config.upload.minio?.enabled) {
      return error(res, 'MinIO 上传源未启用，请先在设置中开启', 400);
    }

    const succeeded = [];
    const failed = [];

    for (const item of items) {
      try {
        const file = await imageCrawler.fetchOriginal(item, platform);
        const uploadResult = await uploadFile(file.buffer, file.filename, file.mimetype, targetStorage);
        const media = await MediaFile.create({
          id: uuidv4(),
          filename: uploadResult.filename,
          original_name: item.title || file.filename,
          mime_type: file.mimetype,
          size: file.buffer.length,
          storage: targetStorage,
          url: uploadResult.url,
          path: uploadResult.path,
          author: item.author || '',
          source_url: item.source_url || '',
          license: getPlatformLicense(platform),
          source_platform: platform
        });
        succeeded.push({
          id: media.id,
          original_name: media.original_name,
          url: media.url,
          storage: media.storage
        });
      } catch (err) {
        failed.push({ item, reason: err.message });
      }
    }

    const msg = `成功下载 ${succeeded.length} 张${failed.length > 0 ? `，失败 ${failed.length} 张` : ''}`;
    return success(res, { succeeded, failed, total: items.length }, msg);
  } catch (err) {
    if (err.code === 'INVALID_PLATFORM') {
      return error(res, err.message, 400);
    }
    next(err);
  }
});

module.exports = router;
