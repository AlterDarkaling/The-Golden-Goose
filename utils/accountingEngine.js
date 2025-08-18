/**
 * 传统会计准则计算引擎
 * 实现资产计量、负债计量、净资产计算、现金流分析
 */

const AccountingCategories = require('./accountingCategories.js')

class AccountingEngine {
  
  /**
   * 资产计量规则
   */
  static calculateAssetValue(asset) {
    const { categoryL1, categoryL2, categoryL3 } = asset
    
    // 1. 流动资产 - 按实际金额计量
    if (categoryL1 === 'current_assets') {
      return this.calculateCurrentAssets(asset)
    }
    
    // 2. 金融资产 - 按市值重估
    if (categoryL1 === 'financial_assets') {
      return this.calculateFinancialAssets(asset)
    }
    
    // 3. 实物资产
    if (categoryL1 === 'physical_assets') {
      if (categoryL2 === 'consumer_assets') {
        // 消费型资产 - 按月计提折旧
        return this.calculateDepreciatingAssets(asset)
      } else if (categoryL2 === 'appreciating_assets') {
        // 增值型资产 - 按市场估值
        return this.calculateAppreciatingAssets(asset)
      }
    }
    
    // 4. 其他资产
    if (categoryL1 === 'other_assets') {
      if (categoryL2 === 'intangible_assets') {
        // 无形资产 - 按有效期摊销
        return this.calculateIntangibleAssets(asset)
      } else if (categoryL2 === 'prepaid_assets') {
        // 预付资产 - 按时间比例摊销
        return this.calculatePrepaidAssets(asset)
      }
    }
    
    // 默认按原值计量
    return {
      originalValue: asset.originalValue || 0,
      currentValue: asset.currentValue || asset.originalValue || 0,
      bookValue: asset.currentValue || asset.originalValue || 0,
      accumulatedDepreciation: 0,
      monthlyDepreciation: 0,
      calculationMethod: 'original_cost'
    }
  }

  /**
   * 流动资产计量
   */
  static calculateCurrentAssets(asset) {
    const currentValue = asset.currentValue || asset.originalValue || 0
    let monthlyInterest = 0
    
    // 短期理财资产计算应计利息
    if (asset.categoryL2 === 'short_term_investment') {
      const annualRate = asset.annualRate || 0
      const principal = asset.originalValue || 0
      const purchaseDate = new Date(asset.purchaseDate || asset.createDate)
      const now = new Date()
      const daysDiff = Math.floor((now - purchaseDate) / (1000 * 60 * 60 * 24))
      
      // 每日应计利息 = 票面金额 × 年利率 ÷ 365
      const dailyInterest = principal * annualRate / 365
      const accruedInterest = dailyInterest * daysDiff
      monthlyInterest = dailyInterest * 30
      
      return {
        originalValue: principal,
        currentValue: principal + accruedInterest,
        bookValue: principal + accruedInterest,
        accumulatedInterest: accruedInterest,
        monthlyInterest,
        calculationMethod: 'accrued_interest'
      }
    }
    
    return {
      originalValue: currentValue,
      currentValue,
      bookValue: currentValue,
      accumulatedDepreciation: 0,
      monthlyDepreciation: 0,
      calculationMethod: 'actual_amount'
    }
  }

  /**
   * 金融资产计量
   */
  static calculateFinancialAssets(asset) {
    const originalValue = asset.originalValue || 0
    const currentValue = asset.currentValue || originalValue
    const quantity = asset.quantity || 1
    const costPrice = asset.costPrice || (originalValue / quantity)
    const currentPrice = asset.currentPrice || (currentValue / quantity)
    
    // 计算浮动盈亏
    const unrealizedGainLoss = (currentPrice - costPrice) * quantity
    const totalMarketValue = currentPrice * quantity
    
    return {
      originalValue,
      currentValue: totalMarketValue,
      bookValue: totalMarketValue,
      quantity,
      costPrice,
      currentPrice,
      unrealizedGainLoss,
      gainLossRatio: originalValue > 0 ? (unrealizedGainLoss / originalValue) * 100 : 0,
      calculationMethod: 'market_value'
    }
  }

