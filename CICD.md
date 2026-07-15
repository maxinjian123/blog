# CI/CD 部署指南

## 流水线概览

本项目使用 GitLab CI/CD 实现自动化构建与部署，包含三个阶段：

1. **test** - 代码检查与类型校验
2. **build** - Docker 镜像构建与推送
3. **deploy** - 自动部署到服务器

## 触发规则

- `develop` 分支：自动构建 + 自动部署到开发环境
- `main` 分支：自动构建 + 手动点击部署到生产环境
- Merge Request：仅运行测试阶段

## GitLab CI/CD 变量配置

在 GitLab 项目的 `Settings -> CI/CD -> Variables` 中添加以下变量：

### 容器镜像仓库配置
| 变量名 | 说明 | 示例 |
|--------|------|------|
| `CI_REGISTRY_USER` | 镜像仓库用户名 | `root` |
| `CI_REGISTRY_PASSWORD` | 镜像仓库密码 | `your_password` |

### 部署服务器配置
| 变量名 | 说明 | 示例 |
|--------|------|------|
| `DEPLOY_HOST` | 部署服务器IP | `192.168.1.100` |
| `DEPLOY_USER` | SSH登录用户 | `root` |
| `DEPLOY_PATH` | 部署目录路径 | `/opt/blog` |
| `SSH_PRIVATE_KEY` | SSH私钥内容 | 完整的私钥文本 |

## 服务器部署准备

### 1. 安装 Docker 和 Docker Compose
```bash
# 安装 Docker
curl -fsSL https://get.docker.com | bash

# 启动 Docker
systemctl enable docker
systemctl start docker
```

### 2. 创建部署目录
```bash
mkdir -p /opt/blog/nginx
mkdir -p /opt/blog/nginx/ssl
```

### 3. 上传配置文件
将以下文件上传到部署服务器 `/opt/blog` 目录：
- `docker-compose.yml`
- `.env` (从 .env.example 复制并修改)
- `nginx/gateway.conf`

### 4. 配置 SSH 免密登录
```bash
# 本地生成密钥对
ssh-keygen -t rsa -b 4096 -C "gitlab-ci"

# 将公钥添加到服务器
ssh-copy-id root@your-server-ip

# 将私钥内容复制到 GitLab CI 变量 SSH_PRIVATE_KEY
cat ~/.ssh/id_rsa
```

## 项目结构

```
blog/
├── .gitlab-ci.yml          # CI/CD 主配置
├── docker-compose.yml      # Docker 编排配置
├── .env.example            # 环境变量示例
├── nginx/
│   └── gateway.conf        # 统一网关配置
├── backend/
│   ├── Dockerfile          # 后端 Dockerfile
│   └── ...
├── frontend/
│   ├── Dockerfile          # 前端 Dockerfile
│   ├── nginx.conf          # 前端Nginx配置
│   └── ...
└── admin/
    ├── Dockerfile          # 管理后台 Dockerfile
    ├── nginx.conf          # 后台Nginx配置
    └── ...
```

## 访问地址

部署成功后，访问地址如下：

| 服务 | 地址 | 说明 |
|------|------|------|
| 博客前台 | `http://your-domain/` | 主站 |
| 管理后台 | `http://your-domain/admin` | 后台管理系统 |
| API接口 | `http://your-domain/api/` | 后端接口 |

## 本地测试构建

### 单独构建后端
```bash
cd backend
docker build -t blog-backend .
```

### 单独构建前端
```bash
cd frontend
docker build -t blog-frontend .
```

### 本地启动全部服务
```bash
# 复制环境变量
cp .env.example .env
# 修改 .env 中的配置

# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 流水线优化建议

1. **添加缓存**：为 npm install 添加缓存，加快构建速度
2. **单元测试**：添加后端单元测试和前端组件测试
3. **代码质量**：集成 ESLint、SonarQube 等代码质量检查
4. **安全扫描**：添加容器镜像安全扫描
5. **通知**：添加部署成功/失败的企业微信/邮件通知
