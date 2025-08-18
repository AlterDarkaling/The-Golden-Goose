/**
 * 财务数据存储管理器
 * 基于传统会计准则，整合折旧计算和贷款管理
 */

const DepreciationEngine = require('./depreciation.js')
const LoanCalculator = require('./loanCalculator.js')

class FinancialStorage {
  
  static keys = {
    user: 'user_info',
    assets: 'financial_assets',
    liabilities: 'financial_liabilities', 
    loans: 'loan_records',
    settings: 'financial_settings'
  }

  // ==================== 用户管理 ====================
  
  static saveUser(userInfo) {
    try {
      wx.setStorageSync(this.keys.user, {
        ...userInfo,
        lastUpdateTime: new Date().toISOString()
      })
      return true
    } catch (e) {
      console.error('保存用户信息失败:', e)
      return false
    }
  }

  static getUser() {
    try {
      return wx.getStorageSync(this.keys.user) || null
    } catch (e) {
      console.error('获取用户信息失败:', e)
      return null
    }
  }

  // ==================== 资产管理 ====================

  /**
   * 保存资产（自动计算折旧）
   */
  static saveAsset(assetData) {
    try {
      const assets = this.getAssets()
      
      // 处理消费性资产的折旧计算
      if (assetData.categoryL1 === 'consumer_asset') {
        const depreciationData = DepreciationEngine.calculateCurrentValue(
          assetData.initialValue,
          assetData.createDate || assetData.purchaseDate,
          assetData.customDepreciationRate,
          assetData.categoryL2
        )
        
        assetData = {
          ...assetData,
          ...depreciationData,
          isDepreciable: true,
          lastDepreciationUpdate: new Date().toISOString()
        }
      }

      // 新增或更新
      const existingIndex = assets.findIndex(a => a.id === assetData.id)
      if (existingIndex >= 0) {
        assets[existingIndex] = { ...assets[existingIndex], ...assetData }
      } else {
        assets.push({
          ...assetData,
          createTime: new Date().toISOString()
        })
      }

      wx.setStorageSync(this.keys.assets, assets)
      return true
    } catch (e) {
      console.error('保存资产失败:', e)
      return false
    }
  }

  /**
   * 获取所有资产（自动更新折旧）
   */
  static getAssets() {
    try {
      const assets = wx.getStorageSync(this.keys.assets) || []
      
      // 批量更新折旧
      const updatedAssets = DepreciationEngine.batchUpdateDepreciation(assets)
      
      // 如果有更新，保存回存储
      if (JSON.stringify(assets) !== JSON.stringify(updatedAssets)) {
        wx.setStorageSync(this.keys.assets, updatedAssets)
      }
      
      return updatedAssets
    } catch (e) {
      console.error('获取资产失败:', e)
      return []
    }
  }

  /**
   * 删除资产
   */
  static deleteAsset(assetId) {
    try {
      const assets = this.getAssets()
      const filteredAssets = assets.filter(a => a.id !== assetId)
      wx.setStorageSync(this.keys.assets, filteredAssets)
      return true
    } catch (e) {
      console.error('删除资产失败:', e)
      return false
    }
  }

  // ==================== 负债管理 ====================

  /**
   * 保存负债
   */
  static saveLiability(liabilityData) {
    try {
      const liabilities = this.getLiabilities()
      
      // 新增或更新
      const existingIndex = liabilities.findIndex(l => l.id === liabilityData.id)
      if (existingIndex >= 0) {
        liabilities[existingIndex] = { ...liabilities[existingIndex], ...liabilityData }
      } else {
        liabilities.push({
          ...liabilityData,
          createTime: new Date().toISOString()
        })
      }

      wx.setStorageSync(this.keys.liabilities, liabilities)
      return true
    } catch (e) {
      console.error('保存负债失败:', e)
      return false
    }
  }

  /**
   * 获取所有负债
   */
  static getLiabilities() {
    try {
      return wx.getStorageSync(this.keys.liabilities) || []
    } catch (e) {
      console.error('获取负债失败:', e)
      return []
    }
  }

  /**
   * 删除负债
   */
  static deleteLiability(liabilityId) {
    try {
      const liabilities = this.getLiabilities()
      const filteredLiabilities = liabilities.filter(l => l.id !== liabilityId)
      wx.setStorageSync(this.keys.liabilities, filteredLiabilities)
      return true
    } catch (e) {
      console.error('删除负债失败:', e)
      return false
    }
  }

  // ==================== 贷款管理 ====================

