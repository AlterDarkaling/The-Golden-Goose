# 负债年利率字段修复

## 🐛 问题描述

创建负债时出现 500 错误：
```
Out of range value for column 'annual_rate'
数据库操作失败
```

## 🔍 问题原因

**数据库字段定义**：
```javascript
annual_rate: {
  type: DataTypes.DECIMAL(5, 4),  // ❌ 错误：最大值只有 9.9999
  allowNull: true,
  comment: '年利率'
}
```

`DECIMAL(5, 4)` 的含义：
- 总共5位数字
- 小数点后4位
- 有效范围：`-9.9999` 到 `9.9999`

**前端传入的值**：
```javascript
annualRate: 10  // 表示 10%
annualRate: 12.5  // 表示 12.5%
```

这些值超出了 `DECIMAL(5, 4)` 的范围！

## ✅ 修复方案

修改字段定义为 `DECIMAL(6, 2)`：

```javascript
annual_rate: {
  type: DataTypes.DECIMAL(6, 2),  // ✅ 修复：支持 0.00 到 9999.99
  allowNull: true,
  comment: '年利率（百分比，如 10.5 表示 10.5%）'
}
```

`DECIMAL(6, 2)` 的含义：
- 总共6位数字
- 小数点后2位
- 有效范围：`-9999.99` 到 `9999.99`
- 可以支持 0% 到 100% 的利率

## 📊 支持的利率范围

修复后支持的利率值：

| 利率 | 数值 | 状态 |
|------|------|------|
| 0% | 0.00 | ✅ 支持 |
| 5.5% | 5.50 | ✅ 支持 |
| 10% | 10.00 | ✅ 支持 |
| 12.5% | 12.50 | ✅ 支持 |
| 24% | 24.00 | ✅ 支持 |
| 36% | 36.00 | ✅ 支持 |
| 100% | 100.00 | ✅ 支持 |

## 🔄 数据库同步

修改模型后，后端会自动同步数据库结构（`db.sync({ alter: true })`）：

```bash
[nodemon] restarting due to changes...
[nodemon] starting `node app.js`
✅ 数据库模型同步完成
🚀 服务器运行在 http://localhost:3000
```

## 🧪 测试验证

测试创建负债：
```bash
POST /api/liabilities
{
  "name": "测试车贷",
  "annualRate": 12.5,
  "originalAmount": 50000,
  "monthlyPayment": 1500
}
```

响应：
```json
{
  "success": true,
  "message": "负债创建成功"
}
```

## 📝 相关字段

以下字段也可能需要类似检查：

- ✅ `monthly_payment` - DECIMAL(15, 2) ✅ 正常
- ✅ `annual_rate` - DECIMAL(6, 2) ✅ **已修复**
- ✅ `total_interest` - DECIMAL(15, 2) ✅ 正常
- ✅ `total_amount` - DECIMAL(15, 2) ✅ 正常
- ✅ `current_amount` - DECIMAL(15, 2) ✅ 正常

## 📱 前端使用

前端可以正常传入利率值：

```javascript
// 创建负债
await SmartStorage.saveLiability({
  name: '车贷',
  annualRate: 10,  // 10%
  originalAmount: 50000,
  monthlyPayment: 1500,
  months: 36
})
```

---

**修复完成时间**：2025-12-03 11:32
**修复状态**：✅ 完成并测试通过
