# TechMind Blog

一个功能完整的个人博客系统，采用前后端分离架构，支持文章管理、分类标签、AI 智能创作（双引擎驱动）、嵌套评论、SEO 优化等功能。

## 项目简介

TechMind Blog 是一个全栈博客平台，为开发者提供高性能、可扩展的个人博客解决方案。系统采用 **Vue 3 + Express + MySQL + Redis** 技术栈构建，支持 AI 辅助写作（豆包云端 API + Ollama 本地模型双引擎自动降级）、SEO 优化、响应式设计、明暗主题切换等特性。

项目包含三个子系统：
- **frontend** — 博客前台（面向访客）
- **admin** — 管理后台（面向管理员）
- **backend** — 后端 API 服务

## 技术栈

### 前端 (frontend)

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3.5 + TypeScript (Composition API + `<script setup>`) |
| 状态管理 | Pinia (article, auth, theme 三个 Store) |
| 路由 | Vue Router 4 (createWebHistory, 10 条懒加载路由) |
| Markdown | md-editor-v3 + marked |
| SEO | @unhead/vue (Open Graph / Twitter Card / canonical) |
| 样式 | Tailwind CSS v4 (自定义主题色系 + 暗色模式) |
| HTTP 客户端 | Axios (JWT 拦截器 + 统一错误处理) |
| 构建工具 | Vite 6 (Gzip 压缩 + 依赖预构建) |
| 图表 | ECharts 5 (词云图) |

### 管理面板 (admin)

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3 + TypeScript |
| UI 组件库 | Ant Design Vue 4 (ConfigProvider 中文本地化) |
| Markdown 编辑器 | md-editor-v3 (文章创作 + 评论回复) |
| 状态管理 | Pinia (auth, article, dashboard 三个 Store) |
| 构建工具 | Vite 6 (端口 5174, 代理 `/api` 到后端) |

### 后端 (backend)

| 类别 | 技术 |
|------|------|
| 运行环境 | Node.js |
| 框架 | Express 4 (12 个路由模块, 46+ API 端点) |
| 数据库 | MySQL + Sequelize ORM (8 个数据模型) |
| 缓存 | Redis 7 (ioredis) — 验证码存储 / 限流 / 点赞计数 |
| AI 引擎 | 豆包 Doubao API + Ollama 本地模型 (双驱动自动降级) |
| 认证 | JWT (jsonwebtoken + bcryptjs, auth / optionalAuth 中间件) |
| 文件上传 | Multer (diskStorage, UUID 重命名, 10MB 限制) |
| 安全 | Helmet + CORS + express-rate-limit (全局 300 次/15 分钟) |
| 邮件 | Nodemailer (QQ 邮箱 SMTP, 评论回复通知) |
| 图片检测 | sharp (NSFW 像素级肤色分析) |

## 核心功能

### 博客功能
- 文章发布与管理（Markdown / HTML 双格式创作）
- 分类与标签系统（支持多对多关联）
- 嵌套评论系统（Markdown 编辑、图片上传、SVG 验证码、QQ 号绑定）
- 文章搜索（关键词搜索标题/内容）
- 文章归档（按年月分组展示）
- SEO 优化（Open Graph / Twitter Card / 结构化元信息）
- 颜色主题系统（明暗主题切换，持久化到 localStorage）
- 响应式设计（移动端汉堡菜单 + 桌面端双栏布局）

### AI 智能功能
- AI 文章创作、润色、续写（支持 HTML / Markdown 格式）
- AI 文章摘要生成（单篇 / 批量）
- AI 智能标签推荐（自动写入数据库）
- AI 封面图生成（Chiikawa 风格，基于豆包文生图模型）
- AI 评论自动回复（以作者身份回复）
- 支持 Ollama 本地模型 + 豆包云端 API 双引擎（自动降级）

### 管理后台功能
- 仪表盘统计（文章数、访问量、评论数、获赞数、趋势图等）
- 文章 CRUD + Markdown 编辑器（AI 助手抽屉式集成）
- 分类 / 标签管理（支持 CRUD、搜索、排序、分页）
- 评论审核与管理（AI 自动回复、手动回复、查看对话）
- 公告管理（启用 / 禁用、排序）
- 系统设置（站点信息编辑、密码修改、缓存清除、数据导出）
- AI 封面生成器（上传 + AI 生成双模式）

