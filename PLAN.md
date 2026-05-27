# TechMind Blog 项目架构文档

> 文档版本：v2.2 | 最后更新：2026-05-20 | 维护者：TechMind Blog 开发团队

## 1. 项目概述

一个功能完整的个人博客系统，包含三个相互协作的子系统，覆盖读者浏览、内容管理与 API 服务的全链路需求。集成了 Chroma RAG 知识库、AI 双驱动架构、Redis 分布式限流等高级特性。

| 子系统                  | 技术栈                                      | 端口 | 定位                                      |
| ----------------------- | ------------------------------------------- | ---- | ----------------------------------------- |
| **frontend** (博客前端) | Vue 3 + TypeScript + Vite + Tailwind CSS v4 | 5173 | 博客读者端，双栏布局                      |
| **backend** (后端服务)  | Node.js + Express + Sequelize + MySQL       | 3001 | RESTful API + AI 服务 + Chroma RAG 知识库 |
| **admin** (管理面板)    | Vue 3 + Ant Design Vue + Vite               | 5174 | 后台管理，内容创作                        |

---

## 2. 项目目录结构

```
3DBlog/
├── PLAN.md                          # 本架构文档
├── PLAN.html                        # HTML 版架构文档
├── .idea/                           # IDE 配置
├── frontend/                        # 博客前端 (Vue 3 + Tailwind CSS v4)
│   ├── index.html                   # 入口 HTML
│   ├── vite.config.ts               # Vite 构建配置 (含代理 + Tailwind 插件)
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── package.json
│   ├── public/vite.svg
│   ├── dist/                        # 构建产物
│   └── src/
│       ├── main.ts                  # 应用入口 (Pinia + Router + @unhead/vue)
│       ├── App.vue                  # 根组件 (双栏布局 + AiChatWidget + SEO)
│       ├── env.d.ts                 # 环境声明
│       ├── router/index.ts          # 路由配置 (10 条路由)
│       ├── stores/
│       │   ├── article.ts           # 文章状态 (列表/详情/搜索)
│       │   ├── auth.ts              # 认证状态 (登录/用户信息)
│       │   └── theme.ts             # 主题状态 (深色/浅色)
│       ├── utils/
│       │   ├── api.ts               # Axios HTTP 客户端 (拦截器 + JWT)
│       │   └── message.ts           # 轻量消息提示系统
│       ├── composables/
│       │   └── useSeo.ts            # @unhead/vue SEO 封装 (useArticleSeo / usePageSeo)
│       ├── styles/
│       │   └── tailwind.css         # Tailwind CSS v4 入口 + 自定义主题 + 文章样式
│       ├── components/
│       │   ├── layout/
│       │   │   ├── NavBar.vue       # 导航栏 (固定顶部, 毛玻璃, 滚动激活, 移动端菜单 padding-top:64px)
│       │   │   ├── Sidebar.vue      # 侧边栏 (个人信息/统计/分类/标签/公告/最新文章)
│       │   │   └── Footer.vue       # 页脚
│       │   ├── article/
│       │   │   ├── ArticleCard.vue  # 文章卡片 (封面/分类/日期/阅读量/点赞/评论数)
│       │   │   ├── CommentSection.vue # 评论区 (游标分页, 无限嵌套)
│       │   │   ├── CommentNode.vue  # 评论节点 (回复布局: A 回复 B, AI 标识)
│       │   │   ├── MdCommentEditor.vue # Markdown 评论编辑器 (二次封装 md-editor-v3, 图片上传 + Emoji)
│       │   │   ├── AiSummary.vue    # AI 文章摘要展示
│       │   │   └── AiTranslate.vue  # AI 翻译组件
│       │   ├── ai/
│       │   │   └── AiChatWidget.vue # AI 聊天悬浮窗 (SSE 流式, marked 渲染 Markdown, inline z-index:1000)
│       │   └── common/
│       │       ├── Message.vue      # 消息提示组件 (Teleport 到 body)
│       │       └── TagCloud.vue     # 词云组件 (ECharts, 已注释)
│       └── pages/
│           ├── Home.vue             # 首页 - 文章列表 + 分页
│           ├── Article.vue          # 文章详情页 (点赞/阅读量/评论/AI摘要/AI翻译)
│           ├── Categories.vue       # 全部分类页
│           ├── Category.vue         # 分类文章列表
│           ├── Tags.vue             # 全部标签页
│           ├── Tag.vue              # 标签文章列表
│           ├── Archive.vue          # 文章归档 (按年月)
│           ├── Search.vue           # 搜索页面
│           ├── About.vue            # 关于页面
│           └── NotFound.vue         # 404 页面
├── backend/                         # 后端服务 (Express + Sequelize)
│   ├── app.js                       # Express 应用入口 (CORS/Helmet/限流/定时同步 Chroma RAG)
│   ├── .env                         # 环境变量配置
│   ├── package.json
│   ├── prompt/prompt.txt            # AI 写作提示词模板
│   ├── uploads/                     # 文件上传目录
│   ├── config/
│   │   └── index.js                 # 配置加载 (从 .env)
│   ├── models/
│   │   ├── index.js                 # Sequelize 模型关联 + 数据库同步 (9 个模型)
│   │   ├── User.js                  # 用户模型
│   │   ├── Article.js               # 文章模型 (含 published_at 字段)
│   │   ├── Category.js              # 分类模型
│   │   ├── Tag.js                   # 标签模型
│   │   ├── Comment.js               # 评论模型 (含 avatar, content_type, like_count)
│   │   ├── ArticleVector.js         # 文章向量嵌入模型 (已弃用，保留兼容)
│   │   ├── ArticleTags.js           # 文章-标签关联模型
│   │   ├── VisitorLog.js            # 访客日志模型
│   │   └── Announcement.js          # 公告模型
│   ├── routes/
│   │   ├── auth.js                  # 认证 (登录/注册/个人信息/改密码/验证码校验)
│   │   ├── articles.js              # 文章 CRUD / 搜索 / 归档 / 点赞 / 评论
│   │   ├── categories.js            # 分类 CRUD
│   │   ├── tags.js                  # 标签 CRUD / 标签文章列表
│   │   ├── comments.js              # 评论管理 / AI 回复
│   │   ├── upload.js                # 文件上传 (单文件/批量)
│   │   ├── commentUpload.js         # 评论图片上传 (Redis 限流 3次/分钟 + NSFW 检测 + 5MB)
│   │   ├── captcha.js               # SVG 数学验证码 (Redis 存储, 5分钟过期)
│   │   ├── ai.js                    # AI 服务 (15 个端点: 聊天/摘要/翻译/标签/问答/续写/润色/封面/Chroma管理)
│   │   ├── admin.js                 # 管理面板 (统计/设置/缓存/导出)
│   │   ├── announcements.js         # 公告 CRUD
│   │   └── site.js                  # 站点信息
│   ├── services/
│   │   ├── ai/
│   │   │   ├── index.js             # AI 服务聚合导出 (chat, embedding, summary, translate, tag, qa, image)
│   │   │   ├── chat.js              # 对话双驱动 (Ollama 优先, 失败降级豆包)
│   │   │   ├── ollamaChat.js        # Ollama 本地对话 (含流式 SSE)
│   │   │   ├── embedding.js         # 向量嵌入 (Ollama nomic-embed-text + Chroma)
│   │   │   ├── chromaService.js     # Chroma RAG 知识库 (自定义 OllamaEmbeddingFunction)
│   │   │   ├── summary.js           # 文章摘要 (RAG 全量总结 + 单篇 + 批量)
│   │   │   ├── translate.js         # 翻译 (HTML 保留标签)
│   │   │   ├── tag.js               # AI 标签生成
│   │   │   ├── qa.js                # RAG 知识库问答 (流式 SSE, Markdown 输出)
│   │   │   └── image.js             # 封面图生成 (豆包)
│   │   ├── mail.js                  # 邮件通知服务 (QQ邮箱 SMTP)
│   │   └── qq.js                    # QQ 工具函数 (头像/昵称获取)
│   ├── middleware/
│   │   ├── auth.js                  # JWT 认证中间件 (auth / optionalAuth)
│   │   ├── upload.js                # Multer 文件上传中间件 (diskStorage, 10MB, UUID)
│   │   └── errorHandler.js          # 全局错误处理
│   └── utils/
│       ├── index.js                 # 通用工具函数
│       ├── response.js              # 统一响应格式 (success/error/paginated)
│       ├── redis.js                 # ioredis Redis 客户端
│       ├── cron.js                  # 定时任务封装 (node-cron, safeSchedule)
│       ├── rateLimit.js             # 基于 Redis 的自定义限流工厂函数
│       └── nsfw.js                  # NSFW 图片内容检测 (像素级肤色分析)
└── admin/                           # 管理面板 (Vue 3 + Ant Design Vue)
    ├── index.html
    ├── vite.config.ts
    ├── tsconfig.json
    ├── tsconfig.node.json
    ├── package.json
    ├── public/vite.svg
    ├── dist/                        # 构建产物
    └── src/
        ├── main.ts
        ├── App.vue
        ├── env.d.ts
        ├── router/index.ts          # 管理面板路由 (10 条路由)
        ├── utils/api.ts             # Axios HTTP 客户端
        ├── styles/admin.css         # 管理面板样式
        ├── stores/
        │   ├── auth.ts              # 管理面板认证
        │   ├── article.ts           # 管理面板文章管理
        │   └── dashboard.ts         # 管理面板数据
        ├── pages/
        │   ├── Login.vue            # 登录页 (含验证码)
        │   ├── Dashboard.vue        # 仪表盘 (统计 + 图表)
        │   ├── ArticleList.vue      # 文章列表管理
        │   ├── ArticleEditor.vue    # 文章编辑器 (WangEditor 富文本)
        │   ├── CategoryManage.vue   # 分类管理
        │   ├── TagManage.vue        # 标签管理
        │   ├── CommentManage.vue    # 评论管理 (AI 自动回复)
        │   ├── Settings.vue         # 站点设置 (写入 .env)
        │   └── AnnouncementManage.vue # 公告管理
        └── components/
            └── admin/
                ├── AiAssistant.vue  # AI 写作助手
                └── CoverGenerator.vue # AI 封面图生成器
```

