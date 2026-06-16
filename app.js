// app.js
App({
  onLaunch() {
    // 初始化应用
    this.initApp()
    // 迁移分类数据到新的二级分类格式
    const StorageManager = require('./utils/storage.js')
    StorageManager.migrateCategories()
    
    // 监听系统主题变化
    this.watchSystemTheme()
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
    testTutorialPositions: false,  // 测试定位精度标识
    isDarkTheme: false,  // 深色主题标识
    autoFollowSystem: true  // 是否自动跟随系统主题
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
    this.initTheme()
  },

  // 初始化主题设置
  initTheme() {
    try {
      // 从存储中获取主题设置偏好
      const savedTheme = wx.getStorageSync('app_theme')
      const autoFollowSystem = wx.getStorageSync('app_theme_auto') !== false // 默认跟随系统
      
      let isDarkTheme = false
      
      if (autoFollowSystem) {
        // 自动跟随系统主题
        const systemInfo = wx.getSystemInfoSync()
        isDarkTheme = systemInfo.theme === 'dark'
        console.log('跟随系统主题:', systemInfo.theme, '-> isDark:', isDarkTheme)
      } else {
        // 使用用户手动设置的主题
        if (savedTheme === 'dark') {
          isDarkTheme = true
        } else if (savedTheme === 'light') {
          isDarkTheme = false
        } else {
          // 如果没有手动设置，默认跟随系统
          const systemInfo = wx.getSystemInfoSync()
          isDarkTheme = systemInfo.theme === 'dark'
        }
      }
      
      this.globalData.isDarkTheme = isDarkTheme
      this.globalData.autoFollowSystem = autoFollowSystem
      
      // 立即设置状态栏和导航栏样式
      setTimeout(() => {
        this.setTheme(isDarkTheme)
      }, 100)
      
    } catch (error) {
      console.error('初始化主题失败:', error)
      // 默认使用浅色主题
      this.globalData.isDarkTheme = false
      this.globalData.autoFollowSystem = true
      setTimeout(() => {
        this.setTheme(false)
      }, 100)
    }
  },

  // 监听系统主题变化
  watchSystemTheme() {
    try {
      // 检查是否支持主题变化监听
      if (typeof wx.onThemeChange === 'function') {
        console.log('开始监听系统主题变化')
        
        wx.onThemeChange((res) => {
          console.log('系统主题变化:', res.theme, '当前自动跟随状态:', this.globalData.autoFollowSystem)
          
          // 只有在自动跟随系统模式下才响应系统主题变化
          if (this.globalData.autoFollowSystem) {
            const isDarkTheme = res.theme === 'dark'
            console.log('应用主题变化:', isDarkTheme)
            
            this.globalData.isDarkTheme = isDarkTheme
            this.setTheme(isDarkTheme)
            
            // 通知所有页面主题已变化
            this.notifyPagesThemeChange(isDarkTheme)
            
            wx.showToast({
              title: isDarkTheme ? '已切换到深色模式' : '已切换到浅色模式',
              icon: 'none',
              duration: 1000
            })
          } else {
            console.log('当前为手动模式，忽略系统主题变化')
          }
        })
      } else {
        console.warn('当前微信版本不支持主题变化监听')
        
        // 提供一个备用方案：定期检查系统主题
        this.startThemePolling()
      }
    } catch (error) {
      console.error('监听系统主题失败:', error)
    }
  },

  // 备用方案：定期检查主题变化
  startThemePolling() {
    if (!this.globalData.autoFollowSystem) return
    
    let lastTheme = null
    
    const checkTheme = () => {
      if (!this.globalData.autoFollowSystem) return
      
      try {
        const systemInfo = wx.getSystemInfoSync()
        const currentTheme = systemInfo.theme
        
        if (lastTheme && lastTheme !== currentTheme) {
          console.log('检测到主题变化:', lastTheme, '->', currentTheme)
          
          const isDarkTheme = currentTheme === 'dark'
          this.globalData.isDarkTheme = isDarkTheme
          this.setTheme(isDarkTheme)
          this.notifyPagesThemeChange(isDarkTheme)
          
          wx.showToast({
            title: isDarkTheme ? '已切换到深色模式' : '已切换到浅色模式',
            icon: 'none',
            duration: 1000
          })
        }
        
        lastTheme = currentTheme
      } catch (error) {
        console.error('检查主题失败:', error)
      }
    }
    
    // 每2秒检查一次主题变化
    if (this._themePollingTimer) clearInterval(this._themePollingTimer)
    this._themePollingTimer = setInterval(checkTheme, 2000)
    checkTheme() // 立即执行一次
  },

  // 通知所有页面主题变化
  notifyPagesThemeChange(isDarkTheme) {
    try {
      const pages = getCurrentPages()
      pages.forEach(page => {
        if (page.setTheme && typeof page.setTheme === 'function') {
          page.setTheme(isDarkTheme)
        }
        // 更新页面数据
        if (page.setData && typeof page.setData === 'function') {
          page.setData({
            isDarkTheme: isDarkTheme
          })
        }
      })
    } catch (error) {
      console.error('通知页面主题变化失败:', error)
    }
  },

  // 切换主题（手动模式）
  toggleTheme() {
    this.globalData.isDarkTheme = !this.globalData.isDarkTheme
    // 手动切换主题时，关闭自动跟随系统
    this.globalData.autoFollowSystem = false
    
    this.setTheme(this.globalData.isDarkTheme)
    
    // 保存主题设置
    try {
      wx.setStorageSync('app_theme', this.globalData.isDarkTheme ? 'dark' : 'light')
      wx.setStorageSync('app_theme_auto', false) // 保存手动模式状态
    } catch (error) {
      console.error('保存主题设置失败:', error)
    }
  },

  // 设置自动跟随系统主题
  setAutoFollowSystem(autoFollow) {
    this.globalData.autoFollowSystem = autoFollow
    
    if (autoFollow) {
      // 开启自动跟随时，立即同步系统主题
      try {
        const systemInfo = wx.getSystemInfoSync()
        const isDarkTheme = systemInfo.theme === 'dark'
        this.globalData.isDarkTheme = isDarkTheme
        this.setTheme(isDarkTheme)
        
        // 通知所有页面主题已变化
        this.notifyPagesThemeChange(isDarkTheme)
        
        // 如果wx.onThemeChange不支持，启动轮询检查
        if (typeof wx.onThemeChange !== 'function') {
          this.startThemePolling()
        }
      } catch (error) {
        console.error('同步系统主题失败:', error)
      }
    }
    
    // 保存设置
    try {
      wx.setStorageSync('app_theme_auto', autoFollow)
      if (!autoFollow) {
        // 如果关闭自动跟随，保存当前主题为手动设置
        wx.setStorageSync('app_theme', this.globalData.isDarkTheme ? 'dark' : 'light')
      }
    } catch (error) {
      console.error('保存自动跟随设置失败:', error)
    }
  },

  // 设置主题
  setTheme(isDark) {
    try {
      // 设置全局导航栏样式
      wx.setNavigationBarColor({
        frontColor: isDark ? '#ffffff' : '#000000',
        backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
        animation: {
          duration: 300,
          timingFunc: 'easeInOut'
        }
      })
      
      // 设置导航栏底部边框颜色 - 修复白色边框问题
      try {
        // 多次设置确保生效，解决导航栏底部白色边框
        const bgColor = isDark ? '#1e1e1e' : '#ffffff'
        
        // 第一次设置
        wx.setBackgroundColor({
          backgroundColor: bgColor,
          backgroundColorTop: bgColor,
          backgroundColorBottom: bgColor
        })
        
        // 延迟再次设置，确保覆盖系统默认样式
        setTimeout(() => {
          wx.setBackgroundColor({
            backgroundColor: bgColor,
            backgroundColorTop: bgColor,
            backgroundColorBottom: bgColor
          })
        }, 50)
        
        // 第三次设置，确保稳定
        setTimeout(() => {
          wx.setNavigationBarColor({
            frontColor: isDark ? '#ffffff' : '#000000',
            backgroundColor: bgColor,
            animation: {
              duration: 0,
              timingFunc: 'linear'
            }
          })
        }, 100)
        
      } catch (bgError) {
        console.warn('设置导航栏边框颜色失败:', bgError)
      }
      
      // 设置胶囊按钮区域样式（小程序标题栏右侧按钮）
      try {
        if (typeof wx.setNavigationBarColor === 'function') {
          // 确保胶囊按钮区域也跟随主题
          const capsuleButtonRect = wx.getMenuButtonBoundingClientRect && wx.getMenuButtonBoundingClientRect()
          if (capsuleButtonRect) {
            // 设置胶囊按钮周围的背景色
            wx.setNavigationBarColor({
              frontColor: isDark ? '#ffffff' : '#000000',
              backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
              animation: {
                duration: 300,
                timingFunc: 'easeInOut'
              }
            })
          }
        }
      } catch (capsuleError) {
        console.warn('设置胶囊按钮区域样式失败:', capsuleError)
      }
      
      // 获取所有页面实例
      const pages = getCurrentPages()
      
      // 为所有页面设置主题
      pages.forEach(page => {
        if (page.setTheme && typeof page.setTheme === 'function') {
          page.setTheme(isDark)
        }
      })
      
      // 设置状态栏样式
      try {
        if (isDark) {
          // 深色主题：状态栏文字为白色
          wx.setStatusBarStyle && wx.setStatusBarStyle({
            style: 'light'
          })
        } else {
          // 浅色主题：状态栏文字为黑色
          wx.setStatusBarStyle && wx.setStatusBarStyle({
            style: 'dark'
          })
        }
      } catch (statusError) {
        console.warn('设置状态栏样式失败:', statusError)
      }
      
      // 设置页面背景色（可能影响胶囊按钮区域）
      try {
        wx.setBackgroundColor && wx.setBackgroundColor({
          backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
          backgroundColorTop: isDark ? '#1e1e1e' : '#ffffff',
          backgroundColorBottom: isDark ? '#1e1e1e' : '#ffffff'
        })
      } catch (bgError) {
        console.warn('设置页面背景色失败:', bgError)
      }
      
      // 设置全局页面类名
      if (isDark) {
        // 添加深色主题类
        wx.setTabBarStyle && wx.setTabBarStyle({
          backgroundColor: '#1e1e1e',
          borderStyle: 'black',
          color: '#b3b3b3',
          selectedColor: '#667eea'
        })
      } else {
        // 设置浅色主题
        wx.setTabBarStyle && wx.setTabBarStyle({
          backgroundColor: '#ffffff',
          borderStyle: 'black',
          color: '#666666',
          selectedColor: '#667eea'
        })
      }
    } catch (error) {
      console.error('设置主题失败:', error)
    }
  },

  // 获取当前主题
  getTheme() {
    return this.globalData.isDarkTheme ? 'dark' : 'light'
  }
})