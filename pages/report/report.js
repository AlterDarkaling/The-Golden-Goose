const StorageManager = require('../../utils/storage.js')

// 检查工具类是否存在，如果不存在则使用简化版本
let AccountingCategories, DepreciationEngine, LoanCalculator
try {
  AccountingCategories = require('../../utils/accountingCategories.js')
} catch (e) {
  console.warn('accountingCategories.js not found, using fallback')
  AccountingCategories = {
    getAssetL1Categories: () => [],
    getLiabilityL1Categories: () => []
  }
}

try {
  DepreciationEngine = require('../../utils/depreciation.js')
} catch (e) {
  console.warn('depreciation.js not found, using fallback')
  DepreciationEngine = {
    calculateCurrentValue: (asset) => asset.currentValue || asset.originalValue || 0,
    calculateMonthlyDepreciation: (asset) => 0,
    getDepreciationRate: () => 0.2
  }
}

try {
  LoanCalculator = require('../../utils/loanCalculator.js')
} catch (e) {
  console.warn('loanCalculator.js not found, using fallback')
  LoanCalculator = {
    calculateEqualPayment: () => ({ monthlyPayment: 0, totalInterest: 0 })
  }
}

Page({
  data: {
    // 基本财务数据
    reportData: {
      totalAssets: 0,
      totalLiabilities: 0,
      netWorth: 0,
      monthlyIncome: 0,
      monthlyExpenses: 0,
      monthlyCashFlow: 0,
      annualizedReturn: 0
    },
    
    // 资产负债表数据 (Balance Sheet)
    balanceSheet: {
      currentAssets: 0,
      financialAssets: 0,
      physicalAssets: 0,
      workIncome: 0,
      otherAssets: 0,
      currentLiabilities: 0,
      longTermLiabilities: 0,
      otherLiabilities: 0
    },
    
    // 利润表数据 (Income Statement)
    incomeStatement: {
      operatingIncome: 0,
      investmentIncome: 0,
      workIncome: 0,
      totalIncome: 0,
      operatingExpenses: 0,
      financialExpenses: 0,
      depreciationExpenses: 0,
      totalExpenses: 0,
      netIncome: 0
    },
    
    // 现金流量表数据 (Cash Flow Statement)
    cashFlowStatement: {
      operatingCashFlow: 0,
      investingCashFlow: 0,
      financingCashFlow: 0,
      netCashFlow: 0
    },
    
    // 详细分析数据
    detailedAnalysis: {
      assetStructure: [],
      liabilityStructure: [],
      incomeStructure: [],
      expenseStructure: [],
      depreciationDetails: [],
      loanDetails: []
    },
    
    // 财务比率分析
    financialRatios: {
      currentRatio: 0,          // 流动比率
      debtToAssetRatio: 0,      // 资产负债率
      returnOnAssets: 0,        // 资产收益率
      assetTurnover: 0,         // 资产周转率
      incomeStability: 0        // 收入稳定性
    },
    
    // 趋势分析
    trendAnalysis: {
      netWorthTrend: [],
      cashFlowTrend: [],
      incomeGrowthRate: 0,
      expenseGrowthRate: 0
    },
    
    // 当前显示的报表类型
    activeReport: 'overview', // overview, balance, income, cashflow, analysis
    
    // 时间段选择
    periodType: 'monthly', // monthly, quarterly, yearly
    
    // 图表数据
    chartData: {
      assetPie: [],
      liabilityPie: [],
      trendLine: []
    }
  },

  onLoad() {
    this.generateComprehensiveReport()
    // 检查是否需要加载演示数据
    setTimeout(() => {
      this.loadDemoData()
    }, 1000)
  },

  onShow() {
    this.generateComprehensiveReport()
  },

  // 生成综合财务报告
  generateComprehensiveReport() {
    const assets = StorageManager.getAssets()
    const liabilities = StorageManager.getLiabilities()
    
    // 生成各类报表
    this.generateBalanceSheet(assets, liabilities)
    this.generateIncomeStatement(assets, liabilities)
    this.generateCashFlowStatement(assets, liabilities)
    this.generateDetailedAnalysis(assets, liabilities)
    this.calculateFinancialRatios()
    this.generateTrendAnalysis()
    this.updateChartData()
  },

  // 生成资产负债表
  generateBalanceSheet(assets, liabilities) {
    // 确保数据存在
    assets = assets || []
    liabilities = liabilities || []
    
    const balanceSheet = {
      currentAssets: 0,
      financialAssets: 0,
      physicalAssets: 0,
      workIncome: 0,
      otherAssets: 0,
      currentLiabilities: 0,
      longTermLiabilities: 0,
      otherLiabilities: 0
    }
    
    // 计算各类资产
    assets.forEach(asset => {
      const currentValue = this.calculateAssetCurrentValue(asset)
      
      switch(asset.categoryL1) {
        case 'current_assets':
          balanceSheet.currentAssets += currentValue
          break
        case 'financial_assets':
          balanceSheet.financialAssets += currentValue
          break
        case 'physical_assets':
          balanceSheet.physicalAssets += currentValue
          break
        case 'work_income':
          balanceSheet.workIncome += currentValue
          break
        case 'other_assets':
          balanceSheet.otherAssets += currentValue
          break
      }
    })
    
    // 计算各类负债
    liabilities.forEach(liability => {
      const currentAmount = this.calculateLiabilityCurrentAmount(liability)
      
      switch(liability.categoryL1) {
        case 'current_liabilities':
          balanceSheet.currentLiabilities += currentAmount
          break
        case 'long_term_liabilities':
          balanceSheet.longTermLiabilities += currentAmount
          break
        case 'other_liabilities':
          balanceSheet.otherLiabilities += currentAmount
          break
      }
    })
    
    // 计算总计
    const totalAssets = Object.values(balanceSheet).slice(0, 5).reduce((sum, value) => sum + value, 0)
    const totalLiabilities = Object.values(balanceSheet).slice(5).reduce((sum, value) => sum + value, 0)
    const netWorth = totalAssets - totalLiabilities
    
    this.setData({
      balanceSheet,
      'reportData.totalAssets': totalAssets,
      'reportData.totalLiabilities': totalLiabilities,
      'reportData.netWorth': netWorth
    })
  },

  // 生成利润表
  generateIncomeStatement(assets, liabilities) {
    const incomeStatement = {
      operatingIncome: 0,      // 经营收入（租金、业务收入等）
      investmentIncome: 0,     // 投资收入（股息、基金收益等）
      workIncome: 0,           // 工作收入
      totalIncome: 0,
      operatingExpenses: 0,    // 经营费用
      financialExpenses: 0,    // 财务费用（利息支出）
      depreciationExpenses: 0, // 折旧费用
      totalExpenses: 0,
      netIncome: 0
    }
    
    // 计算收入
    assets.forEach(asset => {
      const monthlyIncome = asset.actualMonthlyIncome || asset.monthlyIncome || 0
      
      switch(asset.categoryL1) {
        case 'physical_assets':
          if (asset.categoryL2 === 'appreciating_assets') {
            incomeStatement.operatingIncome += monthlyIncome
          }
          break
        case 'financial_assets':
          incomeStatement.investmentIncome += monthlyIncome
          break
        case 'work_income':
          incomeStatement.workIncome += monthlyIncome
          break
      }
    })
    
    // 计算费用
    assets.forEach(asset => {
      // 折旧费用
      if (asset.categoryL1 === 'physical_assets' && asset.categoryL2 === 'consumer_assets') {
        const monthlyDepreciation = DepreciationEngine.calculateMonthlyDepreciation(asset)
        incomeStatement.depreciationExpenses += monthlyDepreciation
      }
      
      // 运营费用
      const monthlyOperatingCost = asset.monthlyOperatingCost || 0
      incomeStatement.operatingExpenses += monthlyOperatingCost
    })
    
    // 财务费用（利息支出）
    liabilities.forEach(liability => {
      const monthlyInterest = this.calculateMonthlyInterest(liability)
      incomeStatement.financialExpenses += monthlyInterest
    })
    
    // 计算总计
    incomeStatement.totalIncome = incomeStatement.operatingIncome + incomeStatement.investmentIncome + incomeStatement.workIncome
    incomeStatement.totalExpenses = incomeStatement.operatingExpenses + incomeStatement.financialExpenses + incomeStatement.depreciationExpenses
    incomeStatement.netIncome = incomeStatement.totalIncome - incomeStatement.totalExpenses
    
    this.setData({
      incomeStatement,
      'reportData.monthlyIncome': incomeStatement.totalIncome,
      'reportData.monthlyExpenses': incomeStatement.totalExpenses,
      'reportData.monthlyCashFlow': incomeStatement.netIncome
    })
  },

  // 生成现金流量表
  generateCashFlowStatement(assets, liabilities) {
    const cashFlowStatement = {
      operatingCashFlow: 0,    // 经营活动现金流
      investingCashFlow: 0,    // 投资活动现金流
      financingCashFlow: 0,    // 筹资活动现金流
      netCashFlow: 0
    }
    
    // 经营活动现金流 = 净收入 + 非现金费用（如折旧）
    cashFlowStatement.operatingCashFlow = this.data.incomeStatement.netIncome
    
    // 投资活动现金流（资产增减）
    assets.forEach(asset => {
      if (asset.categoryL1 === 'financial_assets') {
        // 投资产生的现金流
        const monthlyReturn = asset.actualMonthlyIncome || 0
        cashFlowStatement.investingCashFlow += monthlyReturn
      }
    })
    
    // 筹资活动现金流（负债变化）
    liabilities.forEach(liability => {
      const monthlyPayment = liability.monthlyPayment || 0
      cashFlowStatement.financingCashFlow -= monthlyPayment // 还款是现金流出
    })
    
    cashFlowStatement.netCashFlow = cashFlowStatement.operatingCashFlow + 
                                   cashFlowStatement.investingCashFlow + 
                                   cashFlowStatement.financingCashFlow
    
    this.setData({ cashFlowStatement })
  },

  // 生成详细分析
  generateDetailedAnalysis(assets, liabilities) {
    const detailedAnalysis = {
      assetStructure: this.analyzeAssetStructure(assets),
      liabilityStructure: this.analyzeLiabilityStructure(liabilities),
      incomeStructure: this.analyzeIncomeStructure(assets),
      expenseStructure: this.analyzeExpenseStructure(assets, liabilities),
      depreciationDetails: this.analyzeDepreciation(assets),
      loanDetails: this.analyzeLoanDetails(liabilities)
    }
    
    this.setData({ detailedAnalysis })
  },

  // 计算财务比率
  calculateFinancialRatios() {
    const { totalAssets, totalLiabilities } = this.data.reportData
    const { currentAssets, currentLiabilities } = this.data.balanceSheet
    const { totalIncome, netIncome } = this.data.incomeStatement
    
    const financialRatios = {
      currentRatio: currentLiabilities > 0 ? (currentAssets / currentLiabilities) : 0,
      debtToAssetRatio: totalAssets > 0 ? (totalLiabilities / totalAssets) : 0,
      returnOnAssets: totalAssets > 0 ? (netIncome * 12 / totalAssets) : 0, // 年化
      assetTurnover: totalAssets > 0 ? (totalIncome * 12 / totalAssets) : 0, // 年化
      incomeStability: this.calculateIncomeStability()
    }
    
    this.setData({ financialRatios })
  },

  // 生成趋势分析
  generateTrendAnalysis() {
    // 这里可以从历史数据中计算趋势
    // 目前使用模拟数据，实际应该存储历史数据
    const trendAnalysis = {
      netWorthTrend: this.generateTrendData('netWorth'),
      cashFlowTrend: this.generateTrendData('cashFlow'),
      incomeGrowthRate: 0.05, // 5%增长率（示例）
      expenseGrowthRate: 0.03  // 3%增长率（示例）
    }
    
    this.setData({ trendAnalysis })
  },

  // 计算资产当前价值
  calculateAssetCurrentValue(asset) {
    if (asset.categoryL1 === 'physical_assets' && asset.categoryL2 === 'consumer_assets') {
      // 消费性资产需要计算折旧后的价值
      return DepreciationEngine.calculateCurrentValue(asset)
    }
    
    return asset.currentValue || asset.originalValue || asset.initialValue || 0
  },

  // 计算负债当前余额
  calculateLiabilityCurrentAmount(liability) {
    if (liability.categoryL1 === 'long_term_liabilities') {
      // 长期负债可能需要计算剩余本金
      return this.calculateRemainingPrincipal(liability)
    }
    
    return liability.currentAmount || liability.originalAmount || liability.initialAmount || 0
  },

  // 计算月度利息
  calculateMonthlyInterest(liability) {
    const principal = liability.currentAmount || liability.originalAmount || 0
    const annualRate = liability.annualRate || 0
    return principal * (annualRate / 100) / 12
  },

  // 分析资产结构
  analyzeAssetStructure(assets) {
    const structure = {}
    
    // 定义默认的资产分类（如果工具类不可用）
    const defaultCategories = [
      { key: 'current_assets', label: '流动资产' },
      { key: 'financial_assets', label: '金融资产' },
      { key: 'physical_assets', label: '实物资产' },
      { key: 'work_income', label: '工作收入' },
      { key: 'other_assets', label: '其他资产' }
    ]
    
    let categories = defaultCategories
    try {
      const fetchedCategories = AccountingCategories.getAssetL1Categories()
      if (fetchedCategories && fetchedCategories.length > 0) {
        categories = fetchedCategories
      }
    } catch (e) {
      console.warn('Using default asset categories')
    }
    
    categories.forEach(category => {
      structure[category.key] = {
        name: category.label,
        value: 0,
        count: 0,
        percentage: 0,
        items: []
      }
    })
    
    assets.forEach(asset => {
      if (structure[asset.categoryL1]) {
        const value = this.calculateAssetCurrentValue(asset)
        structure[asset.categoryL1].value += value
        structure[asset.categoryL1].count += 1
        structure[asset.categoryL1].items.push({
          name: asset.name,
          value: value,
          categoryL2: asset.categoryL2
        })
      }
    })
    
    // 计算百分比
    const totalValue = Object.values(structure).reduce((sum, item) => sum + item.value, 0)
    Object.values(structure).forEach(item => {
      item.percentage = totalValue > 0 ? ((item.value / totalValue) * 100) : 0
    })
    
    return Object.values(structure).filter(item => item.count > 0)
  },

  // 分析负债结构
  analyzeLiabilityStructure(liabilities) {
    const structure = {}
    
    // 定义默认的负债分类（如果工具类不可用）
    const defaultCategories = [
      { key: 'current_liabilities', label: '流动负债' },
      { key: 'long_term_liabilities', label: '长期负债' },
      { key: 'other_liabilities', label: '其他负债' }
    ]
    
    let categories = defaultCategories
    try {
      const fetchedCategories = AccountingCategories.getLiabilityL1Categories()
      if (fetchedCategories && fetchedCategories.length > 0) {
        categories = fetchedCategories
      }
    } catch (e) {
      console.warn('Using default liability categories')
    }
    
    categories.forEach(category => {
      structure[category.key] = {
        name: category.label,
        value: 0,
        count: 0,
        percentage: 0,
        items: []
      }
    })
    
    liabilities.forEach(liability => {
      if (structure[liability.categoryL1]) {
        const value = this.calculateLiabilityCurrentAmount(liability)
        structure[liability.categoryL1].value += value
        structure[liability.categoryL1].count += 1
        structure[liability.categoryL1].items.push({
          name: liability.name,
          value: value,
          categoryL2: liability.categoryL2,
          interestRate: liability.annualRate || 0
        })
      }
    })
    
    // 计算百分比
    const totalValue = Object.values(structure).reduce((sum, item) => sum + item.value, 0)
    Object.values(structure).forEach(item => {
      item.percentage = totalValue > 0 ? ((item.value / totalValue) * 100) : 0
    })
    
    return Object.values(structure).filter(item => item.count > 0)
  },

  // 分析收入结构
  analyzeIncomeStructure(assets) {
    const incomeTypes = {
      work: { name: '工作收入', value: 0, percentage: 0 },
      investment: { name: '投资收入', value: 0, percentage: 0 },
      operating: { name: '经营收入', value: 0, percentage: 0 },
      other: { name: '其他收入', value: 0, percentage: 0 }
    }
    
    assets.forEach(asset => {
      const monthlyIncome = asset.actualMonthlyIncome || asset.monthlyIncome || 0
      
      switch(asset.categoryL1) {
        case 'work_income':
          incomeTypes.work.value += monthlyIncome
          break
        case 'financial_assets':
          incomeTypes.investment.value += monthlyIncome
          break
        case 'physical_assets':
          if (asset.categoryL2 === 'appreciating_assets') {
            incomeTypes.operating.value += monthlyIncome
          }
          break
        default:
          incomeTypes.other.value += monthlyIncome
      }
    })
    
    // 计算百分比
    const totalIncome = Object.values(incomeTypes).reduce((sum, item) => sum + item.value, 0)
    Object.values(incomeTypes).forEach(item => {
      item.percentage = totalIncome > 0 ? ((item.value / totalIncome) * 100) : 0
    })
    
    return Object.values(incomeTypes).filter(item => item.value > 0)
  },

  // 分析支出结构
  analyzeExpenseStructure(assets, liabilities) {
    const expenseTypes = {
      operating: { name: '运营费用', value: 0, percentage: 0 },
      financial: { name: '财务费用', value: 0, percentage: 0 },
      depreciation: { name: '折旧费用', value: 0, percentage: 0 },
      other: { name: '其他费用', value: 0, percentage: 0 }
    }
    
    // 运营费用
    assets.forEach(asset => {
      const operatingCost = asset.monthlyOperatingCost || 0
      expenseTypes.operating.value += operatingCost
    })
    
    // 财务费用（利息）
    liabilities.forEach(liability => {
      const monthlyInterest = this.calculateMonthlyInterest(liability)
      expenseTypes.financial.value += monthlyInterest
    })
    
    // 折旧费用
    assets.forEach(asset => {
      if (asset.categoryL1 === 'physical_assets' && asset.categoryL2 === 'consumer_assets') {
        const monthlyDepreciation = DepreciationEngine.calculateMonthlyDepreciation(asset)
        expenseTypes.depreciation.value += monthlyDepreciation
      }
    })
    
    // 计算百分比
    const totalExpenses = Object.values(expenseTypes).reduce((sum, item) => sum + item.value, 0)
    Object.values(expenseTypes).forEach(item => {
      item.percentage = totalExpenses > 0 ? ((item.value / totalExpenses) * 100) : 0
    })
    
    return Object.values(expenseTypes).filter(item => item.value > 0)
  },

  // 分析折旧明细
  analyzeDepreciation(assets) {
    const depreciationDetails = []
    
    assets.forEach(asset => {
      if (asset.categoryL1 === 'physical_assets' && asset.categoryL2 === 'consumer_assets') {
        const currentValue = DepreciationEngine.calculateCurrentValue(asset)
        const monthlyDepreciation = DepreciationEngine.calculateMonthlyDepreciation(asset)
        const totalDepreciation = (asset.originalValue || 0) - currentValue
        
        depreciationDetails.push({
          name: asset.name,
          originalValue: asset.originalValue || 0,
          currentValue: currentValue,
          totalDepreciation: totalDepreciation,
          monthlyDepreciation: monthlyDepreciation,
          depreciationRate: asset.depreciationRate || DepreciationEngine.getDepreciationRate(asset.categoryL2),
          usageMonths: this.calculateUsageMonths(asset)
        })
      }
    })
    
    return depreciationDetails
  },

  // 分析贷款明细
  analyzeLoanDetails(liabilities) {
    const loanDetails = []
    
    liabilities.forEach(liability => {
      if (liability.categoryL1 === 'long_term_liabilities' && liability.annualRate) {
        const remainingPrincipal = this.calculateRemainingPrincipal(liability)
        const monthlyPayment = liability.monthlyPayment || 0
        const totalInterest = this.calculateTotalInterest(liability)
        
        loanDetails.push({
          name: liability.name,
          originalAmount: liability.originalAmount || 0,
          remainingPrincipal: remainingPrincipal,
          monthlyPayment: monthlyPayment,
          annualRate: liability.annualRate,
          totalInterest: totalInterest,
          remainingMonths: this.calculateRemainingMonths(liability)
        })
      }
    })
    
    return loanDetails
  },

  // 辅助计算方法
  calculateUsageMonths(asset) {
    if (!asset.purchaseDate) return 0
    const purchaseDate = new Date(asset.purchaseDate)
    const now = new Date()
    return Math.max(0, Math.floor((now - purchaseDate) / (1000 * 60 * 60 * 24 * 30)))
  },

  calculateRemainingPrincipal(liability) {
    // 简化计算，实际应该根据还款计划计算
    return liability.currentAmount || liability.originalAmount || 0
  },

  calculateTotalInterest(liability) {
    // 简化计算，实际应该根据贷款条件计算
    const principal = liability.originalAmount || 0
    const rate = liability.annualRate || 0
    const months = liability.loanMonths || 12
    return principal * (rate / 100) * (months / 12)
  },

  calculateRemainingMonths(liability) {
    // 简化计算
    return liability.remainingMonths || 0
  },

  calculateIncomeStability() {
    // 简化计算收入稳定性
    const workIncome = this.data.incomeStatement.workIncome
    const totalIncome = this.data.incomeStatement.totalIncome
    return totalIncome > 0 ? (workIncome / totalIncome) : 0
  },

  generateTrendData(type) {
    // 模拟趋势数据，实际应该从历史数据计算
    const months = ['1月', '2月', '3月', '4月', '5月', '6月']
    const currentValue = type === 'netWorth' ? this.data.reportData.netWorth : this.data.reportData.monthlyCashFlow
    
    return months.map((month, index) => ({
      month,
      value: currentValue * (0.9 + index * 0.02) // 模拟增长趋势
    }))
  },

  updateChartData() {
    const { assetStructure, liabilityStructure } = this.data.detailedAnalysis
    
    const chartData = {
      assetPie: assetStructure.map(item => ({
        name: item.name,
        value: item.value,
        percentage: item.percentage
      })),
      liabilityPie: liabilityStructure.map(item => ({
        name: item.name,
        value: item.value,
        percentage: item.percentage
      })),
      trendLine: this.data.trendAnalysis.netWorthTrend
    }
    
    this.setData({ chartData })
  },

  // 切换报表类型
  switchReport(e) {
    const reportType = e.currentTarget.dataset.type
    this.setData({ activeReport: reportType })
  },

  // 切换时间段
  switchPeriod(e) {
    const period = e.currentTarget.dataset.period
    this.setData({ periodType: period })
    this.generateComprehensiveReport() // 重新生成报告
  },

  // 格式化金额
  formatMoney(amount) {
    if (!amount) return '0.00'
    return Math.abs(amount).toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  },

  // 格式化短金额
  formatMoneyShort(amount) {
    if (!amount) return '0'
    if (Math.abs(amount) >= 10000) {
      return (amount / 10000).toFixed(1) + '万'
    }
    return Math.round(amount).toLocaleString('zh-CN')
  },

  // 格式化百分比
  formatPercentage(value) {
    return (value || 0).toFixed(1) + '%'
  },

  // 格式化比率
  formatRatio(value) {
    return (value || 0).toFixed(2)
  },

  // 导出报告
  exportReport() {
    const { reportData, balanceSheet, incomeStatement, cashFlowStatement, financialRatios } = this.data
    
    const reportContent = `
📊 综合财务报告 - ${new Date().toLocaleDateString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 资产负债表 (Balance Sheet)
━━━━━━━━━━━━━━━━━━━━━━━━━━
资产：
• 流动资产：¥${this.formatMoney(balanceSheet.currentAssets)}
• 金融资产：¥${this.formatMoney(balanceSheet.financialAssets)}
• 实物资产：¥${this.formatMoney(balanceSheet.physicalAssets)}
• 工作收入：¥${this.formatMoney(balanceSheet.workIncome)}
• 其他资产：¥${this.formatMoney(balanceSheet.otherAssets)}
总资产：¥${this.formatMoney(reportData.totalAssets)}

负债：
• 流动负债：¥${this.formatMoney(balanceSheet.currentLiabilities)}
• 长期负债：¥${this.formatMoney(balanceSheet.longTermLiabilities)}
• 其他负债：¥${this.formatMoney(balanceSheet.otherLiabilities)}
总负债：¥${this.formatMoney(reportData.totalLiabilities)}

净资产：¥${this.formatMoney(reportData.netWorth)}

━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 利润表 (Income Statement)
━━━━━━━━━━━━━━━━━━━━━━━━━━
收入：
• 经营收入：¥${this.formatMoney(incomeStatement.operatingIncome)}
• 投资收入：¥${this.formatMoney(incomeStatement.investmentIncome)}
• 工作收入：¥${this.formatMoney(incomeStatement.workIncome)}
总收入：¥${this.formatMoney(incomeStatement.totalIncome)}

费用：
• 经营费用：¥${this.formatMoney(incomeStatement.operatingExpenses)}
• 财务费用：¥${this.formatMoney(incomeStatement.financialExpenses)}
• 折旧费用：¥${this.formatMoney(incomeStatement.depreciationExpenses)}
总费用：¥${this.formatMoney(incomeStatement.totalExpenses)}

净收入：¥${this.formatMoney(incomeStatement.netIncome)}

━━━━━━━━━━━━━━━━━━━━━━━━━━
💸 现金流量表 (Cash Flow)
━━━━━━━━━━━━━━━━━━━━━━━━━━
• 经营活动现金流：¥${this.formatMoney(cashFlowStatement.operatingCashFlow)}
• 投资活动现金流：¥${this.formatMoney(cashFlowStatement.investingCashFlow)}
• 筹资活动现金流：¥${this.formatMoney(cashFlowStatement.financingCashFlow)}
净现金流：¥${this.formatMoney(cashFlowStatement.netCashFlow)}

━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 财务比率分析
━━━━━━━━━━━━━━━━━━━━━━━━━━
• 流动比率：${this.formatRatio(financialRatios.currentRatio)}
• 资产负债率：${this.formatPercentage(financialRatios.debtToAssetRatio * 100)}
• 资产收益率：${this.formatPercentage(financialRatios.returnOnAssets * 100)}
• 资产周转率：${this.formatRatio(financialRatios.assetTurnover)}
• 收入稳定性：${this.formatPercentage(financialRatios.incomeStability * 100)}
    `.trim()

    wx.showActionSheet({
      itemList: ['查看详细报告', '分享报告', '保存到相册'],
      success: (res) => {
        switch(res.tapIndex) {
          case 0:
            this.showDetailedReport(reportContent)
            break
          case 1:
            this.shareReport(reportContent)
            break
          case 2:
            this.saveReportToAlbum()
            break
        }
      }
    })
  },

  showDetailedReport(content) {
    wx.showModal({
      title: '详细财务报告',
      content: content,
      showCancel: false,
      confirmText: '知道了'
    })
  },

  shareReport(content) {
    wx.showShareMenu({
      withShareTicket: true
    })
  },

  saveReportToAlbum() {
    wx.showToast({
      title: '保存功能开发中',
      icon: 'none'
    })
  },

  // 加载演示数据（如果没有真实数据）
  loadDemoData() {
    const assets = StorageManager.getAssets() || []
    const liabilities = StorageManager.getLiabilities() || []
    
    if (assets.length === 0 && liabilities.length === 0) {
      wx.showModal({
        title: '提示',
        content: '当前没有数据，是否加载演示数据查看报告效果？',
        success: (res) => {
          if (res.confirm) {
            this.createDemoData()
          }
        }
      })
    }
  },

  // 创建演示数据
  createDemoData() {
    const demoAssets = [
      {
        id: 'demo_asset_1',
        name: '现金储蓄',
        categoryL1: 'current_assets',
        categoryL2: 'cash_assets',
        originalValue: 50000,
        currentValue: 50000,
        monthlyIncome: 0,
        monthlyOperatingCost: 0,
        createTime: new Date().toISOString()
      },
      {
        id: 'demo_asset_2',
        name: '股票投资组合',
        categoryL1: 'financial_assets',
        categoryL2: 'equity_fund',
        originalValue: 80000,
        currentValue: 85000,
        monthlyIncome: 800,
        monthlyOperatingCost: 50,
        createTime: new Date().toISOString()
      },
      {
        id: 'demo_asset_3',
        name: 'iPhone手机',
        categoryL1: 'physical_assets',
        categoryL2: 'consumer_assets',
        originalValue: 8000,
        currentValue: 5000,
        monthlyOperatingCost: 200,
        purchaseDate: '2023-01-01',
        createTime: new Date().toISOString()
      },
      {
        id: 'demo_asset_4',
        name: '软件工程师',
        categoryL1: 'work_income',
        categoryL2: 'main_job',
        monthlyIncome: 15000,
        workUnit: '科技公司',
        position: '高级工程师',
        createTime: new Date().toISOString()
      }
    ]

    const demoLiabilities = [
      {
        id: 'demo_liability_1',
        name: '信用卡账单',
        categoryL1: 'current_liabilities',
        categoryL2: 'credit_card_debt',
        originalAmount: 5000,
        currentAmount: 3000,
        annualRate: 18,
        monthlyPayment: 500,
        createTime: new Date().toISOString()
      },
      {
        id: 'demo_liability_2',
        name: '房贷',
        categoryL1: 'long_term_liabilities',
        categoryL2: 'mortgage_loan',
        originalAmount: 800000,
        currentAmount: 750000,
        annualRate: 4.9,
        monthlyPayment: 4200,
        loanMonths: 300,
        createTime: new Date().toISOString()
      }
    ]

    // 保存演示数据
    StorageManager.saveAssets ? StorageManager.saveAssets(demoAssets) : wx.setStorageSync('assets_data', demoAssets)
    StorageManager.saveLiabilities ? StorageManager.saveLiabilities(demoLiabilities) : wx.setStorageSync('liabilities_data', demoLiabilities)

    wx.showToast({
      title: '演示数据已加载',
      icon: 'success'
    })

    // 重新生成报告
    setTimeout(() => {
      this.generateComprehensiveReport()
    }, 500)
  },

  // 智能分析和建议
  showSmartAnalysis() {
    const { reportData, financialRatios, incomeStatement } = this.data
    let analysis = '🤖 AI智能财务分析\n\n'
    
    // 净资产分析
    if (reportData.netWorth > 0) {
      analysis += '✅ 净资产为正，财务基础良好\n'
      if (reportData.netWorth > 100000) {
        analysis += '💎 净资产已超过10万，财务实力较强\n'
      }
    } else {
      analysis += '⚠️ 净资产为负，需要优化资产配置\n'
      analysis += '💡 建议：增加收入资产，降低消费性负债\n'
    }
    
    // 现金流分析
    if (incomeStatement.netIncome > 0) {
      analysis += `✅ 月净现金流为正（¥${this.formatMoney(incomeStatement.netIncome)}），财务循环健康\n`
    } else {
      analysis += `⚠️ 月净现金流为负（¥${this.formatMoney(Math.abs(incomeStatement.netIncome))}），需要控制支出\n`
    }
    
    // 财务比率分析
    if (financialRatios.debtToAssetRatio > 0.7) {
      analysis += '⚠️ 资产负债率偏高，建议降低负债\n'
    } else if (financialRatios.debtToAssetRatio < 0.3) {
      analysis += '✅ 资产负债率健康，可适度增加杠杆\n'
    }
    
    if (financialRatios.returnOnAssets > 0.1) {
      analysis += '✅ 资产收益率良好，投资效率较高\n'
    } else if (financialRatios.returnOnAssets < 0.05) {
      analysis += '💡 资产收益率偏低，建议优化投资配置\n'
    }
    
    // 收入结构分析
    if (financialRatios.incomeStability < 0.6) {
      analysis += '💡 被动收入比例偏低，建议增加投资性收入\n'
    } else {
      analysis += '✅ 收入结构合理，被动收入占比较高\n'
    }
    
    wx.showModal({
      title: 'AI智能分析',
      content: analysis,
      showCancel: false,
      confirmText: '了解了'
    })
  }
})