  /**
   * 消费型资产折旧计量
   */
  static calculateDepreciatingAssets(asset) {
    const originalValue = asset.originalValue || 0
    const purchaseDate = new Date(asset.purchaseDate || asset.createDate)
    const now = new Date()
    
    // 计算使用月数
    const monthsUsed = Math.max(0, Math.floor((now - purchaseDate) / (1000 * 60 * 60 * 24 * 30)))
    
    // 获取折旧率
    const depreciationInfo = AccountingCategories.getDepreciationRate(asset.categoryL2, asset.categoryL3)
    const annualRate = asset.customDepreciationRate || depreciationInfo?.rate || 0.15
    
    // 月折旧额 = 原值 × 年折旧率 ÷ 12
    const monthlyDepreciation = originalValue * annualRate / 12
    
    // 累计折旧 = 月折旧额 × 已持有月数
    const accumulatedDepreciation = Math.min(monthlyDepreciation * monthsUsed, originalValue * 0.95) // 最多折旧95%
    
    // 资产净值 = 原值 - 累计折旧
    const bookValue = Math.max(originalValue - accumulatedDepreciation, originalValue * 0.05) // 最少保留5%残值
    
    return {
      originalValue,
      currentValue: asset.currentValue || bookValue, // 允许用户手动更新市场价值
      bookValue,
      accumulatedDepreciation,
      monthlyDepreciation,
      monthsUsed,
      annualDepreciationRate: annualRate,
      depreciationRatio: (accumulatedDepreciation / originalValue) * 100,
      calculationMethod: 'depreciation'
    }
  }

  /**
   * 增值型资产计量
   */
  static calculateAppreciatingAssets(asset) {
    const originalValue = asset.originalValue || 0
    const currentValue = asset.currentValue || originalValue
    const maintenanceCost = asset.maintenanceCost || 0
    
    // 计算增值/减值
    const valueChange = currentValue - originalValue
    const valueChangeRatio = originalValue > 0 ? (valueChange / originalValue) * 100 : 0
    
    return {
      originalValue,
      currentValue,
      bookValue: currentValue,
      valueChange,
      valueChangeRatio,
      maintenanceCost,
      netValue: currentValue - maintenanceCost,
      calculationMethod: 'market_revaluation'
    }
  }

  /**
   * 无形资产摊销计量
   */
  static calculateIntangibleAssets(asset) {
    const originalValue = asset.originalValue || 0
    const usefulLife = asset.usefulLife || 10 // 默认10年有效期
    const purchaseDate = new Date(asset.purchaseDate || asset.createDate)
    const now = new Date()
    
    // 计算使用月数
    const monthsUsed = Math.max(0, Math.floor((now - purchaseDate) / (1000 * 60 * 60 * 24 * 30)))
    const totalMonths = usefulLife * 12
    
    // 月摊销额 = 原值 ÷ 有效期月数
    const monthlyAmortization = originalValue / totalMonths
    
    // 累计摊销 = 月摊销额 × 已使用月数
    const accumulatedAmortization = Math.min(monthlyAmortization * monthsUsed, originalValue)
    
    // 资产净值 = 原值 - 累计摊销
    const bookValue = Math.max(originalValue - accumulatedAmortization, 0)
    
    return {
      originalValue,
      currentValue: bookValue,
      bookValue,
      accumulatedAmortization,
      monthlyAmortization,
      monthsUsed,
      totalMonths,
      remainingMonths: Math.max(0, totalMonths - monthsUsed),
      usefulLife,
      calculationMethod: 'amortization'
    }
  }

  /**
   * 预付资产摊销计量
   */
  static calculatePrepaidAssets(asset) {
    const originalValue = asset.originalValue || 0
    const serviceStartDate = new Date(asset.serviceStartDate || asset.createDate)
    const serviceEndDate = new Date(asset.serviceEndDate || serviceStartDate)
    const now = new Date()
    
    // 计算服务总月数
    const totalMonths = Math.max(1, Math.floor((serviceEndDate - serviceStartDate) / (1000 * 60 * 60 * 24 * 30)))
    
    // 计算已消耗月数
    const consumedMonths = Math.max(0, Math.floor((now - serviceStartDate) / (1000 * 60 * 60 * 24 * 30)))
    
    // 月摊销额 = 原值 ÷ 服务总月数
    const monthlyAmortization = originalValue / totalMonths
    
    // 累计摊销 = 月摊销额 × 已消耗月数
    const accumulatedAmortization = Math.min(monthlyAmortization * consumedMonths, originalValue)
    
    // 剩余价值 = 原值 - 累计摊销
    const bookValue = Math.max(originalValue - accumulatedAmortization, 0)
    
    return {
      originalValue,
      currentValue: bookValue,
      bookValue,
      accumulatedAmortization,
      monthlyAmortization,
      consumedMonths,
      totalMonths,
      remainingMonths: Math.max(0, totalMonths - consumedMonths),
      serviceStartDate: serviceStartDate.toISOString().split('T')[0],
      serviceEndDate: serviceEndDate.toISOString().split('T')[0],
      calculationMethod: 'prepaid_amortization'
    }
  }

