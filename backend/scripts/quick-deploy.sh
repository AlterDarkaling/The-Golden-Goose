#!/bin/bash

###############################################
# 大鹅爱记账后端快速部署脚本
# 用于腾讯云/阿里云轻量应用服务器
###############################################

set -e  # 遇到错误立即退出

echo "=========================================="
echo "  大鹅爱记账后端部署脚本"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}请使用root用户运行此脚本${NC}"
  echo "使用命令: sudo bash quick-deploy.sh"
  exit 1
fi

echo -e "${GREEN}步骤 1/8: 更新系统${NC}"
apt update && apt upgrade -y

echo ""
echo -e "${GREEN}步骤 2/8: 安装Node.js${NC}"
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
  apt-get install -y nodejs
  echo -e "${GREEN}✓ Node.js安装成功: $(node -v)${NC}"
else
  echo -e "${YELLOW}Node.js已安装: $(node -v)${NC}"
fi

echo ""
echo -e "${GREEN}步骤 3/8: 安装MySQL${NC}"
if ! command -v mysql &> /dev/null; then
  apt install -y mysql-server
  systemctl start mysql
  systemctl enable mysql
  echo -e "${GREEN}✓ MySQL安装成功${NC}"
else
  echo -e "${YELLOW}MySQL已安装${NC}"
fi

echo ""
echo -e "${GREEN}步骤 4/8: 配置MySQL数据库${NC}"
read -p "请输入MySQL root密码: " mysql_password
read -p "请输入数据库用户密码: " db_password

mysql -u root -p"$mysql_password" <<EOF
CREATE DATABASE IF NOT EXISTS golden_goose CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'goose_user'@'localhost' IDENTIFIED BY '$db_password';
GRANT ALL PRIVILEGES ON golden_goose.* TO 'goose_user'@'localhost';
FLUSH PRIVILEGES;
EOF

echo -e "${GREEN}✓ 数据库配置完成${NC}"

echo ""
echo -e "${GREEN}步骤 5/8: 安装PM2${NC}"
if ! command -v pm2 &> /dev/null; then
  npm install -g pm2
  echo -e "${GREEN}✓ PM2安装成功${NC}"
else
  echo -e "${YELLOW}PM2已安装: $(pm2 -v)${NC}"
fi

echo ""
echo -e "${GREEN}步骤 6/8: 创建项目目录${NC}"
PROJECT_DIR="/var/www/golden-goose"
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

echo ""
echo -e "${GREEN}步骤 7/8: 配置项目${NC}"
echo "请将backend文件夹上传到: $PROJECT_DIR"
echo "或者使用Git克隆代码"
read -p "按Enter继续（确保代码已上传）..."

if [ -d "$PROJECT_DIR/backend" ]; then
  cd backend
  
  # 安装依赖
  echo "安装依赖..."
  npm install --production
  
  # 配置环境变量
  if [ ! -f ".env" ]; then
    cp .env.example .env
    
    # 生成JWT密钥
    JWT_SECRET=$(openssl rand -base64 32)
    
    # 配置.env文件
    sed -i "s/your_password/$db_password/g" .env
    sed -i "s/your-super-secret-jwt-key-change-this-in-production/$JWT_SECRET/g" .env
    
    echo -e "${YELLOW}"
    echo "=========================================="
    echo "  重要：请手动配置以下信息"
    echo "=========================================="
    echo "编辑文件: $PROJECT_DIR/backend/.env"
    echo ""
    echo "需要配置："
    echo "1. WECHAT_APPID=你的小程序AppID"
    echo "2. WECHAT_SECRET=你的小程序Secret"
    echo "3. ALLOWED_ORIGINS=你的域名"
    echo ""
    read -p "配置完成后按Enter继续..."
    echo -e "${NC}"
  fi
  
  echo ""
  echo -e "${GREEN}步骤 8/8: 启动服务${NC}"
  pm2 start app.js --name golden-goose-api
  pm2 startup
  pm2 save
  
  echo ""
  echo -e "${GREEN}=========================================="
  echo "  部署完成！"
  echo "==========================================${NC}"
  echo ""
  echo "服务状态："
  pm2 status
  echo ""
  echo "访问地址: http://$(curl -s ifconfig.me):3000"
  echo "健康检查: http://$(curl -s ifconfig.me):3000/health"
  echo ""
  echo "常用命令："
  echo "  查看日志: pm2 logs golden-goose-api"
  echo "  重启服务: pm2 restart golden-goose-api"
  echo "  停止服务: pm2 stop golden-goose-api"
  echo ""
  echo -e "${YELLOW}下一步：${NC}"
  echo "1. 配置Nginx反向代理（可选）"
  echo "2. 配置SSL证书（推荐）"
  echo "3. 配置防火墙规则"
  echo ""
  echo "详细文档: $PROJECT_DIR/backend/DEPLOYMENT.md"
  
else
  echo -e "${RED}错误：未找到backend目录${NC}"
  echo "请确保代码已上传到: $PROJECT_DIR"
  exit 1
fi

