/**
 * 资产折旧计算引擎
 * 基于传统会计准则，支持多种折旧方式
 */

class DepreciationEngine {
  
  /**
   * 预设折旧率配置
   */
  static DEPRECIATION_RATES = {
    // 电子产品
    electronics: {
      mobile_phone: { rate: 0.40, name: '手机通讯' },
      computer_digital: { rate: 0.35, name: '电脑数码' },
      entertainment: { rate: 0.30, name: '娱乐设备' }
    },
    // 家具家电
    furniture: {
      home_appliances: { rate: 0.20, name: '家用电器' },
      furniture: { rate: 0.15, name: '家具用品' }
    },
    // 交通工具
    vehicle: {
      personal_vehicle: { rate: 0.25, name: '交通工具' }
    },
    // 其他物品
    other: {
      clothing_accessories: { rate: 0.50, name: '服装配饰' },
      sports_fitness: { rate: 0.20, name: '运动健身' },
      other_consumer: { rate: 0.15, name: '其他消费品' }
    }
  }

  /**
   * 获取预设折旧率
   * @param {string} categoryL2 - 二级分类标识
   * @returns {number} 年折旧率
   */
  static getDepreciationRate(categoryL2) {
    // 遍历所有分类寻找匹配的折旧率
    for (const category in this.DEPRECIATION_RATES) {
      const items = this.DEPRECIATION_RATES[category]
      if (items[categoryL2]) {
        return items[categoryL2].rate
      }
    }
    // 默认折旧率
    return 0.15
  }

  /**
   * 计算使用年数
   * @param {string} purchaseDate - 购买日期 (YYYY-MM-DD)
   * @returns {number} 使用年数（精确到月）
   */
  static calculateUsageYears(purchaseDate) {
    if (!purchaseDate) return 0
    
    const purchase = new Date(purchaseDate)
    const now = new Date()
    
    // 计算月份差
    const monthsDiff = (now.getFullYear() - purchase.getFullYear()) * 12 + 
                      (now.getMonth() - purchase.getMonth())
    
    // 转换为年数（保留2位小数）
    return Math.round(monthsDiff / 12 * 100) / 100
  }

  /**
   * 计算资产当前净值
   * @param {number} originalValue - 原值
   * @param {string} purchaseDate - 购买日期
   * @param {number} customRate - 自定义折旧率（可选）
   * @param {string} categoryL2 - 二级分类（用于获取预设折旧率）
   * @returns {Object} 折旧计算结果
   */
  static calculateCurrentValue(originalValue, purchaseDate, customRate = null, categoryL2 = '') {
    const usageYears = this.calculateUsageYears(purchaseDate)
    const depreciationRate = customRate || this.getDepreciationRate(categoryL2)
    
    // 当前净值 = 原值 × (1 - 年折旧率)^使用年数
    const currentValue = originalValue * Math.pow(1 - depreciationRate, usageYears)
    
    // 累计折旧额
    const totalDepreciation = originalValue - currentValue
    
    // 月均折旧额
    const monthlyDepreciation = usageYears > 0 ? totalDepreciation / (usageYears * 12) : 0
    
    // 年度折旧额
    const annualDepreciation = originalValue * depreciationRate * Math.pow(1 - depreciationRate, usageYears - 1)

    return {
      originalValue: Math.round(originalValue * 100) / 100,
      currentValue: Math.round(currentValue * 100) / 100,
      totalDepreciation: Math.round(totalDepreciation * 100) / 100,
      monthlyDepreciation: Math.round(monthlyDepreciation * 100) / 100,
      annualDepreciation: Math.round(annualDepreciation * 100) / 100,
      depreciationRate,
      usageYears,
      depreciationRatio: Math.round((totalDepreciation / originalValue) * 10000) / 100 // 百分比
    }
  }

