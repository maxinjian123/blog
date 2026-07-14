# TechMind Blog 架构文档

## 一、系统架构概览

### 1.1 整体架构

TechMind Blog 采用经典的前后端分离架构，包含三个独立子系统：

```
┌─────────────────────────────────────────────────────────────┐
│                       前端 (frontend)                        │
│             Vue 3 + Tailwind CSS v4 + Vite 6                │
│             端口 5173 · 面向访客用户                         │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP (REST API)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     管理面板 (admin)                         │
│            Vue 3 + Ant Design Vue 4 + Vite 6                │
│             端口 5174 · 面向管理员                           │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP (REST API)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    后端服务 (backend)                        │
│              Express 4 + Sequelize + Redis                   │
│                   端口 3000 · RESTful API                    │
├─────────────────┬─────────────────┬─────────────────────────┤
│    MySQL 数据库  │    Redis 缓存   │  AI 引擎 (双驱动)        │
│    (blog_3d)    │  (验证码/限流)  │  豆包 API + Ollama 本地   │
└─────────────────┴─────────────────┴─────────────────────────┘
```

### 1.2 架构决策记录 (ADR)

#### ADR-001: 采用三子系统分离架构

- **状态**: 已采纳
- **上下文**: 需要同时面向访客和管理员提供不同体验的界面，且前后端需要独立部署扩展
- **决策**: 将系统拆分为 frontend（博客前台）、admin（管理面板）、backend（后端 API）三个独立子系统
- **理由**: 前台和管理员界面风格差异大（Tailwind CSS vs Ant Design Vue），独立构建可优化各自部署；后端 API 统一复用
- **影响**: 需要维护三个 `package.json`，三个开发服务器，构建配置各自独立

#### ADR-002: 使用 MySQL + Sequelize ORM

- **状态**: 已采纳
- **上下文**: 需要关系型数据库存储文章、分类、标签、评论等结构化数据，支持多对多关联和嵌套查询
- **决策**: 使用 MySQL 数据库 + Sequelize ORM
- **理由**: 数据关系明确（文章↔标签多对多，评论自关联嵌套），Sequelize 提供模型关联、迁移、验证等能力
- **影响**: 需要维护数据库迁移脚本，模型定义与数据库表结构同步

#### ADR-003: AI 双引擎驱动架构（豆包 + Ollama）

- **状态**: 已采纳
- **上下文**: 需要 AI 辅助写作功能，但云端 API 可能因网络或配额不可用，需要本地备选方案
- **决策**: 采用豆包 Doubao API 作为主引擎，Ollama 本地模型作为备选，自动降级
- **理由**: 豆包提供高质量生成能力，Ollama 本地运行保证可用性，两者 API 兼容性好
- **影响**: 需要维护两套 AI 调用逻辑，但通过 `chat.js` 抽象层统一接口

#### ADR-004: JWT 无状态认证

- **状态**: 已采纳
- **上下文**: 需要简单高效的 API 认证方案，无需服务端会话存储
- **决策**: 使用 JWT（jsonwebtoken）进行认证，7 天过期，支持 `auth` 强制认证和 `optionalAuth` 可选认证两种中间件
- **理由**: 无状态、跨域友好、适合前后端分离架构
- **影响**: Token 无法主动撤销，需配合短过期时间使用

## 二、模块详细设计

### 2.1 前端模块 (frontend)

#### 2.1.1 路由设计

```typescript
// 10 条懒加载路由，全部使用 createWebHistory 历史模式
const routes = [
  { path: '/',                    component: Home.vue },
  { path: '/article/:id',         component: Article.vue },
  { path: '/category/:id/:name',  component: Category.vue },
  { path: '/categories',          component: Categories.vue },
  { path: '/tags',                component: Tags.vue },
  { path: '/tag/:id/:name',       component: Tag.vue },
  { path: '/archive',             component: Archive.vue },
  { path: '/search',              component: Search.vue },
  { path: '/about',               component: About.vue },
  { path: '/:pathMatch(.*)*',     component: NotFound.vue },
];
```

#### 2.1.2 状态管理 (Pinia Store)

**article Store** — 文章状态管理
- 状态: `articles[]`, `currentArticle`, `loading`, `error`, `total`, `page`, `pageSize`
- 方法: `fetchArticles(params)`, `fetchArticle(id)`, `fetchArticlesByCategory(slug)`, `searchArticles(query)`
- 数据映射: 后端返回字段标准化（如 `content` → `content`、`category_name` → `category`）

**auth Store** — 认证状态管理
- 状态: `user`, `token`（localStorage 持久化）, `loading`, `error`
- 方法: `login(payload)`, `fetchProfile()`, `logout()`
- 计算属性: `isLoggedIn`, `isAdmin`

