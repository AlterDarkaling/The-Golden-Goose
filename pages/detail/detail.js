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
    },
    // 主题相关
    isDarkTheme: false
  },

  // 设置主题
  setTheme(isDark) {
    try {
      // 设置导航栏颜色
      wx.setNavigationBarColor({
        frontColor: isDark ? '#ffffff' : '#000000',
        backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
        animation: {
          duration: 100,
          timingFunc: 'easeInOut'
        }
      })
      
      // 设置页面背景色 - 修复白色边框
      if (wx.setBackgroundColor) {
        const bgColor = isDark ? '#1e1e1e' : '#ffffff'
        
        wx.setBackgroundColor({
          backgroundColor: bgColor,
          backgroundColorTop: bgColor,
          backgroundColorBottom: bgColor
        })
        
        setTimeout(() => {
          wx.setBackgroundColor({
            backgroundColor: bgColor,
            backgroundColorTop: bgColor,
            backgroundColorBottom: bgColor
          })
        }, 50)
      }
      
      // 重新渲染界面以应用主题
      this.setData({
        isDarkTheme: isDark
      })
    } catch (error) {
      console.error('设置页面主题失败:', error)
    }
  },

  onLoad(options) {
    // 初始化主题状态
    const app = getApp()
    const isDark = app.globalData.isDarkTheme || false
    
    this.setData({
      type: options.type || 'asset',
      itemId: options.id || '',
      isDarkTheme: isDark
    })
    
    // 设置导航栏主题
    this.setTheme(isDark)
    
    this.loadItemData()
  },

  onShow() {
    // 页面显示时重新加载数据，确保从编辑页面返回后数据是最新的
    if (this.data.itemId) {
      // 获取最新数据并比较是否有变化
      const dataKey = this.data.type === 'asset' ? 'assets_data' : 'liabilities_data'
      const items = wx.getStorageSync(dataKey) || []
      const latestItem = items.find(item => item.id === this.data.itemId)
      
      // 如果数据存在且与当前显示的数据不同，则重新加载
      if (latestItem && (!this.data.itemData || 
          latestItem.currentValue !== this.data.itemData.currentValue ||
          latestItem.originalValue !== this.data.itemData.originalValue ||
          latestItem.name !== this.data.itemData.name)) {
        this.loadItemData()
      } else if (!latestItem) {
        // 如果数据被删除了，返回上一页
        wx.showToast({
          title: '数据已被删除',
          icon: 'none'
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      }
    }
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
      
      // 预格式化其他费用数据
      const formattedOtherCosts = otherCosts.map(cost => ({
        ...cost,
        amountText: this.formatNumber(cost.amount || 0),
        dateText: this.formatDate(cost.date)
      }))
      
      const otherCostsTotal = otherCosts.reduce((sum, cost) => sum + (cost.amount || 0), 0)
      
      // 计算时间轴数据
      const timelineData = this.calculateTimelineData(item, valueAnalysis)
      
      // 预格式化专项信息
      const formattedItemData = {
        ...item,
        costPriceText: this.formatNumber(item.costPrice || 0),
        currentPriceText: this.formatNumber(item.currentPrice || 0),
        loanDateText: this.formatDate(item.loanDate),
        salaryStructureText: this.getSalaryStructureText(item.salaryStructure)
      }
      
      this.setData({
        itemData: formattedItemData,
        displayAmount: this.formatNumber(this.data.type === 'asset' ? (item.currentValue || item.originalValue || item.initialValue) : (item.currentAmount || item.originalAmount || item.initialAmount)),
        valueAnalysis: valueAnalysis,
        incomeAnalysis: item.categoryL1 === 'work_income' ? this.calculateIncomeAnalysis(item, valueAnalysis) : {},
        otherCosts: formattedOtherCosts,
        otherCostsTotal: otherCostsTotal,
        otherCostsTotalText: this.formatNumber(otherCostsTotal),
        timelineData: timelineData,
        salaryTimelineData: item.categoryL1 === 'work_income' ? this.calculateSalaryTimelineData(item) : [],
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
        result.specialInfoTitle = item.categoryL1 === 'work_income' ? '收入详情' : '投资详情'
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
        const category = AccountingCategories.ASSET_CATEGORIES[categoryL1]
        if (category && category.subcategories && category.subcategories[categoryL2]) {
          return `${category.label} - ${category.subcategories[categoryL2].label}`
        }
        return category ? category.label : '未分类'
      } else {
        const category = AccountingCategories.LIABILITY_CATEGORIES[categoryL1]
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

  formatDateText(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${year}年${month}月${day}日`
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
      // 工作收入资产特殊处理
      if (item.categoryL1 === 'work_income') {
        return this.calculateWorkIncomeAnalysis(item)
      }
      
      // 其他资产处理
      const originalValue = item.originalValue || item.initialValue || 0
      let currentValue = item.currentValue || 0
      const daysUsed = this.getDaysUsed(item.createDate || item.createTime)
      
      // 计算累计折旧
      let accumulatedDepreciation = 0
      
      // 对于消费型资产，优先使用用户设置的当前市值
      if (item.categoryL2 === 'consumer_assets') {
        if (currentValue > 0) {
          // 用户手动设置了当前市值，直接使用
          accumulatedDepreciation = Math.max(0, originalValue - currentValue)
        } else if (item.depreciationRate && daysUsed > 0) {
          // 用户未设置当前市值，使用折旧率计算
          const monthlyRate = item.depreciationRate / 100 / 12
          const monthsUsed = daysUsed / 30
          const deprecatedValue = originalValue * (1 - Math.pow(1 - monthlyRate, monthsUsed))
          accumulatedDepreciation = Math.min(deprecatedValue, originalValue * 0.95) // 最多折旧95%
          currentValue = originalValue - accumulatedDepreciation
        } else {
          // 既没有当前市值也没有折旧率，使用原值
          currentValue = originalValue
        }
      } else {
        // 非消费型资产，使用原有逻辑
        if (!currentValue) currentValue = originalValue
        if (item.depreciationRate && daysUsed > 0) {
          const monthlyRate = item.depreciationRate / 100 / 12
          const monthsUsed = daysUsed / 30
          const deprecatedValue = originalValue * (1 - Math.pow(1 - monthlyRate, monthsUsed))
          accumulatedDepreciation = Math.min(deprecatedValue, originalValue * 0.95) // 最多折旧95%
        } else {
          // 如果没有设置折旧率，按购买价格和当前市值计算
          accumulatedDepreciation = Math.max(0, originalValue - currentValue)
        }
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
      
      // 计算价值变化和折旧百分比
      const valueChange = currentValue - originalValue
      const depreciationPercent = originalValue > 0 ? Math.min((accumulatedDepreciation / originalValue) * 100, 100) : 0
      
      result.valueChange = valueChange
      result.depreciationPercent = depreciationPercent
      
      // 格式化文本（直接在WXML中使用）
      result.purchasePriceText = this.formatNumber(originalValue)
      result.currentMarketValueText = this.formatNumber(currentValue)
      result.accumulatedDepreciationText = this.formatNumber(accumulatedDepreciation)
      result.operatingCostText = this.formatNumber(operatingCost)
      result.usageDaysText = daysUsed.toString()
      result.dailyCostText = this.formatNumber(dailyCost)
      result.valueChangeText = this.formatNumber(Math.abs(valueChange))
      result.depreciationPercentText = depreciationPercent.toFixed(1)
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

  // 计算工作收入价值分析
  calculateWorkIncomeAnalysis(item) {
    const startDate = new Date(item.startDate || item.createDate || item.createTime)
    // 如果设置了离职日期，使用离职日期；否则使用当前日期
    const endDate = item.endDate ? new Date(item.endDate) : new Date()
    
    // 计算工作时间
    const yearsDiff = endDate.getFullYear() - startDate.getFullYear()
    const monthsDiff = endDate.getMonth() - startDate.getMonth()
    const totalMonths = Math.max(0, yearsDiff * 12 + monthsDiff)
    const workDays = Math.floor(totalMonths * 30)
    
    // 计算薪资信息
    const currentSalary = item.monthlyIncome || 0
    let initialSalary = item.initialSalary || currentSalary
    let totalEarnings = 0

    // 如果有薪资历史记录，使用精确计算
    if (item.salaryHistory && item.salaryHistory.length > 0) {
      const workingMonthsPerYear = parseFloat(item.workingMonthsPerYear) || 12
      totalEarnings = this.calculateAccurateEarnings(item.salaryHistory, startDate, endDate, workingMonthsPerYear)
      // 获取第一条记录作为初始薪资
      const sortedHistory = [...item.salaryHistory].sort((a, b) => new Date(a.effectiveDate) - new Date(b.effectiveDate))
      initialSalary = sortedHistory[0]?.amount || currentSalary
    } else {
      // 如果没有薪资历史，使用简单平均值计算
      const averageSalary = (initialSalary + currentSalary) / 2
      const workingMonthsPerYear = parseFloat(item.workingMonthsPerYear) || 12
      const workingRatio = workingMonthsPerYear / 12
      totalEarnings = totalMonths * averageSalary * workingRatio
    }
    
    // 计算薪资增长
    const salaryGrowth = currentSalary - initialSalary
    const growthRate = initialSalary > 0 ? ((salaryGrowth / initialSalary) * 100) : 0
    
    // 计算平均日收入
    const dailyIncome = currentSalary / 30
    
    return {
      // 工作收入专用字段
      startDateText: this.formatDateText(item.startDate || item.createDate),
      workDurationText: `${Math.floor(totalMonths / 12)}年${totalMonths % 12}个月`,
      initialSalaryText: this.formatNumber(initialSalary),
      currentSalaryText: this.formatNumber(currentSalary),
      totalEarningsText: this.formatNumber(totalEarnings),
      salaryGrowthText: this.formatNumber(salaryGrowth),
      growthRateText: growthRate.toFixed(1),
      dailyIncomeText: this.formatNumber(dailyIncome),
      
      // 保持兼容性的字段（映射到通用字段）
      purchasePriceText: '0.00', // 工作收入没有购买成本
      currentMarketValueText: this.formatNumber(totalEarnings), // 当前价值 = 累计收入
      accumulatedDepreciationText: '0.00', // 工作收入不折旧
      operatingCostText: '0.00', // 工作收入没有运营成本
      usageDaysText: workDays.toString(),
      dailyCostText: '0.00' // 工作收入没有成本
    }
  },

  // 精确计算历史收入
  calculateAccurateEarnings(salaryHistory, startDate, currentDate, workingMonthsPerYear = 12) {
    if (!salaryHistory || salaryHistory.length === 0) {
      return 0
    }

    // 按日期排序薪资记录
    const sortedHistory = [...salaryHistory].sort((a, b) => new Date(a.effectiveDate) - new Date(b.effectiveDate))
    
    let totalEarnings = 0
    let periodStart = startDate
    const workingRatio = workingMonthsPerYear / 12

    for (let i = 0; i < sortedHistory.length; i++) {
      const record = sortedHistory[i]
      const recordDate = new Date(record.effectiveDate)
      
      // 如果记录日期早于入职日期，跳过
      if (recordDate < startDate) {
        continue
      }

      // 计算当前薪资段的结束时间
      const periodEnd = i < sortedHistory.length - 1 
        ? new Date(sortedHistory[i + 1].effectiveDate)
        : currentDate

      // 限制结束时间不能超过当前时间
      const actualEnd = periodEnd > currentDate ? currentDate : periodEnd

      // 计算这个薪资段的月数
      const periodStartYear = periodStart.getFullYear()
      const periodStartMonth = periodStart.getMonth()
      const actualEndYear = actualEnd.getFullYear()
      const actualEndMonth = actualEnd.getMonth()
      
      const monthsInPeriod = (actualEndYear - periodStartYear) * 12 + (actualEndMonth - periodStartMonth)
      
      if (monthsInPeriod > 0) {
        // 按实际工作月数比例计算收入
        totalEarnings += monthsInPeriod * record.amount * workingRatio
      }

      // 更新下一段的开始时间
      periodStart = recordDate
    }

    return totalEarnings
  },

  // 计算薪资时间轴数据
  calculateSalaryTimelineData(item) {
    if (!item.salaryHistory || item.salaryHistory.length === 0) {
      return []
    }

    const sortedHistory = [...item.salaryHistory].sort((a, b) => new Date(a.effectiveDate) - new Date(b.effectiveDate))
    const currentDate = new Date()
    const startDate = new Date(item.startDate || item.createDate)

    return sortedHistory.map((record, index) => {
      const recordDate = new Date(record.effectiveDate)
      const isCurrent = index === sortedHistory.length - 1
      const isLast = index === sortedHistory.length - 1

      // 计算在这个薪资段的工作时长
      let duration = ''
      if (index < sortedHistory.length - 1) {
        const nextDate = new Date(sortedHistory[index + 1].effectiveDate)
        const months = (nextDate.getFullYear() - recordDate.getFullYear()) * 12 + (nextDate.getMonth() - recordDate.getMonth())
        if (months > 0) {
          const years = Math.floor(months / 12)
          const remainingMonths = months % 12
          if (years > 0) {
            duration = `持续${years}年${remainingMonths > 0 ? remainingMonths + '个月' : ''}`
          } else {
            duration = `持续${remainingMonths}个月`
          }
        }
      } else {
        // 最后一条记录，计算到现在的时长
        const months = (currentDate.getFullYear() - recordDate.getFullYear()) * 12 + (currentDate.getMonth() - recordDate.getMonth())
        if (months > 0) {
          const years = Math.floor(months / 12)
          const remainingMonths = months % 12
          if (years > 0) {
            duration = `至今${years}年${remainingMonths > 0 ? remainingMonths + '个月' : ''}`
          } else {
            duration = `至今${remainingMonths}个月`
          }
        } else {
          duration = '至今'
        }
      }

      return {
        id: record.id,
        reason: record.reason || '薪资调整',
        amount: record.amount.toLocaleString(),
        dateText: this.formatDateText(record.effectiveDate),
        duration: duration,
        isCurrent: isCurrent,
        isLast: isLast
      }
    })
  },

  // 计算收入分析数据
  calculateIncomeAnalysis(item, valueAnalysis) {
    const salaryStructure = item.salaryStructure || 'monthly_salary'
    const currentSalary = item.monthlyIncome || 0
    const dailyWorkHours = item.dailyWorkHours || 8
    const weeklyWorkDays = item.weeklyWorkDays || 5
    const workingMonthsPerYear = parseFloat(item.workingMonthsPerYear) || 12
    
    let grossAnnual, hourlyRate, dailyIncome, monthlyIncome
    
    // 根据薪资结构计算不同指标
    switch (salaryStructure) {
      case 'monthly_salary': // 月薪制
        monthlyIncome = currentSalary
        grossAnnual = currentSalary * workingMonthsPerYear
        dailyIncome = currentSalary / (weeklyWorkDays * 4.33) // 月平均工作天数
        hourlyRate = dailyIncome / dailyWorkHours
        break
        
      case 'hourly_wage': // 时薪制
        hourlyRate = currentSalary // 此时monthlyIncome存储的是时薪
        dailyIncome = hourlyRate * dailyWorkHours
        monthlyIncome = dailyIncome * weeklyWorkDays * 4.33
        grossAnnual = monthlyIncome * workingMonthsPerYear
        break
        
      case 'daily_wage': // 日薪制
        dailyIncome = currentSalary // 此时monthlyIncome存储的是日薪
        monthlyIncome = dailyIncome * weeklyWorkDays * 4.33
        grossAnnual = monthlyIncome * workingMonthsPerYear
        hourlyRate = dailyIncome / dailyWorkHours
        break
        
      default:
        // 默认按月薪制处理
        monthlyIncome = currentSalary
        grossAnnual = currentSalary * workingMonthsPerYear
        dailyIncome = currentSalary / (weeklyWorkDays * 4.33)
        hourlyRate = dailyIncome / dailyWorkHours
        break
    }
    
    // 计算额外收入
    const fixedAllowances = parseFloat(item.fixedAllowances) || 0
    const averageVariableIncome = this.calculateAverageVariableIncome(item.variableIncomeHistory || [])
    
    // 总收入 = 基础薪资 + 固定额外收入 + 平均可变收入
    const totalMonthlyIncome = monthlyIncome + fixedAllowances + averageVariableIncome
    const totalGrossAnnual = totalMonthlyIncome * workingMonthsPerYear
    const totalDailyIncome = totalMonthlyIncome / (weeklyWorkDays * 4.33)
    const totalHourlyRate = totalDailyIncome / dailyWorkHours
    
    // 月增长率计算
    const startDate = new Date(item.startDate || item.createDate)
    const currentDate = new Date()
    const totalMonths = (currentDate.getFullYear() - startDate.getFullYear()) * 12 + (currentDate.getMonth() - startDate.getMonth())
    
    let monthlyGrowthRate = 0
    if (totalMonths > 0 && item.initialSalary && currentSalary > item.initialSalary) {
      monthlyGrowthRate = (Math.pow(currentSalary / item.initialSalary, 1 / totalMonths) - 1) * 100
    }
    
    return {
      // 基础薪资相关
      baseSalaryText: this.formatNumber(monthlyIncome),
      grossAnnualText: this.formatNumber(grossAnnual),
      hourlyRateText: hourlyRate.toFixed(2),
      dailyIncomeText: this.formatNumber(dailyIncome),
      // 额外收入相关
      fixedAllowancesText: this.formatNumber(fixedAllowances),
      averageVariableIncomeText: this.formatNumber(averageVariableIncome),
      // 总收入相关
      totalMonthlyIncomeText: this.formatNumber(totalMonthlyIncome),
      totalGrossAnnualText: this.formatNumber(totalGrossAnnual),
      totalHourlyRateText: totalHourlyRate.toFixed(2),
      totalDailyIncomeText: this.formatNumber(totalDailyIncome),
      // 其他
      monthlyGrowthText: monthlyGrowthRate.toFixed(2)
    }
  },

  // 计算平均可变收入（近6个月）
  calculateAverageVariableIncome(variableIncomeHistory) {
    if (!variableIncomeHistory || variableIncomeHistory.length === 0) {
      return 0
    }

    const currentDate = new Date()
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(currentDate.getMonth() - 6)

    // 筛选近6个月的可变收入记录
    const recentRecords = variableIncomeHistory.filter(record => {
      const recordDate = new Date(record.date)
      return recordDate >= sixMonthsAgo && recordDate <= currentDate
    })

    if (recentRecords.length === 0) {
      return 0
    }

    // 计算总额
    const totalAmount = recentRecords.reduce((sum, record) => {
      return sum + (parseFloat(record.amount) || 0)
    }, 0)

    // 计算月平均值
    const monthsDiff = Math.max(1, (currentDate.getFullYear() - sixMonthsAgo.getFullYear()) * 12 + (currentDate.getMonth() - sixMonthsAgo.getMonth()))
    return totalAmount / Math.min(monthsDiff, 6)
  },

  // 个人所得税计算（按照2023年标准）
  calculateTaxRate(monthlySalary) {
    // 起征点5000元，低于起征点不缴税
    if (monthlySalary <= 5000) return 0
    
    // 应纳税所得额 = 月薪 - 起征点5000元
    const taxableIncome = monthlySalary - 5000
    
    // 累进税率计算
    let tax = 0
    
    if (taxableIncome <= 3000) {
      // 0-3000元：3%
      tax = taxableIncome * 0.03
    } else if (taxableIncome <= 12000) {
      // 3000-12000元：10%
      tax = 3000 * 0.03 + (taxableIncome - 3000) * 0.10
    } else if (taxableIncome <= 25000) {
      // 12000-25000元：20%
      tax = 3000 * 0.03 + 9000 * 0.10 + (taxableIncome - 12000) * 0.20
    } else if (taxableIncome <= 35000) {
      // 25000-35000元：25%
      tax = 3000 * 0.03 + 9000 * 0.10 + 13000 * 0.20 + (taxableIncome - 25000) * 0.25
    } else if (taxableIncome <= 55000) {
      // 35000-55000元：30%
      tax = 3000 * 0.03 + 9000 * 0.10 + 13000 * 0.20 + 10000 * 0.25 + (taxableIncome - 35000) * 0.30
    } else if (taxableIncome <= 80000) {
      // 55000-80000元：35%
      tax = 3000 * 0.03 + 9000 * 0.10 + 13000 * 0.20 + 10000 * 0.25 + 20000 * 0.30 + (taxableIncome - 55000) * 0.35
    } else {
      // 80000元以上：45%
      tax = 3000 * 0.03 + 9000 * 0.10 + 13000 * 0.20 + 10000 * 0.25 + 20000 * 0.30 + 25000 * 0.35 + (taxableIncome - 80000) * 0.45
    }
    
    // 返回实际税率（税额/总收入）
    return tax / monthlySalary
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

  // 计算时间轴数据
  calculateTimelineData(item, valueAnalysis) {
    const result = {
      purchaseDate: '',
      currentDate: '',
      sixMonthsLabel: '6个月',
      sixMonthsDate: '',
      sixMonthsValueText: '0.00',
      oneYearDate: '',
      oneYearValueText: '0.00',
      threeYearsDate: '',
      threeYearsValueText: '0.00',
      futureLossText: '0.00',
      milestones: []
    }

    const originalValue = item.originalValue || item.initialValue || 0
    const depreciationRate = (item.depreciationRate || 20) / 100 // 年折旧率
    let currentValue = item.currentValue || 0
    
    // 对于消费型资产，如果用户没有设置当前市值，使用折旧计算
    if (item.categoryL2 === 'consumer_assets' && currentValue === 0) {
      const currentMonthsUsed = this.getDaysUsed(item.createDate || item.createTime) / 30
      if (depreciationRate > 0 && currentMonthsUsed > 0) {
        const monthlyRate = depreciationRate / 12
        const deprecatedValue = originalValue * Math.pow(1 - monthlyRate, currentMonthsUsed)
        currentValue = Math.max(deprecatedValue, originalValue * 0.05) // 最低保留5%残值
      } else {
        currentValue = originalValue
      }
    } else if (currentValue === 0) {
      currentValue = originalValue
    }
    const purchaseTime = new Date(item.createDate || item.createTime)
    const now = new Date()

    // 购买日期
    result.purchaseDate = this.formatDate(purchaseTime)

    // 当前日期
    result.currentDate = this.formatDate(now)

    // 计算已使用的月数
    const currentMonthsUsed = this.getDaysUsed(item.createDate || item.createTime) / 30

    // 计算从购买时到指定时间点的价值（基于理论折旧）
    const calculateValueFromPurchase = (monthsFromPurchase) => {
      if (depreciationRate <= 0) return originalValue
      const monthlyRate = depreciationRate / 12
      const deprecatedValue = originalValue * Math.pow(1 - monthlyRate, monthsFromPurchase)
      return Math.max(deprecatedValue, originalValue * 0.05) // 最低保留5%残值
    }

    // 计算从当前时间到未来某个时间点的价值（基于当前价值）
    const calculateFutureValueFromNow = (monthsFromNow) => {
      if (depreciationRate <= 0) return currentValue
      const monthlyRate = depreciationRate / 12
      const futureValue = currentValue * Math.pow(1 - monthlyRate, monthsFromNow)
      return Math.max(futureValue, originalValue * 0.05) // 最低保留5%残值
    }

    // 6个月时点
    const sixMonthsDate = new Date(purchaseTime)
    sixMonthsDate.setMonth(sixMonthsDate.getMonth() + 6)
    result.sixMonthsDate = this.formatDate(sixMonthsDate)
    
    // 判断6个月是过去还是未来
    if (sixMonthsDate <= now) {
      // 过去的时间点，使用理论折旧计算
      result.sixMonthsLabel = '6个月时'
      result.sixMonthsValueText = this.formatNumber(calculateValueFromPurchase(6))
    } else {
      // 未来的时间点，从现在开始计算
      const monthsToSixMonths = 6 - currentMonthsUsed
      result.sixMonthsLabel = '6个月后'
      result.sixMonthsValueText = this.formatNumber(calculateFutureValueFromNow(monthsToSixMonths))
    }

    // 1年后
    const oneYearDate = new Date(now)
    oneYearDate.setFullYear(oneYearDate.getFullYear() + 1)
    result.oneYearDate = this.formatDate(oneYearDate)
    result.oneYearValueText = this.formatNumber(calculateFutureValueFromNow(12))

    // 3年后
    const threeYearsDate = new Date(now)
    threeYearsDate.setFullYear(threeYearsDate.getFullYear() + 3)
    result.threeYearsDate = this.formatDate(threeYearsDate)
    result.threeYearsValueText = this.formatNumber(calculateFutureValueFromNow(36))

    // 未来3年损失 = 当前价值 - 3年后价值（从现在开始的折旧损失）
    const threeYearsValue = calculateFutureValueFromNow(36)
    const futureLoss = Math.max(0, currentValue - threeYearsValue)
    result.futureLossText = this.formatNumber(futureLoss)

    // 里程碑事件
    const milestones = []
    
    // 保修到期
    if (item.warrantyMonths && item.warrantyMonths > 0) {
      const warrantyEndDate = new Date(purchaseTime)
      warrantyEndDate.setMonth(warrantyEndDate.getMonth() + item.warrantyMonths)
      if (warrantyEndDate > now) {
        milestones.push({
          icon: '🛡️',
          title: '保修到期',
          date: this.formatDate(warrantyEndDate)
        })
      }
    }

    // 达到50%残值时间
    if (depreciationRate > 0) {
      const monthlyRate = depreciationRate / 12
      const halfValueMonths = Math.log(0.5) / Math.log(1 - monthlyRate)
      const halfValueDate = new Date(purchaseTime)
      halfValueDate.setMonth(halfValueDate.getMonth() + Math.ceil(halfValueMonths))
      if (halfValueDate > now) {
        milestones.push({
          icon: '📉',
          title: '价值减半',
          date: this.formatDate(halfValueDate)
        })
      }
    }

    // 建议更换时间（当残值低于30%时）
    if (depreciationRate > 0) {
      const monthlyRate = depreciationRate / 12
      const replaceMonths = Math.log(0.3) / Math.log(1 - monthlyRate)
      const replaceDate = new Date(purchaseTime)
      replaceDate.setMonth(replaceDate.getMonth() + Math.ceil(replaceMonths))
      if (replaceDate > now) {
        milestones.push({
          icon: '🔄',
          title: '建议更换',
          date: this.formatDate(replaceDate)
        })
      }
    }

    result.milestones = milestones
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
  },

  // 删除其他费用（长按触发）
  deleteCost(e) {
    const costId = e.currentTarget.dataset.costId
    
    wx.showModal({
      title: '删除费用',
      content: '确定要删除这项费用吗？',
      confirmText: '删除',
      confirmColor: '#ff4757',
      success: (res) => {
        if (res.confirm) {
          try {
            // 获取所有费用数据
            const allCosts = wx.getStorageSync('other_costs_data') || []
            
            // 过滤掉要删除的费用
            const updatedCosts = allCosts.filter(cost => cost.id !== costId)
            
            // 更新存储
            wx.setStorageSync('other_costs_data', updatedCosts)
            
            // 重新加载数据
            this.loadItemData()
            
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            })
          } catch (error) {
            console.error('删除费用失败:', error)
            wx.showToast({
              title: '删除失败，请重试',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  // 获取薪资结构的中文显示
  getSalaryStructureText(salaryStructure) {
    const structureMap = {
      'hourly_wage': '时薪制',
      'daily_wage': '日薪制',
      'monthly_salary': '月薪制'
    }
    return structureMap[salaryStructure] || '未设置'
  }
})