  /**
   * 负债计量规则
   */
  static calculateLiabilityValue(liability) {
    const { categoryL1, categoryL2 } = liability
    const originalAmount = liability.originalAmount || liability.initialAmount || 0
    const currentAmount = liability.currentAmount || originalAmount
    
    // 计算利息
    if (liability.annualRate && liability.annualRate > 0) {
      return this.calculateInterestBearingLiability(liability)
    }
    
    // 无息负债按实际金额计量
    return {
      originalAmount,
      currentAmount,
      remainingPrincipal: currentAmount,
      totalInterest: 0,
      monthlyInterest: 0,
      monthlyPayment: liability.monthlyPayment || 0,
      calculationMethod: 'actual_amount'
    }
  }

  /**
   * 计息负债计量
   */
  static calculateInterestBearingLiability(liability) {
    const principal = liability.originalAmount || liability.initialAmount || 0
    const currentPrincipal = liability.currentAmount || principal
    const annualRate = liability.annualRate || 0
    const months = liability.months || 12
    const loanDate = new Date(liability.loanDate || liability.createDate)
    const now = new Date()
    
    // 计算已还月数
    const monthsPaid = Math.max(0, Math.floor((now - loanDate) / (1000 * 60 * 60 * 24 * 30)))
    
    // 等额本息还款计算
    if (liability.paymentType === 'equal_payment' || !liability.paymentType) {
      const monthlyRate = annualRate / 12
      
      if (monthlyRate === 0) {
        // 无息贷款
        const monthlyPayment = principal / months
        const remainingPrincipal = Math.max(0, principal - monthlyPayment * monthsPaid)
        
        return {
          originalAmount: principal,
          currentAmount: remainingPrincipal,
          remainingPrincipal,
          totalInterest: 0,
          monthlyInterest: 0,
          monthlyPayment,
          monthsPaid,
          remainingMonths: Math.max(0, months - monthsPaid),
          calculationMethod: 'interest_free'
        }
      }
      
      // 月供计算公式
      const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
      
      // 剩余本金计算
      let remainingPrincipal = principal
      let totalPaidInterest = 0
      
      for (let i = 1; i <= monthsPaid && i <= months; i++) {
        const monthlyInterest = remainingPrincipal * monthlyRate
        const principalPayment = monthlyPayment - monthlyInterest
        remainingPrincipal -= principalPayment
        totalPaidInterest += monthlyInterest
      }
      
      remainingPrincipal = Math.max(0, remainingPrincipal)
      const currentMonthlyInterest = remainingPrincipal * monthlyRate
      const totalInterest = monthlyPayment * months - principal
      
      return {
        originalAmount: principal,
        currentAmount: remainingPrincipal,
        remainingPrincipal,
        totalInterest,
        totalPaidInterest,
        monthlyInterest: currentMonthlyInterest,
        monthlyPayment,
        monthsPaid,
        remainingMonths: Math.max(0, months - monthsPaid),
        calculationMethod: 'equal_payment'
      }
    }
    
    // 等额本金还款计算
    if (liability.paymentType === 'equal_principal') {
      const monthlyPrincipal = principal / months
      const remainingPrincipal = Math.max(0, principal - monthlyPrincipal * monthsPaid)
      const currentMonthlyInterest = remainingPrincipal * (annualRate / 12)
      const currentMonthlyPayment = monthlyPrincipal + currentMonthlyInterest
      
      // 计算总利息
      let totalInterest = 0
      for (let i = 1; i <= months; i++) {
        const monthlyInterest = (principal - monthlyPrincipal * (i - 1)) * (annualRate / 12)
        totalInterest += monthlyInterest
      }
      
      return {
        originalAmount: principal,
        currentAmount: remainingPrincipal,
        remainingPrincipal,
        totalInterest,
        monthlyInterest: currentMonthlyInterest,
        monthlyPayment: currentMonthlyPayment,
        monthlyPrincipal,
        monthsPaid,
        remainingMonths: Math.max(0, months - monthsPaid),
        calculationMethod: 'equal_principal'
      }
    }
    
    // 默认按实际金额计量
    return {
      originalAmount: principal,
      currentAmount: currentPrincipal,
      remainingPrincipal: currentPrincipal,
      totalInterest: 0,
      monthlyInterest: currentPrincipal * (annualRate / 12),
      monthlyPayment: liability.monthlyPayment || 0,
      calculationMethod: 'simple_interest'
    }
  }

