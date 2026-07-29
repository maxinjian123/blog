const { Sequelize } = require('sequelize');
const config = require('../config');

// 移除页面管理模块：删除数据库中的 pages 表结构
// 运行：node scripts/drop-pages-table.js
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
    await sequelize.query('DROP TABLE IF EXISTS `Page`;');
    await sequelize.query('DROP TABLE IF EXISTS `pages`;');
    console.log('pages 表已删除');
  } catch (err) {
    console.error('删除 pages 表失败:', err.message);
  } finally {
    await sequelize.close();
  }
})();
