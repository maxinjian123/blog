const express = require('express');
const {auth, adminOnly} = require('../middleware/auth');
const {success, error, paginated} = require('../utils/response');
const {Music, MediaFile, PlaylistSong} = require('../models');
const {Op} = require('sequelize');
const musicCrawler = require('../services/musicCrawler');
const {uploadFile, deleteFile} = require('../services/storageService');
const config = require('../config');
const multer = require('multer');

const router = express.Router();

// 音乐文件专用上传中间件（内存存储，支持音频格式）
const audioUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    // 音频文件
    const audioAllowed = ['audio/mpeg', 'audio/mp3', 'audio/m4a', 'audio/x-m4a', 'audio/aac',
      'audio/ogg', 'audio/wav', 'audio/x-wav', 'audio/flac', 'audio/x-flac'];
    // 封面图片
    const imageAllowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    // 歌词文件
    const isLrc = file.fieldname === 'lyric' || /\.lrc$/i.test(file.originalname) || file.mimetype === 'text/plain';

    if (audioAllowed.includes(file.mimetype) || /\.(mp3|m4a|aac|ogg|wav|flac)$/i.test(file.originalname)) {
      cb(null, true);
    } else if (imageAllowed.includes(file.mimetype) || /\.(jpe?g|png|webp|gif)$/i.test(file.originalname)) {
      cb(null, true);
    } else if (isLrc) {
      cb(null, true);
    } else {
      cb(new Error(`不支持的文件格式: ${file.mimetype} (${file.fieldname})`), false);
    }
  },
  limits: {fileSize: 50 * 1024 * 1024} // 50MB
});

/**
 * 管理端歌词接口（需登录管理员）
 */
/**
 * @swagger
 * /music/lyric/{id}:
 *   get:
 *     summary: 获取歌曲歌词（LRC 格式，QQ 平台失败回退网易云）
 *     tags: [音乐爬虫]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: LRC 歌词
 */