**theme Store** — 主题切换
- 状态: `theme`（'dark' | 'light'）
- 方法: `toggleTheme()`, `setTheme(t)`, `initTheme()`
- 自动同步: `watchEffect` 同步 `isDark`、localStorage 和 `document.documentElement` 的 `data-theme` 属性

#### 2.1.3 组件树

```
App.vue
├── NavBar.vue (导航栏 + 滚动进度条 + 移动端菜单)
├── <router-view> (过渡动画)
│   ├── Home.vue
│   │   └── ArticleCard.vue (文章卡片)
│   ├── Article.vue
│   │   ├── MdCatalog (文章目录)
│   │   ├── AiSummary.vue (AI 摘要)
│   │   ├── MdPreview (文章内容渲染)
│   │   └── CommentSection.vue
│   │       ├── MdCommentEditor.vue (Markdown 评论编辑器)
│   │       └── CommentNode.vue (递归评论节点)
│   ├── Categories.vue (分类列表)
│   ├── Category.vue (分类文章)
│   │   └── ArticleCard.vue
│   ├── Tags.vue (标签列表 + 词云图)
│   │   └── TagCloud.vue (ECharts 词云)
│   ├── Tag.vue (标签文章)
│   │   └── ArticleCard.vue
│   ├── Archive.vue (归档)
│   ├── Search.vue (搜索)
│   ├── About.vue (关于)
│   └── NotFound.vue (404)
├── Sidebar.vue (侧边栏)
│   ├── 统计信息 (文章数/分类数/标签数)
│   ├── 公告
│   ├── 分类列表
│   ├── 标签列表
│   └── 最新文章
└── Footer.vue (页脚)
```

#### 2.1.4 页面详细说明

| 页面 | 路由 | 功能 |
|------|------|------|
| Home | `/` | 文章列表 + 分页（10 篇/页），骨架屏加载，渐入动画 |
| Article | `/article/:id` | 文章详情，左侧目录 + 内容 + 右侧 AI 摘要 + 标签云，评论系统 |
| Categories | `/categories` | 全部分类网格展示，每项含图标 + 名称 + 文章数 |
| Category | `/category/:id/:name` | 分类下文章列表 |
| Tags | `/tags` | 标签网格 + ECharts 词云图 |
| Tag | `/tag/:id/:name` | 标签下文章列表 |
| Archive | `/archive` | 按年月归档，年份 → 月份 → 文章列表 |
| Search | `/search` | 关键词搜索，URL 参数初始化 |
| About | `/about` | 关于本站、技术栈、联系方式 |
| NotFound | `/:pathMatch(.*)*` | 404 页面 |

### 2.2 管理面板模块 (admin)

#### 2.2.1 路由设计

```typescript
// 10 条管理路由，含登录守卫
const routes = [
  { path: '/login',               component: Login.vue },
  { path: '/',                    component: Dashboard.vue },
  { path: '/articles',            component: ArticleList.vue },
  { path: '/articles/create',     component: ArticleEditor.vue },
  { path: '/articles/edit/:id',   component: ArticleEditor.vue },
  { path: '/categories',          component: CategoryManage.vue },
  { path: '/tags',                component: TagManage.vue },
  { path: '/comments',            component: CommentManage.vue },
  { path: '/settings',            component: Settings.vue },
  { path: '/announcements',       component: AnnouncementManage.vue },
];
```

#### 2.2.2 页面说明

| 页面 | 功能 |
|------|------|
| Login | 管理员登录，表单验证，错误提示 |
| Dashboard | 统计卡片（文章/访问/评论/点赞数）、ECharts 柱状图（近 7 天访问趋势）、TOP5 文章 |
| ArticleList | 文章表格管理，支持搜索、状态筛选、批量删除、编辑/删除操作 |
| ArticleEditor | 文章编辑器，md-editor-v3 Markdown 编辑，AI 写作助手抽屉，元信息编辑 |
| CategoryManage | 分类表格，支持创建、编辑、删除、搜索 |
| TagManage | 标签表格，支持创建、编辑、删除、搜索、排序 |
| CommentManage | 评论表格，支持审核、AI 自动回复、手动回复、查看对话 |
| Settings | 站点信息编辑（名称/描述/关键词/Logo/作者）、密码修改、缓存清除、数据导出 |
| AnnouncementManage | 公告管理，支持创建、编辑、删除、启用/禁用、排序 |

#### 2.2.3 组件说明

| 组件 | 功能 |
|------|------|
| AiAssistant.vue | AI 写作助手（抽屉式），支持创作、润色、续写、标签推荐、封面生成，流式 SSE 输出 |
| CoverGenerator.vue | AI 封面生成器，支持上传图片 + AI 生成（Chiikawa 风格）双模式 |

### 2.3 后端模块 (backend)

#### 2.3.1 路由模块详细说明

