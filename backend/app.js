const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const config = require('./config');
const { syncDatabase } = require('./models');
const redis = require('./utils/redis');
const errorHandler = require('./middleware/errorHandler');
const { safeSchedule } = require('./utils/cron');

const authRoutes = require('./routes/auth');
const articleRoutes = require('./routes/articles');
const commentRoutes = require('./routes/comments');
const categoryRoutes = require('./routes/categories');
const tagRoutes = require('./routes/tags');
const uploadRoutes = require('./routes/upload');
const aiRoutes = require('./routes/ai');
const adminRoutes = require('./routes/admin');
const announcementRoutes = require('./routes/announcements');
const siteRoutes = require('./routes/site');
const captchaRoutes = require('./routes/captcha');
const commentUploadRoutes = require('./routes/commentUpload');
const chromaService = require('./services/ai/chromaService');

const app = express();

app.use(helmet());

const corsOrigins = config.cors.origin
  ? config.cors.origin.split(',').map((s) => s.trim())
  : "*";
app.use(cors({ origin: corsOrigins, credentials: true }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 429, message: '请求过多，请稍后再试。', data: null }
});
app.use('/api/', limiter);

app.use('/uploads', express.static(path.join(__dirname, '.', config.upload.dir)));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/articles', articleRoutes);
app.use('/api/v1/comments', commentRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/tags', tagRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/comment-upload', commentUploadRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/announcements', announcementRoutes);
app.use('/api/v1/site', siteRoutes);
app.use('/api/v1/captcha', captchaRoutes);

app.use((req, res) => {
  res.status(404).json({ code: 404, message: 'Route not found', data: null });
});

app.use(errorHandler);

// syncDatabase();

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
  console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
});

// 定时同步任务：每30分钟将 articles 表数据同步到 Chroma RAG 知识库
safeSchedule('*/30 * * * *', async () => {
  const result = await chromaService.syncAllArticles();
  console.log(`[Chroma] 定时同步完成: ${result.articles} 篇文章, ${result.chunks} 个块`);
}, {
  name: 'ChromaArticleSync',
  timezone: 'Asia/Shanghai',
  runOnStart: true
});

module.exports = app;