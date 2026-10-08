// 引入本地存储管理工具
const StorageManager = require('../../utils/storage.js')
const { SmartStorage, APIClient } = require('../../utils/apiClient.js')  // 云端API支持
const AccountingCategories = require('../../utils/accountingCategories.js')

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
    // 主题相关
    isDarkTheme: false,
  // 引导教程系统
  showTutorial: false,
  tutorialStep: 0,
  currentTutorialStep: {},
  bubbleStyle: {
    position: 'fixed',
    opacity: '0',
    visibility: 'hidden',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)'
  }, // 动态计算的气泡位置样式
  arrowClass: 'arrow-up', // 箭头方向类名
  bubbleVisible: false, // 气泡是否可见
  debugMode: false, // 调试模式
    tutorialSteps: [
      {
        title: '欢迎使用大鹅爱记账',
        content: '这是您的财务管理主页，采用企业级会计准则帮您科学管理财富。让我们一起了解各个功能吧！',
        target: '.user-info-section',
        position: 'center-top'
      },
      {
        title: '净资产总览',
        content: '这里显示您的总净资产（资产-负债）。不同于传统记账的流水账，这是真正反映财富状况的核心指标。',
        target: '.net-worth',
        position: 'center-bottom'
      },
      {
        title: '现金流分析',
        content: '现金流比余额更重要！这里显示每月的现金流入、流出和净现金流，帮助您评估财务健康度。',
        target: '.cashflow-overview',
        position: 'center-bottom'
      },
      {
        title: '智能统计信息',
        content: '这里显示资产数量、负债数量和现金流状态，让您快速了解整体财务概况。',
        target: '.user-info-bottom',
        position: 'center-bottom'
      },
      {
        title: '功能工具栏',
        content: '这里提供筛选、排序和搜索功能。您可以按类别、状态、金额等条件快速筛选记录。',
        target: '.function-bar',
        position: 'center-bottom'
      },
      {
        title: '资产负债列表',
        content: '这里按照会计准则分类显示您的所有资产和负债。点击任一项可查看详情、编辑或查看生命周期分析。',
        target: '.data-section',
        position: 'center-top'
      },
      {
        title: '添加记录',
        content: '点击这个浮动按钮可以快速添加新的资产或负债记录。支持工作收入、投资、房产、负债等多种类型。',
        target: '.float-btn',
        position: 'left-top'
      },
      {
        title: '个人中心功能',
        content: '点击右上角的用户头像可以进入个人中心，管理个人信息、查看财务报告、设置梦想储蓄罐、备份数据等高级功能。',
        target: '.avatar-container',
        position: 'center-bottom'
      }
    ],
    showTutorialOverlay: false,
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

  // 设置主题
  setTheme(isDark) {
    try {
      // 强制设置导航栏颜色（确保立即生效）
      wx.setNavigationBarColor({
        frontColor: isDark ? '#ffffff' : '#000000',
        backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
        animation: {
          duration: 100,
          timingFunc: 'easeInOut'
        }
      })
      
      // 设置页面背景色（包括导航栏底部区域）- 修复白色边框
      if (wx.setBackgroundColor) {
        const bgColor = isDark ? '#1e1e1e' : '#ffffff'
        
        // 多次设置确保覆盖系统默认的白色边框
        wx.setBackgroundColor({
          backgroundColor: bgColor,
          backgroundColorTop: bgColor,
          backgroundColorBottom: bgColor
        })
        
        // 延迟设置确保生效
        setTimeout(() => {
          wx.setBackgroundColor({
            backgroundColor: bgColor,
            backgroundColorTop: bgColor,
            backgroundColorBottom: bgColor
          })
        }, 50)
      }
      
      // 动态设置页面class来应用CSS主题
      try {
        const query = wx.createSelectorQuery().in(this)
        query.select('page').exec((res) => {
          // 这个方法在小程序中可能不可用，作为备用方案
        })
      } catch (error) {
        // 忽略错误，使用其他方式
      }
      
      // 重新渲染界面以应用主题
      this.setData({
        isDarkTheme: isDark
      })
    } catch (error) {
      console.error('设置页面主题失败:', error)
    }
  },

  onLoad() {
    this.initCategories()
    this.checkLogin()
    this.loadData()
    // 初始化主题状态
    const app = getApp()
    const isDark = app.globalData.isDarkTheme || false
    this.setData({
      isDarkTheme: isDark
    })
    // 设置导航栏主题
    this.setTheme(isDark)
    // 初始化当前教程步骤
    this.setData({
      currentTutorialStep: this.data.tutorialSteps[0] || {}
    })
  },

  onShow() {
    // 确保主题设置正确（避免页面切换时的白色闪烁）
    const app = getApp()
    if (app.globalData.isDarkTheme !== undefined) {
      this.setTheme(app.globalData.isDarkTheme)
      // 同步主题状态到页面数据
      this.setData({
        isDarkTheme: app.globalData.isDarkTheme
      })
    }
    
    this.checkLogin()  // 重新检查登录状态和加载用户信息
    const dataReady = this.loadData()  // 数据加载完成后由 loadData 触发教程检查
    
    // 检查是否有启动教程的全局标识
    const shouldStartTutorial = app.globalData.startTutorial
    if (shouldStartTutorial) {
      app.globalData.startTutorial = false  // 重置标识
      // 等云端数据到位再判定，否则示例数据标记还没加载完，会被误判成"没有示例数据"
      dataReady.then(() => this.checkAndShowTutorial())
    }
    
    // 检查是否有测试定位精度的全局标识
    const shouldTestPositions = app.globalData.testTutorialPositions
    if (shouldTestPositions) {
      app.globalData.testTutorialPositions = false  // 重置标识
      console.log('⚠️ 启动开发者测试模式：自动测试教程定位')
      setTimeout(() => {
        this.startPositionTest()
      }, 1000)  // 给页面更多时间渲染
      return // 测试模式不执行正常的教程检查
    }
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
    const token = APIClient.getToken()
    
    // 云端接口以 JWT 判定归属，缺 token 时所有请求都会 401，必须回登录页取身份
    if (!hasInitialized || !token) {
      // 未初始化或未登录，跳转到引导页
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
          avatar: displayAvatar || '/static/default-avatar.svg'
        }
      })
    } else {
      wx.reLaunch({
        url: '/pages/login/login'
      })
    }
  },

  async loadData() {
    try {
      // 使用 SmartStorage 自动选择本地或云端
      const assets = await SmartStorage.getAssets()
      const liabilities = await SmartStorage.getLiabilities()
    
    // 处理数据，添加显示字段
    const self = this
    const processedAssets = assets.map(asset => ({
      ...asset,
      type: 'asset',
      typeText: asset.categoryL1 === 'work_income' ? '工作' : '资产',
      categoryName: self.getCategoryName(asset.categoryL1, asset.categoryL2, true),
      displayAmount: self.formatNumber(StorageManager.firstNumber(asset.currentValue, asset.initialValue)),
      originalPrice: self.formatNumber(StorageManager.firstNumber(asset.originalValue, asset.initialValue)),
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
      amountValue: StorageManager.firstNumber(asset.currentValue, asset.initialValue),
      daysValue: self.calculateDaysSinceCreate(asset.createTime),
      purchaseDateValue: self.getPurchaseDateValue(asset.createDate, asset.createTime),
      dailyCostValue: asset.dailyIncome || 0 // 资产用每日收益
    }))
    
    const processedLiabilities = liabilities.map(liability => ({
      ...liability,
      type: 'liability',
      typeText: '负债',
      categoryName: self.getCategoryName(liability.categoryL1, liability.categoryL2, false),
      displayAmount: self.formatNumber(StorageManager.firstNumber(liability.currentAmount, liability.initialAmount)),
      originalAmount: self.formatNumber(StorageManager.firstNumber(liability.originalAmount, liability.initialAmount)),
      statusText: self.getStatusText(liability.status),
      createTimeText: StorageManager.formatPurchaseDate(liability.createDate, liability.createTime),
      // 排序用的数值字段
      amountValue: StorageManager.firstNumber(liability.currentAmount, liability.initialAmount),
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
      // 教程判定必须基于刚加载的云端数据，放在 loadData 末尾避免读到未完成的空列表
      this.checkTutorial()
    } catch (error) {
      console.error('加载数据失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  // 检查是否显示引导教程
  checkTutorial() {
    const assets = this.data.assets || []
    const liabilities = this.data.liabilities || []
    
    // 检查是否有示例数据标识
    const tutorialCompleted = wx.getStorageSync('tutorial_completed')
    
    // 如果用户已经完成教程，不再显示提示
    if (tutorialCompleted) {
      return
    }
    
    // 如果有示例数据标识，或者检测到数据中有isSample标记，显示引导选项
    const hasDemo = assets.some(item => item.isSample) ||
      liabilities.some(item => item.isSample)
    
    if (hasDemo && (assets.length > 0 || liabilities.length > 0)) {
      this.setData({
        showTutorialOverlay: true
      })
    }
  },

  // 检查并强制显示教程选择（从个人中心调用）
  checkAndShowTutorial() {
    const assets = this.data.assets || []
    const liabilities = this.data.liabilities || []
    
    const hasDemo = assets.some(item => item.isSample) ||
      liabilities.some(item => item.isSample)
    
    if (hasDemo && (assets.length > 0 || liabilities.length > 0)) {
      // 有示例数据，显示选择界面
      this.setData({
        showTutorialOverlay: true
      })
    } else {
      // 没有示例数据，直接开始教程
      console.log('没有示例数据，启动正常教程模式')
      this.forceStartTutorial()
    }
  },

  // 关闭引导选择覆盖层
  closeTutorialOverlay() {
    this.setData({
      showTutorialOverlay: false
    })
  },

  // 直接进入应用
  enterDirectly() {
    // 标记教程已完成
    wx.setStorageSync('tutorial_completed', true)
    // 关闭选择覆盖层
    this.closeTutorialOverlay()
    
    // 自动清除示例数据
    wx.showLoading({ title: '清除示例数据中...' })
    
    try {
      StorageManager.clearSampleData()
      // 重新加载数据
      this.loadData()
      
      wx.hideLoading()
      wx.showToast({
        title: '欢迎使用！',
        icon: 'success',
        duration: 1500
      })
      
      // 延迟显示第二个提示
      setTimeout(() => {
        wx.showToast({
          title: '示例数据已清除',
          icon: 'none',
          duration: 1500
        })
      }, 1600)
    } catch (error) {
      wx.hideLoading()
      console.error('清除示例数据失败:', error)
      wx.showToast({
        title: '欢迎使用！',
        icon: 'success',
        duration: 1500
      })
    }
  },

  // 开始引导教程
  startTutorial() {
    this.setData({
      showTutorialOverlay: false,
      showTutorial: true,
      tutorialStep: 0,
      currentTutorialStep: this.data.tutorialSteps[0] || {},
      // 确保气泡初始状态为隐藏
      bubbleStyle: {
        position: 'fixed',
        opacity: '0',
        visibility: 'hidden',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      },
      arrowClass: 'arrow-up',
      bubbleVisible: false
    }, () => {
      // 在setData回调中执行，确保DOM更新完成
      setTimeout(() => {
        this.highlightTarget()
      }, 100)
    })
  },

  // 强制启动教程（从个人中心调用）
  forceStartTutorial() {
    this.setData({
      showTutorial: true,
      tutorialStep: 0,
      showTutorialOverlay: false,
      currentTutorialStep: this.data.tutorialSteps[0] || {},
      // 确保气泡初始状态为隐藏
      bubbleStyle: {
        position: 'fixed',
        opacity: '0',
        visibility: 'hidden',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      },
      arrowClass: 'arrow-up',
      bubbleVisible: false
    }, () => {
      // 在setData回调中执行，确保DOM更新完成
      setTimeout(() => {
        this.highlightTarget()
      }, 100)
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
        currentTutorialStep: nextStepData || {},
        // 在切换步骤时先隐藏气泡
        bubbleStyle: {
          ...this.data.bubbleStyle,
          opacity: '0',
          visibility: 'hidden'
        },
        bubbleVisible: false
      }, () => {
        // 在setData回调中执行，确保DOM更新完成
        setTimeout(() => {
          this.highlightTarget()
        }, 50)
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
        currentTutorialStep: tutorialSteps[prevStep] || {},
        // 在切换步骤时先隐藏气泡
        bubbleStyle: {
          ...this.data.bubbleStyle,
          opacity: '0',
          visibility: 'hidden'
        },
        bubbleVisible: false
      }, () => {
        // 在setData回调中执行，确保DOM更新完成
        setTimeout(() => {
          this.highlightTarget()
        }, 50)
      })
    }
  },

  // 完成教程
  completeTutorial() {
    wx.setStorageSync('tutorial_completed', true)
    this.setData({
      showTutorial: false
    })
    
    // 自动清除示例数据
    wx.showLoading({ title: '清除示例数据中...' })
    
    try {
      StorageManager.clearSampleData()
      // 重新加载数据
      this.loadData()
      
      wx.hideLoading()
      wx.showToast({
        title: '教程完成！',
        icon: 'success',
        duration: 1500
      })
      
      // 延迟显示第二个提示
      setTimeout(() => {
        wx.showToast({
          title: '示例数据已清除',
          icon: 'none',
          duration: 1500
        })
      }, 1600)
    } catch (error) {
      wx.hideLoading()
      console.error('清除示例数据失败:', error)
      wx.showToast({
        title: '教程完成！',
        icon: 'success',
        duration: 1500
      })
    }
  },

  // 跳过教程
  skipTutorial() {
    wx.showModal({
      title: '跳过教程',
      content: '确定要跳过引导教程吗？示例数据将被清除。',
      success: (res) => {
        if (res.confirm) {
          this.completeTutorial()
        }
      }
    })
  },

  // 开始定位测试
  startPositionTest() {
    console.log('开始定位测试')
    
    // 设置测试模式
    this.setData({
      debugMode: true,
      showTutorial: true,
      tutorialStep: 0,
      currentTutorialStep: this.data.tutorialSteps[0] || {}
    })
    
    // 开始自动遍历所有步骤
    this.autoTestAllSteps()
  },

  // 自动测试所有步骤
  autoTestAllSteps() {
    const { tutorialSteps } = this.data
    let currentIndex = 0
    
    const testNextStep = () => {
      if (currentIndex >= tutorialSteps.length) {
        // 所有步骤测试完成
        this.setData({
          showTutorial: false,
          debugMode: false
        })
        
        wx.showModal({
          title: '定位测试完成',
          content: `已完成所有 ${tutorialSteps.length} 个步骤的定位测试。\n\n请检查控制台日志查看详细的定位信息。`,
          showCancel: false,
          confirmText: '确定'
        })
        return
      }
      
      // 设置当前步骤
      this.setData({
        tutorialStep: currentIndex,
        currentTutorialStep: tutorialSteps[currentIndex]
      })
      
      // 高亮目标元素并计算位置
      this.highlightTarget(tutorialSteps[currentIndex].target)
      
      console.log(`测试步骤 ${currentIndex + 1}/${tutorialSteps.length}:`, {
        title: tutorialSteps[currentIndex].title,
        target: tutorialSteps[currentIndex].target,
        position: tutorialSteps[currentIndex].position
      })
      
      // 3秒后测试下一步
      setTimeout(() => {
        currentIndex++
        testNextStep()
      }, 3000)
    }
    
    // 开始测试
    testNextStep()
  },

  // 清除示例数据
  clearSampleData() {
    wx.showLoading({ title: '清除中...' })
    
    try {
      // 清除示例数据
      StorageManager.clearSampleData()
      // 重新加载数据
      this.loadData()
      
      wx.hideLoading()
      wx.showToast({
        title: '示例数据已清除',
        icon: 'success'
      })
    } catch (error) {
      wx.hideLoading()
      wx.showToast({
        title: '清除失败',
        icon: 'error'
      })
    }
  },

  // 高亮目标元素并计算气泡位置
  highlightTarget(retryCount = 0) {
    const currentStep = this.data.currentTutorialStep
    if (!currentStep.target) return
    
    // 防抖机制：清除之前的定时器
    if (this.highlightTimer) {
      clearTimeout(this.highlightTimer)
    }
    
    // 延迟执行，确保DOM渲染完成
    this.highlightTimer = setTimeout(() => {
      // 使用小程序API获取元素位置信息
      const query = wx.createSelectorQuery().in(this)
      query.select(currentStep.target).boundingClientRect((rect) => {
        if (rect && rect.width > 0 && rect.height > 0) {
          // 找到了有效的目标元素
          console.log(`找到目标元素 ${currentStep.target}:`, rect)
          this.calculateBubblePosition(rect, currentStep.position)
          
          // 预加载下一步的位置（如果存在）
          this.preloadNextStep()
        } else {
          console.warn(`未找到目标元素 (尝试 ${retryCount + 1}/3):`, currentStep.target)
          
          // 重试机制：最多重试3次
          if (retryCount < 2) {
            setTimeout(() => {
              this.highlightTarget(retryCount + 1)
            }, 100)
          } else {
            // 重试失败，使用默认位置
            console.error('目标元素查找失败，使用默认位置')
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
        }
      })
      query.exec()
    }, retryCount === 0 ? 100 : 100) // 优化延迟：首次100ms，重试100ms
  },

  // 计算气泡位置
  calculateBubblePosition(targetRect, preferredPosition) {
    // 防止重复计算
    if (this.isCalculatingPosition) {
      console.log('气泡定位计算进行中，跳过重复调用')
      return
    }
    this.isCalculatingPosition = true
    
    // 缓存机制：如果目标元素和位置没有变化，使用缓存结果
    const cacheKey = `${this.data.currentTutorialStep.target}_${targetRect.left}_${targetRect.top}_${preferredPosition}`
    if (this.positionCache && this.positionCache.key === cacheKey) {
      console.log('使用缓存的位置计算结果')
      this.setData({
        bubbleStyle: this.positionCache.bubbleStyle,
        arrowClass: this.positionCache.arrowClass,
        bubbleVisible: true
      })
      this.isCalculatingPosition = false
      return
    }
    
    // 获取窗口信息
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const windowHeight = systemInfo.windowHeight
    const windowWidth = systemInfo.windowWidth
    const pixelRatio = systemInfo.pixelRatio || 2
    
    // 气泡默认尺寸（考虑rpx到px的转换）
    const bubbleWidth = Math.min(300, windowWidth * 0.85) // 最大不超过屏幕85%宽度，适应新的按钮布局
    const bubbleHeight = 200
    const margin = 20
    
    let bubbleStyle = {}
    let arrowClass = ''
    
    // 目标元素中心点
    const targetCenterX = targetRect.left + targetRect.width / 2
    const targetCenterY = targetRect.top + targetRect.height / 2
    
    // 调试信息
    const debugInfo = {
      target: this.data.currentTutorialStep.target,
      rect: targetRect,
      window: { width: windowWidth, height: windowHeight },
      center: { x: targetCenterX, y: targetCenterY },
      pixelRatio: pixelRatio,
      bubbleSize: { width: bubbleWidth, height: bubbleHeight },
      preferredPosition: preferredPosition
    }
    
    console.log('目标元素信息:', debugInfo)
    
    // 安全边界检查函数
    const ensureSafeBounds = (style) => {
      if (style.left && parseInt(style.left) < margin) {
        style.left = margin + 'px'
      }
      if (style.right && parseInt(style.right) < margin) {
        style.right = margin + 'px'
      }
      if (style.top && parseInt(style.top) < margin) {
        style.top = margin + 'px'
      }
      if (style.bottom && parseInt(style.bottom) < margin) {
        style.bottom = margin + 'px'
      }
      
      // 确保不超出右边界
      if (style.left && parseInt(style.left) + bubbleWidth > windowWidth - margin) {
        style.left = (windowWidth - bubbleWidth - margin) + 'px'
      }
      
      // 确保不超出下边界
      if (style.top && parseInt(style.top) + bubbleHeight > windowHeight - margin) {
        style.top = (windowHeight - bubbleHeight - margin) + 'px'
      }
      
      return style
    }
    
    // 特殊处理不同的目标元素
    if (this.data.currentTutorialStep.target === '.float-btn') {
      // 浮动按钮：确保气泡在屏幕范围内，显示在左上方
      const maxRight = windowWidth - bubbleWidth - margin
      const rightPos = Math.min(windowWidth - targetRect.left + margin, maxRight)
      const maxBottom = windowHeight - bubbleHeight - margin  
      const bottomPos = Math.min(windowHeight - targetRect.top + margin, maxBottom)
      
      bubbleStyle = {
        position: 'fixed',
        right: rightPos + 'px',
        bottom: bottomPos + 'px',
        left: 'auto',
        top: 'auto',
        transform: 'none'
      }
      arrowClass = 'arrow-down-right'
    } else if (this.data.currentTutorialStep.target === '.avatar-container') {
      // 用户头像：显示在左下方，确保不超出屏幕
      const leftPos = Math.max(margin, Math.min(windowWidth - bubbleWidth - margin, targetRect.left))
      const topPos = Math.min(targetRect.bottom + margin, windowHeight - bubbleHeight - margin)
      
      bubbleStyle = {
        position: 'fixed',
        left: leftPos + 'px',
        top: topPos + 'px',
        bottom: 'auto',
        right: 'auto',
        transform: 'none'
      }
      arrowClass = 'arrow-up'
    } else if (targetRect.bottom > windowHeight * 0.7) {
      // 目标在屏幕下方，气泡显示在上方
      const leftPos = Math.max(margin, Math.min(windowWidth - bubbleWidth - margin, targetCenterX - bubbleWidth / 2))
      bubbleStyle = {
        position: 'fixed',
        left: leftPos + 'px',
        bottom: (windowHeight - targetRect.top + margin) + 'px',
        top: 'auto',
        right: 'auto',
        transform: 'none'
      }
      arrowClass = 'arrow-down'
    } else if (targetRect.top < windowHeight * 0.3) {
      // 目标在屏幕上方，气泡显示在下方
      const leftPos = Math.max(margin, Math.min(windowWidth - bubbleWidth - margin, targetCenterX - bubbleWidth / 2))
      bubbleStyle = {
        position: 'fixed',
        left: leftPos + 'px',
        top: (targetRect.bottom + margin) + 'px',
        bottom: 'auto',
        right: 'auto',
        transform: 'none'
      }
      arrowClass = 'arrow-up'
    } else {
      // 目标在屏幕中间，根据空间选择最佳位置
      const spaceAbove = targetRect.top
      const spaceBelow = windowHeight - targetRect.bottom
      
      if (spaceBelow > spaceAbove) {
        // 下方空间更大，气泡显示在下方
        const leftPos = Math.max(margin, Math.min(windowWidth - bubbleWidth - margin, targetCenterX - bubbleWidth / 2))
        bubbleStyle = {
          position: 'fixed',
          left: leftPos + 'px',
          top: (targetRect.bottom + margin) + 'px',
          bottom: 'auto',
          right: 'auto',
          transform: 'none'
        }
        arrowClass = 'arrow-up'
      } else {
        // 上方空间更大，气泡显示在上方
        const leftPos = Math.max(margin, Math.min(windowWidth - bubbleWidth - margin, targetCenterX - bubbleWidth / 2))
        bubbleStyle = {
          position: 'fixed',
          left: leftPos + 'px',
          bottom: (windowHeight - targetRect.top + margin) + 'px',
          top: 'auto',
          right: 'auto',
          transform: 'none'
        }
        arrowClass = 'arrow-down'
      }
    }
    
    // 应用安全边界检查
    bubbleStyle = ensureSafeBounds(bubbleStyle)
    
    // 输出最终计算结果
    console.log('气泡定位结果:', {
      bubbleStyle: bubbleStyle,
      arrowClass: arrowClass,
      debugMode: this.data.debugMode
    })
    
    // 确保气泡可见
    bubbleStyle.opacity = '1'
    bubbleStyle.visibility = 'visible'
    
    this.setData({
      bubbleStyle: bubbleStyle,
      arrowClass: arrowClass,
      bubbleVisible: true
    })
    
    // 保存缓存
    this.positionCache = {
      key: cacheKey,
      bubbleStyle: bubbleStyle,
      arrowClass: arrowClass
    }
    
    // 释放锁
    this.isCalculatingPosition = false
  },

  // 预加载下一步位置
  preloadNextStep() {
    const { tutorialStep, tutorialSteps } = this.data
    const nextStep = tutorialStep + 1
    
    // 如果有下一步，预加载其位置信息
    if (nextStep < tutorialSteps.length) {
      const nextStepData = tutorialSteps[nextStep]
      if (nextStepData && nextStepData.target) {
        // 异步获取下一步目标元素位置
        setTimeout(() => {
          const query = wx.createSelectorQuery().in(this)
          query.select(nextStepData.target).boundingClientRect((rect) => {
            if (rect && rect.width > 0 && rect.height > 0) {
              // 预计算下一步位置并缓存
              const cacheKey = `${nextStepData.target}_${rect.left}_${rect.top}_${nextStepData.position}`
              if (!this.positionCache || this.positionCache.key !== cacheKey) {
                console.log('预加载下一步位置:', nextStepData.target)
                this.preCalculatePosition(rect, nextStepData.position, cacheKey)
              }
            }
          })
          query.exec()
        }, 100)
      }
    }
  },

  // 预计算位置（不更新UI）
  preCalculatePosition(targetRect, preferredPosition, cacheKey) {
    // 获取窗口信息（复用主计算逻辑的简化版本）
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const windowHeight = systemInfo.windowHeight
    const windowWidth = systemInfo.windowWidth
    
    const bubbleWidth = Math.min(300, windowWidth * 0.85)
    const bubbleHeight = 200
    const margin = 20
    
    const targetCenterX = targetRect.left + targetRect.width / 2
    const targetCenterY = targetRect.top + targetRect.height / 2
    
    let bubbleStyle = {}
    let arrowClass = ''
    
    // 简化的位置计算逻辑
    const spaceAbove = targetRect.top
    const spaceBelow = windowHeight - (targetRect.top + targetRect.height)
    const spaceLeft = targetCenterX
    const spaceRight = windowWidth - targetCenterX
    
    if (spaceBelow >= bubbleHeight + margin) {
      // 下方有足够空间
      bubbleStyle = {
        position: 'fixed',
        left: `${Math.max(margin, Math.min(targetCenterX - bubbleWidth / 2, windowWidth - bubbleWidth - margin))}px`,
        top: `${targetRect.top + targetRect.height + 10}px`,
        opacity: '1',
        visibility: 'visible'
      }
      arrowClass = 'arrow-up'
    } else if (spaceAbove >= bubbleHeight + margin) {
      // 上方有足够空间
      bubbleStyle = {
        position: 'fixed',
        left: `${Math.max(margin, Math.min(targetCenterX - bubbleWidth / 2, windowWidth - bubbleWidth - margin))}px`,
        top: `${targetRect.top - bubbleHeight - 10}px`,
        opacity: '1',
        visibility: 'visible'
      }
      arrowClass = 'arrow-down'
    } else {
      // 使用默认居中位置
      bubbleStyle = {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        opacity: '1',
        visibility: 'visible'
      }
      arrowClass = 'arrow-up'
    }
    
    // 保存到缓存
    this.positionCache = {
      key: cacheKey,
      bubbleStyle: bubbleStyle,
      arrowClass: arrowClass
    }
    
    console.log('预计算位置完成，已缓存:', cacheKey)
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
      return total + StorageManager.firstNumber(asset.currentValue, asset.initialValue)
    }, 0)
    
    const totalLiabilityValue = liabilities.reduce((total, liability) => {
      return total + StorageManager.firstNumber(liability.currentAmount, liability.initialAmount)
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

    // 分类选择器目前只提供资产分类，负债只有在选中的是一级"负债分类"时才参与过滤，
    // 否则任意资产分类都会把负债列表清空（原实现的注释也承认了这一点）
    const liabilityCategoryL1s = Object.keys(AccountingCategories.LIABILITY_CATEGORIES)
    const categoryAppliesToLiability = categoryIndex[0] > 0 && liabilityCategoryL1s.includes(selectedCategoryL1)

    let filteredLiabilities = liabilities.filter(liability => {
      if (searchKeyword && !liability.name.includes(searchKeyword)) {
        return false
      }
      
      if (categoryAppliesToLiability) {
        if (categoryIndex[1] === 0) {
          if (liability.categoryL1 !== selectedCategoryL1) {
            return false
          }
        } else {
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

  // 计算消费型资产的历史平均每日成本
  calculateDailyCost(asset) {
    const originalValue = StorageManager.firstNumber(asset.originalValue, asset.initialValue)
    // 现值为 0（已折尽）是合法结果，用 || 回退到原值会让每日成本算成 0
    const currentValue = StorageManager.firstNumber(asset.currentValue, originalValue)
    
    if (originalValue <= 0) {
      return "0.00"
    }
    
    // 计算使用天数
    const createTime = asset.createDate || asset.createTime
    if (!createTime) {
      return "0.00"
    }
    
    const now = new Date()
    const createDate = new Date(createTime)
    const daysUsed = Math.max(1, Math.floor((now - createDate) / (1000 * 60 * 60 * 24)))
    
    // 计算累计折旧损失
    const accumulatedDepreciation = Math.max(0, originalValue - currentValue)
    
    // 计算累计运营成本
    let operatingCost = 0
    const monthlyOperatingCost = parseFloat(asset.monthlyOperatingCost) || 0
    if (monthlyOperatingCost > 0) {
      const monthsUsed = Math.max(0, (now - createDate) / (1000 * 60 * 60 * 24 * 30))
      operatingCost = monthsUsed * monthlyOperatingCost
    }
    
    // 计算历史平均每日成本（总成本损失 ÷ 使用天数）
    const totalCostLoss = accumulatedDepreciation + operatingCost
    const dailyCost = totalCostLoss / daysUsed
    
    // 如果成本太小，返回最小显示值
    if (dailyCost < 0.01 && originalValue > 0) {
      return "0.01"  // 最小显示1分钱，表示该资产确实有成本
    }
    
    return dailyCost.toFixed(2)
  }
})
