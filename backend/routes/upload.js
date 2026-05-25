const express = require('express');
const { auth } = require('../middleware/auth');
const { success } = require('../utils/response');
const { upload, handleMulterError } = require('../middleware/upload');

const router = express.Router();

router.post('/', auth, upload.single('file'), handleMulterError, (req, res, next) => {
  try {
    if (!req.file) {
      return require('../utils/response').error(res, '未上传文件', 400);
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    return success(res, {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      url: fileUrl
    }, '文件上传成功', 201);
  } catch (err) {
    next(err);
  }
});

router.post('/multiple', auth, upload.array('files', 10), handleMulterError, (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return require('../utils/response').error(res, '未上传任何文件', 400);
    }

    const files = req.files.map((file) => ({
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: `/uploads/${file.filename}`
    }));

    return success(res, files, '文件批量上传成功', 201);
  } catch (err) {
    next(err);
  }
});

module.exports = router;