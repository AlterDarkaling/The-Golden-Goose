// app.js
App({
  onLaunch() {
    // 初始化应用
    this.initApp()
    // 迁移分类数据到新的二级分类格式
    const StorageManager = require('./utils/storage.js')
    StorageManager.migrateCategories()
  },

  onShow() {
    // App显示时的逻辑
  },

  onHide() {
    // App隐藏时的逻辑
  },

  globalData: {
    userInfo: null,
    startTutorial: false,  // 教程启动标识
    testTutorialPositions: false  // 测试定位精度标识
  },

  initApp() {
    // 检查是否已初始化
    const hasInitialized = wx.getStorageSync('app_initialized')
    if (!hasInitialized) {
      // 第一次使用，不做任何处理，等待用户进入引导页面
      return
    }
    
    // 初始化默认设置
    this.initDefaultSettings()
  },

  initDefaultSettings() {
    // 初始化默认设置
  }
})