  /**
   * 预测未来价值
   * @param {number} originalValue - 原值
   * @param {string} purchaseDate - 购买日期
   * @param {number} futureYears - 未来年数
   * @param {number} depreciationRate - 折旧率
   * @returns {Array} 未来价值预测数组
   */
  static predictFutureValue(originalValue, purchaseDate, futureYears = 5, depreciationRate) {
    const predictions = []
    const currentUsageYears = this.calculateUsageYears(purchaseDate)
    
    for (let i = 0; i <= futureYears; i++) {
      const totalYears = currentUsageYears + i
      const value = originalValue * Math.pow(1 - depreciationRate, totalYears)
      
      predictions.push({
        year: totalYears,
        value: Math.round(value * 100) / 100,
        date: this.addYearsToDate(purchaseDate, totalYears)
      })
    }
    
    return predictions
  }

  /**
   * 计算折旧对月收入的影响比例
   * @param {number} monthlyDepreciation - 月折旧额
   * @param {number} monthlyIncome - 月收入
   * @returns {number} 影响比例（百分比）
   */
  static calculateDepreciationImpact(monthlyDepreciation, monthlyIncome) {
    if (monthlyIncome <= 0) return 0
    return Math.round((monthlyDepreciation / monthlyIncome) * 10000) / 100
  }

  /**
   * 生成智能提示文案
   * @param {Object} depreciationData - 折旧数据
   * @param {number} monthlyIncome - 月收入
   * @returns {Object} 提示文案
   */
  static generateSmartTips(depreciationData, monthlyIncome = 0) {
    const { depreciationRatio, monthlyDepreciation, usageYears, currentValue, originalValue } = depreciationData
    const tips = []

    // 折旧程度提示
    if (depreciationRatio > 50) {
      tips.push({
        type: 'warning',
        icon: '⚠️',
        message: `该物品已贬值${depreciationRatio}%，建议考虑更换时机`
      })
    } else if (depreciationRatio < 20) {
      tips.push({
        type: 'success',
        icon: '✅',
        message: `物品保值良好，仅贬值${depreciationRatio}%`
      })
    }

    // 使用建议
    if (usageYears < 1 && depreciationRatio > 30) {
      tips.push({
        type: 'info',
        icon: '💡',
        message: `使用不足1年已贬值${depreciationRatio}%，建议延长使用周期`
      })
    }

    // 月收入占比提示
    if (monthlyIncome > 0) {
      const impact = this.calculateDepreciationImpact(monthlyDepreciation, monthlyIncome)
      if (impact > 5) {
        tips.push({
          type: 'warning',
          icon: '💸',
          message: `月折旧占收入${impact}%，建议控制消费频率`
        })
      }
    }

    // 残值提示
    const residualRatio = (currentValue / originalValue) * 100
    if (residualRatio < 30) {
      tips.push({
        type: 'info',
        icon: '📉',
        message: `当前残值率${Math.round(residualRatio)}%，可考虑二手处理`
      })
    }

    return tips
  }

  /**
   * 辅助方法：给日期添加年数
   */
  static addYearsToDate(dateString, years) {
    const date = new Date(dateString)
    date.setFullYear(date.getFullYear() + years)
    return date.toISOString().split('T')[0]
  }

  /**
   * 批量更新资产折旧（定时任务用）
   * @param {Array} assets - 资产数组
   * @returns {Array} 更新后的资产数组
   */
  static batchUpdateDepreciation(assets) {
    return assets.map(asset => {
      if (asset.categoryL1 === 'consumer_asset') {
        const depreciationData = this.calculateCurrentValue(
          asset.initialValue,
          asset.createDate,
          asset.customDepreciationRate,
          asset.categoryL2
        )
        
        return {
          ...asset,
          currentValue: depreciationData.currentValue,
          totalDepreciation: depreciationData.totalDepreciation,
          monthlyDepreciation: depreciationData.monthlyDepreciation,
          depreciationRatio: depreciationData.depreciationRatio,
          lastDepreciationUpdate: new Date().toISOString()
        }
      }
      return asset
    })
  }
}

module.exports = DepreciationEngine
