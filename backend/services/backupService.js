const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const mysql = require('mysql2/promise');
const { sequelize } = require('../models');
const config = require('../config');

/**
 * 数据备份服务
 * 备份文件固定保存在后端项目根目录下的 bakup 目录（不可更改），
 * 每个备份由 .sql 文件 + 同名 .meta.json 元数据文件组成；
 * 定时任务配置保存在 bakup/backup-schedule.json。
 */
const BACKUP_DIR = path.join(__dirname, '..', 'bakup');
const SCHEDULE_FILE = path.join(BACKUP_DIR, 'backup-schedule.json');
const TEMP_DIR = path.join(BACKUP_DIR, '.tmp');

// 备份类型
const TYPE_MANUAL = 'manual';
const TYPE_SCHEDULED = 'scheduled';
const TYPE_UPLOAD = 'upload';

// 备份文件名规则：blog-backup-YYYYMMDD-HHmmss-type-rand4.sql
const BACKUP_FILE_PATTERN = /^blog-backup-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})-(manual|scheduled|upload)-([a-f0-9]{4})\.sql$/i;

const DEFAULT_SCHEDULE = {
  enabled: false,
  frequency: 'daily',          // daily | weekly | interval
  time: '03:00',               // daily/weekly 时执行
  weekday: 1,                  // weekly 时执行（0=周日）
  interval_minutes: 60,        // interval 模式间隔
  last_run_at: null,
  next_run_at: null,
  updated_at: null
};

// 同一时间只允许一个备份/恢复/删除/上传任务，避免并发操作数据不一致
let operationLock = null;

async function ensureBackupDir() {
  await fsp.mkdir(BACKUP_DIR, { recursive: true });
  await fsp.mkdir(TEMP_DIR, { recursive: true });
}

function timestampForFilename(date = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}-${p(date.getHours())}${p(date.getMinutes())}${p(date.getSeconds())}`;
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function formatDateTime(date) {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function metaPathFor(sqlPath) {
  return `${sqlPath}.meta.json`;
}

async function readMeta(sqlPath) {
  try {
    const raw = await fsp.readFile(metaPathFor(sqlPath), 'utf8');
    const meta = JSON.parse(raw);
    if (meta && typeof meta === 'object') return meta;
  } catch {
    // 无元数据时由文件名/文件信息兜底
  }
  return null;
}

async function writeMeta(sqlPath, meta) {
  const tmp = `${metaPathFor(sqlPath)}.tmp`;
  await fsp.writeFile(tmp, JSON.stringify(meta, null, 2), 'utf8');
  await fsp.rename(tmp, metaPathFor(sqlPath));
}

async function parseFilenameMeta(fileName) {
  const m = BACKUP_FILE_PATTERN.exec(fileName);
  if (!m) return null;
  const [, y, mo, d, h, mi, s, type] = m;
  return {
    id: fileName,
    filename: fileName,
    type,
    created_at: `${y}-${mo}-${d} ${h}:${mi}:${s}`
  };
}

/**
 * 将磁盘上的备份文件组装为统一记录
 */
async function buildRecord(sqlPath) {
  const fileName = path.basename(sqlPath);
  const stat = await fsp.stat(sqlPath);
  const meta = (await readMeta(sqlPath)) || (await parseFilenameMeta(fileName)) || {};

  const record = {
    id: meta.id || fileName,
    filename: meta.filename || fileName,
    type: meta.type || TYPE_UPLOAD,
    operator: meta.operator || '',
    remark: meta.remark || '',
    size: stat.size,
    created_at: meta.created_at || formatDateTime(stat.mtime) || '',
    tables: Number(meta.tables) || 0,
    rows: Number(meta.rows) || 0,
    duration_ms: Number(meta.duration_ms) || 0,
    restored_at: meta.restored_at || null,
    restored_by: meta.restored_by || null,
    database: meta.database || config.db.database
  };
  return record;
}

/**
 * 扫描 bakup 目录下的全部备份文件，按创建时间倒序返回
 */
async function scanBackups() {
  await ensureBackupDir();
  const entries = await fsp.readdir(BACKUP_DIR, { withFileTypes: true });
  const sqlFiles = entries
    .filter((e) => e.isFile() && /\.sql(\.gz)?$/i.test(e.name))
    .map((e) => path.join(BACKUP_DIR, e.name));

  const records = [];
  for (const file of sqlFiles) {
    try {
      records.push(await buildRecord(file));
    } catch (err) {
      console.error(`[Backup] 读取备份记录失败: ${file}`, err.message);
    }
  }

  records.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  return records;
}

/**
 * 根据 id（元数据 id 或文件名）解析备份记录
 */
async function resolveBackup(id) {
  if (!id) return null;
  const safeBase = path.basename(String(id));
  const direct = path.join(BACKUP_DIR, safeBase);
  try {
    const stat = await fsp.stat(direct);
    if (stat.isFile() && /\.sql(\.gz)?$/i.test(safeBase)) {
      const record = await buildRecord(direct);
      if (record.id === id || record.filename === id) return { record, filePath: direct };
    }
  } catch {
    // 继续按元数据 id 匹配
  }

  const records = await scanBackups();
  const found = records.find((r) => r.id === id || r.filename === id);
  if (!found) return null;
  return { record: found, filePath: path.join(BACKUP_DIR, found.filename) };
}

function withOperationLock(fn) {
  if (operationLock) {
    const err = new Error('已有备份/恢复任务正在执行，请稍后再试');
    err.status = 409;
    return Promise.reject(err);
  }
  operationLock = (async () => {
    try {
      return await fn();
    } finally {
      operationLock = null;
    }
  })();
  return operationLock;
}

/**
 * 获取所有数据表（仅基础表）
 */
async function listTables() {
  const [rows] = await sequelize.query('SHOW FULL TABLES');
  const tables = [];
  for (const row of rows) {
    const values = Object.values(row);
    if (values.length === 0) continue;
    const name = values[0];
    const tableType = row.Table_type || row.TABLE_TYPE || 'BASE TABLE';
    if (String(tableType).toUpperCase() === 'VIEW') continue;
    tables.push(String(name));
  }
  return tables;
}

function escapeIdentifier(name) {
  return `\`${String(name).replace(/`/g, '``')}\``;
}

