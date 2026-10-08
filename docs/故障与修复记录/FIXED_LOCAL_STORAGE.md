# 本地存储模式修复完成

## ✅ 问题解决

**问题**：`StorageManager.saveAsset is not a function`

**原因**：切换到本地存储模式后，`StorageManager` 缺少 `saveAsset` 和 `saveLiability` 方法

## 🔧 修复内容

### 1. 切换为本地存储模式

**文件**：`utils/apiClient.js`

```javascript
const API_CONFIG = {
  ENABLE_CLOUD: false,  // ❌ 使用本地存储模式
}
```

### 2. 添加缺失的方法

**文件**：`utils/storage.js`

#### 新增 `saveAsset()` 方法
```javascript
// 保存资产（智能判断新增或更新）
saveAsset(assetData) {
  if (assetData.id && typeof assetData.id === 'string' && assetData.id.startsWith('asset_')) {
    // 已有ID，是更新操作
    return this.updateAsset(assetData.id, assetData)
  } else {
    // 无ID或是临时ID，是新增操作
    return this.addAsset(assetData)
  }
}
```

#### 新增 `saveLiability()` 方法
```javascript
// 保存负债（智能判断新增或更新）
saveLiability(liabilityData) {
  if (liabilityData.id && typeof liabilityData.id === 'string' && liabilityData.id.startsWith('liability_')) {
    // 已有ID，是更新操作
    return this.updateLiability(liabilityData.id, liabilityData)
  } else {
    // 无ID或是临时ID，是新增操作
    return this.addLiability(liabilityData)
  }
}
```

## 📦 完整的 StorageManager API

### 资产相关
- ✅ `saveAsset(assetData)` - 保存资产（新增或更新）
- ✅ `addAsset(asset)` - 新增资产
- ✅ `updateAsset(id, updatedAsset)` - 更新资产
- ✅ `deleteAsset(id)` - 删除资产
- ✅ `getAssets()` - 获取所有资产
- ✅ `saveAssets(assets)` - 批量保存资产

### 负债相关
- ✅ `saveLiability(liabilityData)` - 保存负债（新增或更新）
- ✅ `addLiability(liability)` - 新增负债
- ✅ `updateLiability(id, updatedLiability)` - 更新负债
- ✅ `deleteLiability(id)` - 删除负债
- ✅ `getLiabilities()` - 获取所有负债
- ✅ `saveLiabilities(liabilities)` - 批量保存负债

### 储蓄罐相关
- ✅ 直接使用 `wx.getStorageSync('financial_goals')`
- ✅ 直接使用 `wx.setStorageSync('financial_goals', goals)`

## 💾 数据存储结构

### Storage Keys
| 数据类型 | Storage Key | 说明 |
|---------|------------|------|
| 资产 | `assets_data` | 所有资产数据 |
| 负债 | `liabilities_data` | 所有负债数据 |
| 储蓄罐 | `financial_goals` | 梦想储蓄罐数据 |
| 用户信息 | `user_info` | 用户基本信息 |
| 设置 | `app_settings` | 应用设置 |

### ID 生成规则
- 资产 ID：`asset_1701591234567` (前缀 + 时间戳)
- 负债 ID：`liability_1701591234567` (前缀 + 时间戳)
- 储蓄罐 ID：`1701591234567` (纯时间戳)

## 🔄 SmartStorage 工作流程

```javascript
// SmartStorage.saveAsset() 的调用流程：
SmartStorage.saveAsset(assetData)
  ↓ (ENABLE_CLOUD = false)
  StorageManager.saveAsset(assetData)
    ↓ (判断 ID)
    ├─ 有 ID → StorageManager.updateAsset(id, data)
    └─ 无 ID → StorageManager.addAsset(data)
```

## ✅ 现在可以正常工作

### 资产管理
```javascript
const { SmartStorage } = require('../../utils/apiClient.js')

// 创建资产
await SmartStorage.saveAsset({
  name: '现金',
  categoryL1: 'cash_equivalents',
  initialValue: 10000
})

// 更新资产
await SmartStorage.saveAsset({
  id: 'asset_1701591234567',
  name: '现金（已更新）',
  currentValue: 12000
})

// 删除资产
await SmartStorage.deleteAsset('asset_1701591234567')

// 获取资产列表
const assets = await SmartStorage.getAssets()
```

### 负债管理
```javascript
// 创建负债
await SmartStorage.saveLiability({
  name: '信用卡',
  categoryL1: 'credit_debt',
  initialAmount: 5000
})

// 获取负债列表
const liabilities = await SmartStorage.getLiabilities()
```

### 储蓄罐管理
```javascript
// 创建储蓄罐
await SmartStorage.saveSavingGoal({
  title: '应急基金',
  targetAmount: 30000,
  currentAmount: 0
})

// 获取储蓄罐列表
const goals = await SmartStorage.getSavingGoals()
```

## 📝 注意事项

1. **本地模式优点**
   - 无需后端服务器
   - 完全离线使用
   - 响应速度快
   - 无网络流量消耗

2. **本地模式限制**
   - 数据只保存在当前设备
   - 卸载小程序会丢失数据
   - 无法跨设备同步
   - 存储上限 10MB

3. **ID 识别规则**
   - 带前缀的 ID（如 `asset_xxx`）= 本地已保存的数据，执行更新
   - 无 ID 或数字 ID = 新数据，执行新增

## 🎯 修复状态

- ✅ 资产管理：正常工作
- ✅ 负债管理：正常工作
- ✅ 储蓄罐管理：正常工作
- ✅ 本地存储模式：已启用
- ✅ 所有 CRUD 操作：可用

---

**修复完成时间**：2025-12-03 11:23
**修复状态**：✅ 完成并测试通过
