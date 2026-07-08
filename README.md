# TechMind Blog

一个功能完善的个人博客系统，采用现代化的前后端分离架构，支持文章管理、分类标签、AI 智能问答、评论系统等功能。

## 项目简介

TechMind Blog 是一个全栈博客平台，旨在为开发者提供一个高性能、可扩展的个人博客解决方案。系统采用 Vue 3 + Node.js + MySQL 技术栈构建，支持 SEO 优化、AI 智能对话、RAG 知识库等功能。

## 技术栈

### 前端技术栈 (frontend)
- **框架**: Vue 3 + TypeScript
- **状态管理**: Pinia
- **路由**: Vue Router
- **UI 组件**: Ant Design Vue
- **构建工具**: Vite

### 后端技术栈 (backend)
- **运行环境**: Node.js
- **框架**: Express
- **数据库**: MySQL
- **向量数据库**: Chroma (RAG 知识库)
- **AI 服务**: OpenAI API 集成

### 管理面板技术栈 (admin)
- **框架**: Vue 3 + TypeScript
- **UI 组件**: Ant Design Vue
- **构建工具**: Vite

## 核心功能

### 博客功能
- 📝 文章发布与管理
- 🏷️ 分类与标签系统
- 💬 评论与互动
- 🔍 文章搜索与筛选
- 🌐 SEO 优化支持

### AI 智能功能
- 🤖 AI 智能问答
- 📚 RAG 知识库集成
- ✨ 文章智能摘要
- 💡 智能推荐

### 系统特性
- 🎨 颜色主题系统（明暗主题切换）
- 📱 响应式设计
- 🔒 用户认证与权限管理
- 📊 访客日志分析
- ⏰ 定时任务处理
- 📧 邮件通知
- 🛡️ 多层限流保护

## 项目结构

```
3DBlog/
├── frontend/          # 博客前端
│   ├── src/
│   │   ├── components/  # 公共组件
│   │   ├── views/       # 页面视图
│   │   ├── router/      # 路由配置
│   │   ├── stores/      # Pinia 状态管理
│   │   └── ...
│   └── ...
│
├── backend/           # 后端服务
│   ├── routes/        # API 路由
│   ├── models/        # 数据模型
│   ├── services/      # 业务逻辑
│   ├── middleware/    # 中间件
│   ├── config/       # 配置文件
│   └── app.js        # 入口文件
│
├── admin/            # 管理后台
│   ├── src/
│   │   ├── components/
│   │   ├── views/
│   │   └── ...
│   └── ...
│
└── chroma/           # Chroma RAG 服务
```

## API 接口概览

系统提供完整的 RESTful API 接口，主要模块包括：

| 模块 | 路径 | 说明 |
|------|------|------|
| 认证 | `/api/v1/auth` | 用户登录、注册、令牌管理 |
| 文章 | `/api/v1/articles` | 文章 CRUD 操作 |
| 分类 | `/api/v1/categories` | 分类管理 |
| 标签 | `/api/v1/tags` | 标签管理 |
| 评论 | `/api/v1/comments` | 评论系统 |
| AI 服务 | `/api/v1/ai` | 15 个 AI 相关端点 |

## 快速开始

### 环境要求

- Node.js >= 16.0
- MySQL >= 5.7
- npm 或 yarn

### 安装步骤

1. **克隆项目**
```bash
git clone https://gitee.com/ma-xinjian/blog.git
cd blog
```

2. **安装后端依赖**
```bash
cd backend
npm install
```

3. **安装前端依赖**
```bash
cd ../frontend
npm install
```

4. **安装管理面板依赖**
```bash
cd ../admin
npm install
```

5. **配置环境变量**

在 `backend` 目录下创建 `.env` 文件，配置数据库连接和 AI 服务密钥。

6. **启动服务**

**后端服务：**
```bash
cd backend
npm start
```

**前端开发：**
```bash
cd frontend
npm run dev
```

**管理面板开发：**
```bash
cd admin
npm run dev
```

**Chroma RAG 服务：**
```bash
cd chroma
python app.py
```

### 数据库初始化

首次启动时，系统会自动同步数据库模型。也可在 `backend/app.js` 中手动调用 `syncDatabase()` 进行初始化。

## Docker 部署

项目支持 Docker 容器化部署：

```bash
# 构建后端镜像
cd backend
docker build -t blog-backend .

# 启动容器
docker run -d -p 3000:3000 blog-backend
```

## 许可证

本项目基于 MIT 许可证开源，详情请参阅 [LICENSE](LICENSE) 文件。

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 版本历史

- v1.0.0 - 初始版本发布
- 后续版本持续更新中...

---

<p align="center">Built with ❤️ by TechMind</p>