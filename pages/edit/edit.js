const StorageManager = require('../../utils/storage.js')

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
      incomeType: 'rental', // 新增：收入类型
      // 消费性资产特有字段
      monthlyOperatingCost: '', // 月度运营成本
      depreciationRate: '', // 年折旧率
      // 负债字段
      initialAmount: '',
      currentAmount: '',
      monthlyPayment: '', // 新增：月还款额（核心）
      annualRate: '',
      debtType: 'consumer', // 新增：负债性质
      notes: '',
      createDate: '',
      categoryL1: '',
      categoryL2: ''
    },
    statusOptions: [
      { label: '使用中', value: 'active' },
      { label: '暂停', value: 'paused' },
      { label: '已完成', value: 'completed' },
      { label: '吃灰中', value: 'dusty' },
      { label: '出租中', value: 'rented' },
      { label: '已损坏', value: 'damaged' },
      { label: '已处理', value: 'processed' },
      { label: '已送人', value: 'gifted' },
      { label: '已卖出', value: 'sold' },
      { label: '已丢失', value: 'lost' }
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
    ]
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
      this.setData({ type: type })
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
    this.setData({ type: type })
    this.setupFormByType(type)
  },

  // 根据类型设置表单
  setupFormByType(type) {
    if (type === 'asset') {
      this.setData({
        categoryLevelOne: [
          { label: '全部类别', value: 'all' },
          { label: '现金流入型资产', value: 'cashflow_in' },
          { label: '潜在增值型资产', value: 'appreciation' },
          { label: '经营性资产', value: 'business' },
          { label: '其他资产', value: 'other_asset' }
        ],
        categoryLevelTwo: [
          [{ label: '全部', value: 'all' }],
          [
            { label: '全部', value: 'all' },
            { label: '出租房产', value: 'rental_property' },
            { label: '股息股票', value: 'dividend_stocks' },
            { label: '债券利息', value: 'bond_interest' },
            { label: '定期存款', value: 'fixed_deposit' },
            { label: '基金分红', value: 'fund_dividend' },
            { label: '专利授权', value: 'patent_license' },
            { label: '版权收入', value: 'copyright_income' },
            { label: '其他现金流', value: 'other_cashflow' }
          ],
          [
            { label: '全部', value: 'all' },
            { label: '投资房产', value: 'investment_property' },
            { label: '成长股票', value: 'growth_stocks' },
            { label: '贵金属', value: 'precious_metals' },
            { label: '收藏品', value: 'collectibles' },
            { label: '艺术品', value: 'artworks' },
            { label: '其他增值品', value: 'other_appreciation' }
          ],
          [
            { label: '全部', value: 'all' },
            { label: '实体店铺', value: 'physical_store' },
            { label: '网络生意', value: 'online_business' },
            { label: '生产设备', value: 'production_equipment' },
            { label: '运营车辆', value: 'business_vehicle' },
            { label: '办公设备', value: 'office_equipment' },
            { label: '其他经营', value: 'other_business' }
          ],
          [
            { label: '全部', value: 'all' },
            { label: '知识产权', value: 'intellectual_property' },
            { label: '数字资产', value: 'digital_assets' },
            { label: '其他', value: 'other' }
          ]
        ]
      })
    } else {
      this.setData({
        categoryLevelOne: [
          { label: '全部类别', value: 'all' },
          { label: '消费性负债', value: 'consumer_debt' },
          { label: '投资性负债', value: 'investment_debt' },
          { label: '其他负债', value: 'other_debt' }
        ],
        categoryLevelTwo: [
          [{ label: '全部', value: 'all' }],
          [
            { label: '全部', value: 'all' },
            { label: '信用卡账单', value: 'credit_card' },
            { label: '自用车贷', value: 'personal_car_loan' },
            { label: '消费贷款', value: 'consumer_loan' },
            { label: '自住房贷', value: 'home_mortgage' },
            { label: '装修贷款', value: 'renovation_loan' },
            { label: '其他消费', value: 'other_consumer' }
          ],
          [
            { label: '全部', value: 'all' },
            { label: '投资房贷', value: 'investment_mortgage' },
            { label: '股票融资', value: 'stock_margin' },
            { label: '经营贷款', value: 'business_loan' },
            { label: '设备贷款', value: 'equipment_loan' },
            { label: '其他投资贷', value: 'other_investment_loan' }
          ],
          [
            { label: '全部', value: 'all' },
            { label: '学费贷款', value: 'education_loan' },
            { label: '医疗负债', value: 'medical_debt' },
            { label: '税务负债', value: 'tax_debt' },
            { label: '其他', value: 'other' }
          ]
        ]
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

  onCurrentValueInput(e) {
    this.setData({
      'formData.currentValue': e.detail.value
    })
  },

  onMonthlyIncomeInput(e) {
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
    this.setData({
      'formData.annualReturn': e.detail.value
    })
  },

  onInitialAmountInput(e) {
    this.setData({
      'formData.initialAmount': e.detail.value
    })
  },

  onCurrentAmountInput(e) {
    this.setData({
      'formData.currentAmount': e.detail.value
    })
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
    
    // 判断是否为消费性资产
    const isConsumerAsset = categoryL1 === 'consumer_asset'
    
    this.setData({
      categoryIndex: [level1Index, level2Index],
      'formData.categoryL1': categoryL1,
      'formData.categoryL2': categoryL2,
      isConsumerAsset
    })
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
    const status = this.data.statusOptions[e.detail.value]?.value || 'active'
    this.setData({
      statusIndex: e.detail.value,
      'formData.status': status
    })
  },

  onIncomeTypeChange(e) {
    const incomeType = this.data.incomeTypeOptions[e.detail.value]?.value || 'rental'
    this.setData({
      incomeTypeIndex: e.detail.value,
      'formData.incomeType': incomeType
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
      if (!formData.initialValue) {
        wx.showToast({
          title: '请输入初始投入',
          icon: 'error'
        })
        return false
      }
      
      if (!formData.monthlyIncome) {
        wx.showToast({
          title: '请输入月收入（现金流核心）',
          icon: 'error'
        })
        return false
      }
      
      if (!formData.annualReturn) {
        wx.showToast({
          title: '请输入年化收益率',
          icon: 'error'
        })
        return false
      }
    } else {
      if (!formData.initialAmount) {
        wx.showToast({
          title: '请输入初始借款',
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
      
      if (!formData.annualRate) {
        wx.showToast({
          title: '请输入年利率',
          icon: 'error'
        })
        return false
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
      // 转换数值字段
      initialValue: parseFloat(formData.initialValue) || 0,
      currentValue: parseFloat(formData.currentValue) || parseFloat(formData.initialValue) || 0,
      monthlyIncome: actualMonthlyIncome,
      dailyIncome: actualMonthlyIncome / 30, // 计算日收入
      annualReturn: parseFloat(formData.annualReturn) || 0,
      initialAmount: parseFloat(formData.initialAmount) || 0,
      currentAmount: parseFloat(formData.currentAmount) || parseFloat(formData.initialAmount) || 0,
      monthlyPayment: actualMonthlyPayment,
      dailyCost: actualMonthlyPayment / 30, // 计算日成本
      annualRate: parseFloat(formData.annualRate) || 0,
      // 消费性资产特有字段
      monthlyOperatingCost: monthlyOperatingCost,
      depreciationRate: parseFloat(formData.depreciationRate) || 0,
      isConsumerAsset: isConsumerAsset,
      createTime: isEdit ? (formData.createTime || new Date().toISOString()) : new Date().toISOString()
    }
    
    try {
      if (type === 'asset') {
        StorageManager.saveAsset(saveData)
      } else {
        StorageManager.saveLiability(saveData)
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