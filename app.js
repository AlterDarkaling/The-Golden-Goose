// app.js
App({
  onLaunch() {
    console.log('App Launch')
    // 初始化应用
    this.initApp()
  },

  onShow() {
    console.log('App Show')
  },

  onHide() {
    console.log('App Hide')
  },

  globalData: {
    userInfo: null
  },

  initApp() {
    // 检查是否是首次启动
    const isFirstLaunch = !wx.getStorageSync('app_initialized')
    if (isFirstLaunch) {
      // 初始化默认设置
      this.initDefaultSettings()
      wx.setStorageSync('app_initialized', true)
    }
  },

  initDefaultSettings() {
    // 创建默认用户（用于演示）
    const defaultUser = {
      id: 'demo_user',
      username: 'demo',
      password: '123456',
      avatar: '',
      createTime: new Date().toISOString()
    }
    
    // 保存默认用户
    const users = [defaultUser]
    wx.setStorageSync('users', users)
    
    // 创建示例数据
    this.createSampleData()
  },

  createSampleData() {
    // 示例资产
    const sampleAssets = [
      {
        id: 'asset_1',
        name: '股票投资组合',
        categoryId: 'investment',
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
        categoryId: 'business',
        status: 'active',
        initialValue: 150000,
        currentValue: 145000,
        dailyIncome: 200,
        annualReturn: 12,
        notes: '用于网约车运营的车辆，每日产生收益',
        createTime: new Date().toISOString(),
        createDate: new Date().toISOString().split('T')[0]
      }
    ]
    
    // 示例负债
    const sampleLiabilities = [
      {
        id: 'liability_1',
        name: '信用卡消费',
        categoryId: 'credit_card',
        status: 'active',
        initialAmount: 8000,
        currentAmount: 7500,
        dailyCost: 2.5,
        annualRate: 18,
        notes: '日常消费信用卡，需要按时还款',
        createTime: new Date().toISOString(),
        createDate: new Date().toISOString().split('T')[0]
      }
    ]
    
    // 保存示例数据
    wx.setStorageSync('assets_data', sampleAssets)
    wx.setStorageSync('liabilities_data', sampleLiabilities)
  }
})
