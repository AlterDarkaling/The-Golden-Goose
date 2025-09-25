Page({
  data: {
    // 主题相关
    isDarkTheme: false
  },

  onLoad() {
    // 初始化主题
    const app = getApp()
    const isDarkTheme = app.globalData ? app.globalData.isDarkTheme : false
    this.setData({ isDarkTheme })
    this.setTheme(isDarkTheme)
    
    // 设置页面标题
    wx.setNavigationBarTitle({
      title: '理财启蒙'
    })
  },

  onShow() {
    // 同步主题状态
    const app = getApp()
    if (app.globalData) {
      const isDarkTheme = app.globalData.isDarkTheme
      this.setData({ isDarkTheme })
      this.setTheme(isDarkTheme)
    }
  },

  // 设置页面主题
  setTheme(isDark) {
    try {
      wx.setNavigationBarColor({
        frontColor: isDark ? '#ffffff' : '#000000',
        backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
        animation: {
          duration: 100,
          timingFunc: 'easeInOut'
        }
      })
      if (wx.setBackgroundColor) {
        const bgColor = isDark ? '#1e1e1e' : '#ffffff'
        wx.setBackgroundColor({
          backgroundColor: bgColor,
          backgroundColorTop: bgColor,
          backgroundColorBottom: bgColor
        })
        setTimeout(() => {
          wx.setBackgroundColor({
            backgroundColor: bgColor,
            backgroundColorTop: bgColor,
            backgroundColorBottom: bgColor
          })
        }, 50)
      }
      this.setData({
        isDarkTheme: isDark
      })
    } catch (error) {
      console.error('设置页面主题失败:', error)
    }
  },

  onShareAppMessage() {
    return {
      title: '理财启蒙 - 现代财务管理知识',
      path: '/pages/about/about'
    }
  }
})
