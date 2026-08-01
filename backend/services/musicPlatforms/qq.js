const axios = require('axios');
const neteasePlatform = require('./netease');
const config = require('../../config');

// QQ 音乐公共接口
const QQ_SEARCH_URL = 'https://c.y.qq.com/soso/fcgi-bin/client_search_cp';
const QQ_PLAYLIST_DETAIL_URL = 'https://c.y.qq.com/qzone/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg';
const QQ_SONG_URL = 'https://u.y.qq.com/cgi-bin/musicu.fcg';

const COMMON_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://y.qq.com/'
};

/**
 * QQ 音乐平台适配器
 * VIP 歌曲无法获取播放链接时，自动回退到网易云搜索同名歌曲获取免费链接
 */
module.exports = {
  id: 'qq',
  label: 'QQ音乐',

  /**
   * 从 QQ 音乐歌单链接中提取歌单 ID
   * 支持: https://y.qq.com/n/ryqq/playlist/7654261081 或纯数字 ID
   */
  parsePlaylistId(input) {
    if (!input) return null;
    const trimmed = input.trim();
    if (/^\d+$/.test(trimmed)) return trimmed;
    const m = trimmed.match(/playlist\/(\d+)/);
    if (m) return m[1];
    return null;
  },

  /**
   * 搜索 QQ 音乐歌曲
   * @returns {Promise<{total: number, list: Array}>}
   */
  async search(keyword, page = 1, pageSize = 20) {
    const res = await axios.get(QQ_SEARCH_URL, {
      params: {
        w: keyword,
        p: page,
        n: pageSize,
        cr: 1,
        g_tk: 5381,
        t: 0,
        format: 'json',
        inCharset: 'utf8',
        outCharset: 'utf8',
        notice: 0,
        platform: 'yqq',
        needNewCode: 0
      },
      headers: COMMON_HEADERS,
      timeout: 10000
    });

    const songData = res.data?.data?.song || {};
    const list = songData.list || [];

    return {
      total: songData.totalnum || songData.total || list.length,
      list: list.map(song => ({
        song_mid: song.songmid,
        song_id: song.songid,
        name: song.songname,
        singer: (song.singer || []).map(s => s.name).join(' / '),
        album_name: song.albumname || '',
        album_mid: song.albummid || '',
        cover: song.albummid
          ? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${song.albummid}.jpg`
          : '',
        duration: song.interval || 0,
        is_vip: song.pay?.payplay === 1
      }))
    };
  },

  /**
   * 获取 QQ 音乐歌单详情
   * @returns {Promise<{dissname, disscover, song_count, songs: Array}>}
   */
  async getPlaylistDetail(dissTid) {
    const res = await axios.get(QQ_PLAYLIST_DETAIL_URL, {
      params: {
        type: 1,
        json: 1,
        utf8: 1,
        onlysong: 0,
        disstid: dissTid,
        format: 'json',
        g_tk: 5381,
        inCharset: 'utf8',
        outCharset: 'utf8',
        notice: 0,
        platform: 'yqq',
        needNewCode: 0
      },
      headers: COMMON_HEADERS,
      timeout: 10000
    });

    let data = res.data;
    if (typeof data === 'string') {
      data = JSON.parse(data.replace(/callback\(|\);?\s*$/g, ''));
    }

    const cdlist = data.cdlist?.[0] || {};
    const songs = cdlist.songlist || [];

    return {
      dissname: cdlist.dissname || '',
      disscover: cdlist.logo ? cdlist.logo.replace('http://', 'https://') : '',
      song_count: cdlist.songnum || songs.length,
      songs: songs.map(song => ({
        song_mid: song.songmid,
        song_id: song.songid,
        name: song.songname,
        singer: (song.singer || []).map(s => s.name).join(' / '),
        album_name: song.albumname || '',
        album_mid: song.albummid || '',
        cover: song.albummid
          ? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${song.albummid}.jpg`
          : '',
        duration: song.interval || 0,
        is_vip: song.pay?.payplay === 1
      }))
    };
  },

  /**
   * 获取 QQ 音乐播放链接
   * 解析顺序：QQ 官方接口 → 第三方解析 API → 网易云完整链接 → 网易云外链兜底
   * @param {string} songMid - QQ 音乐歌曲 mid
   * @param {object} [fallback] - 回退搜索信息 {name, singer}
   * @returns {Promise<{url, expire, is_vip, source, size?, type?, br?, fallback?: boolean}>}
   */
  async getSongUrl(songMid, fallback) {
    // 1. QQ 音乐官方接口
    const payload = {
      req_0: {
        module: 'vkey.GetVkeyServer',
        method: 'CgiGetVkey',
        param: {
          guid: '10000',
          songmid: [songMid],
          songtype: [0],
          uin: '0',
          loginflag: 1,
          platform: '20'
        }
      },
      comm: {uin: '0', format: 'json', ct: 24}
    };

    try {
      const res = await axios.post(QQ_SONG_URL, payload, {
        headers: {...COMMON_HEADERS, 'Content-Type': 'application/json'},
        timeout: 10000
      });
      const info = res.data?.req_0?.data?.midurlinfo?.[0];
      const sip = res.data?.req_0?.data?.sip?.[0] || 'https://dl.stream.qqmusic.qq.com/';

      if (info && info.purl) {
        return {
          url: sip + info.purl,
          expire: res.data?.req_0?.data?.expire || 0,
          is_vip: false,
          source: 'qq'
        };
      }
    } catch {
      // QQ 接口异常，继续走回退逻辑
    }

    // 2. 第三方解析 API（可配置，用于获取 VIP 歌曲完整时长链接）
    if (config.music?.externalParseApi) {
      try {
        const parsedUrl = await parseViaExternalApi('qq', songMid, fallback);
        if (parsedUrl) {
          return {
            url: parsedUrl,
            expire: 0,
            is_vip: false,
            source: 'qq',
            fallback: true
          };
        }
      } catch {
        // 第三方解析失败，继续走网易云回退
      }
    }

    // 3. 网易云回退（优先用 song_url API 获取完整链接，而非试听片段）
    if (fallback && fallback.name) {
      try {
        const neteaseUrl = await getNeteaseUrlByMeta(fallback.name, fallback.singer);
        if (neteaseUrl.url) {
          return {
            ...neteaseUrl,
            fallback: true,
            is_vip: false
          };
        }
      } catch {
        // 回退也失败
      }
    }

    return {url: '', expire: 0, is_vip: true, source: 'qq'};
  },

  /**
   * 获取 QQ 音乐歌词（LRC 格式）
   * 失败时回退到网易云同名歌曲歌词
   * @param {string} songMid - QQ 音乐歌曲 mid
   * @param {object} [fallback] - 回退搜索信息 {name, singer}
   * @returns {Promise<{lrc: string, has_lyric: boolean, fallback?: boolean}>}
   */
  async getLyric(songMid, fallback) {
    try {
      const res = await axios.get('https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg', {
        params: {
          songmid: songMid,
          g_tk: 5381,
          format: 'json',
          inCharset: 'utf8',
          outCharset: 'utf8',
          notice: 0,
          platform: 'yqq',
          needNewCode: 0,
          nobase64: 1
        },
        headers: COMMON_HEADERS,
        timeout: 10000
      });

      let lrcText = res.data?.lyric || '';
      // QQ 音乐可能返回 base64
      if (!lrcText && res.data?.lyric) {
        try { lrcText = Buffer.from(res.data.lyric, 'base64').toString('utf8'); } catch (_) {}
      }
      if (lrcText) {
        return {lrc: lrcText, has_lyric: true};
      }
    } catch {
      // QQ 接口异常，继续走回退
    }

    // 回退网易云歌词
    if (fallback && fallback.name) {
      try {
        const neteaseLyric = await getNeteaseLyricByMeta(fallback.name, fallback.singer);
        if (neteaseLyric.has_lyric) {
          return {...neteaseLyric, fallback: true};
        }
      } catch {
        // 回退也失败
      }
    }

    return {lrc: '', has_lyric: false};
  }
};

