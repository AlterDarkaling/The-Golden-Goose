/**
 * 资产折旧计算引擎（从前端复用）
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
   */
  static getDepreciationRate(categoryL2) {
    for (const category in this.DEPRECIATION_RATES) {
      const items = this.DEPRECIATION_RATES[category]
      if (items[categoryL2]) {
        return items[categoryL2].rate
      }
    }
    return 0.15
  }

  /**
   * 计算使用年数
   */
  static calculateUsageYears(purchaseDate) {
    if (!purchaseDate) return 0
    
    const purchase = new Date(purchaseDate)
    const now = new Date()
    
    const monthsDiff = (now.getFullYear() - purchase.getFullYear()) * 12 + 
                      (now.getMonth() - purchase.getMonth())
    
    return Math.round(monthsDiff / 12 * 100) / 100
  }

  /**
   * 计算资产当前净值
   */
  static calculateCurrentValue(originalValue, purchaseDate, customRate = null, categoryL2 = '') {
    const usageYears = this.calculateUsageYears(purchaseDate)
    const depreciationRate = customRate || this.getDepreciationRate(categoryL2)
    
    const currentValue = originalValue * Math.pow(1 - depreciationRate, usageYears)
    const totalDepreciation = originalValue - currentValue
    const monthlyDepreciation = usageYears > 0 ? totalDepreciation / (usageYears * 12) : 0
    const annualDepreciation = originalValue * depreciationRate * Math.pow(1 - depreciationRate, usageYears - 1)

    return {
      originalValue: Math.round(originalValue * 100) / 100,
      currentValue: Math.round(currentValue * 100) / 100,
      totalDepreciation: Math.round(totalDepreciation * 100) / 100,
      monthlyDepreciation: Math.round(monthlyDepreciation * 100) / 100,
      annualDepreciation: Math.round(annualDepreciation * 100) / 100,
      depreciationRate,
      usageYears,
      depreciationRatio: Math.round((totalDepreciation / originalValue) * 10000) / 100
    }
  }

  /**
   * 批量更新资产折旧
   */
  static batchUpdateDepreciation(assets) {
    return assets.map(asset => {
      if (asset.category_l1 === 'consumer_asset') {
        const depreciationData = this.calculateCurrentValue(
          asset.initial_value,
          asset.create_date,
          asset.custom_depreciation_rate,
          asset.category_l2
        )
        
        return {
          ...asset,
          current_value: depreciationData.currentValue,
          total_depreciation: depreciationData.totalDepreciation,
          monthly_depreciation: depreciationData.monthlyDepreciation,
          depreciation_ratio: depreciationData.depreciationRatio,
          last_depreciation_update: new Date()
        }
      }
      return asset
    })
  }
}

module.exports = DepreciationEngine