  /**
   * 计算净资产
   */
  static calculateNetWorth(assets, liabilities) {
    // 计算总资产净值
    let totalAssets = 0
    const assetBreakdown = {
      currentAssets: 0,
      financialAssets: 0,
      physicalAssets: 0,
      otherAssets: 0
    }
    
    assets.forEach(asset => {
      const assetValue = this.calculateAssetValue(asset)
      const bookValue = assetValue.bookValue || assetValue.currentValue || 0
      
      totalAssets += bookValue
      
      // 按大类统计
      if (asset.categoryL1 === 'current_assets') {
        assetBreakdown.currentAssets += bookValue
      } else if (asset.categoryL1 === 'financial_assets') {
        assetBreakdown.financialAssets += bookValue
      } else if (asset.categoryL1 === 'physical_assets') {
        assetBreakdown.physicalAssets += bookValue
      } else if (asset.categoryL1 === 'other_assets') {
        assetBreakdown.otherAssets += bookValue
      }
    })
    
    // 计算总负债剩余本金
    let totalLiabilities = 0
    const liabilityBreakdown = {
      currentLiabilities: 0,
      longTermLiabilities: 0,
      otherLiabilities: 0
    }
    
    liabilities.forEach(liability => {
      const liabilityValue = this.calculateLiabilityValue(liability)
      const remainingAmount = liabilityValue.remainingPrincipal || liabilityValue.currentAmount || 0
      
      totalLiabilities += remainingAmount
      
      // 按大类统计
      if (liability.categoryL1 === 'current_liabilities') {
        liabilityBreakdown.currentLiabilities += remainingAmount
      } else if (liability.categoryL1 === 'long_term_liabilities') {
        liabilityBreakdown.longTermLiabilities += remainingAmount
      } else if (liability.categoryL1 === 'other_liabilities') {
        liabilityBreakdown.otherLiabilities += remainingAmount
      }
    })
    
    // 净资产 = 总资产净值 - 总负债剩余本金
    const netWorth = totalAssets - totalLiabilities
    
    return {
      totalAssets: Math.round(totalAssets * 100) / 100,
      totalLiabilities: Math.round(totalLiabilities * 100) / 100,
      netWorth: Math.round(netWorth * 100) / 100,
      assetBreakdown,
      liabilityBreakdown,
      assetLiabilityRatio: totalAssets > 0 ? Math.round((totalLiabilities / totalAssets) * 10000) / 100 : 0
    }
  }

  /**
   * 计算月度净现金流
   */
  static calculateMonthlyCashFlow(assets, liabilities, monthlyIncome = 0, monthlyExpense = 0) {
    let monthlyAssetIncome = 0 // 资产产生的月收入
    let monthlyAssetExpense = 0 // 资产相关的月支出（如维护费）
    let monthlyDepreciationAmortization = 0 // 月折旧摊销
    
    // 计算资产相关现金流
    assets.forEach(asset => {
      const assetValue = this.calculateAssetValue(asset)
      
      // 资产收入（如租金、股息、利息）
      monthlyAssetIncome += asset.monthlyIncome || 0
      
      // 资产支出（如维护费、管理费）
      monthlyAssetExpense += asset.monthlyExpense || asset.maintenanceCost || 0
      
      // 折旧摊销（计入费用但不影响现金流）
      monthlyDepreciationAmortization += assetValue.monthlyDepreciation || assetValue.monthlyAmortization || 0
    })
    
    let monthlyLiabilityPayment = 0 // 负债月供
    let monthlyInterestExpense = 0 // 月利息支出
    
    // 计算负债相关现金流
    liabilities.forEach(liability => {
      const liabilityValue = this.calculateLiabilityValue(liability)
      
      // 月供（包含本金+利息）
      monthlyLiabilityPayment += liabilityValue.monthlyPayment || liability.monthlyPayment || 0
      
      // 月利息支出
      monthlyInterestExpense += liabilityValue.monthlyInterest || 0
    })
    
    // 月度净现金流 = 月收入 - (月支出 + 贷款月供 + 资产折旧摊销)
    const totalMonthlyIncome = monthlyIncome + monthlyAssetIncome
    const totalMonthlyExpense = monthlyExpense + monthlyAssetExpense + monthlyLiabilityPayment
    const netMonthlyCashFlow = totalMonthlyIncome - totalMonthlyExpense
    
    return {
      totalMonthlyIncome: Math.round(totalMonthlyIncome * 100) / 100,
      totalMonthlyExpense: Math.round(totalMonthlyExpense * 100) / 100,
      netMonthlyCashFlow: Math.round(netMonthlyCashFlow * 100) / 100,
      breakdown: {
        salaryIncome: Math.round(monthlyIncome * 100) / 100,
        assetIncome: Math.round(monthlyAssetIncome * 100) / 100,
        livingExpense: Math.round(monthlyExpense * 100) / 100,
        assetExpense: Math.round(monthlyAssetExpense * 100) / 100,
        liabilityPayment: Math.round(monthlyLiabilityPayment * 100) / 100,
        interestExpense: Math.round(monthlyInterestExpense * 100) / 100,
        depreciationAmortization: Math.round(monthlyDepreciationAmortization * 100) / 100
      },
      cashFlowStatus: this.getCashFlowStatus(netMonthlyCashFlow)
    }
  }