/**
 * 通过歌曲名+歌手在网易云搜索并获取完整播放链接
 * 优先用 song_url API 获取完整时长链接，外链接口仅作兜底
 * @param {string} songName
 * @param {string} singer
 * @returns {Promise<{url: string, source: string}>}
 */
async function getNeteaseUrlByMeta(songName, singer) {
  // 1. 网易云搜索
  const searchRes = await axios.get('https://music.163.com/api/search/get/web', {
    params: {s: `${songName} ${singer || ''}`.trim(), type: 1, offset: 0, limit: 10},
    headers: {...COMMON_HEADERS, 'Referer': 'https://music.163.com/'},
    timeout: 10000
  });

  const songs = searchRes.data?.result?.songs || [];
  if (songs.length === 0) {
    return {url: '', source: ''};
  }

  // 2. 优先匹配同名同歌手的歌曲
  const matched = songs.find(s =>
    s.name === songName ||
    s.name.includes(songName) ||
    songName.includes(s.name)
  ) || songs[0];

  // 3. 优先用网易云 song_url API 获取完整链接（非试听片段）
  try {
    const urlResult = await neteasePlatform.getSongUrl(matched.id);
    if (urlResult.url) {
      return {url: urlResult.url, source: 'netease'};
    }
  } catch {
    // song_url 失败，继续走外链兜底
  }

  // 4. 外链接口兜底（可能返回试听片段）
  const externalUrl = `https://music.163.com/song/media/outer/url?id=${matched.id}.mp3`;
  const res = await axios.head(externalUrl, {
    headers: {...COMMON_HEADERS, 'Referer': 'https://music.163.com/'},
    timeout: 10000,
    maxRedirects: 5,
    validateStatus: () => true
  });

  if (res.status === 200 && res.headers?.['content-type']?.includes('audio')) {
    return {url: externalUrl, source: 'netease'};
  }
  if (res.status === 302 && res.headers?.location) {
    return {url: res.headers.location, source: 'netease'};
  }
  return {url: '', source: ''};
}