**认证模块 (`/api/v1/auth`)**
| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/login` | 否 | 用户名+密码登录，返回 JWT + 用户信息 |
| POST | `/register` | 否 | 注册新用户，验证唯一性 |
| GET | `/me` | 是 | 获取当前用户信息 |
| PUT | `/password` | 是 | 修改密码，需验证旧密码 |

**文章模块 (`/api/v1/articles`)**
| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/` | 否 | 分页查询，支持分类/标签/关键词筛选 |
| GET | `/archive` | 否 | 按年月归档 |
| GET | `/:id` | 否 | 文章详情，阅读量限流（单 IP 24h 最多 +3） |
| POST | `/` | 是 | 创建文章，自动处理标签 |
| POST | `/batch-delete` | 是 | 批量删除 |
| PUT | `/:id` | 是 | 更新文章 |
| DELETE | `/:id` | 是 | 删除文章 |
| GET | `/:id/comments` | 否 | 获取评论（游标分页，无限嵌套） |
| POST | `/:id/comments` | 否 | 发表评论（需 QQ + 验证码） |
| POST | `/:id/like` | 否 | 文章点赞（IP 限流 24h） |
| POST | `/:id/comments/:commentId/like` | 否 | 评论点赞（IP 限流 24h） |

**评论管理模块 (`/api/v1/comments`)**
| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/` | 是 | 分页查询，支持审核状态/关键词过滤 |
| PUT | `/:id` | 是 | 更新审核状态 |
| POST | `/:id/ai-reply` | 是 | AI 自动回复（加载 prompt 模板） |
| POST | `/:id/reply` | 是 | 管理员手动回复 |
| GET | `/:id/replies` | 是 | 获取完整回复线程（递归） |
| DELETE | `/:id` | 是 | 删除评论（级联删除子回复） |

**AI 服务模块 (`/api/v1/ai`)**
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/chat` | 普通对话，支持自定义 systemPrompt |
| POST | `/chat/stream` | SSE 流式对话 |
| POST | `/write` | AI 创作文章（HTML/Markdown 双格式） |
| POST | `/polish` | AI 润色文章 |
| POST | `/continue` | AI 续写文章 |
| POST | `/summary` | AI 生成摘要 |
| POST | `/tags` | AI 标签推荐（自动创建到数据库） |
| POST | `/cover` | AI 封面图生成（Chiikawa 风格） |
| POST | `/auto-reply` | AI 自动回复评论 |

**管理模块 (`/api/v1/admin`)**
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/stats` | 站点统计（未登录/已登录返回不同数据量） |
| PUT | `/settings` | 更新站点设置（写入 `.env.development`） |
| POST | `/cache/clear` | 清空 Redis 缓存 |
| GET | `/export` | 导出所有文章（JSON 格式下载） |

#### 2.3.2 数据模型关联图

```
User ──1:N──> Article ──N:M──> Tag
                    │            └── ArticleTags (中间表)
                    │
                    ├──1:N──> Comment ──self (parent_id 嵌套回复)
                    │
                    └──1:N──> VisitorLog

Category ──1:N──> Article
```

#### 2.3.3 中间件执行链

```
请求 → helmet → cors → morgan → express-rate-limit
  → 路由匹配 → [auth/optionalAuth] → [自定义限流] → 控制器
  → 响应 → errorHandler (错误时)
```

#### 2.3.4 AI 服务架构

```
AI 路由层 (routes/ai.js)
  ├── AI 服务层 (services/ai/)
  │   ├── chat.js ──────────→ 豆包 API (OpenAI SDK)
  │   │                        └── 失败降级 → ollamaChat.js
  │   ├── ollamaChat.js ────→ Ollama 本地 API (fetch)
  │   ├── summary.js ───────→ 豆包 API
  │   ├── tag.js ───────────→ 豆包 API
  │   └── image.js ─────────→ 豆包文生图 API
  │                            ├── extractCoverKeywords() → LLM 提取关键词
  │                            └── buildChiikawaCoverPrompt() → 构建 prompt
  └── 提示词模板 (prompt/)
      ├── md-prompt.txt / html-prompt.txt (创作)
      ├── md-polish-prompt.txt / html-polish-prompt.txt (润色)
      ├── md-continue-prompt.txt / html-continue-prompt.txt (续写)
      ├── cover-image-prompt.txt (封面图)
      ├── cover-keywords-extract.txt (关键词提取)
      └── comment-reply-prompt.txt (评论回复)
