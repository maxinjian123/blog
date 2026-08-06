const express = require('express');
const path = require('path');
const fsp = require('fs').promises;
const multer = require('multer');
const { auth, adminOnly } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');
const backupService = require('../services/backupService');

const router = express.Router();

// 所有备份接口均需要管理员权限
router.use(auth, adminOnly);

// 备份文件上传使用独立临时目录，保存/恢复成功后自动清理
const upload = multer({
  storage: multer.diskStorage({
    destination: backupService.BACKUP_DIR + path.sep + '.tmp',
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${path.extname(file.originalname || '.sql')}`);
    }
  }),
  limits: { fileSize: 500 * 1024 * 1024 }
});

function uploadSingle(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return error(res, '备份文件过大，最大支持 500MB', 413);
      }
      return error(res, err.message || '文件上传失败', 400);
    }
    next();
  });
}

async function cleanupTempDir() {
  try {
    const tempDir = path.join(backupService.BACKUP_DIR, '.tmp');
    const entries = await fsp.readdir(tempDir).catch(() => []);
    for (const name of entries) {
      await fsp.unlink(path.join(tempDir, name)).catch(() => {});
    }
  } catch {
    // 清理失败不影响主流程
  }
}

/**
 * @swagger
 * /backups:
 *   get:
 *     summary: 分页查询备份文件
 *     tags: [数据备份]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         description: 页码
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         description: 每页数量（最大 100）
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: keyword
 *         schema: { type: string }
 *         description: 文件名关键字
 *       - in: query
 *         name: type
 *         description: 备份类型
 *         schema: { type: string, enum: [manual, scheduled, upload] }
 *       - in: query
 *         name: startDate
 *         description: 开始日期（YYYY-MM-DD）
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         description: 结束日期（YYYY-MM-DD）
 *         schema: { type: string, format: date }
 */
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, keyword, type, startDate, endDate } = req.query;
    let records = await backupService.scanBackups();

    if (keyword) {
      const kw = String(keyword).toLowerCase();
      records = records.filter((r) => r.filename.toLowerCase().includes(kw) || r.remark.toLowerCase().includes(kw));
    }
    if (type) {
      records = records.filter((r) => r.type === String(type));
    }
    if (startDate) {
      records = records.filter((r) => String(r.created_at || '').slice(0, 10) >= String(startDate).slice(0, 10));
    }
    if (endDate) {
      records = records.filter((r) => String(r.created_at || '').slice(0, 10) <= String(endDate).slice(0, 10));
    }

    const total = records.length;
    const p = Math.max(Number(page) || 1, 1);
    const ps = Math.min(Math.max(Number(pageSize) || 20, 1), 100);
    const list = records.slice((p - 1) * ps, p * ps);
    return paginated(res, { list, total, page: p, pageSize: ps });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /backups/stats:
 *   get:
 *     summary: 备份统计信息
 *     tags: [数据备份]
 *     security:
 *       - BearerAuth: []
 */
router.get('/stats', async (req, res, next) => {
  try {
    return success(res, await backupService.getBackupStats());
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /backups/schedule:
 *   get:
 *     summary: 获取定时备份配置
 *     tags: [数据备份]
 *     security:
 *       - BearerAuth: []
 */
router.get('/schedule', async (req, res, next) => {
  try {
    return success(res, await backupService.loadScheduleConfig());
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /backups/schedule:
 *   put:
 *     summary: 保存定时备份配置
 *     tags: [数据备份]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enabled: { type: boolean, description: 是否启用定时备份 }
 *               frequency: { type: string, enum: [daily, weekly, interval], description: 备份频率 }
 *               time: { type: string, description: 执行时间（daily/weekly 时使用，格式 HH:mm） }
 *               interval_minutes: { type: integer, description: 间隔分钟数（frequency=interval 时使用，最小 5） }
 */
router.put('/schedule', async (req, res, next) => {
  try {
    const cfg = await backupService.updateScheduleConfig(req.body || {});
    res.locals.logMeta = { target_name: '定时备份配置' };
    return success(res, cfg, '定时备份配置已保存');
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /backups:
 *   post:
 *     summary: 立即创建在线备份
 *     tags: [数据备份]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               remark:
 *                 type: string
 *                 description: 备份备注（最多 200 字）
 */
router.post('/', async (req, res, next) => {
  try {
    const { remark } = req.body || {};
    const record = await backupService.createBackup({
      type: backupService.TYPE_MANUAL,
      operator: req.user?.username || '',
      remark: String(remark || '').slice(0, 200)
    });
    res.locals.logMeta = { target_name: record.filename };
    return success(res, record, '备份创建成功');
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /backups/upload:
 *   post:
 *     summary: 上传备份文件（仅保存，不恢复）
 *     tags: [数据备份]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: 备份文件（.sql，最大 500MB）
 */
router.post('/upload', uploadSingle, async (req, res, next) => {
  try {
    if (!req.file) return error(res, '请选择要上传的备份文件', 400);
    const record = await backupService.storeUploadedBackup(req.file, {
      operator: req.user?.username || ''
    });
    res.locals.logMeta = { target_name: record.filename, action: 'upload' };
    return success(res, record, '备份文件上传成功');
  } catch (err) {
    next(err);
  } finally {
    cleanupTempDir();
  }
});

/**
 * @swagger
 * /backups/restore-upload:
 *   post:
 *     summary: 上传备份文件并立即在线恢复
 *     tags: [数据备份]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: 备份文件（.sql，最大 500MB）
 */
router.post('/restore-upload', uploadSingle, async (req, res, next) => {
  try {
    if (!req.file) return error(res, '请选择要恢复的备份文件', 400);
    const record = await backupService.restoreUploadedBackup(req.file, {
      operator: req.user?.username || ''
    });
    res.locals.logMeta = { target_name: record.filename, action: 'restore' };
    return success(res, record, '备份恢复成功');
  } catch (err) {
    next(err);
  } finally {
    cleanupTempDir();
  }
});

/**
 * @swagger
 * /backups/{id}/download:
 *   get:
 *     summary: 下载备份文件
 *     tags: [数据备份]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 备份记录 ID（文件名或 ID）
 *         schema: { type: string }
 */
router.get('/:id/download', async (req, res, next) => {
  try {
    const resolved = await backupService.resolveBackup(req.params.id);
    if (!resolved) return error(res, '备份文件不存在', 404);
    res.locals.logMeta = { target_name: resolved.record.filename, action: 'download' };
    return res.download(resolved.filePath, resolved.record.filename);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /backups/{id}/restore:
 *   post:
 *     summary: 在线恢复指定备份
 *     tags: [数据备份]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 备份记录 ID（文件名或 ID）
 *         schema: { type: string }
 */
router.post('/:id/restore', async (req, res, next) => {
  try {
    const record = await backupService.restoreBackup(req.params.id, {
      operator: req.user?.username || ''
    });
    res.locals.logMeta = { target_name: record.filename, action: 'restore' };
    return success(res, record, '备份恢复成功');
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 备份记录 ID（文件名或 ID）
 *         schema: { type: string }
 * /backups/{id}:
 *   delete:
 *     summary: 删除备份文件
 *     tags: [数据备份]
 *     security:
 *       - BearerAuth: []
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const record = await backupService.deleteBackup(req.params.id);
    res.locals.logMeta = { target_name: record.filename };
    return success(res, null, '备份文件已删除');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
