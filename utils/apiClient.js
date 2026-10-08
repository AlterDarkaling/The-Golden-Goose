/**
 * API客户端 - 用于对接后端服务
 * 
 * 使用方式：
 * 1. 纯本地模式（默认）：所有数据保存在本地
 * 2. 云端模式：数据保存在服务器
 * 
 * 通过配置文件切换模式
 */

const StorageManager = require('./storage.js')

// API配置
const API_CONFIG = {
  // 是否启用云端模式
  ENABLE_CLOUD: true,  // ✅ 已启用云端模式
  
  // 后端API地址
  BASE_URL: 'http://localhost:3000/api',  // 本地开发环境
  
  // 请求超时时间
  TIMEOUT: 10000
}

class APIClient {
  
  /**
   * 获取Token
   */
  static getToken() {
    return wx.getStorageSync('api_token') || ''
  }
  
  /**
   * 保存Token
   */
  static setToken(token) {
    wx.setStorageSync('api_token', token)
  }
  
  /**
   * 清除Token
   */
  static clearToken() {
    wx.removeStorageSync('api_token')
  }
  
  /**
   * 通用请求方法
   */
  static request(url, method = 'GET', data = null, needAuth = true) {
    return new Promise((resolve, reject) => {
      const header = {
        'Content-Type': 'application/json'
      }
      
      // 添加认证头
      if (needAuth) {
        const token = this.getToken()
        if (token) {
          header['Authorization'] = `Bearer ${token}`
        }
      }
      
      const requestConfig = {
        url: `${API_CONFIG.BASE_URL}${url}`,
        method,
        header,
        dataType: 'json',  // 确保自动解析 JSON
        timeout: API_CONFIG.TIMEOUT,
        success: (res) => {
          console.log(`API响应 [${method} ${url}]:`, res.statusCode, res.data)
          
          if (res.statusCode === 200 || res.statusCode === 201) {
            resolve(res.data)
          } else if (res.statusCode === 401) {
            // Token过期，清除并提示重新登录
            this.clearToken()
            wx.showToast({
              title: '登录已过期，请重新登录',
              icon: 'none'
            })
            reject(new Error('未授权'))
          } else {
            // 安全地提取错误信息
            let errorMessage = '请求失败'
            if (res.data && typeof res.data === 'object') {
              errorMessage = res.data.message || errorMessage
            } else if (typeof res.data === 'string') {
              errorMessage = res.data
            }
            console.error(`API错误 [${method} ${url}]:`, res.statusCode, errorMessage)
            reject(new Error(errorMessage))
          }
        },
        fail: (err) => {
          console.error('API请求失败:', err)
          reject(err)
        }
      }
      
      // 只有在有数据时才添加 data 字段（避免 DELETE/GET 请求发送空 body）
      if (data !== null && data !== undefined) {
        requestConfig.data = data
      }
      
      wx.request(requestConfig)
    })
  }
  
  /**
   * 微信登录
   */
  static async wechatLogin(code, userInfo) {
    const res = await this.request('/auth/wechat/login', 'POST', {
      code,
      userInfo
    }, false)
    
    if (res.success && res.data.token) {
      this.setToken(res.data.token)
    }
    
    return res
  }
  
  /**
   * 演示身份登录（后端 /auth/dev-login，仅开发环境）
   * 微信真实登录在 test_appid 下走不通，答辩演示用这里的身份切换来验证多用户数据隔离
   */
  static async devLogin(nickname, avatar = '') {
    const res = await this.request('/auth/dev-login', 'POST', { nickname, avatar }, false)
    
    if (res.success && res.data && res.data.token) {
      this.setToken(res.data.token)
    }
    
    return res
  }
  
  /**
   * 获取当前用户信息
   */
  static async getCurrentUser() {
    return this.request('/auth/me', 'GET')
  }
  
