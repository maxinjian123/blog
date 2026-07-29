const { sequelize } = require('../models');

// 模拟中国各省份访客数据（用于地图展示演示）
const mockVisitors = [
  { province: '北京', city: '北京', count: 15 },
  { province: '上海', city: '上海', count: 12 },
  { province: '广东', city: '深圳', count: 8 },
  { province: '广东', city: '广州', count: 6 },
  { province: '浙江', city: '杭州', count: 7 },
  { province: '江苏', city: '南京', count: 5 },
  { province: '四川', city: '成都', count: 4 },
  { province: '湖北', city: '武汉', count: 3 },
  { province: '山东', city: '济南', count: 3 },
  { province: '福建', city: '厦门', count: 2 },
  { province: '湖南', city: '长沙', count: 2 },
  { province: '陕西', city: '西安', count: 2 },
  { province: '辽宁', city: '大连', count: 1 },
  { province: '重庆', city: '重庆', count: 2 },
  { province: '天津', city: '天津', count: 1 },
];

async function seed() {
  try {
    for (const v of mockVisitors) {
      for (let i = 0; i < v.count; i++) {
        await sequelize.query(
          `INSERT INTO visitor_logs (article_id, ip, user_agent, action, province, city, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          {
            replacements: [
              'f96e8100b5c746a3871848f1427a8800',
              '0.0.0.0',
              'mock-data',
              'view',
              v.province,
              v.city,
              new Date(Date.now() - Math.floor(Math.random() * 30 * 86400000))
            ]
          }
        );
      }
    }
    console.log(`[Seed] 已插入 ${mockVisitors.reduce((s, v) => s + v.count, 0)} 条模拟访客位置数据`);
    process.exit(0);
  } catch (err) {
    console.error('[Seed] 失败:', err.message);
    process.exit(1);
  }
}

seed();
