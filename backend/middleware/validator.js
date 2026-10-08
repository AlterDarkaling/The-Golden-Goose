/**
 * 业务字段校验中间件
 *
 * 目的：把非法输入拦在控制器之前返回 400，而不是让它落到 MySQL 变成 500
 * （越界的 DECIMAL、非法枚举、畸形日期都会触发数据库错误）。
 * 同时统一归一化折旧率：编辑页按百分数录入（40 = 40%），落库与计算一律用小数。
 *
 * 分类取值以 utils/accountingCategories.js 为准，这里保留一份后端侧的白名单，
 * 避免任意 category_l1 入库后导致首页与报表两套归集口径出现分叉。
 */

const ASSET_CATEGORY_L1 = ['current_assets', 'financial_assets', 'physical_assets', 'work_income', 'other_assets']
const LIABILITY_CATEGORY_L1 = ['current_liabilities', 'long_term_liabilities', 'other_liabilities']
const ASSET_STATUS = ['active', 'dusty', 'rented', 'damaged', 'processed', 'gifted', 'sold', 'lost']
const LIABILITY_STATUS = ['normal', 'paid_off', 'overdue', 'prepaid']
const SAVING_GOAL_STATUS = ['active', 'completed', 'cancelled']

// DECIMAL(15,2)
const MAX_MONEY = 9999999999999.99
// DECIMAL(5,4)
const MAX_RATE = 0.9999
// DECIMAL(6,2)
const MAX_ANNUAL_RATE = 9999.99

const SPECS = {
  asset: {
    required: ['name', 'categoryL1', 'categoryL2'],
    categoryField: 'categoryL1',
    categories: ASSET_CATEGORY_L1,
    statusValues: ASSET_STATUS,
    moneyFields: ['initialValue', 'currentValue', 'originalValue', 'monthlyIncome',
      'monthlyOperatingCost', 'fixedAllowances'],
    rateFields: ['depreciationRate', 'customDepreciationRate'],
    numberFields: { dailyWorkHours: 99.99, weeklyWorkDays: 99.9, workingMonthsPerYear: 9999 },
    intFields: ['months'],
    dateFields: ['createDate', 'purchaseDate', 'startDate', 'endDate'],
    stringFields: { name: 200, categoryL1: 50, categoryL2: 50, categoryL3: 50, purchaseMethod: 50 }
  },
  liability: {
    required: ['name', 'categoryL1', 'categoryL2'],
    categoryField: 'categoryL1',
    categories: LIABILITY_CATEGORY_L1,
    statusValues: LIABILITY_STATUS,
    moneyFields: ['initialAmount', 'currentAmount', 'originalAmount', 'monthlyPayment',
      'totalInterest', 'totalAmount'],
    numberFields: { annualRate: MAX_ANNUAL_RATE, dailyRate: MAX_ANNUAL_RATE, monthlyOperatingCost: MAX_MONEY },
    intFields: ['months'],
    dateFields: ['createDate', 'startDate'],
    stringFields: { name: 200, categoryL1: 50, categoryL2: 50, categoryL3: 50, type: 50 }
  },
  savingGoal: {
    required: ['title'],
    statusValues: SAVING_GOAL_STATUS,
    moneyFields: ['targetAmount', 'currentAmount'],
    dateFields: ['deadline', 'createTime'],
    stringFields: { title: 200, category: 50 }
  }
}

/**
 * 空值（未填写）与 0 是两回事：0 是合法金额，只有空串/null/undefined 视为未填
 */
function isBlank(value) {
  return value === undefined || value === null || value === '' ||
    (typeof value === 'string' && value.trim() === '')
}

function isDateOnly(value) {
  if (typeof value === 'number') return false
  const text = String(value).slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false
  const [year, month, day] = text.split('-').map(Number)
  const date = new Date(text)
  return date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day
}

function toNumber(value) {
  if (typeof value === 'number') return value
  return Number(String(value).trim())
}

/**
 * 折旧率归一：>=1 视为百分数录入（40 → 0.4）
 */
function normalizeRate(value) {
  const num = toNumber(value)
  if (!Number.isFinite(num)) return value
  return num >= 1 ? num / 100 : num
}

function validatePayload(spec, body, { partial }) {
  const errors = []

  if (!partial) {
    spec.required.forEach(field => {
      if (isBlank(body[field])) errors.push(`${field} 不能为空`)
    })
  } else {
    // PUT 允许只传部分字段，但显式传了必填字段就不能是空值
    spec.required.forEach(field => {
      if (field in body && isBlank(body[field])) errors.push(`${field} 不能为空`)
    })
  }

  if (spec.categoryField && !isBlank(body[spec.categoryField])) {
    const value = body[spec.categoryField]
    if (!spec.categories.includes(value)) {
      errors.push(`${spec.categoryField} 取值非法，应为：${spec.categories.join(' / ')}`)
    }
  }

  if (!isBlank(body.status) && !spec.statusValues.includes(body.status)) {
    errors.push(`status 取值非法，应为：${spec.statusValues.join(' / ')}`)
  }

  Object.entries(spec.stringFields || {}).forEach(([field, maxLength]) => {
    if (isBlank(body[field])) return
    if (typeof body[field] !== 'string' && typeof body[field] !== 'number') {
      errors.push(`${field} 必须是文本`)
    } else if (String(body[field]).length > maxLength) {
      errors.push(`${field} 长度不能超过 ${maxLength} 个字符`)
    }
  })

  ;(spec.dateFields || []).forEach(field => {
    const value = body[field]
    if (isBlank(value)) return
    if (!isDateOnly(value)) {
      errors.push(`${field} 日期格式非法，应为 YYYY-MM-DD`)
    }
  })

  const checkNumber = (field, value, max, { integer = false, min = 0 } = {}) => {
    if (isBlank(value)) return
    const num = toNumber(value)
    if (!Number.isFinite(num)) {
      errors.push(`${field} 必须是数字`)
      return
    }
    if (integer && !Number.isInteger(num)) {
      errors.push(`${field} 必须是整数`)
      return
    }
    if (num < min || num > max) {
      errors.push(`${field} 超出允许范围 ${min}~${max}`)
    }
  }

  ;(spec.moneyFields || []).forEach(field => {
    if (!isBlank(body[field])) checkNumber(field, body[field], MAX_MONEY)
  })

  Object.entries(spec.numberFields || {}).forEach(([field, max]) => {
    if (!isBlank(body[field])) checkNumber(field, body[field], max)
  })

  ;(spec.intFields || []).forEach(field => {
    if (!isBlank(body[field])) checkNumber(field, body[field], 9999, { integer: true })
  })

  // 折旧率先归一再校验，使百分数（40）与小数（0.4）两种写法都能正确落库
  ;(spec.rateFields || []).forEach(field => {
    if (isBlank(body[field])) return
    body[field] = normalizeRate(body[field])
    checkNumber(field, body[field], MAX_RATE)
  })

  return errors
}

/**
 * @param {string} entity asset / liability / savingGoal
 * @param {{partial?: boolean}} options partial=true 用于 PUT，允许只提交部分字段
 */
module.exports = function validateEntity(entity, options = {}) {
  const spec = SPECS[entity]

  if (!spec) throw new Error(`未知的校验对象: ${entity}`)

  return (req, res, next) => {
    const body = req.body || {}

    if (typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ success: false, message: '请求体必须是 JSON 对象' })
    }

    const errors = validatePayload(spec, body, { partial: !!options.partial })

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors[0],
        errors
      })
    }

    next()
  }
}
