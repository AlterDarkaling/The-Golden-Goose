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
  saveLiabilities(liabilities) {
    try {
      wx.setStorageSync(this.liabilitiesKey, liabilities)
      return true
    } catch (e) {
      console.error('保存负债数据失败:', e)
      return false
    }
  },

  getLiabilities() {
    try {
      return wx.getStorageSync(this.liabilitiesKey) || []
    } catch (e) {
      console.error('获取负债数据失败:', e)
      return []
    }
  },

  // 添加资产
  addAsset(asset) {
    let assets = this.getAssets()
    
    // 如果是第一次添加真实数据，清除示例数据
    if (this.shouldClearSampleData()) {
      this.clearSampleData()
      assets = [] // 重新获取清空后的数据
    }
    
    assets.push({
      ...asset,
      id: `asset_${Date.now()}`,
      createTime: new Date().toISOString()
    })
    return this.saveAssets(assets)
  },

  // 更新资产
  updateAsset(id, updatedAsset) {
    const assets = this.getAssets()
    const index = assets.findIndex(asset => asset.id === id)
    if (index !== -1) {
      assets[index] = { ...assets[index], ...updatedAsset }
      return this.saveAssets(assets)
    }
    return false
  },

  // 删除资产
  deleteAsset(id) {
    const assets = this.getAssets()
    const filteredAssets = assets.filter(asset => asset.id !== id)
    return this.saveAssets(filteredAssets)
  },

  // 添加负债
  addLiability(liability) {
    let liabilities = this.getLiabilities()
    
    // 如果是第一次添加真实数据，清除示例数据
    if (this.shouldClearSampleData()) {
      this.clearSampleData()
      liabilities = [] // 重新获取清空后的数据
    }
    
    liabilities.push({
      ...liability,
      id: `liability_${Date.now()}`,
      createTime: new Date().toISOString()
    })
    return this.saveLiabilities(liabilities)
  },

  // 更新负债
  updateLiability(id, updatedLiability) {
    const liabilities = this.getLiabilities()
    const index = liabilities.findIndex(liability => liability.id === id)
    if (index !== -1) {
      liabilities[index] = { ...liabilities[index], ...updatedLiability }
      return this.saveLiabilities(liabilities)
    }
    return false
  },

  // 删除负债
  deleteLiability(id) {
    const liabilities = this.getLiabilities()
    const filteredLiabilities = liabilities.filter(liability => liability.id !== id)
    return this.saveLiabilities(filteredLiabilities)
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
      // 保留旧的分类结构用于兼容性
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
      ],
      // 新的二级分类映射
      categoryMapping: {
        // 旧分类ID到新分类的映射
        'investment': { categoryL1: 'investment', categoryL2: 'stocks' },
        'business': { categoryL1: 'equipment', categoryL2: 'production_equipment' },
        'intellectual': { categoryL1: 'other', categoryL2: 'intellectual_property' },
        'real_estate': { categoryL1: 'property', categoryL2: 'residence' },
        'other_assets': { categoryL1: 'other', categoryL2: 'other' },
        'consumer_loan': { categoryL1: 'debt', categoryL2: 'consumer_loan' },
        'business_loan': { categoryL1: 'debt', categoryL2: 'business_loan' },
        'credit_card': { categoryL1: 'debt', categoryL2: 'credit_card' },
        'mortgage': { categoryL1: 'debt', categoryL2: 'mortgage' },
        'other_liabilities': { categoryL1: 'debt', categoryL2: 'other_loan' },
        // 新增数码设备相关映射
        'digital': { categoryL1: 'digital', categoryL2: 'all' },
        'phone': { categoryL1: 'digital', categoryL2: 'phone' },
        'computer': { categoryL1: 'digital', categoryL2: 'laptop' },
        'tablet': { categoryL1: 'digital', categoryL2: 'tablet' },
        'camera': { categoryL1: 'digital', categoryL2: 'camera' }
      }
    }
  },

  // 迁移旧分类数据到新的二级分类格式
  migrateCategories() {
    const settings = this.getDefaultSettings()
    const mapping = settings.categoryMapping
    
    // 迁移资产数据
    const assets = this.getAssets()
    assets.forEach(asset => {
      if (asset.categoryId && !asset.categoryL1 && !asset.categoryL2) {
        const newCategory = mapping[asset.categoryId]
        if (newCategory) {
          asset.categoryL1 = newCategory.categoryL1
          asset.categoryL2 = newCategory.categoryL2
        } else {
          // 默认分类
          asset.categoryL1 = 'other'
          asset.categoryL2 = 'other'
        }
      }
    })
    this.saveAssets(assets)
    
    // 迁移负债数据
    const liabilities = this.getLiabilities()
    liabilities.forEach(liability => {
      if (liability.categoryId && !liability.categoryL1 && !liability.categoryL2) {
        const newCategory = mapping[liability.categoryId]
        if (newCategory) {
          liability.categoryL1 = newCategory.categoryL1
          liability.categoryL2 = newCategory.categoryL2
        } else {
          // 默认分类
          liability.categoryL1 = 'other'
          liability.categoryL2 = 'other'
        }
      }
    })
    this.saveLiabilities(liabilities)
    
    console.log('分类数据迁移完成')
  },

  // 检查是否应该清除示例数据
  shouldClearSampleData() {
    // 检查是否还有示例数据的标识
    const hasSampleData = wx.getStorageSync('has_sample_data')
    return hasSampleData !== false // 默认为true，除非明确设置为false
  },

  // 清除示例数据
  clearSampleData() {
    // 清除所有示例数据
    wx.setStorageSync('assets_data', [])
    wx.setStorageSync('liabilities_data', [])
    // 标记示例数据已清除
    wx.setStorageSync('has_sample_data', false)
  },

  // 格式化购买日期显示
  formatPurchaseDate(createDate, createTime) {
    // 优先使用购买日期，如果没有则使用创建时间
    let targetDate
    
    if (createDate) {
      // 用户设置的购买日期
      targetDate = new Date(createDate)
    } else if (createTime) {
      // 创建时间
      targetDate = new Date(createTime)
    } else {
      return '未知日期'
    }
    
    const now = new Date()
    // 重置时间到当天开始，只比较日期
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const compareDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
    
    const diffMs = today - compareDate
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return '今天'
    } else if (diffDays === 1) {
      return '昨天'
    } else if (diffDays > 0 && diffDays < 7) {
      return `${diffDays}天前`
    } else if (diffDays < 0 && diffDays > -7) {
      return `${Math.abs(diffDays)}天后`
    } else {
      // 超过7天显示具体日期
      return targetDate.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric'
      })
    }
  }
}

module.exports = StorageManager