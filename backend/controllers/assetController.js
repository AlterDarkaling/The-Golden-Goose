/**
 * 资产控制器
 */

const { Asset } = require('../models')
const DepreciationEngine = require('../utils/depreciation')
const { Op } = require('sequelize')

/**
 * 字段名映射：前端驼峰命名 → 后端下划线命名
 */
function mapFrontendFields(data) {
  const fieldMap = {
    'categoryL1': 'category_l1',
    'categoryL2': 'category_l2',
    'categoryL3': 'category_l3',
    'initialValue': 'initial_value',
    'currentValue': 'current_value',
    'originalValue': 'original_value',
    'isDepreciable': 'is_depreciable',
    'depreciationRate': 'depreciation_rate',
    'customDepreciationRate': 'custom_depreciation_rate',
    'totalDepreciation': 'total_depreciation',
    'monthlyDepreciation': 'monthly_depreciation',
    'depreciationRatio': 'depreciation_ratio',
    'lastDepreciationUpdate': 'last_depreciation_update',
    'monthlyIncome': 'monthly_income',
    'monthlyOperatingCost': 'monthly_operating_cost',
    'salaryStructure': 'salary_structure',
    'dailyWorkHours': 'daily_work_hours',
    'weeklyWorkDays': 'weekly_work_days',
    'workingMonthsPerYear': 'working_months_per_year',
    'fixedAllowances': 'fixed_allowances',
    'startDate': 'start_date',
    'endDate': 'end_date',
    'createDate': 'create_date',
    'purchaseDate': 'purchase_date',
    'purchaseMethod': 'purchase_method',
    'relatedLoanId': 'related_loan_id',
    'isSample': 'is_sample',
    'initialAmount': 'initial_amount',
    'currentAmount': 'current_amount',
    'originalAmount': 'original_amount',
    'monthlyPayment': 'monthly_payment',
    'annualRate': 'annual_rate',
    'totalInterest': 'total_interest',
    'totalAmount': 'total_amount',
    'loanSchedule': 'loan_schedule',
    'relatedAssetId': 'related_asset_id'
  }
  
  const mapped = {}
  for (const [key, value] of Object.entries(data)) {
    const mappedKey = fieldMap[key] || key
    mapped[mappedKey] = value
  }
  
  return mapped
}

/**
 * 反向映射：后端下划线命名 → 前端驼峰命名
 */
function mapBackendFields(data) {
  const fieldMap = {
    'category_l1': 'categoryL1',
    'category_l2': 'categoryL2',
    'category_l3': 'categoryL3',
    'initial_value': 'initialValue',
    'current_value': 'currentValue',
    'original_value': 'originalValue',
    'is_depreciable': 'isDepreciable',
    'depreciation_rate': 'depreciationRate',
    'custom_depreciation_rate': 'customDepreciationRate',
    'total_depreciation': 'totalDepreciation',
    'monthly_depreciation': 'monthlyDepreciation',
    'depreciation_ratio': 'depreciationRatio',
    'last_depreciation_update': 'lastDepreciationUpdate',
    'monthly_income': 'monthlyIncome',
    'monthly_operating_cost': 'monthlyOperatingCost',
    'salary_structure': 'salaryStructure',
    'daily_work_hours': 'dailyWorkHours',
    'weekly_work_days': 'weeklyWorkDays',
    'working_months_per_year': 'workingMonthsPerYear',
    'fixed_allowances': 'fixedAllowances',
    'start_date': 'startDate',
    'end_date': 'endDate',
    'create_date': 'createDate',
    'purchase_date': 'purchaseDate',
    'purchase_method': 'purchaseMethod',
    'related_loan_id': 'relatedLoanId',
    'is_sample': 'isSample',
    'user_id': 'userId',
    'created_at': 'createTime',
    'updated_at': 'updatedAt'
  }
  
  // 需要转换为数字的字段
  const numberFields = [
    'initialValue', 'currentValue', 'originalValue',
    'depreciationRate', 'customDepreciationRate', 'totalDepreciation',
    'monthlyDepreciation', 'depreciationRatio', 'monthlyIncome',
    'monthlyOperatingCost', 'dailyWorkHours', 'weeklyWorkDays',
    'workingMonthsPerYear', 'fixedAllowances'
  ]
  
  const mapped = {}
  for (const [key, value] of Object.entries(data)) {
    const mappedKey = fieldMap[key] || key
    
    // 转换数字字段
    if (numberFields.includes(mappedKey) && value !== null && value !== undefined) {
      mapped[mappedKey] = parseFloat(value)
    } else {
      mapped[mappedKey] = value
    }
  }
  
  return mapped
}

/**
 * 获取资产列表
 */