/**
 * SQL 值转义：兼容字符串、数字、日期、Buffer 以及 MySQL JSON 列（mysql2 会解析为对象/数组）
 */
function escapeValue(value) {
  if (value === null || value === undefined) return 'NULL';
  if (Buffer.isBuffer(value)) return `X'${value.toString('hex')}'`;
  if (value instanceof Date) {
    const d = value;
    return `'${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}'`;
  }
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
  if (typeof value === 'boolean') return value ? '1' : '0';
  if (typeof value === 'string') {
    return `'${value
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "''")
      .replace(/\0/g, '\\0')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\x1a/g, '\\Z')}'`;
  }
  // 对象/数组按 JSON 列处理
  let json;
  try {
    json = JSON.stringify(value);
  } catch {
    json = String(value);
  }
  return escapeValue(json);
}

/**
 * 创建数据库备份
 * @param {{type?: string, operator?: string, remark?: string}} options
 */
async function createBackup({ type = TYPE_MANUAL, operator = '', remark = '' } = {}) {
  return withOperationLock(async () => {
    await ensureBackupDir();

    const startedAt = Date.now();
    const fileName = `blog-backup-${timestampForFilename()}-${type}-${crypto.randomBytes(2).toString('hex')}.sql`;
    const filePath = path.join(BACKUP_DIR, fileName);
    const tmpPath = `${filePath}.tmp`;

    const [versionRows] = await sequelize.query('SELECT VERSION() AS version');
    const version = versionRows[0] ? versionRows[0].version : '';
    const tables = await listTables();

    let totalRows = 0;
    const out = fs.createWriteStream(tmpPath, { encoding: 'utf8' });
    let streamError = null;
    out.on('error', (err) => {
      streamError = err;
    });
    const write = (text) => new Promise((resolve, reject) => {
      if (streamError) return reject(streamError);
      out.write(text, (err) => (err ? reject(err) : resolve()));
    });

    try {
      await write(
        '-- Blog Database Backup\n' +
        `-- Host: ${config.db.host}:${config.db.port}\n` +
        `-- Database: ${config.db.database}\n` +
        `-- Server version: ${version}\n` +
        `-- Generated at: ${new Date().toISOString()}\n` +
        `-- Backup type: ${type}\n` +
        `-- Tables: ${tables.length}\n` +
        '--\n' +
        'SET NAMES utf8mb4;\n' +
        "SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';\n" +
        'SET FOREIGN_KEY_CHECKS = 0;\n\n'
      );

      for (const tableName of tables) {
        const identifier = escapeIdentifier(tableName);
        const [createRows] = await sequelize.query(`SHOW CREATE TABLE ${identifier}`);
        const createSql = createRows[0] ? (createRows[0]['Create Table'] || '') : '';
        if (!createSql) {
          console.warn(`[Backup] 跳过无法读取建表语句的表: ${tableName}`);
          continue;
        }

        await write(`DROP TABLE IF EXISTS ${identifier};\n`);
        await write(`${createSql};\n`);

        const [rows] = await sequelize.query(`SELECT * FROM ${identifier}`, { raw: true });
        if (rows.length > 0) {
          const columns = Object.keys(rows[0]);
          const columnSql = columns.map(escapeIdentifier).join(', ');
          const batchSize = 200;
          for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            const valuesSql = batch
              .map((row) => `(${columns.map((c) => escapeValue(row[c])).join(', ')})`)
              .join(',\n');
            await write(`INSERT INTO ${identifier} (${columnSql}) VALUES\n${valuesSql};\n`);
          }
          totalRows += rows.length;
        }
        await write('\n');
      }

      await write('SET FOREIGN_KEY_CHECKS = 1;\n');
      await new Promise((resolve, reject) => {
        out.end((err) => (err ? reject(err) : resolve()));
      });
      await fsp.rename(tmpPath, filePath);
    } catch (err) {
      out.destroy();
      await fsp.unlink(tmpPath).catch(() => {});
      throw err;
    }

    const stat = await fsp.stat(filePath);
    const meta = {
      id: fileName,
      filename: fileName,
      type,
      operator: operator || '',
      remark: remark || '',
      size: stat.size,
      created_at: formatDateTime(new Date()),
      tables: tables.length,
      rows: totalRows,
      duration_ms: Date.now() - startedAt,
      database: config.db.database,
      mysql_version: version
    };
    await writeMeta(filePath, meta);

    console.log(`[Backup] 备份完成: ${fileName}，${tables.length} 张表，${totalRows} 行，耗时 ${meta.duration_ms}ms`);
    return meta;
  });
}

