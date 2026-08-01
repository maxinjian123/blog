# TechMind Blog

一个功能完整的全栈博客系统，包含前台博客、管理后台和后端 API 三端，集成了 AI 辅助写作、音乐播放、媒体管理、邮件订阅等丰富功能。

## 项目结构

```
blog/
├── frontend/          # 前台博客（Vue 3 + TailwindCSS）
├── admin/             # 管理后台（Vue 3 + Ant Design Vue）
├── backend/           # 后端 API（Express + Sequelize）
├── nginx/             # Nginx 网关配置
├── docker-compose.yml # 容器编排
└── LICENSE            # 木兰宽松许可证 v2
```

## 技术栈

| 端 | 框架 | 主要依赖 |
|----|------|----------|
| 前台博客 | Vue 3 + Vite | TailwindCSS、Pinia、Vue Router、ECharts、md-editor-v3 |
| 管理后台 | Vue 3 + Vite | Ant Design Vue 4、Pinia、Vue Router、ECharts、md-editor-v3 |
| 后端 | Node.js + Express | Sequelize、MySQL、Redis、JWT、Multer、MinIO、Nodemailer、Swagger |
| 基础设施 | Docker + Nginx | MySQL 8.0、Redis 7、Nginx 网关 |

## 核心功能

### 前台博客
- 文章浏览、分类、标签、归档、搜索
- 文章详情：目录导航、阅读进度、AI 摘要、评论互动
- 留言板、友情链接、邮件订阅
- 底部音乐播放器（歌词同步、播放列表、拖拽面板）
- 响应式设计、SEO 优化、RSS 订阅、Sitemap

### 管理后台
- 仪表盘：访问统计、热门文章、趋势图表
- 文章管理：Markdown/HTML 编辑、AI 辅助写作与润色、封面生成、定时发布
- 分类 / 标签 / 评论 / 留言 / 公告管理
- 媒体库：双存储（本地 + MinIO）、文件类型筛选、卡片/列表视图、存储迁移
- 音乐管理：网易云/QQ 音乐搜索导入、歌单管理、手动上传、歌词编辑
- 图片抓取：Bing / 百度图片、dogetu 表情包，瀑布流触底加载、在线预览、批量下载到本地或 MinIO（自动记录作者、来源、授权信息）
- 友链管理、邮件订阅管理、系统设置
- GitHub 仓库抓取（搜索接口受官方前 1000 条结果限制，页码已做钳制与提示）

### 后端 API
- RESTful API + Swagger 文档（`/api-docs`）
- JWT 认证 + 角色权限控制
- 双存储引擎（本地 / MinIO）+ 迁移时自动更新引用
- Redis 缓存（热门分类/标签、访问统计、限流）
- 邮件通知（评论回复、订阅确认、新文章推送），模板化发送
- AI 服务集成（豆包 / Ollama）：文章摘要、标签提取、AI 对话、封面生成
- 音乐平台适配器模式（网易云 / QQ 音乐），支持搜索、歌单导入、链接获取
- 图片平台适配器模式（Bing / 百度 / dogetu），搜索、原图下载、来源标注
- 定时发布调度器、IP 归属地解析、NSFW 内容检测

## 快速开始

### 环境要求

- Node.js >= 18
- MySQL 8.0
- Redis 7
- （可选）MinIO（对象存储）
- （可选）Ollama（本地 AI 对话）

### 1. 克隆项目

```bash
git clone <repository-url>
cd blog
```

### 2. 启动后端

```bash
cd backend
npm install
cp .env.development .env.development.local  # 按需修改配置
npm run dev-backend
```

后端启动后会自动：
- 同步数据库模型（`sequelize.sync()`）
- 加载站点配置、邮件配置、上传配置
- 启动定时发布调度器
- 验证邮件服务连接

默认运行在 `http://localhost:3000`，Swagger 文档位于 `http://localhost:3000/api-docs`。

### 3. 启动前台博客

```bash
cd frontend
npm install
npm run dev-frontend
```

默认运行在 `http://localhost:5173`。

### 4. 启动管理后台

