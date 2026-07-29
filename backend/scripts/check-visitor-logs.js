const { sequelize } = require('../models');

(async () => {
  const [rows] = await sequelize.query('SELECT COUNT(*) as total FROM visitor_logs');
  console.log('总记录:', rows[0].total);

  const [views] = await sequelize.query("SELECT COUNT(*) as c FROM visitor_logs WHERE action='view'");
  console.log('view记录:', views[0].c);

  const [geo] = await sequelize.query('SELECT COUNT(*) as c FROM visitor_logs WHERE province IS NOT NULL');
  console.log('有省份记录:', geo[0].c);

  const [recent] = await sequelize.query('SELECT id, article_id, ip, action, province, city, created_at FROM visitor_logs ORDER BY created_at DESC LIMIT 5');
  console.log('最近记录:', JSON.stringify(recent, null, 2));

  const [daily] = await sequelize.query("SELECT DATE(created_at) as day, COUNT(*) as c FROM visitor_logs WHERE action='view' GROUP BY DATE(created_at) ORDER BY day DESC LIMIT 10");
  console.log('每日view统计:', JSON.stringify(daily, null, 2));

  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