---

## 3. 技术栈详情

### 3.1 前端技术栈 (frontend)

| 类别            | 技术                  | 版本    | 说明                                   |
| --------------- | --------------------- | ------- | -------------------------------------- |
| 框架            | Vue 3                 | ^3.5.13 | Composition API + `<script setup>`     |
| 构建            | Vite                  | ^6.0.5  | 开发服务器 + HMR                       |
| 路由            | Vue Router 4          | ^4.5.0  | createWebHistory, scrollBehavior       |
| 状态管理        | Pinia                 | ^2.3.0  | setup 语法                             |
| HTTP 客户端     | Axios                 | ^1.7.9  | 统一拦截器 + JWT 注入                  |
| 样式框架        | Tailwind CSS          | ^4.3.0  | Tailwind v4 + `@tailwindcss/vite` 插件 |
| 图标            | @ant-design/icons-vue | ^7.0.1  | SVG 图标组件                           |
| 图表            | ECharts               | ^5.6.0  | 词云组件 (已注释)                      |
| 词云            | echarts-wordcloud     | ^2.1.0  | ECharts 词云插件 (已注释)              |
| Markdown 编辑器 | md-editor-v3          | ^6.5.0  | 评论区 Markdown 编辑 (图片上传 + Emoji) |
| Markdown 渲染   | marked                | ^18.0.4 | AI 对话流式 Markdown 渲染              |
| UI 扩展         | @vavt/v3-extension    | ^4.0.0  | Emoji 选择器                           |
| 消息提示        | vue-m-message         | ^4.0.2  | 轻量消息提示                           |
| SEO 管理        | @unhead/vue (dev)       | ^3.1.0  | useSeoMeta + useHead                   |
| 类型检查        | TypeScript            | ~5.6.3  | vue-tsc 构建时检查                     |

