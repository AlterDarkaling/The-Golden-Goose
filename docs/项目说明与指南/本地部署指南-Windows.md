# 💻 大鹅爱记账 - 本地部署指南（Windows）

## 🎯 目标

在Windows电脑上运行后端服务，小程序连接本地API进行开发测试。

---

## 📋 第一步：安装必要软件

### 1. 安装Node.js

**下载地址**：https://nodejs.org/zh-cn/

- 选择 **LTS版本**（推荐 18.x 或 20.x）
- 下载 Windows 安装包（.msi）
- 双击安装，一路"下一步"即可

**验证安装**：
```bash
# 打开命令提示符（Win+R 输入 cmd）
node -v
# 应该显示：v18.x.x 或 v20.x.x

npm -v
# 应该显示：9.x.x 或 10.x.x
```

### 2. 安装MySQL

**方式A：安装MySQL服务器（推荐）**

1. 下载地址：https://dev.mysql.com/downloads/mysql/
2. 选择 **MySQL Installer for Windows**
3. 下载 `mysql-installer-web-community-8.0.xx.msi`
4. 运行安装程序：
   - 选择 "Developer Default"（开发者默认）
   - 或选择 "Server only"（仅服务器）
5. 设置root密码（记住这个密码！）
6. 完成安装

**验证安装**：
```bash
mysql --version
# 应该显示：mysql  Ver 8.0.xx
```

**方式B：使用XAMPP（更简单）**

1. 下载地址：https://www.apachefriends.org/zh_cn/index.html
2. 安装XAMPP（包含MySQL）
3. 启动XAMPP控制面板
4. 点击MySQL的"Start"按钮

### 3. 安装Git（可选，用于克隆代码）

下载地址：https://git-scm.com/download/win

---

## 📦 第二步：配置后端项目

### 1. 准备项目文件

将 `backend` 文件夹放到合适的位置，例如：
```
D:\Projects\golden-goose\backend\
```

### 2. 安装依赖

打开命令提示符（或PowerShell），进入backend目录：

```bash
# 进入项目目录
cd D:\Projects\golden-goose\backend

# 安装依赖（首次需要几分钟）
npm install
```

### 3. 创建数据库

**方式A：使用命令行**

```bash
# 登录MySQL（输入你设置的root密码）
mysql -u root -p

# 在MySQL命令行中执行：
CREATE DATABASE golden_goose CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

**方式B：使用可视化工具**

推荐使用 **Navicat** 或 **MySQL Workbench**：
1. 打开工具
2. 连接到本地MySQL
3. 右键 → 新建数据库
4. 数据库名：`golden_goose`
5. 字符集：`utf8mb4`
6. 排序规则：`utf8mb4_unicode_ci`

### 4. 配置环境变量

在 `backend` 目录下创建 `.env` 文件：

**手动创建**：
1. 复制 `.env.example` 文件
2. 重命名为 `.env`
3. 用记事本或VSCode打开编辑

**内容配置**：
```env
# 服务器配置
NODE_ENV=development
PORT=3000

# 数据库配置（根据你的实际情况修改）
DB_HOST=localhost
DB_PORT=3306
DB_NAME=golden_goose
DB_USER=root
DB_PASSWORD=你的MySQL密码

# JWT配置（开发环境可以随便写）
JWT_SECRET=dev-secret-key-for-local-testing-only
JWT_EXPIRES_IN=7d

# 微信小程序配置（暂时用测试值）
WECHAT_APPID=test_appid
WECHAT_SECRET=test_secret

# 跨域配置
ALLOWED_ORIGINS=*

# 日志级别
LOG_LEVEL=debug
```

---

## 🚀 第三步：启动后端服务

### 方式A：开发模式（推荐）

```bash
# 在backend目录执行
npm run dev
```

看到以下信息表示成功：
```
✅ 数据库连接成功
✅ 数据库模型同步完成
🚀 服务器运行在 http://localhost:3000
📝 环境: development
```

### 方式B：生产模式

```bash
npm start
```

### 测试服务

打开浏览器访问：http://localhost:3000/health

应该看到：
```json
{
  "status": "ok",
  "timestamp": "2024-11-03T...",
  "version": "1.0.0"
}
```

---

## 📱 第四步：配置小程序连接本地

### 1. 修改API配置

编辑小程序 `utils/apiClient.js`：

```javascript
const API_CONFIG = {
  // 启用云端模式
  ENABLE_CLOUD: true,
  
  // 使用本地后端地址
  BASE_URL: 'http://localhost:3000/api',
  
  // 开发环境可以用真机IP
  // BASE_URL: 'http://192.168.1.100:3000/api',  // 换成你的电脑IP
  
  TIMEOUT: 10000
}
```

### 2. 配置微信开发者工具

#### 重要：开启本地调试

1. 打开微信开发者工具
2. 右上角 **详情** 按钮
3. 找到 **本地设置**
4. 勾选以下选项：
   - ✅ **不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书**
   - ✅ **不校验请求域名**

![开发者工具设置](https://img.shields.io/badge/重要-必须勾选-red)

### 3. 获取电脑IP地址（真机调试需要）

如果要在真机上测试，需要用电脑IP：

**Windows查看IP**：
```bash
ipconfig
# 找到 "IPv4 地址"，例如：192.168.1.100
```

然后修改配置：
```javascript
BASE_URL: 'http://192.168.1.100:3000/api'
```

⚠️ **注意**：手机和电脑必须在同一个WiFi网络下！

---

## 🧪 第五步：测试功能

### 1. 测试登录

1. 在小程序中点击"开始使用"
2. 授权登录
3. 查看后端控制台日志

你应该看到：
```
POST /api/auth/wechat/login 200 123ms
```

### 2. 测试数据迁移

如果之前有本地数据，可以迁移到后端：

在个人中心添加"数据迁移"按钮，点击后：
```javascript
const { SmartStorage } = require('../../utils/apiClient.js')

