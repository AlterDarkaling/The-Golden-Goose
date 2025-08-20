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
    showHiddenNicknameInput: false
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
        // 头像显示逻辑：
        // 1. 如果有自定义头像，优先使用自定义头像
        // 2. 如果没有自定义头像但有微信头像，使用微信头像  
        // 3. 最后使用默认头像
        avatar: userInfo.avatar || userInfo.wechatAvatar || '/static/default-avatar.png',
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
      itemList: ['生成完整备份', '导出JSON格式', '导出CSV格式', '数据统计报告'],
      success: (res) => {
        switch(res.tapIndex) {
          case 0:
            this.generateFullBackup()
            break
          case 1:
            this.exportJSONData()
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
      
      if (!backupData.assets.length && !backupData.liabilities.length) {
        wx.hideLoading()
        wx.showToast({
          title: '暂无数据可备份',
          icon: 'none'
        })
        return
      }

      // 生成备份文件内容
      const backupContent = this.generateBackupContent(backupData)
      
      wx.hideLoading()
      
      // 显示备份选项
      wx.showActionSheet({
        itemList: ['查看备份内容', '复制到剪贴板', '分享备份', '保存到相册'],
        success: (res) => {
          switch(res.tapIndex) {
            case 0:
              this.showBackupContent(backupContent)
              break
            case 1:
              this.copyToClipboard(backupContent)
              break
            case 2:
              this.shareBackup(backupContent)
              break
            case 3:
              this.saveBackupToAlbum(backupContent)
              break
          }
        }
      })
    } catch (error) {
      wx.hideLoading()
      wx.showToast({
        title: '备份生成失败',
        icon: 'error'
      })
      console.error('Backup generation failed:', error)
    }
  },

  // 创建备份数据
  createBackupData() {
    const assets = StorageManager.getAssets() || []
    const liabilities = StorageManager.getLiabilities() || []
    const userInfo = StorageManager.getUser() || {}
    const settings = StorageManager.getSettings() || {}
    
    return {
      version: '2.0',
      timestamp: new Date().toISOString(),
      deviceInfo: {
        platform: wx.getSystemInfoSync().platform,
        version: wx.getSystemInfoSync().version
      },
      userInfo: {
        nickname: userInfo.nickname,
        motto: userInfo.motto,
        createTime: userInfo.createTime
      },
      assets: assets.map(asset => ({
        ...asset,
        backupTime: new Date().toISOString()
      })),
      liabilities: liabilities.map(liability => ({
        ...liability,
        backupTime: new Date().toISOString()
      })),
      settings,
      stats: this.calculateBackupStats(assets, liabilities)
    }
  },

  // 计算备份统计
  calculateBackupStats(assets, liabilities) {
    const totalAssetValue = assets.reduce((sum, asset) => 
      sum + (asset.currentValue || asset.originalValue || asset.initialValue || 0), 0)
    const totalLiabilityValue = liabilities.reduce((sum, liability) => 
      sum + (liability.currentAmount || liability.originalAmount || liability.initialAmount || 0), 0)
    const netWorth = totalAssetValue - totalLiabilityValue
    
    return {
      totalAssets: assets.length,
      totalLiabilities: liabilities.length,
      totalAssetValue,
      totalLiabilityValue,
      netWorth,
      dailyIncome: StorageManager.calculateDailyIncome ? StorageManager.calculateDailyIncome() : 0,
      dailyCost: StorageManager.calculateDailyCost ? StorageManager.calculateDailyCost() : 0
    }
  },

  // 生成备份内容
  generateBackupContent(backupData) {
    const { stats } = backupData
    
    return `🦢 大鹅爱记账 - 数据备份
━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 备份时间：${new Date(backupData.timestamp).toLocaleString()}
📱 设备信息：${backupData.deviceInfo.platform} ${backupData.deviceInfo.version}
👤 用户昵称：${backupData.userInfo.nickname || '未设置'}

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
    
    // 资产详情
    if (backupData.assets.length > 0) {
      content += '💎 资产明细：\n'
      backupData.assets.forEach((asset, index) => {
        const value = asset.currentValue || asset.originalValue || asset.initialValue || 0
        content += `${index + 1}. ${asset.name} - ¥${this.formatNumber(value)}\n`
      })
      content += '\n'
    }
    
    // 负债详情
    if (backupData.liabilities.length > 0) {
      content += '💳 负债明细：\n'
      backupData.liabilities.forEach((liability, index) => {
        const value = liability.currentAmount || liability.originalAmount || liability.initialAmount || 0
        content += `${index + 1}. ${liability.name} - ¥${this.formatNumber(value)}\n`
      })
      content += '\n'
    }
    
    return content || '暂无详细数据'
  },

  // 导出JSON格式
  exportJSONData() {
    wx.showLoading({ title: '导出中...' })
    
    try {
      const backupData = this.createBackupData()
      const jsonContent = JSON.stringify(backupData, null, 2)
      
      wx.hideLoading()
      
      wx.showActionSheet({
        itemList: ['查看JSON内容', '复制JSON数据', '保存JSON文件'],
        success: (res) => {
          switch(res.tapIndex) {
            case 0:
              this.showJSONContent(jsonContent)
              break
            case 1:
              this.copyToClipboard(jsonContent)
              break
            case 2:
              this.saveJSONFile(jsonContent)
              break
          }
        }
      })
    } catch (error) {
      wx.hideLoading()
      wx.showToast({
        title: 'JSON导出失败',
        icon: 'error'
      })
      console.error('JSON export failed:', error)
    }
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
          const data = JSON.parse(res.data)
          this.validateAndRestoreData(data)
        } catch (error) {
          wx.showToast({
            title: '剪贴板数据格式错误',
            icon: 'error'
          })
        }
      },
      fail: () => {
        wx.showToast({
          title: '获取剪贴板失败',
          icon: 'error'
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
    if (!data || !data.version) {
      wx.showToast({
        title: '不是有效的备份数据',
        icon: 'error'
      })
      return
    }

    const { assets = [], liabilities = [], userInfo = {} } = data

    wx.showModal({
      title: '确认数据恢复',
      content: `发现备份数据：\n• 资产记录：${assets.length}条\n• 负债记录：${liabilities.length}条\n• 备份时间：${new Date(data.timestamp).toLocaleString()}\n\n恢复将覆盖当前所有数据，是否继续？`,
      confirmText: '恢复数据',
      confirmColor: '#ff6b6b',
      success: (res) => {
        if (res.confirm) {
          this.performDataRestore(data)
        }
      }
    })
  },

  // 执行数据恢复
  performDataRestore(data) {
    wx.showLoading({ title: '恢复数据中...' })

    try {
      // 备份当前数据
      const currentBackup = this.createBackupData()
      wx.setStorageSync('backup_before_restore', currentBackup)

      // 恢复资产数据
      if (data.assets && data.assets.length > 0) {
        wx.setStorageSync('assets_data', data.assets)
      }

      // 恢复负债数据
      if (data.liabilities && data.liabilities.length > 0) {
        wx.setStorageSync('liabilities_data', data.liabilities)
      }

      // 恢复用户信息（部分）
      if (data.userInfo) {
        const currentUser = StorageManager.getUser() || {}
        const mergedUser = {
          ...currentUser,
          motto: data.userInfo.motto || currentUser.motto
          // 注意：不恢复头像和昵称，保持当前用户的个人设置
        }
        wx.setStorageSync('user_info', mergedUser)
      }

      wx.hideLoading()
      
      wx.showModal({
        title: '恢复成功',
        content: `数据恢复完成！\n• 资产记录：${data.assets?.length || 0}条\n• 负债记录：${data.liabilities?.length || 0}条\n\n如有问题，可通过"撤销恢复"功能回退。`,
        showCancel: false,
        confirmText: '重新加载',
        success: () => {
          // 刷新页面数据
          this.loadUserInfo()
          this.calculateStats()
          
          // 返回首页
          wx.switchTab({
            url: '/pages/index/index'
          })
        }
      })
    } catch (error) {
      wx.hideLoading()
      wx.showToast({
        title: '恢复失败',
        icon: 'error'
      })
      console.error('Data restore failed:', error)
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
  }
})
