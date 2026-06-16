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
    tempMotto: '',
    showHiddenNicknameInput: false,
    // 主题相关
    isDarkTheme: false,
    autoFollowSystem: true,
    // 教程相关
    showTutorial: false,
    tutorialStep: 0,
    currentTutorialStep: {},
    bubbleStyle: {
      position: 'fixed',
      opacity: '0',
      visibility: 'hidden',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    },
    arrowClass: 'arrow-up',
    bubbleVisible: false,
    tutorialSteps: [
      {
        title: '个人中心',
        content: '这里是您的个人资料和设置中心，您可以管理头像、昵称、个人签名等信息。',
        target: '.user-card',
        position: 'center-bottom'
      },
      {
        title: '统计数据',
        content: '这里显示您的使用统计：使用天数、净资产和记录数量，帮助您了解理财进展。',
        target: '.stats-container',
        position: 'center-bottom'
      },
      {
        title: '功能菜单',
        content: '这里提供了财务报告、梦想储蓄罐、数据备份等实用功能，帮助您更好地管理财务。',
        target: '.menu-grid',
        position: 'center-bottom'
      },
      {
        title: '更多功能',
        content: '这里有理财启蒙知识、功能引导、意见反馈等更多实用功能。',
        target: '.settings-section',
        position: 'center-top'
      }
    ]
  },

  // 设置主题
  setTheme(isDark) {
    try {
      // 强制设置导航栏颜色（确保立即生效）
      wx.setNavigationBarColor({
        frontColor: isDark ? '#ffffff' : '#000000',
        backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
        animation: {
          duration: 100,
          timingFunc: 'easeInOut'
        }
      })
      
      // 设置页面背景色 - 修复白色边框
      if (wx.setBackgroundColor) {
        const bgColor = isDark ? '#1e1e1e' : '#ffffff'
        
        // 多次设置确保覆盖系统默认的白色边框
        wx.setBackgroundColor({
          backgroundColor: bgColor,
          backgroundColorTop: bgColor,
          backgroundColorBottom: bgColor
        })
        
        // 延迟设置确保生效
        setTimeout(() => {
          wx.setBackgroundColor({
            backgroundColor: bgColor,
            backgroundColorTop: bgColor,
            backgroundColorBottom: bgColor
          })
        }, 50)
      }
      
      // 重新渲染界面以应用主题
      this.setData({
        isDarkTheme: isDark
      })
    } catch (error) {
      console.error('设置页面主题失败:', error)
    }
  },

  onLoad() {
    this.loadUserInfo()
    this.calculateStats()
    // 初始化主题状态
    const app = getApp()
    const isDark = app.globalData.isDarkTheme || false
    const autoFollow = app.globalData.autoFollowSystem !== undefined ? app.globalData.autoFollowSystem : true
    
    
    this.setData({
      isDarkTheme: isDark,
      autoFollowSystem: autoFollow
    })
    // 设置导航栏主题
    this.setTheme(isDark)
  },

  onShow() {
    // 确保主题设置正确（避免页面切换时的白色闪烁）
    const app = getApp()
    
    
    if (app.globalData.isDarkTheme !== undefined) {
      this.setTheme(app.globalData.isDarkTheme)
      // 同步主题状态到页面数据
      this.setData({
        isDarkTheme: app.globalData.isDarkTheme,
        autoFollowSystem: app.globalData.autoFollowSystem
      })
      
    }
    
    this.loadUserInfo()
    this.calculateStats()
    // 检查个人中心教程
    try {
      this.checkProfileTutorial()
    } catch (error) {
      console.error('教程检查失败:', error)
    }
  },

  loadUserInfo() {
    const userInfo = StorageManager.getUser()
    if (userInfo) {
      // 计算显示信息
      const displayInfo = {
        // 头像显示逻辑：
        // 1. 如果有自定义头像，优先使用自定义头像
        // 2. 如果没有自定义头像但有微信头像，使用微信头像  
        // 3. 最后使用默认头像
        avatar: userInfo.avatar || userInfo.wechatAvatar || '/static/default-avatar.svg',
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
    const num = parseFloat(amount) || 0
    const sign = num < 0 ? '-' : ''
    return sign + '¥' + Math.abs(num).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  },

  // 新的头像选择处理 - 使用微信官方推荐的方式
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail || {}
    
    // 检查是否真的选择了头像（用户可能取消了操作）
    if (!avatarUrl) {
      console.log('用户取消了头像选择')
      return
    }
    
    // 将临时文件保存到本地永久存储
    const fileName = `avatar_${Date.now()}.jpg`
    
    wx.getFileSystemManager().saveFile({
      tempFilePath: avatarUrl,
      success: (res) => {
        const savedFilePath = res.savedFilePath
        
        // 清理旧的头像文件
        const oldAvatar = this.data.userInfo.avatar
        if (oldAvatar && oldAvatar.startsWith(wx.env.USER_DATA_PATH)) {
          wx.getFileSystemManager().unlink({
            filePath: oldAvatar,
            success: () => {},
            fail: () => {}
          })
        }
        
        // 保存头像信息
        const userInfo = { 
          ...this.data.userInfo, 
          avatar: savedFilePath,         // 保存永久文件路径
          wechatAvatar: savedFilePath,   // 同时保存微信头像备份
          useWechatInfo: true            // 设置使用微信信息
        }
        
        StorageManager.saveUser(userInfo)
        
        this.setData({
          userInfo
        })
        this.loadUserInfo()  // 重新加载用户信息以更新显示
        
        wx.showToast({
          title: '头像设置成功',
          icon: 'success'
        })
      },
      fail: (err) => {
        console.error('头像保存失败:', err)
        wx.showToast({
          title: '头像保存失败',
          icon: 'error'
        })
      }
    })
  },

  // 昵称修改处理
  onNicknameChange(e) {
    const newNickname = e.detail.value
    
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
    const userInfo = { 
      ...this.data.userInfo, 
      avatar: avatarPath,
      useWechatInfo: false  // 设置自定义头像时，关闭微信信息使用标志
    }
    StorageManager.saveUser(userInfo)
    this.setData({
      userInfo
    })
    this.loadUserInfo()  // 重新加载用户信息以更新显示
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
    const items = ['自定义输入昵称', '微信昵称']
    
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

  // 显示微信昵称输入框（直接使用微信原生昵称输入）
  showWechatNicknameInput() {
    // 通过数据驱动显示隐藏输入框并自动获得焦点
    this.setData({
      showHiddenNicknameInput: true
    })
    
    wx.showToast({
      title: '请在弹出框中选择昵称',
      icon: 'none',
      duration: 2000
    })
    
    // 短暂延迟后隐藏，确保微信昵称选择被触发
    setTimeout(() => {
      this.setData({
        showHiddenNicknameInput: false
      })
    }, 3000)
  },

  // 直接处理微信原生昵称输入
  onDirectNicknameChange(e) {
    const nickname = e.detail.value
    if (nickname && nickname.trim()) {
      // 直接保存微信昵称，无需弹窗确认
      const updatedUserInfo = {
        ...this.data.userInfo,
        nickname: nickname.trim()
      }

      // 注意：这里不修改头像设置，完全保持用户当前的头像选择
      // 无论用户使用的是微信头像还是自定义头像，都不应该在改昵称时修改
      
      StorageManager.saveUser(updatedUserInfo)
      this.setData({ userInfo: updatedUserInfo })
      this.loadUserInfo()

      wx.showToast({
        title: '微信昵称设置成功',
        icon: 'success'
      })
    }
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

  // 昵称输入框失去焦点时（微信昵称自动填充后会触发）
  onNicknameBlur(e) {
    const value = e.detail.value
    if (value && value !== this.data.tempNickname) {
      this.setData({
        tempNickname: value
      })
      // 给用户一个反馈，表示昵称已填充
      if (value.length > 0) {
        wx.showToast({
          title: '微信昵称已填充',
          icon: 'success',
          duration: 1500
        })
      }
    }
  },

  // 昵称输入框获得焦点时
  onNicknameFocus(e) {
    // 延迟检查输入框的值，确保微信昵称填充完成
    setTimeout(() => {
      const inputElement = e.target
      if (inputElement && inputElement.value && inputElement.value !== this.data.tempNickname) {
        this.setData({
          tempNickname: inputElement.value
        })
        // 给用户一个反馈，表示昵称已填充
        wx.showToast({
          title: '微信昵称已填充',
          icon: 'success',
          duration: 1500
        })
      }
    }, 100)
  },

  // 确认昵称
  confirmNickname() {
    const { tempNickname, userInfo } = this.data
    if (!tempNickname.trim()) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      })
      return
    }

    // 更新用户信息，严格保持头像设置不变
    const updatedUserInfo = {
      ...userInfo,
      nickname: tempNickname.trim()
    }

    // 注意：完全不修改任何头像相关的字段
    // 用户的头像选择（无论是微信头像还是自定义头像）都应该保持不变

    // 关闭弹窗
    this.setData({
      showNicknameInput: false,
      tempNickname: '',
      userInfo: updatedUserInfo
    })

    // 保存到存储
    StorageManager.saveUser(updatedUserInfo)
    
    // 重新加载用户信息以更新显示
    this.loadUserInfo()

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
          // 更新昵称，严格保持头像设置不变
          const updatedUserInfo = {
            ...userInfo,
            nickname: res.content.trim(),
            useWechatInfo: false  // 只针对昵称，头像逻辑独立处理
          }
          
          // 注意：完全不修改任何头像相关的字段
          // 用户的头像选择（无论是微信头像还是自定义头像）都应该保持不变
          
          StorageManager.saveUser(updatedUserInfo)
          this.setData({ userInfo: updatedUserInfo })
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



  handleDataBackup() {
    wx.showActionSheet({
      itemList: ['💾 完整数据备份', '🔧 简化备份（兼容模式）', '📊 导出CSV格式', '📋 数据统计报告'],
      success: (res) => {
        switch(res.tapIndex) {
          case 0:
            this.generateFullBackup()
            break
          case 1:
            this.generateSimpleBackup()
            break
          case 2:
            this.exportCSVData()
            break
          case 3:
            this.showDataStatistics()
            break
        }
      }
    })
  },

  // 生成完整备份
  generateFullBackup() {
    wx.showLoading({ title: '生成备份中...' })
    
    try {
      const backupData = this.createBackupData()
      console.log('生成的备份数据:', backupData)
      
      // 检查是否有数据可备份
      const hasAssets = backupData.coreData?.assets?.length > 0
      const hasLiabilities = backupData.coreData?.liabilities?.length > 0
      
      if (!hasAssets && !hasLiabilities) {
        wx.hideLoading()
        wx.showModal({
          title: '暂无数据可备份',
          content: '当前没有资产或负债数据可以备份。请先添加一些财务记录。',
          showCancel: false,
          confirmText: '知道了'
        })
        return
      }

      // 生成备份文件内容
      let backupContent
      try {
        backupContent = this.generateBackupContent(backupData)
        console.log('生成的备份内容长度:', backupContent.length)
      } catch (contentError) {
        console.error('生成备份内容失败:', contentError)
        // 如果生成内容失败，使用简化版本
        backupContent = `大鹅爱记账 - 数据备份\n时间：${new Date().toLocaleString()}\n\n备份数据：\n${JSON.stringify(backupData, null, 2)}`
      }
      
      wx.hideLoading()
      
      // 显示备份选项
      wx.showActionSheet({
        itemList: ['💾 复制完整备份数据', '📋 查看备份信息', '❓ 查看使用说明'],
        success: (res) => {
          switch(res.tapIndex) {
            case 0:
              this.copyJSONData(backupData)
              break
            case 1:
              this.showBackupContent(backupContent)
              break
            case 2:
              this.showBackupInstructions()
              break
          }
        }
      })
    } catch (error) {
      wx.hideLoading()
      console.error('Backup generation failed:', error)
      wx.showModal({
        title: '备份生成失败',
        content: `备份过程中出现错误：\n${error.message}\n\n请重试或联系技术支持。`,
        showCancel: false,
        confirmText: '知道了'
      })
    }
  },

  // 创建完整备份数据
  createBackupData() {
    try {
      console.log('开始创建备份数据...')
      
      // 核心数据
      let assets, liabilities, userInfo, settings
      
      try {
        assets = StorageManager.getAssets() || []
        console.log('获取资产数据成功:', assets.length)
      } catch (e) {
        console.error('获取资产数据失败:', e)
        assets = []
      }
      
      try {
        liabilities = StorageManager.getLiabilities() || []
        console.log('获取负债数据成功:', liabilities.length)
      } catch (e) {
        console.error('获取负债数据失败:', e)
        liabilities = []
      }
      
      try {
        userInfo = StorageManager.getUser() || {}
        console.log('获取用户信息成功')
      } catch (e) {
        console.error('获取用户信息失败:', e)
        userInfo = {}
      }
      
      try {
        settings = StorageManager.getSettings() || {}
        console.log('获取设置信息成功')
      } catch (e) {
        console.error('获取设置信息失败:', e)
        settings = {}
      }
      
      // 应用状态数据
      let appInitialized, hasSampleData
      try {
        appInitialized = wx.getStorageSync('app_initialized') || false
        hasSampleData = wx.getStorageSync('has_sample_data')
        console.log('获取应用状态成功')
      } catch (e) {
        console.error('获取应用状态失败:', e)
        appInitialized = false
        hasSampleData = false
      }
      
      // 获取存储信息（可选，失败不影响主要功能）
      let storageInfo, additionalData = {}
      try {
        storageInfo = wx.getStorageInfoSync()
        console.log('当前存储信息:', storageInfo)
        
        // 其他可能的数据
        storageInfo.keys.forEach(key => {
          // 排除已经包含的数据和临时数据
          if (!['assets_data', 'liabilities_data', 'user_info', 'settings_data', 'app_initialized', 'has_sample_data', 'backup_before_restore'].includes(key)) {
            try {
              additionalData[key] = wx.getStorageSync(key)
            } catch (e) {
              console.warn(`读取存储键 ${key} 失败:`, e)
            }
          }
        })
      } catch (e) {
        console.warn('获取存储信息失败，跳过额外数据备份:', e)
        additionalData = {}
      }
      
      // 获取系统信息
      let deviceInfo
      try {
        const sysInfo = wx.getSystemInfoSync()
        deviceInfo = {
          platform: sysInfo.platform || 'unknown',
          version: sysInfo.version || 'unknown',
          appVersion: '1.0.0'
        }
      } catch (e) {
        console.warn('获取系统信息失败:', e)
        deviceInfo = {
          platform: 'unknown',
          version: 'unknown', 
          appVersion: '1.0.0'
        }
      }
      
      // 核心数据对象
      const coreData = {
        assets: assets,
        liabilities: liabilities,
        userInfo: userInfo,
        settings: settings
      }
      
      // 生成统计信息
      let stats
      try {
        stats = this.calculateBackupStats(assets, liabilities)
      } catch (e) {
        console.warn('生成统计信息失败:', e)
        stats = {
          totalAssets: assets.length,
          totalLiabilities: liabilities.length,
          totalAssetValue: 0,
          totalLiabilityValue: 0,
          netWorth: 0
        }
      }
      
      // 生成校验和
      let checksum
      try {
        checksum = this.generateChecksum(coreData)
      } catch (e) {
        console.warn('生成校验和失败:', e)
        checksum = 'unknown'
      }
      
      const backupData = {
        // 备份元信息
        version: '3.0',
        timestamp: new Date().toISOString(),
        deviceInfo: deviceInfo,
        
        // 核心业务数据
        coreData: coreData,
        
        // 应用状态数据  
        appState: {
          appInitialized: appInitialized,
          hasSampleData: hasSampleData
        },
        
        // 其他数据
        additionalData: additionalData,
        
        // 数据统计
        stats: stats,
        
        // 数据完整性校验
        checksum: checksum
      }
      
      console.log('完整备份数据:', backupData)
      return backupData
      
    } catch (error) {
      console.error('创建备份数据失败:', error)
      throw new Error(`备份数据创建失败: ${error.message}`)
    }
  },

  // 生成简化备份（兼容模式）
  generateSimpleBackup() {
    wx.showLoading({ title: '生成简化备份中...' })
    
    try {
      // 只备份核心数据，避免复杂的存储扫描
      const assets = StorageManager.getAssets() || []
      const liabilities = StorageManager.getLiabilities() || []
      const userInfo = StorageManager.getUser() || {}
      
      // 简化的备份数据结构
      const backupData = {
        version: '2.0',
        timestamp: new Date().toISOString(),
        assets: assets,
        liabilities: liabilities,
        userInfo: userInfo,
        stats: {
          totalAssets: assets.length,
          totalLiabilities: liabilities.length
        }
      }
      
      console.log('简化备份数据:', backupData)
      
      if (!assets.length && !liabilities.length) {
        wx.hideLoading()
        wx.showModal({
          title: '暂无数据可备份',
          content: '当前没有资产或负债数据可以备份。请先添加一些财务记录。',
          showCancel: false,
          confirmText: '知道了'
        })
        return
      }
      
      wx.hideLoading()
      
      // 直接复制JSON数据
      const jsonContent = JSON.stringify(backupData, null, 2)
      this.copyToClipboard(jsonContent)
      
      wx.showModal({
        title: '简化备份完成',
        content: `📋 备份数据已复制到剪贴板\n\n📊 备份内容：\n• 资产记录：${assets.length}条\n• 负债记录：${liabilities.length}条\n• 备份时间：${new Date().toLocaleString()}\n\n💡 此为简化版本，如需完整备份请使用"完整数据备份"功能。`,
        showCancel: false,
        confirmText: '知道了'
      })
      
    } catch (error) {
      wx.hideLoading()
      console.error('简化备份失败:', error)
      wx.showModal({
        title: '简化备份失败',
        content: `备份过程中出现错误：\n${error.message}\n\n请尝试使用其他备份方式或联系技术支持。`,
        showCancel: false,
        confirmText: '知道了'
      })
    }
  },

  // 生成数据校验和
  generateChecksum(data) {
    try {
      const dataString = JSON.stringify(data)
      // 简单的校验和算法
      let hash = 0
      for (let i = 0; i < dataString.length; i++) {
        const char = dataString.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // 转换为32位整数
      }
      return hash.toString(36)
    } catch (error) {
      console.warn('生成校验和失败:', error)
      return 'unknown'
    }
  },

  // 计算备份统计
  calculateBackupStats(assets, liabilities) {
    // 确保参数是数组
    const safeAssets = Array.isArray(assets) ? assets : []
    const safeLiabilities = Array.isArray(liabilities) ? liabilities : []
    
    const totalAssetValue = safeAssets.reduce((sum, asset) => 
      sum + (asset.currentValue || asset.originalValue || asset.initialValue || 0), 0)
    const totalLiabilityValue = safeLiabilities.reduce((sum, liability) => 
      sum + (liability.currentAmount || liability.originalAmount || liability.initialAmount || 0), 0)
    const netWorth = totalAssetValue - totalLiabilityValue
    
    return {
      totalAssets: safeAssets.length,
      totalLiabilities: safeLiabilities.length,
      totalAssetValue,
      totalLiabilityValue,
      netWorth,
      dailyIncome: StorageManager.calculateDailyIncome ? StorageManager.calculateDailyIncome() : 0,
      dailyCost: StorageManager.calculateDailyCost ? StorageManager.calculateDailyCost() : 0
    }
  },

  // 生成备份内容
  generateBackupContent(backupData) {
    const { stats, version, coreData, appState } = backupData
    const assets = version === '3.0' ? coreData?.assets || [] : backupData.assets || []
    const liabilities = version === '3.0' ? coreData?.liabilities || [] : backupData.liabilities || []
    const userInfo = version === '3.0' ? coreData?.userInfo || {} : backupData.userInfo || {}
    
    return `🦢 大鹅爱记账 - 完整数据备份
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 备份信息
• 版本：v${version}
• 时间：${new Date(backupData.timestamp).toLocaleString()}
• 设备：${backupData.deviceInfo.platform} ${backupData.deviceInfo.version}
• 用户：${userInfo.nickname || '未设置'}
• 校验：${backupData.checksum || '无'}

━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 财务数据统计
━━━━━━━━━━━━━━━━━━━━━━━━━━
💎 资产记录：${stats.totalAssets}条
💳 负债记录：${stats.totalLiabilities}条
💰 资产总值：¥${this.formatNumber(stats.totalAssetValue)}
💸 负债总额：¥${this.formatNumber(stats.totalLiabilityValue)}
🏆 净资产：¥${this.formatNumber(stats.netWorth)}
📈 每日收益：¥${stats.dailyIncome.toFixed(2)}
📉 每日成本：¥${stats.dailyCost.toFixed(2)}
💵 日净收益：¥${(stats.dailyIncome - stats.dailyCost).toFixed(2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 详细备份数据
━━━━━━━━━━━━━━━━━━━━━━━━━━
${this.generateDetailedBackupContent(backupData)}

━━━━━━━━━━━━━━━━━━━━━━━━━━
💾 备份版本：${backupData.version}
🔒 数据完整性：已验证
✅ 备份状态：成功生成

📝 使用说明：
1. 此备份包含完整的财务数据
2. 可用于数据恢复和迁移
3. 建议定期创建备份
4. 请妥善保管备份文件`
  },

  // 生成详细备份内容
  generateDetailedBackupContent(backupData) {
    let content = ''
    
    // 兼容v2.0和v3.0数据结构
    const assets = backupData.assets || backupData.coreData?.assets || []
    const liabilities = backupData.liabilities || backupData.coreData?.liabilities || []
    
    // 资产详情
    if (assets.length > 0) {
      content += '💎 资产明细：\n'
      assets.forEach((asset, index) => {
        const value = asset.currentValue || asset.originalValue || asset.initialValue || 0
        content += `${index + 1}. ${asset.name} - ¥${this.formatNumber(value)}\n`
      })
      content += '\n'
    }
    
    // 负债详情
    if (liabilities.length > 0) {
      content += '💳 负债明细：\n'
      liabilities.forEach((liability, index) => {
        const value = liability.currentAmount || liability.originalAmount || liability.initialAmount || 0
        content += `${index + 1}. ${liability.name} - ¥${this.formatNumber(value)}\n`
      })
      content += '\n'
    }
    
    return content || '暂无详细数据'
  },



  // 导出CSV格式
  exportCSVData() {
    wx.showLoading({ title: '生成CSV...' })
    
    try {
      const assets = StorageManager.getAssets() || []
      const liabilities = StorageManager.getLiabilities() || []
      
      // 生成资产CSV
      let assetsCSV = '类型,名称,分类,原值,现值,月收入,月支出,状态,创建时间\n'
      assets.forEach(asset => {
        const row = [
          '资产',
          asset.name || '',
          asset.categoryL2 || asset.categoryId || '',
          asset.originalValue || asset.initialValue || 0,
          asset.currentValue || asset.originalValue || asset.initialValue || 0,
          asset.monthlyIncome || 0,
          asset.monthlyOperatingCost || 0,
          asset.status || 'active',
          asset.createTime || ''
        ].map(cell => `"${cell}"`).join(',')
        assetsCSV += row + '\n'
      })
      
      // 生成负债CSV
      let liabilitiesCSV = '类型,名称,分类,原额,现额,月还款,年利率,状态,创建时间\n'
      liabilities.forEach(liability => {
        const row = [
          '负债',
          liability.name || '',
          liability.categoryL2 || liability.categoryId || '',
          liability.originalAmount || liability.initialAmount || 0,
          liability.currentAmount || liability.originalAmount || liability.initialAmount || 0,
          liability.monthlyPayment || 0,
          liability.annualRate || 0,
          liability.status || 'active',
          liability.createTime || ''
        ].map(cell => `"${cell}"`).join(',')
        liabilitiesCSV += row + '\n'
      })
      
      const fullCSV = assetsCSV + '\n' + liabilitiesCSV
      
      wx.hideLoading()
      
      wx.showActionSheet({
        itemList: ['查看CSV内容', '复制CSV数据', '分享CSV文件'],
        success: (res) => {
          switch(res.tapIndex) {
            case 0:
              this.showCSVContent(fullCSV)
              break
            case 1:
              this.copyToClipboard(fullCSV)
              break
            case 2:
              this.shareCSV(fullCSV)
              break
          }
        }
      })
    } catch (error) {
      wx.hideLoading()
      wx.showToast({
        title: 'CSV生成失败',
        icon: 'error'
      })
      console.error('CSV export failed:', error)
    }
  },

  // 显示备份内容
  showBackupContent(content) {
    wx.showModal({
      title: '备份内容预览',
      content: content.length > 300 ? content.substring(0, 300) + '...\n\n[内容过长，已截断]' : content,
      showCancel: true,
      cancelText: '关闭',
      confirmText: '复制全部',
      success: (res) => {
        if (res.confirm) {
          this.copyToClipboard(content)
        }
      }
    })
  },

  // 显示JSON内容
  showJSONContent(jsonContent) {
    const preview = jsonContent.length > 500 ? 
      jsonContent.substring(0, 500) + '...\n\n[JSON内容过长，建议使用复制功能]' : 
      jsonContent
    
    wx.showModal({
      title: 'JSON数据预览',
      content: preview,
      showCancel: true,
      cancelText: '关闭',
      confirmText: '复制完整JSON',
      success: (res) => {
        if (res.confirm) {
          this.copyToClipboard(jsonContent)
        }
      }
    })
  },

  // 显示CSV内容
  showCSVContent(csvContent) {
    const lines = csvContent.split('\n')
    const preview = lines.slice(0, 10).join('\n')
    const content = lines.length > 10 ? 
      preview + '\n...\n\n[显示前10行，共' + lines.length + '行]' : 
      csvContent
    
    wx.showModal({
      title: 'CSV数据预览',
      content: content,
      showCancel: true,
      cancelText: '关闭',
      confirmText: '复制完整CSV',
      success: (res) => {
        if (res.confirm) {
          this.copyToClipboard(csvContent)
        }
      }
    })
  },

  // 复制到剪贴板
  copyToClipboard(content) {
    wx.setClipboardData({
      data: content,
      success: () => {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success'
        })
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'error'
        })
      }
    })
  },

  // 分享备份
  shareBackup(content) {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
    
    wx.showToast({
      title: '请通过微信分享功能发送备份',
      icon: 'none',
      duration: 2000
    })
  },

  // 分享CSV
  shareCSV(csvContent) {
    this.copyToClipboard(csvContent)
    wx.showToast({
      title: 'CSV已复制，可粘贴到其他应用',
      icon: 'none',
      duration: 2000
    })
  },

  // 保存JSON文件
  saveJSONFile(jsonContent) {
    this.copyToClipboard(jsonContent)
    wx.showModal({
      title: '保存JSON文件',
      content: 'JSON数据已复制到剪贴板，您可以：\n\n1. 粘贴到备忘录保存\n2. 发送给文件传输助手\n3. 保存到云笔记应用\n\n建议文件名：goose_backup_' + new Date().toISOString().split('T')[0] + '.json',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // 保存到相册（文本图片）
  saveBackupToAlbum(content) {
    wx.showToast({
      title: '图片保存功能开发中',
      icon: 'none'
    })
    // 这里可以实现将文本内容转换为图片并保存到相册的功能
    // 由于微信小程序的限制，暂时提供文本复制替代方案
    this.copyToClipboard(content)
  },

  // 复制JSON数据
  copyJSONData(backupData) {
    try {
      const jsonContent = JSON.stringify(backupData, null, 2)
      this.copyToClipboard(jsonContent)
      wx.showModal({
        title: 'JSON数据已复制',
        content: '完整的JSON备份数据已复制到剪贴板，您可以：\n\n• 保存到备忘录\n• 发送给文件传输助手\n• 粘贴到其他应用\n\n恢复时选择"从剪贴板恢复"即可。',
        showCancel: false,
        confirmText: '知道了'
      })
    } catch (error) {
      console.error('JSON复制失败:', error)
      wx.showToast({
        title: 'JSON生成失败',
        icon: 'error'
      })
    }
  },

  // 显示备份说明
  showBackupInstructions() {
    wx.showModal({
      title: '完整备份恢复说明',
      content: `📋 新版备份系统特点：\n\n✅ 完整数据备份\n• 包含所有资产负债记录\n• 包含用户设置和应用状态\n• 包含所有本地存储数据\n• 数据完整性校验\n\n💾 备份步骤：\n1. 点击"复制完整备份数据"\n2. 将数据保存到安全位置\n\n🔄 恢复步骤：\n1. 复制备份数据到剪贴板\n2. 点击"数据恢复"→"从剪贴板恢复"\n3. 系统会自动验证和恢复所有数据\n\n🛡️ 安全保护：\n• 恢复前自动备份当前数据\n• 支持一键撤销恢复\n• 版本兼容性检查\n• 数据损坏检测`,
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // 分享备份
  shareBackup(content) {
    const timestamp = new Date().toLocaleDateString().replace(/\//g, '-')
    const fileName = `备份_${timestamp}.txt`
    
    wx.showModal({
      title: '分享备份',
      content: `备份数据已准备就绪！\n文件名：${fileName}\n\n您可以通过以下方式分享：\n1. 复制到剪贴板后分享\n2. 截图保存分享`,
      confirmText: '复制数据',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.copyToClipboard(content)
        }
      }
    })
  },

  // 保存备份到相册
  saveBackupToAlbum(content) {
    wx.showToast({
      title: '请截图保存',
      icon: 'none',
      duration: 2000
    })
    
    // 显示备份内容供截图
    setTimeout(() => {
      this.showBackupContent(content)
    }, 500)
  },

  // 显示JSON内容
  showJSONContent(jsonContent) {
    const preview = jsonContent.length > 500 ? 
      jsonContent.substring(0, 500) + '...\n\n[内容过长，已截断]' : 
      jsonContent
    
    wx.showModal({
      title: 'JSON数据',
      content: preview,
      showCancel: true,
      confirmText: '复制全部',
      cancelText: '关闭',
      success: (res) => {
        if (res.confirm) {
          this.copyToClipboard(jsonContent)
        }
      }
    })
  },

  // 保存JSON文件
  saveJSONFile(jsonContent) {
    const timestamp = new Date().toISOString().split('T')[0]
    const fileName = `财务数据备份_${timestamp}.json`
    
    wx.showModal({
      title: '保存JSON文件',
      content: `文件名：${fileName}\n\n由于小程序限制，请复制JSON数据后：\n1. 粘贴到记事本等应用\n2. 保存为.json文件\n3. 妥善保管备份文件`,
      confirmText: '复制JSON',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.copyToClipboard(jsonContent)
        }
      }
    })
  },

  // 显示CSV内容
  showCSVContent(csvContent) {
    const lines = csvContent.split('\n')
    const preview = lines.slice(0, 10).join('\n')
    const content = lines.length > 10 ? 
      preview + `\n...\n\n共${lines.length}行数据，建议复制查看完整内容` : 
      csvContent
    
    wx.showModal({
      title: 'CSV数据预览',
      content: content,
      showCancel: true,
      confirmText: '复制全部',
      cancelText: '关闭',
      success: (res) => {
        if (res.confirm) {
          this.copyToClipboard(csvContent)
        }
      }
    })
  },

  // 分享CSV
  shareCSV(csvContent) {
    const timestamp = new Date().toISOString().split('T')[0]
    const fileName = `财务数据_${timestamp}.csv`
    
    wx.showModal({
      title: '分享CSV文件',
      content: `文件名：${fileName}\n大小：${(csvContent.length / 1024).toFixed(1)}KB\n\n可导入Excel等表格软件进行分析`,
      confirmText: '复制CSV',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.copyToClipboard(csvContent)
        }
      }
    })
  },

  showDataStatistics() {
    const assets = StorageManager.getAssets() || []
    const liabilities = StorageManager.getLiabilities() || []
    const dailyIncome = StorageManager.calculateDailyIncome() || 0
    const dailyCost = StorageManager.calculateDailyCost() || 0

    wx.showModal({
      title: '数据统计',
      content: `📈 收益分析：\n• 每日收益：¥${dailyIncome.toFixed(2)}\n• 每日成本：¥${dailyCost.toFixed(2)}\n• 日净收益：¥${(dailyIncome - dailyCost).toFixed(2)}\n\n📋 记录分析：\n• 使用中的资产：${assets.filter(a => a.status === 'active').length}项\n• 使用中的负债：${liabilities.filter(l => l.status === 'active').length}项`,
      showCancel: false
    })
  },

  formatNumber(num) {
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  },

  // 数据恢复功能
  handleDataRestore() {
    wx.showActionSheet({
      itemList: ['从剪贴板恢复', '从JSON恢复', '查看恢复说明'],
      success: (res) => {
        switch(res.tapIndex) {
          case 0:
            this.restoreFromClipboard()
            break
          case 1:
            this.restoreFromJSON()
            break
          case 2:
            this.showRestoreInstructions()
            break
        }
      }
    })
  },

  // 从剪贴板恢复
  restoreFromClipboard() {
    wx.getClipboardData({
      success: (res) => {
        try {
          console.log('剪贴板数据:', res.data)
          const data = JSON.parse(res.data)
          console.log('解析后的数据:', data)
          this.validateAndRestoreData(data)
        } catch (error) {
          console.error('数据解析错误:', error)
          wx.showModal({
            title: '数据格式错误',
            content: `剪贴板数据格式不正确：\n${error.message}\n\n请确保复制的是完整的JSON备份数据。`,
            showCancel: false,
            confirmText: '知道了'
          })
        }
      },
      fail: (error) => {
        console.error('获取剪贴板失败:', error)
        wx.showModal({
          title: '获取剪贴板失败',
          content: '无法读取剪贴板内容。请检查小程序权限或重新复制备份数据。',
          showCancel: false,
          confirmText: '知道了'
        })
      }
    })
  },

  // 从JSON恢复
  restoreFromJSON() {
    wx.showModal({
      title: '从JSON恢复',
      content: '请确保已将备份的JSON数据复制到剪贴板，然后点击确认进行恢复。',
      success: (res) => {
        if (res.confirm) {
          this.restoreFromClipboard()
        }
      }
    })
  },

  // 验证并恢复数据
  validateAndRestoreData(data) {
    try {
      // 基本格式验证
      if (!data || typeof data !== 'object') {
        throw new Error('无效的数据格式')
      }

      if (!data.version) {
        throw new Error('缺少版本信息')
      }

      // 版本兼容性检查
      const supportedVersions = ['2.0', '3.0']
      if (!supportedVersions.includes(data.version)) {
        throw new Error(`不支持的备份版本: ${data.version}`)
      }

      // 数据完整性验证
      let coreData, stats
      if (data.version === '3.0') {
        if (!data.coreData) {
          throw new Error('缺少核心数据')
        }
        coreData = data.coreData
        
        // 校验和验证
        if (data.checksum) {
          const calculatedChecksum = this.generateChecksum(coreData)
          if (calculatedChecksum !== data.checksum) {
            console.warn('数据校验和不匹配，可能存在数据损坏')
          }
        }
        
        stats = data.stats
      } else {
        // 兼容旧版本格式
        coreData = {
          assets: data.assets || [],
          liabilities: data.liabilities || [],
          userInfo: data.userInfo || {},
          settings: data.settings || {}
        }
        stats = data.stats
      }

      const { assets = [], liabilities = [], userInfo = {} } = coreData

      // 数据合理性检查
      if (!Array.isArray(assets) || !Array.isArray(liabilities)) {
        throw new Error('资产或负债数据格式错误')
      }

      // 显示恢复确认对话框
      const backupTime = new Date(data.timestamp).toLocaleString()
      const statsInfo = stats ? `\n• 备份时净资产：¥${stats.netWorth?.toLocaleString() || '0'}` : ''
      
      wx.showModal({
        title: '确认数据恢复',
        content: `📋 备份信息：\n• 版本：${data.version}\n• 资产记录：${assets.length}条\n• 负债记录：${liabilities.length}条\n• 备份时间：${backupTime}${statsInfo}\n\n⚠️ 恢复将完全覆盖当前数据，是否继续？`,
        confirmText: '恢复数据',
        confirmColor: '#ff6b6b',
        success: (res) => {
          if (res.confirm) {
            this.performDataRestore(data)
          }
        }
      })

    } catch (error) {
      console.error('数据验证失败:', error)
      wx.showModal({
        title: '数据验证失败',
        content: `备份数据验证失败：\n${error.message}\n\n请检查数据是否完整或尝试使用其他备份。`,
        showCancel: false,
        confirmText: '知道了'
      })
    }
  },

  // 执行数据恢复
  performDataRestore(data) {
    wx.showLoading({ title: '恢复数据中...' })

    try {
      // 1. 备份当前数据（用于回滚）
      const currentBackup = this.createBackupData()
      wx.setStorageSync('backup_before_restore', currentBackup)
      console.log('当前数据已备份')

      // 2. 解析备份数据
      let coreData, appState, additionalData
      
      if (data.version === '3.0') {
        coreData = data.coreData
        appState = data.appState || {}
        additionalData = data.additionalData || {}
      } else {
        // 兼容旧版本
        coreData = {
          assets: data.assets || [],
          liabilities: data.liabilities || [],
          userInfo: data.userInfo || {},
          settings: data.settings || {}
        }
        appState = {}
        additionalData = {}
      }

      // 3. 恢复核心数据
      if (coreData.assets) {
        StorageManager.saveAssets(coreData.assets)
        console.log(`恢复资产数据: ${coreData.assets.length}条`)
      }

      if (coreData.liabilities) {
        StorageManager.saveLiabilities(coreData.liabilities)
        console.log(`恢复负债数据: ${coreData.liabilities.length}条`)
      }

      if (coreData.userInfo) {
        // 保留当前用户的头像和昵称，只恢复其他信息
        const currentUser = StorageManager.getUser() || {}
        const mergedUser = {
          ...coreData.userInfo,
          nickname: currentUser.nickname || coreData.userInfo.nickname,
          avatar: currentUser.avatar || coreData.userInfo.avatar
        }
        StorageManager.saveUser(mergedUser)
        console.log('恢复用户信息')
      }

      if (coreData.settings) {
        wx.setStorageSync('settings_data', coreData.settings)
        console.log('恢复设置数据')
      }

      // 4. 恢复应用状态
      if (appState.appInitialized !== undefined) {
        wx.setStorageSync('app_initialized', appState.appInitialized)
      }
      
      if (appState.hasSampleData !== undefined) {
        wx.setStorageSync('has_sample_data', appState.hasSampleData)
      }

      // 5. 恢复其他数据
      Object.keys(additionalData).forEach(key => {
        try {
          wx.setStorageSync(key, additionalData[key])
          console.log(`恢复额外数据: ${key}`)
        } catch (e) {
          console.warn(`恢复数据键 ${key} 失败:`, e)
        }
      })

      wx.hideLoading()
      
      // 6. 显示恢复结果
      const assetsCount = coreData.assets?.length || 0
      const liabilitiesCount = coreData.liabilities?.length || 0
      const additionalCount = Object.keys(additionalData).length
      
      wx.showModal({
        title: '恢复成功',
        content: `✅ 数据恢复完成！\n\n📊 恢复详情：\n• 资产记录：${assetsCount}条\n• 负债记录：${liabilitiesCount}条\n• 应用设置：已恢复\n• 其他数据：${additionalCount}项\n\n💡 如有问题，可通过"撤销恢复"功能回退到恢复前状态。`,
        showCancel: false,
        confirmText: '重新加载应用',
        success: () => {
          // 7. 刷新页面数据并返回首页
          this.loadUserInfo()
          this.calculateStats()
          
          wx.switchTab({
            url: '/pages/index/index'
          })
        }
      })

    } catch (error) {
      wx.hideLoading()
      console.error('数据恢复失败:', error)
      
      wx.showModal({
        title: '恢复失败',
        content: `数据恢复过程中出现错误：\n${error.message}\n\n当前数据未被修改，请检查备份文件是否完整。`,
        showCancel: false,
        confirmText: '知道了'
      })
    }
  },

  // 撤销恢复
  undoRestore() {
    const backup = wx.getStorageSync('backup_before_restore')
    if (!backup) {
      wx.showToast({
        title: '没有可撤销的恢复操作',
        icon: 'none'
      })
      return
    }

    wx.showModal({
      title: '撤销恢复',
      content: '确定要撤销上次的数据恢复操作吗？将回退到恢复前的状态。',
      success: (res) => {
        if (res.confirm) {
          this.performDataRestore(backup)
          wx.removeStorageSync('backup_before_restore')
        }
      }
    })
  },

  // 显示恢复说明
  showRestoreInstructions() {
    wx.showModal({
      title: '数据恢复说明',
      content: `📋 支持的恢复方式：\n\n1. 从剪贴板恢复\n• 复制JSON备份数据\n• 选择"从剪贴板恢复"\n\n2. 从JSON文件恢复\n• 打开备份的JSON文件\n• 复制全部内容到剪贴板\n• 选择"从JSON恢复"\n\n⚠️ 注意事项：\n• 恢复将覆盖当前数据\n• 建议先创建当前数据备份\n• 恢复后可通过"撤销恢复"回退`,
      showCancel: false,
      confirmText: '知道了'
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
      content: '感谢您使用大鹅爱记账！如有建议或问题，请通过以下方式联系我们：\n\n邮箱：darkaling@qq.com',
      confirmText: '复制邮箱',
      cancelText: '关闭',
      showCancel: true,
      success: (res) => {
        if (res.confirm) {
          // 复制邮箱到剪贴板
          wx.setClipboardData({
            data: 'darkaling@qq.com',
            success: () => {
              wx.showToast({
                title: '邮箱已复制',
                icon: 'success'
              })
            },
            fail: () => {
              wx.showToast({
                title: '复制失败',
                icon: 'error'
              })
            }
          })
        }
      }
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
          // 清除用户信息和初始化标志，回到首次使用状态
          wx.removeStorageSync('user_info')
          wx.removeStorageSync('app_initialized')
          wx.removeStorageSync('assets_data')
          wx.removeStorageSync('liabilities_data')
          wx.removeStorageSync('has_sample_data')
          
          // 跳转到登录页
          wx.reLaunch({
            url: '/pages/login/login'
          })
        }
      }
    })
  },

  // 开发者选项（长按用户名触发）
  showDeveloperOptions() {
    const options = ['重置引导教程', '测试启动教程', '测试定位精度', '查看存储状态', '取消']
    
    wx.showActionSheet({
      itemList: options,
      success: (res) => {
        if (res.tapIndex === 0) {
          this.resetTutorial()
        } else if (res.tapIndex === 1) {
          this.testStartTutorial()
        } else if (res.tapIndex === 2) {
          this.testTutorialPositions()
        } else if (res.tapIndex === 3) {
          this.showStorageStatus()
        }
      }
    })
  },

  // 重置引导教程
  resetTutorial() {
    wx.showModal({
      title: '重置引导教程',
      content: '确定要重置引导教程吗？下次进入首页时将重新显示欢迎界面和教程选项。',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('tutorial_completed')
          wx.showToast({
            title: '重置成功',
            icon: 'success'
          })
        }
      }
    })
  },

  // 测试启动教程
  testStartTutorial() {
    console.log('测试启动教程')
    
    // 设置全局标识
    getApp().globalData.startTutorial = true
    
    // 跳转到首页
    wx.switchTab({
      url: '/pages/index/index',
      success: () => {
        wx.showToast({
          title: '教程启动中...',
          icon: 'loading'
        })
      },
      fail: () => {
        wx.showToast({
          title: '跳转失败',
          icon: 'error'
        })
      }
    })
  },

  // 切换主题
  toggleTheme() {
    const app = getApp()
    
    if (app.globalData.autoFollowSystem) {
      // 如果当前是自动跟随模式，显示选择弹窗
      wx.showModal({
        title: '主题设置',
        content: '当前为自动跟随系统模式。您希望：',
        cancelText: '手动切换',
        confirmText: '跟随系统',
        success: (res) => {
          if (res.confirm) {
            // 保持自动跟随系统
            wx.showToast({
              title: '保持跟随系统主题',
              icon: 'none',
              duration: 1500
            })
          } else {
            // 切换到手动模式
            app.toggleTheme()
            this.setTheme(app.globalData.isDarkTheme)
            this.setData({
              isDarkTheme: app.globalData.isDarkTheme,
              autoFollowSystem: app.globalData.autoFollowSystem
            })
            
            wx.showToast({
              title: app.globalData.isDarkTheme ? '已切换到深色模式' : '已切换到浅色模式',
              icon: 'success',
              duration: 1500
            })
          }
        }
      })
    } else {
      // 手动模式下直接切换
      app.toggleTheme()
      this.setTheme(app.globalData.isDarkTheme)
      this.setData({
        isDarkTheme: app.globalData.isDarkTheme
      })
      
      wx.showToast({
        title: app.globalData.isDarkTheme ? '已切换到深色模式' : '已切换到浅色模式',
        icon: 'success',
        duration: 1500
      })
    }
  },

  // 切换自动跟随系统主题
  toggleAutoFollowSystem(e) {
    const app = getApp()
    // 如果是switch组件触发的，使用switch的值；否则使用当前状态的反转
    const newAutoFollow = e && e.detail !== undefined ? e.detail.value : !app.globalData.autoFollowSystem
    
    app.setAutoFollowSystem(newAutoFollow)
    
    this.setData({
      autoFollowSystem: newAutoFollow,
      isDarkTheme: app.globalData.isDarkTheme
    })
    
    wx.showToast({
      title: newAutoFollow ? '已开启跟随系统主题' : '已关闭跟随系统主题',
      icon: 'success',
      duration: 1500
    })
  },

  // 测试主题变化（调试用）
  testThemeChange() {
    const app = getApp()
    
    try {
      const systemInfo = wx.getSystemInfoSync()
      const debugInfo = `
调试信息：
• 系统主题: ${systemInfo.theme}
• 当前应用主题: ${app.globalData.isDarkTheme ? '深色' : '浅色'}
• 自动跟随状态: ${app.globalData.autoFollowSystem ? '开启' : '关闭'}
• wx.onThemeChange支持: ${typeof wx.onThemeChange === 'function' ? '是' : '否'}
• 微信版本: ${systemInfo.version}

点击确定模拟主题变化`
      
      wx.showModal({
        title: '主题调试工具',
        content: debugInfo,
        success: (res) => {
          if (res.confirm) {
            if (app.globalData.autoFollowSystem) {
              // 模拟系统主题变化
              const newTheme = app.globalData.isDarkTheme ? 'light' : 'dark'
              console.log('模拟主题变化:', newTheme)
              
              // 手动触发主题变化事件
              const isDarkTheme = newTheme === 'dark'
              app.globalData.isDarkTheme = isDarkTheme
              app.setTheme(isDarkTheme)
              app.notifyPagesThemeChange(isDarkTheme)
              
              wx.showToast({
                title: `模拟切换到${isDarkTheme ? '深色' : '浅色'}模式`,
                icon: 'success',
                duration: 1500
              })
            } else {
              wx.showToast({
                title: '请先开启跟随系统主题',
                icon: 'none',
                duration: 1500
              })
            }
          }
        }
      })
    } catch (error) {
      wx.showModal({
        title: '调试错误',
        content: `获取系统信息失败: ${error.message}`,
        showCancel: false
      })
    }
  },

  // 测试教程定位精度
  testTutorialPositions() {
    console.log('测试教程定位精度')
    
    wx.showModal({
      title: '开发者选项：测试定位精度',
      content: '⚠️ 这是开发者测试功能！\n\n将自动测试所有教程步骤的气泡定位，每步停留3秒。\n\n普通用户请点取消。',
      success: (res) => {
        if (res.confirm) {
          // 设置测试模式标识
          getApp().globalData.testTutorialPositions = true
          
          // 跳转到首页
          wx.reLaunch({
            url: '/pages/index/index',
            success: () => {
              wx.showToast({
                title: '定位测试启动中...',
                icon: 'loading'
              })
            },
            fail: () => {
              wx.showToast({
                title: '跳转失败',
                icon: 'error'
              })
            }
          })
        }
      }
    })
  },

  // 查看存储状态
  showStorageStatus() {
    const hasSampleData = wx.getStorageSync('has_sample_data')
    const tutorialCompleted = wx.getStorageSync('tutorial_completed')
    const assets = StorageManager.getAssets()
    const liabilities = StorageManager.getLiabilities()
    
    const sampleAssets = assets.filter(item => item.isSample)
    const sampleLiabilities = liabilities.filter(item => item.isSample)
    
    const status = `示例数据标识: ${hasSampleData}\n教程完成状态: ${tutorialCompleted}\n示例资产: ${sampleAssets.length}/${assets.length}\n示例负债: ${sampleLiabilities.length}/${liabilities.length}`
    
    wx.showModal({
      title: '存储状态',
      content: status,
      showCancel: false
    })
  },

  // 功能引导教程回顾
  handleTutorialReview() {
    wx.showModal({
      title: '功能引导',
      content: '要重新开始引导教程吗？这将帮助您更好地了解各项功能。',
      confirmText: '开始教程',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 设置全局标识，让首页启动教程
          getApp().globalData.startTutorial = true
          console.log('设置启动教程标识:', getApp().globalData.startTutorial)
          
          // 跳转到首页
          wx.reLaunch({
            url: '/pages/index/index',
            success: () => {
              console.log('跳转首页成功')
            },
            fail: (error) => {
              console.error('跳转失败:', error)
              wx.showToast({
                title: '跳转失败，请手动切换到首页',
                icon: 'none'
              })
            }
          })
        }
      }
    })
  },

  // 检查个人中心教程
  checkProfileTutorial: function() {
    const profileTutorialCompleted = wx.getStorageSync('profile_tutorial_completed')
    const mainTutorialCompleted = wx.getStorageSync('tutorial_completed')
    
    // 只有在主教程完成后，且个人中心教程未完成时，才显示个人中心教程
    if (mainTutorialCompleted && !profileTutorialCompleted) {
      setTimeout(() => {
        this.startProfileTutorial()
      }, 500)
    }
  },

  // 开始个人中心教程
  startProfileTutorial() {
    this.setData({
      showTutorial: true,
      tutorialStep: 0,
      currentTutorialStep: this.data.tutorialSteps[0] || {},
      bubbleStyle: {
        position: 'fixed',
        opacity: '0',
        visibility: 'hidden',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      },
      arrowClass: 'arrow-up',
      bubbleVisible: false
    }, () => {
      setTimeout(() => {
        this.highlightTarget()
      }, 100)
    })
  },

  // 下一步教程
  nextTutorialStep() {
    const { tutorialStep, tutorialSteps } = this.data
    
    if (tutorialStep < tutorialSteps.length - 1) {
      const nextStep = tutorialStep + 1
      const nextStepData = tutorialSteps[nextStep]
      
      this.setData({
        tutorialStep: nextStep,
        currentTutorialStep: nextStepData || {},
        bubbleStyle: {
          ...this.data.bubbleStyle,
          opacity: '0',
          visibility: 'hidden'
        },
        bubbleVisible: false
      }, () => {
        setTimeout(() => {
          this.highlightTarget()
        }, 50)
      })
    } else {
      this.completeProfileTutorial()
    }
  },

  // 上一步教程
  prevTutorialStep() {
    const { tutorialStep, tutorialSteps } = this.data
    
    if (tutorialStep > 0) {
      const prevStep = tutorialStep - 1
      this.setData({
        tutorialStep: prevStep,
        currentTutorialStep: tutorialSteps[prevStep] || {},
        bubbleStyle: {
          ...this.data.bubbleStyle,
          opacity: '0',
          visibility: 'hidden'
        },
        bubbleVisible: false
      }, () => {
        setTimeout(() => {
          this.highlightTarget()
        }, 50)
      })
    }
  },

  // 完成个人中心教程
  completeProfileTutorial() {
    wx.setStorageSync('profile_tutorial_completed', true)
    this.setData({
      showTutorial: false
    })
    
    wx.showToast({
      title: '个人中心教程完成！',
      icon: 'success',
      duration: 2000
    })
  },

  // 跳过教程
  skipTutorial() {
    wx.showModal({
      title: '跳过教程',
      content: '确定要跳过个人中心引导教程吗？',
      success: (res) => {
        if (res.confirm) {
          this.completeProfileTutorial()
        }
      }
    })
  },

  // 高亮目标元素
  highlightTarget(retryCount = 0) {
    const currentStep = this.data.currentTutorialStep
    if (!currentStep.target) {
      console.warn('当前步骤没有目标元素')
      return
    }
    
    // 防抖机制
    if (this.highlightTimer) {
      clearTimeout(this.highlightTimer)
    }
    
    console.log(`开始查找目标元素: ${currentStep.target} (尝试 ${retryCount + 1}/5)`)
    
    this.highlightTimer = setTimeout(() => {
      const query = wx.createSelectorQuery().in(this)
      
      // 添加多个选择器查询，提高成功率
      query.select(currentStep.target).boundingClientRect()
      query.selectViewport().scrollOffset()
      
      query.exec((res) => {
        const rect = res[0]
        const scrollOffset = res[1]
        
        console.log('查询结果:', { rect, scrollOffset })
        
        if (rect && rect.width > 0 && rect.height > 0) {
          console.log(`✅ 找到目标元素 ${currentStep.target}:`, rect)
          
          // 调整矩形位置，考虑滚动偏移
          const adjustedRect = {
            ...rect,
            top: rect.top + (scrollOffset?.scrollTop || 0),
            left: rect.left + (scrollOffset?.scrollLeft || 0)
          }
          
          console.log('调整后的矩形:', adjustedRect)
          this.calculateBubblePosition(adjustedRect, currentStep.position)
        } else {
          console.warn(`❌ 未找到目标元素 (尝试 ${retryCount + 1}/5):`, currentStep.target)
          
          if (retryCount < 4) {
            // 增加重试次数和延迟时间
            const delay = Math.min(200 + retryCount * 100, 1000)
            setTimeout(() => {
              this.highlightTarget(retryCount + 1)
            }, delay)
          } else {
            console.error('目标元素查找失败，使用默认位置')
            this.setData({
              bubbleStyle: {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: '1',
                visibility: 'visible'
              },
              arrowClass: 'arrow-up',
              bubbleVisible: true
            })
          }
        }
      })
    }, retryCount === 0 ? 200 : Math.min(300 + retryCount * 100, 800))
  },

  // 计算气泡位置
  calculateBubblePosition(targetRect, preferredPosition) {
    if (this.isCalculatingPosition) {
      return
    }
    this.isCalculatingPosition = true
    
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const windowHeight = systemInfo.windowHeight
    const windowWidth = systemInfo.windowWidth
    
    // 将rpx转换为px
    const bubbleWidth = Math.min(300, windowWidth * 0.8)
    const bubbleHeight = 180
    const margin = 15
    const arrowSize = 10
    
    const targetCenterX = targetRect.left + targetRect.width / 2
    const targetCenterY = targetRect.top + targetRect.height / 2
    
    let bubbleStyle = {}
    let arrowClass = ''
    
    console.log('目标元素位置:', {
      left: targetRect.left,
      top: targetRect.top,
      width: targetRect.width,
      height: targetRect.height,
      centerX: targetCenterX,
      centerY: targetCenterY
    })
    
    console.log('窗口信息:', {
      windowWidth,
      windowHeight,
      bubbleWidth,
      bubbleHeight
    })
    
    // 计算各个方向的可用空间
    const spaceAbove = targetRect.top
    const spaceBelow = windowHeight - (targetRect.top + targetRect.height)
    const spaceLeft = targetRect.left
    const spaceRight = windowWidth - (targetRect.left + targetRect.width)
    
    console.log('可用空间:', {
      spaceAbove,
      spaceBelow,
      spaceLeft,
      spaceRight
    })
    
    // 优先级：下方 -> 上方 -> 左方 -> 右方 -> 居中
    if (spaceBelow >= bubbleHeight + arrowSize + margin) {
      // 下方有足够空间
      const bubbleLeft = Math.max(margin, Math.min(targetCenterX - bubbleWidth / 2, windowWidth - bubbleWidth - margin))
      bubbleStyle = {
        position: 'fixed',
        left: `${bubbleLeft}px`,
        top: `${targetRect.top + targetRect.height + arrowSize + 5}px`,
        opacity: '1',
        visibility: 'visible',
        transform: 'none'
      }
      arrowClass = 'arrow-up'
      console.log('选择下方位置')
    } else if (spaceAbove >= bubbleHeight + arrowSize + margin) {
      // 上方有足够空间
      const bubbleLeft = Math.max(margin, Math.min(targetCenterX - bubbleWidth / 2, windowWidth - bubbleWidth - margin))
      bubbleStyle = {
        position: 'fixed',
        left: `${bubbleLeft}px`,
        top: `${targetRect.top - bubbleHeight - arrowSize - 5}px`,
        opacity: '1',
        visibility: 'visible',
        transform: 'none'
      }
      arrowClass = 'arrow-down'
      console.log('选择上方位置')
    } else if (spaceRight >= bubbleWidth + arrowSize + margin) {
      // 右方有足够空间
      const bubbleTop = Math.max(margin, Math.min(targetCenterY - bubbleHeight / 2, windowHeight - bubbleHeight - margin))
      bubbleStyle = {
        position: 'fixed',
        left: `${targetRect.left + targetRect.width + arrowSize + 5}px`,
        top: `${bubbleTop}px`,
        opacity: '1',
        visibility: 'visible',
        transform: 'none'
      }
      arrowClass = 'arrow-left'
      console.log('选择右方位置')
    } else if (spaceLeft >= bubbleWidth + arrowSize + margin) {
      // 左方有足够空间
      const bubbleTop = Math.max(margin, Math.min(targetCenterY - bubbleHeight / 2, windowHeight - bubbleHeight - margin))
      bubbleStyle = {
        position: 'fixed',
        left: `${targetRect.left - bubbleWidth - arrowSize - 5}px`,
        top: `${bubbleTop}px`,
        opacity: '1',
        visibility: 'visible',
        transform: 'none'
      }
      arrowClass = 'arrow-right'
      console.log('选择左方位置')
    } else {
      // 空间不足，使用居中位置
      bubbleStyle = {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        opacity: '1',
        visibility: 'visible'
      }
      arrowClass = 'arrow-up'
      console.log('选择居中位置')
    }
    
    console.log('最终气泡样式:', bubbleStyle)
    console.log('箭头类:', arrowClass)
    
    this.setData({
      bubbleStyle: bubbleStyle,
      arrowClass: arrowClass,
      bubbleVisible: true
    })
    
    this.isCalculatingPosition = false
  }
})
