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

项目部署文档：[docs/USAGE.md](docs/USAGE.md)

## 许可证

本项目基于 [木兰宽松许可证 v2](LICENSE) 开源。

Copyright (c) TechMind Blog is licensed under Mulan PSL v2.