async migrateData() {
  try {
    wx.showLoading({ title: '迁移中...' })
    const result = await SmartStorage.migrateLocalToCloud()
    wx.hideLoading()
    wx.showToast({
      title: `迁移成功！资产${result.data.assetsCreated}个，负债${result.data.liabilitiesCreated}个`,
      icon: 'success'
    })
  } catch (error) {
    wx.hideLoading()
    console.error('迁移失败:', error)
  }
}
```

### 3. 查看数据库

使用MySQL客户端查看数据：

```sql
-- 查看用户表
SELECT * FROM users;

-- 查看资产表
SELECT id, name, category_l1, initial_value, current_value FROM assets;

-- 查看负债表
SELECT id, name, category_l1, initial_amount, current_amount FROM liabilities;
```

---

## 🛠️ 常用操作

### 停止服务

按 `Ctrl + C` 停止后端服务

### 重启服务

如果修改了代码：
1. 按 `Ctrl + C` 停止
2. 重新运行 `npm run dev`

或者使用nodemon（自动重启）：
```bash
npm install -g nodemon
nodemon app.js
```

### 查看日志

所有请求日志都会显示在命令行中：
```
GET /api/assets 200 45ms
POST /api/assets 201 123ms
PUT /api/assets/1 200 78ms
DELETE /api/assets/1 200 34ms
```

### 清空数据库

如果想重新开始：

```sql
-- 登录MySQL
mysql -u root -p

-- 删除所有数据
USE golden_goose;
TRUNCATE TABLE assets;
TRUNCATE TABLE liabilities;
TRUNCATE TABLE users;
```

---

## 🐛 常见问题

### 1. 端口被占用

**错误信息**：`Error: listen EADDRINUSE: address already in use :::3000`

**解决方案**：

```bash
# 查找占用3000端口的进程
netstat -ano | findstr :3000

# 记下PID，然后杀死进程
taskkill /PID 进程号 /F

# 或者修改端口
# 在.env中改为：PORT=3001
```

### 2. MySQL连接失败

**错误信息**：`ER_ACCESS_DENIED_ERROR` 或 `ECONNREFUSED`

**解决方案**：
- 检查MySQL是否启动
- 检查用户名密码是否正确
- 检查数据库是否存在

```bash
# 测试连接
mysql -u root -p -h localhost
```

### 3. 小程序无法连接后端

**原因**：
- 未开启"不校验合法域名"
- 后端服务未启动
- IP地址不正确

**解决方案**：
1. 确认后端服务正在运行
2. 浏览器访问 http://localhost:3000/health 测试
3. 检查开发者工具设置
4. 真机调试时使用电脑IP，确保同一WiFi

### 4. 依赖安装失败

**错误信息**：`npm ERR!`

**解决方案**：

```bash
# 清除缓存
npm cache clean --force

# 使用淘宝镜像
npm config set registry https://registry.npmmirror.com

# 重新安装
npm install
```

### 5. 数据库中文乱码

**解决方案**：

```sql
-- 修改数据库字符集
ALTER DATABASE golden_goose CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## 📊 性能说明

本地开发环境性能：
- ✅ 响应速度：< 50ms（非常快）
- ✅ 并发支持：足够开发测试
- ✅ 数据量：支持数千条记录

---

## 🎓 学习建议

### 1. 理解后端逻辑

打开以下文件阅读：
- `backend/app.js` - 入口文件
- `backend/controllers/assetController.js` - 业务逻辑
- `backend/models/Asset.js` - 数据模型

### 2. 调试技巧

在代码中添加日志：
```javascript
console.log('收到请求:', req.body)
console.log('查询结果:', assets)
```

### 3. 使用Postman测试API

下载：https://www.postman.com/downloads/

测试示例：
```
POST http://localhost:3000/api/auth/wechat/login
Body (JSON):
{
  "code": "test_code",
  "userInfo": {
    "nickname": "测试用户"
  }
}
```

---

## 🚀 下一步

### 开发完成后

如果想部署到服务器，参考：
- `backend/DEPLOYMENT.md` - 云服务器部署
- 或继续使用本地模式

### 版本控制

建议使用Git管理代码：
```bash
git init
git add .
git commit -m "后端初始版本"
```

---

## ✅ 验收清单

- [ ] Node.js安装成功
- [ ] MySQL安装成功
- [ ] 后端服务启动成功
- [ ] 小程序能连接后端
- [ ] 登录功能正常
- [ ] 资产CRUD正常
- [ ] 负债CRUD正常
- [ ] 折旧计算正确

---

## 💡 小贴士

1. **开发时**：使用 `npm run dev`，代码修改后手动重启
2. **调试时**：查看控制台日志和数据库数据
3. **测试时**：先在开发者工具，再真机测试
4. **上线前**：记得切换到生产环境配置

---

**现在你可以零成本体验前后端分离开发了！** 🎉

**有问题随时问！** 💬