/**
 * 删除备份文件（含元数据文件）
 */
async function deleteBackup(id) {
  return withOperationLock(async () => {
    const resolved = await resolveBackup(id);
    if (!resolved) {
      const err = new Error('备份文件不存在');
      err.status = 404;
      throw err;
    }
    await fsp.unlink(resolved.filePath);
    await fsp.unlink(metaPathFor(resolved.filePath)).catch(() => {});
    return resolved.record;
  });
}

/**
 * 保存上传的备份文件（multer diskStorage 已写入临时目录）
 * @param {{originalname: string, path: string}} file
 * @param {{operator?: string, remark?: string}} options
 */
async function storeUploadedBackup(file, { operator = '', remark = '' } = {}) {
  return withOperationLock(async () => {
    await ensureBackupDir();
    const originalName = path.basename(file.originalname || 'backup.sql')
      .replace(/[\\/:*?"<>|]/g, '_')
      .slice(0, 150);
    const finalName = `blog-backup-${timestampForFilename()}-${TYPE_UPLOAD}-${crypto.randomBytes(2).toString('hex')}-${originalName}`;
    const filePath = path.join(BACKUP_DIR, finalName);
    await fsp.rename(file.path, filePath);

    const stat = await fsp.stat(filePath);
    const meta = {
      id: finalName,
      filename: finalName,
      type: TYPE_UPLOAD,
      operator: operator || '',
      remark: remark || '',
      size: stat.size,
      created_at: formatDateTime(new Date()),
      database: config.db.database
    };
    await writeMeta(filePath, meta);
    return meta;
  });
}

/**
 * 在线恢复备份文件
 * @param {string} id 备份记录 id 或文件名
 */
async function restoreBackup(id, { operator = '' } = {}) {
  return withOperationLock(async () => {
    const resolved = await resolveBackup(id);
    if (!resolved) {
      const err = new Error('备份文件不存在');
      err.status = 404;
      throw err;
    }

    const startedAt = Date.now();
    const buffer = await fsp.readFile(resolved.filePath);
    const sql = resolved.filePath.endsWith('.gz')
      ? zlib.gunzipSync(buffer).toString('utf8')
      : buffer.toString('utf8');

    const connection = await mysql.createConnection({
      host: config.db.host,
      port: Number(config.db.port),
      user: config.db.username,
      password: config.db.password,
      database: config.db.database,
      charset: 'utf8mb4',
      multipleStatements: true,
      connectTimeout: 30000
    });

    try {
      await connection.query('SET FOREIGN_KEY_CHECKS = 0');
      await connection.query(sql);
      await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    } catch (err) {
      await connection.query('SET FOREIGN_KEY_CHECKS = 1').catch(() => {});
      throw new Error(`恢复失败: ${err.message}`);
    } finally {
      await connection.end().catch(() => {});
    }

    // 恢复完成后刷新运行时配置与缓存
    try {
      await require('./configService').loadConfigs();
    } catch (err) {
      console.error('[Backup] 恢复后刷新配置失败:', err.message);
    }
    try {
      const redis = require('../utils/redis');
      if (redis.status === 'ready') await redis.flushall();
    } catch (err) {
      console.error('[Backup] 恢复后清空缓存失败:', err.message);
    }

    // 记录恢复时间
    const meta = (await readMeta(resolved.filePath)) || {};
    meta.restored_at = new Date().toISOString();
    meta.restored_by = operator || '';
    meta.restore_duration_ms = Date.now() - startedAt;
    await writeMeta(resolved.filePath, meta);

    console.log(`[Backup] 恢复完成: ${resolved.record.filename}，耗时 ${Date.now() - startedAt}ms`);
    return { ...resolved.record, restored_at: meta.restored_at, restored_by: meta.restored_by };
  });
}

/**
 * 恢复上传的备份文件
 */
async function restoreUploadedBackup(file, { operator = '' } = {}) {
  return withOperationLock(async () => {
    await ensureBackupDir();
    const originalName = path.basename(file.originalname || 'backup.sql')
      .replace(/[\\/:*?"<>|]/g, '_')
      .slice(0, 150);
    const finalName = `blog-backup-${timestampForFilename()}-${TYPE_UPLOAD}-${crypto.randomBytes(2).toString('hex')}-${originalName}`;
    const filePath = path.join(BACKUP_DIR, finalName);
    await fsp.rename(file.path, filePath);

    try {
      const buffer = await fsp.readFile(filePath);
      const sql = filePath.endsWith('.gz')
        ? zlib.gunzipSync(buffer).toString('utf8')
        : buffer.toString('utf8');

      const connection = await mysql.createConnection({
        host: config.db.host,
        port: Number(config.db.port),
        user: config.db.username,
        password: config.db.password,
        database: config.db.database,
        charset: 'utf8mb4',
        multipleStatements: true,
        connectTimeout: 30000
      });
      try {
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        await connection.query(sql);
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
      } catch (err) {
        await connection.query('SET FOREIGN_KEY_CHECKS = 1').catch(() => {});
        throw new Error(`恢复失败: ${err.message}`);
      } finally {
        await connection.end().catch(() => {});
      }

      try {
        await require('./configService').loadConfigs();
      } catch (err) {
        console.error('[Backup] 恢复后刷新配置失败:', err.message);
      }
      try {
        const redis = require('../utils/redis');
        if (redis.status === 'ready') await redis.flushall();
      } catch (err) {
        console.error('[Backup] 恢复后清空缓存失败:', err.message);
      }

      const stat = await fsp.stat(filePath);
      const meta = {
        id: finalName,
        filename: finalName,
        type: TYPE_UPLOAD,
        operator: operator || '',
        remark: '',
        size: stat.size,
        created_at: formatDateTime(new Date()),
        restored_at: new Date().toISOString(),
        restored_by: operator || '',
        database: config.db.database
      };
      await writeMeta(filePath, meta);
      console.log(`[Backup] 上传恢复完成: ${finalName}`);
      return meta;
    } catch (err) {
      await fsp.unlink(filePath).catch(() => {});
      await fsp.unlink(metaPathFor(filePath)).catch(() => {});
      throw err;
    }
  });
}

// ==================== 定时备份配置 ====================

function normalizeSchedule(cfg = {}) {
  return {
    ...DEFAULT_SCHEDULE,
    ...cfg,
    frequency: ['daily', 'weekly', 'interval'].includes(cfg.frequency) ? cfg.frequency : DEFAULT_SCHEDULE.frequency
  };
}

async function loadScheduleConfig() {
  await ensureBackupDir();
  try {
    const raw = await fsp.readFile(SCHEDULE_FILE, 'utf8');
    return normalizeSchedule(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_SCHEDULE };
  }
}

async function saveScheduleConfig(cfg) {
  await ensureBackupDir();
  const normalized = normalizeSchedule(cfg);
  normalized.updated_at = new Date().toISOString();
  const tmp = `${SCHEDULE_FILE}.tmp`;
  await fsp.writeFile(tmp, JSON.stringify(normalized, null, 2), 'utf8');
  await fsp.rename(tmp, SCHEDULE_FILE);
  return normalized;
}

/**
 * 计算下一次执行时间
 */
function computeNextRun(cfg, from = new Date()) {
  const frequency = cfg.frequency || 'daily';
  if (frequency === 'interval') {
    const base = cfg.last_run_at ? new Date(cfg.last_run_at) : new Date(from);
    const minutes = Math.max(Number(cfg.interval_minutes) || 60, 5);
    return new Date(base.getTime() + minutes * 60 * 1000).toISOString();
  }

  const [hh, mm] = String(cfg.time || '03:00').split(':').map(Number);
  const candidate = new Date(from);
  candidate.setHours(hh || 0, mm || 0, 0, 0);

  if (frequency === 'weekly') {
    const weekday = Number(cfg.weekday) % 7;
    let diff = (weekday - candidate.getDay() + 7) % 7;
    if (diff === 0 && candidate <= from) diff = 7;
    candidate.setDate(candidate.getDate() + diff);
  } else {
    if (candidate <= from) candidate.setDate(candidate.getDate() + 1);
  }
  return candidate.toISOString();
}

/**
 * 校验并保存定时配置
 */
async function updateScheduleConfig(input = {}) {
  const current = await loadScheduleConfig();
  const next = normalizeSchedule({ ...current, ...input });

  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(next.time || ''))) {
    const err = new Error('执行时间格式应为 HH:mm');
    err.status = 400;
    throw err;
  }
  next.weekday = Number(next.weekday);
  if (Number.isNaN(next.weekday) || next.weekday < 0 || next.weekday > 6) {
    const err = new Error('星期取值应为 0-6（0=周日）');
    err.status = 400;
    throw err;
  }
  next.interval_minutes = Number(next.interval_minutes);
  if (Number.isNaN(next.interval_minutes) || next.interval_minutes < 5 || next.interval_minutes > 24 * 60) {
    const err = new Error('间隔时间应为 5-1440 分钟');
    err.status = 400;
    throw err;
  }

  if (next.enabled) {
    next.next_run_at = computeNextRun(next, new Date());
  } else {
    next.next_run_at = null;
  }
  return saveScheduleConfig(next);
}

/**
 * 定时器每分钟调用：检查是否到达下次备份时间
 */
async function checkScheduledBackup() {
  const cfg = await loadScheduleConfig();
  if (!cfg.enabled) return { ran: false, reason: 'disabled' };

  const now = new Date();
  if (!cfg.next_run_at) {
    cfg.next_run_at = computeNextRun(cfg, now);
    await saveScheduleConfig(cfg);
    return { ran: false, reason: 'next_run_computed' };
  }
  if (new Date(cfg.next_run_at) > now) {
    return { ran: false, reason: 'not_due' };
  }

  await createBackup({ type: TYPE_SCHEDULED, operator: 'scheduler', remark: '定时任务自动备份' });
  cfg.last_run_at = new Date().toISOString();
  cfg.next_run_at = computeNextRun(cfg, new Date());
  await saveScheduleConfig(cfg);
  return { ran: true };
}

/**
 * 备份统计信息（供页面顶部卡片展示）
 */
async function getBackupStats() {
  const [records, schedule] = await Promise.all([scanBackups(), loadScheduleConfig()]);
  const totalSize = records.reduce((sum, r) => sum + Number(r.size || 0), 0);
  const lastBackup = records[0] || null;
  return {
    total: records.length,
    total_size: totalSize,
    last_backup_at: lastBackup ? lastBackup.created_at : null,
    last_backup_name: lastBackup ? lastBackup.filename : null,
    schedule: schedule,
    storage_dir: BACKUP_DIR
  };
}

module.exports = {
  BACKUP_DIR,
  TYPE_MANUAL,
  TYPE_SCHEDULED,
  TYPE_UPLOAD,
  ensureBackupDir,
  createBackup,
  deleteBackup,
  restoreBackup,
  restoreUploadedBackup,
  storeUploadedBackup,
  scanBackups,
  resolveBackup,
  loadScheduleConfig,
  updateScheduleConfig,
  computeNextRun,
  checkScheduledBackup,
  getBackupStats,
  formatDateTime
};
