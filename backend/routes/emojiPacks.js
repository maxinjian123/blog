const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const {v4: uuidv4} = require('uuid');
const {auth, adminOnly} = require('../middleware/auth');
const {success, error, paginated} = require('../utils/response');
const {Op} = require('sequelize');
const {EmojiPack, MediaFile} = require('../models');
const {handleMulterError} = require('../middleware/upload');
const {uploadFile} = require('../services/storageService');
const config = require('../config');

const router = express.Router();

// 表情包图片最大边长：超出后由 sharp 自动压缩，避免插入编辑器后尺寸过大
const MAX_SIDE = 300;

// 表情包上传专用：仅允许常见图片格式，单文件不超过 5MB
const stickerUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter(req, file, cb) {
        if (/^image\/(jpeg|png|gif|webp)$/i.test(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('仅支持 JPG / PNG / GIF / WebP 图片'));
        }
    },
    limits: {fileSize: 5 * 1024 * 1024}
});

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

function isValidImageUrl(value) {
    return /^(https?:\/\/|\/uploads\/|data:image\/)/i.test(String(value || '').trim());
}

/**
 * 压缩表情包图片：超过 MAX_SIDE 时等比缩小，GIF 动画处理失败则回退原图
 */
async function processStickerImage(buffer, mimetype) {
    const isGif = mimetype === 'image/gif';
    try {
        const image = sharp(buffer, isGif ? {animated: true} : {});
        const meta = await image.metadata();
        if (!meta.width || !meta.height) {
            return {buffer, width: meta.width || 0, height: meta.height || 0, resized: false};
        }
        if (meta.width <= MAX_SIDE && meta.height <= MAX_SIDE) {
            return {buffer, width: meta.width, height: meta.height, resized: false};
        }
        const resized = image.resize({
            width: MAX_SIDE,
            height: MAX_SIDE,
            fit: 'inside',
            withoutEnlargement: true
        });
        const outBuffer = await resized.toBuffer();
        const outMeta = await sharp(outBuffer, isGif ? {animated: true} : {}).metadata();
        return {
            buffer: outBuffer,
            width: outMeta.width || MAX_SIDE,
            height: outMeta.height || MAX_SIDE,
            resized: true
        };
    } catch (err) {
        console.error('[EmojiPack] 图片处理失败，使用原图:', err.message);
        const meta = await sharp(buffer).metadata().catch(() => ({}));
        return {buffer, width: meta.width || 0, height: meta.height || 0, resized: false};
    }
}

/**
 * @swagger
 * /emoji-packs:
 *   get:
 *     summary: 获取编辑器可用的图片表情包（公开）
 *     tags: [表情管理]
 */
router.get('/', async (req, res, next) => {
    try {
        const list = await EmojiPack.findAll({
            where: {enabled: true},
            attributes: ['id', 'name', 'url', 'category', 'sort_order'],
            order: [['sort_order', 'ASC'], ['id', 'ASC']],
            raw: true
        });
        return success(res, {list});
    } catch (err) {
        next(err);
    }
});

// 以下接口均需要管理员权限
router.use(auth, adminOnly);

/**
 * @swagger
 * /emoji-packs/admin:
 *   get:
 *     summary: 分页查询图片表情包（管理后台）
 *     tags: [表情管理]
 *     security:
 *       - BearerAuth: []
 */
