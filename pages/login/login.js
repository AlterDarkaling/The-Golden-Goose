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
    // 示例资产
    const sampleAssets = [
      {
        id: 'asset_1',
        name: '股票投资组合',
        categoryId: 'investment', // 保留旧ID用于兼容
        categoryL1: 'investment',
        categoryL2: 'stocks',
        status: 'active',
        initialValue: 50000,
        currentValue: 52000,
        dailyIncome: 15.5,
        annualReturn: 8.5,
        notes: '蓝筹股投资组合，包含银行、科技等板块',
        createTime: new Date().toISOString(),
        createDate: new Date().toISOString().split('T')[0]
      },
      {
        id: 'asset_2',
        name: '网约车',
        categoryId: 'business', // 保留旧ID用于兼容
        categoryL1: 'vehicle',
        categoryL2: 'car',
        status: 'active',
        initialValue: 150000,
        currentValue: 145000,
        dailyIncome: 200,
        annualReturn: 12,
        notes: '用于网约车运营的车辆，每日产生收益',
        createTime: new Date().toISOString(),
        createDate: new Date().toISOString().split('T')[0]
      },
      {
        id: 'asset_3',
        name: '商铺租赁',
        categoryL1: 'property',
        categoryL2: 'commercial',
        status: 'active',
        initialValue: 800000,
        currentValue: 820000,
        dailyIncome: 120,
        annualReturn: 5.5,
        notes: '市中心商铺，每月收租金',
        createTime: new Date().toISOString(),
        createDate: new Date().toISOString().split('T')[0]
      },
      {
        id: 'asset_4',
        name: 'MacBook Pro',
        categoryL1: 'digital',
        categoryL2: 'laptop',
        status: 'active',
        initialValue: 15000,
        currentValue: 12000,
        dailyIncome: 50,
        annualReturn: -5,
        notes: '用于视频剪辑和设计工作，产生收入',
        createTime: new Date().toISOString(),
        createDate: new Date().toISOString().split('T')[0]
      }
    ]
    
    // 示例负债
    const sampleLiabilities = [
      {
        id: 'liability_1',
        name: '信用卡消费',
        categoryId: 'credit_card', // 保留旧ID用于兼容
        categoryL1: 'debt',
        categoryL2: 'credit_card',
        status: 'active',
        initialAmount: 8000,
        currentAmount: 7500,
        dailyCost: 2.5,
        annualRate: 18,
        notes: '日常消费信用卡，需要按时还款',
        createTime: new Date().toISOString(),
        createDate: new Date().toISOString().split('T')[0]
      },
      {
        id: 'liability_2',
        name: '房屋贷款',
        categoryL1: 'debt',
        categoryL2: 'mortgage',
        status: 'active',
        initialAmount: 500000,
        currentAmount: 480000,
        dailyCost: 45,
        annualRate: 4.9,
        notes: '自住房贷款，30年期',
        createTime: new Date().toISOString(),
        createDate: new Date().toISOString().split('T')[0]
      }
    ]
    
    // 保存示例数据
    wx.setStorageSync('assets_data', sampleAssets)
    wx.setStorageSync('liabilities_data', sampleLiabilities)
    wx.setStorageSync('has_sample_data', true)
    
    console.log('示例数据创建完成')
  }
})