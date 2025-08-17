// 本地存储管理工具
const StorageManager = {
  userKey: 'user_info',
  assetsKey: 'assets_data',
  liabilitiesKey: 'liabilities_data',
  settingsKey: 'app_settings',

  // 用户相关
  saveUser(userInfo) {
    try {
      wx.setStorageSync(this.userKey, userInfo)
      return true
    } catch (e) {
      console.error('保存用户信息失败:', e)
      return false
    }
  },

  getUser() {
    try {
      return wx.getStorageSync(this.userKey) || null
    } catch (e) {
      console.error('获取用户信息失败:', e)
      return null
    }
  },

  // 资产相关
  saveAssets(assets) {
    try {
      wx.setStorageSync(this.assetsKey, assets)
      return true
    } catch (e) {
      console.error('保存资产数据失败:', e)
      return false
    }
  },

  getAssets() {
    try {
      return wx.getStorageSync(this.assetsKey) || []
    } catch (e) {
      console.error('获取资产数据失败:', e)
      return []
    }
  },

  // 负债相关
  getLiabilities() {
    try {
      return wx.getStorageSync(this.liabilitiesKey) || []
    } catch (e) {
      console.error('获取负债数据失败:', e)
      return []
    }
  },

  // 计算相关
  calculateNetWorth() {
    const assets = this.getAssets()
    const liabilities = this.getLiabilities()
    
    const totalAssets = assets.reduce((sum, asset) => {
      const currentValue = asset.currentValue || asset.initialValue || 0
      return sum + currentValue
    }, 0)
    
    const totalLiabilities = liabilities.reduce((sum, liability) => {
      const currentAmount = liability.currentAmount || liability.initialAmount || 0
      return sum + currentAmount
    }, 0)
    
    return totalAssets - totalLiabilities
  },

  calculateDailyCost() {
    const liabilities = this.getLiabilities()
    return liabilities.reduce((sum, liability) => {
      const dailyCost = liability.dailyCost || 0
      return sum + dailyCost
    }, 0)
  },

  calculateDailyIncome() {
    const assets = this.getAssets()
    return assets.reduce((sum, asset) => {
      const dailyIncome = asset.dailyIncome || 0
      return sum + dailyIncome
    }, 0)
  },

  // 设置相关
  getSettings() {
    try {
      return wx.getStorageSync(this.settingsKey) || this.getDefaultSettings()
    } catch (e) {
      console.error('获取设置失败:', e)
      return this.getDefaultSettings()
    }
  },

  getDefaultSettings() {
    return {
      assetCategories: [
        { id: 'investment', name: '投资理财', color: '#4CAF50' },
        { id: 'business', name: '经营性资产', color: '#2196F3' },
        { id: 'intellectual', name: '知识产权', color: '#9C27B0' },
        { id: 'real_estate', name: '房地产', color: '#FF9800' },
        { id: 'other_assets', name: '其他资产', color: '#607D8B' }
      ],
      liabilityCategories: [
        { id: 'consumer_loan', name: '消费贷款', color: '#F44336' },
        { id: 'business_loan', name: '经营性负债', color: '#E91E63' },
        { id: 'credit_card', name: '信用卡', color: '#9C27B0' },
        { id: 'mortgage', name: '房贷', color: '#673AB7' },
        { id: 'other_liabilities', name: '其他负债', color: '#795548' }
      ]
    }
  }
}

