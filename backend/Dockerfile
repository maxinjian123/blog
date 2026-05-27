# Node.js 基础镜像
FROM node:22-alpine

# 设置工作目录
WORKDIR /blog-app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制其他源代码
COPY . .

# 创建 uploads 目录
RUN mkdir -p uploads

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "app.js"]
