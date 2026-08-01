// 根据 NODE_ENV 决定加载哪个文件
const envFile = process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';

require('dotenv').config({path: require('path').join(__dirname, '..', envFile)});

// 启动必需配置仍从 .env.development.development 读取（数据库未连接前需要这些）
// 邮件、上传、站点等运行时可调配置由数据库 SiteConfig 表管理（见 services/configService.js）
module.exports = {
    port: process.env.BACKEND_PORT || 3000,
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        database: process.env.DB_NAME || 'blog_3d',
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        dialect: 'mysql'
    },
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || ''
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'default-secret',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        // 滑动续期阈值（秒）：token 剩余有效期少于此值时，auth 中间件自动签发新 token
        // 通过 X-New-Token 响应头返回，前端拦截器无感更新。默认 1 天（86400 秒）
        refreshThreshold: parseInt(process.env.JWT_REFRESH_THRESHOLD || '86400', 10)
    },
    doubao: {
        apiKey: process.env.DOUBAO_API_KEY || '',
        baseURL: process.env.DOUBAO_BASE_URL || '',
        chatModel: process.env.DOUBAO_CHAT_MODEL || '',
        imageModel: process.env.DOUBAO_IMAGE_MODEL || ''
    },
    ollama: {
        host: process.env.OLLAMA_HOST || 'http://localhost:11434',
        chatEnabled: process.env.OLLAMA_CHAT_ENABLED === 'true',
        chatModel: process.env.OLLAMA_CHAT_MODEL || 'gemma3:4b'
    },
    cors: {
        origin: process.env.CORS_ORIGIN || ''
    },

    // 评论回复邮件中"查看详情"按钮的跳转链接前缀
    // 留空时 mail.js 会回退到 request host
    commentReplyUrlPrefix: process.env.COMMENT_REPLY_URL_PREFIX || '',

    // 以下配置由 configService.applyToConfig() 在运行时从数据库填充
    // 这里仅保留默认结构，便于启动前/数据库未就绪时引用
    site: {
        name: 'Blog',
        description: '',
        url: ''
    },
    adminEmail: '',
    mail: {
        host: 'smtp.qq.com',
        port: 465,
        secure: true,
        user: '',
        pass: '',
        fromName: 'Blog'
    },
    upload: {
        dir: './uploads',
        maxSize: '10mb',
        defaultStorage: 'local',
        minio: {
            enabled: false,
            endpoint: '',
            port: 9000,
            useSSL: false,
            accessKey: '',
            secretKey: '',
            bucket: 'blog',
            publicBaseUrl: ''
        }
    },
    // 音乐解析配置
    music: {
        // 第三方解析 API（可选，用于 VIP 歌曲获取完整时长链接）
        // 格式：https://api.example.com/parse?platform={platform}&id={id}
        // 返回 JSON：{ url: "mp3链接", ... }
        // 留空则不启用第三方解析
        externalParseApi: process.env.MUSIC_EXTERNAL_PARSE_API || '',
        externalParseTimeout: 10000
    }
};
