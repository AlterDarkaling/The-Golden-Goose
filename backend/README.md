# 大鹅爱记账 - 后端服务

基于Node.js + Express + MySQL的后端API服务。

## 技术栈

- **框架**: Express 4.x
- **数据库**: MySQL 8.0
- **ORM**: Sequelize 6.x
- **认证**: JWT (jsonwebtoken)
- **日志**: Morgan
- **安全**: Helmet, CORS, express-rate-limit

## 快速开始

### 1. 环境要求

- Node.js >= 16.0.0
- MySQL >= 8.0
- npm 或 yarn

### 2. 安装依赖

```bash
cd backend
npm install
```

### 3. 配置环境变量

复制 `.env.example` 到 `.env` 并填写配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=golden_goose
DB_USER=root
DB_PASSWORD=your_password

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-change-this

# 微信小程序配置
WECHAT_APPID=your_wechat_appid
WECHAT_SECRET=your_wechat_secret
```

### 4. 初始化数据库

```bash
# 方式1：使用MySQL客户端执行SQL
mysql -u root -p < scripts/init-database.sql

# 方式2：手动创建数据库
mysql -u root -p
CREATE DATABASE golden_goose CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. 启动服务

```bash
# 开发环境（自动重启）
npm run dev

# 生产环境
npm start
```

服务将运行在 `http://localhost:3000`

## API文档

### 认证接口

#### 微信登录
```http
POST /api/auth/wechat/login
Content-Type: application/json

{
  "code": "微信登录code",
  "userInfo": {
    "nickname": "用户昵称",
    "avatarUrl": "头像URL"
  }
}
```

响应：
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": 1,
      "nickname": "用户昵称",
      "avatar": "头像URL"
    }
  }
}
```

#### 获取当前用户信息
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### 资产接口

#### 获取资产列表
```http
GET /api/assets
Authorization: Bearer <token>

Query参数：
- category_l1: 一级分类
- category_l2: 二级分类
- status: 状态
- is_sample: 是否示例数据
```

#### 创建资产
```http
POST /api/assets
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "iPhone 15 Pro",
  "category_l1": "consumer_asset",
  "category_l2": "mobile_phone",
  "initial_value": 8999,
  "create_date": "2024-01-01",
  "status": "active"
}
```

#### 更新资产
```http
PUT /api/assets/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "更新后的名称",
  "status": "dusty"
}
```

#### 删除资产
```http
DELETE /api/assets/:id
Authorization: Bearer <token>
```

### 负债接口

类似资产接口，路径为 `/api/liabilities`

### 数据迁移接口

#### 从本地迁移到云端
```http
POST /api/migration/upload
Authorization: Bearer <token>
Content-Type: application/json

{
  "assets": [...],
  "liabilities": [...]
}
```

## 项目结构

```
backend/
├── app.js                 # 应用入口
├── package.json           # 依赖配置
├── .env                   # 环境变量（不提交）
├── .env.example           # 环境变量示例
├── config/
│   └── database.js        # 数据库配置
├── models/                # Sequelize模型
│   ├── User.js
│   ├── Asset.js
│   ├── Liability.js
│   └── index.js
├── controllers/           # 控制器
│   ├── authController.js
│   ├── assetController.js
│   └── liabilityController.js
├── routes/                # 路由
│   ├── auth.js
│   ├── assets.js
│   ├── liabilities.js
│   ├── users.js
│   └── migration.js
├── middleware/            # 中间件
│   ├── auth.js
│   ├── errorHandler.js
│   └── validator.js
├── utils/                 # 工具函数
│   ├── jwt.js
│   ├── wechat.js
│   ├── depreciation.js    # 折旧计算引擎
│   └── loanCalculator.js  # 贷款计算器
└── scripts/               # 脚本
    └── init-database.sql
```

## 部署指南

详见 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 常见问题

### 1. 数据库连接失败

检查 `.env` 中的数据库配置是否正确，确保MySQL服务已启动。

### 2. JWT Token无效

检查 `JWT_SECRET` 是否一致，Token是否过期。

### 3. 跨域问题

检查 `ALLOWED_ORIGINS` 配置，确保前端域名在允许列表中。

## 开发计划

- [ ] 添加单元测试
- [ ] 添加API文档（Swagger）
- [ ] 性能优化（Redis缓存）
- [ ] 日志系统优化
- [ ] 数据库索引优化

## License

MIT

