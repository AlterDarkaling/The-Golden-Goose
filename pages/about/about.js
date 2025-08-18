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
      title: '理财启蒙 - 富爸爸穷爸爸与小狗钱钱的智慧',
      path: '/pages/about/about'
    }
  }
})
