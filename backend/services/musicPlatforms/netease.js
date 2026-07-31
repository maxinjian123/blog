const {search, playlist_detail, song_url, song_detail, lyric} = require('NeteaseCloudMusicApi');

/**
 * 网易云音乐平台适配器
 * 实现统一的平台接口：id / label / search / parsePlaylistId / getPlaylistDetail / getSongUrl
 */
module.exports = {
  id: 'netease',
  label: '网易云音乐',

  /**
   * 从网易云歌单链接中提取歌单 ID
   * 支持: https://music.163.com/#/playlist?id=123456 / /playlist/123456 / ?id=123456 / 纯数字
   */
  parsePlaylistId(input) {
    if (!input) return null;
    const trimmed = input.trim();
    if (/^\d+$/.test(trimmed)) return trimmed;
    let m = trimmed.match(/[?&]id=(\d+)/);
    if (m) return m[1];
    m = trimmed.match(/playlist\/(\d+)/);
    if (m) return m[1];
    return null;
  },

  /**
   * 批量获取歌曲详情，补全封面 URL
   */
  async fetchSongCovers(songIds) {
    if (!songIds.length) return {};
    try {
      const r = await song_detail({ids: songIds.join(',')});
      const songs = r.body?.songs || [];
      const map = {};
      songs.forEach(s => {
        map[s.id] = {
          cover: s.al?.picUrl ? String(s.al.picUrl).replace('http://', 'https://') : ''
        };
      });
      return map;
    } catch {
      return {};
    }
  },

  /**
   * 搜索网易云音乐歌曲
   * @returns {Promise<{total: number, list: Array}>}
   */
  async search(keyword, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;
    const r = await search({keywords: keyword, limit: pageSize, offset});
    const result = r.body?.result || {};
    const songs = result.songs || [];

    // search 接口本身不返回封面 URL，需补全
    const coverMap = await this.fetchSongCovers(songs.map(s => s.id));

    return {
      total: result.songCount || songs.length,
      list: songs.map(song => {
        const id = song.id;
        const cover = coverMap[id]?.cover || '';
        return {
          song_mid: String(id),
          song_id: id,
          name: song.name || '',
          singer: (song.artists || []).map(a => a.name).filter(Boolean).join(' / '),
          album_name: song.album?.name || '',
          album_mid: song.album?.id ? String(song.album.id) : '',
          cover,
          duration: Math.floor((song.duration || 0) / 1000),
          is_vip: isVipByFee(song.fee)
        };
      })
    };
  },

  /**
   * 获取歌单详情
   * @returns {Promise<{dissname, disscover, song_count, songs: Array}>}
   */
  async getPlaylistDetail(playlistId) {
    const r = await playlist_detail({id: playlistId, n: 1000});
    const pl = r.body?.playlist || {};
    const songs = pl.tracks || [];

    return {
      dissname: pl.name || '',
      disscover: pl.creator?.avatarUrl ? String(pl.creator.avatarUrl).replace('http://', 'https://') : '',
      song_count: pl.trackCount || songs.length,
      songs: songs.map(song => ({
        song_mid: String(song.id),
        song_id: song.id,
        name: song.name || '',
        singer: (song.ar || song.artists || []).map(a => a.name).filter(Boolean).join(' / '),
        album_name: song.al?.name || song.album?.name || '',
        album_mid: (song.al?.id || song.album?.id) ? String(song.al?.id || song.album?.id) : '',
        cover: song.al?.picUrl ? String(song.al.picUrl).replace('http://', 'https://') : '',
        duration: Math.floor((song.dt || song.duration || 0) / 1000),
        is_vip: isVipByFee(song.fee)
      }))
    };
  },

  /**
   * 获取歌曲播放链接
   * @returns {Promise<{url, expire, is_vip, source, size?, type?, br?}>}
   */
  async getSongUrl(songId) {
    try {
      const r = await song_url({id: Number(songId), br: 320000});
      const info = r.body?.data?.[0];
      if (info && info.url) {
        return {
          url: info.url,
          expire: 0,
          is_vip: info.fee === 1,
          source: 'netease',
          size: info.size,
          type: info.type,
          br: info.br
        };
      }
      return {url: '', expire: 0, is_vip: true, source: 'netease'};
    } catch (err) {
      return {url: '', expire: 0, is_vip: true, source: 'netease', error: err.message};
    }
  },

  /**
   * 获取歌词（LRC 格式）
   * @param {string} songId - 网易云歌曲 ID
   * @returns {Promise<{lrc: string, has_lyric: boolean}>}
   */
  async getLyric(songId) {
    try {
      const r = await lyric({id: Number(songId)});
      const lrcText = r.body?.lrc?.lyric || '';
      return {
        lrc: lrcText,
        has_lyric: !!lrcText
      };
    } catch (err) {
      return {lrc: '', has_lyric: false, error: err.message};
    }
  }
};

/**
 * 网易云 fee 字段 → 是否 VIP
 * fee: 0 免费 / 1 VIP / 4 数字专辑 / 8 低音质免费高音质 VIP
 */
function isVipByFee(fee) {
  return fee === 1 || fee === 4 || fee === 8;
}