router.get('/lyric/:id', auth, adminOnly, async (req, res, next) => {
  try {
    const music = await Music.findByPk(req.params.id);
    if (!music) {
      return error(res, '歌曲不存在', 404);
    }
    // 手动上传的歌曲：直接返回数据库中的 lyric 字段
    if (music.origin_platform === 'upload' || music.lyric) {
      return success(res, {
        lrc: music.lyric || '',
        has_lyric: !!music.lyric
      });
    }
    const platform = music.origin_platform || 'netease';
    const result = await musicCrawler.getLyric(
      music.song_id,
      {name: music.name, singer: music.singer},
      platform
    );
    // 缓存歌词到数据库，避免重复请求
    if (result.has_lyric && result.lrc) {
      music.lyric = result.lrc;
      await music.save();
    }
    return success(res, result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /music/platforms:
 *   get:
 *     summary: 获取支持的音乐平台列表
 *     tags: [音乐爬虫]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 平台列表
 */
router.get('/platforms', auth, adminOnly, (req, res) => {
  return success(res, musicCrawler.listAllPlatforms());
});

/**
 * @swagger
 * /music/search-songs:
 *   get:
 *     summary: 搜索音乐歌曲（支持网易云/QQ音乐）
 *     tags: [音乐爬虫]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: keyword
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: platform
 *         schema: { type: string, enum: [netease, qq], default: netease }
 *     responses:
 *       200:
 *         description: 歌曲搜索结果
 */
router.get('/search-songs', auth, adminOnly, async (req, res, next) => {
  try {
    const {keyword, page = 1, pageSize = 20, platform} = req.query;
    if (!keyword || !keyword.trim()) {
      return error(res, '请输入搜索关键词', 400);
    }
    const result = await musicCrawler.searchSongs(keyword, Number(page), Number(pageSize), platform);
    return success(res, result, `共找到 ${result.total} 首歌曲`);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /music/playlist/{dissTid}:
 *   get:
 *     summary: 获取歌单详情（歌曲列表，支持网易云/QQ音乐）
 *     tags: [音乐爬虫]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dissTid
 *         required: true
 *         schema: { type: string }
 *         description: 歌单 ID 或歌单链接
 *       - in: query
 *         name: platform
 *         schema: { type: string, enum: [netease, qq], default: netease }
 *     responses:
 *       200:
 *         description: 歌单歌曲列表
 */
router.get('/playlist/:dissTid', auth, adminOnly, async (req, res, next) => {
  try {
    const {platform} = req.query;
    const dissTid = musicCrawler.parsePlaylistId(req.params.dissTid, platform);
    if (!dissTid) {
      return error(res, '歌单 ID 无效，请输入纯数字 ID 或歌单链接', 400);
    }
    const result = await musicCrawler.getPlaylistDetail(dissTid, platform);
    return success(res, result, `共 ${result.songs.length} 首歌曲`);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /music/song-url/{songMid}:
 *   get:
 *     summary: 获取歌曲播放链接（VIP 歌曲可能无法获取，QQ 平台会自动回退网易云）
 *     tags: [音乐爬虫]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: songMid
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: platform
 *         schema: { type: string, enum: [netease, qq], default: netease }
 *     responses:
 *       200:
 *         description: 播放链接
 */
router.get('/song-url/:songMid', auth, adminOnly, async (req, res, next) => {
  try {
    const {songMid} = req.params;
    const {name, singer, platform} = req.query;
    if (!songMid) {
      return error(res, '歌曲 ID 缺失', 400);
    }
    const result = await musicCrawler.getSongUrl(songMid, name ? {name, singer} : undefined, platform);
    return success(res, result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /music/import:
 *   post:
 *     summary: 批量导入歌曲到音乐库
 *     tags: [音乐爬虫]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               songs:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     song_mid: { type: string }
 *                     name: { type: string }
 *                     singer: { type: string }
 *                     album_name: { type: string }
 *                     cover: { type: string }
 *                     duration: { type: integer }
 *               playlist_name: { type: string }
 *               fetchUrl: { type: boolean, default: false }
 *               platform: { type: string, enum: [netease, qq], default: netease }
 *     responses:
 *       200:
 *         description: 导入结果
 */
router.post('/import', auth, adminOnly, async (req, res, next) => {
  try {
    const {songs, playlist_name = '', fetchUrl = false, platform} = req.body;
    if (!Array.isArray(songs) || songs.length === 0) {
      return error(res, '请提供歌曲列表', 400);
    }
    if (songs.length > 100) {
      return error(res, '单次最多导入 100 首歌曲', 400);
    }

    const imported = [];
    const skipped = [];

    for (let i = 0; i < songs.length; i++) {
      const song = songs[i];
      try {
        // 跳过已存在的歌曲
        const existing = await Music.findOne({
          where: {song_id: song.song_mid},
          attributes: ['id']
        });
        if (existing) {
          skipped.push({name: song.name, reason: '已存在'});
          continue;
        }

        // 可选：实时获取播放链接
        let playUrl = '';
        if (fetchUrl) {
          try {
            const urlResult = await musicCrawler.getSongUrl(song.song_mid, {name: song.name, singer: song.singer}, platform);
            playUrl = urlResult.url || '';
          } catch {
            // 获取链接失败不阻塞导入
          }
        }

        const music = await Music.create({
          song_id: song.song_mid,
          name: (song.name || '').slice(0, 200),
          singer: (song.singer || '').slice(0, 200),
          album: (song.album_name || '').slice(0, 200),
          cover: song.cover || '',
          play_url: playUrl,
          duration: song.duration || 0,
          source: 'qq',
          origin_platform: platform || 'netease',
          playlist_name: (playlist_name || '').slice(0, 200),
          sort_order: i
        });

        imported.push({
          id: music.id,
          name: music.name,
          singer: music.singer,
          has_url: !!playUrl
        });
      } catch (err) {
        skipped.push({name: song.name, reason: err.message});
      }
    }

    return success(res, {
      imported: imported.length,
      skipped: skipped.length,
      imported_list: imported,
      skipped_list: skipped
    }, `成功导入 ${imported.length} 首，跳过 ${skipped.length} 首`);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /music/refresh-url/{id}:
 *   put:
 *     summary: 刷新单首歌曲的播放链接（链接有时效性）
 *     tags: [音乐爬虫]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 刷新后的播放链接
 */
router.put('/refresh-url/:id', auth, adminOnly, async (req, res, next) => {
  try {
    const music = await Music.findByPk(req.params.id);
    if (!music) {
      return error(res, '歌曲不存在', 404);
    }
    // 根据歌曲原始来源平台调用对应平台接口刷新链接
    const platform = music.origin_platform || 'netease';
    const result = await musicCrawler.getSongUrl(music.song_id, {name: music.name, singer: music.singer}, platform);
    if (!result.url) {
      return error(res, '获取播放链接失败（VIP 歌曲或版权限制）', 400);
    }
    music.play_url = result.url;
    await music.save();
    const platformLabel = platform === 'qq' ? 'QQ音乐' : platform === 'upload' ? '本地' : '网易云音乐';
    const msg = result.fallback
      ? `播放链接已刷新（QQ音乐无可用链接，已回退网易云）`
      : `播放链接已刷新（来源：${platformLabel}）`;
    return success(res, {play_url: result.url, source: result.source, fallback: result.fallback || false}, msg);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /music:
 *   get:
 *     summary: 获取音乐库列表（分页）
 *     tags: [音乐爬虫]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: keyword
 *         schema: { type: string }
 *       - in: query
 *         name: is_active
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: 音乐列表
 */
router.get('/', auth, adminOnly, async (req, res, next) => {
  try {
    const {page = 1, pageSize = 20, keyword, is_active} = req.query;
    const where = {};
    if (keyword) {
      where[Op.or] = [
        {name: {[Op.like]: `%${keyword}%`}},
        {singer: {[Op.like]: `%${keyword}%`}},
        {album: {[Op.like]: `%${keyword}%`}}
      ];
    }
    if (is_active !== undefined) {
      where.is_active = is_active === 'true';
    }

    const {count, rows} = await Music.findAndCountAll({
      where,
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']],
      offset: (Number(page) - 1) * Number(pageSize),
      limit: Number(pageSize)
    });

    return paginated(res, {list: rows, total: count, page: Number(page), pageSize: Number(pageSize)});
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /music/{id}:
 *   put:
 *     summary: 更新音乐信息
 *     tags: [音乐爬虫]
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
 *               singer: { type: string }
 *               album: { type: string }
 *               cover: { type: string }
 *               play_url: { type: string }
 *               sort_order: { type: integer }
 *               is_active: { type: boolean }
 *     responses:
 *       200:
 *         description: 更新成功
 */
router.put('/:id', auth, adminOnly, async (req, res, next) => {
  try {
    const music = await Music.findByPk(req.params.id);
    if (!music) {
      return error(res, '歌曲不存在', 404);
    }
    const {name, singer, album, cover, play_url, sort_order, is_active} = req.body;
    if (name !== undefined) music.name = name.slice(0, 200);
    if (singer !== undefined) music.singer = singer.slice(0, 200);
    if (album !== undefined) music.album = album.slice(0, 200);
    if (cover !== undefined) music.cover = cover.slice(0, 500);
    if (play_url !== undefined) music.play_url = play_url.slice(0, 500);
    if (sort_order !== undefined) music.sort_order = sort_order;
    if (is_active !== undefined) music.is_active = is_active;
    await music.save();
    return success(res, music, '更新成功');
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /music/{id}:
 *   delete:
 *     summary: 删除音乐
 *     tags: [音乐爬虫]
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
    const music = await Music.findByPk(req.params.id);
    if (!music) {
      return error(res, '歌曲不存在', 404);
    }
    // 先删除歌单关联，避免 playlist_songs 残留孤立记录
    await PlaylistSong.destroy({where: {music_id: music.id}});
    await music.destroy();
    return success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /music/{id}/cover:
 *   post:
 *     summary: 上传音乐封面图片
 *     tags: [音乐爬虫]
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
  audioUpload.single('cover')(req, res, (err) => {
    if (err) return error(res, err.message, 400);
    next();
  });
}, async (req, res, next) => {
  try {
    const music = await Music.findByPk(req.params.id);
    if (!music) {
      return error(res, '歌曲不存在', 404);
    }
    if (!req.file) {
      return error(res, '请选择封面图片', 400);
    }
    const storageParam = req.body.storage;
    const storage = storageParam === 'minio' ? 'minio' : (storageParam === 'local' ? 'local' : (config.upload.defaultStorage || 'local'));
    if (storage === 'minio' && !config.upload.minio?.enabled) {
      return error(res, 'MinIO 上传源未启用', 400);
    }

    // 修复中文文件名
    let originalname = req.file.originalname;
    if (!/[\u4e00-\u9fa5]/.test(originalname)) {
      try { originalname = Buffer.from(originalname, 'latin1').toString('utf8'); } catch (_) {}
    }

    const result = await uploadFile(req.file.buffer, originalname, req.file.mimetype, storage);

    // 删除旧封面（如果是本地/MinIO 存储的）
    if (music.cover && music.cover.startsWith('/uploads/')) {
      const oldPath = music.cover.replace(/^\/uploads\//, '');
      try { await deleteFile('local', oldPath); } catch (_) {}
    }

    music.cover = result.url;
    await music.save();

    return success(res, {cover: result.url}, '封面上传成功');
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /music/{id}/lyric:
 *   post:
 *     summary: 重新上传歌词文件（.lrc）
 *     tags: [音乐爬虫]
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
 *               lyric:
 *                 type: string
 *                 format: binary
 *                 description: LRC 歌词文件
 *     responses:
 *       200:
 *         description: 歌词上传成功
 */
router.post('/:id/lyric', auth, adminOnly, (req, res, next) => {
  audioUpload.single('lyric')(req, res, (err) => {
    if (err) return error(res, err.message, 400);
    next();
  });
}, async (req, res, next) => {
  try {
    const music = await Music.findByPk(req.params.id);
    if (!music) {
      return error(res, '歌曲不存在', 404);
    }
    if (!req.file) {
      return error(res, '请选择歌词文件', 400);
    }
    const lyricText = req.file.buffer.toString('utf8');
    music.lyric = lyricText || null;
    await music.save();
    return success(res, {
      lyric: lyricText,
      has_lyric: !!lyricText
    }, '歌词上传成功');
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /music/{id}/migrate-storage:
 *   post:
 *     summary: 迁移音乐文件存储位置（local ↔ minio 互转，迁移后删除原文件）
 *     tags: [音乐爬虫]
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
 *               target_storage:
 *                 type: string
 *                 enum: [local, minio]
 *     responses:
 *       200:
 *         description: 迁移成功
 */
router.post('/:id/migrate-storage', auth, adminOnly, async (req, res, next) => {
  try {
    const music = await Music.findByPk(req.params.id);
    if (!music) {
      return error(res, '歌曲不存在', 404);
    }
    const {target_storage} = req.body;
    if (!['local', 'minio'].includes(target_storage)) {
      return error(res, '目标存储位置无效', 400);
    }
    // 当前存储位置
    const currentStorage = music.source === 'qq' ? 'local' : music.source;
    if (currentStorage === target_storage) {
      return error(res, '当前已在目标存储位置，无需迁移', 400);
    }
    if (target_storage === 'minio' && !config.upload.minio?.enabled) {
      return error(res, 'MinIO 上传源未启用', 400);
    }

    // 仅支持本地/MinIO 存储的音乐迁移，外链音乐不可迁移
    if (!music.play_url || (!music.play_url.startsWith('/uploads/') && !music.play_url.includes('/minio/api/'))) {
      return error(res, '当前音乐为外链播放，无法迁移存储位置', 400);
    }

    // 1. 下载原文件
    const axios = require('axios');
    const fs = require('fs');
    const path = require('path');
    let buffer;
    let originalname = `${music.name || 'music'}.mp3`;

    if (currentStorage === 'local') {
      // 本地文件直接读取
      const filename = music.play_url.replace(/^\/uploads\//, '');
      const localPath = path.resolve(__dirname, '..', config.upload.dir, filename);
      if (!fs.existsSync(localPath)) {
        return error(res, '本地源文件不存在，无法迁移', 400);
      }
      buffer = fs.readFileSync(localPath);
      // 从 MediaFile 查找原始文件名
      const media = await MediaFile.findOne({where: {url: music.play_url}});
      if (media?.original_name) originalname = media.original_name;
    } else {
      // MinIO 文件通过 URL 下载
      const downloadRes = await axios.get(music.play_url, {
        responseType: 'arraybuffer',
        timeout: 30000,
        maxRedirects: 5
      });
      buffer = Buffer.from(downloadRes.data);
      const media = await MediaFile.findOne({where: {url: music.play_url}});
      if (media?.original_name) originalname = media.original_name;
    }

    // 2. 上传到目标存储
    const contentType = music.play_url.endsWith('.m4a') ? 'audio/m4a' : 'audio/mpeg';
    const result = await uploadFile(buffer, originalname, contentType, target_storage);

    // 3. 删除原文件
    if (currentStorage === 'local') {
      const filename = music.play_url.replace(/^\/uploads\//, '');
      try { await deleteFile('local', filename); } catch (_) {}
    } else {
      // MinIO：从 path 提取 objectKey
      const media = await MediaFile.findOne({where: {url: music.play_url}});
      if (media?.path) {
        try { await deleteFile('minio', media.path); } catch (_) {}
      }
    }

    // 4. 更新数据库
    const oldUrl = music.play_url;
    music.play_url = result.url;
    music.source = target_storage;
    await music.save();

    // 更新 MediaFile 记录
    await MediaFile.create({
      id: require('uuid').v4(),
      filename: result.filename,
      original_name: originalname,
      mime_type: contentType,
      size: buffer.length,
      storage: target_storage,
      url: result.url,
      path: result.path
    });
    // 删除旧 MediaFile 记录
    await MediaFile.destroy({where: {url: oldUrl}});

    return success(res, {
      play_url: result.url,
      source: target_storage
    }, `已迁移到${target_storage === 'minio' ? 'MinIO' : '本地'}存储`);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /music/upload:
 *   post:
 *     summary: 手动上传音乐文件到音乐库（支持封面和歌词）
 *     tags: [音乐爬虫]
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
 *                 description: 音频文件（必填）
 *               cover:
 *                 type: string
 *                 format: binary
 *                 description: 封面图片（可选）
 *               lyric:
 *                 type: string
 *                 format: binary
 *                 description: LRC 歌词文件（可选）
 *               name:
 *                 type: string
 *               singer:
 *                 type: string
 *               album:
 *                 type: string
 *               storage:
 *                 type: string
 *                 enum: [local, minio]
 *     responses:
 *       200:
 *         description: 上传成功
 */
router.post('/upload', auth, adminOnly, (req, res, next) => {
  audioUpload.fields([
    {name: 'file', maxCount: 1},
    {name: 'cover', maxCount: 1},
    {name: 'lyric', maxCount: 1}
  ])(req, res, (err) => {
    if (err) return error(res, err.message, 400);
    next();
  });
}, async (req, res, next) => {
  try {
    const files = req.files || {};
    const audioFile = files.file?.[0];
    const coverFile = files.cover?.[0];
    const lyricFile = files.lyric?.[0];

    if (!audioFile) {
      return error(res, '请选择音乐文件', 400);
    }

    const {name, singer, album, duration, storage: storageParam} = req.body;
    const storage = storageParam === 'minio' ? 'minio' : (storageParam === 'local' ? 'local' : (config.upload.defaultStorage || 'local'));

    if (storage === 'minio' && !config.upload.minio?.enabled) {
      return error(res, 'MinIO 上传源未启用，请先在设置中开启', 400);
    }

    // 修复中文文件名编码
    let originalname = audioFile.originalname;
    if (!/[\u4e00-\u9fa5]/.test(originalname)) {
      try { originalname = Buffer.from(originalname, 'latin1').toString('utf8'); } catch (_) {}
    }

    // 上传音频到存储服务
    const result = await uploadFile(audioFile.buffer, originalname, audioFile.mimetype, storage);

    // 上传封面（可选）
    let coverUrl = '';
    if (coverFile) {
      try {
        let coverName = coverFile.originalname;
        if (!/[\u4e00-\u9fa5]/.test(coverName)) {
          try { coverName = Buffer.from(coverName, 'latin1').toString('utf8'); } catch (_) {}
        }
        const coverResult = await uploadFile(coverFile.buffer, coverName, coverFile.mimetype, storage);
        coverUrl = coverResult.url;
      } catch {
        // 封面上传失败不阻塞音乐上传
      }
    }

    // 读取歌词文件（可选）
    let lyricText = '';
    if (lyricFile) {
      try {
        lyricText = lyricFile.buffer.toString('utf8');
      } catch {
        // 歌词读取失败不阻塞
      }
    }

    // 从文件名提取歌曲名（去掉扩展名）
    const songName = (name || originalname).replace(/\.[^.]+$/, '');

    // 创建音乐记录
    const music = await Music.create({
      song_id: `upload_${Date.now()}`,
      name: songName.slice(0, 200),
      singer: (singer || '未知歌手').slice(0, 200),
      album: (album || '').slice(0, 200),
      cover: coverUrl,
      play_url: result.url,
      duration: Number(duration) || 0,
      source: storage,
      origin_platform: 'upload',
      playlist_name: '手动上传',
      sort_order: 0,
      is_active: true,
      lyric: lyricText || null
    });

    // 同步记录到媒体库
    await MediaFile.create({
      id: require('uuid').v4(),
      filename: result.filename,
      original_name: originalname,
      mime_type: audioFile.mimetype,
      size: audioFile.size,
      storage,
      url: result.url,
      path: result.path
    });

    return success(res, {
      id: music.id,
      name: music.name,
      singer: music.singer,
      url: result.url,
      cover: coverUrl,
      has_lyric: !!lyricText,
      storage
    }, '音乐上传成功', 201);
  } catch (err) {
    next(err);
  }
});

/**
 * 从媒体库已有文件创建音乐记录（不重新上传文件，直接引用媒体库 URL）
 */
router.post('/upload-from-media', auth, adminOnly, async (req, res, next) => {
  try {
    const { media_id, name, singer, album, cover, lyric, duration } = req.body;
    if (!media_id) {
      return error(res, '请选择媒体库文件', 400);
    }

    const mediaFile = await MediaFile.findByPk(media_id);
    if (!mediaFile) {
      return error(res, '媒体库文件不存在', 404);
    }

    // 仅允许音频类型
    if (!mediaFile.mime_type || !mediaFile.mime_type.startsWith('audio/')) {
      return error(res, '只能选择音频类型的文件', 400);
    }

    const songName = (name || mediaFile.original_name).replace(/\.[^.]+$/, '');

    const music = await Music.create({
      song_id: `upload_${Date.now()}`,
      name: (songName || '未知歌曲').slice(0, 200),
      singer: (singer || '未知歌手').slice(0, 200),
      album: (album || '').slice(0, 200),
      cover: (cover || '').slice(0, 500),
      play_url: mediaFile.url,
      duration: Number(duration) || 0,
      source: mediaFile.storage,
      origin_platform: 'upload',
      playlist_name: '手动上传',
      sort_order: 0,
      is_active: true,
      lyric: lyric || null
    });

    return success(res, {
      id: music.id,
      name: music.name,
      singer: music.singer,
      url: mediaFile.url,
      storage: mediaFile.storage
    }, '音乐创建成功', 201);
  } catch (err) {
    next(err);
  }
});

/**
 * 通过外部播放 URL 创建音乐（不下载文件，直接引用外链）
 * 适用场景：用户已有音频直链（如自己的 CDN、第三方托管链接），无需上传文件
 */
router.post('/upload-from-url', auth, adminOnly, async (req, res, next) => {
  try {
    const { play_url, name, singer, album, cover, lyric, duration } = req.body;

    if (!play_url || !/^https?:\/\//i.test(String(play_url).trim())) {
      return error(res, '请提供有效的音频播放 URL（http/https）', 400);
    }
    if (!name || !String(name).trim()) {
      return error(res, '请填写歌曲名', 400);
    }

    const music = await Music.create({
      song_id: `url_${Date.now()}`,
      name: String(name).trim().slice(0, 200),
      singer: (singer || '未知歌手').slice(0, 200),
      album: (album || '').slice(0, 200),
      cover: (cover || '').slice(0, 500),
      play_url: String(play_url).trim(),
      duration: Number(duration) || 0,
      // external 表示外链引用，不占用本地/MinIO 存储空间
      source: 'external',
      origin_platform: 'upload',
      playlist_name: '外链导入',
      sort_order: 0,
      is_active: true,
      lyric: lyric || null
    });

    return success(res, {
      id: music.id,
      name: music.name,
      singer: music.singer,
      url: music.play_url,
      storage: music.source
    }, '音乐创建成功', 201);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /music/save-remote:
 *   post:
 *     summary: 将搜索到的音乐保存到服务器并添加到音乐库
 *     tags: [音乐爬虫]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               song_mid:
 *                 type: string
 *               name:
 *                 type: string
 *               singer:
 *                 type: string
 *               album_name:
 *                 type: string
 *               cover:
 *                 type: string
 *               duration:
 *                 type: integer
 *               storage:
 *                 type: string
 *                 enum: [local, minio]
 *     responses:
 *       200:
 *         description: 保存成功
 */
router.post('/save-remote', auth, adminOnly, async (req, res, next) => {
  try {
    const {song_mid, name, singer, album_name, cover, duration, storage: storageParam, playlist_name, platform} = req.body;
    if (!song_mid || !name) {
      return error(res, '歌曲信息不完整', 400);
    }

    const storage = storageParam === 'minio' ? 'minio' : (storageParam === 'local' ? 'local' : (config.upload.defaultStorage || 'local'));
    if (storage === 'minio' && !config.upload.minio?.enabled) {
      return error(res, 'MinIO 上传源未启用，请先在设置中开启', 400);
    }

    // 检查是否已存在
    const existing = await Music.findOne({where: {song_id: song_mid}, attributes: ['id']});
    if (existing) {
      return error(res, '该歌曲已在音乐库中', 400);
    }

    // 获取播放链接（按平台分发，QQ 平台 VIP 自动回退网易云）
    const urlResult = await musicCrawler.getSongUrl(song_mid, {name, singer}, platform);
    if (!urlResult.url) {
      return error(res, '无法获取播放链接（VIP 歌曲或版权限制），保存失败', 400);
    }

    // 下载音频文件
    const axios = require('axios');
    const audioRes = await axios.get(urlResult.url, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {'User-Agent': 'Mozilla/5.0'},
      maxRedirects: 5
    });

    const buffer = Buffer.from(audioRes.data);
    const contentType = audioRes.headers['content-type'] || 'audio/mpeg';
    // 根据 content-type 推断扩展名
    const extMap = {
      'audio/mpeg': '.mp3', 'audio/mp3': '.mp3',
      'audio/m4a': '.m4a', 'audio/x-m4a': '.m4a',
      'audio/aac': '.aac', 'audio/ogg': '.ogg',
      'audio/wav': '.wav', 'audio/x-wav': '.wav',
      'audio/flac': '.flac', 'audio/x-flac': '.flac'
    };
    const ext = extMap[contentType] || '.mp3';
    const filename = `${name}.${ext}`;

    // 上传到存储服务
    const result = await uploadFile(buffer, filename, contentType, storage);

    // 创建音乐记录
    const music = await Music.create({
      song_id: song_mid,
      name: name.slice(0, 200),
      singer: (singer || '未知歌手').slice(0, 200),
      album: (album_name || '').slice(0, 200),
      cover: cover || '',
      play_url: result.url,
      duration: duration || 0,
      source: storage,
      origin_platform: platform || 'netease',
      playlist_name: (playlist_name || (platform === 'qq' ? 'QQ音乐' : '网易云')).slice(0, 200),
      sort_order: 0,
      is_active: true
    });

    // 同步记录到媒体库
    await MediaFile.create({
      id: require('uuid').v4(),
      filename: result.filename,
      original_name: filename,
      mime_type: contentType,
      size: buffer.length,
      storage,
      url: result.url,
      path: result.path
    });

    return success(res, {
      id: music.id,
      name: music.name,
      singer: music.singer,
      url: result.url,
      storage,
      audio_source: urlResult.source,
      fallback: urlResult.fallback || false
    }, urlResult.fallback ? '保存成功（QQ音乐无可用链接，已回退网易云）' : `保存成功（来源：${platform === 'qq' ? 'QQ音乐' : '网易云音乐'}）`, 201);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
