const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const config = require('./config');
const { syncDatabase } = require('./models');
require('./utils/redis');
const errorHandler = require('./middleware/errorHandler');

const { registerRoutes } = require('./routes');
const { startScheduler } = require('./utils/scheduler');
const { verifyMailer } = require('./services/mail');
const { initDefaults, loadConfigs } = require('./services/configService');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

const app = express();

// 位于 Nginx 反向代理后，信任一层代理以正确获取客户端 IP（影响限流与日志）
app.set('trust proxy', 1);

app.use(helmet());

const corsOrigins = config.cors.origin
  ? config.cors.origin.split(',').map((s) => s.trim())
  : "*";
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  // 暴露 X-New-Token 给前端，用于 JWT 滑动续期
  exposedHeaders: ['X-New-Token']
}));

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

// Swagger API 文档（开发环境无需鉴权，便于调试）
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  explorer: true,
  customSiteTitle: '3D Blog API Docs'
}));
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpecs);
});

// 操作日志中间件：自动记录管理端写操作（POST/PUT/DELETE）
// 全局挂载到 /api/v1/，中间件内部通过路由模式匹配过滤只记录已知模块的写操作
const {operationLogger} = require('./middleware/operationLog');
app.use('/api/v1/', operationLogger());

// 统一注册所有路由
registerRoutes(app);

app.use((req, res) => {
  res.status(404).json({ code: 404, message: 'Route not found', data: null });
});

app.use(errorHandler);

// syncDatabase();

const PORT = config.port;
app.listen(PORT, async () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
  console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  // P4-2: 启动定时发布调度器
  startScheduler();

  // 启动后同步数据库模型 + 加载站点/邮件/上传配置
  try {
    await syncDatabase();
    await initDefaults();
    await loadConfigs();
    // 配置加载完成后，验证邮件服务（按最新配置）
    await verifyMailer();
  } catch (err) {
    console.error('[Server] 配置加载失败:', err.message);
  }
});

module.exports = app;