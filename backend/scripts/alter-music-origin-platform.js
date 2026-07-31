const { Sequelize } = require('sequelize');
const config = require('../config');

const sequelize = new Sequelize(
  config.db.database,
  config.db.username,
  config.db.password,
  {
    host: config.db.host,
    port: Number(config.db.port),
    dialect: config.db.dialect,
    logging: console.log
  }
);

(async () => {
  try {
    // 0. 检查 origin_platform 字段是否已存在
    const [cols] = await sequelize.query(
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'musics' AND COLUMN_NAME = 'origin_platform';",
      {replacements: [config.db.database]}
    );

    if (cols.length === 0) {
      // 1. 新增 origin_platform 字段（默认 netease）
      await sequelize.query(
        "ALTER TABLE musics ADD COLUMN origin_platform VARCHAR(20) NOT NULL DEFAULT 'netease' COMMENT '原始来源平台：netease 网易云 / qq QQ音乐 / upload 手动上传';"
      );
      console.log('[OK] 已新增 origin_platform 字段');
    } else {
      console.log('[SKIP] origin_platform 字段已存在');
    }

    // 2. 根据现有 source 字段值回填 origin_platform
    // source='qq' → origin_platform='qq'（旧 QQ 音乐数据）
    // source='local' 或 'minio' → origin_platform='upload'（手动上传，依据 playlist_name='手动上传' 判断更精确）
    // 其它（包括 source='qq' 但 playlist_name 包含「网易云」的旧回退数据）→ 'netease'
    const [r1] = await sequelize.query(
      "UPDATE musics SET origin_platform = 'qq' WHERE origin_platform = 'netease' AND source = 'qq' AND (playlist_name IS NULL OR playlist_name NOT LIKE '%网易云%');"
    );
    console.log(`[OK] 标记为 QQ 音乐: ${r1.affectedRows} 行`);
    const [r2] = await sequelize.query(
      "UPDATE musics SET origin_platform = 'upload' WHERE origin_platform = 'netease' AND (source = 'local' OR source = 'minio') AND (playlist_name = '手动上传' OR playlist_name IS NULL);"
    );
    console.log(`[OK] 标记为手动上传: ${r2.affectedRows} 行`);
    const [r3] = await sequelize.query(
      "UPDATE musics SET origin_platform = 'netease' WHERE origin_platform = 'netease' AND source = 'qq' AND playlist_name LIKE '%网易云%';"
    );
    console.log(`[OK] 标记为网易云（旧回退数据）: ${r3.affectedRows} 行`);

    // 3. 输出统计
    const [rows] = await sequelize.query(
      "SELECT origin_platform, COUNT(*) as cnt FROM musics GROUP BY origin_platform;"
    );
    console.log('[统计]', rows);
  } catch (err) {
    console.error('[FAIL] 迁移失败:', err.message);
  } finally {
    await sequelize.close();
  }
})();
