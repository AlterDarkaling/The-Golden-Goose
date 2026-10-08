# Apifox 测试指南 - Golden Goose API

## 📋 目录
- [项目设置](#项目设置)
- [环境配置](#环境配置)
- [认证说明](#认证说明)
- [API 接口列表](#api-接口列表)
- [示例请求](#示例请求)
- [常见问题](#常见问题)

---

## 🚀 项目设置

### 1. 创建 Apifox 项目

1. 打开 Apifox
2. 点击「新建项目」
3. 项目名称：`Golden Goose API`
4. 项目类型：`HTTP`

### 2. 基本信息

- **项目名称**：Golden Goose - 个人财务管理系统
- **Base URL**：`http://localhost:3000`
- **API 前缀**：`/api`

---

## ⚙️ 环境配置

### 简单配置（推荐）

在 Apifox 项目设置中：

1. **前置 URL**：`http://localhost:3000`
2. **接口路径**：直接写完整路径，如 `/api/assets`

**示例接口配置**

**前置 URL**: `http://localhost:3000`

**接口路径示例**：
```
GET /api/assets         → 获取资产列表
POST /api/assets        → 创建资产
GET /api/liabilities    → 获取负债列表
POST /api/liabilities   → 创建负债
GET /api/saving-goals   → 获取储蓄目标
```

### 高级配置（可选）

如果需要切换不同环境，可以使用环境变量：

| 变量名 | 开发环境 | 生产环境 |
|--------|---------|---------|
| `base_url` | `http://localhost:3000` | `https://api.yourdomain.com` |

然后：
- **前置 URL**：留空
- **接口路径**：`{{base_url}}/api/assets`

---

## 🔐 认证说明

### 开发环境（推荐）

**无需 Token 认证！**

在开发环境下（`NODE_ENV=development`），后端会自动使用测试用户：
- OpenID: `dev_test_user`
- 昵称: `开发测试用户`

**在 Apifox 中测试时，不需要添加 Authorization 头。**

### 生产环境（可选）

如果需要测试完整的 JWT 认证流程：

1. **获取 Token**
   ```http
   POST /api/auth/wechat/login
   Content-Type: application/json
   
   {
     "code": "mock_wx_code",
     "userInfo": {
       "nickName": "测试用户",
       "avatarUrl": "https://example.com/avatar.jpg"
     }
   }
   ```

2. **使用 Token**
   
   在请求头中添加：
   ```
   Authorization: Bearer <your_token>
   ```

---

## 📚 API 接口列表

### 1. 健康检查

#### GET /health
检查服务器状态

**请求**：
```http
GET /health
```

**响应**：
```json
{
  "status": "ok",
  "timestamp": "2025-12-03T03:40:00.000Z",
  "version": "1.0.0"
}
```

---

### 2. 资产管理 (Assets)

#### 2.1 获取资产列表

```http
GET /api/assets
```

完整 URL：`http://localhost:3000/api/assets`

**响应示例**：
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "手机",
      "categoryL1": "physical_assets",
      "categoryL2": "consumer_assets",
      "currentValue": 4299,
      "originalValue": 5999,
      "createDate": "2025-12-03"
    }
  ]
}
```

#### 2.2 创建资产

```http
POST /api/assets
Content-Type: application/json

{
  "name": "MacBook Pro",
  "categoryL1": "physical_assets",
  "categoryL2": "consumer_assets",
  "categoryL3": "electronics",
  "originalValue": 15999,
  "currentValue": 15999,
  "purchaseDate": "2025-12-03",
  "status": "active"
}
```

**字段说明**：
- `status`: 资产状态（必填）
  - `active`: 使用中
  - `dusty`: 闲置
  - `rented`: 出租中
  - `damaged`: 损坏
  - `processed`: 已处置
  - `gifted`: 已赠送
  - `sold`: 已出售
  - `lost`: 已丢失

#### 2.3 更新资产

```http
PUT /api/assets/1
Content-Type: application/json

{
  "currentValue": 14999,
  "notes": "更新了当前价值"
}
```

#### 2.4 删除资产

```http
DELETE /api/assets/1
```

---

### 3. 负债管理 (Liabilities)

#### 3.1 获取负债列表

```http
GET /api/liabilities
```

#### 3.2 创建负债

```http
POST /api/liabilities
Content-Type: application/json

{
  "name": "车贷",
  "categoryL1": "long_term_liabilities",
  "categoryL2": "vehicle_loan",
  "type": "loan",
  "originalAmount": 200000,
  "currentAmount": 150000,
  "monthlyPayment": 5000,
  "annualRate": 5.5,
  "months": 60,
  "status": "normal",
  "createDate": "2025-01-01"
}
```

**字段说明**：
- `type`: 负债类型
  - `loan`: 贷款
  - `consumer`: 消费债务
  - `payable`: 应付款
- `annualRate`: 年利率（百分比，如 5.5 表示 5.5%）
- `status`: 负债状态（必填）
  - `normal`: 正常还款中
  - `paid_off`: 已还清
  - `overdue`: 逾期
  - `prepaid`: 已提前还款
- `categoryL1`: 一级分类
  - `current_liabilities`: 流动负债
  - `long_term_liabilities`: 长期负债

#### 3.3 更新负债

```http
PUT /api/liabilities/1
Content-Type: application/json

{
  "currentAmount": 140000,
  "monthlyPayment": 4500
}
```

#### 3.4 删除负债

```http
DELETE /api/liabilities/1
```

---

### 4. 梦想储蓄罐 (Saving Goals)

#### 4.1 获取储蓄目标列表

```http
GET /api/saving-goals
```

**可选查询参数**：
- `status`: 筛选状态（`active`, `completed`, `paused`）
- `category`: 筛选类别（`emergency`, `education`, `retirement`, `travel`, `housing`, `other`）

```http
GET /api/saving-goals?status=active
```

#### 4.2 创建储蓄目标

```http
POST /api/saving-goals
Content-Type: application/json

{
  "title": "紧急备用金",
  "targetAmount": 50000,
  "currentAmount": 10000,
  "deadline": "2025-12-31",
  "category": "emergency",
  "description": "建立6个月生活费的紧急备用金",
  "status": "active"
}
```

**字段说明**：
- `title`: 储蓄罐名称（必填）⚠️
- `targetAmount`: 目标金额（必填）
- `currentAmount`: 当前金额（可选，默认0）
- `category`: 目标类别（必填，默认 `other`）
  - `emergency`: 应急基金
  - `house`: 购房基金
  - `education`: 教育基金
  - `travel`: 旅行基金
  - `investment`: 投资基金
  - `retirement`: 退休基金
  - `car`: 购车基金
  - `wedding`: 婚礼基金
  - `health`: 医疗基金
  - `debt`: 还债基金
  - `gift`: 礼物基金
  - `other`: 其他
- `status`: 状态（可选，默认 `active`）
  - `active`: 进行中
  - `completed`: 已完成
  - `cancelled`: 已取消

#### 4.3 更新储蓄目标

```http
PUT /api/saving-goals/1
Content-Type: application/json

{
  "currentAmount": 15000,
  "notes": "本月存入5000元"
}
```

#### 4.4 存入金额

```http
POST /api/saving-goals/1/deposit
Content-Type: application/json

{
  "amount": 5000,
  "notes": "工资结余存入"
}
```

#### 4.5 删除储蓄目标

```http
DELETE /api/saving-goals/1
```

---

### 5. 用户管理 (Users)

#### 5.1 获取当前用户信息

```http
GET /api/users/me
```

#### 5.2 更新用户信息

```http
PUT /api/users/me
Content-Type: application/json

{
  "nickname": "新昵称",
  "signature": "个性签名"
}
```

---

## 📝 示例请求集合

### 完整业务流程测试

#### 1. 创建一个完整的资产记录

```http
POST /api/assets
Content-Type: application/json

{
  "name": "投资账户",
  "categoryL1": "financial_assets",
  "categoryL2": "securities_investment",
  "categoryL3": "stocks",
  "originalValue": 100000,
  "currentValue": 105000,
  "monthlyIncome": 500,
  "annualReturn": 6,
  "startDate": "2025-01-01",
  "status": "active",
  "notes": "股票投资账户"
}
```

#### 2. 创建对应的负债

```http
POST /api/liabilities
Content-Type: application/json

{
  "name": "房贷",
  "categoryL1": "long_term_liabilities",
  "categoryL2": "mortgage",
  "type": "loan",
  "originalAmount": 1000000,
  "currentAmount": 950000,
  "monthlyPayment": 6000,
  "annualRate": 4.5,
  "months": 360,
  "status": "normal",
  "createDate": "2024-01-01",
  "notes": "首套房贷款"
}
```

#### 3. 设置储蓄目标

```http
POST /api/saving-goals
Content-Type: application/json

{
  "title": "购车基金",
  "targetAmount": 150000,
  "currentAmount": 30000,
  "deadline": "2026-06-30",
  "category": "car",
  "description": "为购买新车储蓄",
  "status": "active"
}
```

---

## 🔧 Apifox 高级功能

### 1. 处理动态 ID（重要）⭐

由于数据库自增 ID 不会重置，创建的数据 ID 可能不是 1。

**解决方法：使用后置脚本自动保存 ID**

#### 创建接口（POST）的后置操作

在 `POST /api/assets`、`POST /api/liabilities`、`POST /api/saving-goals` 接口中：

1. 点击 **后置操作** 标签
2. 添加以下脚本：

```javascript
// 资产接口
const response = pm.response.json();
if (response.success && response.data && response.data.id) {
    pm.environment.set("asset_id", response.data.id);
}
```

```javascript
// 负债接口
const response = pm.response.json();
if (response.success && response.data && response.data.id) {
    pm.environment.set("liability_id", response.data.id);
}
```

```javascript
// 储蓄罐接口
const response = pm.response.json();
if (response.success && response.data && response.data.id) {
    pm.environment.set("saving_goal_id", response.data.id);
}
```

#### 在其他接口中使用动态 ID

- `PUT /api/assets/{{asset_id}}`
- `DELETE /api/liabilities/{{liability_id}}`
- `PUT /api/saving-goals/{{saving_goal_id}}`

### 2. 环境变量动态设置

在「测试脚本」中保存响应数据：

```javascript
// 在创建资产后，保存资产ID
if (pm.response.json().success) {
  pm.environment.set("asset_id", pm.response.json().data.id);
}
```

### 2. 批量测试

创建测试场景：
1. 创建资产
2. 查询资产列表
3. 更新资产
4. 删除资产

### 3. Mock 数据

Apifox 可以自动根据响应示例生成 Mock 数据，用于前端开发。

---

## ❓ 常见问题

### Q1: 请求返回 401 未授权？

**A**: 在开发环境下不需要 Token。检查：
1. 后端是否运行在开发模式（`NODE_ENV=development`）
2. 检查后端 `.env` 文件配置

### Q2: 请求返回 500 数据库错误？

**A**: 检查：
1. MySQL 服务是否运行
2. 数据库配置是否正确（`backend/.env`）
3. 查看后端控制台的详细错误信息

### Q3: 如何重置测试数据？

**A**: 运行清空数据脚本：
```bash
cd backend
node scripts/clear-all-data.js
```

### Q4: 数值字段应该传数字还是字符串？

**A**: 推荐传**数字**：
```json
{
  "currentValue": 15999,      // ✅ 推荐
  "annualRate": 5.5,          // ✅ 推荐
  "currentValue": "15999",    // ⚠️ 也可以，后端会自动转换
}
```

### Q5: 日期格式是什么？

**A**: 使用 `YYYY-MM-DD` 格式：
```json
{
  "createDate": "2025-12-03",
  "deadline": "2025-12-31"
}
```

---

## 📊 数据模型参考

### 资产分类（categoryL1）

- `current_assets`: 流动资产（现金、银行存款）
- `financial_assets`: 金融资产（股票、基金）
- `physical_assets`: 实物资产（房产、车辆）
- `work_income`: 工作收入

### 负债分类（categoryL1）

- `current_liabilities`: 流动负债（信用卡、短期借款）
- `long_term_liabilities`: 长期负债（房贷、车贷）

### 储蓄目标类别（category）

- `emergency`: 应急基金
- `education`: 教育基金
- `retirement`: 退休基金
- `travel`: 旅行基金
- `housing`: 购房基金
- `other`: 其他

---

## 🎯 快速开始检查清单

- [ ] 后端服务已启动（`http://localhost:3000`）
- [ ] MySQL 数据库已运行
- [ ] 在 Apifox 中创建了项目
- [ ] 配置了环境变量（base_url, api_prefix）
- [ ] 测试 `/health` 接口确认连接成功
- [ ] 尝试创建一条资产数据
- [ ] 尝试查询资产列表

---

**文档版本**: v1.0  
**更新时间**: 2025-12-03  
**后端版本**: 1.0.0  
**API Base URL**: http://localhost:3000/api