### 3.2 后端技术栈 (backend)

| 类别           | 技术               | 版本    | 说明                          |
| -------------- | ------------------ | ------- | ----------------------------- |
| 运行时         | Node.js            | -       | Express 4 框架                |
| 框架           | Express            | ^4.21.0 | Web 框架                      |
| ORM            | Sequelize          | ^6.37.3 | MySQL ORM + 模型同步 (alter)  |
| 数据库         | mysql2             | ^3.11.0 | 关系型数据库                  |
| 缓存           | ioredis            | ^5.4.1  | Redis 缓存 + 分布式速率限制   |
| 向量数据库     | chromadb           | ^3.4.3  | Chroma RAG 知识库 (自定义嵌入)|
| 认证           | jsonwebtoken       | ^9.0.2  | JWT Token 认证                |
| 密码           | bcryptjs           | ^2.4.3  | 密码哈希                      |
| AI SDK         | openai             | ^4.67.0 | OpenAI 兼容接口调用豆包       |
| 文件上传       | multer             | ^1.4.5-lts.1 | 文件上传处理 (memory/disk) |
| 邮件服务       | nodemailer         | ^8.0.7  | QQ 邮箱评论通知 (SMTP)        |
| 定时任务       | node-cron          | ^4.2.1  | Chroma 定时同步 (每30分钟)    |
| 图片处理       | sharp              | ^0.34.5 | 图片压缩/NSFW 像素分析        |
| 图片 NSFW 检测 | (自定义)           | -       | 像素级肤色检测算法            |
| 验证码         | svg-captcha        | ^1.4.0  | SVG 数学验证码 (Redis 存储)   |
| Redis 限流     | rate-limit-redis   | ^5.0.0  | express-rate-limit Redis 存储 |
| 限流           | express-rate-limit | ^8.5.2  | 全局 API 速率限制             |
| 安全           | helmet             | ^7.1.0  | HTTP 安全头                   |
| 日志           | morgan             | ^1.10.0 | HTTP 请求日志 (dev/combined)  |
| 环境变量       | dotenv             | ^16.4.5 | .env 配置加载                 |
| HTTP 工具      | axios              | ^1.16.1 | Ollama / 外部 API 请求        |
| 编码转换       | iconv-lite         | ^0.7.2  | 字符编码处理                  |
| UUID           | uuid               | ^10.0.0 | 生成唯一 ID                   |

### 3.3 管理面板技术栈 (admin)

| 类别         | 技术                           | 版本     |
| ------------ | ------------------------------ | -------- |
| 框架         | Vue 3                          | ^3.5.13  |
| UI 组件      | Ant Design Vue                 | ^4.2.6   |
| 富文本编辑器 | @wangeditor/editor + @wangeditor/editor-for-vue | ^5.1.23 / ^5.1.12 |
| 日期处理     | dayjs                          | ^1.11.13 |
| Markdown     | marked                         | ^15.0.4  |
| 工具函数     | @vueuse/core                   | ^12.0.0  |
| 状态管理     | Pinia                          | ^3.0.1   |

---

## 4. 路由体系

### 4.1 博客前端路由 (frontend/src/router/index.ts)

| 路径                  | 名称       | 页面           | 页面标题         |
| --------------------- | ---------- | -------------- | ---------------- |
| `/`                   | Home       | Home.vue       | LinzyBlog    |
| `/article/:id`        | Article    | Article.vue    | 文章详情         |
| `/category/:id/:name` | Category   | Category.vue   | 分类             |
| `/categories`         | Categories | Categories.vue | 全部分类         |
| `/tags`               | Tags       | Tags.vue       | 全部标签         |
| `/tag/:id/:name`      | Tag        | Tag.vue        | 标签             |
| `/archive`            | Archive    | Archive.vue    | 归档             |
| `/search`             | Search     | Search.vue     | 搜索             |
| `/about`              | About      | About.vue      | 关于             |
| `/:pathMatch(.*)*`    | NotFound   | NotFound.vue   | 404 - 页面未找到 |

路由器使用 `createWebHistory`，`scrollBehavior` 每次导航滚动到顶部。全局 `beforeEach` 守卫根据路由 `meta.title` 设置 `document.title`。通过 `@unhead/vue` 的 `useSeoMeta` 和 `useHead` 实现 SEO 元信息管理。

### 4.2 管理面板路由 (admin/src/router/index.ts)

| 路径                 | 名称               | 页面                   | 说明              |
| -------------------- | ------------------ | ---------------------- | ----------------- |
| `/login`             | Login              | Login.vue              | 登录页 (无需认证) |
| `/`                  | Dashboard          | Dashboard.vue          | 仪表盘            |
| `/articles`          | ArticleList        | ArticleList.vue        | 文章管理          |
| `/articles/create`   | ArticleCreate      | ArticleEditor.vue      | 创建文章          |
| `/articles/:id/edit` | ArticleEdit        | ArticleEditor.vue      | 编辑文章          |
| `/categories`        | CategoryManage     | CategoryManage.vue     | 分类管理          |
| `/tags`              | TagManage          | TagManage.vue          | 标签管理          |
| `/comments`          | CommentManage      | CommentManage.vue      | 评论管理          |
| `/settings`          | Settings           | Settings.vue           | 系统设置          |
| `/announcements`     | AnnouncementManage | AnnouncementManage.vue | 公告管理          |

`beforeEach` 守卫检查 `localStorage.getItem('admin_token')` 控制访问权限，未认证跳转 `/login`。

### 4.3 后端 API 路由 (backend/app.js)

所有 API 前缀为 `/api/v1`，共 **12 个路由模块**：

