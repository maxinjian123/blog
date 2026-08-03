# MinIO 部署文档

> 本文档详细说明 MinIO 对象存储在 **Windows**、**Linux**、**macOS** 以及 **Docker** 环境下的部署步骤，涵盖环境准备、软件下载、安装配置、启动验证、安全加固与性能调优。
>
> 文档基于 MinIO 最新稳定版编写（`RELEASE.2026-8-3 10:55:38`，截至 2026-8-3）。MinIO 版本命名格式为 `RELEASE.<日期>T<时间>Z`，请以 [官方 Release 页面](https://github.com/minio/minio/releases) 为准。

---

## 目录

1. [MinIO 简介](#1-minio-简介)
2. [环境准备要求](#2-环境准备要求)
3. [软件下载指南](#3-软件下载指南)
4. [Linux 部署](#4-linux-部署)
5. [Windows 部署](#5-windows-部署)
6. [macOS 部署](#6-macos-部署)
7. [Docker 部署](#7-docker-部署)
8. [服务启动与验证](#8-服务启动与验证)
9. [安全最佳实践](#9-安全最佳实践)
10. [性能优化建议](#10-性能优化建议)
11. [常见问题解决方案](#11-常见问题解决方案)
12. [参考资料](#12-参考资料)

---

## 1. MinIO 简介

MinIO 是一个高性能、与 Amazon S3 完全兼容的对象存储服务器，使用 Go 语言编写，支持在任意位置部署（公有云、私有云、裸机、边缘环境）。

**核心特性：**

| 特性 | 说明 |
|------|------|
| S3 兼容 | 兼容 S3 REST API 全部核心功能，可无缝替换 AWS S3 |
| 纠删码（Erasure Coding） | 数据分片冗余存储，保障数据可用性与完整性 |
| 多架构支持 | 支持 Linux / Windows / macOS / FreeBSD，以及 amd64 / arm64 架构 |
| 轻量级 | 单二进制文件即可运行，无外部依赖 |
| 自带 Web 控制台 | 默认端口 `9001`，提供可视化管理界面 |
| 双许可证 | AGPL v3.0 / MinIO 商业许可证 |

**默认端口：**

| 端口 | 用途 |
|------|------|
| `9000` | S3 API 服务（供应用客户端访问） |
| `9001` | Web 管理控制台（Console） |

**默认凭据：** `minioadmin` / `minioadmin`（首次启动后**必须修改**，见[安全最佳实践](#9-安全最佳实践)）。

---

## 2. 环境准备要求

### 2.1 硬件要求

| 资源 | 开发/测试环境 | 生产环境（建议） |
|------|--------------|-----------------|
| CPU | 1 核以上 | 4 核以上 |
| 内存 | 1 GB 以上 | 16 GB 以上 |
| 磁盘 | 单盘即可 | 4 块以上独立磁盘（用于纠删码） |

### 2.2 操作系统要求

- **Linux**：主流发行版均可（Ubuntu、CentOS/RHEL、Debian 等），内核 4.0+
- **Windows**：Windows 10/11、Windows Server 2022/2025（Microsoft Modern Lifecycle 支持范围内的版本）
- **macOS**：macOS 12 及以上（Intel 与 Apple Silicon 均支持）

> **注意**：MinIO 官方仅支持在 Windows 上运行**单节点**（单盘 SNSD / 多盘 SNMD）拓扑，不支持 Windows 上的多节点分布式部署（MNMD）。

### 2.3 网络与端口要求

- 客户端与服务器之间需开放 S3 API 端口（默认 `9000`）
- 管理控制台端口（默认 `9001`）**建议仅对内网开放**
- 分布式部署需节点间互相开放 API 端口

### 2.4 存储要求

- 数据目录需具有读写与删除权限
- 生产环境建议使用独立的 SSD/NVMe 磁盘，避免与系统盘共用
- 分布式部署建议各节点磁盘数量一致，以便纠删码均匀分布

### 2.5 时间同步

分布式多节点部署时，**所有节点必须启用 NTP 时间同步**，否则可能出现数据一致性问题：

```bash
# Ubuntu / Debian
sudo timedatectl set-ntp true

# CentOS / RHEL
sudo yum install -y chrony && sudo systemctl enable --now chronyd
```

---

## 3. 软件下载指南

### 3.1 版本选择

- **稳定版（RELEASE）**：推荐用于生产环境
- **测试版（EDGE）**：包含最新功能，仅用于测试评估

### 3.2 下载地址总览

MinIO 官方提供多种下载方式，二进制直接下载地址格式固定：

| 平台 | 架构 | 下载链接 |
|------|------|---------|
| Linux | amd64 | `https://dl.min.io/server/minio/release/linux-amd64/minio` |
| Linux | arm64 | `https://dl.min.io/server/minio/release/linux-arm64/minio` |
| macOS | amd64 | `https://dl.min.io/server/minio/release/darwin-amd64/minio` |
| macOS | arm64 | `https://dl.min.io/server/minio/release/darwin-arm64/minio` |
| Windows | amd64 | `https://dl.min.io/server/minio/release/windows-amd64/minio.exe` |

> 国内网络环境访问 `dl.min.io` 较慢时，可使用 MinIO 中国镜像 `https://dl.minio.org.cn/server/minio/release/...`（路径结构一致）。

### 3.3 MinIO 客户端 mc 下载

`mc`（MinIO Client）用于命令行管理存储服务，官方同样提供各平台二进制：

| 平台 | 架构 | 下载链接 |
|------|------|---------|
| Linux | amd64 | `https://dl.min.io/client/mc/release/linux-amd64/mc` |
| Linux | arm64 | `https://dl.min.io/client/mc/release/linux-arm64/mc` |
| macOS | arm64 | `https://dl.min.io/client/mc/release/darwin-arm64/mc` |
| Windows | amd64 | `https://dl.min.io/client/mc/release/windows-amd64/mc.exe` |

### 3.4 包管理器安装（Linux / macOS）

```bash
# macOS（Homebrew，仅稳定版）
brew install minio
brew install minio/stable/mc

# Debian / Ubuntu（需先添加仓库，也可直接下载 .deb 包）
wget https://dl.min.io/server/minio/release/linux-amd64/minio_*.deb
sudo dpkg -i minio_*.deb

# CentOS / RHEL（.rpm 包）
wget https://dl.min.io/server/minio/release/linux-amd64/minio-*.x86_64.rpm
sudo rpm -ivh minio-*.x86_64.rpm
```

---

## 4. Linux 部署

### 4.1 下载并安装二进制

```bash
# 创建安装目录与数据目录
sudo mkdir -p /opt/minio/data
cd /opt/minio

# 下载 MinIO 服务端（amd64 示例）
sudo wget https://dl.min.io/server/minio/release/linux-amd64/minio -O /opt/minio/minio

# 下载 MinIO 客户端（可选）
sudo wget https://dl.min.io/client/mc/release/linux-amd64/mc -O /opt/minio/mc

# 赋予执行权限
sudo chmod +x /opt/minio/minio /opt/minio/mc

# 验证版本
/opt/minio/minio --version
```

### 4.2 设置环境变量

创建环境变量文件，避免明文写在命令行中：

```bash
sudo tee /etc/default/minio <<'EOF'
# MinIO 根用户凭据（生产环境务必修改）
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=CHANGE_ME_STRONG_PASSWORD

# 数据目录
MINIO_VOLUMES="/opt/minio/data"

# 控制台监听地址
MINIO_OPTS="--console-address :9001"

# 默认区域（可选）
MINIO_REGION_NAME=cn-north-1
EOF
```

### 4.3 注册为 systemd 服务（推荐）

创建 systemd 服务单元文件：

```bash
sudo tee /etc/systemd/system/minio.service <<'EOF'
[Unit]
Description=MinIO Object Storage Server
Documentation=https://docs.min.io
Wants=network-online.target
After=network-online.target

[Service]
User=root
Group=root
EnvironmentFile=/etc/default/minio
ExecStart=/opt/minio/minio server $MINIO_VOLUMES $MINIO_OPTS
Restart=on-failure
RestartSec=5
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF
```

> 生产环境建议为 MinIO 创建专用系统用户（如 `minio-user`），避免使用 `root` 运行，详见[安全最佳实践](#9-安全最佳实践)。

启动服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now minio
sudo systemctl status minio        # 查看状态
journalctl -u minio -f             # 实时查看日志
```

### 4.4 多盘部署（单节点多盘 SNMD）

将数据目录替换为多块磁盘即可启用纠删码：

```bash
# 4 块独立磁盘，纠删码 EC:2
sudo tee /etc/default/minio <<'EOF'
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=CHANGE_ME_STRONG_PASSWORD
MINIO_VOLUMES="/data1 /data2 /data3 /data4"
MINIO_OPTS="--console-address :9001"
EOF

sudo systemctl restart minio
```

### 4.5 分布式部署（多节点多盘 MNMD，生产环境）

> 分布式部署要求节点数 ≥ 4，每个节点磁盘数一致。示例为 4 节点 × 4 磁盘。

所有节点执行：

```bash
sudo tee /etc/default/minio <<'EOF'
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=CHANGE_ME_STRONG_PASSWORD
MINIO_VOLUMES="http://minio-node{1...4}/data{1...4}"
MINIO_OPTS="--console-address :9001"
EOF
```

其中 `minio-node1` ~ `minio-node4` 为各节点主机名（或 IP，如 `http://192.168.1.{10...13}:9000/data{1...4}`）。重启全部节点后，在任意节点执行 `mc admin info` 可查看集群状态。

### 4.6 防火墙放行

```bash
# Ubuntu（ufw）
sudo ufw allow 9000/tcp
sudo ufw allow 9001/tcp

# CentOS / RHEL（firewalld）
sudo firewall-cmd --permanent --add-port=9000/tcp
sudo firewall-cmd --permanent --add-port=9001/tcp
sudo firewall-cmd --reload
```

---

## 5. Windows 部署

> 注意：`minio.exe` 不能通过双击资源管理器运行，必须通过 PowerShell 或 CMD 启动。

### 5.1 下载并放置

```powershell
# 创建目录
mkdir C:\minio

# 下载服务端与客户端
Invoke-WebRequest -Uri "https://dl.min.io/server/minio/release/windows-amd64/minio.exe" -OutFile "C:\minio\minio.exe"
Invoke-WebRequest -Uri "https://dl.min.io/client/mc/release/windows-amd64/mc.exe" -OutFile "C:\minio\mc.exe"

# 验证
C:\minio\minio.exe --version
```

### 5.2 前台启动（开发/测试）

```powershell
# 单盘模式
C:\minio\minio.exe server C:\minio\data --console-address :9001

# 多盘模式（使用盘符通配符，如 D、E、F 盘）
C:\minio\minio.exe server {D...F}:\minio --console-address :9001
```

> 前台启动会占用当前终端窗口，关闭窗口即停止服务。

### 5.3 注册为 Windows 服务（推荐）

使用 [NSSM](https://nssm.cc/)（Non-Sucking Service Manager）将 MinIO 注册为后台服务：

```powershell
# 下载 nssm 并解压到 C:\nssm
C:\nssm\nssm.exe install MinIO C:\minio\minio.exe "server C:\minio\data --console-address :9001"

# 设置环境变量（服务级别的根用户凭据）
C:\nssm\nssm.exe set MinIO AppEnvironmentExtra "MINIO_ROOT_USER=minioadmin" "MINIO_ROOT_PASSWORD=CHANGE_ME_STRONG_PASSWORD"

# 启动服务
C:\nssm\nssm.exe start MinIO
```

替代方案：使用 Windows「任务计划程序」创建开机自启任务，或使用 `sc create` 创建服务。

### 5.4 防火墙放行

```powershell
# 以管理员身份运行 PowerShell
New-NetFirewallRule -DisplayName "MinIO API" -Direction Inbound -Protocol TCP -LocalPort 9000 -Action Allow
New-NetFirewallRule -DisplayName "MinIO Console" -Direction Inbound -Protocol TCP -LocalPort 9001 -Action Allow
```

---

## 6. macOS 部署

### 6.1 方式一：Homebrew 安装（推荐）

```bash
# 安装服务端与客户端
brew install minio
brew install minio/stable/mc

# 直接启动
minio server /usr/local/var/minio --console-address :9001
```

### 6.2 方式二：二进制安装

```bash
# Apple Silicon（M1/M2/M3/M4）
wget https://dl.min.io/server/minio/release/darwin-arm64/minio -O minio
# Intel
wget https://dl.min.io/server/minio/release/darwin-amd64/minio -O minio

chmod +x minio
mkdir -p ~/minio/data
./minio server ~/minio/data --console-address :9001
```

### 6.3 开机自启（launchd）

创建 plist 文件 `~/Library/LaunchAgents/com.minio.server.plist`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.minio.server</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/minio</string>
        <string>server</string>
        <string>/Users/yourname/minio/data</string>
        <string>--console-address</string>
        <string>:9001</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>EnvironmentVariables</key>
    <dict>
        <key>MINIO_ROOT_USER</key>
        <string>minioadmin</string>
        <key>MINIO_ROOT_PASSWORD</key>
        <string>CHANGE_ME_STRONG_PASSWORD</string>
    </dict>
    <key>StandardOutPath</key>
    <string>/usr/local/var/log/minio.log</string>
    <key>StandardErrorPath</key>
    <string>/usr/local/var/log/minio.log</string>
</dict>
</plist>
```

加载服务：

```bash
launchctl load ~/Library/LaunchAgents/com.minio.server.plist
launchctl start com.minio.server
```

### 6.4 macOS 防火墙

「系统设置 → 网络 → 防火墙 → 选项」中允许 `minio` 程序入站，或使用：

```bash
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/minio
```

---

## 7. Docker 部署

### 7.1 拉取镜像

```bash
# 官方镜像仓库（推荐）
docker pull quay.io/minio/minio
# 或 Docker Hub 镜像
docker pull minio/minio
```

### 7.2 单机快速启动（docker run）

```bash
docker run -d \
  -p 9000:9000 \
  -p 9001:9001 \
  --name minio \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=CHANGE_ME_STRONG_PASSWORD" \
  -v ~/minio/data:/data \
  quay.io/minio/minio server /data --console-address ":9001"
```

### 7.3 Docker Compose 部署（推荐）

创建 `docker-compose.yml`：

```yaml
services:
  minio:
    image: quay.io/minio/minio:RELEASE.2026-06-06T01-06-12Z
    container_name: minio
    restart: unless-stopped
    ports:
      - "9000:9000"   # S3 API
      - "9001:9001"   # 控制台
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: CHANGE_ME_STRONG_PASSWORD
      MINIO_REGION_NAME: cn-north-1
    volumes:
      - ./data:/data
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 30s
      timeout: 5s
      retries: 5
```

启动：

```bash
docker compose up -d
docker compose ps          # 查看状态
docker compose logs -f minio
```

### 7.4 Docker 相关注意事项

- **持久化**：必须使用 `-v` 或卷挂载将 `/data` 映射到宿主机，否则容器删除后数据丢失
- **端口占用**：若 `9000` 被占用，可改映射为 `-p 9010:9000`
- **容器内目录**：容器内数据目录固定为 `/data`，仅需修改宿主机挂载路径
- **时区**：如需指定时区可增加环境变量 `TZ=Asia/Shanghai`

---

## 8. 服务启动与验证

### 8.1 启动成功标志

服务正常启动后，终端日志应输出类似以下内容：

```
API: http://192.168.1.10:9000  http://127.0.0.1:9000
RootUser: minioadmin
RootPass: CHANGE_ME_STRONG_PASSWORD

Console: http://192.168.1.10:9001 http://127.0.0.1:9001
RootUser: minioadmin
RootPass: CHANGE_ME_STRONG_PASSWORD
```

### 8.2 健康检查接口

MinIO 内置健康检查端点，可直接通过 HTTP 请求验证：

```bash
# 存活检查（Liveness）
curl -I http://127.0.0.1:9000/minio/health/live

# 就绪检查（Readiness，用于分布式集群）
curl -I http://127.0.0.1:9000/minio/health/ready

# 集群状态
curl -I http://127.0.0.1:9000/minio/health/cluster
```

返回 `200 OK` 即代表服务正常。

### 8.3 Web 控制台验证

浏览器访问 `http://<服务器地址>:9001`，使用 `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` 登录，可进行：

- 创建/删除桶（Bucket）
- 上传/下载/预览文件
- 创建用户、访问密钥（Access Key）与策略
- 查看集群状态与运行监控

### 8.4 使用 mc 客户端验证

```bash
# 配置别名（alias）
mc alias set myminio http://127.0.0.1:9000 minioadmin 'CHANGE_ME_STRONG_PASSWORD'

# 查看集群/服务器信息
mc admin info myminio

# 创建桶
mc mb myminio/blog-images

# 上传/下载文件
mc cp ./test.jpg myminio/blog-images/
mc ls myminio/blog-images
mc cat myminio/blog-images/test.jpg > test.jpg

# 设置桶访问策略（如需公开访问）
mc anonymous set download myminio/blog-images
```

### 8.5 应用接入验证（S3 API）

以 Node.js 官方 SDK 为例：

```javascript
import { S3Client } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  endpoint: 'http://127.0.0.1:9000',   // MinIO 服务地址
  region: 'cn-north-1',
  credentials: {
    accessKeyId: 'minioadmin',
    secretAccessKey: 'CHANGE_ME_STRONG_PASSWORD',
  },
  forcePathStyle: true,                 // MinIO 必须开启 path-style 访问
});
```

---

## 9. 安全最佳实践

### 9.1 修改默认凭据

默认账号 `minioadmin/minioadmin` 是公开信息，生产环境**必须**修改：

```bash
# 方式一：通过环境变量（服务启动前设置）
MINIO_ROOT_USER=new_user
MINIO_ROOT_PASSWORD=新强密码

# 方式二：通过 mc 修改现有用户密码
mc admin user set-password myminio minioadmin 新强密码
```

> 密码建议：至少 16 位，混合大小写字母、数字与特殊字符。

### 9.2 启用 HTTPS/TLS

将证书文件放入 MinIO 配置目录后重启服务：

```bash
# Linux/macOS 默认目录
~/.minio/certs/public.crt
~/.minio/certs/private.key

# 重新启动后，API 与控制台自动启用 TLS（https://...:9000）
```

若使用自签名证书，可在 `certs/CAs/` 目录放入 CA 证书以便内网信任。

### 9.3 最小权限原则

- **控制台端口（9001）不要暴露到公网**，仅内网或通过 VPN/跳板机访问
- 为应用创建**独立访问密钥**（Console → Access Keys），不要使用根用户密钥
- 使用 bucket 策略限制访问范围，例如仅允许指定应用访问指定桶：

```bash
mc admin policy set myminio readwrite app-user
```

- 存储桶默认私有，仅在必要时通过 `mc anonymous set download` 开放公共读

### 9.4 防火墙与网络隔离

- 仅向业务方开放 `9000` 端口
- 生产环境建议通过 Nginx 反向代理暴露 MinIO，并配置 HTTPS、限流、访问控制
- 分布式集群节点间通信建议放在隔离的受信网络

### 9.5 数据备份与恢复

```bash
# 跨集群镜像/同步（推荐用于备份）
mc mirror --watch myminio/blog-images myminio-backup/blog-images

# 版本控制（防止误删）
mc version enable myminio/blog-images
mc retention set --default governance --duration 30d myminio/blog-images
```

### 9.6 专用运行账号（Linux）

```bash
sudo useradd -r -s /sbin/nologin minio-user
sudo chown -R minio-user:minio-user /opt/minio
# 修改 systemd 单元中的 User=/Group= 为 minio-user
```

### 9.7 及时升级

定期关注 [MinIO Release 页面](https://github.com/minio/minio/releases)，及时升级以修复安全漏洞（如 CVE-2026-42600 等）。升级前先备份数据与配置，并阅读对应版本的升级说明。

---

## 10. 性能优化建议

### 10.1 存储层

- 使用 **NVMe SSD** 作为数据盘，避免机械盘或网络存储
- 数据目录独立挂载，**不与系统盘/日志盘共用**
- 磁盘保留 ≥ 20% 空闲容量，防止写满导致性能骤降
- 多盘场景启用纠删码（4 盘默认 `EC:2`，可容忍 2 块磁盘同时故障）

### 10.2 系统内核参数（Linux）

```bash
sudo tee /etc/sysctl.d/99-minio.conf <<'EOF'
# 网络缓冲
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
# 高并发连接
net.core.somaxconn = 65535
# 关闭空闲连接慢启动（提高小文件吞吐）
net.ipv4.tcp_slow_start_after_idle = 0
# 文件句柄
fs.file-max = 2097152
EOF
sudo sysctl -p /etc/sysctl.d/99-minio.conf

# 提升进程文件句柄上限（systemd 已在单元中设置 LimitNOFILE=65536）
ulimit -n 65536
```

### 10.3 MinIO 运行参数

| 参数/环境变量 | 说明 |
|--------------|------|
| `--address` / `MINIO_API_ADDR` | API 监听地址（默认 `:9000`） |
| `--console-address` | 控制台监听地址（默认自动分配随机端口，建议显式指定 `:9001`） |
| `MINIO_MAX_OBJECT_SIZE` | 单对象大小上限（默认 5 TB，集群为 5 TiB） |
| `MINIO_REGION_NAME` | 默认区域名称，避免客户端区域校验失败 |
| `MINIO_DOMAIN` | 开启虚拟主机风格（`bucket.domain`）访问时设置 |
| `MINIO_API_CORS_ALLOW_ORIGIN` | 指定允许跨域访问的源（多个用 `,` 分隔） |

### 10.4 客户端优化

- 高吞吐场景使用**分片上传（Multipart Upload）**，分片大小建议 16~64 MB
- 批量小文件场景，适当增加客户端并发连接数
- SDK 客户端务必开启 `forcePathStyle: true`（MinIO 默认 path-style）

### 10.5 监控

- 控制台自带监控面板可查看吞吐、请求数与节点状态
- 接入 Prometheus：`curl http://127.0.0.1:9000/minio/v2/metrics/cluster`
- 配置健康检查探针（Kubernetes/Docker 场景），自动重启异常实例

---

## 11. 常见问题解决方案

### 11.1 启动失败：端口被占用

```
FATAL: listen tcp :9000: bind: address already in use
```

```bash
# Linux/macOS
lsof -i :9000
sudo kill -9 <PID>

# Windows（PowerShell）
netstat -ano | findstr :9000
taskkill /PID <PID> /F

# Docker
docker ps -a | grep minio   # 查看已有容器并移除
```

### 11.2 数据目录无写入权限

```
FATAL: Command line provided volume '...' does not exist or is not writable
```

```bash
# Linux/macOS
sudo mkdir -p /data && sudo chmod 755 /data

# Docker（宿主机目录权限）
sudo mkdir -p ~/minio/data && sudo chmod 755 ~/minio/data

# Windows
icacls C:\minio\data /grant "Everyone:(OI)(CI)F"
```

### 11.3 浏览器无法访问控制台

1. 确认控制台端口已启动：`curl -I http://127.0.0.1:9001`
2. 检查防火墙是否放行 `9001`（见各平台防火墙章节）
3. 检查监听地址是否绑定到 `0.0.0.0`（如使用 `--console-address :9001` 即为全部网卡）
4. Docker 场景确认端口映射 `-p 9001:9001` 已生效：`docker ps`

### 11.4 控制台提示"凭据无效"或无法登录

- 确认账号密码与 `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` 一致
- Docker 场景：修改环境变量后必须**重建容器**（`docker compose up -d` 会重建），仅重启容器不会生效
- 多次输错密码可能导致临时锁定，等待或重启服务

### 11.5 客户端 SDK 报 SignatureDoesNotMatch / 400 错误

- 确认 `endpoint` 地址正确且不含 `https://`（未启用 TLS 时）
- SDK 必须设置 `forcePathStyle: true`
- 服务器与客户端时间偏差过大（分布式场景），检查 NTP 同步

### 11.6 上传大文件失败

- 检查 `MINIO_MAX_OBJECT_SIZE` 限制与磁盘剩余空间
- 确认磁盘格式支持大文件（FAT32 单文件上限 4 GB，**建议使用 NTFS/ext4/xfs**）
- 网络不稳定时启用分片上传并调小分片大小

### 11.7 数据目录报错："Drive is already in use"

- 通常为多进程启动同一数据目录，`ps aux | grep minio` 检查是否重复启动
- Docker 场景避免多个容器挂载同一目录

### 11.8 分布式节点之间无法通信

```bash
# 确认节点间 API 端口互通
nc -zv 192.168.1.11 9000

# 确认所有节点凭据一致
mc admin info myminio

# 确认 NTP 时间一致
timedatectl status
```

### 11.9 升级后无法启动

- 阅读升级说明；跨大版本升级建议先备份 `~/.minio/` 配置目录与数据
- 如遇配置不兼容，可使用 `mc admin config export` 导出/`import` 导入配置
- 回退方法：停止服务，替换回原版本二进制后重启

### 11.10 忘记管理员密码

```bash
# 方案一：停止服务后以新凭据重启（数据不受影响）
# Linux
sudo systemctl stop minio
MINIO_ROOT_USER=new_user MINIO_ROOT_PASSWORD=new_password /opt/minio/minio server /data

# 方案二：Docker 场景修改环境变量并重建容器
docker compose up -d --force-recreate
```

---

## 12. 参考资料

- [MinIO 官方文档（英文）](https://docs.min.io)
- [MinIO 官方文档（中文）](https://minio.org.cn/docs/minio/index.html)
- [MinIO Release 与更新记录](https://github.com/minio/minio/releases)
- [MinIO 二进制下载](https://dl.min.io/server/minio/release/)
- [MinIO 客户端 mc 文档](https://docs.min.io/minio/baremetal/reference/minio-mc.html)
- [MinIO 纠删码计算器](https://min.io/product/erasure-code-calculator)
- [MinIO 性能基准与调优指南](https://github.com/minio/minio/blob/master/docs/performance/README.md)