Page({
  data: {
    userInfo: {},
    assets: [],
    liabilities: [],
    searchKeyword: '',
    sortIndex: 0,
    categoryIndex: 0,
    statusIndex: 0,
    sortOptions: [
      { label: '默认排序', value: 'default' },
      { label: '金额从高到低', value: 'amount-desc' },
      { label: '金额从低到高', value: 'amount-asc' },
      { label: '创建时间', value: 'time' }
    ],
    categoryOptions: [
      { label: '全部分类', value: 'all' },
      { label: '投资理财', value: 'investment' },
      { label: '经营性资产', value: 'business' },
      { label: '消费贷款', value: 'consumer_loan' },
      { label: '信用卡', value: 'credit_card' }
    ],
    statusOptions: [
      { label: '全部状态', value: 'all' },
      { label: '活跃', value: 'active' },
      { label: '暂停', value: 'paused' },
      { label: '已完成', value: 'completed' }
    ],
    netWorth: 0,
    dailyCost: 0,
    dailyIncome: 0,
    assetsCount: 0,
    liabilitiesCount: 0,
    filteredAssets: [],
    filteredLiabilities: []
  },

  onLoad() {
    this.checkLogin()
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  checkLogin() {
    const user = StorageManager.getUser()
    if (!user) {
      wx.redirectTo({
        url: '/pages/login/login'
      })
    } else {
      this.setData({
        userInfo: user
      })
      
      // 如果是微信用户，更新头像显示
      if (user.isWechatUser && user.avatar) {
        this.setData({
          'userInfo.avatar': user.avatar
        })
      }
    }
  },

  loadData() {
    const assets = StorageManager.getAssets()
    const liabilities = StorageManager.getLiabilities()
    
    // 处理数据，添加显示字段
    const processedAssets = assets.map(asset => ({
      ...asset,
      categoryName: this.getCategoryName(asset.categoryId, 'asset'),
      displayAmount: this.formatNumber(asset.currentValue || asset.initialValue),
      statusText: this.getStatusText(asset.status)
    }))
    
    const processedLiabilities = liabilities.map(liability => ({
      ...liability,
      categoryName: this.getCategoryName(liability.categoryId, 'liability'),
      displayAmount: this.formatNumber(liability.currentAmount || liability.initialAmount),
      statusText: this.getStatusText(liability.status)
    }))

    this.setData({
      assets: processedAssets,
      liabilities: processedLiabilities,
      netWorth: StorageManager.calculateNetWorth(),
      dailyCost: StorageManager.calculateDailyCost(),
      dailyIncome: StorageManager.calculateDailyIncome(),
      assetsCount: assets.length,
      liabilitiesCount: liabilities.length
    })

    this.updateFilteredData()
  },

  updateFilteredData() {
    const { assets, liabilities, searchKeyword, sortIndex, categoryIndex, statusIndex, sortOptions, categoryOptions, statusOptions } = this.data

    // 过滤资产
    let filteredAssets = assets.filter(asset => {
      if (searchKeyword && !asset.name.includes(searchKeyword)) {
        return false
      }
      if (categoryIndex > 0 && asset.categoryId !== categoryOptions[categoryIndex].value) {
        return false
      }
      if (statusIndex > 0 && asset.status !== statusOptions[statusIndex].value) {
        return false
      }
      return true
    })

    // 过滤负债
    let filteredLiabilities = liabilities.filter(liability => {
      if (searchKeyword && !liability.name.includes(searchKeyword)) {
        return false
      }
      if (categoryIndex > 0 && liability.categoryId !== categoryOptions[categoryIndex].value) {
        return false
      }
      if (statusIndex > 0 && liability.status !== statusOptions[statusIndex].value) {
        return false
      }
      return true
    })

    // 排序
    const sortType = sortOptions[sortIndex].value
    if (sortType === 'amount-desc') {
      filteredAssets.sort((a, b) => (b.currentValue || b.initialValue) - (a.currentValue || a.initialValue))
      filteredLiabilities.sort((a, b) => (b.currentAmount || b.initialAmount) - (a.currentAmount || a.initialAmount))
    } else if (sortType === 'amount-asc') {
      filteredAssets.sort((a, b) => (a.currentValue || a.initialValue) - (b.currentValue || b.initialValue))
      filteredLiabilities.sort((a, b) => (a.currentAmount || a.initialAmount) - (b.currentAmount || b.initialAmount))
    } else if (sortType === 'time') {
      filteredAssets.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
      filteredLiabilities.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
    }

    this.setData({
      filteredAssets,
      filteredLiabilities
    })
  },

  chooseAvatar() {
    wx.showActionSheet({
      itemList: ['从相册选择', '拍照'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.selectFromAlbum()
        } else if (res.tapIndex === 1) {
          this.takePhoto()
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
  },

  onSearch() {
    this.updateFilteredData()
  },

  onSortChange(e) {
    this.setData({
      sortIndex: e.detail.value
    })
    this.updateFilteredData()
  },

  onCategoryChange(e) {
    this.setData({
      categoryIndex: e.detail.value
    })
    this.updateFilteredData()
  },

  onStatusChange(e) {
    this.setData({
      statusIndex: e.detail.value
    })
    this.updateFilteredData()
  },

  addAsset() {
    wx.navigateTo({
      url: '/pages/edit/edit?type=asset'
    })
  },

  addLiability() {
    wx.navigateTo({
      url: '/pages/edit/edit?type=liability'
    })
  },

  viewDetail(e) {
    const { item, type } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/detail/detail?type=${type}&id=${item.id}`
    })
  },

  getCategoryName(categoryId, type) {
    const settings = StorageManager.getSettings()
    if (type === 'asset') {
      const category = settings.assetCategories.find(c => c.id === categoryId)
      return category ? category.name : '未分类'
    } else {
      const category = settings.liabilityCategories.find(c => c.id === categoryId)
      return category ? category.name : '未分类'
    }
  },

  getStatusText(status) {
    const statusMap = {
      active: '活跃',
      paused: '暂停',
      completed: '已完成'
    }
    return statusMap[status] || '未知'
  },

  formatNumber(num) {
    if (typeof num !== 'number') return '0.00'
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  },

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
