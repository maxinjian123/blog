const express = require('express');
const {auth, adminOnly} = require('../middleware/auth');
const {success, error} = require('../utils/response');
const {Playlist, PlaylistSong, Music} = require('../models');
const {Op} = require('sequelize');
const multer = require('multer');
const {uploadFile, deleteFile} = require('../services/storageService');
const config = require('../config');
const crypto = require('crypto');

const router = express.Router();

// 封面上传中间件
const coverUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype) || /\.(jpe?g|png|webp|gif)$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error(`不支持的图片格式: ${file.mimetype}`), false);
    }
  },
  limits: {fileSize: 10 * 1024 * 1024}
});

/**
 * 生成唯一分享码（8 位）
 */
function generateShareCode() {
  return crypto.randomBytes(4).toString('hex');
}

/**
 * @swagger
 * /playlists:
 *   get:
 *     summary: 获取歌单列表
 *     tags: [歌单管理]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 歌单列表
 */
router.get('/', auth, adminOnly, async (req, res, next) => {
  try {
    const playlists = await Playlist.findAll({
      order: [['created_at', 'DESC']],
      include: [{
        model: PlaylistSong,
        as: 'playlistSongs',
        attributes: ['id', 'music_id', 'sort_order']
      }]
    });
    // 附加歌曲数量
    const result = playlists.map(p => {
      const item = p.toJSON();
      item.song_count = item.playlistSongs?.length || 0;
      delete item.playlistSongs;
      return item;
    });
    return success(res, result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /playlists/{id}:
 *   get:
 *     summary: 获取歌单详情（含歌曲列表）
 *     tags: [歌单管理]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 歌单详情
 */
router.get('/:id', auth, adminOnly, async (req, res, next) => {
  try {
    const playlist = await Playlist.findByPk(req.params.id, {
      include: [{
        model: PlaylistSong,
        as: 'playlistSongs',
        include: [{
          model: Music,
          as: 'music',
          attributes: ['id', 'name', 'singer', 'album', 'cover', 'play_url', 'duration', 'origin_platform']
        }]
      }],
      order: [
        [{model: PlaylistSong, as: 'playlistSongs'}, 'sort_order', 'ASC']
      ]
    });
    if (!playlist) {
      return error(res, '歌单不存在', 404);
    }
    // 扁平化输出：将 playlistSongs 映射为 songs，便于前端直接使用
    const result = playlist.toJSON();
    result.songs = (result.playlistSongs || []).map(item => ({
      id: item.id,
      playlist_id: item.playlist_id,
      music_id: item.music_id,
      sort_order: item.sort_order,
      music: item.music
    }));
    delete result.playlistSongs;
    return success(res, result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /playlists:
 *   post:
 *     summary: 创建歌单
 *     tags: [歌单管理]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               cover: { type: string }
 *     responses:
 *       200:
 *         description: 创建成功
 */
router.post('/', auth, adminOnly, async (req, res, next) => {
  try {
    const {name, description, cover} = req.body;
    if (!name || !name.trim()) {
      return error(res, '歌单名称不能为空', 400);
    }
    // 生成唯一分享码
    let shareCode = generateShareCode();
    const existing = await Playlist.findOne({where: {share_code: shareCode}, attributes: ['id']});
    if (existing) shareCode = generateShareCode() + Date.now().toString(36);

    const playlist = await Playlist.create({
      name: name.slice(0, 200),
      description: (description || '').slice(0, 500),
      cover: cover || '',
      is_public: true,
      share_code: shareCode
    });
    return success(res, playlist, '歌单创建成功', 201);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /playlists/{id}:
 *   put:
 *     summary: 更新歌单信息
 *     tags: [歌单管理]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               cover: { type: string }
 *               is_public: { type: boolean }
 *     responses:
 *       200:
 *         description: 更新成功
 */
router.put('/:id', auth, adminOnly, async (req, res, next) => {
  try {
    const playlist = await Playlist.findByPk(req.params.id);
    if (!playlist) {
      return error(res, '歌单不存在', 404);
    }
    const {name, description, cover, is_public} = req.body;
    if (name !== undefined) playlist.name = name.slice(0, 200);
    if (description !== undefined) playlist.description = description.slice(0, 500);
    if (cover !== undefined) playlist.cover = cover.slice(0, 500);
    if (is_public !== undefined) playlist.is_public = is_public;
    await playlist.save();
    return success(res, playlist, '更新成功');
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /playlists/{id}:
 *   delete:
 *     summary: 删除歌单（同时删除关联）
 *     tags: [歌单管理]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 删除成功
 */
router.delete('/:id', auth, adminOnly, async (req, res, next) => {
  try {
    const playlist = await Playlist.findByPk(req.params.id);
    if (!playlist) {
      return error(res, '歌单不存在', 404);
    }
    // 删除关联的歌曲关系
    await PlaylistSong.destroy({where: {playlist_id: playlist.id}});
    await playlist.destroy();
    return success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /playlists/{id}/cover:
 *   post:
 *     summary: 上传歌单封面
 *     tags: [歌单管理]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               cover:
 *                 type: string
 *                 format: binary
 *               storage:
 *                 type: string
 *                 enum: [local, minio]
 *     responses:
 *       200:
 *         description: 封面上传成功
 */
router.post('/:id/cover', auth, adminOnly, (req, res, next) => {
  coverUpload.single('cover')(req, res, (err) => {
    if (err) return error(res, err.message, 400);
    next();
  });
}, async (req, res, next) => {
  try {
    const playlist = await Playlist.findByPk(req.params.id);
    if (!playlist) {
      return error(res, '歌单不存在', 404);
    }
    if (!req.file) {
      return error(res, '请选择封面图片', 400);
    }
    const storageParam = req.body.storage;
    const storage = storageParam === 'minio' ? 'minio' : (storageParam === 'local' ? 'local' : (config.upload.defaultStorage || 'local'));

    let originalname = req.file.originalname;
    if (!/[\u4e00-\u9fa5]/.test(originalname)) {
      try { originalname = Buffer.from(originalname, 'latin1').toString('utf8'); } catch (_) {}
    }

    const result = await uploadFile(req.file.buffer, originalname, req.file.mimetype, storage);

    // 删除旧封面
    if (playlist.cover && playlist.cover.startsWith('/uploads/')) {
      try { await deleteFile('local', playlist.cover.replace(/^\/uploads\//, '')); } catch (_) {}
    }

    playlist.cover = result.url;
    await playlist.save();

    return success(res, {cover: result.url}, '封面上传成功');
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /playlists/{id}/songs:
 *   post:
 *     summary: 批量添加歌曲到歌单
 *     tags: [歌单管理]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               music_ids:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       200:
 *         description: 添加成功
 */
router.post('/:id/songs', auth, adminOnly, async (req, res, next) => {
  try {
    const playlist = await Playlist.findByPk(req.params.id);
    if (!playlist) {
      return error(res, '歌单不存在', 404);
    }
    const {music_ids} = req.body;
    if (!Array.isArray(music_ids) || music_ids.length === 0) {
      return error(res, '请提供歌曲 ID 列表', 400);
    }

    // 查询已存在的关联，避免重复
    const existing = await PlaylistSong.findAll({
      where: {playlist_id: playlist.id, music_id: {[Op.in]: music_ids}},
      attributes: ['music_id']
    });
    const existingIds = new Set(existing.map(e => e.music_id));

    // 查询当前最大 sort_order
    const maxOrder = await PlaylistSong.max('sort_order', {where: {playlist_id: playlist.id}}) || 0;

    const toAdd = [];
    let order = maxOrder + 1;
    for (const musicId of music_ids) {
      if (!existingIds.has(musicId)) {
        // 验证音乐是否存在
        const music = await Music.findByPk(musicId, {attributes: ['id']});
        if (music) {
          toAdd.push({
            playlist_id: playlist.id,
            music_id: musicId,
            sort_order: order++
          });
        }
      }
    }

    if (toAdd.length > 0) {
      await PlaylistSong.bulkCreate(toAdd);
    }

    return success(res, {
      added: toAdd.length,
      skipped: music_ids.length - toAdd.length
    }, `成功添加 ${toAdd.length} 首${music_ids.length - toAdd.length > 0 ? `，跳过 ${music_ids.length - toAdd.length} 首已存在` : ''}`);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /playlists/{id}/songs/{songId}:
 *   delete:
 *     summary: 从歌单移除歌曲
 *     tags: [歌单管理]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: songId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 移除成功
 */
router.delete('/:id/songs/:songId', auth, adminOnly, async (req, res, next) => {
  try {
    const result = await PlaylistSong.destroy({
      where: {playlist_id: req.params.id, id: req.params.songId}
    });
    if (result === 0) {
      return error(res, '记录不存在', 404);
    }
    return success(res, null, '移除成功');
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /playlists/{id}/songs/{songId}/sort:
 *   put:
 *     summary: 更新歌单内歌曲排序
 *     tags: [歌单管理]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: songId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sort_order: { type: integer }
 *     responses:
 *       200:
 *         description: 更新成功
 */
router.put('/:id/songs/:songId/sort', auth, adminOnly, async (req, res, next) => {
  try {
    const item = await PlaylistSong.findOne({
      where: {playlist_id: req.params.id, id: req.params.songId}
    });
    if (!item) {
      return error(res, '记录不存在', 404);
    }
    const {sort_order} = req.body;
    item.sort_order = sort_order;
    await item.save();
    return success(res, item, '排序更新成功');
  } catch (err) {
    next(err);
  }
});

// ============ 公开访问接口（无需登录） ============

/**
 * @swagger
 * /playlists/public/{shareCode}:
 *   get:
 *     summary: 公开访问歌单（游客可访问）
 *     tags: [歌单管理]
 *     parameters:
 *       - in: path
 *         name: shareCode
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 歌单详情
 */
router.get('/public/:shareCode', async (req, res, next) => {
  try {
    const playlist = await Playlist.findOne({
      where: {share_code: req.params.shareCode, is_public: true},
      attributes: ['id', 'name', 'description', 'cover', 'share_code', 'play_count', 'created_at']
    });
    if (!playlist) {
      return error(res, '歌单不存在或未公开', 404);
    }

    // 获取歌单内歌曲（仅返回已启用的）
    const songs = await PlaylistSong.findAll({
      where: {playlist_id: playlist.id},
      include: [{
        model: Music,
        as: 'music',
        where: {is_active: true},
        attributes: ['id', 'name', 'singer', 'album', 'cover', 'play_url', 'duration', 'origin_platform'],
        required: true
      }],
      order: [['sort_order', 'ASC']]
    });

    // 增加播放次数
    playlist.play_count = (playlist.play_count || 0) + 1;
    await playlist.save();

    const result = playlist.toJSON();
    result.songs = songs.map(s => s.music);
    return success(res, result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
