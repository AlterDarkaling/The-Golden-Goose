Page({
  data: {
    // 不再需要登录表单数据
  },

  onLoad() {
    // 检查是否是首次使用
    this.checkFirstTime()
  },

  checkFirstTime() {
    // 检查是否已经初始化过应用
    const hasInitialized = wx.getStorageSync('app_initialized')
    
    if (hasInitialized) {
      // 已经初始化过，直接跳转到首页
      wx.reLaunch({
        url: '/pages/index/index'
      })
    } else {
      // 如果是首次使用，清除可能存在的旧数据
      wx.removeStorageSync('assets_data')
      wx.removeStorageSync('liabilities_data')
      wx.removeStorageSync('user_info')
      wx.removeStorageSync('has_sample_data')
    }
  },

  // 进入应用
  handleEnterApp() {
    try {
      // 标记应用已初始化
      wx.setStorageSync('app_initialized', true)
      
      // 创建默认用户信息
      const defaultUser = {
        id: 'default_user',
        username: '用户',
        nickname: '用户',
        avatar: '',
        isWechatUser: false,
        useWechatInfo: false,
        wechatNickname: '',
        wechatAvatar: '',
        createTime: new Date().toISOString()
      }
      
      // 保存用户信息
      wx.setStorageSync('user_info', defaultUser)
      
      // 创建示例数据
      this.createSampleData()
      
      // 跳转到首页
      wx.reLaunch({
        url: '/pages/index/index'
      })
      
      wx.showToast({
        title: '欢迎使用！',
        icon: 'success'
      })
      
    } catch (error) {
      console.error('进入应用失败:', error)
      wx.showToast({
        title: '初始化失败，请重试',
        icon: 'none'
      })
    }
  },

  // 创建示例数据
  createSampleData() {
    // 获取当前日期和一些历史日期
    const now = new Date()
    const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000)
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    const twoYearsAgo = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000)
    
    // 示例资产（总价值约 308万，包含工作收入91.2万）
    const sampleAssets = [
      // 1. 工作收入类
      {
        id: 'asset_work_1',
        name: '互联网公司产品经理',
        categoryL1: 'work_income',
        categoryL2: 'salary_income',
        categoryL3: 'tech_industry',
        status: 'active',
        originalValue: 792000, // 2年总收入：33000 * 12 * 2
        initialValue: 792000,
        currentValue: 792000,
        salaryStructure: 'monthly_salary',
        baseSalary: 25000,
        fixedAllowance: 3000,
        variableIncome: 5000,
        workingMonthsPerYear: 12,
        startDate: twoYearsAgo.toISOString().split('T')[0],
        // 添加薪资历史记录
        salaryHistory: [
          {
            date: twoYearsAgo.toISOString().split('T')[0],
            amount: 28000,
            note: '入职薪资'
          },
          {
            date: new Date(twoYearsAgo.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            amount: 33000,
            note: '年度调薪'
          }
        ],
        notes: '互联网公司产品经理，包含绩效奖金，已工作2年',
        createTime: twoYearsAgo.toISOString(),
        createDate: twoYearsAgo.toISOString().split('T')[0],
        isSample: true
      },
      {
        id: 'asset_work_2',
        name: '周末兼职咨询',
        categoryL1: 'work_income',
        categoryL2: 'freelance_income',
        categoryL3: 'consulting',
        status: 'active',
        originalValue: 120000, // 1年兼职收入：10000 * 12
        initialValue: 120000,
        currentValue: 120000,
        salaryStructure: 'monthly_salary',
        baseSalary: 8000,
        fixedAllowance: 1000,
        variableIncome: 1000,
        workingMonthsPerYear: 12,
        startDate: oneYearAgo.toISOString().split('T')[0],
        salaryHistory: [
          {
            date: oneYearAgo.toISOString().split('T')[0],
            amount: 10000,
            note: '兼职咨询收入'
          }
        ],
        notes: '周末兼职产品咨询，时间灵活',
        createTime: oneYearAgo.toISOString(),
        createDate: oneYearAgo.toISOString().split('T')[0],
        isSample: true
      },
      // 2. 现金资产类
      {
        id: 'asset_cash_1',
        name: '招商银行储蓄',
        categoryL1: 'current_assets',
        categoryL2: 'cash_assets',
        categoryL3: 'bank_deposit',
        status: 'active',
        originalValue: 120000,
        initialValue: 120000,
        currentValue: 120000,
        monthlyIncome: 200,
        notes: '主要储蓄账户，年化收益率2%',
        createTime: oneYearAgo.toISOString(),
        createDate: oneYearAgo.toISOString().split('T')[0],
        isSample: true
      },
      {
        id: 'asset_cash_2',
        name: '余额宝理财',
        categoryL1: 'current_assets',
        categoryL2: 'cash_assets',
        categoryL3: 'money_market',
        status: 'active',
        originalValue: 80000,
        initialValue: 80000,
        currentValue: 82400,
        monthlyIncome: 180,
        notes: '流动性理财，年化收益率2.7%',
        createTime: oneYearAgo.toISOString(),
        createDate: oneYearAgo.toISOString().split('T')[0],
        isSample: true
      },
      // 3. 金融资产类
      {
        id: 'asset_financial_1',
        name: '沪深300ETF',
        categoryL1: 'financial_assets',
        categoryL2: 'equity_fund',
        categoryL3: 'etf_fund',
        status: 'active',
        originalValue: 100000,
        initialValue: 100000,
        currentValue: 118000,
        quantity: 10000,
        costPrice: 10.0,
        currentPrice: 11.8,
        monthlyIncome: 320,
        notes: '定投ETF基金，长期持有',
        createTime: oneYearAgo.toISOString(),
        createDate: oneYearAgo.toISOString().split('T')[0],
        isSample: true
      },
      {
        id: 'asset_financial_2',
        name: '腾讯控股股票',
        categoryL1: 'financial_assets',
        categoryL2: 'individual_stock',
        categoryL3: 'hk_stock',
        status: 'active',
        originalValue: 50000,
        initialValue: 50000,
        currentValue: 58000,
        quantity: 100,
        costPrice: 500.0,
        currentPrice: 580.0,
        monthlyIncome: 150,
        notes: '港股投资，优质科技股',
        createTime: oneYearAgo.toISOString(),
        createDate: oneYearAgo.toISOString().split('T')[0],
        isSample: true
      },
      // 4. 固定资产类
      {
        id: 'asset_fixed_1',
        name: '自住房产',
        categoryL1: 'fixed_assets',
        categoryL2: 'real_estate',
        categoryL3: 'residential',
        status: 'active',
        originalValue: 800000,
        initialValue: 800000,
        currentValue: 950000,
        monthlyIncome: 0,
        notes: '自住房产，三居室，位置优越',
        createTime: twoYearsAgo.toISOString(),
        createDate: twoYearsAgo.toISOString().split('T')[0],
        isSample: true
      },
      {
        id: 'asset_fixed_2',
        name: '投资公寓',
        categoryL1: 'fixed_assets',
        categoryL2: 'real_estate',
        categoryL3: 'commercial',
        status: 'active',
        originalValue: 600000,
        initialValue: 600000,
        currentValue: 680000,
        monthlyIncome: 4500,
        notes: '出租公寓，月租金收入稳定',
        createTime: oneYearAgo.toISOString(),
        createDate: oneYearAgo.toISOString().split('T')[0],
        isSample: true
      },
      // 5. 实物资产类
      {
        id: 'asset_physical_1',
        name: 'MacBook Pro 16寸',
        categoryL1: 'physical_assets',
        categoryL2: 'consumer_assets',
        categoryL3: 'mobile_computer',
        status: 'active',
        originalValue: 18999,
        initialValue: 18999,
        currentValue: 12999,
        purchaseDate: oneYearAgo.toISOString().split('T')[0],
        monthlyOperatingCost: 50,
        notes: '工作用笔记本电脑，性能优秀',
        createTime: oneYearAgo.toISOString(),
        createDate: oneYearAgo.toISOString().split('T')[0],
        isSample: true
      },
      {
        id: 'asset_physical_2',
        name: 'iPhone 15 Pro Max',
        categoryL1: 'physical_assets',
        categoryL2: 'consumer_assets',
        categoryL3: 'mobile_computer',
        status: 'active',
        originalValue: 9999,
        initialValue: 9999,
        currentValue: 7499,
        purchaseDate: sixMonthsAgo.toISOString().split('T')[0],
        monthlyOperatingCost: 200,
        notes: '日常使用手机，拍照效果好',
        createTime: sixMonthsAgo.toISOString(),
        createDate: sixMonthsAgo.toISOString().split('T')[0],
        isSample: true
      },
      {
        id: 'asset_physical_3',
        name: '本田雅阁汽车',
        categoryL1: 'physical_assets',
        categoryL2: 'consumer_assets',
        categoryL3: 'vehicle',
        status: 'active',
        originalValue: 180000,
        initialValue: 180000,
        currentValue: 145000,
        purchaseDate: oneYearAgo.toISOString().split('T')[0],
        monthlyOperatingCost: 1500,
        notes: '家用轿车，油耗经济，保养便宜',
        createTime: oneYearAgo.toISOString(),
        createDate: oneYearAgo.toISOString().split('T')[0],
        isSample: true
      }
    ]
    
    // 示例负债（总额约 45万，确保净资产为正）
    const sampleLiabilities = [
      // 1. 房贷类负债
      {
        id: 'liability_mortgage_1',
        name: '自住房贷款',
        categoryL1: 'long_term_debt',
        categoryL2: 'mortgage_debt',
        categoryL3: 'home_mortgage',
        status: 'active',
        originalValue: 500000,
        initialAmount: 500000,
        currentAmount: 380000,
        borrowDate: twoYearsAgo.toISOString().split('T')[0],
        annualRate: 4.9,
        monthlyPayment: 2850,
        totalMonths: 360,
        remainingMonths: 312,
        notes: '自住房贷款，30年期，已还2年',
        createTime: twoYearsAgo.toISOString(),
        createDate: twoYearsAgo.toISOString().split('T')[0],
        isSample: true
      },
      {
        id: 'liability_mortgage_2',
        name: '投资房贷款',
        categoryL1: 'long_term_debt',
        categoryL2: 'mortgage_debt',
        categoryL3: 'investment_mortgage',
        status: 'active',
        originalValue: 300000,
        initialAmount: 300000,
        currentAmount: 260000,
        borrowDate: oneYearAgo.toISOString().split('T')[0],
        annualRate: 5.2,
        monthlyPayment: 2100,
        totalMonths: 240,
        remainingMonths: 228,
        notes: '投资房贷款，20年期，对应租金收入',
        createTime: oneYearAgo.toISOString(),
        createDate: oneYearAgo.toISOString().split('T')[0],
        isSample: true
      },
      // 2. 消费类负债
      {
        id: 'liability_consumer_1',
        name: '信用卡账单',
        categoryL1: 'short_term_debt',
        categoryL2: 'credit_debt',
        categoryL3: 'credit_card',
        status: 'active',
        originalValue: 12000,
        initialAmount: 12000,
        currentAmount: 8500,
        borrowDate: sixMonthsAgo.toISOString().split('T')[0],
        annualRate: 18.0,
        monthlyPayment: 1200,
        notes: '信用卡消费分期，正在按期还款',
        createTime: sixMonthsAgo.toISOString(),
        createDate: sixMonthsAgo.toISOString().split('T')[0],
        isSample: true
      },
      // 3. 车贷
      {
        id: 'liability_vehicle_1',
        name: '汽车贷款',
        categoryL1: 'medium_term_debt',
        categoryL2: 'installment_debt',
        categoryL3: 'auto_loan',
        status: 'active',
        originalValue: 80000,
        initialAmount: 80000,
        currentAmount: 45000,
        borrowDate: oneYearAgo.toISOString().split('T')[0],
        annualRate: 6.5,
        monthlyPayment: 2400,
        totalMonths: 36,
        remainingMonths: 24,
        notes: '汽车分期贷款，3年期',
        createTime: oneYearAgo.toISOString(),
        createDate: oneYearAgo.toISOString().split('T')[0],
        isSample: true
      }
    ]
    
    // 保存示例数据
    wx.setStorageSync('assets_data', sampleAssets)
    wx.setStorageSync('liabilities_data', sampleLiabilities)
    wx.setStorageSync('has_sample_data', true)
  }
})