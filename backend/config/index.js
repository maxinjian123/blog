require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
module.exports = {
  port: process.env.BACKEND_PORT || 3001,
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
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
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
  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxSize: process.env.MAX_FILE_SIZE || '10mb'
  },
  cors: {
    origin: process.env.CORS_ORIGIN || ''
  }
};