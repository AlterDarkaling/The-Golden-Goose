const StorageManager = require('../../utils/storage.js')
const AccountingCategories = require('../../utils/accountingCategories.js')

Page({
  data: {
    type: '', // 强制用户选择
    isEdit: false,
    editId: '',
    categoryIndex: [0, 0],
    statusIndex: 0,
    incomeTypeIndex: 0,
    debtTypeIndex: 0,
    isConsumerAsset: false, // 是否为消费性资产
    formData: {
      name: '',
      status: 'active',
      // 资产字段
      initialValue: '',
      currentValue: '',
      monthlyIncome: '', // 新增：月收入（核心）
      annualReturn: '',
      // 消费性资产特有字段
      monthlyOperatingCost: '', // 月度运营成本
      depreciationRate: '', // 年折旧率
      // 工作收入特有字段
      workUnit: '', // 工作单位
      position: '', // 职位
      // 增值型资产特有字段
      incomeType: 'monthly_income', // 收入方式：monthly_income(产生收入) 或 annual_return(年化收益)
      // 负债字段
      originalAmount: '',
      currentAmount: '',
      monthlyPayment: '', // 新增：月还款额（核心）
      annualRate: '',
      debtType: 'consumer', // 新增：负债性质
      notes: '',
      createDate: '',
      categoryL1: '',
      categoryL2: ''
    },
    // 资产状态选项
    assetStatusOptions: [
      { label: '使用中', value: 'active' },
      { label: '吃灰中', value: 'dusty' },
      { label: '出租中', value: 'rented' },
      { label: '已损坏', value: 'damaged' },
      { label: '已处理', value: 'processed' },
      { label: '已送人', value: 'gifted' },
      { label: '已卖出', value: 'sold' },
      { label: '已丢失', value: 'lost' }
    ],
    // 负债状态选项
    liabilityStatusOptions: [
      { label: '正常还款', value: 'normal' },
      { label: '已还清', value: 'paid_off' },
      { label: '逾期未还', value: 'overdue' },
      { label: '提前还清', value: 'prepaid' }
    ],
    // 分类数据将根据资产/负债类型动态设置
    categoryLevelOne: [],
    categoryLevelTwo: [],
    categoryDisplayText: '请选择分类',
    // 收入类型选项（资产）
    incomeTypeOptions: [
      { label: '租金收入', value: 'rental' },
      { label: '股息分红', value: 'dividend' },
      { label: '利息收入', value: 'interest' },
      { label: '经营收入', value: 'business' },
      { label: '版权收入', value: 'royalty' },
      { label: '其他收入', value: 'other' }
    ],
    // 负债性质选项（负债）
    debtTypeOptions: [
      { label: '消费性负债', value: 'consumer' },
      { label: '投资性负债', value: 'investment' },
      { label: '其他负债', value: 'other' }
    ],
    // 还款方式选项
    paymentTypeOptions: [
      { label: '等额本息', value: 'equal_payment' },
      { label: '等额本金', value: 'equal_principal' }
    ],
    paymentTypeIndex: 0,
    // 账单日选项
    billDayOptions: Array.from({length: 28}, (_, i) => `${i + 1}日`),
    // 增值型资产收入方式选项
    incomeTypeOptions: ['产生收入', '年化收益'],
    incomeTypeIndex: 0,
    // 当前状态选项（根据类型动态设置）
    currentStatusOptions: []
  },

  // 计算属性：根据类型获取状态选项
  getCurrentStatusOptions() {
    return this.data.formData.type === 'asset' ? this.data.assetStatusOptions : this.data.liabilityStatusOptions
  },

  onLoad(options) {
    const isEdit = !!options.id
    this.setData({
      isEdit: isEdit,
      editId: options.id || ''
    })
    
    if (isEdit) {
      // 编辑模式：从URL参数或存储中获取类型
      const type = options.type || 'asset'
      const currentStatusOptions = type === 'asset' ? this.data.assetStatusOptions : this.data.liabilityStatusOptions
      this.setData({ 
        type: type,
        currentStatusOptions: currentStatusOptions
      })
      this.setupFormByType(type)
      this.loadEditData()
    } else {
      // 新增模式：用户必须先选择类型
      this.initFormData()
    }
  },

  // 选择类型（资产或负债）
  selectType(e) {
    const type = e.currentTarget.dataset.type
    const currentStatusOptions = type === 'asset' ? this.data.assetStatusOptions : this.data.liabilityStatusOptions
    this.setData({ 
      type: type,
      statusIndex: 0,  // 重置状态选择索引
      'formData.status': type === 'asset' ? 'active' : 'normal',  // 设置默认状态
      currentStatusOptions: currentStatusOptions  // 设置当前状态选项
    })
    this.setupFormByType(type)
    this.initFormData() // 确保有默认日期
  },

  // 根据类型设置表单
  setupFormByType(type) {
    if (type === 'asset') {
      const assetL1Categories = AccountingCategories.getAssetL1Categories()
      this.setData({
        categoryLevelOne: [
          { label: '全部类别', value: 'all' },
          ...assetL1Categories
        ],
        categoryLevelTwo: (() => {
          const categoryLevelTwo = [[{ label: '全部', value: 'all' }]]
          assetL1Categories.forEach(l1Category => {
            const l2Categories = AccountingCategories.getAssetL2Categories(l1Category.value)
            categoryLevelTwo.push([
              { label: '全部', value: 'all' },
              ...l2Categories
            ])
          })
          return categoryLevelTwo
        })()
      })
    } else if (type === 'liability') {
      const liabilityL1Categories = AccountingCategories.getLiabilityL1Categories()
      
      this.setData({
        categoryLevelOne: [
          { label: '全部类别', value: 'all' },
          ...liabilityL1Categories
        ],
        categoryLevelTwo: (() => {
          const categoryLevelTwo = [[{ label: '全部', value: 'all' }]]
          liabilityL1Categories.forEach(l1Category => {
            const l2Categories = AccountingCategories.getLiabilityL2Categories(l1Category.value)
            categoryLevelTwo.push([
              { label: '全部', value: 'all' },
              ...l2Categories
            ])
          })
          return categoryLevelTwo
        })()
      })
    }
    this.updateCategoryDisplayText()
  },

  // 更新分类显示文本
  updateCategoryDisplayText() {
    const { categoryIndex, categoryLevelOne, categoryLevelTwo } = this.data
    let displayText = '请选择分类'
    
    if (categoryLevelOne.length > 0) {
      const level1 = categoryLevelOne[categoryIndex[0]]
      if (level1 && categoryIndex[0] > 0) {
        const level2List = categoryLevelTwo[categoryIndex[0]] || []
        const level2 = level2List[categoryIndex[1]]
        if (level2 && categoryIndex[1] > 0) {
          displayText = `${level1.label} - ${level2.label}`
        } else {
          displayText = level1.label
        }
      }
    }
    
    this.setData({ categoryDisplayText: displayText })
  },

  initFormData() {
    const now = new Date()
    const createDate = now.getFullYear() + '-' + 
      String(now.getMonth() + 1).padStart(2, '0') + '-' + 
      String(now.getDate()).padStart(2, '0')
    
    this.setData({
      'formData.createDate': createDate
    })
  },

  loadEditData() {
    const { editId, type } = this.data
    const dataKey = type === 'asset' ? 'assets_data' : 'liabilities_data'
    
    try {
      const items = wx.getStorageSync(dataKey) || []
      const item = items.find(item => item.id === editId)
      
      if (item) {
        this.setData({
          formData: {
            ...item,
            createDate: item.createDate || item.createTime?.split('T')[0] || this.data.formData.createDate
          }
        })
        
        // 设置分类索引
        this.setCategoryFromData(item.categoryL1, item.categoryL2)
        
        // 设置状态索引
        const statusIndex = this.data.currentStatusOptions.findIndex(option => option.value === item.status)
        this.setData({ statusIndex: statusIndex >= 0 ? statusIndex : 0 })
        
        // 如果是增值型资产，设置收入方式索引
        if (item.categoryL1 === 'physical_assets' && item.categoryL2 === 'appreciating_assets') {
          const incomeTypeIndex = item.incomeType === 'annual_return' ? 1 : 0
          this.setData({ incomeTypeIndex })
        }
      }
    } catch (error) {
      console.error('加载编辑数据失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
    }
  },

  setCategoryFromData(categoryL1, categoryL2) {
    const { categoryLevelOne, categoryLevelTwo } = this.data
    let level1Index = 0
    let level2Index = 0
    
    // 查找一级分类索引
    const level1Found = categoryLevelOne.findIndex(cat => cat.value === categoryL1)
    if (level1Found !== -1) {
      level1Index = level1Found
      
      // 查找二级分类索引
      const level2List = categoryLevelTwo[level1Index] || []
      const level2Found = level2List.findIndex(cat => cat.value === categoryL2)
      if (level2Found !== -1) {
        level2Index = level2Found
      }
    }
    
    this.setData({
      categoryIndex: [level1Index, level2Index]
    })
    this.updateCategoryDisplayText()
  },

  // 表单输入处理
  onNameInput(e) {
    this.setData({
      'formData.name': e.detail.value
    })
  },

  onInitialValueInput(e) {
    this.setData({
      'formData.initialValue': e.detail.value
    })
  },

  onOriginalValueInput(e) {
    this.setData({
      'formData.originalValue': e.detail.value
    })
  },

  onCurrentValueInput(e) {
    this.setData({
      'formData.currentValue': e.detail.value
    })
  },

  onQuantityInput(e) {
    this.setData({
      'formData.quantity': e.detail.value
    })
  },

  onCostPriceInput(e) {
    this.setData({
      'formData.costPrice': e.detail.value
    })
  },

  onCurrentPriceInput(e) {
    this.setData({
      'formData.currentPrice': e.detail.value
    })
  },

  onMaintenanceCostInput(e) {
    this.setData({
      'formData.maintenanceCost': e.detail.value
    })
  },

  onUsefulLifeInput(e) {
    this.setData({
      'formData.usefulLife': e.detail.value
    })
  },

  onMonthlyIncomeInput(e) {
    // 消费性资产不应该有收入
    const { isConsumerAsset } = this.data
    if (isConsumerAsset) {
      wx.showToast({
        title: '消费性资产不产生收入',
        icon: 'none'
      })
      return
    }
    
    this.setData({
      'formData.monthlyIncome': e.detail.value
    })
  },

  // 消费性资产特有字段输入处理
  onMonthlyOperatingCostInput(e) {
    this.setData({
      'formData.monthlyOperatingCost': e.detail.value
    })
  },

  onDepreciationRateInput(e) {
    this.setData({
      'formData.depreciationRate': e.detail.value
    })
  },

  onAnnualReturnInput(e) {
    // 消费性资产不应该有年化收益率
    const { isConsumerAsset } = this.data
    if (isConsumerAsset) {
      wx.showToast({
        title: '消费性资产不产生收益',
        icon: 'none'
      })
      return
    }
    
    this.setData({
      'formData.annualReturn': e.detail.value
    })
  },

  onOriginalAmountInput(e) {
    this.setData({
      'formData.originalAmount': e.detail.value
    })
  },

  onCurrentAmountInput(e) {
    this.setData({
      'formData.currentAmount': e.detail.value
    })
  },

  onMinimumPaymentInput(e) {
    this.setData({
      'formData.minimumPayment': e.detail.value
    })
  },

  onDailyRateInput(e) {
    this.setData({
      'formData.dailyRate': e.detail.value
    })
  },

  onMonthsInput(e) {
    this.setData({
      'formData.months': e.detail.value
    })
  },

  onRelatedAssetNameInput(e) {
    this.setData({
      'formData.relatedAssetName': e.detail.value
    })
  },

  onServiceMonthsInput(e) {
    this.setData({
      'formData.serviceMonths': e.detail.value
    })
  },

  onWorkUnitInput(e) {
    this.setData({
      'formData.workUnit': e.detail.value
    })
  },

  onPositionInput(e) {
    this.setData({
      'formData.position': e.detail.value
    })
  },

  // 日期选择器处理
  onServiceStartDateChange(e) {
    this.setData({
      'formData.serviceStartDate': e.detail.value
    })
  },

  onServiceEndDateChange(e) {
    this.setData({
      'formData.serviceEndDate': e.detail.value
    })
  },

  onRepaymentDateChange(e) {
    this.setData({
      'formData.repaymentDate': e.detail.value
    })
  },

  onLoanDateChange(e) {
    this.setData({
      'formData.loanDate': e.detail.value
    })
  },

  onDueDateChange(e) {
    this.setData({
      'formData.dueDate': e.detail.value
    })
  },

  // 选择器处理
  onBillDayChange(e) {
    this.setData({
      'formData.billDay': e.detail.value
    })
  },

  onPaymentTypeChange(e) {
    this.setData({
      paymentTypeIndex: e.detail.value,
      'formData.paymentType': this.data.paymentTypeOptions[e.detail.value].value
    })
  },

  onIncomeTypeChange(e) {
    const index = parseInt(e.detail.value)
    const incomeType = index === 0 ? 'monthly_income' : 'annual_return'
    
    this.setData({
      incomeTypeIndex: index,
      'formData.incomeType': incomeType
    })
    
    // 切换收入方式时清空对应字段
    if (incomeType === 'monthly_income') {
      this.setData({ 'formData.annualReturn': '' })
    } else {
      this.setData({ 'formData.monthlyIncome': '' })
    }
  },

  onMonthlyPaymentInput(e) {
    this.setData({
      'formData.monthlyPayment': e.detail.value
    })
  },

  onAnnualRateInput(e) {
    this.setData({
      'formData.annualRate': e.detail.value
    })
  },

  onNotesInput(e) {
    this.setData({
      'formData.notes': e.detail.value
    })
  },

  onCreateDateChange(e) {
    this.setData({
      'formData.createDate': e.detail.value
    })
  },

  // 选择器处理
  onCategoryChange(e) {
    const { categoryLevelOne, categoryLevelTwo } = this.data
    const [level1Index, level2Index] = e.detail.value
    
    const categoryL1 = categoryLevelOne[level1Index]?.value || ''
    const categoryL2 = categoryLevelTwo[level1Index]?.[level2Index]?.value || ''
    
    // 判断是否为消费性资产（新的会计分类）
    const isConsumerAsset = categoryL1 === 'physical_assets' && categoryL2 === 'consumer_assets'
    
    this.setData({
      categoryIndex: [level1Index, level2Index],
      'formData.categoryL1': categoryL1,
      'formData.categoryL2': categoryL2,
      isConsumerAsset
    })
    
    // 如果是消费性资产，清空收入相关字段，因为消费性资产不产生收入
    if (isConsumerAsset) {
      this.setData({
        'formData.monthlyIncome': 0,
        'formData.annualReturn': 0
      })
    }

    // 如果是增值型资产，初始化收入方式索引
    const isAppreciatingAsset = categoryL1 === 'physical_assets' && categoryL2 === 'appreciating_assets'
    if (isAppreciatingAsset) {
      // 根据当前incomeType设置对应的索引
      const currentIncomeType = this.data.formData.incomeType
      const incomeTypeIndex = currentIncomeType === 'annual_return' ? 1 : 0
      this.setData({ incomeTypeIndex })
    }
    
    this.updateCategoryDisplayText()
  },

  onCategoryColumnChange(e) {
    const { column, value } = e.detail
    const { categoryIndex } = this.data
    
    if (column === 0) {
      // 一级分类改变，重置二级分类
      this.setData({
        categoryIndex: [value, 0]
      })
    }
  },

  onStatusChange(e) {
    const status = this.data.currentStatusOptions[e.detail.value]?.value || (this.data.formData.type === 'asset' ? 'active' : 'normal')
    this.setData({
      statusIndex: e.detail.value,
      'formData.status': status
    })
  },

  onDebtTypeChange(e) {
    const debtType = this.data.debtTypeOptions[e.detail.value]?.value || 'consumer'
    this.setData({
      debtTypeIndex: e.detail.value,
      'formData.debtType': debtType
    })
  },

  // 表单验证
  validateForm() {
    const { formData, type } = this.data
    
    if (!type) {
      wx.showToast({
        title: '请选择项目类型',
        icon: 'error'
      })
      return false
    }
    
    if (!formData.name.trim()) {
      wx.showToast({
        title: '请输入名称',
        icon: 'error'
      })
      return false
    }
    
    if (!formData.categoryL1 || !formData.categoryL2) {
      wx.showToast({
        title: '请选择分类',
        icon: 'error'
      })
      return false
    }
    
    if (type === 'asset') {
      const l1 = formData.categoryL1
      const l2 = formData.categoryL2
      
      // 统一获取原值（兼容旧字段）
      const originalValue = formData.originalValue || formData.initialValue
      
      // 流动资产 - 现金：需要账户余额
      if (l1 === 'current_assets' && l2 === 'cash_assets') {
        if (!formData.currentValue) {
          wx.showToast({ title: '请输入账户余额', icon: 'error' })
          return false
        }
      }
      // 流动资产 - 短期理财：需要原值与年化收益率
      else if (l1 === 'current_assets' && l2 === 'short_term_investment') {
        if (!originalValue) {
          wx.showToast({ title: '请输入购买成本', icon: 'error' })
          return false
        }
        if (!formData.annualRate) {
          wx.showToast({ title: '请输入年化收益率', icon: 'error' })
          return false
        }
      }
      // 金融资产 - 股票/基金：原始成本 + 当前价格
      else if (l1 === 'financial_assets' && l2 === 'equity_fund') {
        if (!originalValue || !formData.currentPrice) {
          wx.showToast({ title: '请填写原始成本和当前价格', icon: 'error' })
          return false
        }
      }
      // 金融资产 - 固定收益：原始成本 + 年化收益率
      else if (l1 === 'financial_assets' && l2 === 'fixed_income') {
        if (!originalValue || !formData.annualReturn) {
          wx.showToast({ title: '请填写原始成本和年化收益率', icon: 'error' })
          return false
        }
      }
      // 其他资产 - 无形资产：需要原值与有效期
      else if (l1 === 'other_assets' && l2 === 'intangible_assets') {
        if (!originalValue) {
          wx.showToast({ title: '请输入取得成本', icon: 'error' })
          return false
        }
        if (!formData.usefulLife) {
          wx.showToast({ title: '请输入有效期(年)', icon: 'error' })
          return false
        }
      }
      // 其他资产 - 预付资产：需要原值与服务周期
      else if (l1 === 'other_assets' && l2 === 'prepaid_assets') {
        if (!originalValue) {
          wx.showToast({ title: '请输入预付金额', icon: 'error' })
          return false
        }
        if (!formData.serviceStartDate || !formData.serviceEndDate) {
          wx.showToast({ title: '请选择服务起止日期', icon: 'error' })
          return false
        }
      }
      // 工作收入：需要月收入
      else if (l1 === 'work_income') {
        if (!formData.monthlyIncome) {
          wx.showToast({ title: '请输入月收入', icon: 'error' })
          return false
        }
      }
      // 增值型资产：需要原始价值 + 收入方式对应字段
      else if (l1 === 'physical_assets' && l2 === 'appreciating_assets') {
        if (!originalValue) {
          wx.showToast({ title: '请输入原始价值', icon: 'error' })
          return false
        }
        if (formData.incomeType === 'monthly_income') {
          if (!formData.monthlyIncome) {
            wx.showToast({ title: '请输入月收入', icon: 'error' })
            return false
          }
        } else if (formData.incomeType === 'annual_return') {
          if (!formData.annualReturn) {
            wx.showToast({ title: '请输入年化收益率', icon: 'error' })
            return false
          }
        }
      }
      // 其余资产（含消费型实物）：至少需要原始价值
      else {
        if (!originalValue) {
          wx.showToast({ title: '请输入原始价值', icon: 'error' })
          return false
        }
      }
      // 不再强制校验月收入/年化收益率
    } else {
      if (!formData.originalAmount) {
        wx.showToast({
          title: '请输入原始金额',
          icon: 'error'
        })
        return false
      }
      
      if (!formData.monthlyPayment) {
        wx.showToast({
          title: '请输入月还款额（现金流核心）',
          icon: 'error'
        })
        return false
      }
      
      // 根据负债类型进行特殊验证
      if (formData.categoryL1 === 'long_term_liabilities') {
        // 长期负债：需要年利率
        if (!formData.annualRate) {
          wx.showToast({
            title: '请输入年利率',
            icon: 'error'
          })
          return false
        }
      } else if (formData.categoryL1 === 'current_liabilities') {
        // 流动负债的特殊验证
        if (formData.categoryL2 === 'short_term_loan') {
          // 短期借款：需要日利率
          if (!formData.dailyRate) {
            wx.showToast({
              title: '请输入日利率',
              icon: 'error'
            })
            return false
          }
        }
        // 信用卡负债不需要特殊验证，只需要基本的原始金额和月还款额
      }
    }
    
    return true
  },

  // 保存数据
  handleSave() {
    if (!this.validateForm()) {
      return
    }
    
    const { formData, type, isEdit, editId } = this.data
    
    // 计算衍生字段
    const { isConsumerAsset } = this.data
    const monthlyIncome = parseFloat(formData.monthlyIncome) || 0
    const monthlyPayment = parseFloat(formData.monthlyPayment) || 0
    const monthlyOperatingCost = parseFloat(formData.monthlyOperatingCost) || 0
    
    // 消费性资产特殊处理：运营成本计入支出，不产生收入
    let actualMonthlyIncome = monthlyIncome
    let actualMonthlyPayment = monthlyPayment
    
    if (type === 'asset' && isConsumerAsset) {
      actualMonthlyIncome = 0 // 消费性资产不产生收入
      actualMonthlyPayment = monthlyOperatingCost // 运营成本作为支出
    }
    
    const saveData = {
      ...formData,
      id: isEdit ? editId : `${type}_${Date.now()}`,
      name: formData.name.trim(),
      // 统一原值（兼容旧字段）：
      originalValue: parseFloat(formData.originalValue || formData.initialValue) || 0,
      // 转换数值字段
      initialValue: parseFloat(formData.originalValue || formData.initialValue) || 0,
      currentValue: (formData.categoryL1 === 'current_assets' && formData.categoryL2 === 'cash_assets')
        ? (parseFloat(formData.currentValue) || 0)
        : (parseFloat(formData.currentValue) || parseFloat(formData.originalValue || formData.initialValue) || 0),
      monthlyIncome: actualMonthlyIncome,
      dailyIncome: actualMonthlyIncome / 30,
      annualReturn: parseFloat(formData.annualReturn) || 0,
      originalAmount: parseFloat(formData.originalAmount) || 0,
      currentAmount: parseFloat(formData.currentAmount) || parseFloat(formData.originalAmount) || 0,
      monthlyPayment: actualMonthlyPayment,
      dailyCost: actualMonthlyPayment / 30,
      annualRate: parseFloat(formData.annualRate) || 0,
      // 消费性资产特有字段
      monthlyOperatingCost: monthlyOperatingCost,
      depreciationRate: parseFloat(formData.depreciationRate) || 0,
      isConsumerAsset: isConsumerAsset,
      // 日期字段
      createDate: formData.createDate || new Date().toISOString().split('T')[0],
      purchaseDate: formData.createDate || new Date().toISOString().split('T')[0],
      createTime: isEdit ? (formData.createTime || new Date().toISOString()) : new Date().toISOString()
    }
    
    try {
      if (type === 'asset') {
        if (isEdit) {
          StorageManager.updateAsset(editId, saveData)
        } else {
          StorageManager.addAsset(saveData)
        }
      } else {
        if (isEdit) {
          StorageManager.updateLiability(editId, saveData)
        } else {
          StorageManager.addLiability(saveData)
        }
      }
      
      wx.showToast({
        title: isEdit ? '修改成功' : '添加成功',
        icon: 'success'
      })
      
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      
    } catch (error) {
      console.error('保存失败:', error)
      wx.showToast({
        title: '保存失败',
        icon: 'error'
      })
    }
  },

  handleCancel() {
    wx.navigateBack()
  }
})