### 系统特性
- 用户认证与权限管理（JWT, 7 天过期）
- 多层限流保护（全局 express-rate-limit + 局部 Redis 限流 + 自定义限流工厂）
- NSFW 图片检测（像素级肤色分析，保障评论图片安全）
- SVG 数学验证码（Redis 一次性存储，5 分钟过期）
- 邮件通知（评论回复时自动通知被回复者）

## 项目结构

```
blog/
├── README.md                       # 项目说明文档
├── PLAN.md                         # 架构文档 (Markdown 版)
├── PLAN.html                       # 架构文档 (HTML 版)
│
├── frontend/                       # 博客前端 (Vue 3 + Tailwind CSS v4)
│   ├── index.html
│   ├── vite.config.ts              # Vite 配置 (端口 5173, 代理 /api -> :3000)
│   ├── package.json
│   └── src/
│       ├── main.ts                 # 应用入口 (Pinia + Router + @unhead/vue)
│       ├── App.vue                 # 根组件 (双栏布局 + SEO + 主题初始化)
│       ├── router/index.ts         # 10 条路由 (scrollBehavior + 全局守卫)
│       ├── stores/                 # 3 个 Pinia Store
│       │   ├── article.ts          # 文章状态管理
│       │   ├── auth.ts             # 认证状态管理
│       │   └── theme.ts            # 主题切换 (深色/浅色)
│       ├── utils/
│       │   ├── api.ts              # Axios 封装 (JWT 拦截器)
│       │   └── message.ts          # 消息提示系统
│       ├── composables/
│       │   └── useSeo.ts           # SEO 封装 (useArticleSeo / usePageSeo)
│       ├── styles/
│       │   └── tailwind.css        # Tailwind v4 + 主题变量 + 文章样式
│       ├── components/
│       │   ├── layout/             # NavBar, Sidebar, Footer
│       │   ├── article/            # ArticleCard, CommentSection, CommentNode, MdCommentEditor, AiSummary
│       │   └── common/             # Message, TagCloud
│       └── pages/                  # 10 个页面组件
│           ├── Home.vue            # 首页 (文章列表 + 分页)
│           ├── Article.vue         # 文章详情 (点赞/目录/评论/AI摘要)
│           ├── Categories.vue      # 全部分类
│           ├── Category.vue        # 分类文章列表
│           ├── Tags.vue            # 全部标签 (词云图)
│           ├── Tag.vue             # 标签文章列表
│           ├── Archive.vue         # 归档 (按年月)
│           ├── Search.vue          # 搜索
│           ├── About.vue           # 关于
│           └── NotFound.vue        # 404
│
├── backend/                        # 后端服务 (Express + Sequelize)
│   ├── app.js                      # Express 入口 (CORS/Helmet/限流/路由注册)
│   ├── .env                        # 环境变量
│   ├── package.json
│   ├── Dockerfile                  # Docker 构建 (node:22-alpine)
│   ├── blog_3d.sql                 # 数据库初始化 SQL
│   ├── prompt/                     # 9 个 AI 提示词模板
│   ├── uploads/                    # 文件上传目录
│   ├── config/index.js             # 配置加载 (从 .env)
│   ├── models/                     # 8 个 Sequelize 模型
│   │   ├── index.js                # 模型关联定义
│   │   ├── User.js                 # 用户模型
│   │   ├── Article.js              # 文章模型 (含 catalog JSON)
│   │   ├── Category.js             # 分类模型
│   │   ├── Tag.js                  # 标签模型
│   │   ├── ArticleTags.js          # 文章-标签关联
│   │   ├── Comment.js              # 评论模型 (含自关联回复)
│   │   ├── VisitorLog.js           # 访客日志
│   │   └── Announcement.js         # 公告模型
│   ├── routes/                     # 12 个路由模块
│   │   ├── auth.js                 # 认证 (登录/注册/个人信息)
│   │   ├── articles.js             # 文章 CRUD + 搜索 + 归档 + 点赞 + 评论
│   │   ├── categories.js           # 分类 CRUD
│   │   ├── tags.js                 # 标签 CRUD + 标签文章列表
│   │   ├── comments.js             # 评论管理 + AI 回复
│   │   ├── upload.js               # 文件上传 (单文件/批量)
│   │   ├── commentUpload.js        # 评论图片上传 (Redis 限流 + NSFW)
│   │   ├── captcha.js              # SVG 数学验证码
│   │   ├── ai.js                   # AI 服务 (9 个端点)
│   │   ├── admin.js                # 管理面板 (统计/设置/缓存/导出)
│   │   ├── announcements.js        # 公告 CRUD
│   │   └── site.js                 # 站点信息
│   ├── services/
│   │   ├── ai/                     # AI 服务 (chat, summary, tag, image)
│   │   │   ├── index.js            # 聚合导出
│   │   │   ├── chat.js             # 对话双驱动 (Ollama 优先, 失败降级豆包)
│   │   │   ├── ollamaChat.js       # Ollama 本地对话 (含流式 SSE)
│   │   │   ├── summary.js          # 摘要生成
│   │   │   ├── tag.js              # 标签生成
│   │   │   └── image.js            # 封面图生成 (Chiikawa 风格)
│   │   ├── mail.js                 # 邮件通知 (QQ 邮箱 SMTP)
│   │   └── qq.js                   # QQ 信息查询 (头像/昵称)
│   ├── middleware/
│   │   ├── auth.js                 # JWT 认证 (auth / optionalAuth)
│   │   ├── upload.js               # Multer 上传配置
│   │   └── errorHandler.js         # 全局错误处理
│   └── utils/
│       ├── index.js                # 工具函数 (loadPrompt, replacePlaceholders)
│       ├── response.js             # 统一响应格式 (success/error/paginated)
│       ├── redis.js                # ioredis 客户端
│       ├── rateLimit.js            # 自定义限流工厂
│       └── nsfw.js                 # NSFW 图片检测
│
└── admin/                          # 管理面板 (Vue 3 + Ant Design Vue 4)
    ├── index.html
    ├── vite.config.ts              # Vite 配置 (端口 5174, 代理 /api -> :3000)
    ├── package.json
    └── src/
        ├── main.ts                 # 应用入口 (Ant Design Vue 中文本地化)
        ├── App.vue                 # 根组件 (Sider/Header/Content 布局)
        ├── config.ts               # 应用配置常量
        ├── router/index.ts         # 10 条管理路由 (含登录守卫)
        ├── stores/                 # 3 个 Pinia Store
        │   ├── auth.ts             # 认证状态
        │   ├── article.ts          # 文章管理
        │   └── dashboard.ts        # 仪表盘数据
        ├── utils/
        │   ├── api.ts              # Axios 封装 (10 分钟超时, JWT 拦截器)
        │   └── index.ts            # 工具函数
        ├── styles/admin.css        # 管理面板样式
        ├── pages/                  # 9 个管理页面
        │   ├── Login.vue           # 登录页
        │   ├── Dashboard.vue       # 仪表盘 (统计卡片 + 柱状图 + TOP5)
        │   ├── ArticleList.vue     # 文章列表管理
        │   ├── ArticleEditor.vue   # 文章编辑器 (md-editor-v3 + AI 抽屉)
        │   ├── CategoryManage.vue  # 分类管理
        │   ├── TagManage.vue       # 标签管理
        │   ├── CommentManage.vue   # 评论管理 (AI 自动回复)
        │   ├── Settings.vue        # 系统设置
        │   └── AnnouncementManage.vue # 公告管理
        └── components/admin/
            ├── AiAssistant.vue     # AI 写作助手 (抽屉式)
            └── CoverGenerator.vue  # AI 封面生成器
```

