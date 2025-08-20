// 引入本地存储管理工具
const StorageManager = require('../../utils/storage.js')
const AccountingCategories = require('../../utils/accountingCategories.js')
const DepreciationEngine = require('../../utils/depreciation.js')

Page({
  data: {
    userInfo: {},
    assets: [],
    liabilities: [],
    // 财务数据
    netWorth: '0.00',
    monthlyCashflowIn: '0.00',
    monthlyCashflowOut: '0.00',
    netMonthlyCashflow: '0.00',
    cashflowStatus: '健康',
    assetsCount: 0,
    liabilitiesCount: 0,
    searchKeyword: '',
    sortFieldIndex: 0,
    sortOrderIndex: 0,
    categoryIndex: [0, 0],
    statusIndex: 0,
    sortFieldOptions: [
      { label: '默认排序', value: 'createTime' },
      { label: '金额', value: 'amount' },
      { label: '天数', value: 'days' },
      { label: '购买时间', value: 'purchaseDate' },
      { label: '每日成本', value: 'dailyCost' }
    ],
    sortOrderOptions: [
      { label: '降序', value: 'desc' },
      { label: '升序', value: 'asc' }
    ],
    // 资产分类（传统会计准则）
    assetCategories: [],
    // 资产二级分类
    assetSubCategories: [],
    
    // 负债分类（传统会计准则）
    liabilityCategories: [
      { label: '全部类别', value: 'all' },
      { label: '流动负债', value: 'current_liabilities' },
      { label: '长期负债', value: 'long_term_liabilities' },
      { label: '其他负债', value: 'other_liabilities' }
    ],
    // 负债二级分类
    liabilitySubCategories: [
      // 全部类别
      [{ label: '全部', value: 'all' }],
      // 流动负债
      [
        { label: '全部', value: 'all' },
        { label: '信用卡负债', value: 'credit_card_debt' },
        { label: '短期借款', value: 'short_term_loan' }
      ],
      // 长期负债
      [
        { label: '全部', value: 'all' },
        { label: '房贷', value: 'mortgage_loan' },
        { label: '车贷/消费贷', value: 'consumer_loan' }
      ],
      // 其他负债
      [
        { label: '全部', value: 'all' },
        { label: '应付款项', value: 'accounts_payable' },
        { label: '预收款项', value: 'advance_receipts' }
      ]
    ],
      // 双栏状态选择器：[类型栏, 状态栏]
      statusCategories: [
        { label: '全部', value: 'all' },
        { label: '资产状态', value: 'asset' },
        { label: '负债状态', value: 'liability' }
      ],
      statusOptions: [
        // 全部状态
        [{ label: '全部状态', value: 'all' }],
        // 资产状态
        [
          { label: '全部资产', value: 'all' },
          { label: '使用中', value: 'active' },
          { label: '吃灰中', value: 'dusty' },
          { label: '出租中', value: 'rented' },
          { label: '已损坏', value: 'damaged' },
          { label: '已处理', value: 'processed' },
          { label: '已送人', value: 'gifted' },
          { label: '已卖出', value: 'sold' },
          { label: '已丢失', value: 'lost' }
        ],
        // 负债状态
        [
          { label: '全部负债', value: 'all' },
          { label: '正常还款', value: 'normal' },
          { label: '已还清', value: 'paid_off' },
          { label: '逾期未还', value: 'overdue' },
          { label: '提前还清', value: 'prepaid' }
        ]
      ],
      statusIndex: [0, 0], // 双栏索引：[类型索引, 状态索引]
    netWorth: 0,
    dailyCost: 0,
    dailyIncome: 0,
    assetsCount: 0,
    liabilitiesCount: 0,
    filteredAssets: [],
    filteredLiabilities: []
  },

  onLoad() {
    this.initCategories()
    this.checkLogin()
    this.loadData()
  },

  onShow() {
    this.checkLogin()  // 重新检查登录状态和加载用户信息
    this.loadData()
  },

  // 初始化分类数据
  initCategories() {
    const assetL1Categories = AccountingCategories.getAssetL1Categories()
    
    const assetCategories = [
      { label: '全部类别', value: 'all' },
      ...assetL1Categories
    ]
    
    const assetSubCategories = [
      [{ label: '全部', value: 'all' }] // 全部类别的子分类
    ]
    
    // 为每个一级分类添加对应的二级分类
    assetL1Categories.forEach(l1Category => {
      const l2Categories = AccountingCategories.getAssetL2Categories(l1Category.value)
      assetSubCategories.push([
        { label: '全部', value: 'all' },
        ...l2Categories
      ])
    })
    
    this.setData({
      assetCategories,
      assetSubCategories
    })
  },

  checkLogin() {
    const hasInitialized = wx.getStorageSync('app_initialized')
    
    if (!hasInitialized) {
      // 未初始化，跳转到引导页
      wx.reLaunch({
        url: '/pages/login/login'
      })
      return
    }
    
    // 加载用户信息
    const user = StorageManager.getUser()
    if (user) {
      // 计算显示头像：优先使用自定义头像，如果没有则使用微信头像
      const displayAvatar = user.avatar || user.wechatAvatar
      

      
      this.setData({
        userInfo: {
          ...user,
          avatar: displayAvatar || '/static/default-avatar.png'
        }
      })
    } else {
      wx.reLaunch({
        url: '/pages/login/login'
      })
    }
  },

  loadData() {
    const assets = StorageManager.getAssets()
    const liabilities = StorageManager.getLiabilities()
    
    // 处理数据，添加显示字段
    const self = this
    const processedAssets = assets.map(asset => ({
      ...asset,
      type: 'asset',
      typeText: asset.categoryL1 === 'work_income' ? '工作' : '资产',
      categoryName: self.getCategoryName(asset.categoryL1, asset.categoryL2, true),
      displayAmount: self.formatNumber(asset.currentValue || asset.initialValue),
      originalPrice: self.formatNumber(asset.originalValue || asset.initialValue || 0),
      // 计算实际月收入（针对工作收入）
      monthlyIncome: asset.categoryL1 === 'work_income' ? 
        self.calculateActualMonthlyIncome(asset) : asset.monthlyIncome,
      // 计算每日成本（针对消费型资产）
      dailyCost: asset.categoryL2 === 'consumer_assets' ? 
        self.calculateDailyCost(asset) : null,
      statusText: self.getStatusText(asset.status),
      // 工作收入优先显示入职日期，其他资产显示购买日期
      createTimeText: asset.categoryL1 === 'work_income' ? 
        self.formatWorkStartDate(asset) : StorageManager.formatPurchaseDate(asset.createDate, asset.createTime),
      // 排序用的数值字段
      amountValue: asset.currentValue || asset.initialValue || 0,
      daysValue: self.calculateDaysSinceCreate(asset.createTime),
      purchaseDateValue: self.getPurchaseDateValue(asset.createDate, asset.createTime),
      dailyCostValue: asset.dailyIncome || 0 // 资产用每日收益
    }))
    
    const processedLiabilities = liabilities.map(liability => ({
      ...liability,
      type: 'liability',
      typeText: '负债',
      categoryName: self.getCategoryName(liability.categoryL1, liability.categoryL2, false),
      displayAmount: self.formatNumber(liability.currentAmount || liability.initialAmount),
      originalAmount: self.formatNumber(liability.originalAmount || liability.initialAmount || 0),
      statusText: self.getStatusText(liability.status),
      createTimeText: StorageManager.formatPurchaseDate(liability.createDate, liability.createTime),
      // 排序用的数值字段
      amountValue: liability.currentAmount || liability.initialAmount || 0,
      daysValue: self.calculateDaysSinceCreate(liability.createTime),
      purchaseDateValue: self.getPurchaseDateValue(liability.createDate, liability.createTime),
      dailyCostValue: liability.dailyCost || 0 // 负债用每日成本
    }))

    this.setData({
      assets: processedAssets,
      liabilities: processedLiabilities
    })

    this.calculateCashflow()
    this.updateFilteredData()
  },

  // 计算现金流数据
  calculateCashflow() {
    const { assets, liabilities } = this.data
    
    // 计算月现金流入（资产的月收入）
    const monthlyCashflowIn = assets.reduce((total, asset) => {
      return total + (parseFloat(asset.monthlyIncome) || 0)
    }, 0)
    
    // 计算月现金流出（负债的月还款）
    const monthlyCashflowOut = liabilities.reduce((total, liability) => {
      return total + (parseFloat(liability.monthlyPayment) || 0)
    }, 0)
    
    // 净月现金流
    const netMonthlyCashflow = monthlyCashflowIn - monthlyCashflowOut
    
    // 计算净资产（排除工作收入类别）
    const totalAssetValue = assets.reduce((total, asset) => {
      // 工作收入不计入净资产，因为它不是可变现的资产
      if (asset.categoryL1 === 'work_income') {
        return total
      }
      return total + (parseFloat(asset.currentValue) || parseFloat(asset.initialValue) || 0)
    }, 0)
    
    const totalLiabilityValue = liabilities.reduce((total, liability) => {
      return total + (parseFloat(liability.currentAmount) || parseFloat(liability.initialAmount) || 0)
    }, 0)
    
    const netWorth = totalAssetValue - totalLiabilityValue
    
    // 确定现金流状态
    let cashflowStatus = '健康'
    if (netMonthlyCashflow < 0) {
      cashflowStatus = '负流'
    } else if (netMonthlyCashflow === 0) {
      cashflowStatus = '平衡'
    } else if (netMonthlyCashflow > monthlyCashflowOut * 0.5) {
      cashflowStatus = '优秀'
    }
    
    // 计算资产数量（排除工作收入）
    const actualAssetsCount = assets.filter(asset => asset.categoryL1 !== 'work_income').length
    
    this.setData({
      netWorth: this.formatNumber(netWorth),
      monthlyCashflowIn: this.formatNumber(monthlyCashflowIn),
      monthlyCashflowOut: this.formatNumber(monthlyCashflowOut),
      netMonthlyCashflow: this.formatNumber(netMonthlyCashflow),
      cashflowStatus: cashflowStatus,
      assetsCount: actualAssetsCount,
      liabilitiesCount: liabilities.length
    })
  },

  updateFilteredData() {
    const { assets, liabilities, searchKeyword, sortFieldIndex, sortOrderIndex, categoryIndex, statusIndex, sortFieldOptions, sortOrderOptions, assetCategories, assetSubCategories, statusCategories, statusOptions } = this.data

    // 获取当前选择的分类值
    const selectedCategoryL1 = assetCategories[categoryIndex[0]].value
    const selectedCategoryL2 = assetSubCategories[categoryIndex[0]][categoryIndex[1]].value

    // 过滤资产
    let filteredAssets = assets.filter(asset => {
      if (searchKeyword && !asset.name.includes(searchKeyword)) {
        return false
      }
      
      // 分类过滤
      if (categoryIndex[0] > 0) { // 不是"全部类别"
        if (categoryIndex[1] === 0) {
          // 选择了一级分类的"全部"，只过滤一级分类
          if (asset.categoryL1 !== selectedCategoryL1) {
            return false
          }
        } else {
          // 选择了具体的二级分类，同时过滤一级和二级
          if (asset.categoryL1 !== selectedCategoryL1 || asset.categoryL2 !== selectedCategoryL2) {
            return false
          }
        }
      }
      
      // 状态筛选：双栏选择器
      const selectedStatusCategory = statusCategories[statusIndex[0]].value
      const selectedStatus = statusOptions[statusIndex[0]][statusIndex[1]].value
      
      if (selectedStatusCategory === 'liability') {
        // 如果选择了负债状态，则不显示资产
        return false
      }
      
      if (selectedStatusCategory === 'asset' && selectedStatus !== 'all' && asset.status !== selectedStatus) {
        return false
      }
      return true
    })

    // 过滤负债（暂时使用相同的分类，后续需要独立的负债分类筛选）
    let filteredLiabilities = liabilities.filter(liability => {
      if (searchKeyword && !liability.name.includes(searchKeyword)) {
        return false
      }
      
      // 分类过滤 - 负债暂时使用资产分类逻辑，实际应该有独立的负债分类
      if (categoryIndex[0] > 0) { // 不是"全部类别"
        if (categoryIndex[1] === 0) {
          // 选择了一级分类的"全部"，只过滤一级分类
          if (liability.categoryL1 !== selectedCategoryL1) {
            return false
          }
        } else {
          // 选择了具体的二级分类，同时过滤一级和二级
          if (liability.categoryL1 !== selectedCategoryL1 || liability.categoryL2 !== selectedCategoryL2) {
            return false
          }
        }
      }
      
      // 状态筛选：双栏选择器
      const selectedStatusCategory = statusCategories[statusIndex[0]].value
      const selectedStatus = statusOptions[statusIndex[0]][statusIndex[1]].value
      
      if (selectedStatusCategory === 'asset') {
        // 如果选择了资产状态，则不显示负债
        return false
      }
      
      if (selectedStatusCategory === 'liability' && selectedStatus !== 'all' && liability.status !== selectedStatus) {
        return false
      }
      return true
    })

    // 排序
    const sortField = sortFieldOptions[sortFieldIndex].value
    const sortOrder = sortOrderOptions[sortOrderIndex].value
    
    const sortFunction = (a, b) => {
      let valueA, valueB
      
      switch (sortField) {
        case 'amount':
          valueA = a.amountValue
          valueB = b.amountValue
          break
        case 'days':
          valueA = a.daysValue
          valueB = b.daysValue
          break
        case 'purchaseDate':
          valueA = a.purchaseDateValue
          valueB = b.purchaseDateValue
          break
        case 'dailyCost':
          valueA = a.dailyCostValue
          valueB = b.dailyCostValue
          break
        case 'createTime':
        default:
          // 默认排序：工作收入置顶，其他按添加时间降序
          const isWorkA = a.categoryL1 === 'work_income'
          const isWorkB = b.categoryL1 === 'work_income'
          
          // 如果一个是工作收入，一个不是，工作收入排在前面
          if (isWorkA && !isWorkB) return -1
          if (!isWorkA && isWorkB) return 1
          
          // 都是工作收入或都不是工作收入，按创建时间降序
          valueA = new Date(a.createTime).getTime()
          valueB = new Date(b.createTime).getTime()
          return valueB - valueA  // 固定降序
      }
      
      // 其他排序字段才使用升序或降序选择
      if (sortOrder === 'asc') {
        return valueA - valueB
      } else {
        return valueB - valueA
      }
    }
    
    filteredAssets.sort(sortFunction)
    filteredLiabilities.sort(sortFunction)

    this.setData({
      filteredAssets,
      filteredLiabilities
    })
  },

  chooseAvatar() {
    // 跳转到个人中心页面
    wx.navigateTo({
      url: '/pages/profile/profile'
    })
  },

  // 计算创建以来的天数
  calculateDaysSinceCreate(createTime) {
    if (!createTime) return 0
    const now = new Date()
    const createDate = new Date(createTime)
    const diffMs = now - createDate
    return Math.floor(diffMs / (1000 * 60 * 60 * 24))
  },

  // 获取购买日期的数值（用于排序）
  getPurchaseDateValue(createDate, createTime) {
    if (createDate) {
      return new Date(createDate).getTime()
    } else if (createTime) {
      return new Date(createTime).getTime()
    }
    return 0
  },

  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    })
    this.updateFilteredData()
  },

  // 排序选择器变化事件
  onSortChange(e) {
    const [sortFieldIndex, sortOrderIndex] = e.detail.value
    
    // 如果选择默认排序，强制设置为降序（但不影响实际排序逻辑）
    const finalSortOrderIndex = sortFieldIndex === 0 ? 0 : sortOrderIndex
    
    this.setData({
      sortFieldIndex: sortFieldIndex,
      sortOrderIndex: finalSortOrderIndex
    })
    this.updateFilteredData()
  },

  // 分类选择器变化事件
  onCategoryChange(e) {
    this.setData({
      categoryIndex: e.detail.value
    })
    this.updateFilteredData()
  },

  // 分类选择器列变化事件
  onCategoryColumnChange(e) {
    const { column, value } = e.detail
    const categoryIndex = [...this.data.categoryIndex]
    
    if (column === 0) {
      // 一级分类变化，重置二级分类为0
      categoryIndex[0] = value
      categoryIndex[1] = 0
    } else {
      // 二级分类变化
      categoryIndex[1] = value
    }
    
    this.setData({
      categoryIndex: categoryIndex
    })
  },

  onStatusChange(e) {
    const statusIndex = e.detail.value
    this.setData({
      statusIndex: statusIndex
    })
    this.updateFilteredData()
  },

  onStatusColumnChange(e) {
    const { column, value } = e.detail
    const statusIndex = this.data.statusIndex
    
    if (column === 0) {
      // 第一栏改变时，重置第二栏为0
      statusIndex[0] = value
      statusIndex[1] = 0
      this.setData({
        statusIndex: statusIndex
      })
      // 立即更新筛选结果
      this.updateFilteredData()
    }
  },

  addAsset() {
    wx.navigateTo({
      url: '/pages/edit/edit?type=asset'
    })
  },

  addLiability() {
    wx.navigateTo({
      url: '/pages/edit/edit?type=liability'
    })
  },

  viewDetail(e) {
    const { item, type } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/detail/detail?type=${type}&id=${item.id}`
    })
  },

  getCategoryName(categoryL1, categoryL2, isAsset = true) {
    // 工作收入特殊处理：直接返回二级分类的标签（本职工作/兼职工作）
    if (categoryL1 === 'work_income') {
      const l2Categories = AccountingCategories.getAssetL2Categories('work_income')
      const level2 = l2Categories.find(cat => cat.value === categoryL2)
      if (level2 && categoryL2 !== 'all') {
        return level2.label  // 直接返回"本职工作"或"兼职工作"
      }
      return '工作收入'  // 默认返回"工作收入"
    }
    
    // 根据资产或负债选择对应的分类体系
    const { assetCategories, assetSubCategories, liabilityCategories, liabilitySubCategories } = this.data
    const categories = isAsset ? assetCategories : liabilityCategories
    const subCategories = isAsset ? assetSubCategories : liabilitySubCategories
    
    // 查找一级分类
    const level1 = categories.find(cat => cat.value === categoryL1)
    if (!level1) return '其他'
    
    const level1Index = categories.findIndex(cat => cat.value === categoryL1)
    if (level1Index === -1) return level1.label
    
    // 查找二级分类
    const level2List = subCategories[level1Index] || []
    const level2 = level2List.find(cat => cat.value === categoryL2)
    
    if (categoryL2 === 'all' || !level2) {
      return level1.label
    }
    
    return `${level1.label} - ${level2.label}`
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

  formatNumber(num) {
    if (typeof num !== 'number') return '0.00'
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  },

  // 退出登录功能已移至个人中心页面
  
  // 浮动按钮点击事件 - 直接跳转到资产编辑页面
  handleFloatBtnClick() {
    // 直接跳转到添加资产页面，用户可以在编辑页面选择资产或负债类型
    wx.navigateTo({
      url: '/pages/edit/edit'
    })
  },

  // 格式化工作收入的入职日期
  formatWorkStartDate(asset) {
    // 优先使用入职日期，如果没有则使用创建日期
    const startDate = asset.startDate || asset.createDate
    if (startDate) {
      const date = new Date(startDate)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day} 入职`
    } else if (asset.createTime) {
      // 如果都没有，使用创建时间
      return StorageManager.formatPurchaseDate(null, asset.createTime) + ' 入职'
    }
    return '入职日期未知'
  },

  // 计算工作收入的实际月收入
  calculateActualMonthlyIncome(asset) {
    const baseIncome = parseFloat(asset.monthlyIncome) || 0
    const salaryStructure = asset.salaryStructure || 'monthly_salary'
    const dailyWorkHours = parseFloat(asset.dailyWorkHours) || 8
    const weeklyWorkDays = parseFloat(asset.weeklyWorkDays) || 5
    const workingMonthsPerYear = parseFloat(asset.workingMonthsPerYear) || 12
    
    // 计算每月工作天数和小时数
    // 每年工作天数 = 每周工作天数 × 52周 × (工作月数/12)
    const annualWorkDays = weeklyWorkDays * 52 * (workingMonthsPerYear / 12)
    const monthlyWorkDays = annualWorkDays / 12
    const monthlyWorkHours = monthlyWorkDays * dailyWorkHours
    
    let actualMonthlyIncome = 0
    
    switch (salaryStructure) {
      case 'hourly_wage':
        // 时薪 × 每月工作小时数
        actualMonthlyIncome = baseIncome * monthlyWorkHours
        break
        
      case 'daily_wage':
        // 日薪 × 每月工作天数
        actualMonthlyIncome = baseIncome * monthlyWorkDays
        break
        
      case 'monthly_salary':
      default:
        // 月薪直接使用
        actualMonthlyIncome = baseIncome
        break
    }
    
    // 添加固定额外收入
    const fixedAllowances = parseFloat(asset.fixedAllowances) || 0
    actualMonthlyIncome += fixedAllowances
    
    return actualMonthlyIncome.toFixed(2)
  },

  // 计算消费型资产的每日成本
  calculateDailyCost(asset) {
    // 月度运营成本除以30天
    const monthlyOperatingCost = parseFloat(asset.monthlyOperatingCost) || 0
    const dailyOperatingCost = monthlyOperatingCost / 30
    
    // 折旧成本计算
    let dailyDepreciation = 0
    const originalValue = parseFloat(asset.originalValue) || parseFloat(asset.initialValue) || 0
    
    if (originalValue > 0) {
      let depreciationRate = 0
      
      // 优先使用用户设置的折旧率
      if (asset.depreciationRate) {
        depreciationRate = parseFloat(asset.depreciationRate) / 100
      } else {
        // 使用系统默认折旧率
        depreciationRate = DepreciationEngine.getDepreciationRate(asset.categoryL3 || asset.categoryL2 || '')
      }
      
      // 年折旧额 / 365天
      dailyDepreciation = (originalValue * depreciationRate) / 365
    }
    
    const totalDailyCost = dailyOperatingCost + dailyDepreciation
    
    // 如果成本太小，返回最小显示值
    if (totalDailyCost < 0.01 && originalValue > 0) {
      return "0.01"  // 最小显示1分钱，表示该资产确实有成本
    }
    
    return totalDailyCost.toFixed(2)
  }
})