exports.getAssets = async (req, res, next) => {
  try {
    const userId = req.userId
    const { category_l1, category_l2, status, is_sample } = req.query

    // 构建查询条件
    const where = { user_id: userId }
    
    if (category_l1) {
      where.category_l1 = category_l1
    }
    
    if (category_l2) {
      where.category_l2 = category_l2
    }
    
    if (status) {
      where.status = status
    }
    
    if (is_sample !== undefined) {
      where.is_sample = is_sample === 'true'
    }

    let assets = await Asset.findAll({
      where,
      order: [['created_at', 'DESC']]
    })

    // 自动更新折旧
    const assetsData = assets.map(asset => asset.toJSON())
    const updatedAssets = DepreciationEngine.batchUpdateDepreciation(assetsData)

    // 批量更新数据库（只更新有折旧的资产）
    for (let i = 0; i < updatedAssets.length; i++) {
      if (updatedAssets[i].current_value !== assetsData[i].current_value) {
        await Asset.update(
          {
            current_value: updatedAssets[i].current_value,
            total_depreciation: updatedAssets[i].total_depreciation,
            monthly_depreciation: updatedAssets[i].monthly_depreciation,
            depreciation_ratio: updatedAssets[i].depreciation_ratio,
            last_depreciation_update: updatedAssets[i].last_depreciation_update
          },
          { where: { id: updatedAssets[i].id } }
        )
      }
    }

    // 转换为前端格式（驼峰命名）
    const frontendAssets = updatedAssets.map(asset => mapBackendFields(asset))

    res.json({
      success: true,
      data: frontendAssets,
      total: frontendAssets.length
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 获取单个资产详情
 */
exports.getAssetById = async (req, res, next) => {
  try {
    const userId = req.userId
    const assetId = req.params.id

    let asset = await Asset.findOne({
      where: { id: assetId, user_id: userId }
    })

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: '资产不存在'
      })
    }

    // 更新折旧
    const assetData = asset.toJSON()
    const [updatedAsset] = DepreciationEngine.batchUpdateDepreciation([assetData])

    if (updatedAsset.current_value !== assetData.current_value) {
      await asset.update({
        current_value: updatedAsset.current_value,
        total_depreciation: updatedAsset.total_depreciation,
        monthly_depreciation: updatedAsset.monthly_depreciation,
        depreciation_ratio: updatedAsset.depreciation_ratio,
        last_depreciation_update: new Date()
      })
    }

    // 转换为前端格式
    const frontendAsset = mapBackendFields(updatedAsset)

    res.json({
      success: true,
      data: frontendAsset
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 创建资产
 */
exports.createAsset = async (req, res, next) => {
  try {
    const userId = req.userId
    let assetData = req.body
    
    console.log('📥 收到创建资产请求，原始数据:', JSON.stringify(assetData, null, 2))
    
    // 字段名映射：支持前端的驼峰命名
    assetData = mapFrontendFields(assetData)
    
    // 只保留数据库模型中存在的字段
    const allowedFields = [
      'name', 'category_l1', 'category_l2', 'category_l3',
      'initial_value', 'current_value', 'original_value',
      'is_depreciable', 'depreciation_rate', 'custom_depreciation_rate',
      'total_depreciation', 'monthly_depreciation', 'depreciation_ratio',
      'last_depreciation_update', 'monthly_income', 'monthly_operating_cost',
      'salary_structure', 'daily_work_hours', 'weekly_work_days',
      'working_months_per_year', 'fixed_allowances', 'start_date', 'end_date',
      'status', 'create_date', 'purchase_date', 'notes',
      'purchase_method', 'related_loan_id', 'is_sample'
    ]
    
    const filteredData = {}
    allowedFields.forEach(field => {
      if (assetData.hasOwnProperty(field)) {
        // 将空字符串转为 null
        filteredData[field] = assetData[field] === '' ? null : assetData[field]
      }
    })
    
    assetData = filteredData
    
    console.log('📥 映射后的数据:', JSON.stringify(assetData, null, 2))

    // 处理消费性资产的折旧计算
    // 判断是否需要折旧：consumer_asset 或 physical_assets 下的 consumer_assets
    const needsDepreciation = 
      assetData.category_l1 === 'consumer_asset' ||
      (assetData.category_l1 === 'physical_assets' && assetData.category_l2 === 'consumer_assets') ||
      assetData.category_l2 === 'mobile_phone' ||
      assetData.category_l2 === 'computer_digital' ||
      assetData.category_l2 === 'home_appliances'
    
    if (needsDepreciation) {
      const depreciationData = DepreciationEngine.calculateCurrentValue(
        assetData.initial_value,
        assetData.create_date || new Date().toISOString().split('T')[0],
        assetData.custom_depreciation_rate,
        assetData.category_l2
      )
      
      Object.assign(assetData, {
        current_value: depreciationData.currentValue,
        total_depreciation: depreciationData.totalDepreciation,
        monthly_depreciation: depreciationData.monthlyDepreciation,
        depreciation_rate: depreciationData.depreciationRate,
        depreciation_ratio: depreciationData.depreciationRatio,
        is_depreciable: true,
        last_depreciation_update: new Date()
      })
    } else {
      assetData.current_value = assetData.initial_value
    }

    const asset = await Asset.create({
      ...assetData,
      user_id: userId
    })

    // 转换为前端格式
    const frontendAsset = mapBackendFields(asset.toJSON())

    res.status(201).json({
      success: true,
      message: '资产创建成功',
      data: frontendAsset
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 更新资产
 */
exports.updateAsset = async (req, res, next) => {
  try {
    const userId = req.userId
    const assetId = req.params.id
    let updateData = req.body
    
    // 字段名映射
    updateData = mapFrontendFields(updateData)
    
    // 只保留数据库模型中存在的字段
    const allowedFields = [
      'name', 'category_l1', 'category_l2', 'category_l3',
      'initial_value', 'current_value', 'original_value',
      'is_depreciable', 'depreciation_rate', 'custom_depreciation_rate',
      'total_depreciation', 'monthly_depreciation', 'depreciation_ratio',
      'last_depreciation_update', 'monthly_income', 'monthly_operating_cost',
      'salary_structure', 'daily_work_hours', 'weekly_work_days',
      'working_months_per_year', 'fixed_allowances', 'start_date', 'end_date',
      'status', 'create_date', 'purchase_date', 'notes',
      'purchase_method', 'related_loan_id', 'is_sample'
    ]
    
    const filteredData = {}
    allowedFields.forEach(field => {
      if (updateData.hasOwnProperty(field)) {
        // 将空字符串转为 null
        filteredData[field] = updateData[field] === '' ? null : updateData[field]
      }
    })
    
    updateData = filteredData

    const asset = await Asset.findOne({
      where: { id: assetId, user_id: userId }
    })

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: '资产不存在'
      })
    }

    // 如果是消费性资产，重新计算折旧
    const categoryL1 = updateData.category_l1 || asset.category_l1
    const categoryL2 = updateData.category_l2 || asset.category_l2
    
    const needsDepreciation = 
      categoryL1 === 'consumer_asset' ||
      (categoryL1 === 'physical_assets' && categoryL2 === 'consumer_assets') ||
      categoryL2 === 'mobile_phone' ||
      categoryL2 === 'computer_digital' ||
      categoryL2 === 'home_appliances'
    
    if (needsDepreciation) {
      const depreciationData = DepreciationEngine.calculateCurrentValue(
        updateData.initial_value || asset.initial_value,
        updateData.create_date || asset.create_date,
        updateData.custom_depreciation_rate || asset.custom_depreciation_rate,
        categoryL2
      )
      
      Object.assign(updateData, {
        current_value: depreciationData.currentValue,
        total_depreciation: depreciationData.totalDepreciation,
        monthly_depreciation: depreciationData.monthlyDepreciation,
        depreciation_rate: depreciationData.depreciationRate,
        depreciation_ratio: depreciationData.depreciationRatio,
        is_depreciable: true,
        last_depreciation_update: new Date()
      })
    }

    await asset.update(updateData)

    // 转换为前端格式
    const frontendAsset = mapBackendFields(asset.toJSON())

    res.json({
      success: true,
      message: '资产更新成功',
      data: frontendAsset
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 删除资产
 */
exports.deleteAsset = async (req, res, next) => {
  try {
    const userId = req.userId
    const assetId = req.params.id

    const asset = await Asset.findOne({
      where: { id: assetId, user_id: userId }
    })

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: '资产不存在'
      })
    }

    await asset.destroy()

    res.json({
      success: true,
      message: '资产删除成功'
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 批量创建资产（用于数据迁移）
 */
exports.batchCreateAssets = async (req, res, next) => {
  try {
    const userId = req.userId
    const { assets } = req.body

    if (!Array.isArray(assets)) {
      return res.status(400).json({
        success: false,
        message: '数据格式错误'
      })
    }

    // 处理每个资产的折旧
    const processedAssets = assets.map(assetData => {
      if (assetData.category_l1 === 'consumer_asset') {
        const depreciationData = DepreciationEngine.calculateCurrentValue(
          assetData.initial_value,
          assetData.create_date || new Date().toISOString().split('T')[0],
          assetData.custom_depreciation_rate,
          assetData.category_l2
        )
        
        return {
          ...assetData,
          user_id: userId,
          current_value: depreciationData.currentValue,
          total_depreciation: depreciationData.totalDepreciation,
          monthly_depreciation: depreciationData.monthlyDepreciation,
          depreciation_rate: depreciationData.depreciationRate,
          depreciation_ratio: depreciationData.depreciationRatio,
          is_depreciable: true,
          last_depreciation_update: new Date()
        }
      }
      
      return {
        ...assetData,
        user_id: userId,
        current_value: assetData.current_value || assetData.initial_value
      }
    })

    const createdAssets = await Asset.bulkCreate(processedAssets)

    res.json({
      success: true,
      message: `成功创建${createdAssets.length}个资产`,
      data: createdAssets
    })
  } catch (error) {
    next(error)
  }
}

