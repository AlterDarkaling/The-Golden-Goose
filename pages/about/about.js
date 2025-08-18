Page({
  data: {
    
  },

  onLoad() {
    // 设置页面标题
    wx.setNavigationBarTitle({
      title: '理财启蒙'
    })
  },

  onShareAppMessage() {
    return {
      title: '理财启蒙 - 现代财务管理知识',
      path: '/pages/about/about'
    }
  }
})
