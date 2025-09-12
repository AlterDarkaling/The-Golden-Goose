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
    showDepreciationModal: false, // 折旧率参考弹窗
    showLogoModal: false, // logo选择弹窗
    logoSelectorType: 'emoji', // 当前选择类型：emoji 或 image
    showSalaryHistoryModal: false, // 薪资历史管理弹窗
    // 教程系统
    showTutorial: false,
    tutorialStep: 0,
    currentTutorialStep: {},
    bubbleStyle: {
      position: 'fixed',
      opacity: '0',
      visibility: 'hidden'
    },
    arrowClass: 'arrow-up',
    tutorialSteps: [
      {
        title: '选择项目类型',
        content: '首先需要选择您要添加的是资产还是负债。\n\n💰 资产：能为您带来收入或具有价值的项目\n💸 负债：需要您支付费用或承担债务的项目',
        target: '.type-selection',
        position: 'center-bottom'
      },
      {
        title: '资产分类说明',
        content: '资产主要分为：\n\n🏢 投资性资产：股票、基金、债券等\n🏠 固定资产：房产、车辆等\n💼 工作收入：工资、奖金等\n🛍️ 消费性资产：电子产品、服装等',
        target: '.form-section',
        position: 'center-top'
      },
      {
        title: '负债分类说明', 
        content: '负债主要分为：\n\n🏠 房贷：购房贷款\n🚗 车贷：购车贷款\n💳 信用卡债务：信用卡欠款\n📚 教育贷款：助学贷款等\n💰 其他借款：个人借贷等',
        target: '.form-section',
        position: 'center-top'
      },
      {
        title: '填写基本信息',
        content: '为您的资产或负债起一个容易识别的名称，并选择合适的图标。这将帮助您在列表中快速找到它们。',
        target: '.form-group',
        position: 'center-bottom'
      },
      {
        title: '完成添加',
        content: '填写完所有必要信息后，点击保存按钮即可完成添加。您随时可以在详情页面中编辑这些信息。',
        target: '.button-group',
        position: 'center-top'
      }
    ],
    emojiCategories: {
      finance: ['💰', '💳', '💎', '💸', '💵', '💴', '💶', '💷', '🪙', '💹'],
      property: ['🏠', '🏢', '🏭', '🏪', '🚗', '🚙', '🚕', '🛻', '🏍️', '🚲'],
      electronics: ['📱', '💻', '⌚', '🖥️', '📺', '📷', '🎧', '⌨️', '🖱️', '💿'],
      fashion: ['👔', '👗', '👟', '👠', '👜', '🎒', '💍', '👑', '🕶️', '🧳'],
      lifestyle: ['🛏️', '🪑', '🛋️', '🚿', '🛁', '🔧', '🔨', '⚒️', '🛠️', '🔩']
    },
    formData: {
      name: '',
      status: 'active',
      // Logo字段
      logoType: '', // 'emoji' 或 'image'
      logoEmoji: '', // 选择的emoji
      logoUrl: '', // 上传的图片URL
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
      salaryStructure: '', // 薪资结构
      startDate: '', // 入职日期
      endDate: '', // 离职日期（可选）
      initialSalary: '', // 入职薪资（保留兼容性）
      salaryHistory: [], // 薪资历史记录
      dailyWorkHours: '8', // 每日工作时间（小时）
      weeklyWorkDays: '5', // 每周工作天数
      workingMonthsPerYear: '12', // 每年工作月数（默认12个月）
      // 额外收入管理
      fixedAllowances: '0', // 固定额外收入（津贴、补助等，月度金额）
      variableIncomeHistory: [], // 可变额外收入历史记录（提成、奖金等）
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
    
    // 新薪资记录数据
    newSalaryRecord: {
      effectiveDate: '',
      amount: '',
      reason: ''
    },
    // 可变收入管理
    showVariableIncomeModal: false,
    newVariableRecord: {
      date: '',
      amount: '',
      type: '',
      description: ''
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
    // 基础薪资结构选项（按时间单位从小到大排序：时、日、月）
    salaryStructureOptions: [
      { label: '时薪制', value: 'hourly_wage' },
      { label: '日薪制', value: 'daily_wage' },
      { label: '月薪制', value: 'monthly_salary' }
    ],
    // 可变收入类型选项
    variableIncomeTypes: [
      { label: '销售提成', value: 'commission' },
      { label: '绩效奖金', value: 'performance_bonus' },
      { label: '项目奖金', value: 'project_bonus' },
      { label: '年终奖', value: 'year_end_bonus' },
      { label: '加班费', value: 'overtime_pay' },
      { label: '其他奖励', value: 'other_reward' }
    ],
    // 分类数据将根据资产/负债类型动态设置
    categoryLevelOne: [],
    categoryLevelTwo: [],
    categoryDisplayText: '请选择分类',
    // 薪资结构选择索引
    salaryStructureIndex: -1,
    // 动态薪资输入标签
    salaryInputLabel: '当前月薪 *',
    salaryInputPlaceholder: '当前每月收入',
    // 薪资单位文本
    salaryUnitText: '/月',
    // 薪资历史记录弹窗标签
    salaryHistoryLabel: '月薪金额',
    salaryHistoryPlaceholder: '请输入月薪',
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
      // 检查是否是首次添加，如果是则显示教程
      this.checkFirstTimeAddition()
    }
  },

  onShow() {
    // 页面显示时的处理
  },

  // 检查是否首次添加资产负债
  checkFirstTimeAddition() {
    // 检查是否显示过编辑页教程
    const hasShownEditTutorial = wx.getStorageSync('edit_tutorial_shown') || false
    
    if (!hasShownEditTutorial) {
      // 延迟显示教程，确保页面渲染完成
      setTimeout(() => {
        this.startTutorial()
      }, 800)
    }
  },

  // 开始教程
  startTutorial() {
    this.setData({
      showTutorial: true,
      tutorialStep: 0,
      currentTutorialStep: this.data.tutorialSteps[0] || {}
    }, () => {
      setTimeout(() => {
        this.highlightTarget()
      }, 300)
    })
  },

  // 下一步教程
  nextTutorialStep() {
    const { tutorialStep, tutorialSteps } = this.data
    
    if (tutorialStep < tutorialSteps.length - 1) {
      const nextStep = tutorialStep + 1
      const nextStepData = tutorialSteps[nextStep]
      
      this.setData({
        tutorialStep: nextStep,
        currentTutorialStep: nextStepData || {}
      }, () => {
        setTimeout(() => {
          this.highlightTarget()
        }, 200)
      })
    } else {
      this.completeTutorial()
    }
  },

  // 上一步教程
  prevTutorialStep() {
    const { tutorialStep, tutorialSteps } = this.data
    
    if (tutorialStep > 0) {
      const prevStep = tutorialStep - 1
      this.setData({
        tutorialStep: prevStep,
        currentTutorialStep: tutorialSteps[prevStep] || {}
      }, () => {
        setTimeout(() => {
          this.highlightTarget()
        }, 200)
      })
    }
  },

  // 完成教程
  completeTutorial() {
    wx.setStorageSync('edit_tutorial_shown', true)
    this.setData({
      showTutorial: false
    })
    
    wx.showToast({
      title: '教程完成，开始添加吧！',
      icon: 'success'
    })
  },

  // 跳过教程
  skipTutorial() {
    wx.showModal({
      title: '跳过教程',
      content: '确定要跳过分类介绍教程吗？',
      success: (res) => {
        if (res.confirm) {
          this.completeTutorial()
        }
      }
    })
  },

  // 高亮目标元素
  highlightTarget() {
    const currentStep = this.data.currentTutorialStep
    if (!currentStep.target) return
    
    setTimeout(() => {
      const query = wx.createSelectorQuery().in(this)
      query.select(currentStep.target).boundingClientRect((rect) => {
        if (rect && rect.width > 0 && rect.height > 0) {
          this.calculateBubblePosition(rect, currentStep.position)
        } else {
          // 如果找不到目标，使用默认位置
          this.setData({
            bubbleStyle: {
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              opacity: '1',
              visibility: 'visible'
            },
            arrowClass: 'arrow-up'
          })
        }
      })
      query.exec()
    }, 300)
  },

  // 计算气泡位置
  calculateBubblePosition(targetRect, preferredPosition) {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const windowHeight = systemInfo.windowHeight
    const windowWidth = systemInfo.windowWidth
    
    const bubbleWidth = Math.min(300, windowWidth * 0.85)
    const bubbleHeight = 180
    const margin = 20
    
    let bubbleStyle = {}
    let arrowClass = ''
    
    const targetCenterX = targetRect.left + targetRect.width / 2
    const targetCenterY = targetRect.top + targetRect.height / 2
    
    // 根据目标位置计算气泡位置
    if (targetRect.bottom > windowHeight * 0.7) {
      // 目标在屏幕下方，气泡显示在上方
      const leftPos = Math.max(margin, Math.min(windowWidth - bubbleWidth - margin, targetCenterX - bubbleWidth / 2))
      bubbleStyle = {
        position: 'fixed',
        left: leftPos + 'px',
        bottom: (windowHeight - targetRect.top + margin) + 'px',
        top: 'auto',
        right: 'auto',
        transform: 'none',
        opacity: '1',
        visibility: 'visible'
      }
      arrowClass = 'arrow-down'
    } else {
      // 目标在屏幕上方或中间，气泡显示在下方
      const leftPos = Math.max(margin, Math.min(windowWidth - bubbleWidth - margin, targetCenterX - bubbleWidth / 2))
      bubbleStyle = {
        position: 'fixed',
        left: leftPos + 'px',
        top: (targetRect.bottom + margin) + 'px',
        bottom: 'auto',
        right: 'auto',
        transform: 'none',
        opacity: '1',
        visibility: 'visible'
      }
      arrowClass = 'arrow-up'
    }
    
    this.setData({
      bubbleStyle: bubbleStyle,
      arrowClass: arrowClass
    })
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
        categoryLevelOne: assetL1Categories,
        categoryLevelTwo: (() => {
          const categoryLevelTwo = []
          assetL1Categories.forEach(l1Category => {
            const l2Categories = AccountingCategories.getAssetL2Categories(l1Category.value)
            categoryLevelTwo.push(l2Categories)
          })
          return categoryLevelTwo
        })()
      })
    } else if (type === 'liability') {
      const liabilityL1Categories = AccountingCategories.getLiabilityL1Categories()
      
      this.setData({
        categoryLevelOne: liabilityL1Categories,
        categoryLevelTwo: (() => {
          const categoryLevelTwo = []
          liabilityL1Categories.forEach(l1Category => {
            const l2Categories = AccountingCategories.getLiabilityL2Categories(l1Category.value)
            categoryLevelTwo.push(l2Categories)
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
    
    if (categoryLevelOne.length > 0 && categoryIndex[0] >= 0) {
      const level1 = categoryLevelOne[categoryIndex[0]]
      if (level1) {
        const level2List = categoryLevelTwo[categoryIndex[0]] || []
        if (level2List.length > 0 && categoryIndex[1] >= 0) {
          const level2 = level2List[categoryIndex[1]]
          if (level2) {
            displayText = `${level1.label} - ${level2.label}`
          } else {
            displayText = level1.label
          }
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
            createDate: item.createDate || item.createTime?.split('T')[0] || this.data.formData.createDate,
            salaryHistory: item.salaryHistory || [] // 确保薪资历史数据被加载
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
        
        // 如果是工作收入，设置薪资结构索引
        if (item.categoryL1 === 'work_income') {
          const salaryStructure = item.salaryStructure || 'monthly_salary'
          const salaryStructureIndex = this.data.salaryStructureOptions.findIndex(option => option.value === salaryStructure)
          this.setData({ 
            salaryStructureIndex: salaryStructureIndex >= 0 ? salaryStructureIndex : -1,
            salaryUnitText: this.getSalaryUnit(salaryStructure)
          })
          // 更新薪资输入标签
          this.updateSalaryInputLabels(salaryStructure)
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
    
    // 如果是工作收入，计算工作价值
    if (this.data.formData.categoryL1 === 'work_income') {
      this.calculateWorkValue()
    }
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

  // 薪资结构选择
  onSalaryStructureChange(e) {
    const index = parseInt(e.detail.value)
    const selectedStructure = this.data.salaryStructureOptions[index]
    this.setData({
      salaryStructureIndex: index,
      'formData.salaryStructure': selectedStructure.value
    })
    // 更新薪资输入标签和单位文本
    this.updateSalaryInputLabels(selectedStructure.value)
  },

  // 根据薪资结构更新输入标签
  updateSalaryInputLabels(salaryStructure) {
    let salaryLabel = '当前月薪 *'
    let salaryPlaceholder = '当前每月收入'
    let historyLabel = '月薪金额'
    let historyPlaceholder = '请输入月薪'
    
    switch (salaryStructure) {
      case 'hourly_wage':
        salaryLabel = '当前时薪 *'
        salaryPlaceholder = '每小时收入金额'
        historyLabel = '时薪金额'
        historyPlaceholder = '请输入时薪'
        break

      case 'daily_wage':
        salaryLabel = '当前日薪 *'
        salaryPlaceholder = '每日收入金额'
        historyLabel = '日薪金额'
        historyPlaceholder = '请输入日薪'
        break

      case 'monthly_salary':
      default:
        salaryLabel = '当前月薪 *'
        salaryPlaceholder = '当前每月收入'
        historyLabel = '月薪金额'
        historyPlaceholder = '请输入月薪'
        break
    }
    
    this.setData({
      salaryInputLabel: salaryLabel,
      salaryInputPlaceholder: salaryPlaceholder,
      salaryHistoryLabel: historyLabel,
      salaryHistoryPlaceholder: historyPlaceholder,
      salaryUnitText: this.getSalaryUnit(salaryStructure)
    })
  },

  onDailyWorkHoursInput(e) {
    this.setData({
      'formData.dailyWorkHours': e.detail.value
    })
  },

  onWeeklyWorkDaysInput(e) {
    this.setData({
      'formData.weeklyWorkDays': e.detail.value
    })
  },

  // 每年工作月数输入
  onWorkingMonthsPerYearInput(e) {
    this.setData({
      'formData.workingMonthsPerYear': e.detail.value
    })
    // 触发工作价值重新计算
    if (this.data.formData.categoryL1 === 'work_income') {
      this.calculateWorkValue()
    }
  },

  // 固定额外收入输入
  onFixedAllowancesInput(e) {
    this.setData({
      'formData.fixedAllowances': e.detail.value
    })
    // 触发工作价值重新计算
    if (this.data.formData.categoryL1 === 'work_income') {
      this.calculateWorkValue()
    }
  },

  onStartDateChange(e) {
    this.setData({
      'formData.startDate': e.detail.value
    })
    this.calculateWorkValue()
  },

  onEndDateChange(e) {
    this.setData({
      'formData.endDate': e.detail.value
    })
    this.calculateWorkValue()
  },

  onInitialSalaryInput(e) {
    this.setData({
      'formData.initialSalary': e.detail.value
    })
    this.calculateWorkValue()
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
      // 工作收入：需要入职日期和当前月薪
      else if (l1 === 'work_income') {
        if (!formData.startDate) {
          wx.showToast({ title: '请选择入职日期', icon: 'error' })
          return false
        }
        if (!formData.monthlyIncome) {
          wx.showToast({ title: '请输入当前月薪', icon: 'error' })
          return false
        }
        // 验证入职日期不能晚于当前日期
        const startDate = new Date(formData.startDate)
        const currentDate = new Date()
        if (startDate > currentDate) {
          wx.showToast({ title: '入职日期不能晚于当前日期', icon: 'error' })
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
    
    // 工作收入特殊处理
    let finalOriginalValue = 0
    let finalCurrentValue = 0
    
    if (type === 'asset' && formData.categoryL1 === 'work_income') {
      // 工作收入：计算历史实际收入作为价值
      const startDate = new Date(formData.startDate)
      const currentDate = new Date()
      const yearsDiff = currentDate.getFullYear() - startDate.getFullYear()
      const monthsDiff = currentDate.getMonth() - startDate.getMonth()
      const totalMonths = Math.max(0, yearsDiff * 12 + monthsDiff)
      
      const currentSalary = parseFloat(formData.monthlyIncome) || 0
      const initialSalary = parseFloat(formData.initialSalary) || currentSalary
      const averageSalary = (initialSalary + currentSalary) / 2
      
      finalOriginalValue = 0 // 工作收入没有初始投入成本
      finalCurrentValue = totalMonths * averageSalary // 历史累计收入
    } else {
      // 其他资产按原逻辑处理
      finalOriginalValue = parseFloat(formData.originalValue || formData.initialValue) || 0
      finalCurrentValue = (formData.categoryL1 === 'current_assets' && formData.categoryL2 === 'cash_assets')
        ? (parseFloat(formData.currentValue) || 0)
        : (formData.categoryL1 === 'physical_assets' && formData.categoryL2 === 'consumer_assets')
        ? (parseFloat(formData.currentValue) || 0) // 消费型资产：可以为0，表示使用折旧计算
        : (parseFloat(formData.currentValue) || parseFloat(formData.originalValue || formData.initialValue) || 0)
    }

    const saveData = {
      ...formData,
      id: isEdit ? editId : `${type}_${Date.now()}`,
      name: formData.name.trim(),
      // 统一原值（兼容旧字段）：
      originalValue: finalOriginalValue,
      // 转换数值字段
      initialValue: finalOriginalValue,
      currentValue: finalCurrentValue,
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
      // 工作收入特有字段
      startDate: formData.startDate || '',
      initialSalary: parseFloat(formData.initialSalary) || 0,
      dailyWorkHours: parseFloat(formData.dailyWorkHours) || 8,
      weeklyWorkDays: parseFloat(formData.weeklyWorkDays) || 5,
      // 日期字段
      createDate: formData.createDate || new Date().toISOString().split('T')[0],
      purchaseDate: formData.startDate || formData.createDate || new Date().toISOString().split('T')[0],
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
  },

  // 折旧率输入
  onDepreciationRateInput(e) {
    this.setData({
      'formData.depreciationRate': e.detail.value
    })
  },

  // 显示折旧率参考
  showDepreciationTip() {
    this.setData({
      showDepreciationModal: true
    })
  },

  // 隐藏折旧率参考
  hideDepreciationTip() {
    this.setData({
      showDepreciationModal: false
    })
  },

  // 选择折旧率
  selectDepreciationRate(e) {
    const rate = e.currentTarget.dataset.rate
    this.setData({
      'formData.depreciationRate': rate.toString(),
      showDepreciationModal: false
    })
    wx.showToast({
      title: `已设置折旧率为${rate}%`,
      icon: 'success'
    })
  },

  // Logo选择相关方法
  showLogoSelector() {
    this.setData({
      showLogoModal: true
    })
  },

  hideLogoSelector(e) {
    // 点击遮罩层关闭弹窗
    this.setData({
      showLogoModal: false
    })
  },

  // 取消按钮专用方法
  cancelLogoSelector() {
    this.setData({
      showLogoModal: false
    })
  },

  switchLogoType(e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      logoSelectorType: type
    })
  },

  selectEmoji(e) {
    const emoji = e.currentTarget.dataset.emoji
    this.setData({
      'formData.logoEmoji': emoji,
      'formData.logoType': 'emoji'
    })
  },

  uploadImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]
        
        // 这里可以上传到服务器，现在先使用本地临时路径
        this.setData({
          'formData.logoUrl': tempFilePath,
          'formData.logoType': 'image'
        })
        
        wx.showToast({
          title: '图片已选择',
          icon: 'success'
        })
      },
      fail: (error) => {
        console.error('选择图片失败:', error)
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        })
      }
    })
  },

  // 显示自定义emoji输入弹窗
  showCustomEmojiInput() {
    wx.showModal({
      title: '输入自定义emoji',
      editable: true,
      placeholderText: '请输入emoji...',
      success: (res) => {
        if (res.confirm && res.content) {
          const customEmoji = res.content.trim()
          
          // 简单验证是否包含emoji
          const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u
          
          if (!emojiRegex.test(customEmoji)) {
            wx.showToast({
              title: '请输入有效的emoji',
              icon: 'none'
            })
            return
          }

          this.setData({
            'formData.logoEmoji': customEmoji,
            'formData.logoType': 'emoji'
          })

          wx.showToast({
            title: '自定义emoji已设置',
            icon: 'success'
          })
        }
      }
    })
  },

  confirmLogo() {
    this.setData({
      showLogoModal: false
    })
    wx.showToast({
      title: '图标已设置',
      icon: 'success'
    })
  },

  // 薪资历史管理相关方法
  showSalaryHistoryManager() {
    // 如果没有薪资历史记录但有入职日期和当前薪资，智能初始化
    if (this.data.formData.salaryHistory.length === 0 && 
        this.data.formData.startDate && 
        this.data.formData.monthlyIncome) {
      
      wx.showModal({
        title: '智能初始化',
        content: '检测到您已设置入职日期和当前薪资，是否自动创建初始薪资记录？',
        success: (res) => {
          if (res.confirm) {
            const initialRecord = {
              id: `salary_${Date.now()}`,
              effectiveDate: this.data.formData.startDate,
              amount: parseFloat(this.data.formData.monthlyIncome),
              reason: '入职'
            }
            
            this.setData({
              'formData.salaryHistory': [initialRecord]
            })
            
            wx.showToast({
              title: '已创建初始记录',
              icon: 'success'
            })
          }
          
          this.openSalaryHistoryModal()
        }
      })
    } else {
      this.openSalaryHistoryModal()
    }
  },

  openSalaryHistoryModal() {
    // 如果是第一次添加薪资记录，默认使用入职日期
    const isFirstRecord = !this.data.formData.salaryHistory || this.data.formData.salaryHistory.length === 0
    let defaultDate = ''
    let defaultReason = ''
    let defaultAmount = ''
    
    if (isFirstRecord) {
      defaultDate = this.data.formData.startDate || ''
      defaultReason = '入职'
      // 如果已经填写了当前月薪，作为入职薪资的默认值
      defaultAmount = this.data.formData.monthlyIncome || ''
    }
    
    this.setData({
      showSalaryHistoryModal: true,
      newSalaryRecord: {
        effectiveDate: defaultDate,
        amount: defaultAmount,
        reason: defaultReason
      },
      // 确保薪资单位文本和标签是最新的
      salaryUnitText: this.getSalaryUnit(this.data.formData.salaryStructure || 'monthly_salary')
    })
    
    // 更新薪资历史记录标签
    this.updateSalaryInputLabels(this.data.formData.salaryStructure || 'monthly_salary')
  },

  hideSalaryHistoryManager(e) {
    // 点击遮罩层关闭弹窗
    this.setData({
      showSalaryHistoryModal: false
    })
  },

  // 取消薪资历史管理
  cancelSalaryHistoryManager() {
    this.setData({
      showSalaryHistoryModal: false,
      newSalaryRecord: {
        effectiveDate: '',
        amount: '',
        reason: ''
      }
    })
  },

  // 阻止弹窗内容区域点击时关闭弹窗
  preventClose() {
    // 空方法，仅用于阻止事件冒泡
  },

  // 根据薪资结构获取单位文本
  getSalaryUnit(salaryStructure) {
    switch (salaryStructure) {
      case 'hourly_wage':
        return '/小时'
      case 'daily_wage':
        return '/天'
      case 'monthly_salary':
      default:
        return '/月'
    }
  },

  onNewSalaryDateChange(e) {
    this.setData({
      'newSalaryRecord.effectiveDate': e.detail.value
    })
  },

  onNewSalaryAmountInput(e) {
    this.setData({
      'newSalaryRecord.amount': e.detail.value
    })
  },

  onNewSalaryReasonInput(e) {
    this.setData({
      'newSalaryRecord.reason': e.detail.value
    })
  },

  addSalaryRecord() {
    const { newSalaryRecord } = this.data
    
    if (!newSalaryRecord.effectiveDate) {
      wx.showToast({
        title: '请选择生效日期',
        icon: 'none'
      })
      return
    }
    
    if (!newSalaryRecord.amount) {
      wx.showToast({
        title: '请输入月薪金额',
        icon: 'none'
      })
      return
    }

    const salaryRecord = {
      id: `salary_${Date.now()}`,
      effectiveDate: newSalaryRecord.effectiveDate,
      amount: parseFloat(newSalaryRecord.amount),
      reason: newSalaryRecord.reason || '薪资调整'
    }

    // 添加到薪资历史，并按日期排序
    const salaryHistory = [...this.data.formData.salaryHistory, salaryRecord]
    salaryHistory.sort((a, b) => new Date(a.effectiveDate) - new Date(b.effectiveDate))

    this.setData({
      'formData.salaryHistory': salaryHistory,
      newSalaryRecord: {
        effectiveDate: '',
        amount: '',
        reason: ''
      }
    })

    // 更新当前月薪为最新记录
    const latestSalary = salaryHistory[salaryHistory.length - 1]
    if (latestSalary) {
      this.setData({
        'formData.monthlyIncome': latestSalary.amount.toString()
      })
    }

    // 重新计算工作价值
    this.calculateWorkValue()

    wx.showToast({
      title: '记录已添加',
      icon: 'success'
    })
    

  },



  deleteSalaryRecord(e) {
    const recordId = e.currentTarget.dataset.recordId
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条薪资记录吗？',
      success: (res) => {
        if (res.confirm) {
          const salaryHistory = this.data.formData.salaryHistory.filter(record => record.id !== recordId)
          this.setData({
            'formData.salaryHistory': salaryHistory
          })

          // 如果删除后还有记录，更新当前月薪为最新记录
          if (salaryHistory.length > 0) {
            const latestSalary = salaryHistory[salaryHistory.length - 1]
            this.setData({
              'formData.monthlyIncome': latestSalary.amount.toString()
            })
          }

          // 重新计算工作价值
          this.calculateWorkValue()

          wx.showToast({
            title: '记录已删除',
            icon: 'success'
          })
        }
      }
    })
  },

  confirmSalaryHistory() {
    this.setData({
      showSalaryHistoryModal: false
    })
  },

  // 计算工作价值（使用薪资历史记录）
  calculateWorkValue() {
    const { formData } = this.data
    
    if (!formData.startDate) {
      this.setData({
        workDurationText: '',
        totalWorkValueText: ''
      })
      return
    }

    const startDate = new Date(formData.startDate)
    // 如果设置了离职日期，使用离职日期；否则使用当前日期
    const endDate = formData.endDate ? new Date(formData.endDate) : new Date()
    
    // 计算工作月数
    const yearsDiff = endDate.getFullYear() - startDate.getFullYear()
    const monthsDiff = endDate.getMonth() - startDate.getMonth()
    const totalMonths = yearsDiff * 12 + monthsDiff
    
    if (totalMonths < 0) {
      this.setData({
        workDurationText: '入职日期不能晚于结束日期',
        totalWorkValueText: ''
      })
      return
    }

    let totalValue = 0

    // 如果有薪资历史记录，使用精确计算
    if (formData.salaryHistory && formData.salaryHistory.length > 0) {
      const workingMonthsPerYear = parseFloat(formData.workingMonthsPerYear) || 12
      totalValue = this.calculateAccurateEarnings(formData.salaryHistory, startDate, endDate, workingMonthsPerYear)
    } else {
      // 如果没有薪资历史，使用简单平均值计算
      const currentSalary = parseFloat(formData.monthlyIncome) || 0
      const initialSalary = parseFloat(formData.initialSalary) || currentSalary
      const averageSalary = (initialSalary + currentSalary) / 2
      const workingMonthsPerYear = parseFloat(formData.workingMonthsPerYear) || 12
      
      // 按实际工作月数比例计算
      const workingRatio = workingMonthsPerYear / 12
      totalValue = totalMonths * averageSalary * workingRatio
    }

    // 格式化显示
    const years = Math.floor(totalMonths / 12)
    const months = totalMonths % 12
    let durationText = ''
    if (years > 0) {
      durationText = `${years}年`
      if (months > 0) {
        durationText += `${months}个月`
      }
    } else {
      durationText = `${months}个月`
    }
    
    // 添加工作状态说明
    if (formData.endDate) {
      durationText += ` (已离职，共${totalMonths}个月)`
    } else {
      durationText += ` (在职中，已工作${totalMonths}个月)`
    }

    this.setData({
      workDurationText: durationText,
      totalWorkValueText: totalValue.toLocaleString()
    })
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
  }
})