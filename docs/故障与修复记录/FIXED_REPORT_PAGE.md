# 财务报告页面数据读取修复

## 🐛 问题描述

财务报告页面无法正确读取数据，因为它直接使用 `StorageManager` 读取本地存储，而没有使用 `SmartStorage` 支持云端模式。

## 🔍 问题原因

**原代码**：`pages/report/report.js`
```javascript
const assets = (StorageManager.getAssets && StorageManager.getAssets()) 
  || wx.getStorageSync('assets_data') || []
const liabilities = (StorageManager.getLiabilities && StorageManager.getLiabilities()) 
  || wx.getStorageSync('liabilities_data') || []
```

这种方式只能读取本地存储，无法从数据库获取数据。

## ✅ 修复方案

### 1. 引入 SmartStorage

```javascript
const StorageManager = require('../../utils/storage.js')
const { SmartStorage } = require('../../utils/apiClient.js')  // ✅ 新增
```

### 2. 修改 generate() 方法

```javascript
// 修改前
generate() {
  const assets = StorageManager.getAssets() || []
  const liabilities = StorageManager.getLiabilities() || []
  // ...
}

// 修改后
async generate() {
  const assets = await SmartStorage.getAssets() || []
  const liabilities = await SmartStorage.getLiabilities() || []
  // ...
}
```

## 🎯 修复效果

现在财务报告页面会根据 `ENABLE_CLOUD` 配置自动选择数据源：

### 云端模式（ENABLE_CLOUD: true）
```
财务报告页面
  ↓ SmartStorage.getAssets()
  ↓ APIClient.getAssets()
  ↓ HTTP GET /api/assets
MySQL 数据库
```

### 本地模式（ENABLE_CLOUD: false）
```
财务报告页面
  ↓ SmartStorage.getAssets()
  ↓ StorageManager.getAssets()
wx.Storage (本地存储)
```

## 📊 财务报告包含的数据

- **资产总计**：从数据库/本地读取所有资产
- **负债总计**：从数据库/本地读取所有负债
- **净资产**：资产 - 负债
- **月度收入**：工作收入 + 投资收入 + 经营收入
- **月度支出**：经营费用 + 财务费用 + 折旧费用
- **现金流**：收入 - 支出

## 🔧 其他需要检查的页面

以下页面可能也需要类似修复：

- ✅ `pages/index/index.js` - 首页（已使用 SmartStorage）
- ✅ `pages/assets/assets.js` - 资产列表（已使用 SmartStorage）
- ✅ `pages/liabilities/liabilities.js` - 负债列表（已使用 SmartStorage）
- ✅ `pages/goals/goals.js` - 储蓄罐（已使用 SmartStorage）
- ✅ `pages/report/report.js` - 财务报告（**已修复**）

## 📱 使用方法

1. **重新编译小程序**
2. **打开财务报告页面**
3. **查看数据是否正确显示**

现在应该能看到：
- 资产：¥4,299
- 负债：¥4,209
- 净资产：¥90

---

**修复完成时间**：2025-12-03 11:28
**修复状态**：✅ 完成
