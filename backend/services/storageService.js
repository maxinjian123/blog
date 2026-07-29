const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getPureUUID } = require('../utils');
const config = require('../config');

let minioClient = null;

/**
 * 获取 MinIO 客户端（懒加载，配置变更时重建）
 */
function getMinioClient() {
  const cfg = config.upload.minio || {};
  if (!cfg.endpoint) return null;
  if (minioClient) return minioClient;

  const Minio = require('minio');
  // endpoint 仅保留主机部分（去掉协议）
  const endpoint = cfg.endpoint.replace(/^https?:\/\//, '');
  minioClient = new Minio.Client({
    endPoint: endpoint.split(':')[0],
    port: Number(cfg.port) || 9000,
    useSSL: Boolean(cfg.useSSL),
    accessKey: cfg.accessKey,
    secretKey: cfg.secretKey,
    region: cfg.region || undefined
  });
  return minioClient;
}

/**
 * 重置 MinIO 客户端（保存设置后调用）
 */
function resetMinioClient() {
  minioClient = null;
}

/**
 * 确保 MinIO 桶存在
 */
async function ensureBucket() {
  const client = getMinioClient();
  if (!client) throw new Error('MinIO 未配置');
  const bucket = config.upload.minio.bucket;
  const exists = await client.bucketExists(bucket).catch(() => false);
  if (!exists) {
    await client.makeBucket(bucket);
  }
  // 设置桶为公开只读，便于通过 URL 直接访问
  try {
    await client.setBucketPolicy(bucket, JSON.stringify({
      Version: '2012-10-17',
      Statement: [{
        Effect: 'Allow',
        Principal: '*',
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucket}/*`]
      }]
    }));
  } catch (_) { /* 已设置过或权限不足，忽略 */ }
}

/**
 * 上传文件到本地
 * @param {Buffer} buffer - 文件内容
 * @param {string} originalname - 原始文件名
 * @param {string} mimetype - MIME 类型
 * @returns {Promise<{filename, path, url}>}
 */
async function uploadToLocal(buffer, originalname, mimetype) {
  const uploadDir = path.resolve(__dirname, '..', config.upload.dir);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const ext = path.extname(originalname);
  const filename = `${getPureUUID()}${ext}`;
  const filePath = path.join(uploadDir, filename);
  fs.writeFileSync(filePath, buffer);
  return {
    filename,
    path: filename, // 相对路径
    url: `/uploads/${filename}`
  };
}

/**
 * 上传文件到 MinIO
 */
async function uploadToMinio(buffer, originalname, mimetype) {
  const client = getMinioClient();
  if (!client) throw new Error('MinIO 未启用或未配置');
  await ensureBucket();

  const ext = path.extname(originalname);
  const filename = `${getPureUUID()}${ext}`;
  const objectKey = `${filename}`;
  const bucket = config.upload.minio.bucket;

  await client.putObject(bucket, objectKey, buffer, buffer.length, {
    'Content-Type': mimetype
  });

  // 拼接公开访问 URL
  // 统一重写为 http://111.228.9.147/minio/api/<bucket>/<objectKey>
  const base = (config.upload.minio.publicBaseUrl || config.upload.minio.endpoint || '').replace(/\/$/, '');
  const baseWithoutPort = base.replace(/:\d+$/, '');
  const url = `${baseWithoutPort}/minio/api/${bucket}/${objectKey}`;

  return {
    filename,
    path: objectKey,
    url
  };
}

/**
 * 通用上传方法：根据 storage 选择上传源
 */
async function uploadFile(buffer, originalname, mimetype, storage = null) {
  const target = storage || config.upload.defaultStorage || 'local';
  if (target === 'minio') {
    if (!config.upload.minio?.enabled) {
      throw new Error('MinIO 上传源未启用');
    }
    return uploadToMinio(buffer, originalname, mimetype);
  }
  return uploadToLocal(buffer, originalname, mimetype);
}

/**
 * 删除本地文件
 * @param {string} filePath - 文件存储路径（filename 或相对路径）
 */
async function deleteLocal(filePath) {
  if (!filePath) {
    console.warn('[Storage] deleteLocal: filePath 为空，跳过删除');
    return;
  }
  const uploadDir = path.resolve(__dirname, '..', config.upload.dir || './uploads');
  const abs = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(uploadDir, filePath);
  if (fs.existsSync(abs)) {
    try {
      fs.unlinkSync(abs);
      console.log('[Storage] 本地文件已删除:', abs);
    } catch (err) {
      console.error('[Storage] 删除本地文件失败:', abs, err.message);
      throw err;
    }
  } else {
    console.warn('[Storage] 本地文件不存在，跳过删除:', abs);
  }
}

/**
 * 删除 MinIO 文件
 */
async function deleteMinio(objectKey) {
  const client = getMinioClient();
  if (!client) return;
  const bucket = config.upload.minio.bucket;
  await client.removeObject(bucket, objectKey).catch(() => { /* 忽略不存在 */ });
}

/**
 * 通用删除：根据 storage 选择删除方式
 */
async function deleteFile(storage, filePath) {
  if (storage === 'minio') {
    return deleteMinio(filePath);
  }
  return deleteLocal(filePath);
}

module.exports = {
  uploadToLocal,
  uploadToMinio,
  uploadFile,
  deleteLocal,
  deleteMinio,
  deleteFile,
  ensureBucket,
  resetMinioClient
};