router.get('/admin', async (req, res, next) => {
    try {
        const {page = 1, pageSize = 20, keyword, category, enabled} = req.query;
        const where = {};
        if (keyword) {
            const kw = `%${keyword}%`;
            where[Op.or] = [
                {name: {[Op.like]: kw}},
                {url: {[Op.like]: kw}}
            ];
        }
        if (category) where.category = category;
        if (enabled !== undefined && enabled !== '') {
            where.enabled = String(enabled) === 'true';
        }

        const {count, rows} = await EmojiPack.findAndCountAll({
            where,
            order: [['sort_order', 'ASC'], ['id', 'ASC']],
            limit: Number(pageSize),
            offset: (Number(page) - 1) * Number(pageSize)
        });

        return paginated(res, {
            list: rows,
            total: count,
            page: Number(page),
            pageSize: Number(pageSize)
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /emoji-packs/admin/categories:
 *   get:
 *     summary: 获取表情包分类列表（管理后台）
 *     tags: [表情管理]
 *     security:
 *       - BearerAuth: []
 */
router.get('/admin/categories', async (req, res, next) => {
    try {
        const rows = await EmojiPack.findAll({
            attributes: ['category'],
            group: ['category'],
            order: [['category', 'ASC']],
            raw: true
        });
        return success(res, rows.map((r) => r.category).filter(Boolean));
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /emoji-packs/upload:
 *   post:
 *     summary: 上传表情包图片（自动压缩到 300x300 以内）
 *     tags: [表情管理]
 *     security:
 *       - BearerAuth: []
 */
router.post('/upload', stickerUpload.single('file'), handleMulterError, async (req, res, next) => {
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
        const processed = await processStickerImage(req.file.buffer, req.file.mimetype);
        const result = await uploadFile(processed.buffer, originalname, req.file.mimetype, storage);
        const media = await MediaFile.create({
            id: uuidv4(),
            filename: result.filename,
            original_name: originalname,
            mime_type: req.file.mimetype,
            size: processed.buffer.length,
            storage,
            url: result.url,
            path: result.path
        });

        return success(res, {
            url: result.url,
            width: processed.width,
            height: processed.height,
            size: processed.buffer.length,
            resized: processed.resized,
            mediaId: media.id,
            filename: media.filename
        }, '图片上传成功', 201);
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /emoji-packs:
 *   post:
 *     summary: 新增图片表情包
 *     tags: [表情管理]
 *     security:
 *       - BearerAuth: []
 */
router.post('/', async (req, res, next) => {
    try {
        const {name, url, category, sort_order, enabled} = req.body || {};
        const value = String(url || '').trim();
        if (!value || !isValidImageUrl(value)) {
            return error(res, '请提供有效的图片链接（http/https 或 /uploads/ 开头）', 400);
        }

        const record = await EmojiPack.create({
            name: name || '',
            url: value,
            category: category || 'default',
            sort_order: sort_order !== undefined ? Number(sort_order) : 0,
            enabled: enabled !== undefined ? !!enabled : true
        });
        res.locals.logMeta = {target_name: `${record.name || record.url}`};
        return success(res, record, '表情包创建成功');
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /emoji-packs/{id}:
 *   put:
 *     summary: 更新图片表情包
 *     tags: [表情管理]
 *     security:
 *       - BearerAuth: []
 */
router.put('/:id', async (req, res, next) => {
    try {
        const record = await EmojiPack.findByPk(req.params.id);
        if (!record) {
            return error(res, '表情包不存在', 404);
        }

        const {name, url, category, sort_order, enabled} = req.body || {};
        if (url !== undefined) {
            const value = String(url).trim();
            if (!value || !isValidImageUrl(value)) {
                return error(res, '请提供有效的图片链接（http/https 或 /uploads/ 开头）', 400);
            }
            record.url = value;
        }
        if (name !== undefined) record.name = name;
        if (category !== undefined) record.category = category || 'default';
        if (sort_order !== undefined) record.sort_order = Number(sort_order) || 0;
        if (enabled !== undefined) record.enabled = !!enabled;

        await record.save();
        res.locals.logMeta = {target_name: `${record.name || record.url}`};
        return success(res, record, '表情包更新成功');
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /emoji-packs/{id}:
 *   delete:
 *     summary: 删除图片表情包
 *     tags: [表情管理]
 *     security:
 *       - BearerAuth: []
 */
router.delete('/:id', async (req, res, next) => {
    try {
        const record = await EmojiPack.findByPk(req.params.id);
        if (!record) {
            return error(res, '表情包不存在', 404);
        }
        const label = record.name || record.url;
        await record.destroy();
        res.locals.logMeta = {target_name: label};
        return success(res, null, '表情包删除成功');
    } catch (err) {
        next(err);
    }
});

module.exports = router;
