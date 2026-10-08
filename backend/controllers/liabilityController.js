/**
 * 负债控制器
 */

const { Liability } = require('../models')
const LoanCalculator = require('../utils/loanCalculator')

const LIABILITY_FIELDS = [
  'name', 'category_l1', 'category_l2', 'category_l3',
  'initial_amount', 'current_amount', 'original_amount',
  'type', 'monthly_payment', 'annual_rate', 'months',
  'total_interest', 'total_amount', 'loan_schedule',
  'related_asset_id', 'status', 'create_date', 'start_date',
  'notes', 'is_sample'
]

/**
 * 字段是否显式给出：0 是有效值，不能用 || 判断
 */
function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj || {}, key)
}

/**
 * 只保留模型中存在的字段，空字符串按未填写处理
 */
function pickLiabilityFields(data) {
  const filtered = {}
  LIABILITY_FIELDS.forEach(field => {
    if (hasOwn(data, field)) {
      filtered[field] = data[field] === '' ? null : data[field]
    }
  })
  return filtered
}

/**
 * 补齐本金基准并生成还款计划：
 * 页面只填 originalAmount/currentAmount 时 initial_amount 会缺省为 0，摊还无从起步
 */
function applyLoanTerms(data, repaymentMethod) {
  const principal = LoanCalculator.principalOf(data)
  if (principal <= 0) return

  if (!(Number(data.initial_amount) > 0)) data.initial_amount = principal
  // 显式提交 0（已还清的负债）是有效值，只有缺字段才按本金兜底
  if (!hasOwn(data, 'current_amount') || data.current_amount === null) data.current_amount = principal

  if (!LoanCalculator.isAmortizing(data)) return

  const schedule = LoanCalculator.buildSchedule(data, repaymentMethod)

  if (!(Number(data.monthly_payment) > 0)) data.monthly_payment = schedule.monthlyPayment
  data.total_interest = schedule.totalInterest
  data.total_amount = schedule.totalAmount
  data.loan_schedule = schedule
}

/**
 * 按已过还款期数推进剩余本金与状态，有变化才写库
 */
async function syncLiabilityTiming(liability) {
  const plain = liability.get({ plain: true })
  const patch = LoanCalculator.advanceToNow(plain)

  if (Object.keys(patch).length > 0) {
    await liability.update(patch)
  }

  return Object.assign({}, plain, patch)
}

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

    // 剩余本金按已过还款期数推进（贷款余额随时间变化的核心）
    const syncedLiabilities = []
    for (const liability of liabilities) {
      syncedLiabilities.push(await syncLiabilityTiming(liability))
    }

    // 转换为前端格式
    const frontendLiabilities = syncedLiabilities.map(l => mapBackendFields(l))

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

    // 转换为前端格式（同样按时间推进剩余本金）
    const frontendLiability = mapBackendFields(await syncLiabilityTiming(liability))

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
    const repaymentMethod = ['equal_payment', 'equal_principal'].includes(req.body.paymentType)
      ? req.body.paymentType
      : null
    
    // 字段名映射
    liabilityData = mapFrontendFields(liabilityData)
    
    // 只保留数据库模型中存在的字段
    const filteredData = pickLiabilityFields(liabilityData)

    // 补齐本金并生成还款计划（分期负债按年利率与期数摊还）
    applyLoanTerms(filteredData, repaymentMethod)

    const liability = await Liability.create({
      ...filteredData,
      user_id: userId
    })

    // 转换为前端格式（起息日在过去的负债，创建响应即反映当前剩余本金）
    const frontendLiability = mapBackendFields(await syncLiabilityTiming(liability))

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
    const repaymentMethod = ['equal_payment', 'equal_principal'].includes(req.body.paymentType)
      ? req.body.paymentType
      : null
    
    // 字段名映射
    updateData = mapFrontendFields(updateData)
    
    // 只保留数据库模型中存在的字段
    updateData = pickLiabilityFields(updateData)

    const liability = await Liability.findOne({
      where: { id: liabilityId, user_id: userId }
    })

    if (!liability) {
      return res.status(404).json({
        success: false,
        message: '负债不存在'
      })
    }

    // 期数/利率/本金/还款方式任一变动都要重建还款计划，并据此刷新总利息与总还款额。
    // 注意：get({plain:true}) 返回的是实例内部 dataValues 的引用，
    // 必须用新的 {} 作合并目标，否则会把新值直接塞进实例而不标记 changed，
    // 导致后续 update() 认为字段没变、从 SET 子句中漏掉，造成静默写入丢失。
    const merged = Object.assign({}, liability.get({ plain: true }), updateData)
    if (LoanCalculator.isAmortizing(merged)) {
      const schedule = LoanCalculator.scheduleOf(merged, repaymentMethod || undefined)

      updateData.loan_schedule = schedule
      updateData.total_interest = schedule.totalInterest
      updateData.total_amount = schedule.totalAmount

      if (!(Number(updateData.monthly_payment) > 0)) {
        updateData.monthly_payment = schedule.monthlyPayment
      }
      if (!(Number(updateData.initial_amount) > 0)) {
        updateData.initial_amount = schedule.principal
      }
    }

    await liability.update(updateData)

    // 转换为前端格式
    const frontendLiability = mapBackendFields(await syncLiabilityTiming(liability))

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

    const processedLiabilities = liabilities.map(item => {
      const liabilityData = pickLiabilityFields(mapFrontendFields(item))
      applyLoanTerms(liabilityData, ['equal_payment', 'equal_principal'].includes(item.paymentType) ? item.paymentType : null)
      return { ...liabilityData, user_id: userId }
    })

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

