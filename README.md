# TechMind Blog

> 一个面向全栈开发者的现代化博客系统：前台博客 + 管理后台 + 后端 API + Windows 桌面端（Electron），内置 AI 创作、音乐播放、媒体管理、文章 / 图片抓取、邮件订阅、表情面板与数据备份等完整能力。

[![Node](https://img.shields.io/badge/Node-18%2B-339933?logo=node.js&logoColor=white)](#环境要求)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)](#环境要求)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)](#环境要求)
[![Vue](https://img.shields.io/badge/Vue-3-4FC08D?logo=vue.js&logoColor=white)](#技术栈)
[![License](https://img.shields.io/badge/license-Mulan%20PSL%20v2-blue)](#许可证)

## 目录

- [项目一览](#项目一览)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [生产部署](#生产部署)
- [核心功能](#核心功能)
- [项目结构](#项目结构)
- [配置说明](#配置说明)
- [API 概览](#api-概览)
- [桌面端 (Electron)](#桌面端-electron)
- [常见问题](#常见问题)
- [贡献指南](#贡献指南)
- [文档](#文档)
- [许可证](#许可证)

## 项目一览

| 端 | 技术栈 | 默认端口（dev / prod） | 目录 |
|----|--------|------------------------|------|
| 前台博客 | Vue 3 + Vite + TailwindCSS | 5173 / 80 | [frontend/](file:///e:/code/blog/frontend) |
| 管理后台 | Vue 3 + Vite + Ant Design Vue 4 | 5174 / 81 | [admin/](file:///e:/code/blog/admin) |
| 后端 API | Node.js + Express + Sequelize | 3000 / 3000 | [backend/](file:///e:/code/blog/backend) |
| 桌面端 | Electron + 管理后台 | - | [admin/electron/](file:///e:/code/blog/admin/electron) |

## 技术栈

### 前台博客（frontend）

- 框架：Vue 3 + Vite + TypeScript
- UI：TailwindCSS 4
- 状态：Pinia
- 路由：Vue Router
- 图表：ECharts + ECharts WordCloud
- 编辑器：md-editor-v3（含表情面板、qface、WeChat Emoji）
- 工具：marked、markdown-it-attrs、howler、DOMPurify、vue-m-message

### 管理后台（admin）

- 框架：Vue 3 + Vite + TypeScript
- UI：Ant Design Vue 4 + @ant-design/icons-vue
- 状态：Pinia、VueUse
- 路由：Vue Router
- 图表：ECharts
- 编辑器：md-editor-v3、@vavt/v3-extension（PDF 导出等）
- 桌面端：Electron + electron-builder

### 后端 API（backend）

- 运行时：Node.js 18+ / Express 4
- ORM：Sequelize 6
- 数据库：MySQL 8（mysql2）
- 缓存 / 限流：Redis 7（ioredis）+ express-rate-limit
- 认证：JWT（jsonwebtoken + bcryptjs）
- 上传：Multer + MinIO
- 邮件：Nodemailer（模板化）
- 抓取：cheerio、turndown、fast-xml-parser、iconv-lite
- 文档：Swagger UI（swagger-jsdoc + swagger-ui-express）
- 图像：sharp（表情包压缩）
- 安全：helmet、cors、svg-captcha（图形验证码）
- AI：openai（豆包兼容）、NeteaseCloudMusicApi

### 基础设施

- Docker + Docker Compose
- MySQL 8.0、Redis 7
- Nginx（前台 / 后台独立配置）

## 快速开始

### 环境要求

| 软件 | 最低版本 | 用途 |
|------|----------|------|
| Node.js | 18 | 三端运行时 |
| MySQL | 8.0 | 主数据库 |
| Redis | 7 | 缓存、限流、会话 |

可选服务：

- **MinIO** — 对象存储（媒体库双存储之一）
- **Ollama** — 本地 AI 对话模型

### 1. 准备本地依赖

开发模式需要可访问的 MySQL 和 Redis，连接信息配置在 [backend/.env.development](file:///e:/code/blog/backend/.env.development)（默认 `localhost:3306` / `blog` / `root/root`，Redis `localhost:6379`）。

最简单的方式是用 Docker 启动：

```bash
docker run -d --name blog-mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=blog \
  -p 3306:3306 mysql:8

docker run -d --name blog-redis -p 6379:6379 redis:7
```

也可以使用本机已安装的 MySQL / Redis，并相应修改 [backend/.env.development](file:///e:/code/blog/backend/.env.development)。

### 2. 启动后端

```bash
cd backend
npm install
npm run dev-backend
```

- 默认监听 `http://localhost:3000`
- Swagger 文档：`http://localhost:3000/api-docs`
- 首次启动会自动建表，并写入 `site_configs` 默认配置

### 3. 启动前台博客

```bash
cd frontend
npm install
npm run dev-frontend
```

- 默认 `http://localhost:5173`，`/api`、`/uploads` 已通过 Vite 代理到后端

### 4. 启动管理后台

```bash
cd admin
npm install
npm run dev-admin
```

- 默认 `http://localhost:5174`
- 首次登录账号：`admin` / `admin123`（**生产环境请立即修改**）

> 前台和管理端的 Vite 开发服务器均已将 `/api`、`/uploads` 代理到 `http://localhost:3000`，无需额外配置后端地址。

### 5. 首次使用

1. 启动后端后会自动建表，并写入 `site_configs` 默认配置（站点信息、邮件、上传等）
2. 在管理后台「系统设置」中配置站点名称、站点地址、SMTP 邮件、上传存储（本地 / MinIO）、AI 服务等，**保存后无需重启即可生效**
3. 推荐安装可选服务：MinIO（生产推荐）和 Ollama（本地 AI）

## 生产部署

### Docker Compose 一键部署（推荐）

#### 1. 准备环境变量

```bash
cp .env.examle .env
# 编辑 .env，至少修改 DB_PASSWORD 与 JWT_SECRET
```

#### 2. 构建前端产物

Nginx 容器以卷挂载 `dist/`，**无需 Dockerfile**：

```bash
cd frontend && npm install && npm run build && cd ..
cd admin && npm install && npm run build && cd ..
```

#### 3. 启动完整部署（含管理后台）

```bash
docker-compose up -d --build
```

#### 4. 启动精简部署（仅前台博客 + 后端）

```bash
docker-compose -f docker-compose.client.yml up -d --build
```

#### 部署后访问

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

可直接参考 [nginx/client.conf](file:///e:/code/blog/nginx/client.conf) 与 [nginx/admin.conf](file:///e:/code/blog/nginx/admin.conf) 编写站点配置；前端产物放置于 `dist/`，并反代 `/api/`、`/uploads` 到后端。

## 核心功能

### 前台博客

- **文章浏览**：列表、分类、标签、归档、搜索
- **文章详情**：目录导航、阅读进度、AI 摘要、评论互动（图形验证码防刷）
- **互动能力**：评论、留言板、友链、邮件订阅
- **音乐播放**：底部播放器、歌词同步、播放列表、拖拽面板
- **SEO 与订阅**：响应式布局、SEO 优化、RSS 订阅、Sitemap

### 管理后台

- **仪表盘**：访问统计、热门文章、趋势图表
- **文章管理**：Markdown / HTML 编辑、AI 辅助写作与润色、封面生成、定时发布、版本历史、精选标记（首页精选位展示）
- **AI 创作**：豆包云端模型 + Ollama 本地模型，支持摘要、标签、对话、封面生成
- **媒体库**：双存储（本地 + MinIO）、文件类型筛选、卡片 / 列表视图、存储迁移
- **音乐管理**：网易云 / QQ 音乐搜索导入、歌单管理、手动上传、歌词编辑
- **图片抓取**：Bing / 百度（搜索引擎）、Pexels / Pixabay / Unsplash（图库，API Key 在「系统设置」配置）、dogetu（表情包），瀑布流触底加载、在线预览、批量下载到本地或 MinIO（自动记录作者、来源、授权信息）
- **文章抓取**：按关键词从掘金 / 知乎 / CSDN / 通用 RSS 多平台采集，搜索 → 预览 → 勾选导入为草稿，自动 AI 摘要 / 标签、分类归类，并记录来源平台 / 作者 / 原文链接 / 版权说明（`source_platform` / `source_author` / `source_url` / `source_license`），同一原文自动去重
- **评论管理**：审核、手动 / AI 回复（自动向被回复评论作者发送通知邮件）、对话视图，支持按内容、用户、审核状态搜索
- **GitHub 仓库抓取**：搜索接口受官方前 1000 条结果限制，页码已做钳制与提示
- **友链 / 订阅 / 公告 / 留言管理**
- **系统设置**：站点信息、邮件、上传、AI、爬虫 Token，**保存即生效**
- **数据备份**：手动 / 定时生成 SQL 备份、下载、在线恢复（含上传文件恢复）、删除与按文件名 / 类型 / 时间搜索，备份固定保存在后端 `bakup` 目录
- **表情管理**：编辑器表情数据存入数据库，支持图片表情包管理（手动链接 / 媒体库选择 / 上传，上传自动压缩至 300×300 以内）；管理端与前台 `md-editor-v3` 编辑器均内置表情面板，支持底部 Tab 切换自定义表情、QQNT 表情库（qface，GIF 优先）、WeChat Emoji 与表情包
- **客户端设计**：设计模式，文件存储在 `public/` 静态目录，管理端以文件树管理，直接编写 HTML / CSS / JS 自定义博客客户端页面，内置 `window.BlogAPI` 通用客户端、`window.BlogApi`（全部公开接口封装函数）与 `window.BLOG_CONFIG` 配置（参照「接口文档」与 Swagger），页面以 `/页面目录/` 访问，后端首页 `/` 自动重定向到 `/index/index.html`，支持新建文件 / 目录、重命名、删除、一键预览

### 后端 API

- RESTful API + Swagger 文档（`/api-docs`）
- JWT 认证 + 角色权限控制，滑动续期（响应头 `X-New-Token`）
- 双存储引擎（本地 / MinIO）+ 迁移时自动更新引用（8 个字段：Music.play_url、Music.cover、Music.source、Article.content、Article.cover、Link.avatar、Playlist.cover、SiteConfig.config_value）
- Redis 缓存（热门分类 / 标签、访问统计、限流）
- 邮件通知（评论回复、订阅确认、新文章推送），模板化发送；评论回复邮件中的「查看详情」链接由系统设置中的站点地址（`site_url`）决定
- AI 服务集成（豆包 / Ollama）：文章摘要、标签提取、AI 对话、封面生成、连接测试
- 音乐平台适配器模式（网易云 / QQ 音乐），支持搜索、歌单导入、链接获取
- 图片平台适配器模式（Bing / 百度 / Pexels / Pixabay / Unsplash / dogetu），搜索、原图下载、来源标注；图库平台密钥通过「系统设置」动态配置
- 定时发布调度器、IP 归属地解析、NSFW 内容检测、操作日志记录、评论图形验证码（svg-captcha + Redis）、文章分享计数（Redis 按天聚合）

## 项目结构

```
blog/
├── frontend/                  # 前台博客（Vue 3 + Vite + TailwindCSS）
├── admin/                     # 管理后台（Vue 3 + Vite + Ant Design Vue 4）
│   ├── electron/              # Electron 桌面端入口
│   └── src/
│       ├── components/        # 按领域拆分的子组件
│       ├── composables/       # 组合式逻辑（useMediaLibrary、usePlaylistManage 等）
│       ├── pages/             # 页面
│       ├── stores/            # Pinia
│       └── utils/             # 工具
├── backend/                   # 后端 API（Node.js + Express + Sequelize）
│   ├── bakup/                 # 数据备份文件目录（自动创建，勿修改路径）
│   ├── config/                # 配置与 Swagger
│   ├── email-templates/       # 邮件模板（订阅 / 评论 / 新文章）
│   ├── middleware/            # 中间件（auth、upload、operationLog、errorHandler）
│   ├── models/                # Sequelize 模型
│   ├── prompt/                # AI 提示词模板
│   ├── public/                # 后端静态资源目录（通过链接直接访问，如 /logo.svg）
│   ├── routes/                # 路由
│   ├── services/              # 业务服务
│   │   ├── ai/                # AI（豆包 / Ollama）
│   │   ├── articlePlatforms/  # 文章抓取平台适配器
│   │   ├── imagePlatforms/    # 图片抓取平台适配器
│   │   └── musicPlatforms/    # 音乐平台适配器
│   └── utils/                 # 工具
├── nginx/                     # Nginx 网关配置（client / admin 独立配置）
├── docs/                      # 部署与使用文档
├── docker-compose.yml         # 完整编排（mysql + redis + backend + client + admin）
├── docker-compose.client.yml  # 精简编排（不含管理后台）
├── .env.examle                # 环境变量模板（拷贝为 .env 使用）
└── LICENSE                    # 木兰宽松许可证 v2
```

## 配置说明

### 后端环境变量

开发模式读取 [backend/.env.development](file:///e:/code/blog/backend/.env.development)，生产模式读取 [backend/.env.production](file:///e:/code/blog/backend/.env.production)；Docker 部署通过根目录 [.env.examle](file:///e:/code/blog/.env.examle) + Compose `environment` 注入。

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `BACKEND_PORT` | 后端端口 | `3000` |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | MySQL 连接 | `localhost:3306` / `blog` / `root` |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | Redis 连接 | `localhost:6379` |
| `JWT_SECRET` / `JWT_EXPIRES_IN` / `JWT_REFRESH_THRESHOLD` | JWT 密钥、有效期与滑动续期阈值（秒） | `7d` / `86400` |
| `CORS_ORIGIN` | 允许的跨域来源（逗号分隔，空为允许所有） | 空 |
| `DOUBAO_API_KEY` / `DOUBAO_BASE_URL` / `DOUBAO_CHAT_MODEL` / `DOUBAO_IMAGE_MODEL` | 豆包 AI 配置 | - |
| `OLLAMA_HOST` / `OLLAMA_CHAT_ENABLED` / `OLLAMA_CHAT_MODEL` | Ollama 本地模型配置 | - |

### 管理端环境变量（桌面端）

[admin/.env.production](file:///e:/code/blog/admin/.env.production) 配置：

- `VUE_APP_BACKEND_URL` — 后端 API 地址（桌面端连接后端用，如 `http://192.168.48.1:3000`）
- `VUE_APP_API_URL` — 客户端访问地址（站点根，用于生成文章链接，如 `http://your-domain.com`）

Web 端通过 Vite 代理走 `/api/v1` 相对路径，无需配置后端地址。

### 运行时配置（数据库 `site_configs`）

以下配置通过管理后台「系统设置」管理，**保存即生效，无需重启**：

- **站点信息**：站点名称、站点地址（`site_url`，用于评论回复邮件链接与 Sitemap）、Logo、备案号
- **邮件配置**：SMTP 服务器、发件人账号与授权码、发件人名称（点击「发送测试邮件」可验证）
- **上传配置**：本地 / MinIO 存储切换、文件大小限制
- **AI 配置**：豆包 / Ollama 模型选择、API Key
- **图片抓取 API Key**：Pexels / Pixabay / Unsplash 平台密钥
- **爬虫 Token**：GitHub Token（GitHub 仓库抓取）
- **桌面端配置**（仅 Electron）：后端服务地址、客户端访问地址

> 评论回复邮件中的「查看详情」跳转链接不再使用环境变量（`COMMENT_REPLY_URL_PREFIX` 已移除），统一由「系统设置 → 站点信息 → 站点地址」`site_url` 控制：配置了站点地址时使用 `site_url + /article/<id>?c=<commentId>`，未配置时回退到请求 host。

## 客户端设计（设计模式）

管理后台「客户端设计」允许在不改动代码的前提下，用 HTML / CSS / JS 自由定制博客客户端页面。
自定义页面**以文件形式直接存放在后端静态资源目录 `backend/public/` 下**（不再使用数据库存储），通过链接直接访问，可同时作为静态资源被引用。

### 使用流程

1. 进入管理后台 → **客户端设计** → **新建页面**：在 `public/<名称>/` 下自动生成 `index.html` / `style.css` / `script.js` 模板（模板通过 `<script src="/common.js">` 自动引用公共封装脚本，含 `BlogAPI` 客户端与全部公开接口封装函数 `BlogApi`）
2. 左侧**文件树**管理文件：支持**新建文件 / 新建目录 / 重命名 / 删除 / 刷新**；打开的文件以 **IDE 式标签栏**展示，可多标签切换 / 关闭，未保存内容带 ● 标记（切换不丢失编辑）；在右侧 **Monaco 在线代码编辑器** 中编写代码（语法高亮 + 智能代码提示：`BlogAPI` / `BlogApi` / `BLOG_CONFIG` 自动补全）
3. 点击「保存」**动态写入对应文件**，通过 `/路径` 链接直接访问（如 `/home/`）；「复制地址 / 预览」可快速查看
4. 「接口文档」页签展示**后端全部接口**（由 Swagger 规范实时生成，`GET /api/v1/site/api-docs`），支持按模块 / 关键词筛选与「仅公开」切换；请求示例、参数、请求体、返回示例均带 **语法高亮**；完整文档见 Swagger `/api-docs`

### 页面访问地址

自定义页面直接存放于后端静态目录 `public/` 下，页面 `index.html` 的访问地址为：

```
http://<host>:3000/<页面目录>/
```

后端首页 `GET /` **自动重定向**到自定义首页 `/index/index.html`（若该文件存在）；通过管理端「新建页面」创建名为 `index` 的页面即为站点首页。生产环境（Nginx）下后端反代到站点域名，直接使用域名访问即可。

### 内置全局对象（公共脚本 public/common.js）

封装脚本**统一存放于公共文件 `backend/public/common.js`**（不再内联到每个页面），新建页面模板通过 `<script src="/common.js">` 自动引用，可在管理端「客户端设计」文件树中直接编辑该文件，修改后对所有引用页面即时生效。提供：

- `window.BLOG_CONFIG` — 页面配置：`apiBase`（`/api/v1`）、`siteUrl` 等
- `window.BlogAPI` — 通用 API 客户端：自动携带 `X-Client-Type: blog-client` 请求头，并解包 `{code, message, data}` 响应（`get` / `post` / `put` / `del`）
- `window.BlogApi` — **全部公开接口的封装函数**：`getSiteInfo`、`getSiteStats`、`getArticles`、`getArticle`、`getArticleArchive`、`getArticleComments`、`postArticleComment`、`likeArticle`、`getRelatedArticles`、`getArticleNeighbors`、`getCategories`、`getHotCategories`、`getTags`、`getHotTags`、`getTagArticles`、`getCaptcha`、`getAnnouncements`、`getLatestAnnouncement`、`getLinks`、`getGuestbook`、`postGuestbook`、`getEmojiPacks`、`getPublicPlaylist`

```js
// 示例：加载文章列表与站点信息
const list = await BlogApi.getArticles({ page: 1, pageSize: 10 });
const info = await BlogApi.getSiteInfo();
document.title = info.site_name;

// 兜底：也可直接使用通用客户端
// const list = await BlogAPI.get('/articles', { page: 1, pageSize: 10 });
```

### 静态资源目录

`backend/public/` 为后端静态资源目录，放入的文件可通过链接直接访问（如站点 Logo 放置为 `public/logo.svg` 后以 `/logo.svg` 引用），支持 HTML / CSS / JS / 图片等任意静态资源；目录请求（如 `/home/`）会自动返回其中的 `index.html`。

> 注：早期版本使用 `client_pages` 数据库表存储自定义页面，现已改为文件存储并直接存放于 `public/` 根目录（曾用 `public/client-pages/<slug>/` 子目录，升级时旧目录会自动迁移到 `public/<slug>/`）。

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
| 媒体 | `/api/v1/media` | 本地 / MinIO 媒体库（支持单文件 / 批量迁移） |
| 上传 | `/api/v1/upload`、`/api/v1/comment-upload` | 文件与评论图片上传 |
| 音乐 | `/api/v1/music`、`/api/v1/playlists` | 音乐搜索导入、歌单、上传 |
| AI | `/api/v1/ai` | 摘要、对话、自动回复、连接测试 |
| 抓取 | `/api/v1/crawler`、`/api/v1/image-crawler`、`/api/v1/article-crawler` | GitHub 仓库、图片与多平台文章抓取 |
| 站点 | `/api/v1/site` | 站点信息、统计 |
| 管理 | `/api/v1/admin` | 仪表盘统计、系统设置、测试邮件、操作日志、数据导出 |
| 操作日志 | `/api/v1/operation-logs` | 管理端写操作审计 |
| 数据备份 | `/api/v1/backups` | 在线 / 定时备份、下载、恢复、删除、搜索与定时配置 |
| 表情管理 | `/api/v1/emojis` | 编辑器表情数据查询与后台增删改查 |
| 表情包 | `/api/v1/emoji-packs` | 图片表情包查询、增删改查与上传压缩 |
| 自定义页面 | `/api/v1/client-pages` | 客户端设计模式：public 目录文件管理（文件树 / 文件 / 目录 / 页面模板，公开访问地址 `/页面目录/`） |
| RSS / Sitemap | `/api/v1/rss`、`/sitemap.xml` | 订阅与站点地图 |

## 桌面端（Electron）

管理后台可打包为 Windows 桌面应用，所有 `VUE_APP_*` 配置通过 [.env.production](file:///e:/code/blog/admin/.env.production) 注入，随包分发到 asar 作为只读模板。

### 开发模式

```bash
cd admin
npm run electron:dev
```

### 打包安装版

```bash
npm run electron:build
```

### 打包便携版

```bash
npm run electron:build:portable
```

### 桌面端配置

桌面端首次启动时，Electron 会将 `.env.production` 模板复制到 `userData` 目录（`%APPDATA%/Blog管理后台/`）作为可写副本，后续管理端对 `VUE_APP_BACKEND_URL` / `VUE_APP_API_URL` 的修改均写入该副本。升级场景下会自动从模板补全新字段，并修复旧版本 `VUE_APP_API_URL` 被污染为后端地址的问题。

## 常见问题

### 评论回复邮件收不到？

1. 在「系统设置 → 邮件配置」确认 SMTP 账号与授权码正确，并点击「发送测试邮件」验证
2. 在「系统设置 → 站点信息」填写站点地址 `site_url`（决定邮件中「查看详情」链接）
3. 被回复的评论需要有作者邮箱（前台 QQ 评论会自动携带邮箱）
4. 管理员回复自己发布的评论会跳过通知（页面会提示「已跳过」）
5. 查看后端控制台中 `[Mail]`、`[Comments]` 日志确认发送结果

### 管理后台如何搜索评论？

评论管理页支持按**评论内容**、**评论用户**（昵称 / 邮箱 / 登录账号）与**审核状态**组合搜索。

### 默认管理员密码是什么？

`admin` / `admin123`，生产环境请务必修改。

### 媒体库如何在本地和 MinIO 之间迁移？

媒体列表支持「单文件迁移」和「批量迁移」两种操作。迁移成功后会自动更新以下 8 个字段的引用：`Music.play_url`、`Music.cover`、`Music.source`、`Article.content`、`Article.cover`、`Link.avatar`、`Playlist.cover`、`SiteConfig.config_value`，并删除原存储位置的源文件。

### 删除音乐时为什么也要清理歌单关联？

后端会先删除 `playlist_songs` 表中关联的记录（`PlaylistSong.destroy({ where: { music_id } })`），再删除音乐，避免外键引用悬挂。

## 贡献指南

- 发现问题或有改进建议，欢迎提交 Issue 或 Pull Request
- 代码改动请保持与现有风格一致（后端 Express 中间件 + Sequelize 模型，前端 Vue 3 组合式 API + TypeScript）
- 涉及环境变量、接口或功能变更时，请同步更新本 README 与 [docs/USAGE.md](file:///e:/code/blog/docs/USAGE.md)

## 文档

- [使用与部署文档](file:///e:/code/blog/docs/USAGE.md)：开发启动、生产部署、配置管理与桌面端使用
- [MinIO 部署指南](file:///e:/code/blog/docs/Minio部署.md)
- [Swagger API 文档](http://localhost:3000/api-docs)（本地启动后端后访问）

## 许可证

本项目基于 [木兰宽松许可证 v2](file:///e:/code/blog/LICENSE) 开源。

Copyright (c) TechMind Blog is licensed under Mulan PSL v2.
