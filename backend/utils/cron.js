const cron = require('node-cron');

/**
 * 创建定时任务
 * @param {string} cronExpression - cron 表达式
 * @param {Function} taskFn - 任务函数（支持 async）
 * @param {Object} options - 选项
 * @param {string} options.name - 任务名称（用于日志）
 * @param {string} options.timezone - 时区，默认 'Asia/Shanghai'
 * @param {boolean} options.runOnStart - 是否启动时立即执行一次
 * @param {boolean} options.enabled - 是否启用，默认 true
 */
function schedule(cronExpression, taskFn, options = {}) {
  const {
    name = 'UnnamedTask',
    timezone = 'Asia/Shanghai',
    runOnStart = false,
    enabled = true
  } = options;

  if (!enabled) {
    console.log(`[Cron] ${name}: 已禁用`);
    return null;
  }

  const task = cron.schedule(cronExpression, async () => {
    try {
      console.log(`[Cron] ${name}: 开始执行`);
      const startTime = Date.now();
      await taskFn();
      const elapsed = Date.now() - startTime;
      console.log(`[Cron] ${name}: 执行完成 (${elapsed}ms)`);
    } catch (err) {
      console.error(`[Cron] ${name}: 执行失败:`, err.message);
    }
  }, {
    scheduled: true,
    timezone
  });

  console.log(`[Cron] ${name}: 已启动 (${cronExpression}, ${timezone})`);

  // 启动时立即执行一次
  if (runOnStart) {
    setImmediate(async () => {
      try {
        console.log(`[Cron] ${name}: 启动时立即执行`);
        await taskFn();
      } catch (err) {
        console.error(`[Cron] ${name}: 启动执行失败:`, err.message);
      }
    });
  }

  return task;
}

/**
 * 安全地启动定时任务（内部 try-catch 包装）
 */
function safeSchedule(cronExpression, taskFn, options = {}) {
  try {
    return schedule(cronExpression, taskFn, options);
  } catch (err) {
    console.error(`[Cron] ${options.name || 'Unknown'}: 创建失败:`, err.message);
    return null;
  }
}

module.exports = {schedule, safeSchedule};