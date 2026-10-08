/**
 * 资产折旧计算引擎
 * 余额递减法：current_value = initial_value * (1 - annual_rate) ^ usage_years
 */

class DepreciationEngine {

  /**
   * 预设年折旧率，键为 utils/accountingCategories.js 中消费型资产的项目值（category_l3）
   */
  static DEPRECIATION_RATES = {
    mobile_computer: 0.40,
    home_appliance: 0.20,
    furniture: 0.10,
    vehicle: 0.20,
    clothing: 0.50,
    luxury_goods: 0.30
  }

  static DEFAULT_RATE = 0.15

  /**
   * 需要计提折旧的资产判定：
   * 显式标记 is_depreciable，或属于实物资产下的消费型资产（consumer_asset 为历史拼写）
   */
  static needsDepreciation(asset) {
    if (!asset) return false
    if (asset.is_depreciable === true) return true

    const categoryL1 = asset.category_l1
    const categoryL2 = asset.category_l2

    if (categoryL1 === 'consumer_asset') return true

    return categoryL1 === 'physical_assets' && categoryL2 === 'consumer_assets'
  }

  /**
   * 折旧率归一化：编辑页按百分数录入（40 表示 40%），落库与计算一律用小数
   */
  static normalizeRate(rate) {
    const value = typeof rate === 'string' ? parseFloat(rate) : rate
    if (!Number.isFinite(value) || value <= 0) return null
    return value >= 1 ? value / 100 : value
  }

  /**
   * 取值优先级：自定义折旧率 → 页面填写的折旧率 → 按项目分类查预设 → 默认值
   */
  static resolveRate(categoryL3, categoryL2, customRate, rate) {
    return this.normalizeRate(customRate) ||
      this.normalizeRate(rate) ||
      this.DEPRECIATION_RATES[categoryL3] ||
      this.DEPRECIATION_RATES[categoryL2] ||
      this.DEFAULT_RATE
  }

  /**
   * 兼容旧调用签名 getDepreciationRate(categoryL2)
   */
  static getDepreciationRate(categoryL2, categoryL3) {
    return this.resolveRate(categoryL3, categoryL2)
  }

  /**
   * 折旧基数：历史数据可能只写了 original_value，initial_value 为 0 时退化取原值
   */
  static initialValueOf(asset) {
    const initialValue = Number(asset && asset.initial_value)
    if (Number.isFinite(initialValue) && initialValue > 0) return initialValue

    const originalValue = Number(asset && asset.original_value)
    return Number.isFinite(originalValue) && originalValue > 0 ? originalValue : 0
  }

  /**
   * 计算使用年数，未到期（未来日期）按 0 处理
   */
  static calculateUsageYears(purchaseDate) {
    if (!purchaseDate) return 0

    const purchase = new Date(purchaseDate)
    if (Number.isNaN(purchase.getTime())) return 0

    const now = new Date()
    const monthsDiff = (now.getFullYear() - purchase.getFullYear()) * 12 +
      (now.getMonth() - purchase.getMonth())

    if (monthsDiff <= 0) return 0

    return Math.round(monthsDiff / 12 * 100) / 100
  }

  /**
   * 计算资产当前净值
   */
  static calculateCurrentValue(options = {}) {
    const {
      initialValue,
      purchaseDate,
      customRate,
      rate,
      categoryL2,
      categoryL3
    } = options

    const originalValue = Number(initialValue) || 0
    const depreciationRate = this.resolveRate(categoryL3, categoryL2, customRate, rate)
    const usageYears = this.calculateUsageYears(purchaseDate)

    if (originalValue <= 0) {
      return {
        originalValue: 0,
        currentValue: 0,
        totalDepreciation: 0,
        monthlyDepreciation: 0,
        annualDepreciation: 0,
        depreciationRate,
        usageYears,
        depreciationRatio: 0
      }
    }

    const currentValue = originalValue * Math.pow(1 - depreciationRate, usageYears)
    const totalDepreciation = originalValue - currentValue
    const monthlyDepreciation = usageYears > 0 ? totalDepreciation / (usageYears * 12) : 0
    const annualDepreciation = originalValue * depreciationRate * Math.pow(1 - depreciationRate, Math.max(0, usageYears - 1))

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
   * 批量刷新资产折旧：按购买日期到今天的时长重算现值，非折旧类资产原样返回
   */
  static batchUpdateDepreciation(assets) {
    return (assets || []).map(asset => {
      if (!this.needsDepreciation(asset)) return asset

      const depreciationData = this.calculateCurrentValue({
        initialValue: this.initialValueOf(asset),
        purchaseDate: asset.create_date || asset.purchase_date,
        customRate: asset.custom_depreciation_rate,
        rate: asset.depreciation_rate,
        categoryL2: asset.category_l2,
        categoryL3: asset.category_l3
      })

      // 同一天内重复读取不会改变现值，此时原样返回，避免每次 GET 都刷新时间戳并写库
      if (Number(asset.current_value) === depreciationData.currentValue) return asset

      return {
        ...asset,
        current_value: depreciationData.currentValue,
        total_depreciation: depreciationData.totalDepreciation,
        monthly_depreciation: depreciationData.monthlyDepreciation,
        depreciation_ratio: depreciationData.depreciationRatio,
        depreciation_rate: depreciationData.depreciationRate,
        last_depreciation_update: new Date()
      }
    })
  }
}

module.exports = DepreciationEngine
