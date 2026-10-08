# 后端部署文档

## 部署方式选择

### 方案一：腾讯云轻量应用服务器（推荐）

**成本**: 60元/月  
**难度**: ⭐⭐  
**适合**: 个人项目、小型应用

#### 1. 购买服务器

1. 访问 [腾讯云轻量应用服务器](https://cloud.tencent.com/product/lighthouse)
2. 选择配置：
   - CPU: 1核
   - 内存: 2GB
   - 系统盘: 40GB SSD
   - 峰值带宽: 4Mbps
   - 操作系统: Ubuntu 20.04 LTS
3. 购买并记录公网IP

#### 2. 连接服务器

```bash
# Windows用户使用PuTTY或Windows Terminal
# Mac/Linux用户使用终端
ssh root@your_server_ip
```

#### 3. 安装环境

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Node.js (使用nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# 验证安装
node -v
npm -v

# 安装MySQL
sudo apt install mysql-server -y

# 启动MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# 安全配置MySQL
sudo mysql_secure_installation

# 安装Git
sudo apt install git -y

# 安装PM2（进程管理器）
npm install -g pm2
```

#### 4. 配置MySQL

```bash
# 登录MySQL
sudo mysql -u root -p

# 创建数据库和用户
CREATE DATABASE golden_goose CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'goose_user'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON golden_goose.* TO 'goose_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 5. 部署代码

```bash
# 创建项目目录
mkdir -p /var/www/golden-goose
cd /var/www/golden-goose

# 克隆代码（如果使用Git）
git clone your_repo_url .

# 或者使用SCP上传代码
# 本地执行：
# scp -r ./backend root@your_server_ip:/var/www/golden-goose/

# 进入backend目录
cd backend

# 安装依赖
npm install --production

# 复制环境变量文件
cp .env.example .env

# 编辑环境变量
nano .env
# 修改数据库配置、JWT密钥、微信配置等
```

#### 6. 启动服务

```bash
# 使用PM2启动
pm2 start app.js --name golden-goose-api

# 查看日志
pm2 logs golden-goose-api

# 设置开机自启
pm2 startup
pm2 save

# 查看状态
pm2 status
```

#### 7. 配置Nginx反向代理（可选）

```bash
# 安装Nginx
sudo apt install nginx -y

# 创建配置文件
sudo nano /etc/nginx/sites-available/golden-goose

# 粘贴以下配置：
server {
    listen 80;
    server_name your_domain.com;  # 如果有域名

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# 启用配置
sudo ln -s /etc/nginx/sites-available/golden-goose /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```

#### 8. 配置SSL证书（可选但推荐）

```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取证书（需要有域名）
sudo certbot --nginx -d your_domain.com

# 自动续期
sudo certbot renew --dry-run
```

#### 9. 配置防火墙

```bash
# 允许HTTP、HTTPS和SSH
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 启用防火墙
sudo ufw enable

# 查看状态
sudo ufw status
```

---

### 方案二：Docker部署

**成本**: 取决于云服务商  
**难度**: ⭐⭐⭐  
**适合**: 需要容器化的场景

#### 1. 创建Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制代码
COPY . .

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "app.js"]
```

#### 2. 创建docker-compose.yml

```yaml
# backend/docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=mysql
      - DB_PORT=3306
      - DB_NAME=golden_goose
      - DB_USER=root
      - DB_PASSWORD=root_password
      - JWT_SECRET=your_jwt_secret
      - WECHAT_APPID=your_appid
      - WECHAT_SECRET=your_secret
    depends_on:
      - mysql
    restart: unless-stopped

  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=root_password
      - MYSQL_DATABASE=golden_goose
      - MYSQL_CHARACTER_SET_SERVER=utf8mb4
      - MYSQL_COLLATION_SERVER=utf8mb4_unicode_ci
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"
    restart: unless-stopped

volumes:
  mysql_data:
```

#### 3. 部署

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止
docker-compose down
```

---

### 方案三：阿里云/腾讯云ECS

类似方案一，但配置更灵活，价格略高。

---

## 环境变量配置

生产环境的 `.env` 文件示例：

```env
NODE_ENV=production
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=golden_goose
DB_USER=goose_user
DB_PASSWORD=your_strong_password_here

JWT_SECRET=use-a-very-long-random-string-here-minimum-32-characters
JWT_EXPIRES_IN=7d

WECHAT_APPID=wxxxxxxxxxxxxxxxxxxx
WECHAT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com

LOG_LEVEL=info
```

## 常用命令

```bash
# PM2相关
pm2 start app.js --name golden-goose-api
pm2 stop golden-goose-api
pm2 restart golden-goose-api
pm2 logs golden-goose-api
pm2 delete golden-goose-api

# 数据库备份
mysqldump -u goose_user -p golden_goose > backup_$(date +%Y%m%d).sql

# 数据库恢复
mysql -u goose_user -p golden_goose < backup_20241103.sql

# 查看系统资源
top
htop
df -h
free -h

# 查看端口占用
netstat -tulpn | grep 3000
```

## 监控和日志

### 1. PM2监控

```bash
# 安装PM2监控
pm2 install pm2-logrotate

# 配置日志轮转
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### 2. 应用日志

日志位置：`~/.pm2/logs/`

```bash
# 实时查看日志
pm2 logs golden-goose-api --lines 100

# 查看错误日志
pm2 logs golden-goose-api --err
```

## 性能优化

### 1. 数据库优化

```sql
-- 添加索引
ALTER TABLE assets ADD INDEX idx_user_category (user_id, category_l1, category_l2);
ALTER TABLE liabilities ADD INDEX idx_user_status (user_id, status);

-- 定期优化表
OPTIMIZE TABLE assets;
OPTIMIZE TABLE liabilities;
```

### 2. 启用MySQL慢查询日志

```bash
# 编辑MySQL配置
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

# 添加配置
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow-query.log
long_query_time = 2

# 重启MySQL
sudo systemctl restart mysql
```

### 3. Node.js内存优化

```bash
# 限制内存使用
pm2 start app.js --name golden-goose-api --max-memory-restart 300M
```

## 安全建议

1. ✅ 使用强密码
2. ✅ 定期更新系统和依赖
3. ✅ 启用防火墙
4. ✅ 使用HTTPS
5. ✅ 定期备份数据
6. ✅ 监控异常访问
7. ✅ 限制数据库远程访问

## 故障排查

### 应用无法启动

```bash
# 检查端口占用
sudo lsof -i :3000

# 检查PM2日志
pm2 logs golden-goose-api --err

# 检查环境变量
cat .env
```

### 数据库连接失败

```bash
# 检查MySQL状态
sudo systemctl status mysql

# 测试数据库连接
mysql -u goose_user -p -h localhost golden_goose

# 查看MySQL错误日志
sudo tail -f /var/log/mysql/error.log
```

### 内存不足

```bash
# 查看内存使用
free -h

# 添加swap（1GB）
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 更新部署

```bash
# 拉取最新代码
cd /var/www/golden-goose/backend
git pull origin main

# 安装新依赖
npm install --production

# 重启服务
pm2 restart golden-goose-api

# 检查状态
pm2 status
pm2 logs golden-goose-api --lines 50
```

## 成本估算

### 最小配置（个人使用）

| 项目 | 费用 |
|------|------|
| 腾讯云轻量服务器 (1核2G) | 60元/月 |
| 域名（可选） | 50元/年 |
| SSL证书 | 免费 (Let's Encrypt) |
| **总计** | **约720元/年** |

### 进阶配置（中等流量）

| 项目 | 费用 |
|------|------|
| 腾讯云CVM (2核4G) | 150元/月 |
| MySQL云数据库 | 80元/月 |
| CDN流量 | 20元/月 |
| 域名 | 50元/年 |
| **总计** | **约3000元/年** |

## 技术支持

如有问题，请查看：
1. [后端README](./README.md)
2. [Express文档](https://expressjs.com/)
3. [Sequelize文档](https://sequelize.org/)
4. [MySQL文档](https://dev.mysql.com/doc/)

