/**
 * 重新计算所有资产的折旧
 */

require('dotenv').config()
const db = require('../config/database')
const { Asset } = require('../models')
const DepreciationEngine = require('../utils/depreciation')

async function recalculateDepreciation() {
  try {
    console.log('开始重新计算资产折旧...')
    
    // 连接数据库
    await db.authenticate()
    console.log('✅ 数据库连接成功')
    
    // 获取所有资产
    const assets = await Asset.findAll()
    console.log(`📊 找到 ${assets.length} 个资产`)
    
    let updatedCount = 0
    
    for (const asset of assets) {
      const categoryL1 = asset.category_l1
      const categoryL2 = asset.category_l2
      
      // 判断是否需要折旧
      const needsDepreciation = 
        categoryL1 === 'consumer_asset' ||
        (categoryL1 === 'physical_assets' && categoryL2 === 'consumer_assets') ||
        categoryL2 === 'mobile_phone' ||
        categoryL2 === 'computer_digital' ||
        categoryL2 === 'home_appliances'
      
      if (needsDepreciation) {
        const depreciationData = DepreciationEngine.calculateCurrentValue(
          parseFloat(asset.initial_value),
          asset.create_date || new Date().toISOString().split('T')[0],
          asset.custom_depreciation_rate ? parseFloat(asset.custom_depreciation_rate) : null,
          categoryL2
        )
        
        await asset.update({
          current_value: depreciationData.currentValue,
          total_depreciation: depreciationData.totalDepreciation,
          monthly_depreciation: depreciationData.monthlyDepreciation,
          depreciation_rate: depreciationData.depreciationRate,
          depreciation_ratio: depreciationData.depreciationRatio,
          is_depreciable: true,
          last_depreciation_update: new Date()
        })
        
        console.log(`✅ 已更新资产: ${asset.name} - 当前价值: ¥${depreciationData.currentValue}`)
        updatedCount++
      }
    }
    
    console.log(`🎉 成功更新 ${updatedCount} 个资产的折旧信息`)
    
    await db.close()
    process.exit(0)
  } catch (error) {
    console.error('❌ 重新计算折旧失败:', error)
    process.exit(1)
  }
}

recalculateDepreciation()
