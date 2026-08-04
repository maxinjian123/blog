// P4-2: 定时发布调度器
// 每分钟检查一次，将到点的草稿文章自动发布
const { Article } = require('../models');

let schedulerInterval = null;

async function checkScheduledArticles() {
  try {
    const now = new Date();
    const due = await Article.findAll({
      where: {
        status: 'draft',
        scheduled_at: { $lte: now }
      }
    });
    if (due.length === 0) return;
    for (const article of due) {
      await article.update({
        status: 'published',
        published_at: new Date(),
        scheduled_at: null
      });
      console.log(`[Scheduler] 文章自动发布: ${article.id} - ${article.title}`);
    }
  } catch (err) {
    console.error('[Scheduler] 定时发布检查失败:', err.message);
  }
}

// 定时数据备份：每分钟检查一次，到时间自动执行
async function checkScheduledBackup() {
  try {
    const { ran } = await require('../services/backupService').checkScheduledBackup();
    if (ran) {
      console.log('[Scheduler] 定时备份已执行完成');
    }
  } catch (err) {
    console.error('[Scheduler] 定时备份执行失败:', err.message);
  }
}

function startScheduler() {
  if (schedulerInterval) return;
  // 立即检查一次，然后每 60 秒检查
  checkScheduledArticles();
  checkScheduledBackup();
  schedulerInterval = setInterval(() => {
    checkScheduledArticles();
    checkScheduledBackup();
  }, 60 * 1000);
  console.log('[Scheduler] 定时发布调度器已启动（每 60 秒检查一次）');
}

function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[Scheduler] 定时发布调度器已停止');
  }
}

module.exports = { startScheduler, stopScheduler, checkScheduledArticles };
