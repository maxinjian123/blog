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

// 为 visitor_logs 表新增访客归属地字段（province/city），已存在时跳过
(async () => {
  try {
    const [cols] = await sequelize.query("SHOW COLUMNS FROM visitor_logs LIKE 'province';");
    if (cols.length === 0) {
      await sequelize.query("ALTER TABLE visitor_logs ADD COLUMN province VARCHAR(50) NULL AFTER action;");
      console.log('已新增 province 字段');
    } else {
      console.log('province 字段已存在，跳过');
    }

    const [cols2] = await sequelize.query("SHOW COLUMNS FROM visitor_logs LIKE 'city';");
    if (cols2.length === 0) {
      await sequelize.query("ALTER TABLE visitor_logs ADD COLUMN city VARCHAR(50) NULL AFTER province;");
      console.log('已新增 city 字段');
    } else {
      console.log('city 字段已存在，跳过');
    }

    // 常用查询走 action + created_at，补一个联合索引（已存在则跳过）
    const [idx] = await sequelize.query("SHOW INDEX FROM visitor_logs WHERE Key_name = 'idx_action_created';");
    if (idx.length === 0) {
      await sequelize.query("ALTER TABLE visitor_logs ADD INDEX idx_action_created (action, created_at);");
      console.log('已新增 idx_action_created 索引');
    } else {
      console.log('idx_action_created 索引已存在，跳过');
    }
  } catch (err) {
    console.error('改表失败:', err.message);
  } finally {
    await sequelize.close();
  }
})();