/**
 * 通过第三方解析 API 获取播放链接
 * 支持 {platform} 和 {id} 占位符，或直接传入 query 参数
 * @param {string} platform - 平台 ID（qq / netease）
 * @param {string} songId - 歌曲 ID
 * @param {object} [meta] - 歌曲元信息 {name, singer}
 * @returns {Promise<string|null>} 播放链接
 */
async function parseViaExternalApi(platform, songId, meta) {
  const apiTemplate = config.music?.externalParseApi;
  if (!apiTemplate) return null;

  let url = apiTemplate;
  // 支持 {platform} {id} {name} {singer} 占位符
  if (url.includes('{platform}')) {
    url = url.replace('{platform}', encodeURIComponent(platform));
  }
  if (url.includes('{id}')) {
    url = url.replace('{id}', encodeURIComponent(songId));
  }
  if (meta?.name && url.includes('{name}')) {
    url = url.replace('{name}', encodeURIComponent(meta.name));
  }
  if (meta?.singer && url.includes('{singer}')) {
    url = url.replace('{singer}', encodeURIComponent(meta.singer || ''));
  }

  const res = await axios.get(url, {
    timeout: config.music?.externalParseTimeout || 10000,
    headers: {'User-Agent': COMMON_HEADERS['User-Agent']},
    maxRedirects: 5,
    validateStatus: () => true
  });

  // 解析返回数据，兼容多种格式
  if (res.status === 200) {
    const data = typeof res.data === 'string' ? safeParseJson(res.data) : res.data;
    if (data?.url) return data.url;
    if (data?.data?.url) return data.data.url;
    if (data?.musicUrl) return data.musicUrl;
    // 纯文本 URL
    if (typeof res.data === 'string' && /^https?:\/\//.test(res.data.trim())) {
      return res.data.trim();
    }
  }
  // 302 跳转
  if (res.status === 302 && res.headers?.location) {
    return res.headers.location;
  }
  return null;
}

function safeParseJson(str) {
  try { return JSON.parse(str); } catch { return null; }
}

/**
 * 通过歌曲名+歌手在网易云搜索并获取歌词
 * @param {string} songName
 * @param {string} singer
 * @returns {Promise<{lrc: string, has_lyric: boolean}>}
 */
async function getNeteaseLyricByMeta(songName, singer) {
  const neteasePlatform = require('./netease');
  const searchRes = await axios.get('https://music.163.com/api/search/get/web', {
    params: {s: `${songName} ${singer || ''}`.trim(), type: 1, offset: 0, limit: 10},
    headers: {...COMMON_HEADERS, 'Referer': 'https://music.163.com/'},
    timeout: 10000
  });

  const songs = searchRes.data?.result?.songs || [];
  if (songs.length === 0) {
    return {lrc: '', has_lyric: false};
  }

  const matched = songs.find(s =>
    s.name === songName ||
    s.name.includes(songName) ||
    songName.includes(s.name)
  ) || songs[0];

  return neteasePlatform.getLyric(matched.id);
}
