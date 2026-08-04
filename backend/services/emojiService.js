const {Emoji} = require('../models');
const {sequelize} = require('../models');

// 编辑器表情默认数据（原管理端 constants/emojis.ts 迁移到数据库）
const DEFAULT_EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '☺️', '😊',
  '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙',
  '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎',
  '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️',
  '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😮‍💨', '😤', '😠',
  '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥',
  '😓', '🤗', '🤔', '🤭', '🥱', '🤥', '😶', '😐', '😑', '😬',
  '🙄', '😯', '😦', '😧', '😮', '😲', '😴', '🤤', '😪', '😵',
  '😵‍💫', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑',
  '🤠', '😈', '👿', '💀'
];

/**
 * 插入缺失的默认表情（逐条参数化写入）。
 * 说明：mysql2 会把 SQL 字面量中的扩展字符（emoji）转成 ?，
 * 因此不能使用 bulkCreate/批量 VALUES，必须逐条参数化插入。
 */
async function insertDefaultEmojis({startSort = 1000} = {}) {
  await ensureEmojiColumnCollation();
  const existing = new Set(
      (await Emoji.findAll({attributes: ['emoji'], raw: true})).map((r) => r.emoji)
  );
  const missing = DEFAULT_EMOJIS.filter((e) => !existing.has(e));
  let added = 0;
  for (let i = 0; i < missing.length; i++) {
    try {
      await Emoji.create({
        emoji: missing[i],
        name: '',
        category: 'default',
        sort_order: startSort + i,
        enabled: true
      });
      added++;
    } catch (err) {
      // 并发或其他原因导致的唯一冲突视为已存在，跳过
      if (err.name !== 'SequelizeUniqueConstraintError') throw err;
    }
  }
  return added;
}

/**
 * 确保 emoji 列使用 utf8mb4_bin 排序规则（旧表由 sync 创建时可能为 unicode_ci）
 */
async function ensureEmojiColumnCollation() {
  try {
    await sequelize.query(
        "ALTER TABLE `emojis` MODIFY `emoji` VARCHAR(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '表情字符'"
    );
  } catch (err) {
    // 表不存在等情况下交由 sync/后续逻辑处理
    console.error('[Emoji] 校正表情列排序规则失败:', err.message);
  }
}

/**
 * 首次启动时初始化默认表情（表为空才写入；后续新增默认表情自动补充）
 */
async function initDefaultEmojis() {
  try {
    await Emoji.sync();
    await ensureEmojiColumnCollation();
    const count = await Emoji.count();
    const added = await insertDefaultEmojis({startSort: count > 0 ? 1000 : 0});
    if (added > 0) {
      console.log(`[Emoji] 已初始化/补充 ${added} 个默认表情`);
    }
  } catch (err) {
    console.error('[Emoji] 初始化默认表情失败:', err.message);
  }
}

/**
 * 编辑器使用的已启用表情列表
 */
async function listEnabled() {
  return Emoji.findAll({
    where: {enabled: true},
    attributes: ['id', 'emoji', 'name', 'category', 'sort_order'],
    order: [['sort_order', 'ASC'], ['id', 'ASC']],
    raw: true
  });
}

module.exports = {
  DEFAULT_EMOJIS,
  ensureEmojiColumnCollation,
  initDefaultEmojis,
  insertDefaultEmojis,
  listEnabled
};