| 路径                     | 路由模块                | 说明                                  |
| ------------------------ | ----------------------- | ------------------------------------- |
| `/api/v1/auth`           | routes/auth.js          | 用户认证 (含 SVG 验证码)              |
| `/api/v1/articles`       | routes/articles.js      | 文章 CRUD + 搜索 + 归档 + 点赞 + 评论 |
| `/api/v1/comments`       | routes/comments.js      | 评论管理 + AI 自动回复                |
| `/api/v1/categories`     | routes/categories.js    | 分类 CRUD                             |
| `/api/v1/tags`           | routes/tags.js          | 标签 CRUD (含分页/搜索/排序)          |
| `/api/v1/upload`         | routes/upload.js        | 文件上传 (单文件/批量)                |
| `/api/v1/comment-upload` | routes/commentUpload.js | 评论图片上传 (Redis 限流 + NSFW)      |
| `/api/v1/captcha`        | routes/captcha.js       | SVG 数学验证码                        |
| `/api/v1/ai`             | routes/ai.js            | AI 服务 + Chroma 管理 (15 个端点)     |
| `/api/v1/admin`          | routes/admin.js         | 管理员功能 (统计/设置/缓存/导出)      |
| `/api/v1/announcements`  | routes/announcements.js | 公告 CRUD                             |
| `/api/v1/site`           | routes/site.js          | 站点信息                              |

全局配置：

- **CORS**: 允许 `http://localhost:5173` 和 `http://localhost:5174`
- **Helmet**: HTTP 安全头
- **Morgan**: 请求日志 (dev/combined)
- **限流**: 全局 `/api/` 路径 15 分钟 1000 次请求 (express-rate-limit)
- **JSON 限制**: `10mb`
- **静态资源**: `/uploads` 映射到 `./uploads` 目录
- **404 处理**: 未匹配路由返回 JSON `{ code: 404, message: 'Route not found' }`

---

## 5. 数据库模型 (MySQL)

数据库名：`blog_3d`

### 5.1 模型列表 (9 个模型)

| 模型          | 表名            | 字段                                                                                                                                                                       | 说明                                     |
| ------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| User          | users           | id(INTEGER AI), username(unique), email(unique), password, avatar, role(admin/author/user), created_at                                                       | 用户                                     |
| Article       | articles        | id(UUID), title, slug(unique), content(TEXT long), summary, cover, status(draft/published/archived), author_id, category_id, view_count, like_count, is_ai_generated, **published_at**, created_at, updated_at | 文章 (含发布时间戳)                      |
| Category      | categories      | id(UUID), name, slug, description, created_at, updated_at                                                                                                                  | 分类                                     |
| Tag           | tags            | id(UUID), name, slug, created_at, updated_at                                                                                                                               | 标签                                     |
| ArticleTag    | article_tags    | article_id, tag_id                                                                                                                                                         | 文章-标签关联                            |
| Comment       | comments        | id(STRING 36 UUID), article_id, user_id(INTEGER), parent_id(STRING 36), author_name, author_email, **avatar**(STRING 500), content, **content_type**(text/markdown), is_approved, is_ai_reply, **like_count**(INTEGER), created_at | 评论 (含头像/类型/点赞)                  |
| ArticleVector | article_vectors | id, article_id, chunk_index, chunk_text, embedding(JSON), created_at                                                                                                       | 文章向量嵌入 **(已弃用，迁移至 Chroma)** |
| VisitorLog    | visitor_logs    | id, article_id, ip, user_agent, action(view/like), created_at                                                                                                              | 访客日志                                 |
| Announcement  | announcements   | id, content, is_active, sort_order, created_at, updated_at                                                                                                                 | 公告                                     |

**字段说明**：
- User 模型**不含** bio/website/social_links 字段（实际仅有 id, username, email, password, avatar, role, created_at）
- Comment.avatar: QQ 头像 URL (STRING 500)
- Comment.content_type: 内容类型 (text/markdown, 默认 text)
- Comment.like_count: 评论点赞数 (INTEGER, 默认 0)
- Article.published_at: 发布时间戳 (DATETIME)
- Comment.id 为 STRING(36) UUID（非自增整数）

### 5.2 模型关联

```
User (1) ──< (N) Article (author_id)
Category (1) ──< (N) Article (category_id)
Article (M) >──< (N) Tag (通过 article_tags)
Article (1) ──< (N) Comment (article_id)
Comment (1) ──< (N) Comment (parent_id, 自关联回复)
Article (1) ──< (N) ArticleVector (article_id, 已弃用)
Article (1) ──< (N) VisitorLog (article_id)
User (1) ──< (N) Comment (user_id)
ArticleTag.belongsTo(Tag)
ArticleTag.belongsTo(Article)
```

### 5.3 Chroma RAG 知识库

- **集合名称**: `blog_articles`
- **向量维度**: 768 (Ollama nomic-embed-text)
- **嵌入函数**: 自定义 `OllamaEmbeddingFunction`，通过 HTTP POST 调用 Ollama API (`/api/embeddings`)
- **存储字段**: title, summary, category, tags, content (按段落分段存储)
- **分段策略**: 按段落分割，每块最大 800 字符
- **元数据**: article_id, title, chunk_index, total_chunks, category, tags
- **服务地址**: `http://localhost:8000`
- **同步策略**: 启动时立即执行 + 每 30 分钟全量同步 + 创建/更新文章时实时同步
- **降级策略**: 向量生成失败时使用 768 维零向量占位，保障服务不中断
- **集合创建**: 优先 JS 客户端获取，失败则通过 HTTP API (`/api/v2/tenants/default_tenant/databases/default_database/collections`) 创建

---

## 6. API 接口文档

### 6.1 认证模块 (`/api/v1/auth`)

| 方法 | 路径        | 认证 | 说明         | 请求体                                          | 响应            |
| ---- | ----------- | ---- | ------------ | ----------------------------------------------- | --------------- |
| POST | `/login`    | 无   | 登录         | `{username, password, captchaKey, captchaCode}` | `{token, user}` |
| POST | `/register` | 无   | 注册         | `{username, email, password}`                   | `{token, user}` |
| GET  | `/me`       | auth | 获取当前用户 | -                                               | user 对象       |
| PUT  | `/password` | auth | 修改密码     | `{old_password, new_password}`                  | -               |