  /**
   * 创建贷款记录（资产负债分离）
   */
  static createLoanPurchase(purchaseData) {
    try {
      const { assetInfo, loanInfo } = purchaseData
      
      // 1. 保存资产（按原值记录）
      const assetResult = this.saveAsset({
        ...assetInfo,
        purchaseMethod: 'loan',
        relatedLoanId: loanInfo.id
      })

      // 2. 保存贷款负债
      const loanCalculation = LoanCalculator.calculateEqualPayment(
        loanInfo.principal,
        loanInfo.annualRate,
        loanInfo.months
      )

      const liabilityResult = this.saveLiability({
        ...loanInfo,
        type: 'loan',
        categoryL1: 'loan_debt',
        categoryL2: 'purchase_loan',
        initialAmount: loanInfo.principal,
        currentAmount: loanInfo.principal,
        monthlyPayment: loanCalculation.monthlyPayment,
        totalInterest: loanCalculation.totalInterest,
        totalAmount: loanCalculation.totalAmount,
        loanSchedule: loanCalculation.schedule,
        relatedAssetId: assetInfo.id,
        startDate: new Date().toISOString().split('T')[0]
      })

      // 3. 保存贷款详细记录
      this.saveLoanRecord({
        id: loanInfo.id,
        assetId: assetInfo.id,
        liabilityId: loanInfo.id,
        loanCalculation,
        createTime: new Date().toISOString()
      })

      return assetResult && liabilityResult
    } catch (e) {
      console.error('创建贷款购买记录失败:', e)
      return false
    }
  }

  /**
   * 保存贷款详细记录
   */
  static saveLoanRecord(loanRecord) {
    try {
      const loans = this.getLoanRecords()
      const existingIndex = loans.findIndex(l => l.id === loanRecord.id)
      
      if (existingIndex >= 0) {
        loans[existingIndex] = { ...loans[existingIndex], ...loanRecord }
      } else {
        loans.push(loanRecord)
      }
      
      wx.setStorageSync(this.keys.loans, loans)
      return true
    } catch (e) {
      console.error('保存贷款记录失败:', e)
      return false
    }
  }

  /**
   * 获取所有贷款记录
   */
  static getLoanRecords() {
    try {
      return wx.getStorageSync(this.keys.loans) || []
    } catch (e) {
      console.error('获取贷款记录失败:', e)
      return []
    }
  }

  // ==================== 财务计算 ====================

  /**
   * 计算净资产（传统会计准则）
   */
  static calculateNetWorth() {
    const assets = this.getAssets()
    const liabilities = this.getLiabilities()
    
    // 资产总值（消费性资产按折旧后价值计算）
    const totalAssets = assets.reduce((sum, asset) => {
      if (asset.categoryL1 === 'consumer_asset') {
        return sum + (asset.currentValue || 0)
      } else {
        return sum + (asset.currentValue || asset.initialValue || 0)
      }
    }, 0)
    
    // 负债总额
    const totalLiabilities = liabilities.reduce((sum, liability) => {
      return sum + (liability.currentAmount || liability.initialAmount || 0)
    }, 0)
    
    return {
      totalAssets: Math.round(totalAssets * 100) / 100,
      totalLiabilities: Math.round(totalLiabilities * 100) / 100,
      netWorth: Math.round((totalAssets - totalLiabilities) * 100) / 100
    }
  }

  /**
   * 计算月现金流
   */
  static calculateMonthlyCashFlow() {
    const assets = this.getAssets()
    const liabilities = this.getLiabilities()
    
    // 月现金流入（资产产生的收入）
    const monthlyIncome = assets.reduce((sum, asset) => {
      return sum + (asset.monthlyIncome || 0)
    }, 0)
    
    // 月现金流出（负债还款 + 消费性资产运营成本）
    const monthlyExpense = liabilities.reduce((sum, liability) => {
      return sum + (liability.monthlyPayment || 0)
    }, 0)
    
    // 消费性资产运营成本
    const operatingCosts = assets.reduce((sum, asset) => {
      if (asset.categoryL1 === 'consumer_asset') {
        return sum + (asset.monthlyOperatingCost || 0)
      }
      return sum
    }, 0)
    
    const totalMonthlyOut = monthlyExpense + operatingCosts
    const netCashFlow = monthlyIncome - totalMonthlyOut
    
    return {
      monthlyIncome: Math.round(monthlyIncome * 100) / 100,
      monthlyExpense: Math.round(totalMonthlyOut * 100) / 100,
      netCashFlow: Math.round(netCashFlow * 100) / 100,
      operatingCosts: Math.round(operatingCosts * 100) / 100,
      cashFlowStatus: this.getCashFlowStatus(netCashFlow)
    }
  }

  /**
   * 获取现金流状态
   */
  static getCashFlowStatus(netCashFlow) {
    if (netCashFlow > 500) {
      return { level: 'excellent', text: '优秀', color: '#28a745' }
    } else if (netCashFlow > 0) {
      return { level: 'good', text: '健康', color: '#17a2b8' }
    } else if (netCashFlow > -200) {
      return { level: 'warning', text: '紧张', color: '#ffc107' }
    } else {
      return { level: 'danger', text: '危险', color: '#dc3545' }
    }
  }

