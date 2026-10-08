/**
 * 数据迁移路由
 */

const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middleware/auth')
const { Asset, Liability } = require('../models')
const DepreciationEngine = require('../utils/depreciation')

// 所有迁移路由都需要认证
router.use(authenticateToken)

/**
 * 从本地数据迁移到云端
 */
router.post('/upload', async (req, res, next) => {
  try {
    const userId = req.userId
    const { assets, liabilities } = req.body

    if (!assets && !liabilities) {
      return res.status(400).json({
        success: false,
        message: '没有要迁移的数据'
      })
    }

    let assetsCreated = 0
    let liabilitiesCreated = 0

    // 迁移资产
    if (assets && Array.isArray(assets) && assets.length > 0) {
      // 处理折旧
      const processedAssets = assets.map(assetData => {
        if (assetData.categoryL1 === 'consumer_asset' || assetData.category_l1 === 'consumer_asset') {
          const depreciationData = DepreciationEngine.calculateCurrentValue(
            assetData.initialValue || assetData.initial_value,
            assetData.createDate || assetData.create_date || new Date().toISOString().split('T')[0],
            assetData.customDepreciationRate || assetData.custom_depreciation_rate,
            assetData.categoryL2 || assetData.category_l2
          )
          
          return {
            user_id: userId,
            name: assetData.name,
            category_l1: assetData.categoryL1 || assetData.category_l1,
            category_l2: assetData.categoryL2 || assetData.category_l2,
            category_l3: assetData.categoryL3 || assetData.category_l3,
            initial_value: assetData.initialValue || assetData.initial_value,
            current_value: depreciationData.currentValue,
            original_value: assetData.originalValue || assetData.original_value,
            is_depreciable: true,
            depreciation_rate: depreciationData.depreciationRate,
            custom_depreciation_rate: assetData.customDepreciationRate || assetData.custom_depreciation_rate,
            total_depreciation: depreciationData.totalDepreciation,
            monthly_depreciation: depreciationData.monthlyDepreciation,
            depreciation_ratio: depreciationData.depreciationRatio,
            monthly_income: assetData.monthlyIncome || assetData.monthly_income || 0,
            monthly_operating_cost: assetData.monthlyOperatingCost || assetData.monthly_operating_cost || 0,
            status: assetData.status || 'active',
            create_date: assetData.createDate || assetData.create_date,
            notes: assetData.notes,
            is_sample: assetData.isSample || false,
            last_depreciation_update: new Date()
          }
        }
        
        return {
          user_id: userId,
          name: assetData.name,
          category_l1: assetData.categoryL1 || assetData.category_l1,
          category_l2: assetData.categoryL2 || assetData.category_l2,
          category_l3: assetData.categoryL3 || assetData.category_l3,
          initial_value: assetData.initialValue || assetData.initial_value,
          current_value: assetData.currentValue || assetData.current_value || assetData.initialValue || assetData.initial_value,
          original_value: assetData.originalValue || assetData.original_value,
          monthly_income: assetData.monthlyIncome || assetData.monthly_income || 0,
          monthly_operating_cost: assetData.monthlyOperatingCost || assetData.monthly_operating_cost || 0,
          salary_structure: assetData.salaryStructure || assetData.salary_structure,
          daily_work_hours: assetData.dailyWorkHours || assetData.daily_work_hours || 8,
          weekly_work_days: assetData.weeklyWorkDays || assetData.weekly_work_days || 5,
          working_months_per_year: assetData.workingMonthsPerYear || assetData.working_months_per_year || 12,
          fixed_allowances: assetData.fixedAllowances || assetData.fixed_allowances || 0,
          start_date: assetData.startDate || assetData.start_date,
          end_date: assetData.endDate || assetData.end_date,
          status: assetData.status || 'active',
          create_date: assetData.createDate || assetData.create_date,
          notes: assetData.notes,
          is_sample: assetData.isSample || false
        }
      })

      const createdAssets = await Asset.bulkCreate(processedAssets, {
        validate: true,
        ignoreDuplicates: true
      })
      assetsCreated = createdAssets.length
    }

    // 迁移负债
    if (liabilities && Array.isArray(liabilities) && liabilities.length > 0) {
      const processedLiabilities = liabilities.map(liabilityData => ({
        user_id: userId,
        name: liabilityData.name,
        category_l1: liabilityData.categoryL1 || liabilityData.category_l1,
        category_l2: liabilityData.categoryL2 || liabilityData.category_l2,
        category_l3: liabilityData.categoryL3 || liabilityData.category_l3,
        initial_amount: liabilityData.initialAmount || liabilityData.initial_amount,
        current_amount: liabilityData.currentAmount || liabilityData.current_amount || liabilityData.initialAmount || liabilityData.initial_amount,
        original_amount: liabilityData.originalAmount || liabilityData.original_amount,
        type: liabilityData.type,
        monthly_payment: liabilityData.monthlyPayment || liabilityData.monthly_payment || 0,
        annual_rate: liabilityData.annualRate || liabilityData.annual_rate,
        months: liabilityData.months,
        total_interest: liabilityData.totalInterest || liabilityData.total_interest || 0,
        total_amount: liabilityData.totalAmount || liabilityData.total_amount || 0,
        loan_schedule: liabilityData.loanSchedule || liabilityData.loan_schedule,
        related_asset_id: liabilityData.relatedAssetId || liabilityData.related_asset_id,
        status: liabilityData.status || 'normal',
        create_date: liabilityData.createDate || liabilityData.create_date,
        start_date: liabilityData.startDate || liabilityData.start_date,
        notes: liabilityData.notes,
        is_sample: liabilityData.isSample || false
      }))

      const createdLiabilities = await Liability.bulkCreate(processedLiabilities, {
        validate: true,
        ignoreDuplicates: true
      })
      liabilitiesCreated = createdLiabilities.length
    }

    res.json({
      success: true,
      message: '数据迁移成功',
      data: {
        assetsCreated,
        liabilitiesCreated
      }
    })
  } catch (error) {
    console.error('数据迁移错误:', error)
    next(error)
  }
})

/**
 * 清除示例数据
 */
router.delete('/clear-sample', async (req, res, next) => {
  try {
    const userId = req.userId

    const assetsDeleted = await Asset.destroy({
      where: { user_id: userId, is_sample: true }
    })

    const liabilitiesDeleted = await Liability.destroy({
      where: { user_id: userId, is_sample: true }
    })

    res.json({
      success: true,
      message: '示例数据清除成功',
      data: {
        assetsDeleted,
        liabilitiesDeleted
      }
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router

