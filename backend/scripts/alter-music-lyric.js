const {Sequelize} = require('sequelize');
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
    // 检查 lyric 字段是否已存在
    const [cols] = await sequelize.query(
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'musics' AND COLUMN_NAME = 'lyric';",
      {replacements: [config.db.database]}
    );

    if (cols.length === 0) {
      await sequelize.query("ALTER TABLE musics ADD COLUMN lyric TEXT NULL COMMENT 'LRC 歌词文本';");
      console.log('✅ 已新增 lyric 字段');
    } else {
      console.log('ℹ️  lyric 字段已存在，跳过');
    }
  } catch (err) {
    console.error('❌ 迁移失败:', err.message);
  } finally {
    await sequelize.close();
  }
})();