```bash
cd admin
npm install
npm run dev-admin
```

默认运行在 `http://localhost:5174`，首次访问需登录（默认管理员账号 `admin` / `admin123`，可通过种子脚本或数据库初始化）。

## 环境变量配置

### 后端（backend/.env.development）

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `BACKEND_PORT` | 后端端口 | `3000` |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | MySQL 连接 | `localhost:3306` |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | Redis 连接 | `localhost:6379` |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | JWT 密钥与有效期 | `7d` |
| `DOUBAO_API_KEY` / `DOUBAO_BASE_URL` / `DOUBAO_CHAT_MODEL` / `DOUBAO_IMAGE_MODEL` | 豆包 AI 配置 | - |
| `OLLAMA_HOST` / `OLLAMA_CHAT_ENABLED` / `OLLAMA_CHAT_MODEL` | Ollama 本地模型 | - |
| `CORS_ORIGIN` | 允许的跨域来源（逗号分隔） | `*` |
| `COMMENT_REPLY_URL_PREFIX` | 评论回复邮件跳转前缀 | - |

> 邮件、上传（MinIO）、站点名称等运行时配置通过管理后台「系统设置」管理，存储在 `site_configs` 表，无需重启即可生效。

### 前端

前端通过 Vite 代理将 `/api` 和 `/uploads` 请求转发到后端（`http://localhost:3000`），无需额外环境变量。

## Docker 部署

项目提供了完整的 Docker 编排，一键启动所有服务：

```bash
# 在项目根目录创建 .env 文件，配置以下变量：
# MYSQL_ROOT_PASSWORD, MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD
# REDIS_PASSWORD, JWT_SECRET
# 可选：BACKEND_IMAGE, FRONTEND_IMAGE, ADMIN_IMAGE

docker-compose up -d
```

启动后的服务端口：

| 服务 | 容器端口 | 主机端口 | 说明 |
|------|----------|----------|------|
| Nginx 网关 | 80 / 443 | 80 / 443 | 统一入口，反向代理三端 |
| 前台博客 | 80 | 8080 | 主站 |
| 管理后台 | 80 | 8081 | 后台 |
| 后端 API | 3000 | 127.0.0.1:3000 | API 服务 |
| MySQL | 3306 | 127.0.0.1:3306 | 数据库 |
| Redis | 6379 | 127.0.0.1:6379 | 缓存 |

Nginx 网关路由规则（见 [nginx/gateway.conf](nginx/gateway.conf)）：
- `/api/*` → 后端 API
- `/uploads/*` → 后端静态文件
- `/admin` → 管理后台
- `/` → 前台博客

## API 概览

所有 API 以 `/api/v1` 为前缀，完整文档见 `http://localhost:3000/api-docs`。

| 模块 | 路径前缀 | 说明 |
|------|----------|------|
| 认证 | `/api/v1/auth` | 登录、注册、刷新 token |
| 文章 | `/api/v1/articles` | 文章 CRUD、详情、分页 |
| 评论 | `/api/v1/comments` | 评论树、回复、点赞 |
| 分类 | `/api/v1/categories` | 分类管理 |
| 标签 | `/api/v1/tags` | 标签管理 |
| 媒体 | `/api/v1/media` | 媒体库、存储迁移 |
| 音乐 | `/api/v1/music` | 音乐搜索、导入、上传 |
| 歌单 | `/api/v1/playlists` | 歌单管理 |
| 友链 | `/api/v1/links` | 友链管理 |
| 留言 | `/api/v1/guestbook` | 留言板 |
| 订阅 | `/api/v1/subscribers` | 邮件订阅 |
| 公告 | `/api/v1/announcements` | 公告管理 |
| 站点 | `/api/v1/site` | 站点信息、配置 |
| AI | `/api/v1/ai` | AI 对话、摘要、标签、封面 |
| 抓取 | `/api/v1/crawler` | GitHub 仓库抓取 |
| 图片抓取 | `/api/v1/image-crawler` | Bing/百度/dogetu 搜索、单张与批量下载 |
| 上传 | `/api/v1/upload` | 通用文件上传 |
| RSS | `/api/v1/rss` | RSS 订阅源 |
| Sitemap | `/` | 站点地图 |

