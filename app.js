// app.js
App({
  onLaunch() {
    console.log('App Launch')
    // 初始化应用
    this.initApp()
    // 迁移分类数据到新的二级分类格式
    const StorageManager = require('./utils/storage.js')
    StorageManager.migrateCategories()
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
    console.log('应用默认设置已初始化')
  }
})