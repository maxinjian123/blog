# TechMind Blog

一个功能完整的全栈博客系统，包含**前台博客**、**管理后台**与**后端 API** 三端，集成 AI 辅助写作、音乐播放、媒体管理、邮件订阅与通知等丰富能力。管理后台同时支持打包为 Windows 桌面应用（Electron）。

## 目录

- [功能特性](#功能特性)
- [项目结构](#项目结构)
- [技术栈](#技术栈)
- [核心功能](#核心功能)
- [快速开始](#快速开始)
- [生产部署](#生产部署)
- [配置说明](#配置说明)
- [API 概览](#api-概览)
- [常见问题](#常见问题)
- [贡献指南](#贡献指南)
- [文档](#文档)
- [许可证](#许可证)

## 功能特性

- **AI 创作增强**：AI 辅助写作与润色、自动标签/摘要、按文章内容生成封面，支持豆包云端模型与 Ollama 本地模型
- **富文本编辑**：Markdown 编辑器（md-editor-v3），支持表情、导出 PDF、定时发布、版本历史、Markdown 导入、精选文章标记（首页精选位展示）
- **媒体与抓取**：双存储媒体库（本地 + MinIO）、图片/音乐/GitHub 仓库抓取与导入、多平台文章采集（按关键词搜索掘金 / 知乎 / CSDN / 通用 RSS 的文章，预览后导入为草稿并记录来源与版权信息）
- **互动能力**：评论（图形验证码防刷 + 管理员回复邮件通知）、留言板、友链、邮件订阅与通知
- **运维友好**：Docker Compose 一键部署、Swagger API 文档、Nginx 网关配置、操作日志审计
- **数据备份**：管理后台在线/定时备份 MySQL 数据、下载备份文件、在线恢复、删除与条件搜索，备份固定保存在后端 `bakup` 目录
- **表情管理**：编辑器表情数据存入数据库，管理后台可新增、编辑、停用、删除与分类排序；支持图片表情包管理（手动链接 / 媒体库选择 / 上传，上传自动压缩至 300×300 以内）；管理端与前台客户端 md-editor-v3 编辑器均内置表情面板，支持底部 Tab 切换自定义表情、QQNT 表情库（qface，GIF 优先）、WeChat Emoji 与表情包，表情统一以 Markdown 图片语法插入

## 项目结构

```
blog/
├── frontend/          # 前台博客（Vue 3 + Vite + TailwindCSS）
├── admin/             # 管理后台（Vue 3 + Vite + Ant Design Vue 4，含 Electron 桌面端）
├── backend/           # 后端 API（Node.js + Express + Sequelize）
│   └── bakup/         # 数据备份文件目录（自动创建，勿修改路径）
├── nginx/             # Nginx 网关配置（client / admin 独立配置）
├── docs/              # 部署与使用文档
├── docker-compose.yml          # 完整编排（mysql + redis + backend + client + admin）
├── docker-compose.client.yml   # 精简编排（不含管理后台）
├── .env.examle        # 环境变量模板（仓库命名为 .env.examle，拷贝为 .env 使用）
└── LICENSE            # 木兰宽松许可证 v2
```

## 技术栈

| 端 | 框架 | 主要依赖 |
|----|------|----------|
| 前台博客 | Vue 3 + Vite | TailwindCSS、Pinia、Vue Router、ECharts、md-editor-v3、qface、marked、howler |
| 管理后台 | Vue 3 + Vite | Ant Design Vue 4、Pinia、Vue Router、ECharts、md-editor-v3、@vavt/v3-extension、qface、Electron |
| 后端 | Node.js + Express | Sequelize、MySQL、Redis、JWT、Multer、MinIO、Nodemailer、Swagger、sharp、svg-captcha |
| 基础设施 | Docker + Nginx | MySQL 8.0、Redis 7、Nginx 网关 |

## 核心功能

### 前台博客

- 文章浏览、分类、标签、归档、搜索
- 文章详情：目录导航、阅读进度、AI 摘要、评论互动（图形验证码防刷）
- 留言板、友情链接、邮件订阅
- 底部音乐播放器（歌词同步、播放列表、拖拽面板）
- 响应式设计、SEO 优化、RSS 订阅、Sitemap

### 管理后台

- 仪表盘：访问统计、热门文章、趋势图表
- 文章管理：Markdown/HTML 编辑、AI 辅助写作与润色、封面生成、定时发布、精选标记（编辑页开启后展示于首页精选位）
- 分类 / 标签 / 留言 / 公告管理
- 评论管理：审核、手动 / AI 回复（自动向被回复评论作者发送通知邮件）、对话视图，支持按评论内容、评论用户、审核状态搜索
- 媒体库：双存储（本地 + MinIO）、文件类型筛选、卡片/列表视图、存储迁移
- 音乐管理：网易云/QQ 音乐搜索导入、歌单管理、手动上传、歌词编辑
- 图片抓取：Bing / 百度（搜索引擎）、Pexels / Pixabay / Unsplash（图库，需在「系统设置」配置 API Key）、dogetu（表情包），瀑布流触底加载、在线预览、批量下载到本地或 MinIO（自动记录作者、来源、授权信息）
- 文章抓取：按关键词从掘金 / 知乎 / CSDN / 通用 RSS 多平台采集文章，搜索→预览→勾选导入为草稿，自动 AI 摘要/标签、分类归类，并记录来源平台 / 作者 / 原文链接 / 版权说明（source_platform / source_author / source_url / source_license），同一原文自动去重
- 友链管理、邮件订阅管理、系统设置（站点信息 / 邮件 / 上传 / AI / 图片抓取 API Key / 爬虫 Token，保存即生效）
- GitHub 仓库抓取（搜索接口受官方前 1000 条结果限制，页码已做钳制与提示）
- 数据备份：手动/定时生成 SQL 备份、下载到本机、在线恢复（含上传文件恢复）、删除与按文件名/类型/时间搜索

### 后端 API

- RESTful API + Swagger 文档（`/api-docs`）
- JWT 认证 + 角色权限控制，滑动续期（`X-New-Token`）
- 双存储引擎（本地 / MinIO）+ 迁移时自动更新引用
- Redis 缓存（热门分类/标签、访问统计、限流）
- 邮件通知（评论回复、订阅确认、新文章推送），模板化发送；评论回复邮件中的“查看详情”链接由系统设置中的站点地址（`site_url`）决定
- AI 服务集成（豆包 / Ollama）：文章摘要、标签提取、AI 对话、封面生成、连接测试
- 音乐平台适配器模式（网易云 / QQ 音乐），支持搜索、歌单导入、链接获取
- 图片平台适配器模式（Bing / 百度 / Pexels / Pixabay / Unsplash / dogetu），搜索、原图下载、来源标注；图库平台密钥通过「系统设置」动态配置
- 定时发布调度器、IP 归属地解析、NSFW 内容检测、操作日志记录、评论图形验证码（svg-captcha + Redis）、文章分享计数（Redis 按天聚合）

## 快速开始

### 环境要求

| 软件 | 最低版本 | 用途 |
|------|---------|------|
| Node.js | 18 | 三端运行时 |
| MySQL | 8.0 | 数据库 |
| Redis | 7 | 缓存、限流、会话 |

可选服务：MinIO（对象存储）、Ollama（本地 AI 模型）。

### 准备本地依赖（MySQL / Redis）

本地开发需要可访问的 MySQL 与 Redis，连接信息在 `backend/.env.development` 中配置（默认 `localhost:3306`，`blog` 库，`root/root`；Redis `localhost:6379`）。可使用 Docker 快速启动：

```bash
docker run -d --name blog-mysql -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=blog -p 3306:3306 mysql:8
docker run -d --name blog-redis -p 6379:6379 redis:7
```

也可以使用已安装的 MySQL/Redis 实例，并相应修改 `backend/.env.development`。

### 开发模式启动

```bash
# 克隆项目
git clone <repository-url>
cd blog

# 1. 启动后端（默认 http://localhost:3000，Swagger 在 /api-docs）
cd backend
npm install
npm run dev-backend

# 2. 启动前台博客（默认 http://localhost:5173）
cd ../frontend
npm install
npm run dev-frontend

# 3. 启动管理后台（默认 http://localhost:5174，首次登录 admin / admin123）
cd ../admin
npm install
npm run dev-admin
```

前端与管理端的 Vite 开发服务器均将 `/api`、`/uploads` 代理到 `http://localhost:3000`，无需额外配置后端地址。

### 首次使用

1. 启动后端后自动建表，并写入 `site_configs` 默认配置（站点信息、邮件、上传等）
2. 管理后台首次登录使用默认账号 `admin` / `admin123`（**生产环境请立即修改**）
3. 在「系统设置」中配置站点名称与地址、SMTP 邮件、上传存储（本地 / MinIO）、AI 服务等，保存后无需重启即可生效

### Electron 桌面端（管理后台）

```bash
cd admin
npm run electron:dev          # 开发模式
npm run electron:build        # 打包安装版
npm run electron:build:portable  # 打包便携版
```

## 生产部署

### Docker Compose 一键部署（推荐）

```bash
# 1. 准备环境变量
cp .env.examle .env
# 编辑 .env，至少修改 DB_PASSWORD 与 JWT_SECRET

# 2. 构建前端产物（Nginx 容器以卷挂载 dist/，无需 Dockerfile）
cd frontend && npm install && npm run build && cd ..
cd admin && npm install && npm run build && cd ..

# 3. 完整部署（含管理后台）
docker-compose up -d --build

# 4. 精简部署（仅前台博客 + 后端）
docker-compose -f docker-compose.client.yml up -d --build
```

部署后访问：

| 服务 | 地址 |
|------|------|
| 前台博客 | `http://your-server-ip:80` |
| 管理后台 | `http://your-server-ip:81` |
| 后端 API | `http://your-server-ip:3000/api/v1` |
| Swagger | `http://your-server-ip:3000/api-docs` |

### 手动部署（不使用 Docker）

```bash
# 后端
cd backend && npm install --production && npm run start-backend

# 前台 / 管理后台：构建后由 Nginx 托管 dist/
cd frontend && npm install && npm run build
cd ../admin && npm install && npm run build
```

手动部署时可直接参考 [nginx/client.conf](nginx/client.conf) 与 [nginx/admin.conf](nginx/admin.conf) 编写站点配置；前端产物放置于 `dist/`，并反代 `/api/`、`/uploads` 到后端。

## 配置说明

### 后端环境变量

开发模式读取 `backend/.env.development`，生产模式读取 `backend/.env.production`；Docker 部署通过根目录 `.env` + Compose `environment` 注入。

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `BACKEND_PORT` | 后端端口 | `3000` |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | MySQL 连接 | `localhost:3306` / `blog` / `root` |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | Redis 连接 | `localhost:6379` |
| `JWT_SECRET` / `JWT_EXPIRES_IN` / `JWT_REFRESH_THRESHOLD` | JWT 密钥、有效期与滑动续期阈值 | `7d` / `86400` |
| `CORS_ORIGIN` | 允许的跨域来源（逗号分隔，空为允许所有） | 空 |
| `DOUBAO_API_KEY` / `DOUBAO_BASE_URL` / `DOUBAO_CHAT_MODEL` / `DOUBAO_IMAGE_MODEL` | 豆包 AI 配置 | - |
| `OLLAMA_HOST` / `OLLAMA_CHAT_ENABLED` / `OLLAMA_CHAT_MODEL` | Ollama 本地模型配置 | - |

### 管理端环境变量

`admin/.env.production` 配置 `VUE_APP_BACKEND_URL`（桌面端连接后端地址）与 `VUE_APP_API_URL`（客户端访问地址）；Web 端通过 Vite 代理走 `/api/v1` 相对路径，无需配置后端地址。

### 运行时配置（数据库 `site_configs`）

邮件、上传（MinIO）、站点信息、AI 服务、爬虫 Token 等通过管理后台「系统设置」管理，存储在数据库 `site_configs` 表，**无需重启即可生效**：

- **站点信息**：站点名称、站点地址（`site_url`，用于评论回复邮件链接与 Sitemap）、Logo、备案号
- **邮件配置**：SMTP 服务器、发件人账号与授权码、发件人名称（配置后点击“发送测试邮件”可验证）
- **上传配置**：本地 / MinIO 存储切换、文件大小限制
- **AI 配置**：豆包 / Ollama 模型选择、API Key
- **图片抓取 API Key**：Pexels / Pixabay / Unsplash 平台密钥（在「图片抓取」页面使用对应图库平台）
- **爬虫 Token**：GitHub Token（GitHub 仓库抓取）
- **桌面端配置**（仅 Electron 环境）：后端服务地址、客户端访问地址

> 评论回复邮件中的“查看详情”跳转链接不再使用环境变量（`COMMENT_REPLY_URL_PREFIX` 已移除），统一由「系统设置 → 站点信息 → 站点地址」`site_url` 控制：配置了站点地址时使用 `site_url + /article/<id>?c=<commentId>`，未配置时回退到请求 host。

## API 概览

所有接口以 `/api/v1` 为前缀（RSS / Sitemap 除外），管理端接口需要携带 `Authorization: Bearer <token>` 且角色为 `admin`。完整参数与响应示例见 [Swagger 文档](http://localhost:3000/api-docs)。

| 模块 | 路径 | 说明 |
|------|------|------|
| 认证 | `/api/v1/auth` | 登录、注册、当前用户 |
| 验证码 | `/api/v1/captcha` | 评论图形验证码生成 |
| 文章 | `/api/v1/articles` | 文章 CRUD、评论（验证码）、点赞、分享计数；列表支持 `featured` 精选筛选 |
| 评论 | `/api/v1/comments` | 审核、回复（邮件通知）、AI 回复、对话视图、按内容 / 用户搜索 |
| 分类 / 标签 | `/api/v1/categories`、`/api/v1/tags` | 分类与标签管理 |
| 公告 | `/api/v1/announcements` | 公告发布与管理 |
| 留言板 | `/api/v1/guestbook` | 留言发布与管理 |
| 友链 | `/api/v1/links` | 友情链接 |
| 订阅 | `/api/v1/subscribers` | 邮件订阅、确认、退订 |
| 媒体 | `/api/v1/media` | 本地 / MinIO 媒体库 |
| 上传 | `/api/v1/upload`、`/api/v1/comment-upload` | 文件与评论图片上传 |
| 音乐 | `/api/v1/music`、`/api/v1/playlists` | 音乐搜索导入、歌单、上传 |
| AI | `/api/v1/ai` | 摘要、对话、自动回复、连接测试 |
| 抓取 | `/api/v1/crawler`、`/api/v1/image-crawler`、`/api/v1/article-crawler` | GitHub 仓库、图片与多平台文章抓取 |
| 站点 | `/api/v1/site` | 站点信息、统计 |
| 管理 | `/api/v1/admin` | 仪表盘统计、系统设置、测试邮件、操作日志、数据导出 |
| 操作日志 | `/api/v1/operation-logs` | 管理端写操作审计 |
| 数据备份 | `/api/v1/backups` | 在线/定时备份、下载、恢复、删除、搜索与定时配置 |
| 表情管理 | `/api/v1/emojis` | 编辑器表情数据查询与后台增删改查 |
| 表情包 | `/api/v1/emoji-packs` | 图片表情包查询、增删改查与上传压缩 |
| RSS / Sitemap | `/api/v1/rss`、`/sitemap.xml` | 订阅与站点地图 |

## 常见问题

### 评论回复邮件收不到？

1. 在「系统设置 → 邮件配置」确认 SMTP 账号与授权码正确，并点击“发送测试邮件”验证
2. 在「系统设置 → 站点信息」填写站点地址 `site_url`（决定邮件中“查看详情”链接）
3. 被回复的评论需要有作者邮箱（前台 QQ 评论会自动携带邮箱）
4. 管理员回复自己发布的评论会跳过通知（页面会提示“已跳过”）
5. 查看后端控制台中 `[Mail]`、`[Comments]` 日志确认发送结果

### 管理后台如何搜索评论？

评论管理页支持按**评论内容**、**评论用户**（昵称 / 邮箱 / 登录账号）与**审核状态**组合搜索。

### 默认管理员密码是什么？

`admin` / `admin123`，生产环境请务必修改。

## 贡献指南

- 发现问题或有改进建议，欢迎提交 Issue 或 Pull Request
- 代码改动请保持与现有风格一致（后端 Express 中间件 + Sequelize 模型，前端 Vue 3 组合式 API + TypeScript）
- 涉及环境变量、接口或功能变更时，请同步更新本 README 与 [docs/USAGE.md](docs/USAGE.md)

## 文档

- [使用与部署文档](docs/USAGE.md)：开发启动、生产部署、配置管理与桌面端使用
- [MinIO 部署指南](docs/Minio部署.md)
- [Swagger API 文档](http://localhost:3000/api-docs)（本地启动后端后访问）

## 许可证

本项目基于 [木兰宽松许可证 v2](LICENSE) 开源。

Copyright (c) TechMind Blog is licensed under Mulan PSL v2.
