# 财务报表页面重构设计

> 日期: 2026-06-17
> 状态: 已确认

## 目标

将当前 5 个会计专业报表 tab（概览、资产负债表、利润表、现金流量表、财务分析）全部替换为 4 个面向普通用户的可视化 tab。

## 新 Tab 结构

### Tab 1: 每日成本 (`daily-cost`)

展示消费资产的真实消耗，这是本应用的核心差异化功能。

**UI 结构：**
1. 顶部卡片 -- 综合日均成本（大字）+ 较上月变化（百分比 + 箭头）
2. 趋势柱状图 -- 最近 6 个月日均成本变化（复用 financial_snapshots 快照数据）
3. TOP5 排行 -- 消耗最高的 5 个资产，横向条形图 + 金额
4. 成本构成饼图 -- 折旧损失 / 运营费用 / 贷款利息 三部分占比

**数据来源：**
- 每个消费资产的 `calculateDailyCost()` 函数
- 负债月利息分摊到日：`monthlyPayment * annualRate / 12 / 30`
- 运营费用：`monthlyOperatingCost / 30`
- 趋势数据：`StorageManager.getRecentSnapshots(6)` 中的 dailyCost 字段（需新增）

**计算逻辑：**
```
综合日均成本 = SUM(各消费资产日均成本) + SUM(各负债日均利息)
折旧损失 = SUM(各资产累计折旧 / 使用天数)
运营费用 = SUM(各资产月运营成本 / 30)
贷款利息 = SUM(各负债月利息 / 30)
```

### Tab 2: 资产构成 (`assets`)

一眼看清"我的钱在哪"。

**UI 结构：**
1. 资产类型饼图 -- 现金类 / 金融类 / 实物类 / 其他，带百分比标签和图例
2. TOP5 资产排行 -- 按价值排序的横向条形图（不含工作收入）
3. 资产状态分布 -- 使用中 / 吃灰中 / 已卖出 / 已丢失等状态计数

**数据来源：**
- `StorageManager.getAssets()` 按 `categoryL1` 分组
- 工作收入不计入资产饼图（与首页逻辑一致）
- 状态统计：`assets.reduce` 按 `status` 分组计数

**饼图实现：**
使用 CSS `conic-gradient`，根据各类型占比计算渐变色停点：
```css
background: conic-gradient(
  #667eea 0% 35%,    /* 现金类 35% */
  #4caf50 35% 60%,   /* 金融类 25% */
  #ff9800 60% 90%,   /* 实物类 30% */
  #9e9e9e 90% 100%   /* 其他 10% */
);
```

### Tab 3: 负债管理 (`debts`)

一眼看清"我还欠多少"。

**UI 结构：**
1. 总负债卡片 -- 总欠款 + 月还款总额 + 总利息成本
2. 负债类型饼图 -- 房贷 / 消费贷 / 信用卡 / 其他
3. 每笔负债还款进度条 -- 已还金额 / 总额 + 百分比 + 预计还清日期

**数据来源：**
- `StorageManager.getLiabilities()`
- 还款进度：`(originalAmount - currentAmount) / originalAmount * 100`
- 预计还清：`currentAmount / monthlyPayment` 个月后

**进度条实现：**
```html
<view class="progress-bar">
  <view class="progress-fill" style="width: {{progressPercent}}%"></view>
</view>
```

### Tab 4: 财务健康 (`health`)

用红绿灯色标给出直观判断。

**UI 结构：**
4 个健康指标卡片，每个包含：
- 指标名称（中文，不显示英文/专业术语）
- 圆环进度条（CSS border 实现）
- 当前值 + 颜色（绿/黄/红）
- 一句话建议

**指标定义：**

| 指标 | 计算公式 | 绿色 | 黄色 | 红色 |
|------|----------|------|------|------|
| 储蓄率 | (月收入-月支出) / 月收入 | >30% | 10-30% | <10% |
| 负债安全度 | 总负债 / 总资产 | <50% | 50-70% | >70% |
| 资产流动性 | 现金类资产 / 总资产 | >20% | 10-20% | <10% |
| 财务自由度 | 被动收入 / 月支出 | >100% | 50-100% | <50% |

**圆环实现：**
```css
.ring {
  width: 80rpx; height: 80rpx;
  border-radius: 50%;
  border: 8rpx solid #e0e0e0;
  border-top-color: #4caf50; /* 绿色段 */
  transform: rotate(-90deg);
}
```

## 技术方案

- 不引入第三方图表库
- 饼图：CSS `conic-gradient`
- 柱状图：CSS `height` + `rpx`（复用现有趋势图方案）
- 条形图：CSS `width` + 百分比
- 进度条：CSS `width` 百分比
- 圆环：CSS `border` + `transform: rotate`
- 暗色主题：通过 `.dark-theme` 类切换颜色变量

## 快照数据扩展

当前 `financial_snapshots` 快照只记录 `netWorth` 和 `monthlyCashFlow`。
需扩展为同时记录 `dailyCost`，以便 Tab 1 趋势图使用。

```javascript
// storage.js saveSnapshot 调用处（report.js generate）
StorageManager.saveSnapshot({
  month: currentMonthKey,
  netWorth: netWorth,
  monthlyCashFlow: monthlyCashFlow,
  dailyCost: totalDailyCost,  // 新增
  totalIncome: totalIncomeNum,
  totalExpenses: totalExpensesNum
})
```

## 不再需要的代码

以下旧报表相关代码可以删除：
- `textIncome` / `textCashflow` / `textRatios` 相关数据和计算
- 利润表、现金流量表、财务比率的 WXML 模板
- `periodType` / `periodLabel` / `switchPeriod` 时间段切换
- 旧的 `buildDepreciationList` 函数

## 影响的文件

| 文件 | 改动 |
|------|------|
| `pages/report/report.js` | 重写 `generate()`，新增 4 个 tab 的数据计算 |
| `pages/report/report.wxml` | 全部重写，4 个新 tab 的 UI |
| `pages/report/report.wxss` | 全部重写，新增饼图/圆环/条形图样式 |
| `pages/report/report.json` | 可能需要调整组件配置 |
| `utils/storage.js` | 快照记录新增 dailyCost 字段 |
| `pages/index/index.js` | `calculateCashflow()` 中调用快照时传入 dailyCost |