## API 接口概览

系统提供完整的 RESTful API 接口，共 **12 个路由模块，约 46+ 个端点**，统一前缀 `/api/v1`：

| 模块 | 路径 | 端点 | 说明 |
|------|------|------|------|
| 认证 | `/api/v1/auth` | 4 | 登录、注册、用户信息、修改密码 |
| 文章 | `/api/v1/articles` | 11 | 文章 CRUD、归档、评论、点赞、搜索、批量删除 |
| 评论 | `/api/v1/comments` | 6 | 评论管理、AI 回复、审核、删除、回复线程 |
| 分类 | `/api/v1/categories` | 4 | 分类 CRUD（含文章计数） |
| 标签 | `/api/v1/tags` | 5 | 标签 CRUD（含分页/搜索/排序）、标签文章列表 |
| 上传 | `/api/v1/upload` | 2 | 文件上传（单文件 / 多文件） |
| 评论上传 | `/api/v1/comment-upload` | 1 | 评论图片上传（Redis 限流 + NSFW 检测） |
| AI 服务 | `/api/v1/ai` | 9 | 创作、润色、续写、摘要、标签、封面、对话、流式对话、自动回复 |
| 管理 | `/api/v1/admin` | 4 | 仪表盘统计、系统设置、缓存清除、数据导出 |
| 公告 | `/api/v1/announcements` | 5 | 公告 CRUD、最新公告 |
| 站点 | `/api/v1/site` | 1 | 站点信息 |
| 验证码 | `/api/v1/captcha` | 1 | SVG 数学验证码生成 |

