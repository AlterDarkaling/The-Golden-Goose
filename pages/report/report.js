const StorageManager = require('../../utils/storage.js')

Page({
  data: {
    isDarkTheme: false,
    activeTab: 'daily-cost',

    // Tab 1: 每日成本
    dailyCostTotal: '0.00',
    dailyCostTrend: [],
    topCostItems: [],
    costPieStyle: '',
    costPieLegend: [],

    // Tab 2: 资产构成
    assetPieStyle: '',
    assetPieLegend: [],
    topAssets: [],
    assetStatusItems: [],

    // Tab 3: 负债管理
    debtTotal: '0.00',
    debtMonthlyPayment: '0.00',
    debtTotalInterest: '0.00',
    debtPieStyle: '',
    debtPieLegend: [],
    debtItems: [],

    // Tab 4: 财务健康
    healthMetrics: []
  },

  onLoad() {
    const app = getApp()
    this.setData({ isDarkTheme: app.globalData.isDarkTheme || false })
    this.setTheme(this.data.isDarkTheme)
    this.generate()
  },

  onShow() {
    const app = getApp()
    if (app.globalData.isDarkTheme !== undefined) {
      this.setData({ isDarkTheme: app.globalData.isDarkTheme })
      this.setTheme(app.globalData.isDarkTheme)
    }
    this.generate()
  },

  setTheme(isDark) {
    try {
      wx.setNavigationBarColor({
        frontColor: isDark ? '#ffffff' : '#000000',
        backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
        animation: { duration: 100, timingFunc: 'easeInOut' }
      })
      if (wx.setBackgroundColor) {
        const bg = isDark ? '#1e1e1e' : '#ffffff'
        wx.setBackgroundColor({ backgroundColor: bg, backgroundColorTop: bg, backgroundColorBottom: bg })
      }
      this.setData({ isDarkTheme: isDark })
    } catch (e) {}
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab })
  },

  // ==================== 主计算 ====================

  generate() {
    const assets = StorageManager.getAssets()
    const liabilities = StorageManager.getLiabilities()

    this.calcDailyCost(assets, liabilities)
    this.calcAssets(assets)
    this.calcDebts(liabilities)
    this.calcHealth(assets, liabilities)

    // 保存当月快照
    const now = new Date()
    const monthKey = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0')
    StorageManager.saveSnapshot({ month: monthKey, netWorth: this._netWorth || 0, monthlyCashFlow: this._cashFlow || 0, dailyCost: this._dailyCostTotal || 0 })
  },

  // ==================== Tab 1: 每日成本 ====================

  calcDailyCost(assets, liabilities) {
    let totalDepreciation = 0, totalOperating = 0, totalInterest = 0
    const itemCosts = []

    assets.forEach(a => {
      if (a.categoryL1 === 'work_income') return
      const orig = this.num(a.originalValue, a.initialValue)
      const cur = this.num(a.currentValue)
      const val = cur !== null ? cur : orig
      if (orig <= 0) return

      const createDate = a.createDate || a.createTime
      if (!createDate) return
      const days = Math.max(1, Math.floor((Date.now() - new Date(createDate).getTime()) / 86400000))

      const dep = Math.max(0, orig - val) / days
      const opCost = this.num(a.monthlyOperatingCost) / 30
      const daily = dep + opCost

      totalDepreciation += dep
      totalOperating += opCost

      if (daily > 0) {
        itemCosts.push({ name: a.name || '未命名', daily: daily, dep: dep, op: opCost })
      }
    })

    liabilities.forEach(l => {
      const rate = this.num(l.annualRate)
      const cur = this.num(l.currentAmount, l.originalAmount, l.initialAmount)
      if (rate > 0 && cur > 0) {
        totalInterest += cur * (rate / 100) / 365
      }
    })

    const grandTotal = totalDepreciation + totalOperating + totalInterest

    // TOP5
    itemCosts.sort((a, b) => b.daily - a.daily)
    const top5 = itemCosts.slice(0, 5)
    const maxCost = top5.length > 0 ? top5[0].daily : 1
    const topCostItems = top5.map(item => ({
      name: item.name,
      costText: '¥' + item.daily.toFixed(2),
      barPercent: Math.round((item.daily / maxCost) * 100)
    }))

    // 成本构成饼图
    const total = totalDepreciation + totalOperating + totalInterest
    const pieData = []
    if (totalDepreciation > 0) pieData.push({ label: '折旧损失', value: totalDepreciation, color: '#667eea' })
    if (totalOperating > 0) pieData.push({ label: '运营费用', value: totalOperating, color: '#4caf50' })
    if (totalInterest > 0) pieData.push({ label: '贷款利息', value: totalInterest, color: '#ff9800' })
    const { style: costPieStyle, legend: costPieLegend } = this.buildPie(pieData, total)

    // 趋势（从快照读取）
    const snapshots = StorageManager.getRecentSnapshots(6)
    const months = this.lastSixMonths()
    const dailyCostTrend = months.map((m, i) => {
      const snap = snapshots.find(s => s.month === m.key)
      let val = (m.key === months[months.length - 1].key) ? grandTotal : (snap && snap.dailyCost ? snap.dailyCost : 0)
      return { month: m.label, valueText: '¥' + val.toFixed(0), barPercent: 0 }
    })
    const maxTrend = Math.max(1, ...dailyCostTrend.map(t => parseFloat(t.valueText.replace('¥', '')) || 0))
    dailyCostTrend.forEach(t => { t.barPercent = Math.round(((parseFloat(t.valueText.replace('¥', '')) || 0) / maxTrend) * 100) })

    this._dailyCostTotal = grandTotal
    this.setData({
      dailyCostTotal: grandTotal.toFixed(2),
      dailyCostTrend, topCostItems, costPieStyle, costPieLegend
    })
  },

  // ==================== Tab 2: 资产构成 ====================

  calcAssets(assets) {
    const groups = {}
    const colors = { current_assets: '#667eea', financial_assets: '#4caf50', physical_assets: '#ff9800', other_assets: '#9e9e9e' }
    const labels = { current_assets: '现金类', financial_assets: '金融类', physical_assets: '实物类', other_assets: '其他' }
    let total = 0

    // 旧分类名 -> 新分类名映射
    const legacyMap = {
      'fixed_assets': 'physical_assets',
      'cashflow_in': 'current_assets',
      'appreciation': 'financial_assets',
      'business': 'physical_assets',
      'consumer_asset': 'physical_assets',
      'other_asset': 'other_assets'
    }

    assets.forEach(a => {
      if (a.categoryL1 === 'work_income') return
      const val = this.num(a.currentValue, a.originalValue, a.initialValue)
      if (val <= 0) return
      const key = legacyMap[a.categoryL1] || a.categoryL1 || 'other_assets'
      groups[key] = (groups[key] || 0) + val
      total += val
    })

    const pieData = Object.keys(groups).map(key => ({
      label: labels[key] || key, value: groups[key], color: colors[key] || '#9e9e9e'
    }))
    const { style: assetPieStyle, legend: assetPieLegend } = this.buildPie(pieData, total)

    // TOP5 资产
    const sorted = assets
      .filter(a => a.categoryL1 !== 'work_income')
      .map(a => ({ name: a.name || '未命名', value: this.num(a.currentValue, a.originalValue, a.initialValue) }))
      .filter(a => a.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
    const maxVal = sorted.length > 0 ? sorted[0].value : 1
    const topAssets = sorted.map(a => ({
      name: a.name,
      valueText: '¥' + a.value.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
      barPercent: Math.round((a.value / maxVal) * 100)
    }))

    // 资产状态
    const statusMap = {}
    const statusLabels = { active: '使用中', dusty: '吃灰中', rented: '出租中', damaged: '已损坏', sold: '已卖出', lost: '已丢失', gifted: '已送人', processed: '已处理' }
    const statusColors = { active: '#4caf50', dusty: '#ff9800', rented: '#2196f3', damaged: '#f44336', sold: '#9e9e9e', lost: '#9e9e9e', gifted: '#9e9e9e', processed: '#9e9e9e' }
    assets.forEach(a => {
      if (a.categoryL1 === 'work_income') return
      const s = a.status || 'active'
      statusMap[s] = (statusMap[s] || 0) + 1
    })
    const assetStatusItems = Object.keys(statusMap).map(s => ({
      name: statusLabels[s] || s, count: statusMap[s], color: statusColors[s] || '#9e9e9e'
    }))

    this.setData({ assetPieStyle, assetPieLegend, topAssets, assetStatusItems })
  },

  // ==================== Tab 3: 负债管理 ====================

  calcDebts(liabilities) {
    let totalDebt = 0, totalMonthly = 0, totalInterest = 0
    const groups = {}
    const colors = { current_liabilities: '#f44336', long_term_liabilities: '#667eea', other_liabilities: '#ff9800' }
    const labels = { current_liabilities: '流动负债', long_term_liabilities: '长期负债', other_liabilities: '其他负债' }

    const debtLegacyMap = {'long_term_debt':'long_term_liabilities','short_term_debt':'current_liabilities','medium_term_debt':'long_term_liabilities','credit_debt':'current_liabilities','consumer_debt':'current_liabilities','investment_debt':'long_term_liabilities','other_debt':'other_liabilities'}

    liabilities.forEach(l => {
      const cur = this.num(l.currentAmount, l.originalAmount, l.initialAmount)
      const orig = this.num(l.originalAmount, l.initialAmount)
      const mp = this.num(l.monthlyPayment)
      totalDebt += cur
      totalMonthly += mp

      const rate = this.num(l.annualRate)
      if (rate > 0 && cur > 0) totalInterest += cur * (rate / 100) / 12

      const key = debtLegacyMap[l.categoryL1] || l.categoryL1 || 'other_liabilities'
      groups[key] = (groups[key] || 0) + cur
    })

    // 负债饼图
    const pieData = Object.keys(groups).map(key => ({
      label: labels[key] || key, value: groups[key], color: colors[key] || '#9e9e9e'
    }))
    const { style: debtPieStyle, legend: debtPieLegend } = this.buildPie(pieData, totalDebt)

    // 每笔负债
    const debtItems = liabilities.map(l => {
      const cur = this.num(l.currentAmount, l.originalAmount, l.initialAmount)
      const orig = this.num(l.originalAmount, l.initialAmount)
      const paid = Math.max(0, orig - cur)
      const pct = orig > 0 ? Math.round((paid / orig) * 100) : 0
      const mp = this.num(l.monthlyPayment)
      const remainMonths = mp > 0 ? Math.ceil(cur / mp) : 0
      return {
        name: l.name || '未命名',
        totalText: '¥' + orig.toLocaleString('zh-CN'),
        paidText: '¥' + paid.toLocaleString('zh-CN'),
        progressPercent: pct,
        remainText: '¥' + cur.toLocaleString('zh-CN'),
        remainMonthsText: remainMonths > 0 ? '约' + remainMonths + '个月还清' : ''
      }
    }).sort((a, b) => b.progressPercent - a.progressPercent)

    this.setData({
      debtTotal: totalDebt.toFixed(2),
      debtMonthlyPayment: totalMonthly.toFixed(2),
      debtTotalInterest: totalInterest.toFixed(2),
      debtPieStyle, debtPieLegend, debtItems
    })
  },

  // ==================== Tab 4: 财务健康 ====================

  calcHealth(assets, liabilities) {
    let totalAssets = 0, cashAssets = 0, totalLiabilities = 0
    let monthlyIncome = 0, monthlyExpense = 0, passiveIncome = 0

    assets.forEach(a => {
      const val = this.num(a.currentValue, a.originalValue, a.initialValue)
      if (a.categoryL1 === 'work_income') {
        monthlyIncome += this.num(a.monthlyIncome, a.actualMonthlyIncome)
        return
      }
      totalAssets += val
      if (a.categoryL1 === 'current_assets') cashAssets += val
      passiveIncome += this.num(a.monthlyIncome)
      monthlyExpense += this.num(a.monthlyOperatingCost)
    })

    liabilities.forEach(l => {
      totalLiabilities += this.num(l.currentAmount, l.originalAmount, l.initialAmount)
      monthlyExpense += this.num(l.monthlyPayment)
    })

    this._netWorth = totalAssets - totalLiabilities
    this._cashFlow = monthlyIncome + passiveIncome - monthlyExpense

    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome + passiveIncome - monthlyExpense) / (monthlyIncome + passiveIncome)) * 100 : 0
    const debtSafety = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0
    const liquidity = totalAssets > 0 ? (cashAssets / totalAssets) * 100 : 0
    const monthlyPassive = passiveIncome
    const freedom = monthlyExpense > 0 ? (monthlyPassive / monthlyExpense) * 100 : 0

    const healthMetrics = [
      this.buildHealthMetric('储蓄率', savingsRate, '%', 30, 10, '月收入中能存下的比例'),
      this.buildHealthMetric('负债安全度', 100 - debtSafety, '%', 50, 30, '负债占资产比例越低越安全'),
      this.buildHealthMetric('资产流动性', liquidity, '%', 20, 10, '现金类资产占比，越高越灵活'),
      this.buildHealthMetric('财务自由度', freedom, '%', 100, 50, '被动收入占支出比例')
    ]

    this.setData({ healthMetrics })
  },

  buildHealthMetric(name, value, unit, greenThreshold, yellowThreshold, desc) {
    const v = Math.max(0, Math.min(100, Math.round(value)))
    let status, color, advice
    if (value >= greenThreshold) {
      status = 'good'; color = '#4caf50'; advice = '状态良好，继续保持'
    } else if (value >= yellowThreshold) {
      status = 'warn'; color = '#ff9800'; advice = '有改善空间，建议关注'
    } else {
      status = 'bad'; color = '#f44336'; advice = '需要改善，建议调整'
    }
    return { name, valueText: v + unit, status, color, advice, desc, ringPercent: v, ringColor: color }
  },

  // ==================== 工具函数 ====================

  num(...candidates) {
    for (let i = 0; i < candidates.length; i++) {
      const n = Number(candidates[i])
      if (Number.isFinite(n) && n !== 0) return n
    }
    return 0
  },

  buildPie(items, total) {
    if (total <= 0 || items.length === 0) return { style: '', legend: [] }
    let acc = 0
    const stops = []
    const legend = []
    items.forEach(item => {
      const pct = (item.value / total) * 100
      stops.push(item.color + ' ' + acc.toFixed(1) + '% ' + (acc + pct).toFixed(1) + '%')
      legend.push({ label: item.label, percent: pct.toFixed(1) + '%', color: item.color, valueText: '¥' + item.value.toLocaleString('zh-CN', { maximumFractionDigits: 0 }) })
      acc += pct
    })
    return { style: 'background:conic-gradient(' + stops.join(',') + ')', legend }
  },

  lastSixMonths() {
    const result = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      result.push({ key: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'), label: (d.getMonth() + 1) + '月' })
    }
    return result
  }
})