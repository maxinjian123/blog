const express = require('express');
const {auth, adminOnly} = require('../middleware/auth');
const {success, error, paginated} = require('../utils/response');
const {Op, fn, col, literal} = require('sequelize');
const {OperationLog} = require('../models');

const router = express.Router();

// 所有接口都需要管理员权限
router.use(auth, adminOnly);

/**
 * @swagger
 * /operation-logs:
 *   get:
 *     summary: 分页查询操作日志
 *     tags: [操作日志]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         description: 页码
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         description: 每页数量
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: module
 *         schema: { type: string }
 *         description: 模块筛选
 *       - in: query
 *         name: action
 *         schema: { type: string }
 *         description: 操作类型筛选
 *       - in: query
 *         name: status
 *         description: 操作状态筛选
 *         schema: { type: string, enum: [success, fail] }
 *       - in: query
 *         name: username
 *         schema: { type: string }
 *         description: 操作者用户名（模糊匹配）
 *       - in: query
 *         name: startDate
 *         description: 开始时间
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: endDate
 *         description: 结束时间
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: 操作日志列表
 */
router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1, pageSize = 20,
      module, action, status, username,
      startDate, endDate
    } = req.query;

    const where = {};
    if (module) where.module = module;
    if (action) where.action = action;
    if (status) where.status = status;
    if (username) where.username = {[Op.like]: `%${username}%`};
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[Op.gte] = startDate;
      if (endDate) where.created_at[Op.lte] = endDate;
    }

    const {count, rows} = await OperationLog.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: Number(pageSize),
      offset: (Number(page) - 1) * Number(pageSize)
    });

    return paginated(res, { list: rows, total: count, page: Number(page), pageSize: Number(pageSize) });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /operation-logs/{id}:
 *   get:
 *     summary: 获取操作日志详情
 *     tags: [操作日志]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 日志 ID
 *         schema: { type: integer }
 */
