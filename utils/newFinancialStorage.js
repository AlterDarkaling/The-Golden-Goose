/**
 * 新财务存储管理器
 * 基于传统会计准则，集成会计计算引擎
 */

const AccountingCategories = require('./accountingCategories.js')
const AccountingEngine = require('./accountingEngine.js')

class NewFinancialStorage {
  
  // 存储键名
  static KEYS = {
    USER_INFO: 'user_info_v2',
    ASSETS: 'assets_v2', 
    LIABILITIES: 'liabilities_v2',
    SETTINGS: 'app_settings_v2',
    APP_INITIALIZED: 'app_initialized_v2'
  }

  /**
   * 用户信息管理
   */
  static saveUser(userInfo) {
    try {
      wx.setStorageSync(this.KEYS.USER_INFO, {
        ...userInfo,
        updateTime: new Date().toISOString()
      })
      return true
    } catch (error) {
      console.error('保存用户信息失败:', error)
      return false
    }
  }

  static getUser() {
    try {
      return wx.getStorageSync(this.KEYS.USER_INFO) || {
        id: 'user_' + Date.now(),
        nickname: '用户',
        avatar: '/static/default-avatar.svg',
        motto: '理财从认识资产负债开始',
        createTime: new Date().toISOString()
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      return null
    }
  }

  /**
   * 资产管理
   */
  static saveAssets(assets) {
    try {
      wx.setStorageSync(this.KEYS.ASSETS, {
        data: assets,
        updateTime: new Date().toISOString()
      })
      return true
    } catch (error) {
      console.error('保存资产数据失败:', error)
      return false
    }
  }

  static getAssets() {
    try {
      const stored = wx.getStorageSync(this.KEYS.ASSETS)
      let assets = stored?.data || []
      
      // 使用会计引擎计算每个资产的当前价值
      assets = assets.map(asset => {
        const calculation = AccountingEngine.calculateAssetValue(asset)
        return {
          ...asset,
          // 保留原始数据
          originalValue: asset.originalValue,
          // 更新计算结果
          currentValue: calculation.currentValue,
          bookValue: calculation.bookValue,
          accumulatedDepreciation: calculation.accumulatedDepreciation || 0,
          monthlyDepreciation: calculation.monthlyDepreciation || 0,
          calculationMethod: calculation.calculationMethod,
          // 金融资产特有
          unrealizedGainLoss: calculation.unrealizedGainLoss || 0,
          gainLossRatio: calculation.gainLossRatio || 0,
          // 增值资产特有  
          valueChange: calculation.valueChange || 0,
          valueChangeRatio: calculation.valueChangeRatio || 0,
          // 摊销资产特有
          accumulatedAmortization: calculation.accumulatedAmortization || 0,
          monthlyAmortization: calculation.monthlyAmortization || 0,
          remainingMonths: calculation.remainingMonths || 0
        }
      })
      
      return assets
    } catch (error) {
      console.error('获取资产数据失败:', error)
      return []
    }
  }

  static addAsset(asset) {
    try {
      const assets = this.getAssets()
      const newAsset = {
        id: 'asset_' + Date.now(),
        type: 'asset',
        createTime: new Date().toISOString(),
        createDate: new Date().toISOString().split('T')[0],
        ...asset
      }
      
      // 自动设置折旧率（消费型资产）
      if (asset.categoryL1 === 'physical_assets' && asset.categoryL2 === 'consumer_assets') {
        const depreciationInfo = AccountingCategories.getDepreciationRate(asset.categoryL2, asset.categoryL3)
        if (depreciationInfo && !asset.customDepreciationRate) {
          newAsset.depreciationRate = depreciationInfo.rate
        }
      }
      
      assets.push(newAsset)
      this.saveAssets(assets)
      
      // 清除示例数据
      this.clearSampleDataIfNeeded()
      
      return newAsset
    } catch (error) {
      console.error('添加资产失败:', error)
      return null
    }
  }

  static updateAsset(updatedAsset) {
    try {
      const assets = this.getAssets()
      const index = assets.findIndex(asset => asset.id === updatedAsset.id)
      
      if (index !== -1) {
        assets[index] = {
          ...assets[index],
          ...updatedAsset,
          updateTime: new Date().toISOString()
        }
        this.saveAssets(assets)
        return assets[index]
      }
      
      return null
    } catch (error) {
      console.error('更新资产失败:', error)
      return null
    }
  }

  static deleteAsset(assetId) {
    try {
      const assets = this.getAssets()
      const filteredAssets = assets.filter(asset => asset.id !== assetId)
      this.saveAssets(filteredAssets)
      return true
    } catch (error) {
      console.error('删除资产失败:', error)
      return false
    }
  }

  /**
   * 负债管理
   */
  static saveLiabilities(liabilities) {
    try {
      wx.setStorageSync(this.KEYS.LIABILITIES, {
        data: liabilities,
        updateTime: new Date().toISOString()
      })
      return true
    } catch (error) {
      console.error('保存负债数据失败:', error)
      return false
    }
  }

  static getLiabilities() {
    try {
      const stored = wx.getStorageSync(this.KEYS.LIABILITIES)
      let liabilities = stored?.data || []
      
      // 使用会计引擎计算每个负债的当前状态
      liabilities = liabilities.map(liability => {
        const calculation = AccountingEngine.calculateLiabilityValue(liability)
        return {
          ...liability,
          // 保留原始数据
          originalAmount: liability.originalAmount,
          // 更新计算结果
          currentAmount: calculation.currentAmount,
          remainingPrincipal: calculation.remainingPrincipal,
          totalInterest: calculation.totalInterest || 0,
          monthlyInterest: calculation.monthlyInterest || 0,
          monthlyPayment: calculation.monthlyPayment || liability.monthlyPayment || 0,
          calculationMethod: calculation.calculationMethod,
          // 贷款特有
          totalPaidInterest: calculation.totalPaidInterest || 0,
          monthsPaid: calculation.monthsPaid || 0,
          remainingMonths: calculation.remainingMonths || 0
        }
      })
      
      return liabilities
    } catch (error) {
      console.error('获取负债数据失败:', error)
      return []
    }
  }

  static addLiability(liability) {
    try {
      const liabilities = this.getLiabilities()
      const newLiability = {
        id: 'liability_' + Date.now(),
        type: 'liability',
        createTime: new Date().toISOString(),
        createDate: new Date().toISOString().split('T')[0],
        ...liability
      }
      
      liabilities.push(newLiability)
      this.saveLiabilities(liabilities)
      
      // 清除示例数据
      this.clearSampleDataIfNeeded()
      
      return newLiability
    } catch (error) {
      console.error('添加负债失败:', error)
      return null
    }
  }

  static updateLiability(updatedLiability) {
    try {
      const liabilities = this.getLiabilities()
      const index = liabilities.findIndex(liability => liability.id === updatedLiability.id)
      
      if (index !== -1) {
        liabilities[index] = {
          ...liabilities[index],
          ...updatedLiability,
          updateTime: new Date().toISOString()
        }
        this.saveLiabilities(liabilities)
        return liabilities[index]
      }
      
      return null
    } catch (error) {
      console.error('更新负债失败:', error)
      return null
    }
  }

  static deleteLiability(liabilityId) {
    try {
      const liabilities = this.getLiabilities()
      const filteredLiabilities = liabilities.filter(liability => liability.id !== liabilityId)
      this.saveLiabilities(filteredLiabilities)
      return true
    } catch (error) {
      console.error('删除负债失败:', error)
      return false
    }
  }

  /**
   * 财务分析
   */
  static calculateNetWorth() {
    try {
      const assets = this.getAssets()
      const liabilities = this.getLiabilities()
      return AccountingEngine.calculateNetWorth(assets, liabilities)
    } catch (error) {
      console.error('计算净资产失败:', error)
      return {
        totalAssets: 0,
        totalLiabilities: 0,
        netWorth: 0,
        assetBreakdown: {},
        liabilityBreakdown: {},
        assetLiabilityRatio: 0
      }
    }
  }

  static calculateMonthlyCashFlow(monthlyIncome = 0, monthlyExpense = 0) {
    try {
      const assets = this.getAssets()
      const liabilities = this.getLiabilities()
      return AccountingEngine.calculateMonthlyCashFlow(assets, liabilities, monthlyIncome, monthlyExpense)
    } catch (error) {
      console.error('计算现金流失败:', error)
      return {
        totalMonthlyIncome: monthlyIncome,
        totalMonthlyExpense: monthlyExpense,
        netMonthlyCashFlow: monthlyIncome - monthlyExpense,
        breakdown: {},
        cashFlowStatus: { level: 'unknown', text: '未知', color: '#666', icon: '❓' }
      }
    }
  }

  static analyzeFinancialRisks() {
    try {
      const netWorthData = this.calculateNetWorth()
      const cashFlowData = this.calculateMonthlyCashFlow()
      return AccountingEngine.analyzeFinancialRisks(netWorthData, cashFlowData)
    } catch (error) {
      console.error('分析财务风险失败:', error)
      return []
    }
  }

  /**
   * 设置管理
   */
  static saveSettings(settings) {
    try {
      wx.setStorageSync(this.KEYS.SETTINGS, {
        ...settings,
        updateTime: new Date().toISOString()
      })
      return true
    } catch (error) {
      console.error('保存设置失败:', error)
      return false
    }
  }

  static getSettings() {
    try {
      return wx.getStorageSync(this.KEYS.SETTINGS) || this.getDefaultSettings()
    } catch (error) {
      console.error('获取设置失败:', error)
      return this.getDefaultSettings()
    }
  }

  static getDefaultSettings() {
    return {
      // 用户偏好
      monthlyIncome: 0,
      monthlyExpense: 0,
      
      // 分类设置
      assetCategories: AccountingCategories.getAssetL1Categories(),
      liabilityCategories: AccountingCategories.getLiabilityL1Categories(),
      
      // 计算设置
      depreciationRates: AccountingCategories.ASSET_CATEGORIES.physical_assets.subcategories.consumer_assets.depreciationRates,
      
      // 显示设置
      showCalculationDetails: true,
      showRiskWarnings: true,
      
      createTime: new Date().toISOString()
    }
  }

  /**
   * 应用初始化
   */
  static isAppInitialized() {
    try {
      return !!wx.getStorageSync(this.KEYS.APP_INITIALIZED)
    } catch (error) {
      return false
    }
  }

  static setAppInitialized() {
    try {
      wx.setStorageSync(this.KEYS.APP_INITIALIZED, {
        initialized: true,
        version: '2.0.0',
        initTime: new Date().toISOString()
      })
      return true
    } catch (error) {
      console.error('设置应用初始化状态失败:', error)
      return false
    }
  }

  /**
   * 示例数据管理
   */
  static createSampleData() {
    try {
      // 创建示例资产
      const sampleAssets = [
        {
          name: '招商银行储蓄',
          categoryL1: 'current_assets',
          categoryL2: 'cash_assets', 
          categoryL3: 'bank_deposit',
          originalValue: 15000,
          currentValue: 15000,
          status: 'active',
          notes: '日常储蓄账户',
          isSample: true
        },
        {
          name: 'iPhone 15 Pro',
          categoryL1: 'physical_assets',
          categoryL2: 'consumer_assets',
          categoryL3: 'mobile_computer',
          originalValue: 8999,
          purchaseDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6个月前
          status: 'active',
          notes: '日常使用手机',
          isSample: true
        },
        {
          name: '沪深300ETF',
          categoryL1: 'financial_assets',
          categoryL2: 'equity_fund',
          categoryL3: 'etf_fund',
          originalValue: 10000,
          currentValue: 10800,
          quantity: 1000,
          costPrice: 10.0,
          currentPrice: 10.8,
          monthlyIncome: 50,
          status: 'active',
          notes: '定投ETF基金',
          isSample: true
        }
      ]
      
      // 创建示例负债
      const sampleLiabilities = [
        {
          name: '招商银行信用卡',
          categoryL1: 'current_liabilities',
          categoryL2: 'credit_card_debt',
          categoryL3: 'credit_card_bill',
          originalAmount: 3500,
          currentAmount: 3500,
          minimumPayment: 350,
          billDay: 5,
          status: 'active',
          notes: '信用卡账单',
          isSample: true
        },
        {
          name: '房屋贷款',
          categoryL1: 'long_term_liabilities',
          categoryL2: 'mortgage_loan',
          categoryL3: 'home_mortgage',
          originalAmount: 800000,
          currentAmount: 750000,
          annualRate: 0.049,
          months: 360,
          paymentType: 'equal_payment',
          monthlyPayment: 4200,
          loanDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1年前
          status: 'active',
          notes: '首套房贷款',
          isSample: true
        }
      ]
      
      // 保存示例数据
      sampleAssets.forEach(asset => this.addAsset(asset))
      sampleLiabilities.forEach(liability => this.addLiability(liability))
      
      return true
    } catch (error) {
      console.error('创建示例数据失败:', error)
      return false
    }
  }

  static clearSampleDataIfNeeded() {
    try {
      const settings = this.getSettings()
      if (settings.shouldClearSampleData !== false) {
        // 清除示例数据
        const assets = this.getAssets().filter(asset => !asset.isSample)
        const liabilities = this.getLiabilities().filter(liability => !liability.isSample)
        
        this.saveAssets(assets)
        this.saveLiabilities(liabilities)
        
        // 标记已清除
        this.saveSettings({
          ...settings,
          shouldClearSampleData: false
        })
      }
    } catch (error) {
      console.error('清除示例数据失败:', error)
    }
  }

  /**
   * 数据迁移
   */
  static migrateFromOldVersion() {
    try {
      // 检查是否有旧版本数据
      const oldAssets = wx.getStorageSync('assets_data') || []
      const oldLiabilities = wx.getStorageSync('liabilities_data') || []
      const oldUser = wx.getStorageSync('user_info') || {}
      
      if (oldAssets.length > 0 || oldLiabilities.length > 0) {
        console.log('开始数据迁移...')
        
        // 迁移用户信息
        if (oldUser.id) {
          this.saveUser(oldUser)
        }
        
        // 迁移资产数据
        const migratedAssets = oldAssets.map(asset => this.migrateAssetData(asset))
        if (migratedAssets.length > 0) {
          this.saveAssets(migratedAssets)
        }
        
        // 迁移负债数据
        const migratedLiabilities = oldLiabilities.map(liability => this.migrateLiabilityData(liability))
        if (migratedLiabilities.length > 0) {
          this.saveLiabilities(migratedLiabilities)
        }
        
        console.log('数据迁移完成')
        return true
      }
      
      return false
    } catch (error) {
      console.error('数据迁移失败:', error)
      return false
    }
  }

  static migrateAssetData(oldAsset) {
    // 映射旧分类到新分类
    const categoryMapping = {
      'cashflow_in': { l1: 'current_assets', l2: 'cash_assets', l3: 'bank_deposit' },
      'appreciation': { l1: 'financial_assets', l2: 'equity_fund', l3: 'a_stock' },
      'business': { l1: 'physical_assets', l2: 'appreciating_assets', l3: 'real_estate' },
      'consumer_asset': { l1: 'physical_assets', l2: 'consumer_assets', l3: 'mobile_computer' },
      'other_asset': { l1: 'other_assets', l2: 'intangible_assets', l3: 'patent' }
    }
    
    const mapping = categoryMapping[oldAsset.categoryL1] || categoryMapping['other_asset']
    
    return {
      ...oldAsset,
      categoryL1: mapping.l1,
      categoryL2: mapping.l2,
      categoryL3: mapping.l3,
      originalValue: oldAsset.initialValue || oldAsset.originalValue || 0,
      migrated: true
    }
  }

  static migrateLiabilityData(oldLiability) {
    // 映射旧分类到新分类
    const categoryMapping = {
      'consumer_debt': { l1: 'current_liabilities', l2: 'credit_card_debt', l3: 'credit_card_bill' },
      'investment_debt': { l1: 'long_term_liabilities', l2: 'mortgage_loan', l3: 'home_mortgage' },
      'other_debt': { l1: 'other_liabilities', l2: 'accounts_payable', l3: 'utility_bill' }
    }
    
    const mapping = categoryMapping[oldLiability.categoryL1] || categoryMapping['other_debt']
    
    return {
      ...oldLiability,
      categoryL1: mapping.l1,
      categoryL2: mapping.l2,
      categoryL3: mapping.l3,
      originalAmount: oldLiability.initialAmount || oldLiability.originalAmount || 0,
      migrated: true
    }
  }

  /**
   * 数据清理
   */
  static clearAllData() {
    try {
      wx.removeStorageSync(this.KEYS.ASSETS)
      wx.removeStorageSync(this.KEYS.LIABILITIES)
      wx.removeStorageSync(this.KEYS.SETTINGS)
      wx.removeStorageSync(this.KEYS.APP_INITIALIZED)
      // 保留用户信息
      return true
    } catch (error) {
      console.error('清除数据失败:', error)
      return false
    }
  }

  /**
   * 数据导出
   */
  static exportData() {
    try {
      const data = {
        user: this.getUser(),
        assets: this.getAssets(),
        liabilities: this.getLiabilities(),
        settings: this.getSettings(),
        netWorth: this.calculateNetWorth(),
        cashFlow: this.calculateMonthlyCashFlow(),
        exportTime: new Date().toISOString(),
        version: '2.0.0'
      }
      
      return JSON.stringify(data, null, 2)
    } catch (error) {
      console.error('导出数据失败:', error)
      return null
    }
  }

  /**
   * 工具方法
   */
  static formatMoney(amount) {
    if (typeof amount !== 'number') return '¥0.00'
    return '¥' + amount.toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  static formatDate(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return '今天'
    if (diffDays === 1) return '昨天'
    if (diffDays < 7) return `${diffDays}天前`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}个月前`
    return `${Math.floor(diffDays / 365)}年前`
  }

  static getCategoryPath(type, l1, l2, l3) {
    if (type === 'asset') {
      return AccountingCategories.getCategoryPath(l1, l2, l3)
    } else {
      return AccountingCategories.getCategoryPath(l1, l2, l3)
    }
  }
}

module.exports = NewFinancialStorage
