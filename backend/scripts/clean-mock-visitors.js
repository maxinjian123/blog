/**
 * 清理 visitor_logs 表中由 seed-visitor-geo.js 写入的模拟数据
 *
 * 识别规则：原种子脚本插入的记录具有以下固定特征：
 *   - ip = '0.0.0.0'
 *   - user_agent = 'mock-data'
 *   - action = 'view'
 *
 * 运行方式：
 *   cd backend
 *   node scripts/clean-mock-visitors.js         # 默认先打印待删除条数，确认后删除
 *   node scripts/clean-mock-visitors.js --force # 跳过确认直接删除
 *
 * 该脚本可重复执行，已无脏数据时会输出 0 条。
 */
const { sequelize, VisitorLog } = require('../models');
const { Op } = require('sequelize');

const MOCK_WHERE = {
  ip: '0.0.0.0',
  user_agent: 'mock-data',
  action: 'view'
};

async function main() {
  const force = process.argv.includes('--force');

  try {
    const count = await VisitorLog.count({ where: MOCK_WHERE });

    if (count === 0) {
      console.log('[Clean] 未发现模拟访客数据，无需清理。');
      return;
    }

    // 抽样展示前 5 条，便于人工核对
    const samples = await VisitorLog.findAll({
      attributes: ['id', 'ip', 'user_agent', 'province', 'city', 'created_at'],
      where: MOCK_WHERE,
      order: [['id', 'ASC']],
      limit: 5,
      raw: true
    });

    console.log(`[Clean] 发现 ${count} 条模拟访客数据（user_agent='mock-data'）。`);
    console.log('[Clean] 抽样记录：');
    samples.forEach(s => {
      console.log(`  id=${s.id} ip=${s.ip} province=${s.province} city=${s.city} created_at=${s.created_at}`);
    });

    if (!force) {
      console.log('\n[Clean] 如确认删除，请重新运行并附加 --force 参数：');
      console.log('  node scripts/clean-mock-visitors.js --force');
      return;
    }

    const deleted = await VisitorLog.destroy({ where: MOCK_WHERE });
    console.log(`[Clean] 已删除 ${deleted} 条模拟访客数据。`);

    // 顺便清理 Redis 中可能残留的旧 ip_location:0.0.0.0 缓存（如有）
    try {
      const redis = require('../utils/redis');
      if (redis && redis.status === 'ready') {
        await redis.del('ip_location:0.0.0.0');
        console.log('[Clean] 已清理 Redis 中 0.0.0.0 的归属地缓存。');
        redis.disconnect();
      }
    } catch (err) {
      console.warn(`[Clean] Redis 清理跳过: ${err.message}`);
    }
  } catch (err) {
    console.error('[Clean] 清理失败:', err.message);
    process.exitCode = 1;
  } finally {
    try {
      await sequelize.close();
    } catch { /* ignore */ }
  }
}

main();
