/**
 * 负债控制器
 */

const { Liability } = require('../models')
const LoanCalculator = require('../utils/loanCalculator')

/**
 * 字段名映射：前端驼峰命名 → 后端下划线命名
 */
function mapFrontendFields(data) {
  const fieldMap = {
    'categoryL1': 'category_l1',
    'categoryL2': 'category_l2',
    'categoryL3': 'category_l3',
    'initialAmount': 'initial_amount',
    'currentAmount': 'current_amount',
    'originalAmount': 'original_amount',
    'monthlyPayment': 'monthly_payment',
    'annualRate': 'annual_rate',
    'totalInterest': 'total_interest',
    'totalAmount': 'total_amount',
    'loanSchedule': 'loan_schedule',
    'relatedAssetId': 'related_asset_id',
    'startDate': 'start_date',
    'createDate': 'create_date',
    'isSample': 'is_sample',
    'debtType': 'type'  // 添加 debtType 到 type 的映射
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
    'initial_amount': 'initialAmount',
    'current_amount': 'currentAmount',
    'original_amount': 'originalAmount',
    'monthly_payment': 'monthlyPayment',
    'annual_rate': 'annualRate',
    'total_interest': 'totalInterest',
    'total_amount': 'totalAmount',
    'loan_schedule': 'loanSchedule',
    'related_asset_id': 'relatedAssetId',
    'start_date': 'startDate',
    'create_date': 'createDate',
    'is_sample': 'isSample',
    'user_id': 'userId',
    'created_at': 'createTime',
    'updated_at': 'updatedAt'
  }
  
  // 需要转换为数字的字段
  const numberFields = [
    'initialAmount', 'currentAmount', 'originalAmount',
    'monthlyPayment', 'annualRate', 'totalInterest', 'totalAmount'
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
 * 获取负债列表
 */
exports.getLiabilities = async (req, res, next) => {
  try {
    const userId = req.userId
    const { category_l1, category_l2, status, is_sample } = req.query

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

    const liabilities = await Liability.findAll({
      where,
      order: [['created_at', 'DESC']]
    })

    // 转换为前端格式
    const frontendLiabilities = liabilities.map(l => mapBackendFields(l.toJSON()))

    res.json({
      success: true,
      data: frontendLiabilities,
      total: frontendLiabilities.length
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 获取单个负债详情
 */
exports.getLiabilityById = async (req, res, next) => {
  try {
    const userId = req.userId
    const liabilityId = req.params.id

    const liability = await Liability.findOne({
      where: { id: liabilityId, user_id: userId }
    })

    if (!liability) {
      return res.status(404).json({
        success: false,
        message: '负债不存在'
      })
    }

    // 转换为前端格式
    const frontendLiability = mapBackendFields(liability.toJSON())

    res.json({
      success: true,
      data: frontendLiability
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 创建负债
 */
exports.createLiability = async (req, res, next) => {
  try {
    const userId = req.userId
    let liabilityData = req.body
    
    console.log('📥 收到创建负债请求，原始数据:', JSON.stringify(liabilityData, null, 2))
    
    // 字段名映射
    liabilityData = mapFrontendFields(liabilityData)
    
    console.log('📥 映射后的数据:', JSON.stringify(liabilityData, null, 2))
    
    // 只保留数据库模型中存在的字段
    const allowedFields = [
      'name', 'category_l1', 'category_l2', 'category_l3',
      'initial_amount', 'current_amount', 'original_amount',
      'type', 'monthly_payment', 'annual_rate', 'months',
      'total_interest', 'total_amount', 'loan_schedule',
      'related_asset_id', 'status', 'create_date', 'start_date',
      'notes', 'is_sample'
    ]
    
    const filteredData = {}
    allowedFields.forEach(field => {
      if (liabilityData.hasOwnProperty(field)) {
        // 将空字符串转为 null
        filteredData[field] = liabilityData[field] === '' ? null : liabilityData[field]
      }
    })
    
    console.log('📥 过滤后的数据:', JSON.stringify(filteredData, null, 2))

    // 如果是贷款类型，计算还款计划
    if (filteredData.type === 'loan' && filteredData.annual_rate && filteredData.months) {
      const loanInfo = LoanCalculator.calculateEqualPayment(
        filteredData.initial_amount,
        filteredData.annual_rate,
        filteredData.months
      )
      
      Object.assign(filteredData, {
        monthly_payment: loanInfo.monthlyPayment,
        total_interest: loanInfo.totalInterest,
        total_amount: loanInfo.totalAmount,
        loan_schedule: loanInfo.schedule,
        current_amount: filteredData.initial_amount
      })
    }

    const liability = await Liability.create({
      ...filteredData,
      user_id: userId
    })

    // 转换为前端格式
    const frontendLiability = mapBackendFields(liability.toJSON())

    res.status(201).json({
      success: true,
      message: '负债创建成功',
      data: frontendLiability
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 更新负债
 */
exports.updateLiability = async (req, res, next) => {
  try {
    const userId = req.userId
    const liabilityId = req.params.id
    let updateData = req.body
    
    // 字段名映射
    updateData = mapFrontendFields(updateData)
    
    // 只保留数据库模型中存在的字段
    const allowedFields = [
      'name', 'category_l1', 'category_l2', 'category_l3',
      'initial_amount', 'current_amount', 'original_amount',
      'type', 'monthly_payment', 'annual_rate', 'months',
      'total_interest', 'total_amount', 'loan_schedule',
      'related_asset_id', 'status', 'create_date', 'start_date',
      'notes', 'is_sample'
    ]
    
    const filteredData = {}
    allowedFields.forEach(field => {
      if (updateData.hasOwnProperty(field)) {
        // 将空字符串转为 null
        filteredData[field] = updateData[field] === '' ? null : updateData[field]
      }
    })

    const liability = await Liability.findOne({
      where: { id: liabilityId, user_id: userId }
    })

    if (!liability) {
      return res.status(404).json({
        success: false,
        message: '负债不存在'
      })
    }

    // 如果更新了贷款信息，重新计算
    if (filteredData.type === 'loan' && (filteredData.annual_rate || filteredData.months)) {
      const loanInfo = LoanCalculator.calculateEqualPayment(
        filteredData.initial_amount || liability.initial_amount,
        filteredData.annual_rate || liability.annual_rate,
        filteredData.months || liability.months
      )
      
      Object.assign(filteredData, {
        monthly_payment: loanInfo.monthlyPayment,
        total_interest: loanInfo.totalInterest,
        total_amount: loanInfo.totalAmount,
        loan_schedule: loanInfo.schedule
      })
    }

    await liability.update(filteredData)

    // 转换为前端格式
    const frontendLiability = mapBackendFields(liability.toJSON())

    res.json({
      success: true,
      message: '负债更新成功',
      data: frontendLiability
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 删除负债
 */
exports.deleteLiability = async (req, res, next) => {
  try {
    const userId = req.userId
    const liabilityId = req.params.id

    const liability = await Liability.findOne({
      where: { id: liabilityId, user_id: userId }
    })

    if (!liability) {
      return res.status(404).json({
        success: false,
        message: '负债不存在'
      })
    }

    await liability.destroy()

    res.json({
      success: true,
      message: '负债删除成功'
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 批量创建负债（用于数据迁移）
 */
exports.batchCreateLiabilities = async (req, res, next) => {
  try {
    const userId = req.userId
    const { liabilities } = req.body

    if (!Array.isArray(liabilities)) {
      return res.status(400).json({
        success: false,
        message: '数据格式错误'
      })
    }

    const processedLiabilities = liabilities.map(liabilityData => ({
      ...liabilityData,
      user_id: userId
    }))

    const createdLiabilities = await Liability.bulkCreate(processedLiabilities)

    res.json({
      success: true,
      message: `成功创建${createdLiabilities.length}个负债`,
      data: createdLiabilities
    })
  } catch (error) {
    next(error)
  }
}

