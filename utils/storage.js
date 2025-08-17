// 本地存储管理工具
class StorageManager {
  constructor() {
    this.userKey = 'user_info'
    this.assetsKey = 'assets_data'
    this.liabilitiesKey = 'liabilities_data'
    this.settingsKey = 'app_settings'
  }

  // 用户相关
  saveUser(userInfo) {
    try {
      uni.setStorageSync(this.userKey, userInfo)
      return true
    } catch (e) {
      console.error('保存用户信息失败:', e)
      return false
    }
  }

  getUser() {
    try {
      return uni.getStorageSync(this.userKey) || null
    } catch (e) {
      console.error('获取用户信息失败:', e)
      return null
    }
  }

  // 资产相关
  saveAssets(assets) {
    try {
      uni.setStorageSync(this.assetsKey, assets)
      return true
    } catch (e) {
      console.error('保存资产数据失败:', e)
      return false
    }
  }

  getAssets() {
    try {
      return uni.getStorageSync(this.assetsKey) || []
    } catch (e) {
      console.error('获取资产数据失败:', e)
      return []
    }
  }

  addAsset(asset) {
    const assets = this.getAssets()
    asset.id = Date.now().toString()
    asset.createTime = new Date().toISOString()
    assets.push(asset)
    return this.saveAssets(assets)
  }

  updateAsset(asset) {
    const assets = this.getAssets()
    const index = assets.findIndex(item => item.id === asset.id)
    if (index !== -1) {
      assets[index] = { ...assets[index], ...asset }
      return this.saveAssets(assets)
    }
    return false
  }

  deleteAsset(assetId) {
    const assets = this.getAssets()
    const filtered = assets.filter(item => item.id !== assetId)
    return this.saveAssets(filtered)
  }

  // 负债相关
  saveLiabilities(liabilities) {
    try {
      uni.setStorageSync(this.liabilitiesKey, liabilities)
      return true
    } catch (e) {
      console.error('保存负债数据失败:', e)
      return false
    }
  }

  getLiabilities() {
    try {
      return uni.getStorageSync(this.liabilitiesKey) || []
    } catch (e) {
      console.error('获取负债数据失败:', e)
      return []
    }
  }

  addLiability(liability) {
    const liabilities = this.getLiabilities()
    liability.id = Date.now().toString()
    liability.createTime = new Date().toISOString()
    liabilities.push(liability)
    return this.saveLiabilities(liabilities)
  }

  updateLiability(liability) {
    const liabilities = this.getLiabilities()
    const index = liabilities.findIndex(item => item.id === liability.id)
    if (index !== -1) {
      liabilities[index] = { ...liabilities[index], ...liability }
      return this.saveLiabilities(liabilities)
    }
    return false
  }

  deleteLiability(liabilityId) {
    const liabilities = this.getLiabilities()
    const filtered = liabilities.filter(item => item.id !== liabilityId)
    return this.saveLiabilities(filtered)
  }

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
  }

  calculateDailyCost() {
    const liabilities = this.getLiabilities()
    return liabilities.reduce((sum, liability) => {
      const dailyCost = liability.dailyCost || 0
      return sum + dailyCost
    }, 0)
  }

  calculateDailyIncome() {
    const assets = this.getAssets()
    return assets.reduce((sum, asset) => {
      const dailyIncome = asset.dailyIncome || 0
      return sum + dailyIncome
    }, 0)
  }

  // 设置相关
  saveSettings(settings) {
    try {
      uni.setStorageSync(this.settingsKey, settings)
      return true
    } catch (e) {
      console.error('保存设置失败:', e)
      return false
    }
  }

  getSettings() {
    try {
      return uni.getStorageSync(this.settingsKey) || this.getDefaultSettings()
    } catch (e) {
      console.error('获取设置失败:', e)
      return this.getDefaultSettings()
    }
  }

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

  // 清除所有数据
  clearAll() {
    try {
      uni.removeStorageSync(this.userKey)
      uni.removeStorageSync(this.assetsKey)
      uni.removeStorageSync(this.liabilitiesKey)
      return true
    } catch (e) {
      console.error('清除数据失败:', e)
      return false
    }
  }
}

export default new StorageManager()
