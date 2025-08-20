const StorageManager = require('../../utils/storage.js')

Page({
  data: {
    summary: {
      totalAssets: 0,
      totalLiabilities: 0,
      netWorth: 0,
      monthlyIncome: 0,
      monthlyExpenses: 0,
      monthlyCashFlow: 0
    },
    text: {
      totalAssets: '¥0.00',
      totalLiabilities: '¥0.00',
      netWorth: '¥0.00',
      monthlyIncome: '¥0.00',
      monthlyExpenses: '¥0.00',
      monthlyCashFlow: '+¥0.00'
    },
    // 现金流（基础版）文本
    textCashflow: {
      operatingCashFlow: '+¥0.00',
      investingCashFlow: '+¥0.00',
      financingCashFlow: '-¥0.00',
      netCashFlow: '+¥0.00'
    },
    // 财务比率（基础版）文本
    textRatios: {
      currentRatio: '0.00',
      debtToAssetRatio: '0.0%',
      returnOnAssets: '0.0%',
      assetTurnover: '0.00',
      incomeStability: '0.0%'
    },
    // 趋势（基础版）
    trendNetWorth: [],
    trendCashFlow: [],
    breakdown: {
      assets: [],
      liabilities: []
    },
    // 利润表（基础版）文本
    textIncome: {
      workIncome: '¥0.00',
      investmentIncome: '¥0.00',
      operatingIncome: '¥0.00',
      totalIncome: '¥0.00',
      operatingExpenses: '¥0.00',
      financialExpenses: '¥0.00',
      depreciationExpenses: '¥0.00',
      totalExpenses: '¥0.00',
      netIncome: '+¥0.00'
    },
    activeReport: 'overview',
    periodType: 'monthly'
  },

  onLoad() { this.generate() },
  onShow() { this.generate() },

  // 生成极简财务报告（仅预计算字符串，杜绝 NaN 与对象值）
  generate() {
    const assets = (StorageManager.getAssets && StorageManager.getAssets()) || wx.getStorageSync('assets_data') || []
    const liabilities = (StorageManager.getLiabilities && StorageManager.getLiabilities()) || wx.getStorageSync('liabilities_data') || []

    let currentAssetsSum = 0, financialAssetsSum = 0, physicalAssetsSum = 0, workIncomeValue = 0, otherAssetsSum = 0
    let currentLiabilitiesSum = 0, longTermLiabilitiesSum = 0, otherLiabilitiesSum = 0

    let totalAssets = 0
    assets.forEach(a => {
      const v = this.firstNumber(a.currentValue, a.originalValue, a.initialValue, 0)
      switch (a.categoryL1) {
        case 'current_assets': 
          currentAssetsSum += v
          totalAssets += v
          break
        case 'financial_assets': 
          financialAssetsSum += v
          totalAssets += v
          break
        case 'physical_assets': 
          physicalAssetsSum += v
          totalAssets += v
          break
        case 'work_income': 
          workIncomeValue += v
          // 不计入总资产
          break
        default: 
          otherAssetsSum += v
          totalAssets += v
      }
    })

    let totalLiabilities = 0
    liabilities.forEach(l => {
      const amt = this.firstNumber(l.currentAmount, l.originalAmount, l.initialAmount, 0)
      totalLiabilities += amt
      switch (l.categoryL1) {
        case 'current_liabilities': currentLiabilitiesSum += amt; break
        case 'long_term_liabilities': longTermLiabilitiesSum += amt; break
        default: otherLiabilitiesSum += amt
      }
    })

    const netWorth = totalAssets - totalLiabilities

    // 收入拆分（基础版）
    let workIncome = 0, investmentIncome = 0, operatingIncome = 0
    assets.forEach(a => {
      const mi = this.firstNumber(a.actualMonthlyIncome, a.monthlyIncome, 0)
      switch (a.categoryL1) {
        case 'work_income': workIncome += mi; break
        case 'financial_assets': investmentIncome += mi; break
        case 'physical_assets':
          if (a.categoryL2 === 'appreciating_assets') operatingIncome += mi
          break
        default: break
      }
    })
    const totalIncomeNum = workIncome + investmentIncome + operatingIncome

    // 费用拆分（基础版）
    let operatingExpenses = 0
    assets.forEach(a => { operatingExpenses += this.firstNumber(a.monthlyOperatingCost, 0) })

    let financialExpenses = 0
    liabilities.forEach(l => {
      const principal = this.firstNumber(l.currentAmount, l.originalAmount, l.initialAmount, 0)
      const rate = this.firstNumber(l.annualRate, 0)
      const interest = principal * (rate / 100) / 12
      financialExpenses += interest
    })

    let depreciationExpenses = 0
    assets.forEach(a => {
      if (a.categoryL1 === 'physical_assets' && a.categoryL2 === 'consumer_assets') {
        depreciationExpenses += this.computeMonthlyDepreciation(a)
      }
    })
    const totalExpensesNum = operatingExpenses + financialExpenses + depreciationExpenses

    // 总览月收入/支出
    const monthlyIncome = totalIncomeNum
    const monthlyExpenses = totalExpensesNum
    const monthlyCashFlow = monthlyIncome - monthlyExpenses

    // 现金流（基础版）
    // 经营活动现金流：净收入 + 非现金费用（加回折旧）
    const operatingCashFlowNum = monthlyCashFlow + depreciationExpenses
    // 投资活动现金流：金融资产产生的现金收益（这里用 investmentIncome 简化）
    const investingCashFlowNum = investmentIncome
    // 筹资活动现金流：负债月还款总额为现金流出
    let totalMonthlyPayment = 0
    liabilities.forEach(l => { totalMonthlyPayment += this.firstNumber(l.monthlyPayment, 0) })
    const financingCashFlowNum = -totalMonthlyPayment
    const netCashFlowNum = operatingCashFlowNum + investingCashFlowNum + financingCashFlowNum

    // 计算占比（排除工作收入）
    const assetsBreakdownTotal = currentAssetsSum + financialAssetsSum + physicalAssetsSum + otherAssetsSum
    const liabilitiesBreakdownTotal = currentLiabilitiesSum + longTermLiabilitiesSum + otherLiabilitiesSum

    // 财务比率（基础版）
    const currentRatioNum = currentLiabilitiesSum > 0 ? (currentAssetsSum / currentLiabilitiesSum) : 0
    const debtToAssetRatioNum = totalAssets > 0 ? (totalLiabilities / totalAssets) : 0
    const returnOnAssetsNum = totalAssets > 0 ? ((monthlyCashFlow * 12) / totalAssets) : 0
    const assetTurnoverNum = totalAssets > 0 ? ((totalIncomeNum * 12) / totalAssets) : 0
    const incomeStabilityNum = totalIncomeNum > 0 ? (workIncome / totalIncomeNum) : 0

    // 趋势（基础版，模拟近6个月围绕当前值的变化）
    const months = this.lastSixMonthsLabels()
    const netWorthSeries = this.makeTrendSeries(netWorth)
    const cashFlowSeries = this.makeTrendSeries(monthlyCashFlow)
    const trendNetWorth = this.buildTrendViewModel(months, netWorthSeries)
    const trendCashFlow = this.buildTrendViewModel(months, cashFlowSeries)

    // 按周期缩放（仅影响现金流相关数据）
    const scale = this.getPeriodScale(this.data.periodType)
    const periodIncome = monthlyIncome * scale
    const periodExpenses = monthlyExpenses * scale
    const periodCashFlow = monthlyCashFlow * scale
    const periodOperatingCF = (monthlyCashFlow + depreciationExpenses) * scale
    const periodInvestingCF = investmentIncome * scale
    const periodFinancingCF = (-totalMonthlyPayment) * scale
    const periodNetCF = periodOperatingCF + periodInvestingCF + periodFinancingCF
    const periodLabel = this.getPeriodLabel(this.data.periodType)

    this.setData({
      summary: { totalAssets, totalLiabilities, netWorth, monthlyIncome, monthlyExpenses, monthlyCashFlow },
      text: {
        totalAssets: this.signCurrency(totalAssets),
        totalLiabilities: this.signCurrency(totalLiabilities),
        netWorth: this.signCurrency(netWorth),
        monthlyIncome: this.signCurrency(periodIncome),
        monthlyExpenses: this.signCurrency(periodExpenses),
        monthlyCashFlow: (periodCashFlow >= 0 ? '+' : '-') + '¥' + this.absCurrency(periodCashFlow)
      },
      textIncome: {
        workIncome: '¥' + this.absCurrency(workIncome * scale),
        investmentIncome: '¥' + this.absCurrency(investmentIncome * scale),
        operatingIncome: '¥' + this.absCurrency(operatingIncome * scale),
        totalIncome: '¥' + this.absCurrency(totalIncomeNum * scale),
        operatingExpenses: '¥' + this.absCurrency(operatingExpenses * scale),
        financialExpenses: '¥' + this.absCurrency(financialExpenses * scale),
        depreciationExpenses: '¥' + this.absCurrency(depreciationExpenses * scale),
        totalExpenses: '¥' + this.absCurrency(totalExpensesNum * scale),
        netIncome: (periodCashFlow >= 0 ? '+' : '-') + '¥' + this.absCurrency(periodCashFlow)
      },
      textCashflow: {
        operatingCashFlow: (periodOperatingCF >= 0 ? '+' : '-') + '¥' + this.absCurrency(periodOperatingCF),
        investingCashFlow: (periodInvestingCF >= 0 ? '+' : '-') + '¥' + this.absCurrency(periodInvestingCF),
        financingCashFlow: (periodFinancingCF >= 0 ? '+' : '-') + '¥' + this.absCurrency(periodFinancingCF),
        netCashFlow: (periodNetCF >= 0 ? '+' : '-') + '¥' + this.absCurrency(periodNetCF)
      },
      textRatios: {
        currentRatio: this.ratioStr(currentRatioNum, 2),
        debtToAssetRatio: this.percentStr(debtToAssetRatioNum),
        returnOnAssets: this.percentStr(returnOnAssetsNum),
        assetTurnover: this.ratioStr(assetTurnoverNum, 2),
        incomeStability: this.percentStr(incomeStabilityNum)
      },
      breakdown: {
        assets: [
          { name: '流动资产', valueText: '¥' + this.absCurrency(currentAssetsSum), percentageText: this.percentText(currentAssetsSum, assetsBreakdownTotal) },
          { name: '金融资产', valueText: '¥' + this.absCurrency(financialAssetsSum), percentageText: this.percentText(financialAssetsSum, assetsBreakdownTotal) },
          { name: '实物资产', valueText: '¥' + this.absCurrency(physicalAssetsSum), percentageText: this.percentText(physicalAssetsSum, assetsBreakdownTotal) },
          { name: '其他资产', valueText: '¥' + this.absCurrency(otherAssetsSum), percentageText: this.percentText(otherAssetsSum, assetsBreakdownTotal) }
        ].filter(item => parseFloat(item.valueText.replace('¥', '').replace(',', '')) > 0),
        liabilities: [
          { name: '流动负债', valueText: '¥' + this.absCurrency(currentLiabilitiesSum), percentageText: this.percentText(currentLiabilitiesSum, liabilitiesBreakdownTotal) },
          { name: '长期负债', valueText: '¥' + this.absCurrency(longTermLiabilitiesSum), percentageText: this.percentText(longTermLiabilitiesSum, liabilitiesBreakdownTotal) },
          { name: '其他负债', valueText: '¥' + this.absCurrency(otherLiabilitiesSum), percentageText: this.percentText(otherLiabilitiesSum, liabilitiesBreakdownTotal) }
        ]
      },
      trendNetWorth,
      trendCashFlow,
      periodLabel
    })
  },

  // 取第一个有效数字
  firstNumber(...candidates) {
    for (let i = 0; i < candidates.length; i++) {
      const n = Number(candidates[i])
      if (Number.isFinite(n)) return n
    }
    return 0
  },

  // 金额文本
  signCurrency(n) {
    const v = Number(n) || 0
    const sign = v < 0 ? '-' : ''
    return sign + '¥' + this.absCurrency(v)
  },

  absCurrency(n) {
    const v = Math.abs(Number(n) || 0)
    return v.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  },

  // 百分比文本（基于子项与总额）
  percentText(part, total) {
    const p = Number(part)
    const t = Number(total)
    if (!Number.isFinite(p) || !Number.isFinite(t) || t <= 0) return '0.0%'
    return (Math.round((p / t) * 1000) / 10).toFixed(1) + '%'
  },

  // 百分比字符串（基于小数，如 0.253 → 25.3%）
  percentStr(value) {
    const v = Number(value)
    if (!Number.isFinite(v)) return '0.0%'
    return (Math.round(v * 1000) / 10).toFixed(1) + '%'
  },

  // 比率字符串（保留 decimals 位小数）
  ratioStr(value, decimals = 2) {
    const v = Number(value)
    if (!Number.isFinite(v)) return (0).toFixed(decimals)
    return v.toFixed(decimals)
  },

  // 周期缩放因子
  getPeriodScale(type) {
    switch (type) {
      case 'quarterly': return 3
      case 'yearly': return 12
      case 'monthly':
      default: return 1
    }
  },

  // 周期标签
  getPeriodLabel(type) {
    switch (type) {
      case 'quarterly': return '季'
      case 'yearly': return '年'
      case 'monthly':
      default: return '月'
    }
  },



  // 生成最近6个月标签
  lastSixMonthsLabels() {
    const labels = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      labels.push((d.getMonth() + 1) + '月')
    }
    return labels
  },

  // 基于当前值模拟序列（±10%波动）
  makeTrendSeries(currentValue) {
    const base = Number(currentValue) || 0
    const series = []
    for (let i = 0; i < 6; i++) {
      const factor = 0.95 + i * 0.02 // 约 ±5%
      series.push(base * factor)
    }
    return series
  },

  // 将数列转为可视模型（预计算高度、文本、类名）
  buildTrendViewModel(labels, values) {
    const absValues = values.map(v => Math.abs(Number(v) || 0))
    const maxAbs = Math.max(1, ...absValues)
    const maxBar = 200 // rpx
    return labels.map((label, idx) => {
      const v = Number(values[idx]) || 0
      const h = Math.max(10, Math.round((Math.abs(v) / maxAbs) * maxBar)) + 'rpx'
      return {
        month: label,
        valueText: (v >= 0 ? '' : '-') + '¥' + this.absCurrency(v),
        barHeight: h,
        barClass: v >= 0 ? 'positive' : 'negative'
      }
    })
  },

  // 简化月折旧计算（百分比或小数折旧率皆可）
  computeMonthlyDepreciation(asset) {
    const original = this.firstNumber(asset.originalValue, asset.initialValue, 0)
    let rate = this.firstNumber(asset.depreciationRate, 10) // 默认10%
    // 支持 0.1 或 10 两种表达
    rate = rate > 1 ? rate / 100 : rate
    return original * rate / 12
  },

  // 构建折旧明细（简版）
  buildDepreciationList(assets) {
    const list = []
    assets.forEach(a => {
      if (a && a.categoryL1 === 'physical_assets' && a.categoryL2 === 'consumer_assets') {
        const original = this.firstNumber(a.originalValue, a.initialValue, a.currentValue, 0)
        let rate = this.firstNumber(a.depreciationRate, 10)
        rate = rate > 1 ? rate / 100 : rate
        const months = this.computeUsageMonths(a)
        const years = months / 12
        const currentValueNum = original * Math.pow(1 - rate, years)
        const monthlyDep = original * rate / 12
        const totalDep = original - currentValueNum

        list.push({
          name: a.name || '消费性资产',
          originalText: '¥' + this.absCurrency(original),
          currentText: '¥' + this.absCurrency(currentValueNum),
          totalDepreciationText: '¥' + this.absCurrency(totalDep),
          monthlyDepreciationText: '¥' + this.absCurrency(monthlyDep),
          rateText: '年折旧率 ' + (Math.round(rate * 1000) / 10).toFixed(1) + '%',
          usageMonthsText: String(months) + '个月'
        })
      }
    })
    return list
  },

  // 计算使用月数（基于 purchaseDate/createDate/createTime）
  computeUsageMonths(item) {
    let dateStr = ''
    if (item.purchaseDate) dateStr = item.purchaseDate
    else if (item.createDate) dateStr = item.createDate
    else if (item.createTime) dateStr = String(item.createTime).slice(0, 10)
    if (!dateStr) return 0
    const start = new Date(dateStr)
    if (isNaN(start.getTime())) return 0
    const now = new Date()
    const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
    return Math.max(0, months)
  },

  // 导航切换（保留 UI 行为）
  switchReport(e) { this.setData({ activeReport: e.currentTarget.dataset.type }) },
  switchPeriod(e) { this.setData({ periodType: e.currentTarget.dataset.period }); this.generate() }
})