统一响应格式：

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

分页响应格式：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [],
    "pagination": { "page": 1, "pageSize": 10, "total": 0, "totalPages": 0 }
  }
}
```

### 图片抓取模块

管理端「数据抓取 → 图片抓取」页面，通过单选框在以下平台间切换：

| 平台 | ID | 类型 | 数据来源 |
|------|-----|------|----------|
| Bing 图片 | `bing` | 图片 | 解析 Bing 图片异步搜索接口返回的元数据 |
| 百度图片 | `baidu` | 图片 | 百度图片官方 JSON 接口（acjson） |
| dogetu 表情包 | `dogetu` | 表情包 | 搜索页 + 详情页 HTML 解析 |

- 前端使用 CSS 瀑布流 + 触底自动加载下一页（节流 200ms + 防抖 150ms）
- 支持单张 / 批量（最多 20 张）下载到本地或 MinIO 媒体库
- 图片元数据（作者、来源页、授权）随下载写入 `media_files` 表
- 版权提示：图片来源网络，版权归原作者所有，商业使用需先获得授权

## 数据模型

核心模型定义在 [backend/models/](backend/models/)：

| 模型 | 说明 | 关键字段 |
|------|------|----------|
| User | 用户 | username, email, password, role |
| Article | 文章 | title, slug, content, cover, status, catalog |
| Category | 分类 | name, slug |
| Tag | 标签 | name, slug |
| Comment | 评论 | content, parent_id（树形结构） |
| Message | 留言 | content, parent_id（树形结构） |
| Link | 友链 | name, url, avatar, category |
| MediaFile | 媒体文件 | filename, original_name, mime_type, storage, url, author, source_url, license, source_platform |
| Music | 音乐 | name, singer, cover, play_url, source, lyric |
| Playlist | 歌单 | name, cover, share_code |
| PlaylistSong | 歌单歌曲 | playlist_id, music_id |
| Subscriber | 订阅者 | email, status |
| SiteConfig | 站点配置 | config_key, config_value, category |
| Announcement | 公告 | title, content |
| ArticleVersion | 文章版本 | article_id, content |
| VisitorLog | 访问日志 | article_id, ip, user_agent |

## 开发约定

### 后端
- 路由统一注册在 [backend/routes/index.js](backend/routes/index.js)
- 响应统一使用 `success()` / `error()` / `paginated()` 工具函数
- 配置通过 `configService` 管理，支持运行时热更新
- 音乐平台采用适配器模式（`services/musicPlatforms/`），图片平台同样采用适配器模式（`services/imagePlatforms/`），扩展新平台仅需实现接口并在 `index.js` 注册
- 媒体文件迁移后自动更新所有引用（音乐 play_url/source、文章内容、封面、友链头像、歌单封面、站点配置）
- 图片抓取下载到媒体库时自动写入 `author` / `source_url` / `license` / `source_platform`，便于版权追溯
- 外部抓取均带请求频率控制（1.5s ~ 2s 间隔）并声明爬虫 UA，避免对目标站点造成压力

### 前端
- 状态管理使用 Pinia，独立数据源分离避免冲突
- API 请求通过 axios 实例统一拦截（token 注入、错误处理）
- 大型页面拆分为子组件 + composables（如媒体库、歌单管理）
- 表单字段使用 `defineModel` 实现双向绑定
- 布局偏好（卡片/列表）持久化到 localStorage

## 开发脚本

```bash
# 后端
cd backend
npm run dev-backend    # 开发模式（nodemon 热重载）
npm run start-backend  # 生产模式

# 前台
cd frontend
npm run dev-frontend   # 开发模式
npm run build          # 生产构建
npm run build:analyze  # 构建并分析包体积

# 管理后台
cd admin
npm run dev-admin      # 开发模式
npm run build          # 类型检查 + 生产构建
```

## 许可证

本项目基于 [木兰宽松许可证 v2](LICENSE) 开源。

Copyright (c) TechMind Blog is licensed under Mulan PSL v2.