  /**
   * 获取资产列表
   */
  static async getAssets(params = {}) {
    // 手动构建query参数（微信小程序不支持URLSearchParams）
    const queryArray = []
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        queryArray.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      }
    }
    const query = queryArray.join('&')
    return this.request(`/assets${query ? '?' + query : ''}`, 'GET')
  }
  
  /**
   * 获取单个资产
   */
  static async getAssetById(id) {
    return this.request(`/assets/${id}`, 'GET')
  }
  
  /**
   * 创建资产
   */
  static async createAsset(assetData) {
    return this.request('/assets', 'POST', assetData)
  }
  
  /**
   * 更新资产
   */
  static async updateAsset(id, assetData) {
    return this.request(`/assets/${id}`, 'PUT', assetData)
  }
  
  /**
   * 删除资产
   */
  static async deleteAsset(id) {
    return this.request(`/assets/${id}`, 'DELETE')
  }
  
  /**
   * 批量创建资产
   */
  static async batchCreateAssets(assets) {
    return this.request('/assets/batch', 'POST', { assets })
  }
  
  /**
   * 获取负债列表
   */
  static async getLiabilities(params = {}) {
    // 手动构建query参数（微信小程序不支持URLSearchParams）
    const queryArray = []
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        queryArray.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      }
    }
    const query = queryArray.join('&')
    return this.request(`/liabilities${query ? '?' + query : ''}`, 'GET')
  }
  
  /**
   * 创建负债
   */
  static async createLiability(liabilityData) {
    return this.request('/liabilities', 'POST', liabilityData)
  }
  
  /**
   * 更新负债
   */
  static async updateLiability(id, liabilityData) {
    return this.request(`/liabilities/${id}`, 'PUT', liabilityData)
  }
  
  /**
   * 删除负债
   */
  static async deleteLiability(id) {
    return this.request(`/liabilities/${id}`, 'DELETE')
  }
  
  /**
   * 批量创建负债
   */
  static async batchCreateLiabilities(liabilities) {
    return this.request('/liabilities/batch', 'POST', { liabilities })
  }
  
  // ==================== 梦想储蓄罐 API ====================
  
  /**
   * 获取储蓄目标列表
   */
  static async getSavingGoals(params = {}) {
    const queryArray = []
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        queryArray.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      }
    }
    const queryString = queryArray.length > 0 ? `?${queryArray.join('&')}` : ''
    return this.request(`/saving-goals${queryString}`, 'GET')
  }
  
  /**
   * 创建储蓄目标
   */
  static async createSavingGoal(goalData) {
    return this.request('/saving-goals', 'POST', goalData)
  }
  
  /**
   * 更新储蓄目标
   */
  static async updateSavingGoal(id, goalData) {
    return this.request(`/saving-goals/${id}`, 'PUT', goalData)
  }
  
  /**
   * 删除储蓄目标
   */
  static async deleteSavingGoal(id) {
    console.log('删除储蓄目标 API 调用，ID:', id)
    return this.request(`/saving-goals/${id}`, 'DELETE')
  }
  
  /**
   * 批量删除储蓄目标
   */
  static async batchDeleteSavingGoals(ids) {
    return this.request('/saving-goals/batch-delete', 'POST', { ids })
  }
  
  // ==================== 其他API ====================
  
  /**
   * 数据迁移 - 从本地上传到云端
   */
  static async migrateToCloud(assets, liabilities) {
    return this.request('/migration/upload', 'POST', {
      assets,
      liabilities
    })
  }
  
  /**
   * 清除示例数据
   */
  static async clearSampleData() {
    return this.request('/migration/clear-sample', 'DELETE')
  }
  
  /**
   * 更新用户信息
   */
  static async updateUserProfile(profileData) {
    return this.request('/users/profile', 'PUT', profileData)
  }
}

/**
 * 智能存储管理器
 * 根据配置自动选择本地或云端存储
 */
class SmartStorage {
  
  /**
   * 解析云端记录 ID
   * 后端 id 是自增整数，但页面间跳转经 URL 参数传递后必然变成字符串，
   * 因此只要 id 是正整数（数字或纯数字字符串）就认定为已有记录，走更新而非新建
   */
  static resolveCloudId(id) {
    if (typeof id === 'number' && Number.isInteger(id) && id > 0) return id
    if (typeof id === 'string' && /^\d+$/.test(id)) {
      const parsed = parseInt(id, 10)
      return parsed > 0 ? parsed : null
    }
    return null
  }
  
  /**
   * 保存资产
   */
  static async saveAsset(assetData) {
    if (API_CONFIG.ENABLE_CLOUD) {
      // 云端模式
      const cloudId = this.resolveCloudId(assetData.id)
      
      if (cloudId) {
        const res = await APIClient.updateAsset(cloudId, assetData)
        return res.data
      } else {
        // 新建时不传ID，让后端生成
        const { id, ...dataWithoutId } = assetData
        const res = await APIClient.createAsset(dataWithoutId)
        return res.data
      }
    } else {
      // 本地模式
      return StorageManager.saveAsset(assetData)
    }
  }
  
  /**
   * 获取资产列表
   */
  static async getAssets(filter = {}) {
    if (API_CONFIG.ENABLE_CLOUD) {
      const res = await APIClient.getAssets(filter)
      return res.data || []
    } else {
      return StorageManager.getAssets()
    }
  }
  
  /**
   * 删除资产
   */
  static async deleteAsset(assetId) {
    if (API_CONFIG.ENABLE_CLOUD) {
      return await APIClient.deleteAsset(assetId)
    } else {
      return StorageManager.deleteAsset(assetId)
    }
  }
  
