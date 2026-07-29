const express = require('express');
const multer = require('multer');
const path = require('path');
const config = require('../config');
const { success } = require('../utils/response');
const { createRateLimit } = require('../utils/rateLimit');
const { detectNSFW } = require('../utils/nsfw');
const { getPureUUID } = require('../utils');

const router = express.Router();

/**
 * 修复 multer 解析中文文件名时出现的乱码问题。
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

// Redis 限流中间件：每个 IP 每分钟最多 3 条评论
const commentRateLimiter = createRateLimit({
  keyPrefix: 'rate:comment_upload',
  maxRequests: 3,
  windowSeconds: 60
});

// 评论图片专用 multer 配置：单张 5MB，仅限图片
const storage = multer.memoryStorage();

const commentUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter(req, file, cb) {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`不支持的文件类型: ${file.mimetype}，仅支持 jpg/png/gif/webp`), false);
    }
  }
});

// 处理 multer 错误
function handleMulterError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        code: 413,
        message: '图片大小超过限制（最大 5MB）',
        data: null
      });
    }
    return res.status(400).json({
      code: 400,
      message: err.message,
      data: null
    });
  }
  if (err) {
    return res.status(400).json({
      code: 400,
      message: err.message,
      data: null
    });
  }
  next();
}

// 评论图片上传【无需鉴权 + 5MB限制 + 3条/分钟限流 + NSFW检测】
router.post(
  '/',
  commentRateLimiter,
  commentUpload.single('file'),
  handleMulterError,
  async (req, res, next) => {
    try {
      if (!req.file) {
        return require('../utils/response').error(res, '未上传图片', 400);
      }

      // NSFW 内容检测
      const nsfwResult = await detectNSFW(req.file.buffer, req.file.mimetype);
      if (!nsfwResult.safe) {
        return res.status(400).json({
          code: 400,
          message: `图片内容不合规: ${nsfwResult.reason}`,
          data: null
        });
      }

      // 保存图片到磁盘
      const fs = require('fs');
      const originalname = fixFilenameEncoding(req.file.originalname);
      const ext = path.extname(originalname) || '.png';
      const filename = `${getPureUUID()}${ext}`;
      const uploadDir = path.resolve(__dirname, '..', config.upload.dir);

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, req.file.buffer);

      const fileUrl = `/uploads/${filename}`;

      return success(res, {
        filename,
        originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: fileUrl
      }, '图片上传成功', 201);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;