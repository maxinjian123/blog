const {getPlatform, listPlatforms, DEFAULT_PLATFORM} = require('./musicPlatforms');

/**
 * 音乐爬虫门面（Facade）
 * 对外提供统一接口，内部按平台 ID 分发到具体适配器
 * 新增平台只需在 musicPlatforms/ 下实现适配器并在 index.js 注册
 */

/**
 * 列出所有可用平台
 * @returns {Array<{id: string, label: string}>}
 */
function listAllPlatforms() {
  return listPlatforms();
}

/**
 * 搜索歌曲（按平台分发）
 * @param {string} keyword - 关键词
 * @param {number} [page=1] - 页码
 * @param {number} [pageSize=20] - 每页数量
 * @param {string} [platformId] - 平台 ID（netease / qq），默认 netease
 */
async function searchSongs(keyword, page = 1, pageSize = 20, platformId) {
  const platform = getPlatform(platformId);
  return platform.search(keyword, page, pageSize);
}

/**
 * 解析歌单 ID（按平台分发）
 * @param {string} input - 用户输入的 ID 或链接
 * @param {string} [platformId] - 平台 ID
 * @returns {string|null}
 */
function parsePlaylistId(input, platformId) {
  const platform = getPlatform(platformId);
  return platform.parsePlaylistId(input);
}

/**
 * 获取歌单详情（按平台分发）
 * @param {string} playlistId - 歌单 ID
 * @param {string} [platformId] - 平台 ID
 */
async function getPlaylistDetail(playlistId, platformId) {
  const platform = getPlatform(platformId);
  return platform.getPlaylistDetail(playlistId);
}

/**
 * 获取歌曲播放链接（按平台分发）
 * @param {string} songId - 歌曲 ID（网易云为 songId，QQ 为 songmid）
 * @param {object} [fallback] - 回退搜索信息 {name, singer}（QQ 平台 VIP 时回退到网易云）
 * @param {string} [platformId] - 平台 ID
 */
async function getSongUrl(songId, fallback, platformId) {
  const platform = getPlatform(platformId);
  return platform.getSongUrl(songId, fallback);
}

/**
 * 获取歌词（按平台分发）
 * @param {string} songId - 歌曲 ID
 * @param {object} [fallback] - 回退搜索信息 {name, singer}
 * @param {string} [platformId] - 平台 ID
 */
async function getLyric(songId, fallback, platformId) {
  const platform = getPlatform(platformId);
  if (!platform.getLyric) {
    return {lrc: '', has_lyric: false};
  }
  return platform.getLyric(songId, fallback);
}

module.exports = {
  DEFAULT_PLATFORM,
  listAllPlatforms,
  searchSongs,
  parsePlaylistId,
  getPlaylistDetail,
  getSongUrl,
  getLyric
};
