const StorageManager = require('../../utils/storage.js')

Page({
  data: {
    userInfo: {},
    displayInfo: {
      avatar: '',
      nickname: ''
    },
    stats: {
      usageDays: 0,
      categoryCount: 0,
      assetCount: 0
    },
    showNicknameInput: false,
    tempNickname: '',
    showMottoInput: false,
    tempMotto: ''
  },

  onLoad() {
    this.loadUserInfo()
    this.calculateStats()
  },

  onShow() {
    this.loadUserInfo()
    this.calculateStats()
  },

  loadUserInfo() {
    const userInfo = StorageManager.getUser()
    if (userInfo) {
      // 计算显示信息
      const displayInfo = {
        avatar: userInfo.useWechatInfo && userInfo.wechatAvatar ? userInfo.wechatAvatar : userInfo.avatar,
        nickname: userInfo.useWechatInfo && userInfo.wechatNickname ? userInfo.wechatNickname : userInfo.nickname,
        motto: userInfo.motto || '理财从认识资产负债开始'
      }
      
      this.setData({
        userInfo,
        displayInfo
      })
    }
  },

  calculateStats() {
    const assets = StorageManager.getAssets()
    const liabilities = StorageManager.getLiabilities()
    
    // 计算使用天数（从用户创建时间开始，最少显示1天）
    let usageDays = 1
    if (this.data.userInfo.createTime) {
      const createDate = new Date(this.data.userInfo.createTime)
      const now = new Date()
      const diffDays = Math.floor((now - createDate) / (1000 * 60 * 60 * 24))
      usageDays = diffDays > 0 ? diffDays : 1
    }

    // 计算净资产
    const netWorth = StorageManager.calculateNetWorth()
    const netWorthText = this.formatMoney(netWorth)

    // 获取总记录数量（资产+负债）
    const assetCount = assets.length + liabilities.length

    this.setData({
      stats: {
        usageDays,
        netWorth: netWorthText,
        assetCount
      }
    })
  },

  // 格式化金额显示
  formatMoney(amount) {
    if (Math.abs(amount) >= 10000) {
      return (amount / 10000).toFixed(1) + '万'
    }
    return amount.toFixed(0)
  },

  // 新的头像选择处理 - 使用微信官方推荐的方式
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    console.log('选择的头像路径:', avatarUrl)
    
    // 更新显示的头像
    this.setData({
      'displayInfo.avatar': avatarUrl
    })
    
    // 保存头像到用户信息
    this.updateAvatar(avatarUrl)
    
    wx.showToast({
      title: '头像更新成功',
      icon: 'success'
    })
  },

  // 昵称修改处理
  onNicknameChange(e) {
    const newNickname = e.detail.value
    console.log('新昵称:', newNickname)
    
    // 更新显示的昵称
    this.setData({
      'displayInfo.nickname': newNickname
    })
    
    // 保存昵称到用户信息
    const userInfo = { ...this.data.userInfo, nickname: newNickname }
    wx.setStorageSync('user_info', userInfo)
    this.setData({ userInfo })
    
    wx.showToast({
      title: '昵称更新成功',
      icon: 'success'
    })
  },

  // 选择头像 (保留作为备用方法)
  chooseAvatar() {
    const { userInfo } = this.data
    const items = ['从相册选择', '拍照']
    
    // 如果已有微信头像，提供使用选项
    if (userInfo.wechatAvatar) {
      items.push('使用微信头像')
    }
    
    wx.showActionSheet({
      itemList: items,
      success: (res) => {
        if (res.tapIndex === 0) {
          this.selectFromAlbum()
        } else if (res.tapIndex === 1) {
          this.takePhoto()
        } else if (res.tapIndex === 2 && userInfo.wechatAvatar) {
          this.useWechatAvatar()
        }
      }
    })
  },

  selectFromAlbum() {
    wx.chooseImage({
      count: 1,
      sourceType: ['album'],
      success: (res) => {
        this.updateAvatar(res.tempFilePaths[0])
      }
    })
  },

  takePhoto() {
    wx.chooseImage({
      count: 1,
      sourceType: ['camera'],
      success: (res) => {
        this.updateAvatar(res.tempFilePaths[0])
      }
    })
  },

  updateAvatar(avatarPath) {
    const userInfo = { ...this.data.userInfo, avatar: avatarPath }
    StorageManager.saveUser(userInfo)
    this.setData({
      userInfo
    })
    wx.showToast({
      title: '头像更新成功',
      icon: 'success'
    })
  },

  // 使用微信头像
  useWechatAvatar() {
    const { userInfo } = this.data
    if (userInfo.wechatAvatar) {
      userInfo.useWechatInfo = true
      StorageManager.saveUser(userInfo)
      this.loadUserInfo()
      wx.showToast({
        title: '已设置微信头像',
        icon: 'success'
      })
    }
  },

  // 选择昵称
  chooseNickname() {
    const { userInfo } = this.data
    const items = ['自定义输入昵称', '使用微信昵称输入']
    
    // 如果已有微信昵称，提供直接使用选项
    if (userInfo.wechatNickname) {
      items.push('使用已保存的微信昵称')
    }
    
    wx.showActionSheet({
      itemList: items,
      success: (res) => {
        if (res.tapIndex === 0) {
          this.customNickname()
        } else if (res.tapIndex === 1) {
          this.showWechatNicknameInput()
        } else if (res.tapIndex === 2 && userInfo.wechatNickname) {
          this.useWechatNickname()
        }
      }
    })
  },

  // 显示微信昵称输入框
  showWechatNicknameInput() {
    wx.showModal({
      title: '使用微信昵称',
      content: '将为您显示微信昵称输入框，点击确定后在输入框中可自动填充微信昵称',
      success: (res) => {
        if (res.confirm) {
          this.showNicknameInputModal()
        }
      }
    })
  },

  // 显示带有nickname类型的输入框
  showNicknameInputModal() {
    this.setData({
      showNicknameInput: true,
      tempNickname: this.data.displayInfo.nickname || ''
    })
  },

  // 关闭昵称输入弹窗
  closeNicknameInput() {
    this.setData({
      showNicknameInput: false,
      tempNickname: ''
    })
  },

  // 临时昵称输入
  onTempNicknameInput(e) {
    this.setData({
      tempNickname: e.detail.value
    })
  },

  // 确认昵称
  confirmNickname() {
    const { tempNickname } = this.data
    if (!tempNickname.trim()) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      })
      return
    }

    // 更新昵称
    this.setData({
      'displayInfo.nickname': tempNickname,
      showNicknameInput: false
    })

    // 保存到用户信息
    const userInfo = { ...this.data.userInfo, nickname: tempNickname }
    wx.setStorageSync('user_info', userInfo)
    this.setData({ userInfo })

    wx.showToast({
      title: '昵称更新成功',
      icon: 'success'
    })
  },

  // 更换个人签名
  changeMotto() {
    this.setData({
      showMottoInput: true,
      tempMotto: this.data.displayInfo.motto || ''
    })
  },

  closeMottoInput() {
    this.setData({
      showMottoInput: false,
      tempMotto: ''
    })
  },

  onTempMottoInput(e) {
    this.setData({
      tempMotto: e.detail.value
    })
  },

  confirmMotto() {
    const motto = this.data.tempMotto.trim() || '理财从认识资产负债开始'
    
    // 更新显示
    this.setData({
      'displayInfo.motto': motto,
      showMottoInput: false,
      tempMotto: ''
    })
    
    // 保存到用户信息
    const userInfo = { ...this.data.userInfo, motto: motto }
    wx.setStorageSync('user_info', userInfo)
    this.setData({ userInfo })
    
    wx.showToast({
      title: '个人签名已更新',
      icon: 'success'
    })
  },

  // 自定义昵称
  customNickname() {
    const { userInfo } = this.data
    wx.showModal({
      title: '设置昵称',
      placeholderText: '请输入昵称',
      editable: true,
      success: (res) => {
        if (res.confirm && res.content && res.content.trim()) {
          userInfo.nickname = res.content.trim()
          userInfo.useWechatInfo = false
          StorageManager.saveUser(userInfo)
          this.loadUserInfo()
          wx.showToast({
            title: '昵称设置成功',
            icon: 'success'
          })
        }
      }
    })
  },

  // 使用微信昵称
  useWechatNickname() {
    const { userInfo } = this.data
    if (userInfo.wechatNickname) {
      userInfo.useWechatInfo = true
      StorageManager.saveUser(userInfo)
      this.loadUserInfo()
      wx.showToast({
        title: '已设置微信昵称',
        icon: 'success'
      })
    }
  },

  // 废弃的getUserProfile方法已被移除
  // 现在使用新的头像选择方式: onChooseAvatar 方法

  // 废弃的getUserProfile昵称获取方法已被移除
  // 现在使用nickname类型的input组件: onNicknameChange 方法

  // 废弃的getUserProfile信息获取方法已被移除
  // 微信官方已不再支持直接获取用户信息，请使用新的交互方式

  // 功能菜单点击事件
  handleFinancialReport() {
    wx.navigateTo({
      url: '/pages/report/report'
    })
  },

  handleDreamJar() {
    wx.navigateTo({
      url: '/pages/goals/goals'
    })
  },

  handleSettings() {
    wx.showActionSheet({
      itemList: ['主题设置', '数据设置', '通知设置'],
      success: (res) => {
        const actions = ['主题设置', '数据设置', '通知设置']
        wx.showToast({
          title: `${actions[res.tapIndex]}功能开发中`,
          icon: 'none'
        })
      }
    })
  },

  handleDataBackup() {
    wx.showActionSheet({
      itemList: ['生成备份报告', '导出CSV格式', '查看数据统计'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.generateBackupReport()
        } else if (res.tapIndex === 1) {
          this.exportCSVData()
        } else if (res.tapIndex === 2) {
          this.showDataStatistics()
        }
      }
    })
  },

  generateBackupReport() {
    const assets = StorageManager.getAssets()
    const liabilities = StorageManager.getLiabilities()
    
    if (assets.length === 0 && liabilities.length === 0) {
      wx.showToast({
        title: '暂无数据可备份',
        icon: 'none'
      })
      return
    }

    const totalAssetValue = assets.reduce((sum, asset) => sum + (asset.currentValue || asset.initialValue || 0), 0)
    const totalLiabilityValue = liabilities.reduce((sum, liability) => sum + (liability.currentAmount || liability.initialAmount || 0), 0)
    const netWorth = totalAssetValue - totalLiabilityValue

    wx.showModal({
      title: '数据备份报告',
      content: `备份时间：${new Date().toLocaleString()}\n\n📊 数据统计：\n• 资产记录：${assets.length}条\n• 负债记录：${liabilities.length}条\n• 资产总值：¥${this.formatNumber(totalAssetValue)}\n• 负债总额：¥${this.formatNumber(totalLiabilityValue)}\n• 净资产：¥${this.formatNumber(netWorth)}\n\n✅ 数据已保存到本地存储`,
      showCancel: false
    })
  },

  exportCSVData() {
    wx.showToast({
      title: 'CSV导出功能开发中',
      icon: 'none'
    })
  },

  showDataStatistics() {
    const assets = StorageManager.getAssets()
    const liabilities = StorageManager.getLiabilities()
    const dailyIncome = StorageManager.calculateDailyIncome()
    const dailyCost = StorageManager.calculateDailyCost()

    wx.showModal({
      title: '数据统计',
      content: `📈 收益分析：\n• 每日收益：¥${dailyIncome.toFixed(2)}\n• 每日成本：¥${dailyCost.toFixed(2)}\n• 日净收益：¥${(dailyIncome - dailyCost).toFixed(2)}\n\n📋 记录分析：\n• 使用中的资产：${assets.filter(a => a.status === 'active').length}项\n• 使用中的负债：${liabilities.filter(l => l.status === 'active').length}项`,
      showCancel: false
    })
  },

  formatNumber(num) {
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  },

  handleDataRestore() {
    wx.showToast({
      title: '数据恢复功能开发中',
      icon: 'none'
    })
  },

  // 其他功能
  handleAboutBooks() {
    wx.navigateTo({
      url: '/pages/about/about'
    })
  },

  handleFeedback() {
    wx.showModal({
      title: '意见反馈',
      content: '感谢您使用会下金蛋的鹅！如有建议或问题，请通过以下方式联系我们：\n\n邮箱：feedback@example.com',
      showCancel: false
    })
  },

  handleClearData() {
    wx.showModal({
      title: '清空数据',
      content: '确定要清空所有资产负债记录吗？此操作无法恢复！',
      confirmText: '确定清空',
      confirmColor: '#ff4757',
      success: (res) => {
        if (res.confirm) {
          // 清空数据但保留用户信息
          wx.removeStorageSync('assets_data')
          wx.removeStorageSync('liabilities_data')
          
          wx.showToast({
            title: '数据已清空',
            icon: 'success'
          })
          
          // 重新计算统计数据
          this.calculateStats()
        }
      }
    })
  },

  // 退出登录
  handleLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除用户信息
          wx.removeStorageSync('user_info')
          
          // 跳转到登录页
          wx.reLaunch({
            url: '/pages/login/login'
          })
        }
      }
    })
  }
})