router.get('/:id', async (req, res, next) => {
  try {
    const log = await OperationLog.findByPk(req.params.id);
    if (!log) return error(res, '日志不存在', 404);
    return success(res, log);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /operation-logs/export/data:
 *   get:
 *     summary: 导出操作日志（CSV/JSON）
 *     tags: [操作日志]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         description: 导出格式
 *         schema: { type: string, enum: [csv, json], default: json }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 1000 }
 *         description: 导出条数上限（最大 5000）
 *       - in: query
 *         name: module
 *         description: 按模块筛选
 *         schema: { type: string }
 *       - in: query
 *         name: action
 *         description: 按操作类型筛选
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         description: 按状态筛选
 *         schema: { type: string, enum: [success, fail] }
 *       - in: query
 *         name: username
 *         description: 按操作者用户名筛选
 *         schema: { type: string }
 *       - in: query
 *         name: startDate
 *         description: 开始时间
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: endDate
 *         description: 结束时间
 *         schema: { type: string, format: date-time }
 */
router.get('/export/data', async (req, res, next) => {
  try {
    const {format = 'json', limit = 1000} = req.query;
    const {module, action, status, username, startDate, endDate} = req.query;

    const where = {};
    if (module) where.module = module;
    if (action) where.action = action;
    if (status) where.status = status;
    if (username) where.username = {[Op.like]: `%${username}%`};
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[Op.gte] = startDate;
      if (endDate) where.created_at[Op.lte] = endDate;
    }

    const maxLimit = Math.min(Number(limit), 5000);
    const rows = await OperationLog.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: maxLimit
    });

    if (format === 'csv') {
      const headers = ['时间', '操作者', '模块', '操作', '目标名称', '方法', '路径', 'IP', '状态', '状态码', '耗时ms'];
      const csvLines = [headers.join(',')];
      for (const r of rows) {
        const line = [
          (r.created_at || r.createdAt || ''),
          `"${(r.username || '').replace(/"/g, '""')}"`,
          r.module,
          r.action,
          `"${(r.target_name || '').replace(/"/g, '""')}"`,
          r.method,
          r.path,
          r.ip,
          r.status,
          r.status_code,
          r.duration
        ].join(',');
        csvLines.push(line);
      }
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="operation-logs-${Date.now()}.csv"`);
      // 加 BOM 头让 Excel 正确识别 UTF-8
      return res.send('\ufeff' + csvLines.join('\n'));
    }

    return success(res, rows, `导出 ${rows.length} 条日志`);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /operation-logs/cleanup:
 *   delete:
 *     summary: 清理指定时间之前的日志
 *     tags: [操作日志]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: beforeDate
 *         required: true
 *         schema: { type: string, format: date-time }
 *         description: 删除此时间之前的所有日志
 */
router.delete('/cleanup', async (req, res, next) => {
  try {
    const {beforeDate} = req.query;
    if (!beforeDate) return error(res, '请指定清理截止时间', 400);

    const count = await OperationLog.destroy({
      where: {created_at: {[Op.lte]: beforeDate}}
    });

    // 记录本次清理操作
    res.locals.logMeta = {
      module: 'operation_log',
      action: 'cleanup',
      target_name: `清理 ${count} 条日志（截止 ${beforeDate}）`
    };

    return success(res, {deleted: count}, `已清理 ${count} 条日志`);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /operation-logs/stats/overview:
 *   get:
 *     summary: 操作日志统计看板（趋势/模块分布/操作者 TOP）
 *     tags: [操作日志]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema: { type: integer, default: 7 }
 *         description: 统计最近 N 天数据（最大 90）
 */
router.get('/stats/overview', async (req, res, next) => {
  try {
    const days = Math.min(Number(req.query.days) || 7, 90);
    const since = new Date(Date.now() - days * 86400000);

    // 1. 每日操作趋势
    const trend = await OperationLog.findAll({
      attributes: [
        [fn('DATE', col('created_at')), 'date'],
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', literal("CASE WHEN status = 'success' THEN 1 ELSE 0 END")), 'success'],
        [fn('SUM', literal("CASE WHEN status = 'fail' THEN 1 ELSE 0 END")), 'fail']
      ],
      where: {created_at: {[Op.gte]: since}},
      group: [fn('DATE', col('created_at'))],
      order: [[fn('DATE', col('created_at')), 'ASC']],
      raw: true
    });

    // 2. 模块分布
    const moduleDist = await OperationLog.findAll({
      attributes: ['module', [fn('COUNT', col('id')), 'count']],
      where: {created_at: {[Op.gte]: since}},
      group: ['module'],
      order: [[fn('COUNT', col('id')), 'DESC']],
      raw: true
    });

    // 3. 操作类型分布
    const actionDist = await OperationLog.findAll({
      attributes: ['action', [fn('COUNT', col('id')), 'count']],
      where: {created_at: {[Op.gte]: since}},
      group: ['action'],
      order: [[fn('COUNT', col('id')), 'DESC']],
      raw: true
    });

    // 4. 高频操作者 TOP 10
    const topUsers = await OperationLog.findAll({
      attributes: ['username', [fn('COUNT', col('id')), 'count']],
      where: {
        created_at: {[Op.gte]: since},
        username: {[Op.ne]: ''}
      },
      group: ['username'],
      order: [[fn('COUNT', col('id')), 'DESC']],
      limit: 10,
      raw: true
    });

    // 5. 汇总数据
    const total = await OperationLog.count({where: {created_at: {[Op.gte]: since}}});
    const totalFail = await OperationLog.count({
      where: {created_at: {[Op.gte]: since}, status: 'fail'}
    });

    return success(res, {
      days,
      total,
      totalFail,
      failRate: total > 0 ? ((totalFail / total) * 100).toFixed(1) : 0,
      trend,
      moduleDist,
      actionDist,
      topUsers
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
