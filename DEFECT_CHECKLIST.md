# 缺陷清单 — 大鹅爱记账

> 生成时间: 2026-06-16 | 最后更新: 2026-06-17
> 规则: 每次只处理一处缺陷，完成后勾选 `[x]`

---

## P0 严重 — 影响核心功能

- [x] **#1 示范数据分类与实际分类体系不匹配**
  文件: `pages/login/login.js`
  `createSampleData()` 使用了 `salary_income`、`freelance_income`、`fixed_assets`、`real_estate`、`medium_term_debt`、`short_term_debt` 等不存在的分类值，应与 `utils/accountingCategories.js` 中的 `ASSET_CATEGORIES` / `LIABILITY_CATEGORIES` 对齐。

- [x] **#2 detail.js 分类名称查询使用不存在的属性**
  文件: `pages/detail/detail.js`
  `getCategoryName()` 访问 `AccountingCategories.assetCategories` / `AccountingCategories.liabilityCategories`，实际属性名为 `ASSET_CATEGORIES` / `LIABILITY_CATEGORIES`。详情页分类名称永远显示"未知分类"。

- [x] **#3 三个存储管理器并存且职责混乱** *(不处理 — 架构重构，影响面大，已有 DEPRECATED 标记)*
  文件: `utils/storage.js`、`utils/financialStorage.js`、`utils/newFinancialStorage.js`
  三者使用不同存储键，`AccountingEngine`、`DepreciationEngine` 等会计计算逻辑未被页面层调用，成为死代码。

## P1 高 — 影响数据一致性

- [x] **#4 add-cost.js 直接读写存储绕过 StorageManager**
  文件: `pages/add-cost/add-cost.js`
  `loadItemInfo()` 和 `updateAssetValue()` 直接使用 `wx.getStorageSync`，绕过迁移和示例数据清理逻辑。

- [x] **#5 detail.js onShow 直接读取存储绕过 StorageManager**
  文件: `pages/detail/detail.js`
  `onShow()` 和 `loadItemData()` 直接使用 `wx.getStorageSync`。

- [x] **#6 i18n 配置中应用名称错误**
  文件: `i18n/base.json`
  应用名写的是"金鹅生蛋"，应为"大鹅爱记账"。

- [x] **#7 app.js 主题轮询 setInterval 从未清理**
  文件: `app.js`
  `startThemePolling()` 创建的 `setInterval` 无清理机制，可能内存泄漏。

## P2 中 — 影响用户体验

- [x] **#8 report.js 趋势图使用模拟数据**
  文件: `pages/report/report.js`
  `makeTrendSeries()` 仅基于当前值做 +-5% 模拟，无真实历史数据。

- [x] **#9 formatMoney 实现不一致**
  `profile.js` 对 >=10000 显示"X万"，其他页面使用千分位格式。

- [x] **#10 manifest.json 项目名称为 "111"**
  文件: `manifest.json`
  `name` 字段为 "111"，`mp-weixin.appid` 为空。

- [x] **#11 缺少 .gitignore 文件**
  `.idea/` 目录、`generate_docx.py`、`文档/` 等非小程序文件被 git 跟踪。

- [x] **#12 index.js data 中 netWorth 等字段重复声明**
  文件: `pages/index/index.js`
  `netWorth`、`assetsCount`、`liabilitiesCount` 在 data 中声明了两次。

- [x] **#16 每日成本计算 currentValue 为 0 时折旧丢失**
  文件: `pages/index/index.js`
  `calculateDailyCost()` 中 `parseFloat(currentValue) || originalValue`，当 currentValue 为 0 时 `||` 误回退到 originalValue，导致累计折旧损失为 0。

## P3 低 — 代码质量

- [x] **#13 accountingEngine.js 和 depreciation.js 未被页面调用**
  完整的会计计算引擎只被 `newFinancialStorage.js` 引用，而该文件未被任何页面使用。

- [x] **#14 generate_docx.py 不应出现在小程序项目中**
  Python 文档生成脚本与小程序运行无关。

- [x] **#15 登录页实际是引导页，命名有误导性** *(不处理 — 不影响用户使用)*
  `pages/login/login` 只做初始化和示例数据创建，无登录功能。

---

## 修复进度

| # | 优先级 | 状态 | 修复说明 | 提交 |
|---|--------|------|----------|------|
| 1 | P0 | 已修复 | login.js 示范数据分类全部对齐 accountingCategories.js 定义 | `9270989` |
| 2 | P0 | 已修复 | assetCategories -> ASSET_CATEGORIES, liabilityCategories -> LIABILITY_CATEGORIES | `9270989` |
| 3 | P0 | 不处理 | 架构重构，已有 DEPRECATED 标记 | -- |
| 4 | P1 | 已修复 | add-cost.js 引入 StorageManager, loadItemInfo/updateAssetValue 改用 StorageManager | `9270989` |
| 5 | P1 | 已修复 | detail.js getCategoryName 已用 ASSET_CATEGORIES/LIABILITY_CATEGORIES (与 #2 合并修复) | `9270989` |
| 6 | P1 | 已修复 | i18n/base.json 应用名改为 大鹅爱记账 | `9270989` |
| 7 | P1 | 已修复 | setInterval 前先 clearInterval, 存储 timer ID 到 this._themePollingTimer | `9270989` |
| 8 | P2 | 已修复 | 新增快照存储, 趋势图改为读取最近6个月真实数据 | `adc8653` |
| 9 | P2 | 已修复 | 统一为标准千分位格式 | `0b890ec` |
| 10 | P2 | 已修复 | manifest.json name 改为 大鹅爱记账 | `9270989` |
| 11 | P2 | 已修复 | 新增 .gitignore 忽略 .idea/ 文档/ generate_docx.py 等 | `9270989` |
| 12 | P2 | 已修复 | index.js data 中移除重复的 netWorth/assetsCount/liabilitiesCount 声明 | `9270989` |
| 13 | P3 | 已修复 | 添加 [DEPRECATED] 标记说明 | `d1fe405` |
| 14 | P3 | 已修复 | git rm --cached 已移除 | `f6abd98` |
| 15 | P3 | 不处理 | 不影响用户使用 | -- |
| 16 | P2 | 已修复 | currentValue 为 0 时 \|\| 误回退到 originalValue，改用 isNaN 判断 | `414fb42` |

---

## 附加修复

| 修复 | 提交 | 说明 |
|------|------|------|
| 清除 UTF-8 BOM | `8de2d7e` | PowerShell WriteAllText 在 12 个文件引入了 BOM，已清除 |
| storage.js 快照方法位置 | `36e9408` | 快照方法被插入到 StorageManager 对象外部导致语法错误 |