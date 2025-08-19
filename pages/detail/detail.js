Page({
  data: {
    type: 'asset',
    itemId: '',
    itemData: {},
    displayAmount: '0.00',
    // 财务计算数据
    valueChange: 0,
    changePercent: '0.00',
    netMonthlyReturn: 0,
    paidAmount: 0,
    payoffProgress: '0.00',
    remainingMonths: 0,
    paymentTypeText: '',
    depreciationInfo: null,
    // 界面控制
    showSpecialInfo: false,
    specialInfoTitle: '',
    // 新增数据
    valueAnalysis: {},

    otherCosts: [],
    otherCostsTotal: 0,
    trendData: {
      points: [],
      labels: [],
      maxValue: 0,
      lineStyle: ''
    }
  },

  onLoad(options) {
    this.setData({
      type: options.type || 'asset',
      itemId: options.id || ''
    })
    this.loadItemData()
  },

  loadItemData() {
    let item
    if (this.data.type === 'asset') {
      const assets = wx.getStorageSync('assets_data') || []
      item = assets.find(a => a.id === this.data.itemId)
    } else {
      const liabilities = wx.getStorageSync('liabilities_data') || []
      item = liabilities.find(l => l.id === this.data.itemId)
    }

    if (item) {
      // 计算财务数据
      const financialData = this.calculateFinancialData(item)
      
      // 计算扩展数据
      const valueAnalysis = this.calculateValueAnalysis(item)

      const otherCosts = this.loadOtherCosts(item.id)
      const trendData = this.calculateTrendData(item)
      
      // 预格式化其他费用数据
      const formattedOtherCosts = otherCosts.map(cost => ({
        ...cost,
        amountText: this.formatNumber(cost.amount || 0),
        dateText: this.formatDate(cost.date)
      }))
      
      const otherCostsTotal = otherCosts.reduce((sum, cost) => sum + (cost.amount || 0), 0)
      
      // 预格式化趋势图数据
      const formattedTrendData = {
        ...trendData,
        maxValueText: this.formatNumber(trendData.maxValue || 0),
        maxValue80Text: this.formatNumber((trendData.maxValue || 0) * 0.8),
        maxValue60Text: this.formatNumber((trendData.maxValue || 0) * 0.6),
        maxValue40Text: this.formatNumber((trendData.maxValue || 0) * 0.4),
        maxValue20Text: this.formatNumber((trendData.maxValue || 0) * 0.2)
      }
      
      // 预格式化专项信息
      const formattedItemData = {
        ...item,
        costPriceText: this.formatNumber(item.costPrice || 0),
        currentPriceText: this.formatNumber(item.currentPrice || 0),
        loanDateText: this.formatDate(item.loanDate)
      }
      
      this.setData({
        itemData: formattedItemData,
        displayAmount: this.formatNumber(this.data.type === 'asset' ? (item.currentValue || item.originalValue || item.initialValue) : (item.currentAmount || item.originalAmount || item.initialAmount)),
        valueAnalysis: valueAnalysis,
        otherCosts: formattedOtherCosts,
        otherCostsTotal: otherCostsTotal,
        otherCostsTotalText: this.formatNumber(otherCostsTotal),
        trendData: formattedTrendData,
        ...financialData
      })
    } else {
      wx.showToast({
        title: '数据不存在',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  calculateFinancialData(item) {
    const result = {
      valueChange: 0,
      changePercent: '0.00',
      netMonthlyReturn: 0,
      paidAmount: 0,
      payoffProgress: '0.00',
      remainingMonths: 0,
      paymentTypeText: '',
      depreciationInfo: null,
      showSpecialInfo: false,
      specialInfoTitle: ''
    }

    if (this.data.type === 'asset') {
      // 资产价值变化计算
      const originalValue = item.originalValue || item.initialValue || 0
      const currentValue = item.currentValue || originalValue
      if (originalValue > 0 && currentValue !== originalValue) {
        result.valueChange = currentValue - originalValue
        result.changePercent = ((result.valueChange / originalValue) * 100).toFixed(2)
      }

      // 净月收益计算
      const monthlyIncome = item.monthlyIncome || 0
      const monthlyOperatingCost = item.monthlyOperatingCost || 0
      const monthlyDepreciation = this.calculateMonthlyDepreciation(item)
      result.netMonthlyReturn = monthlyIncome - monthlyOperatingCost - monthlyDepreciation

      // 消费性资产折旧信息
      if (item.categoryL2 === 'consumer_assets') {
        result.depreciationInfo = this.calculateDepreciationInfo(item)
      }

      // 工作收入、金融资产等专项信息
      if (item.categoryL1 === 'work_income' || item.categoryL1 === 'financial_assets') {
        result.showSpecialInfo = true
        result.specialInfoTitle = item.categoryL1 === 'work_income' ? '工作信息' : '投资详情'
      }

    } else {
      // 负债计算
      const originalAmount = item.originalAmount || item.initialAmount || 0
      const currentAmount = item.currentAmount || originalAmount
      if (originalAmount > 0) {
        result.paidAmount = originalAmount - currentAmount
        result.payoffProgress = ((result.paidAmount / originalAmount) * 100).toFixed(2)
      }

      // 长期负债专项信息
      if (item.categoryL1 === 'long_term_liabilities') {
        result.showSpecialInfo = true
        result.specialInfoTitle = '贷款详情'
        result.paymentTypeText = this.getPaymentTypeText(item.paymentType)
        result.remainingMonths = this.calculateRemainingMonths(item)
      }
    }

    return result
  },

  calculateMonthlyDepreciation(item) {
    if (!item.depreciationRate || item.depreciationRate <= 0) return 0
    const originalValue = item.originalValue || item.initialValue || 0
    return (originalValue * item.depreciationRate / 100) / 12
  },

  calculateDepreciationInfo(item) {
    if (!item.depreciationRate || item.depreciationRate <= 0) return null
    
    const originalValue = item.originalValue || item.initialValue || 0
    const createDate = new Date(item.createDate || item.createTime)
    const now = new Date()
    const monthsUsed = Math.max(0, (now - createDate) / (1000 * 60 * 60 * 24 * 30))
    
    const monthlyDepreciation = (originalValue * item.depreciationRate / 100) / 12
    const totalDepreciation = Math.min(monthlyDepreciation * monthsUsed, originalValue)
    const depreciationPercent = ((totalDepreciation / originalValue) * 100).toFixed(1)
    
    return {
      totalDepreciation,
      monthlyDepreciation,
      depreciationPercent,
      // 预格式化文本
      totalDepreciationText: this.formatNumber(totalDepreciation),
      monthlyDepreciationText: this.formatNumber(monthlyDepreciation)
    }
  },

  calculateRemainingMonths(item) {
    if (!item.months || !item.loanDate) return 0
    
    const loanDate = new Date(item.loanDate)
    const now = new Date()
    const monthsPassed = Math.max(0, (now - loanDate) / (1000 * 60 * 60 * 24 * 30))
    
    return Math.max(0, item.months - Math.floor(monthsPassed))
  },

  getPaymentTypeText(paymentType) {
    const typeMap = {
      'equal_payment': '等额本息',
      'equal_principal': '等额本金'
    }
    return typeMap[paymentType] || '未知'
  },

  getCategoryName(categoryL1, categoryL2) {
    const AccountingCategories = require('../../utils/accountingCategories.js')
    
    try {
      if (this.data.type === 'asset') {
        const category = AccountingCategories.assetCategories[categoryL1]
        if (category && category.subcategories && category.subcategories[categoryL2]) {
          return `${category.label} - ${category.subcategories[categoryL2].label}`
        }
        return category ? category.label : '未分类'
      } else {
        const category = AccountingCategories.liabilityCategories[categoryL1]
        if (category && category.subcategories && category.subcategories[categoryL2]) {
          return `${category.label} - ${category.subcategories[categoryL2].label}`
        }
        return category ? category.label : '未分类'
      }
    } catch (e) {
      return '未分类'
    }
  },

  getStatusText(status) {
    const statusMap = {
      // 资产状态
      active: '使用中',
      dusty: '吃灰中',
      rented: '出租中',
      damaged: '已损坏',
      processed: '已处理',
      gifted: '已送人',
      sold: '已卖出',
      lost: '已丢失',
      // 负债状态
      normal: '正常还款',
      paid_off: '已还清',
      overdue: '逾期未还',
      prepaid: '提前还清'
    }
    return statusMap[status] || '未知'
  },

  getSettings() {
    try {
      return wx.getStorageSync('app_settings') || this.getDefaultSettings()
    } catch (e) {
      return this.getDefaultSettings()
    }
  },

  getDefaultSettings() {
    return {
      assetCategories: [
        { id: 'investment', name: '投资理财', color: '#4CAF50' },
        { id: 'business', name: '经营性资产', color: '#2196F3' },
        { id: 'intellectual', name: '知识产权', color: '#9C27B0' },
        { id: 'real_estate', name: '房地产', color: '#FF9800' },
        { id: 'other_assets', name: '其他资产', color: '#607D8B' }
      ],
      liabilityCategories: [
        { id: 'consumer_loan', name: '消费贷款', color: '#F44336' },
        { id: 'business_loan', name: '经营性负债', color: '#E91E63' },
        { id: 'credit_card', name: '信用卡', color: '#9C27B0' },
        { id: 'mortgage', name: '房贷', color: '#673AB7' },
        { id: 'other_liabilities', name: '其他负债', color: '#795548' }
      ]
    }
  },

  formatNumber(num) {
    if (typeof num !== 'number') return '0.00'
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  },

  formatDate(dateString) {
    if (!dateString) return '未知'
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN')
  },

  formatPurchaseDate(createDate, createTime) {
    // 优先使用购买日期，如果没有则使用创建时间
    let targetDate
    
    if (createDate) {
      targetDate = new Date(createDate)
    } else if (createTime) {
      targetDate = new Date(createTime)
    } else {
      return '未知日期'
    }
    
    return targetDate.toLocaleDateString('zh-CN')
  },

  handleEdit() {
    wx.navigateTo({
      url: `/pages/edit/edit?type=${this.data.type}&id=${this.data.itemId}`
    })
  },

  handleDelete() {
    wx.showModal({
      title: '确认删除',
      content: `确定要删除这个${this.data.type === 'asset' ? '资产' : '负债'}吗？`,
      success: (res) => {
        if (res.confirm) {
          const StorageManager = require('../../utils/storage.js')
          let success = false
          
          if (this.data.type === 'asset') {
            success = StorageManager.deleteAsset(this.data.itemId)
          } else {
            success = StorageManager.deleteLiability(this.data.itemId)
          }

          if (success) {
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            })
            setTimeout(() => {
              wx.navigateBack()
            }, 1500)
          } else {
            wx.showToast({
              title: '删除失败，请重试',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  // 计算价值分析
  calculateValueAnalysis(item) {
    const result = {}
    
    if (this.data.type === 'asset') {
      const originalValue = item.originalValue || item.initialValue || 0
      const currentValue = item.currentValue || originalValue
      const daysUsed = this.getDaysUsed(item.createDate || item.createTime)
      
      // 计算累计折旧
      let accumulatedDepreciation = 0
      if (item.depreciationRate && daysUsed > 0) {
        const monthlyRate = item.depreciationRate / 100 / 12
        const monthsUsed = daysUsed / 30
        const deprecatedValue = originalValue * (1 - Math.pow(1 - monthlyRate, monthsUsed))
        accumulatedDepreciation = Math.min(deprecatedValue, originalValue * 0.95) // 最多折旧95%
      } else {
        // 如果没有设置折旧率，按购买价格和当前市值计算
        accumulatedDepreciation = Math.max(0, originalValue - currentValue)
      }
      
      // 计算运营成本
      let operatingCost = 0
      if (item.monthlyOperatingCost && daysUsed > 0) {
        const monthsUsed = daysUsed / 30
        operatingCost = monthsUsed * item.monthlyOperatingCost
      }
      
      // 计算每日成本（综合成本：折旧+运营）
      const totalCostLoss = accumulatedDepreciation + operatingCost
      const dailyCost = daysUsed > 0 ? totalCostLoss / daysUsed : 0
      
      // 预格式化所有数值为字符串（避免WXML函数调用问题）
      result.purchasePrice = originalValue          // 原始数值
      result.currentMarketValue = currentValue      // 原始数值
      result.accumulatedDepreciation = accumulatedDepreciation  // 原始数值
      result.operatingCost = operatingCost          // 原始数值
      result.usageDays = daysUsed                   // 原始数值
      result.dailyCost = dailyCost                  // 原始数值
      
      // 格式化文本（直接在WXML中使用）
      result.purchasePriceText = this.formatNumber(originalValue)
      result.currentMarketValueText = this.formatNumber(currentValue)
      result.accumulatedDepreciationText = this.formatNumber(accumulatedDepreciation)
      result.operatingCostText = this.formatNumber(operatingCost)
      result.usageDaysText = daysUsed.toString()
      result.dailyCostText = this.formatNumber(dailyCost)
    } else {
      const originalAmount = item.originalAmount || 0
      const currentAmount = item.currentAmount || originalAmount
      const paidAmount = originalAmount - currentAmount
      
      result.originalAmount = originalAmount       // 借款金额
      result.totalInterest = 0                    // 总利息
      result.paidAmount = paidAmount              // 已还本金
      result.remainingAmount = currentAmount      // 剩余本金
      result.completionRate = originalAmount > 0 ? ((paidAmount / originalAmount) * 100).toFixed(1) : 0  // 完成度
      result.remainingMonths = 0                  // 剩余期数
      
      // 计算总利息
      if (item.annualRate && item.months) {
        result.totalInterest = (originalAmount * item.annualRate / 100 * item.months / 12)
      }
      
      // 计算剩余期数
      if (item.monthlyPayment && item.monthlyPayment > 0 && currentAmount > 0) {
        result.remainingMonths = Math.ceil(currentAmount / item.monthlyPayment)
      }
      
      // 格式化文本（直接在WXML中使用）
      result.originalAmountText = this.formatNumber(originalAmount)
      result.totalInterestText = this.formatNumber(result.totalInterest)
      result.paidAmountText = this.formatNumber(paidAmount)
      result.remainingAmountText = this.formatNumber(currentAmount)
      result.completionRateText = result.completionRate.toString()
      result.remainingMonthsText = result.remainingMonths.toString()
    }
    
    return result
  },



  // 加载其他费用
  loadOtherCosts(itemId) {
    try {
      const allCosts = wx.getStorageSync('other_costs_data') || []
      return allCosts.filter(cost => cost.itemId === itemId)
    } catch (error) {
      return []
    }
  },

  // 计算趋势数据
  calculateTrendData(item) {
    const result = {
      points: [],
      labels: [],
      maxValue: 0,
      lineStyle: ''
    }
    
    if (this.data.type === 'asset') {
      const originalValue = item.originalValue || item.initialValue || 0
      const depreciationRate = (item.depreciationRate || 2) / 100 // 月折旧率
      const monthsToShow = 6 // 显示6个月的趋势
      
      result.maxValue = originalValue
      
      // 生成6个月的趋势点
      for (let i = 0; i < monthsToShow; i++) {
        const monthsFromNow = i
        const currentValue = originalValue * Math.pow(1 - depreciationRate, monthsFromNow)
        const percentage = (currentValue / originalValue) * 100
        
        result.points.push({
          x: (i / (monthsToShow - 1)) * 100,
          y: percentage
        })
        
        const date = new Date()
        date.setMonth(date.getMonth() + i)
        result.labels.push(`${date.getFullYear()}年${date.getMonth() + 1}月`)
      }
      
      // 生成趋势线样式
      result.lineStyle = `background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);`
    }
    
    return result
  },

  // 获取使用天数
  getDaysUsed(createDate) {
    if (!createDate) return 0
    
    const create = new Date(createDate)
    const now = new Date()
    const diffTime = Math.abs(now - create)
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  },

  // 添加其他费用
  addOtherCost() {
    wx.navigateTo({
      url: `/pages/add-cost/add-cost?itemId=${this.data.itemId}&type=${this.data.type}`
    })
  }
})