## 数据库模型

系统包含 **8 个数据模型**，数据库名 `blog_3d`：

| 模型 | 表名 | 主键 | 说明 |
|------|------|------|------|
| User | users | 自增 ID | 用户（admin / author / user 三种角色） |
| Article | articles | UUID (STRING 36) | 文章（draft / published / archived 三种状态） |
| Category | categories | UUID | 分类 |
| Tag | tags | UUID | 标签 |
| ArticleTags | article_tags | 复合主键 | 文章-标签多对多关联 |
| Comment | comments | UUID (STRING 36) | 评论（支持嵌套回复、AI 回复标记、点赞） |
| VisitorLog | visitor_logs | 自增 ID | 访客日志（模型保留，供后续扩展） |
| Announcement | announcements | 自增 ID | 公告 |

## 快速开始

### 环境要求

- Node.js >= 16.0
- MySQL >= 5.7
- Redis（可选，用于缓存和限流）
- npm 或 yarn

### 安装步骤

1. **克隆项目**
```bash
git clone https://gitee.com/ma-xinjian/blog.git
cd blog
```

2. **安装依赖**
```bash
cd backend && npm install
cd ../frontend && npm install
cd ../admin && npm install
```

3. **配置环境变量**

在 `backend` 目录下创建 `.env` 文件：
```env
# 服务端口
BACKEND_PORT=3000

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=blog_3d
DB_USER=root
DB_PASSWORD=your_password

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT 配置
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# AI 配置（豆包 Doubao API）
DOUBAO_API_KEY=your_api_key
DOUBAO_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
DOUBAO_CHAT_MODEL=doubao-seed-2-0-mini-260428
DOUBAO_IMAGE_MODEL=doubao-seedream-4-5-251128

# Ollama 本地模型（可选）
OLLAMA_HOST=http://localhost:11434
OLLAMA_CHAT_ENABLED=true
OLLAMA_CHAT_MODEL=glm4:9b
```

4. **初始化数据库**
```bash
mysql -u root -p -e "CREATE DATABASE blog_3d CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p blog_3d < backend/blog_3d.sql
```

5. **启动服务**
```bash
# 后端（端口 3000）
cd backend && npm run dev-backend

# 前端（端口 5173）
cd frontend && npm run dev-frontend

# 管理面板（端口 5174）
cd admin && npm run dev-admin
```

### 访问地址

| 服务 | 地址 | 说明 |
|------|------|------|
| 博客前端 | http://localhost:5173 | 博客前台 |
| 管理后台 | http://localhost:5174 | 管理后台（默认账号: admin / admin123） |
| 后端 API | http://localhost:3000 | RESTful API |

## Docker 部署

```bash
cd backend
docker build -t blog-backend .
docker run -d -p 3000:3000 \
  -e DB_HOST=your-db-host \
  -e REDIS_HOST=your-redis-host \
  -v /path/to/uploads:/blog-app/uploads \
  blog-backend
```

## 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| **v3.0** | 2026-07-12 | 移除 Chroma RAG 知识库模块；移除翻译功能；移除前端 AiChatWidget 悬浮聊天组件；管理面板文章编辑器改为 Markdown 独占（移除 wangEditor 富文本编辑器）；全面重构技术文档 |
| v2.2 | 2026-05-20 | 代码审查校准：修正模型字段描述、SEO 实现方式、限流机制说明 |
| v2.1 | 2026-05-20 | 文档重构：补充 Comment 缺失字段、明确 AI 双驱动架构 |
| v2.0 | 2026-05-20 | 集成 Chroma RAG 知识库、AI 流式对话、Redis 限流、Markdown 评论编辑器 |
| v1.0 | 2026-01-15 | 初始版本：三子系统架构、基础 CRUD、AI 写作、JWT 认证 |

## 许可证

本项目基于 MIT 许可证开源。