登录支持 SVG 数学验证码校验（Redis 存储，5 分钟过期，一次性使用）。

### 6.2 文章模块 (`/api/v1/articles`)

| 方法   | 路径                           | 认证         | 说明                                                              |
| ------ | ------------------------------ | ------------ | ----------------------------------------------------------------- |
| GET    | `/`                            | optionalAuth | 文章列表 (page, pageSize, status, category_id, tag_id, keyword, sort, order) |
| GET    | `/:id`                         | optionalAuth | 文章详情 (含 comment_count, Redis 限次 +1 阅读量)                |
| POST   | `/`                            | auth         | 创建文章 (自动同步 Chroma RAG)                                   |
| PUT    | `/:id`                         | auth         | 更新文章 (更新 Chroma RAG)                                       |
| DELETE | `/:id`                         | auth         | 删除文章                                                          |
| POST   | `/batch-delete`                | auth         | 批量删除                                                          |
| POST   | `/:id/like`                    | 无           | 文章点赞 (Redis 手动限流, 单 IP 24h 一次)                        |
| POST   | `/:id/comments/:commentId/like` | 无           | 评论点赞 (Redis 手动限流, 单 IP 24h 一次)                        |
| GET    | `/search/vector`               | optionalAuth | 文章搜索 (MySQL LIKE 搜索, 非向量搜索)                            |
| GET    | `/archive`                     | optionalAuth | 文章归档 (按年月)                                                 |
| GET    | `/:id/comments`                | 无           | 文章评论列表 (游标分页, 无限嵌套)                                 |
| POST   | `/:id/comments`                | 无           | 发表评论 (QQ 号绑定 + 验证码 + 回复通知)                          |

**限流机制** (均使用手动 Redis 键检查，非 express-rate-limit 中间件):
- 阅读量: redis.get → 递增 → redis.set EX 86400, 单 IP 24h 最多 3 次
- 文章点赞: redis.get → redis.set EX 86400, 单 IP 24h 最多 1 次
- 评论点赞: redis.get → redis.set EX 86400, 单 IP 24h 最多 1 次

### 6.3 分类模块 (`/api/v1/categories`)

| 方法   | 路径   | 认证 | 说明                  |
| ------ | ------ | ---- | --------------------- |
| GET    | `/`    | 无   | 分类列表 (含文章计数) |
| POST   | `/`    | auth | 创建分类              |
| PUT    | `/:id` | auth | 更新分类              |
| DELETE | `/:id` | auth | 删除分类              |

### 6.4 标签模块 (`/api/v1/tags`)

| 方法   | 路径            | 认证 | 说明                                      |
| ------ | --------------- | ---- | ----------------------------------------- |
| GET    | `/`             | 无   | 标签列表 (含文章计数, 支持分页/搜索/排序) |
| GET    | `/:id/articles` | 无   | 标签下的文章列表                          |
| POST   | `/`             | auth | 创建标签                                  |
| PUT    | `/:id`          | auth | 更新标签                                  |
| DELETE | `/:id`          | auth | 删除标签                                  |

### 6.5 评论模块 (`/api/v1/comments`)

| 方法   | 路径            | 认证 | 说明               |
| ------ | --------------- | ---- | ------------------ |
| GET    | `/`             | auth | 评论列表 (管理用)  |
| PUT    | `/:id`          | auth | 审核评论 (approve) |
| POST   | `/:id/ai-reply` | auth | AI 自动回复评论    |
| DELETE | `/:id`          | auth | 删除评论           |

### 6.6 AI 服务模块 (`/api/v1/ai`) — 15 个端点

| 方法 | 路径                    | 认证         | 说明                                     |
| ---- | ----------------------- | ------------ | ---------------------------------------- |
| POST | `/chat`                 | optionalAuth | AI 对话 (Ollama 优先，失败降级豆包)      |
| POST | `/chat/stream`          | optionalAuth | AI 流式对话 (SSE, 自定义 systemPrompt)   |
| POST | `/write`                | auth         | AI 写文章 (prompt.txt 模板 + 占位符替换) |
| POST | `/polish`               | auth         | 文章润色 (保持 HTML 格式)                |
| POST | `/continue`             | auth         | 文章续写 (支持指定方向)                  |
| POST | `/summary`              | optionalAuth | 生成文章摘要 (RAG 全量总结不截取)        |
| POST | `/tags`                 | auth         | AI 生成标签 (自动写入数据库)             |
| POST | `/translate`            | optionalAuth | AI 翻译 (保留 HTML)                      |
| POST | `/qa`                   | optionalAuth | RAG 知识库问答 (返回引用来源)            |
| POST | `/qa/stream`            | optionalAuth | RAG 流式问答 (SSE, Markdown 输出)        |
| POST | `/cover`                | auth         | AI 生成封面图 (豆包)                     |
| GET  | `/recommend/:articleId` | optionalAuth | 推荐文章 (Chroma 向量相似度, 排除自身)   |
| POST | `/auto-reply`           | auth         | AI 自动回复评论 (以作者身份)             |
| POST | `/chroma/clear`         | auth         | 清空 Chroma 知识库 (deleteCollection)    |
| POST | `/chroma/sync`          | auth         | 全量同步文章到 Chroma                    |

### 6.7 其他模块

