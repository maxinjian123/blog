const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Blog API',
      version: '1.0.0',
      description: 'Blog 后端 API 接口文档'
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v1',
        description: '本地开发服务器'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            nickname: { type: 'string', example: '博主' },
            username: { type: 'string', example: 'admin' },
            email: { type: 'string', example: 'admin@example.com' },
            avatar: { type: 'string', nullable: true },
            role: { type: 'string', enum: ['admin', 'author', 'user'], example: 'admin' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Article: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            summary: { type: 'string', nullable: true },
            content: { type: 'string' },
            cover: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['draft', 'published', 'scheduled'] },
            view_count: { type: 'integer' },
            like_count: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string', nullable: true }
          }
        },
        Tag: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            slug: { type: 'string' }
          }
        },
        Comment: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            content: { type: 'string' },
            author_name: { type: 'string' },
            author_email: { type: 'string' },
            parent_id: { type: 'integer', nullable: true },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        MediaFile: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            filename: { type: 'string' },
            original_name: { type: 'string' },
            mime_type: { type: 'string' },
            size: { type: 'integer' },
            storage: { type: 'string', enum: ['local', 'minio'] },
            url: { type: 'string' },
            path: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        SiteConfig: {
          type: 'object',
          properties: {
            config_key: { type: 'string' },
            config_value: { type: 'string' },
            category: { type: 'string' },
            description: { type: 'string' }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            code: { type: 'integer', example: 200 },
            message: { type: 'string', example: 'success' },
            data: { type: 'object' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            code: { type: 'integer', example: 400 },
            message: { type: 'string', example: '请求参数错误' },
            data: { type: 'object', nullable: true }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js', './routes/swagger-docs.js', './config/swagger.js']
};

const specs = swaggerJsdoc(options);

module.exports = specs;