```

#### 2.3.5 安全机制

| 安全层 | 实现方式 | 说明 |
|--------|---------|------|
| HTTP 安全头 | Helmet | 设置 CSP、X-Frame-Options 等 |
| 跨域控制 | CORS (cors origin) | 限制允许的源 |
| 全局限流 | express-rate-limit | 15 分钟 300 次 |
| 局部限流 | Redis rate-limit | 图片上传每分钟 3 次/IP |
| 自定义限流 | rateLimit.js 工厂 | 点赞 24h 限流 |
| JWT 验证 | jsonwebtoken | 7 天过期 |
| 图片安全 | sharp NSFW 检测 | 肤色像素 > 70% 拦截 |
| 请求体大小 | Express JSON | 默认限制 |

### 2.4 前端 api.ts 对比

| 特性 | frontend (博客前台) | admin (管理面板) |
|------|--------------------|------------------|
| 超时时间 | 15 秒 | 10 分钟（适配 AI 流式） |
| 客户端标识 | `X-Client-Type: blog-client` | 无 |
| 拦截器 | 401 清除 token，429 警告 | 401 跳转登录 |
| 基础路径 | `/api/v1` | `/api/v1` |

## 三、数据流

### 3.1 文章发布流程

```
管理员 (admin)
  └─→ ArticleEditor.vue (Markdown 编辑)
      ├─→ 保存草稿 → POST /api/v1/articles → MySQL 存储
      └─→ 发布文章 → PUT /api/v1/articles/:id → status=published

访客 (frontend)
  └─→ Home.vue → GET /api/v1/articles → 文章列表
  └─→ Article.vue → GET /api/v1/articles/:id → 文章详情 + 评论
```

### 3.2 AI 创作流程

```
管理员 (admin)
  └─→ AiAssistant.vue (AI 助手抽屉)
      ├─→ 创作 → POST /api/v1/ai/write
      │           └─→ 加载 prompt 模板 → 调用豆包/Ollama → 返回内容
      ├─→ 润色 → POST /api/v1/ai/polish
      ├─→ 续写 → POST /api/v1/ai/continue
      ├─→ 标签 → POST /api/v1/ai/tags → 自动写入数据库
      ├─→ 摘要 → POST /api/v1/ai/summary
      └─→ 封面 → POST /api/v1/ai/cover
                  ├─→ LLM 提取关键词
                  └─→ 构建 Chiikawa prompt → 豆包文生图
```

### 3.3 评论发布流程

```
访客
  └─→ CommentSection.vue
      ├─→ 输入 QQ 号 → 自动获取头像/昵称
      ├─→ Markdown 编辑内容
      ├─→ 输入验证码 → POST /api/v1/captcha (验证)
      └─→ 提交 → POST /api/v1/articles/:id/comments
                  ├─→ 验证码 Redis 校验
                  ├─→ QQ 信息查询
                  ├─→ 评论入库
                  └─→ 邮件通知被回复者 (如有)
```

## 四、部署架构

### 4.1 开发环境

```
┌─────────────────────────────────────────────────┐
│                  开发机器                          │
│                                                   │
│  frontend:5173  admin:5174  backend:3000          │
│       │              │             │              │
│       └──────Vite 代理──────┬──────┘              │
│                             │                      │
│                    MySQL:3306                      │
│                    Redis:6379                      │
│                    Ollama:11434                    │
└─────────────────────────────────────────────────┘
```

### 4.2 生产环境

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Nginx 反向代理  │  Nginx 反向代理  │  Nginx 反向代理  │
│  frontend:80   │  admin:80      │  backend:80    │
│  (静态文件)    │  (静态文件)    │  (API 代理)    │
└──────────────┘  └──────────────┘  └──────┬───────┘
                                           │
                                    ┌──────┴───────┐
                                    │  Docker 容器   │
                                    │  backend:3000 │
                                    └──────┬───────┘
                                           │
                                    ┌──────┴───────┐
                                    │  MySQL:3306   │
                                    │  Redis:6379   │
                                    └──────────────┘
```

## 五、开发指南

### 5.1 代码规范

- 后端使用 CommonJS 模块 (`require` / `module.exports`)
- 前端使用 ESM 模块 (`import` / `export`)
- Vue 组件使用 `<script setup lang="ts">` 组合式 API
- 后端路由统一返回格式: `success(res, data)`, `error(res, msg)`, `paginated(res, {list, total, page, pageSize})`
- 错误处理由 `errorHandler.js` 中间件统一捕获

### 5.2 新增页面流程

1. 在 `pages/` 目录下创建 Vue 组件
2. 在 `router/index.ts` 中添加路由配置（懒加载）
3. 如需状态管理，更新对应 Pinia Store
4. 对接后端 API（Axios 实例已预配置）
5. 设置 SEO（`usePageSeo` 或 `useArticleSeo`）

### 5.3 新增 API 端点流程

1. 在 `routes/` 目录下创建或修改路由文件
2. 在 `app.js` 中注册路由
3. 如需数据库操作，在 `models/` 中定义或修改模型
4. 使用 `response.js` 的 `success/error/paginated` 统一返回
5. 根据需要添加认证中间件 (`auth` / `optionalAuth`)