  /**
   * 保存负债
   */
  static async saveLiability(liabilityData) {
    if (API_CONFIG.ENABLE_CLOUD) {
      // 云端模式
      const cloudId = this.resolveCloudId(liabilityData.id)
      
      if (cloudId) {
        const res = await APIClient.updateLiability(cloudId, liabilityData)
        return res.data
      } else {
        // 新建时不传ID，让后端生成
        const { id, ...dataWithoutId } = liabilityData
        const res = await APIClient.createLiability(dataWithoutId)
        return res.data
      }
    } else {
      // 本地模式
      return StorageManager.saveLiability(liabilityData)
    }
  }
  
  /**
   * 获取负债列表
   */
  static async getLiabilities(filter = {}) {
    if (API_CONFIG.ENABLE_CLOUD) {
      const res = await APIClient.getLiabilities(filter)
      return res.data || []
    } else {
      return StorageManager.getLiabilities()
    }
  }
  
  /**
   * 删除负债
   */
  static async deleteLiability(liabilityId) {
    if (API_CONFIG.ENABLE_CLOUD) {
      return await APIClient.deleteLiability(liabilityId)
    } else {
      return StorageManager.deleteLiability(liabilityId)
    }
  }
  
  // ==================== 梦想储蓄罐 ====================
  
  /**
   * 保存储蓄目标
   */
  static async saveSavingGoal(goalData) {
    if (API_CONFIG.ENABLE_CLOUD) {
      // 云端模式
      const cloudId = this.resolveCloudId(goalData.id)
      
      if (cloudId) {
        const res = await APIClient.updateSavingGoal(cloudId, goalData)
        return res.data
      } else {
        // 新建时不传ID，让后端生成
        const { id, ...dataWithoutId } = goalData
        const res = await APIClient.createSavingGoal(dataWithoutId)
        return res.data
      }
    } else {
      // 本地模式 - 使用 wx.setStorageSync
      const goals = wx.getStorageSync('financial_goals') || []
      
      if (goalData.id) {
        // 更新
        const index = goals.findIndex(g => g.id === goalData.id)
        if (index !== -1) {
          goals[index] = goalData
        }
      } else {
        // 创建
        goalData.id = Date.now().toString()
        goals.push(goalData)
      }
      
      wx.setStorageSync('financial_goals', goals)
      return goalData
    }
  }
  
  /**
   * 获取储蓄目标列表
   */
  static async getSavingGoals(filter = {}) {
    if (API_CONFIG.ENABLE_CLOUD) {
      const res = await APIClient.getSavingGoals(filter)
      return res.data || []
    } else {
      return wx.getStorageSync('financial_goals') || []
    }
  }
  
  /**
   * 删除储蓄目标
   */
  static async deleteSavingGoal(goalId) {
    if (API_CONFIG.ENABLE_CLOUD) {
      return await APIClient.deleteSavingGoal(goalId)
    } else {
      const goals = wx.getStorageSync('financial_goals') || []
      const filteredGoals = goals.filter(g => g.id !== goalId)
      wx.setStorageSync('financial_goals', filteredGoals)
      return { success: true }
    }
  }
  
  /**
   * 从本地迁移到云端
   */
  static async migrateLocalToCloud() {
    if (!API_CONFIG.ENABLE_CLOUD) {
      throw new Error('云端模式未启用')
    }
    
    // 获取本地数据
    const localAssets = StorageManager.getAssets()
    const localLiabilities = StorageManager.getLiabilities()
    
    if (localAssets.length === 0 && localLiabilities.length === 0) {
      return {
        success: true,
        message: '没有需要迁移的数据'
      }
    }
    
    // 上传到云端
    const result = await APIClient.migrateToCloud(localAssets, localLiabilities)
    
    if (result.success) {
      // 迁移成功后，可选择清除本地数据
      // StorageManager.clearAllData()
    }
    
    return result
  }
  
  /**
   * 从云端同步到本地
   */
  static async syncFromCloud() {
    if (!API_CONFIG.ENABLE_CLOUD) {
      throw new Error('云端模式未启用')
    }
    
    const assetsRes = await APIClient.getAssets()
    const liabilitiesRes = await APIClient.getLiabilities()
    
    const assets = assetsRes.data || []
    const liabilities = liabilitiesRes.data || []
    
    // 保存到本地存储
    wx.setStorageSync('financial_assets', assets)
    wx.setStorageSync('financial_liabilities', liabilities)
    
    return {
      assetsCount: assets.length,
      liabilitiesCount: liabilities.length
    }
  }
}

module.exports = {
  APIClient,
  SmartStorage,
  API_CONFIG
}

