# TechMind Blog 使用文档

本文档详细介绍 TechMind Blog 三端（前台博客 / 管理后台 / 后端 API）的开发启动、生产部署、配置管理与桌面端应用使用方法。

## 目录

- [1. 概述](#1-概述)
- [2. 环境准备](#2-环境准备)
- [3. 开发模式启动](#3-开发模式启动)
- [4. 生产部署](#4-生产部署)
- [5. 配置管理](#5-配置管理)
- [6. 桌面端应用（Electron）](#6-桌面端应用electron)
- [7. 故障排查](#7-故障排查)
- [8. 常见问题（FAQ）](#8-常见问题faq)

---

## 1. 概述

TechMind Blog 是一个全栈博客系统，包含三个独立应用：

| 应用 | 目录 | 技术栈 | 默认端口 |
|------|------|--------|----------|
| 前台博客 | `frontend/` | Vue 3 + Vite + TailwindCSS | 5173（dev）/ 80（prod） |
| 管理后台 | `admin/` | Vue 3 + Vite + Ant Design Vue 4 | 5174（dev）/ 80（prod） |
| 后端 API | `backend/` | Node.js + Express + Sequelize | 3000 |

管理后台同时支持打包为 Windows 桌面应用（Electron）。

**生产架构**：所有服务通过 Nginx 网关（80 端口）统一入口，路由规则：
- `/api/*` → 后端 API
- `/uploads/*` → 后端静态文件
- `/admin` → 管理后台
- `/` → 前台博客

因此生产环境中后端 API 与客户端同域，前端走 `/api/v1` 相对路径即可，无需配置跨域。

---

## 2. 环境准备

### 基础环境

| 软件 | 最低版本 | 用途 |
|------|---------|------|
| Node.js | 18 | 三端运行时 |
| MySQL | 8.0 | 数据库 |
| Redis | 7 | 缓存、限流、会话 |

### 可选服务

| 软件 | 用途 |
|------|------|
| MinIO | 对象存储（媒体库双存储之一） |
| Ollama | 本地 AI 对话模型 |

### 克隆项目

```bash
git clone <repository-url>
cd blog
```

---

## 3. 开发模式启动

开发模式下三端独立启动，通过 Vite 代理转发 API 请求。

### 3.1 启动后端

```bash
cd backend
npm install
# 按需修改本地配置 .env.development 
npm run dev-backend
```

后端启动后会自动：
- 同步数据库模型（`sequelize.sync()`）
- 加载站点配置、邮件配置、上传配置
- 启动定时发布调度器
- 验证邮件服务连接

默认运行在 `http://localhost:3000`，Swagger 文档位于 `http://localhost:3000/api-docs`。

### 3.2 启动前台博客

```bash
cd frontend
npm install
npm run dev-frontend
```

默认运行在 `http://localhost:5173`，通过 Vite 代理将 `/api` 和 `/uploads` 转发到后端。

### 3.3 启动管理后台（Web 端）

```bash
cd admin
npm install
npm run dev-admin
```

默认运行在 `http://localhost:5174`，首次访问需登录（默认账号 `admin` / `admin123`）。

Web 端管理后台通过 Vite 代理走 `/api/v1` 相对路径，无需配置后端地址。

### 3.4 启动管理后台（Electron 开发模式）

```bash
cd admin
npm run electron:dev
```

该命令会并行启动 Vite 开发服务器和 Electron 主进程，加载 `http://localhost:5174`。开发模式下 Electron 会读取 `admin/.env.development` 作为配置模板。

---

## 4. 生产部署

### 4.1 Docker Compose 一键部署（推荐）

项目根目录提供完整的 Docker 编排，一键启动所有服务。

#### 步骤 1：创建环境变量文件

```bash
编写中
```

#### 步骤 2：构建镜像并启动

```bash
docker-compose up -d --build
```

#### 步骤 3：访问服务

| 服务 | 访问地址 | 说明 |
|------|----------|------|
| 前台博客 | `http://your-server-ip/` | Nginx 网关 80 端口 |
| 管理后台 | `http://your-server-ip/admin` | 通过网关路由 |
| 后端 API | `http://your-server-ip/api/v1` | 通过网关路由 |
| Swagger | `http://your-server-ip/api-docs` | 仅建议内网开放 |

> 数据库与 Redis 仅绑定 `127.0.0.1`，外部无法直接访问，确保安全。

#### 端口映射说明

| 服务 | 容器端口 | 主机端口 | 备注 |
|------|----------|----------|------|
| Nginx 网关 | 80 / 443 | 80 / 443 | 对外唯一入口 |
| 前台博客 | 80 | 8080 | 可直连调试 |
| 管理后台 | 80 | 8081 | 可直连调试 |
| 后端 API | 3000 | 127.0.0.1:3000 | 仅本机 |
| MySQL | 3306 | 127.0.0.1:3306 | 仅本机 |
| Redis | 6379 | 127.0.0.1:6379 | 仅本机 |

### 4.2 Nginx 网关路由规则

网关配置见 [nginx/gateway.conf](../nginx/gateway.conf)：

```nginx
location /api/    { proxy_pass http://backend; }   # 后端 API
location /uploads/ { proxy_pass http://backend; }  # 上传文件
location /admin   { proxy_pass http://admin; }      # 管理后台
location /        { proxy_pass http://frontend; }   # 前台博客
```

如需启用 HTTPS，将证书放到 `nginx/ssl/` 并修改网关配置。

### 4.3 手动部署（不使用 Docker）

若不使用 Docker，可分别构建三端并通过进程管理器（如 PM2）运行：

```bash
# 后端
cd backend
npm install --production
npm run start-backend    # 建议用 PM2: pm2 start src/app.js --name blog-backend

# 前台
cd frontend
npm install
npm run build            # 产物在 dist/，用 nginx 托管

# 管理后台（Web 端）
cd admin
npm install
npm run build            # 产物在 dist/，用 nginx 托管
```

手动部署需自行配置 Nginx 反向代理，参考 `nginx/gateway.conf`。

---

## 5. 配置管理

### 5.1 后端环境变量（backend/.env.development）

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

> 生产环境建议将 `CORS_ORIGIN` 限制为具体域名，如 `https://your-domain.com,http://localhost:5174`。

### 5.2 管理端环境变量（admin/.env.production）

管理端环境变量分两类：**构建期变量**（Vite 注入，Web 端用）和 **运行期变量**（Electron 桌面端运行时读写）。

| 变量 | 类型 | 说明 | 生产默认值 |
|------|------|------|-----------|
| `NODE_ENV` | 通用 | 环境标识 | `production` |
| `VUE_APP_API_URL` | 运行期 | 客户端访问地址（站点根，生成文章链接用） | `http://111.228.9.147` |
| `VUE_APP_BACKEND_URL` | 运行期 | 后端 API 地址（桌面端连接后端用） | `http://192.168.48.1:3000` |
| `VUE_APP_DEBUG` | 通用 | 调试模式开关 | `false` |
| `VUE_APP_MOCK` | 通用 | Mock 数据开关 | `false` |
| `VITE_CLIENT_BASE_URL` | 构建期 | 客户端访问地址（仅 dev 模式注入，Web 端用） | - |

#### 字段语义说明

- **`VUE_APP_API_URL`（客户端访问地址）**：客户端博客站点的根地址，管理端用它在文章列表、评论管理中生成「查看文章」链接。生产同域部署时通常为 `http://your-server-ip` 或 `https://your-domain.com`（不带端口，走 Nginx 80/443）。
- **`VUE_APP_BACKEND_URL`（后端 API 地址）**：桌面端 Electron 连接后端服务的地址，可以是局域网直连（如 `http://192.168.48.1:3000`）或同域走 Nginx（如 `http://your-server-ip`）。

> **Web 端管理后台**通过 Vite 代理走 `/api/v1` 相对路径，**无需配置** `VUE_APP_BACKEND_URL`；Web 端的客户端地址在生产同域部署时自动取 `window.location.origin`，也无需配置。

### 5.3 运行时配置（站点设置）

邮件、上传（MinIO）、站点名称、站点 Logo、AI 服务、爬虫 Token 等运行时配置通过管理后台「系统设置」管理，存储在数据库 `site_configs` 表，**无需重启即可生效**。

进入「系统设置」可配置以下分类：
- **站点信息**：站点名称、Logo、备案号
- **邮件配置**：SMTP 服务器、发件人、邮件模板
- **上传配置**：本地/MinIO 存储切换、文件大小限制
- **AI 配置**：豆包/Ollama 模型选择、API Key
- **爬虫 Token**：GitHub Token
- **桌面端配置**（仅 Electron 环境）：后端服务地址、客户端访问地址

---

## 6. 桌面端应用（Electron）

管理后台支持打包为 Windows 桌面应用，适合不便用浏览器访问的场景，或需要直连内网后端的管理员。

### 6.1 打包

```bash
cd admin
npm install
npm run electron:build             # 生成 NSIS 安装包（admin/release/）
npm run electron:build:portable    # 生成便携版 exe（单文件，免安装）
```

打包配置见 [admin/electron-builder.yml](../admin/electron-builder.yml)：
- 应用名：`Blog管理后台`
- 图标：`build/icon.ico`
- 打包文件：`dist/`（前端产物）+ `electron/`（主进程）+ `.env.production`（配置模板）

> `.env.production` 会被打进 asar 包作为**只读模板**，运行时复制到用户数据目录作为可写副本。

### 6.2 配置文件机制

桌面端配置采用「**asar 模板 + userData 可写副本**」双文件机制：

```
打包后：
  app.asar/.env.production          ← 只读模板（随包分发）

首次启动：
  %APPDATA%/Blog管理后台/.env.production  ← 从模板复制，可写副本
```

之后所有配置读写均针对 userData 副本，确保用户修改持久化且不被升级覆盖。

#### 配置文件位置

| 操作系统 | 路径 |
|----------|------|
| Windows | `%APPDATA%\Blog管理后台\.env.production` |
| macOS | `~/Library/Application Support/Blog管理后台/.env.production` |
| Linux | `~/.config/Blog管理后台/.env.production` |

### 6.3 首次启动配置

首次启动桌面端时，若检测到未配置后端地址，会弹出 **「配置后端服务地址」** 弹窗：

1. 输入后端服务地址（如 `http://192.168.48.1:3000`），无需加 `/api/v1` 后缀
2. 点击「测试连接」验证后端可达性（请求 `/api/v1/site/health`）
3. 测试通过后点击「保存并连接」，配置写入 `.env.production` 副本并立即生效

> 首次配置只需后端地址，客户端访问地址会使用模板默认值（`VUE_APP_API_URL`）。

### 6.4 运行时修改配置

进入「**系统设置 → 桌面端配置**」tab（仅 Electron 环境显示），可同时修改：

- **后端服务地址**（`VUE_APP_BACKEND_URL`）：桌面端连接后端 API 的地址
- **客户端访问地址**（`VUE_APP_API_URL`）：客户端博客站点根地址，用于生成文章链接

点击「保存配置」后：
1. 两个字段同时写入 `.env.production` 副本
2. 后端 API 地址立即应用到 axios 实例
3. 客户端访问地址立即更新到运行时 `CLIENT_BASE_URL`，文章列表/评论管理的链接即时刷新

### 6.5 升级与迁移

#### 从旧版 `config.json` 迁移

若用户数据目录存在旧版 `config.json`（早期版本使用 JSON 存储配置），首次启动新版时会自动：
1. 读取 `config.json` 中的 `apiBaseUrl`
2. 将其写入 `.env.production` 副本的 `VUE_APP_BACKEND_URL` 字段
3. 删除旧 `config.json` 文件

#### 污染副本自动修复

从旧版本升级时（副本缺少 `VUE_APP_BACKEND_URL` 字段），启动时会自动修复：
1. 检测到副本缺 `VUE_APP_BACKEND_URL` 字段
2. 将当前 `VUE_APP_API_URL` 的值（可能被旧版本误写为后端地址）迁移到 `VUE_APP_BACKEND_URL`
3. 从 asar 模板恢复 `VUE_APP_API_URL` 为正确的客户端访问地址
4. 写回副本

该机制确保用户无感知地完成配置字段语义升级，无需手动干预。

#### 同步模板新增字段

每次启动时，若模板新增了字段（副本中不存在），会自动从模板补全，不影响用户已配置的字段。

### 6.6 静态资源代理

桌面端通过 `file://` 协议加载页面，相对路径（如 `/uploads/xxx.jpg`）会被解析为本地路径导致 404。Electron 主进程通过 `webRequest` 拦截 `file://` 请求，将 `/uploads/`、`/minio/api/` 前缀的请求重定向到后端地址（`VUE_APP_BACKEND_URL`）。

因此图片、视频等静态资源在桌面端能正确加载，无需额外配置。

---

## 7. 故障排查

### 7.1 桌面端无法连接后端

**现象**：登录页提示「网络连接失败，请检查后端服务是否启动」

**排查步骤**：
1. 进入「系统设置 → 桌面端配置」，确认后端服务地址正确
2. 点击「测试连接」验证（或手动在浏览器访问 `http://your-backend:3000/api/v1/site/health`）
3. 检查后端服务是否运行，防火墙是否放行端口
4. 若后端地址变更，修改后保存，会立即生效

### 7.2 文章链接跳转错误

**现象**：管理端点击文章标题，跳转到的客户端链接错误或为空

**排查步骤**：
1. 进入「系统设置 → 桌面端配置」，确认客户端访问地址正确（应为博客站点根，如 `http://your-domain.com`，不带 `/api`）
2. Web 端管理后台无需配置，自动取当前页面 origin；若 Web 端也出错，检查是否同域部署
3. 桌面端修改客户端访问地址后，文章列表/评论管理的链接会立即刷新

### 7.3 配置文件被污染

**现象**：`VUE_APP_API_URL` 的值看起来像后端地址（带端口号如 `:3000`）

**原因**：旧版本将 `VUE_APP_API_URL` 误用为后端 API 地址字段

**修复**：
- **自动修复**：升级到新版本后首次启动会自动修复（见 [6.5 污染副本自动修复](#65-升级与迁移)）
- **手动修复**：关闭应用，编辑 `%APPDATA%\Blog管理后台\.env.production`：
  ```env
  VUE_APP_API_URL=http://your-domain.com
  VUE_APP_BACKEND_URL=http://192.168.48.1:3000
  ```
  保存后重新启动应用。

### 7.4 重置桌面端配置

若配置彻底混乱，可重置为模板默认值：

1. 完全退出桌面端应用
2. 删除用户数据目录的 `.env.production` 副本：
   ```bash
   # Windows
   del "%APPDATA%\Blog管理后台\.env.production"
   ```
3. 重新启动应用，会从 asar 模板重新复制一份默认配置
4. 首次启动会弹出配置弹窗，重新输入后端服务地址

> 删除 `.env.production` 副本不会影响其他 userData（如登录状态、缓存）。

### 7.5 后端 CORS 报错

**现象**：浏览器控制台报 `Access-Control-Allow-Origin` 错误

**排查**：
- 生产环境通过 Nginx 网关同域访问，通常无 CORS 问题
- 开发环境通过 Vite 代理，也无 CORS 问题
- 若直连后端（如桌面端），后端 `CORS_ORIGIN` 需包含来源，或后端已对 `/uploads` 设置 `cross-origin`（见 `backend/app.js`）

### 7.6 Docker 部署后管理后台 502

**现象**：访问 `/admin` 返回 502 Bad Gateway

**排查**：
1. 检查 admin 容器是否运行：`docker ps | grep blog-admin`
2. 检查 admin 容器日志：`docker logs blog-admin`
3. 确认 `nginx/gateway.conf` 中 `upstream admin` 的端口与 admin 容器监听端口一致

---

## 8. 常见问题（FAQ）

### Q1: 桌面端和 Web 端管理后台有什么区别？

功能完全一致。区别在于：
- **Web 端**：浏览器访问，通过 Vite 代理/Nginx 网关走相对路径，无需配置后端地址
- **桌面端**：Electron 应用，通过 `file://` 加载，需显式配置后端 API 地址和客户端访问地址

### Q2: 为什么桌面端需要两个地址？

桌面端通过 `file://` 协议加载页面，没有「当前页面 origin」的概念，因此：
- **后端 API 地址**：axios 需要知道请求发往哪里
- **客户端访问地址**：生成「查看文章」链接时需要知道博客站点地址

Web 端这两个地址都可以从当前页面 origin 推导（同域部署），所以无需配置。

### Q3: 修改 `.env.production` 后需要重新打包吗？

- **asar 内的模板**：需要重新打包（`npm run electron:build`）
- **用户数据目录的副本**：不需要，修改后重启应用即可；也可在「系统设置 → 桌面端配置」中在线修改，立即生效

建议：打包时模板用合理默认值，用户首次启动后通过设置页定制，避免频繁重新打包。

### Q4: 多个管理员可以共享桌面端配置吗？

不可以。桌面端配置存储在各自机器的用户数据目录，每个管理员独立配置。这是设计如此，因为不同管理员可能处于不同网络环境（如内网/外网），需要连接不同的后端地址。

### Q5: 后端地址配成走 Nginx 还是直连后端？

两种方式都可行：
- **走 Nginx（同域）**：`VUE_APP_BACKEND_URL=http://your-domain.com`，后端 API 经 `/api` 反代。优点是统一入口，缺点是依赖 Nginx 可用
- **直连后端**：`VUE_APP_BACKEND_URL=http://192.168.48.1:3000`，绕过 Nginx。优点是直连性能略好，缺点是后端端口需对管理员开放

默认配置采用直连方式（`http://192.168.48.1:3000`），适合内网管理员。外网管理员建议走 Nginx。

### Q6: 如何切换 AI 服务（豆包 / Ollama）？

AI 服务配置在管理后台「系统设置 → AI 配置」中管理，运行时生效：
- **豆包**：填写 `DOUBAO_API_KEY`、`DOUBAO_BASE_URL`、模型名
- **Ollama**：填写 `OLLAMA_HOST`，开启 `OLLAMA_CHAT_ENABLED`，选择模型

两者可同时启用，在文章编辑器中切换。

### Q7: 媒体库存储如何从本地迁移到 MinIO？

在「媒体库」页面选择目标存储（本地/MinIO），系统支持批量迁移，迁移时会自动更新所有引用（文章内容、封面、音乐 play_url、友链头像、歌单封面、站点配置等），无需手动修改。

### Q8: 默认管理员账号密码是什么？

默认账号 `admin` / `admin123`，可通过种子脚本或数据库初始化创建。**生产环境请务必修改默认密码**。

---

## 相关文档

- [项目 README](../README.md)
- [Nginx 网关配置](../nginx/gateway.conf)
- [Docker 编排](../docker-compose.yml)
- [Electron 打包配置](../admin/electron-builder.yml)
- [后端 Swagger 文档](http://localhost:3000/api-docs)（运行后访问）

---

*如发现问题或需要补充，欢迎提 issue 或 PR。*