  /**
   * 获取现金流状态
   */
  static getCashFlowStatus(netCashFlow) {
    if (netCashFlow > 1000) {
      return { level: 'excellent', text: '优秀', color: '#28a745', icon: '🔥' }
    } else if (netCashFlow > 0) {
      return { level: 'good', text: '健康', color: '#17a2b8', icon: '✅' }
    } else if (netCashFlow > -500) {
      return { level: 'warning', text: '紧张', color: '#ffc107', icon: '⚠️' }
    } else {
      return { level: 'danger', text: '危险', color: '#dc3545', icon: '🚨' }
    }
  }

  /**
   * 特殊场景处理：贷款购买资产
   */
  static createLoanPurchase(purchaseData) {
    const { assetInfo, loanInfo } = purchaseData
    
    // 资产按原值记录
    const asset = {
      ...assetInfo,
      originalValue: assetInfo.purchasePrice,
      currentValue: assetInfo.purchasePrice,
      purchaseMethod: 'loan',
      relatedLoanId: loanInfo.id
    }
    
    // 负债记录贷款信息
    const liability = {
      ...loanInfo,
      originalAmount: loanInfo.principal,
      currentAmount: loanInfo.principal,
      relatedAssetId: assetInfo.id
    }
    
    return { asset, liability }
  }

  /**
   * 特殊场景处理：资产处置
   */
  static processAssetDisposal(asset, salePrice) {
    const assetValue = this.calculateAssetValue(asset)
    const bookValue = assetValue.bookValue || assetValue.currentValue || 0
    
    // 处置损益 = 售价 - 资产净值
    const disposalGainLoss = salePrice - bookValue
    
    return {
      salePrice: Math.round(salePrice * 100) / 100,
      bookValue: Math.round(bookValue * 100) / 100,
      disposalGainLoss: Math.round(disposalGainLoss * 100) / 100,
      isGain: disposalGainLoss > 0,
      gainLossRatio: bookValue > 0 ? Math.round((disposalGainLoss / bookValue) * 10000) / 100 : 0
    }
  }

  /**
   * 风险预警分析
   */
  static analyzeFinancialRisks(netWorthData, cashFlowData) {
    const warnings = []
    
    // 现金流预警
    if (cashFlowData.netMonthlyCashFlow < 0) {
      warnings.push({
        level: 'urgent',
        type: 'cash_flow',
        title: '现金流预警',
        message: `当前月现金流为负${Math.abs(cashFlowData.netMonthlyCashFlow)}元，建议立即调整支出结构`,
        icon: '🚨',
        priority: 1
      })
    }
    
    // 负债比例预警
    if (netWorthData.assetLiabilityRatio > 50) {
      warnings.push({
        level: 'warning',
        type: 'debt_ratio',
        title: '负债比例过高',
        message: `负债占资产${netWorthData.assetLiabilityRatio}%，建议降低至30%以下`,
        icon: '⚠️',
        priority: 2
      })
    }
    
    // 资产结构预警
    const consumerAssetRatio = (netWorthData.assetBreakdown.physicalAssets / netWorthData.totalAssets) * 100
    if (consumerAssetRatio > 30) {
      warnings.push({
        level: 'info',
        type: 'asset_structure',
        title: '消费型资产占比过高',
        message: `消费型资产占比${Math.round(consumerAssetRatio)}%，建议控制在30%以下`,
        icon: '💡',
        priority: 3
      })
    }
    
    return warnings.sort((a, b) => a.priority - b.priority)
  }
}

module.exports = AccountingEngine
