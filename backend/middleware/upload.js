const multer = require('multer');
const config = require('../config');
const { error } = require('../utils/response');

// 使用内存存储：由 storageService 统一决定最终落地（本地/MinIO）
const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'application/pdf',
        'text/markdown',
        'text/plain',
        'video/mp4',
        'video/webm',
        'video/ogg',
        'video/x-msvideo',
        'video/quicktime'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`不支持的文件类型 ${file.mimetype}`), false);
    }
}

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: parseMaxSize(config.upload.maxSize)
    }
});

function parseMaxSize(size) {
    const units = { b: 1, kb: 1024, mb: 1024 * 1024 };
    const match = String(size || '10mb').toLowerCase().match(/^(\d+)(b|kb|mb)$/);
    if (match) {
        return Number(match[1]) * units[match[2]];
    }
    return 10 * 1024 * 1024;
}

function handleMulterError(err, req, res, next) {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return error(res, '上传文件过大，请压缩后重试', 413);
        }
        return error(res, err.message, 400);
    }
    if (err) {
        return error(res, err.message, 400);
    }
    next();
}

module.exports = { upload, handleMulterError };
