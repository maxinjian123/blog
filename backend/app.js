const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const config = require('./config');
const {syncDatabase} = require('./models');
require('./utils/redis');
const errorHandler = require('./middleware/errorHandler');

const {registerRoutes} = require('./routes');
const {ensureCommonJs} = require('./routes/clientPages');
const {startScheduler} = require('./utils/scheduler');
const {verifyMailer} = require('./services/mail');
const {initDefaults, loadConfigs} = require('./services/configService');
const {initDefaultEmojis} = require('./services/emojiService');
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

app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({extended: true}));

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
    message: {code: 429, message: '请求过多，请稍后再试。', data: null}
});
app.use('/api/', limiter);

// 静态资源：允许跨源加载（Electron 桌面端 file:// 页面、跨域前端访问图片/音频/视频）
// helmet 默认设置 Cross-Origin-Resource-Policy: same-origin 会阻止 no-cors 跨源加载（ERR_BLOCKED_BY_RESPONSE）
app.use('/uploads', (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
}, express.static(path.join(__dirname, '.', config.upload.dir)));

// Swagger API 文档（开发环境无需鉴权，便于调试）
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
    explorer: true,
    customSiteTitle: 'Blog API Docs'
}));
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpecs);
});

// 操作日志中间件：自动记录管理端写操作（POST/PUT/DELETE）
// 全局挂载到 /api/v1/，中间件内部通过路由模式匹配过滤只记录已知模块的写操作
const {operationLogger} = require('./middleware/operationLog');
app.use('/api/v1/', operationLogger());

// 迁移：自定义页面目录由 client-pages/ 提升到 public 根目录（页面直接存放于 public 下）
// 将 client-pages 下的子目录移动到 public 根，随后删除空的 client-pages 目录
function migrateClientPagesDir() {
    const fs = require('fs');
    const src = path.join(__dirname, 'public', 'client-pages');
    if (!fs.existsSync(src)) return;
    const entries = fs.readdirSync(src, {withFileTypes: true});
    for (const entry of entries) {
        const from = path.join(src, entry.name);
        const to = path.join(__dirname, 'public', entry.name);
        if (entry.isDirectory() && !fs.existsSync(to)) {
            fs.renameSync(from, to);
            console.log(`[Server] 自定义页面目录迁移: client-pages/${entry.name} -> ${entry.name}`);
        }
    }
    if (fs.readdirSync(src).length === 0) {
        fs.rmdirSync(src);
        console.log('[Server] 已删除 client-pages 目录（自定义页面直接存放于 public 根目录）');
    }
}

// 统一注册所有路由
registerRoutes(app);

// 静态资源：public 目录作为后端静态资源目录，可通过链接直接访问（如 /logo.svg、/robots.txt）
// 放在路由之后：仅当没有路由匹配时才回落到静态文件，避免与 API / 健康检查冲突
// index 开启后，目录请求（如 /client-pages/home/）自动返回其中的 index.html
app.use('/', (req, res, next) => {
    // 静态 HTML 可能含内联样式/脚本，同样移除 CSP；允许跨源加载（Electron / 跨域前端）
    res.removeHeader('Content-Security-Policy');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
}, express.static(path.join(__dirname, 'public'), {
    index: ['index.html'],
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0
}));

app.use((req, res) => {
    res.status(404).json({code: 404, message: 'Route not found', data: null});
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
        // 文件系统迁移：client-pages 目录 -> public 根目录
        migrateClientPagesDir();
        // 确保公共封装脚本 public/common.js 存在（页面模板统一引用）
        await ensureCommonJs();
        await syncDatabase();
        await initDefaults();
        await initDefaultEmojis();
        await loadConfigs();
        // 配置加载完成后，验证邮件服务（按最新配置）
        await verifyMailer();
    } catch (err) {
        console.error('[Server] 配置加载失败:', err.message);
    }
});

module.exports = app;