  /**
   * 生成财务健康报告
   */
  static generateFinancialHealthReport() {
    const netWorthData = this.calculateNetWorth()
    const cashFlowData = this.calculateMonthlyCashFlow()
    const assets = this.getAssets()
    const liabilities = this.getLiabilities()
    
    // 消费性资产分析
    const consumerAssets = assets.filter(a => a.categoryL1 === 'consumer_asset')
    const totalDepreciation = consumerAssets.reduce((sum, asset) => {
      return sum + (asset.totalDepreciation || 0)
    }, 0)
    
    // 负债分析
    const totalInterestCost = liabilities.reduce((sum, liability) => {
      return sum + (liability.totalInterest || 0)
    }, 0)
    
    return {
      netWorth: netWorthData,
      cashFlow: cashFlowData,
      assetAnalysis: {
        totalAssets: assets.length,
        consumerAssets: consumerAssets.length,
        totalDepreciation: Math.round(totalDepreciation * 100) / 100,
        depreciationRatio: netWorthData.totalAssets > 0 
          ? Math.round((totalDepreciation / netWorthData.totalAssets) * 10000) / 100 
          : 0
      },
      liabilityAnalysis: {
        totalLiabilities: liabilities.length,
        totalInterestCost: Math.round(totalInterestCost * 100) / 100,
        debtToAssetRatio: netWorthData.totalAssets > 0 
          ? Math.round((netWorthData.totalLiabilities / netWorthData.totalAssets) * 10000) / 100 
          : 0
      },
      recommendations: this.generateRecommendations(netWorthData, cashFlowData, totalDepreciation)
    }
  }

  /**
   * 生成财务建议
   */
  static generateRecommendations(netWorth, cashFlow, totalDepreciation) {
    const recommendations = []
    
    // 现金流建议
    if (cashFlow.netCashFlow < 0) {
      recommendations.push({
        type: 'urgent',
        title: '现金流预警',
        message: `当前月现金流为负${Math.abs(cashFlow.netCashFlow)}元，建议立即调整支出结构`,
        icon: '🚨'
      })
    }
    
    // 负债比例建议
    const debtRatio = netWorth.totalAssets > 0 ? (netWorth.totalLiabilities / netWorth.totalAssets) * 100 : 0
    if (debtRatio > 50) {
      recommendations.push({
        type: 'warning',
        title: '负债比例过高',
        message: `负债占资产${Math.round(debtRatio)}%，建议降低至30%以下`,
        icon: '⚠️'
      })
    }
    
    // 消费性资产建议
    if (totalDepreciation > 1000) {
      recommendations.push({
        type: 'info',
        title: '消费性资产优化',
        message: `累计折旧${totalDepreciation}元，建议延长消费品使用周期`,
        icon: '💡'
      })
    }
    
    // 积极建议
    if (cashFlow.netCashFlow > 0 && debtRatio < 30) {
      recommendations.push({
        type: 'success',
        title: '财务状况良好',
        message: `可考虑将${cashFlow.netCashFlow}元月余额用于投资增值`,
        icon: '✅'
      })
    }
    
    return recommendations
  }

  // ==================== 数据导出 ====================

  /**
   * 导出财务报表数据
   */
  static exportFinancialData() {
    try {
      const assets = this.getAssets()
      const liabilities = this.getLiabilities()
      const loans = this.getLoanRecords()
      const healthReport = this.generateFinancialHealthReport()
      
      return {
        exportTime: new Date().toISOString(),
        summary: healthReport,
        assets: assets.map(asset => ({
          名称: asset.name,
          分类: `${asset.categoryL1} - ${asset.categoryL2}`,
          原值: asset.initialValue || asset.originalValue,
          当前价值: asset.currentValue,
          累计折旧: asset.totalDepreciation || 0,
          月收入: asset.monthlyIncome || 0,
          月运营成本: asset.monthlyOperatingCost || 0,
          状态: asset.status,
          购买日期: asset.createDate || asset.purchaseDate
        })),
        liabilities: liabilities.map(liability => ({
          名称: liability.name,
          分类: `${liability.categoryL1} - ${liability.categoryL2}`,
          初始金额: liability.initialAmount,
          当前余额: liability.currentAmount,
          月还款: liability.monthlyPayment || 0,
          总利息: liability.totalInterest || 0,
          状态: liability.status,
          创建日期: liability.createDate
        }))
      }
    } catch (e) {
      console.error('导出数据失败:', e)
      return null
    }
  }

  // ==================== 设置管理 ====================

  static getSettings() {
    try {
      return wx.getStorageSync(this.keys.settings) || this.getDefaultSettings()
    } catch (e) {
      console.error('获取设置失败:', e)
      return this.getDefaultSettings()
    }
  }

  static saveSettings(settings) {
    try {
      wx.setStorageSync(this.keys.settings, settings)
      return true
    } catch (e) {
      console.error('保存设置失败:', e)
      return false
    }
  }

  static getDefaultSettings() {
    return {
      depreciationRates: DepreciationEngine.DEPRECIATION_RATES,
      autoUpdateDepreciation: true,
      cashFlowWarningThreshold: 0,
      currency: 'CNY',
      dateFormat: 'YYYY-MM-DD'
    }
  }
}

module.exports = FinancialStorage