| 方法   | 路径                           | 认证         | 说明                                          |
| ------ | ------------------------------ | ------------ | --------------------------------------------- |
| GET    | `/api/v1/admin/stats`          | optionalAuth | 站点统计 (未登录=简要, 已登录=详细)           |
| PUT    | `/api/v1/admin/settings`       | auth         | 站点设置 (写入 .env)                          |
| POST   | `/api/v1/admin/cache/clear`    | auth         | 清除 Redis 缓存                               |
| GET    | `/api/v1/admin/export`         | auth         | 导出文章数据 (JSON 下载)                      |
| GET    | `/api/v1/announcements`        | optionalAuth | 公告列表                                      |
| GET    | `/api/v1/announcements/latest` | optionalAuth | 最新公告                                      |
| POST   | `/api/v1/announcements`        | auth         | 创建公告                                      |
| PUT    | `/api/v1/announcements/:id`    | auth         | 更新公告                                      |
| DELETE | `/api/v1/announcements/:id`    | auth         | 删除公告                                      |
| GET    | `/api/v1/site/info`            | optionalAuth | 站点信息 (从管理员用户获取)                   |
| GET    | `/api/v1/captcha`              | 无           | SVG 数学验证码 (含 Redis key)                 |
| POST   | `/api/v1/upload`               | auth         | 单文件上传                                    |
| POST   | `/api/v1/upload/multiple`      | auth         | 批量文件上传                                  |
| POST   | `/api/v1/comment-upload`       | 无           | 评论图片上传 (Redis 限流 3次/分钟, NSFW 检测, 5MB) |

---

## 7. 前端架构详情

### 7.1 全局布局 (App.vue)

```
┌─────────────────────────────────────────────────┐
│  NavBar (固定顶部, z-50, 毛玻璃效果)              │
│  ├── Logo (TechMind Blog)                       │
│  ├── 导航链接 (首页/分类/标签/归档/搜索/关于)       │
│  ├── 深色/浅色模式切换按钮                         │
│  └── 移动端汉堡菜单 (全屏固定, padding-top:64px, z-index:60) │
├──────────────────────┬──────────────────────────┤
│  Main Content        │  Sidebar (桌面端显示)      │
│  (flex-1)            │  (hidden md:block w-64)   │
│  <router-view>       │  ├── 头像 + 简介            │
│  + 页面过渡动画       │  ├── 统计 (文章/分类/标签)   │
│  (page-fade 0.2s)    │  ├── GitHub 社交链接        │
│                      │  ├── 公告                   │
│                      │  ├── 分类列表                │
│                      │  ├── 标签云                  │
│                      │  └── 最新文章                │
├──────────────────────┴──────────────────────────┤
│  Footer (版权 + 导航链接)                         │
│  © TechMind Blog. Powered by Vue 3 + Tailwind CSS│
├─────────────────────────────────────────────────┤
│  AiChatWidget (固定右下角, inline z-index:1000)   │
└─────────────────────────────────────────────────┘
```

**NavBar 毛玻璃逻辑**: 移动端菜单打开时或页面滚动时添加 `glass shadow-sm` 样式。

### 7.2 颜色主题系统

使用 Tailwind CSS v4 的 `@theme` + CSS 变量实现深色/浅色模式：

- **主题切换**: 通过 `document.documentElement.setAttribute('data-theme', theme)` 控制
- **深色模式变体**: `@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *))`
- **持久化**: 主题存储在 `localStorage.getItem('theme')`
- **系统偏好检测**: 初始化时检查 `prefers-color-scheme`, 默认深色模式
- **自定义 CSS 变量**: --color-bg, --color-card, --color-primary, --color-text, --color-border, --color-hover 等

### 7.3 SEO 系统

基于 `@unhead/vue` 实现完整的 SEO 元信息管理：

- **全局 SEO**: `App.vue` 中 `useSeoMeta` 设置 titleTemplate、description，`useHead` 设置 author、robots、viewport
- **文章页 SEO**: `composables/useSeo.ts` 中的 `useArticleSeo` 动态设置 og:title、og:description、keywords、canonical URL
- **普通页 SEO**: `usePageSeo` 设置页面级元信息、Twitter Card、Open Graph

### 7.4 状态管理 (Pinia)

| Store        | 职责         | 关键功能                                                                                    |
| ------------ | ------------ | ------------------------------------------------------------------------------------------- |
| `article.ts` | 文章数据管理 | `fetchArticles()`, `fetchArticle(id)`, `fetchArticlesByCategory()`, `searchArticles(query)`<br>**字段映射**：后端 `cover` → 前端 `cover_image`，后端 `summary` → 前端 `excerpt` |
| `auth.ts`    | 用户认证管理 | `login()`, `logout()`, `fetchProfile()`                                                     |
| `theme.ts`   | 主题状态管理 | `toggleTheme()`, `setTheme()`, `initTheme()`, `watchEffect` 持久化                          |

### 7.5 AI 组件

| 组件               | 功能          | 说明                                                       |
| ------------------ | ------------- | ---------------------------------------------------------- |
| `AiChatWidget.vue` | AI 聊天悬浮窗 | 固定右下角, SSE 流式对话, marked 渲染 Markdown, 移动端适配 |
| `AiSummary.vue`    | AI 文章摘要   | 调用 `/api/v1/ai/summary` 展示 AI 摘要                     |
| `AiTranslate.vue`  | AI 翻译       | 调用 `/api/v1/ai/translate`, 保留 HTML 标签                |

### 7.6 评论系统

| 组件                  | 功能            | 说明                                        |
| --------------------- | --------------- | ------------------------------------------- |
| `CommentSection.vue`  | 评论区容器      | 游标分页, 无限嵌套评论列表                  |
| `CommentNode.vue`     | 评论节点        | "A 回复 B" 布局, AI 标识, 嵌套递归渲染      |
| `MdCommentEditor.vue` | Markdown 编辑器 | md-editor-v3 二次封装, v-model, 图片上传 (/api/v1/comment-upload), Emoji |

---

## 8. 后端架构详情

### 8.1 配置管理 (config/index.js)

从 `.env` 加载配置:

| 配置项  | 环境变量                                                                | 默认值                                       |
| ------- | ----------------------------------------------------------------------- | -------------------------------------------- |
| 端口    | BACKEND_PORT                                                            | 3001                                         |
| 数据库  | DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD                         | localhost:3306/blog_3d                       |
| Redis   | REDIS_HOST, REDIS_PORT, REDIS_PASSWORD                                  | localhost:6379                               |
| JWT     | JWT_SECRET, JWT_EXPIRES_IN                                              | 7d                                           |
| 豆包 AI | DOUBAO_API_KEY, DOUBAO_BASE_URL, DOUBAO_CHAT_MODEL, DOUBAO_IMAGE_MODEL  | -                                            |
| Ollama  | OLLAMA_HOST, OLLAMA_EMBED_MODEL, OLLAMA_CHAT_ENABLED, OLLAMA_CHAT_MODEL | localhost:11434, nomic-embed-text, true, gemma3:4b |
| 上传    | UPLOAD_DIR, MAX_FILE_SIZE                                               | ./uploads, 10mb                              |
| CORS    | CORS_ORIGIN                                                             | http://localhost:5173,http://localhost:5174  |
| Chroma  | (config/index.js 中未定义，chromaService.js 硬编码)                                                  | http://localhost:8000                        |

### 8.2 Chroma RAG 知识库服务

`services/ai/chromaService.js` 是核心向量知识库服务，采用 **自定义 OllamaEmbeddingFunction** (不依赖 chromadb 默认嵌入器)：

| 方法                          | 功能               | 说明                                            |
| ----------------------------- | ------------------ | ----------------------------------------------- |
| `getClient()`                 | 获取 Chroma 客户端 | 单例模式, 连接 `http://localhost:8000`          |
| `getCollection()`             | 获取/创建集合      | 集合名 `blog_articles`, 自定义 Ollama 嵌入, HTTP API 兜底创建 |
| `addArticle(article)`         | 添加文章           | 拼接全文字段 (标题+摘要+分类+标签+正文), 800 字符分块, 删除旧数据后添加 |
| `addArticles(articles)`       | 批量添加           | 遍历调用 addArticle, 返回总块数                 |
| `syncAllArticles()`           | 全量同步           | 逐篇覆盖 (不删集合), 从 DB 查询所有已发布文章   |
| `searchSimilar(query, limit)` | 语义搜索           | 返回 chunkText, articleId, title, similarity, distance |
| `removeArticle(articleId)`    | 删除文章向量       | 按 article_id 元数据查询并删除                  |
| `clearAll()`                  | 清空知识库         | 直接 deleteCollection, 重置 collection 引用     |

**自定义 OllamaEmbeddingFunction**:
```javascript
class OllamaEmbeddingFunction {
  async generate(texts) {
    for (const text of texts) {
      const embedding = await getEmbedding(text); // 调用 Ollama /api/embeddings
      embeddings.push(embedding);
    }
    return embeddings;
  }
}
```

### 8.3 AI 服务架构

AI 服务采用**双驱动架构**:

```
客户端请求
    │
    ▼
AI 服务层 (services/ai/index.js)
    │
    ├── chat.js          对话双驱动
    │   ├── ollamaChat.js    (OLLAMA_CHAT_ENABLED=true 时优先)
    │   └── openai SDK      (Ollama 失败或禁用时降级到豆包)
    │
    ├── embedding.js     向量嵌入
    │   ├── getEmbedding(text)   → Ollama nomic-embed-text
    │   ├── embedArticle(id)    → ChromaService.addArticle
    │   └── searchSimilar()     → ChromaService.searchSimilar
    │
    ├── chromaService.js  Chroma RAG 管理 (自定义嵌入函数)
    ├── summary.js        RAG 全量摘要 + 单篇摘要 + 批量摘要
    ├── translate.js      豆包翻译 (保留 HTML)
    ├── tag.js            豆包标签生成 (自动写入数据库)
    ├── qa.js             RAG 问答 (流式 SSE + Markdown 输出)
    └── image.js          豆包图片生成 (封面图)
```

**对话流程**:
1. chatSimple()/chatStream() 检查 `OLLAMA_CHAT_ENABLED`
2. true → 调用 Ollama (ollamaChat/ollamaChatSimple/ollamaChatStream)
3. catch 异常 → 自动降级到豆包 OpenAI SDK
4. false → 直接调用豆包 API

### 8.4 限流系统（三种实现方式）

| 限流点       | 实现方式         | 窗口    | 上限    | 用途       |
| ------------ | ---------------- | ------- | ------- | ---------- |
| 全局 API     | express-rate-limit 中间件 | 15 分钟 | 1000 次 | 防止 DDoS  |
| 文章阅读量   | 手动 Redis 键检查 | 24 小时 | 3 次/IP | 防刷阅读量 (redis.get → 递增 → redis.set EX 86400) |
| 文章点赞     | 手动 Redis 键检查 | 24 小时 | 1 次/IP | 防刷点赞 (redis.get → redis.set EX 86400) |
| 评论点赞     | 手动 Redis 键检查 | 24 小时 | 1 次/IP | 防刷点赞 (redis.get → redis.set EX 86400) |
| 评论图片上传 | 自定义 createRateLimit 工具 | 1 分钟  | 3 次/IP | 防滥用 (rateLimit.js Redis 限流中间件) |

`utils/rateLimit.js` 提供了 `createRateLimit(keyPrefix, maxRequests, windowSeconds, keyFn)` 和 `isRateLimited()` 两个导出。

### 8.5 定时任务

`utils/cron.js` 封装了 `node-cron`，提供 `schedule()` 和 `safeSchedule()` 两个导出:

| 任务            | 表达式         | 说明                                                |
| --------------- | -------------- | --------------------------------------------------- |
| Chroma RAG 同步 | `*/30 * * * *` | 每 30 分钟全量同步文章到 Chroma, 启动时立即执行一次, 时区 Asia/Shanghai |

支持选项: name, timezone, runOnStart, enabled

### 8.6 邮件通知

`services/mail.js` 使用 QQ 邮箱 SMTP：

- 发送方: `2381345593@qq.com`
- 用途: 评论回复邮件通知 (Nodemailer)
- 标题格式: `【TechMind Blog】${replyAuthor} 回复了你的评论`
- 触发条件: 发表评论时如有 parent_id, 自动发送通知给被回复者

### 8.7 中间件体系

| 中间件             | 文件                        | 功能                                  |
| ------------------ | --------------------------- | ------------------------------------- |
| JWT 认证           | middleware/auth.js           | `auth` (必须登录) / `optionalAuth` (可选) |
| 文件上传           | middleware/upload.js         | Multer diskStorage, 10MB, UUID 重命名 |
| 全局错误处理       | middleware/errorHandler.js   | 统一 JSON 响应格式                    |

