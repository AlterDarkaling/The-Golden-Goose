# 本地存储模式说明

## 📱 当前配置

**存储模式**：本地存储模式（LocalStorage Mode）

```javascript
const API_CONFIG = {
  ENABLE_CLOUD: false  // ❌ 使用本地存储模式
}
```

## 📦 数据存储位置

所有数据都保存在微信小程序的本地存储（`wx.Storage`）中：

| 数据类型 | Storage Key | 说明 |
|---------|------------|------|
| 资产 | `assets` | 用户的资产数据 |
| 负债 | `liabilities` | 用户的负债数据 |
| 储蓄罐 | `financial_goals` | 梦想储蓄罐数据 |
| 用户信息 | `user_info` | 用户基本信息 |

## ✅ 优点

1. **无需后端**：不需要启动后端服务器
2. **离线使用**：完全离线也能使用
3. **响应快速**：本地读写速度快
4. **无流量消耗**：不产生网络请求
5. **数据私密**：数据只保存在用户设备上

## ⚠️ 注意事项

1. **数据隔离**：每个用户的数据只保存在自己的设备上
2. **无法同步**：更换设备后数据不会自动迁移
3. **存储限制**：微信小程序本地存储有 10MB 限制
4. **无备份**：卸载小程序会丢失数据

## 🔄 如何切换到云端模式

如果需要使用云端数据库存储，修改 `utils/apiClient.js`：

```javascript
const API_CONFIG = {
  ENABLE_CLOUD: true,  // ✅ 启用云端模式
  BASE_URL: 'http://localhost:3000/api'
}
```

然后启动后端服务：
```bash
cd backend
npm run dev
```

## 📊 数据结构

### 资产（assets）
```javascript
{
  id: "1701591234567",
  name: "现金",
  categoryL1: "cash_equivalents",
  initialValue: 10000,
  currentValue: 10000,
  status: "active",
  // ...
}
```

### 负债（liabilities）
```javascript
{
  id: "1701591234568",
  name: "信用卡",
  categoryL1: "credit_debt",
  initialAmount: 5000,
  currentAmount: 5000,
  status: "active",
  // ...
}
```

### 储蓄罐（financial_goals）
```javascript
{
  id: "1701591234569",
  title: "应急基金",
  category: "emergency",
  targetAmount: 30000,
  currentAmount: 5000,
  deadline: "2025-12-31",
  status: "active",
  // ...
}
```

## 🛠️ 使用方式

前端代码使用 `SmartStorage`，会自动根据 `ENABLE_CLOUD` 配置选择存储方式：

```javascript
const { SmartStorage } = require('../../utils/apiClient.js')

// 获取资产列表
const assets = await SmartStorage.getAssets()

// 保存资产
await SmartStorage.saveAsset(assetData)

// 删除资产
await SmartStorage.deleteAsset(assetId)
```

## 📝 开发建议

1. **开发阶段**：使用本地存储模式，快速迭代
2. **生产环境**：使用云端模式，支持数据同步和备份
3. **混合模式**：部分数据本地（如草稿），部分云端（如正式记录）

## 🔍 查看本地数据

在微信开发者工具中：
1. 点击"调试器"
2. 选择"Storage"标签
3. 查看 `wx.storage` 中的数据

## 🗑️ 清除本地数据

```javascript
// 清除所有资产
wx.removeStorageSync('assets')

// 清除所有负债
wx.removeStorageSync('liabilities')

// 清除所有储蓄罐
wx.removeStorageSync('financial_goals')

// 或清除所有数据
wx.clearStorageSync()
```

---

**当前状态**：✅ 本地存储模式已启用
**最后更新**：2025-12-03
