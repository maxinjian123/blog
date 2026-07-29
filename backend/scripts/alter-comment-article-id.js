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
    await sequelize.query('ALTER TABLE comments MODIFY article_id VARCHAR(36) NULL;');
    console.log('article_id 已改为可空');
  } catch (err) {
    console.error('改表失败:', err.message);
  } finally {
    await sequelize.close();
  }
})();
