# 梦想储蓄罐功能 - 云端存储实现

## 📋 概述

梦想储蓄罐功能现已支持云端数据库存储，用户的储蓄目标数据将安全地保存在服务器端。

## 🗄️ 数据库结构

### 表名：`saving_goals`

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER | 主键，自增 |
| user_id | INTEGER | 用户ID（外键） |
| title | STRING(200) | 储蓄罐名称 |
| category | STRING(50) | 储蓄类型 |
| description | TEXT | 描述 |
| target_amount | DECIMAL(15,2) | 目标金额 |
| current_amount | DECIMAL(15,2) | 当前金额 |
| deadline | DATE | 目标日期 |
| create_time | DATETIME | 创建时间 |
| status | ENUM | 状态：active/completed/cancelled |
| is_sample | BOOLEAN | 是否为示例数据 |
| created_at | DATETIME | 记录创建时间 |
| updated_at | DATETIME | 记录更新时间 |

### 储蓄类型（category）

- `emergency` - 应急储蓄
- `house` - 购房基金
- `education` - 教育基金
- `travel` - 旅行基金
- `investment` - 投资基金
- `retirement` - 养老储蓄
- `car` - 购车基金
- `wedding` - 婚礼基金
- `health` - 健康基金
- `debt` - 还债目标
- `gift` - 礼物基金
- `other` - 其他目标

## 📡 API 接口

### 基础路径
```
/api/saving-goals
```

### 1. 获取储蓄目标列表
```
GET /api/saving-goals
```

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": 1,
      "title": "应急基金",
      "category": "emergency",
      "description": "6个月生活费",
      "targetAmount": 30000,
      "currentAmount": 5000,
      "deadline": "2025-12-31",
      "createTime": "2025-12-03T02:00:00.000Z",
      "status": "active",
      "isSample": false,
      "createdAt": "2025-12-03T02:00:00.000Z",
      "updatedAt": "2025-12-03T02:30:00.000Z"
    }
  ],
  "total": 1
}
```

### 2. 创建储蓄目标
```
POST /api/saving-goals
```

**请求体：**
```json
{
  "title": "应急基金",
  "category": "emergency",
  "description": "6个月生活费",
  "targetAmount": 30000,
  "currentAmount": 0,
  "deadline": "2025-12-31",
  "createTime": "2025-12-03T02:00:00.000Z",
  "status": "active"
}
```

### 3. 更新储蓄目标
```
PUT /api/saving-goals/:id
```

**请求体：**
```json
{
  "currentAmount": 10000,
  "status": "active"
}
```

### 4. 删除储蓄目标
```
DELETE /api/saving-goals/:id
```

### 5. 批量删除储蓄目标
```
POST /api/saving-goals/batch-delete
```

**请求体：**
```json
{
  "ids": [1, 2, 3]
}
```

## 🔄 前端集成

### 引入 SmartStorage

```javascript
const { SmartStorage } = require('../../utils/apiClient.js')
```

### 使用方法

#### 1. 获取储蓄目标列表
```javascript
const goals = await SmartStorage.getSavingGoals()
```

#### 2. 创建储蓄目标
```javascript
const goal = {
  title: '应急基金',
  targetAmount: 30000,
  currentAmount: 0,
  deadline: '2025-12-31',
  category: 'emergency',
  description: '6个月生活费',
  createTime: new Date().toISOString(),
  status: 'active'
}

await SmartStorage.saveSavingGoal(goal)
```

#### 3. 更新储蓄目标
```javascript
goal.currentAmount = 10000
await SmartStorage.saveSavingGoal(goal)
```

#### 4. 删除储蓄目标
```javascript
await SmartStorage.deleteSavingGoal(goalId)
```

## 🔀 本地与云端切换

SmartStorage 会自动根据 `API_CONFIG.ENABLE_CLOUD` 配置选择存储方式：

- **云端模式**（`ENABLE_CLOUD: true`）：数据保存到服务器
- **本地模式**（`ENABLE_CLOUD: false`）：数据保存到本地 Storage

在 `utils/apiClient.js` 中修改配置：
```javascript
const API_CONFIG = {
  ENABLE_CLOUD: true,  // true=云端模式, false=本地模式
  BASE_URL: 'http://localhost:3000/api'
}
```

## 🔐 认证

所有储蓄目标 API 都需要 JWT Token 认证：

```javascript
Authorization: Bearer <token>
```

Token 会自动从本地存储中获取并添加到请求头。

## ✅ 测试

### 1. 创建测试储蓄目标
```bash
curl -X POST http://localhost:3000/api/saving-goals \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试储蓄罐",
    "targetAmount": 10000,
    "currentAmount": 0,
    "deadline": "2025-12-31",
    "category": "emergency",
    "description": "测试",
    "createTime": "2025-12-03T02:00:00.000Z",
    "status": "active"
  }'
```

### 2. 获取列表
```bash
curl http://localhost:3000/api/saving-goals
```

## 📝 注意事项

1. **字段映射**：前端使用驼峰命名（如 `targetAmount`），后端自动转换为下划线命名（如 `target_amount`）
2. **数字类型**：金额字段会自动从字符串转换为数字类型
3. **ID 管理**：
   - 创建时不需要传 `id`，后端会自动生成
   - 更新时需要传数字类型的 `id`
4. **状态管理**：
   - `active` - 进行中
   - `completed` - 已完成
   - `cancelled` - 已取消

## 🚀 已完成的工作

- ✅ 创建 SavingGoal 数据库模型
- ✅ 创建 savingGoalController 控制器
- ✅ 创建 /api/saving-goals 路由
- ✅ 在 models/index.js 中注册模型关系
- ✅ 在 app.js 中注册路由
- ✅ 在 apiClient.js 中添加 API 方法
- ✅ 在 SmartStorage 中添加智能存储方法
- ✅ 更新 pages/goals/goals.js 使用云端 API
- ✅ 测试所有 CRUD 功能

## 🎯 后续优化建议

1. 添加储蓄目标的进度统计分析
2. 支持储蓄目标的分享功能
3. 添加储蓄提醒通知
4. 支持储蓄计划的智能建议