---

## 9. 访客日志 (VisitorLog)

VisitorLog 模型定义了日志结构，但目前<strong>未主动写入</strong>日志记录 — 阅读量和点赞计数直接操作 Redis 键值（INCREMENT 和 SET EX 86400），不创建 VisitorLog 行。模型保留以供后续扩展。

| 动作类型 | 说明                            |
| -------- | ------------------------------- |
| `view`   | 阅读文章 (记录 IP + User-Agent) |
| `like`   | 点赞文章 (记录 IP + User-Agent) |

**限流实现**: Redis 键格式:
- `article_view:{articleId}:{ip}` (24h 最多 3 次)
- `article_like:{articleId}:{ip}` (24h 最多 1 次)
- `comment_like:{commentId}:{ip}` (24h 最多 1 次)

TTL 均为 86400 秒。每次请求先通过 `redis.get()` 检查是否已达上限，未达上限则操作并更新计数器。

---

## 10. 环境依赖

### 10.1 外部服务

| 服务         | 用途                           | 默认地址        |
| ------------ | ------------------------------ | --------------- |
| MySQL        | 关系型数据库                   | localhost:3306  |
| Redis        | 缓存 + 限流 + 验证码存储       | localhost:6379  |
| Chroma       | 向量知识库 (RAG)               | localhost:8000  |
| Ollama       | 本地大模型 (嵌入 + 对话)       | localhost:11434 |
| 豆包 API     | 云端 AI 服务 (备用对话 + 图片) | -               |
| QQ 邮箱 SMTP | 评论通知邮件                   | smtp.qq.com:465 |

### 10.2 启动命令

```bash
# 后端
cd backend
npm install
nodemon app.js         # 开发模式
node app.js            # 生产模式

# 前端
cd frontend
npm install
npm run dev-frontend   # 开发模式 (vite)
npm run build          # 构建

# 管理面板
cd admin
npm install
npm run dev-admin      # 开发模式 (vite)
npm run build          # 构建

# Chroma RAG (需要单独启动)
chroma run --path ./chroma_data --port 8000

# 数据库初始化 (首次启动自动同步模型)
# 在 backend/app.js 中取消注释 syncDatabase() 即可

```
---
### 10.3 docker 部署
```bash
# 后端
# 构建镜像（backend/DockerFile）目录下
docker build -t blog-app .

# 启动容器
docker run -d \
--name blog-app \
-p 3000:3000 \
-e DB_HOST=数据库容器名 \
-e REDIS_HOST=redis容器名 \
-e OLLAMA_CHAT_ENABLED=是否使用本地模型 \
-v 宿主机uploads路径:/blog-app/uploads \
blog-app
```

## 11. 项目版本信息

| 子系统   | package.json name | 版本  |
| -------- | ----------------- | ----- |
| frontend | 3d-blog-frontend  | 1.0.0 |
| backend  | 3dblog-backend    | 1.0.0 |
| admin    | 3dblog-admin      | 1.0.0 |

### 版本历史

| 版本 | 日期       | 变更内容 |
| ---- | ---------- | -------- |
| v2.2 | 2026-05-20 | 代码审查校准：修正 User 模型字段（移除不存在的 bio/website/social_links），修正 Comment.id 类型为 STRING(36) UUID，修正首页路由标题为 LinzyBlog，修正 useSeoMeta 描述（author/robots 通过 useHead 设置），标注 @unhead/vue 为 devDependency，补充前端字段映射（cover→cover_image, summary→excerpt），修正 VisitorLog 实际未被写入的事实，更新 Chroma 配置说明（硬编码于 chromaService.js） |
| v2.1 | 2026-05-20 | 文档重构：修正限流实现描述（手动 Redis vs express-rate-limit），补充 Comment 模型缺失字段 (avatar, content_type, like_count)，新增评论点赞 API，明确 @unhead/vue SEO 方案，修复 NavBar 移动端 padding 值为 64px，补充 AI 双驱动架构细节，修正 multer 版本号 |
| v2.0 | 2026-05-20 | 博客名称更新为 TechMind Blog；集成 Chroma RAG 知识库；AI 对话流式 SSE；Redis 限流；Markdown 评论编辑器；NSFW 图片检测；文章点赞功能 |
| v1.0 | 2026-01-15 | 初始版本：三子系统架构、基础 CRUD、AI 写作、JWT 认证 |

---

## 12. 架构决策记录

| 决策                     | 说明                                                                |
| ------------------------ | ------------------------------------------------------------------- |
| MySQL → Chroma RAG       | 文章向量存储从 MySQL 迁移至 Chroma, 支持更强大的语义搜索和 RAG 问答; 自定义 OllamaEmbeddingFunction 避免 chromadb 默认嵌入器依赖 |
| Ollama 双驱动            | 支持本地 Ollama 模型和云端豆包 API 双驱动, 本地优先, 失败自动切换   |
| 三种限流方式并存         | 全局 API 用 express-rate-limit; 资源级限流用手动 Redis 键检查; 自定义场景用 createRateLimit 工具函数 |
| @unhead/vue SEO          | 替代 vite-plugin-prerender (ESM 不兼容), 运行时动态设置 OG/Twitter/canonical |
| 定时同步                 | 每 30 分钟全量同步 articles → Chroma, 启动时立即执行, 保障数据一致性 |
| 评论 NSFW 检测           | 评论图片上传自动检测 NSFW 内容 (像素级肤色分析), 保障内容安全       |
| SVG 验证码               | 登录使用数学验证码 + Redis 一次性校验, 防止暴力破解                  |
| 评论 QQ 号绑定           | 发表评论使用 QQ 号自动获取昵称和头像, 降低垃圾评论风险              |
| 游标分页                 | 评论列表使用游标分页 (cursor-based), 替代传统 offset 分页, 避免深度分页性能问题 |