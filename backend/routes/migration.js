/**
 * 数据迁移路由
 */

const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middleware/auth')
const { Asset, Liability } = require('../models')
const DepreciationEngine = require('../utils/depreciation')
const LoanCalculator = require('../utils/loanCalculator')

/**
 * 取第一个已显式给出的值：0 与 false 是有效数据，不能被 || 跳过
 */
function firstDefined(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') return value
  }
  return undefined
}

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
        const row = {
          user_id: userId,
          name: assetData.name,
          category_l1: firstDefined(assetData.categoryL1, assetData.category_l1),
          category_l2: firstDefined(assetData.categoryL2, assetData.category_l2),
          category_l3: firstDefined(assetData.categoryL3, assetData.category_l3),
          initial_value: firstDefined(assetData.initialValue, assetData.initial_value),
          current_value: firstDefined(assetData.currentValue, assetData.current_value, assetData.initialValue, assetData.initial_value),
          original_value: firstDefined(assetData.originalValue, assetData.original_value),
          is_depreciable: firstDefined(assetData.isDepreciable, assetData.is_depreciable, false),
          depreciation_rate: firstDefined(assetData.depreciationRate, assetData.depreciation_rate),
          custom_depreciation_rate: firstDefined(assetData.customDepreciationRate, assetData.custom_depreciation_rate),
          monthly_income: firstDefined(assetData.monthlyIncome, assetData.monthly_income, 0),
          monthly_operating_cost: firstDefined(assetData.monthlyOperatingCost, assetData.monthly_operating_cost, 0),
          salary_structure: firstDefined(assetData.salaryStructure, assetData.salary_structure),
          daily_work_hours: firstDefined(assetData.dailyWorkHours, assetData.daily_work_hours, 8),
          weekly_work_days: firstDefined(assetData.weeklyWorkDays, assetData.weekly_work_days, 5),
          working_months_per_year: firstDefined(assetData.workingMonthsPerYear, assetData.working_months_per_year, 12),
          fixed_allowances: firstDefined(assetData.fixedAllowances, assetData.fixed_allowances, 0),
          start_date: firstDefined(assetData.startDate, assetData.start_date),
          end_date: firstDefined(assetData.endDate, assetData.end_date),
          status: assetData.status || 'active',
          create_date: firstDefined(assetData.createDate, assetData.create_date),
          notes: assetData.notes,
          is_sample: assetData.isSample || false
        }

        if (!DepreciationEngine.needsDepreciation(row)) return row

        const depreciationData = DepreciationEngine.calculateCurrentValue({
          initialValue: DepreciationEngine.initialValueOf(row),
          purchaseDate: row.create_date || new Date().toISOString().split('T')[0],
          customRate: row.custom_depreciation_rate,
          rate: row.depreciation_rate,
          categoryL2: row.category_l2,
          categoryL3: row.category_l3
        })

        return {
          ...row,
          current_value: depreciationData.currentValue,
          is_depreciable: true,
          depreciation_rate: depreciationData.depreciationRate,
          total_depreciation: depreciationData.totalDepreciation,
          monthly_depreciation: depreciationData.monthlyDepreciation,
          depreciation_ratio: depreciationData.depreciationRatio,
          last_depreciation_update: new Date()
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
      const processedLiabilities = liabilities.map(liabilityData => {
        const row = {
          user_id: userId,
          name: liabilityData.name,
          category_l1: firstDefined(liabilityData.categoryL1, liabilityData.category_l1),
          category_l2: firstDefined(liabilityData.categoryL2, liabilityData.category_l2),
          category_l3: firstDefined(liabilityData.categoryL3, liabilityData.category_l3),
          initial_amount: firstDefined(liabilityData.initialAmount, liabilityData.initial_amount),
          current_amount: firstDefined(liabilityData.currentAmount, liabilityData.current_amount, liabilityData.initialAmount, liabilityData.initial_amount),
          original_amount: firstDefined(liabilityData.originalAmount, liabilityData.original_amount),
          type: liabilityData.type,
          monthly_payment: firstDefined(liabilityData.monthlyPayment, liabilityData.monthly_payment, 0),
          annual_rate: firstDefined(liabilityData.annualRate, liabilityData.annual_rate),
          months: firstDefined(liabilityData.months, liabilityData.totalMonths),
          total_interest: firstDefined(liabilityData.totalInterest, liabilityData.total_interest, 0),
          total_amount: firstDefined(liabilityData.totalAmount, liabilityData.total_amount, 0),
          loan_schedule: firstDefined(liabilityData.loanSchedule, liabilityData.loan_schedule),
          related_asset_id: firstDefined(liabilityData.relatedAssetId, liabilityData.related_asset_id),
          // 负债状态枚举为 normal/paid_off/overdue/prepaid，本地旧数据里的 active 一律归一
          status: liabilityData.status === 'active' ? 'normal' : (liabilityData.status || 'normal'),
          create_date: firstDefined(liabilityData.createDate, liabilityData.create_date),
          start_date: firstDefined(liabilityData.startDate, liabilityData.start_date, liabilityData.borrowDate),
          notes: liabilityData.notes,
          is_sample: liabilityData.isSample || false
        }

        const principal = Number(row.initial_amount) || Number(row.original_amount) || Number(row.current_amount) || 0
        if (principal > 0) {
          row.initial_amount = row.initial_amount || principal
          row.current_amount = row.current_amount || principal
        }

        if (Number(row.months) > 0 && principal > 0) {
          const schedule = LoanCalculator.buildSchedule(
            row,
            row.type === 'equal_principal' ? 'equal_principal' : 'equal_payment'
          )

          row.monthly_payment = row.monthly_payment || schedule.monthlyPayment
          row.total_interest = schedule.totalInterest
          row.total_amount = schedule.totalAmount
          row.loan_schedule = schedule
        }

        return row
      })

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

