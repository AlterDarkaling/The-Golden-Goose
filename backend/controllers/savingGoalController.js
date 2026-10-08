/**
 * 梦想储蓄罐控制器
 */

const { SavingGoal } = require('../models')

/**
 * 完成状态由金额推出：存满即 completed，之后金额回落则退回 active。
 * 用户主动取消（cancelled）的目标不擅自改回。
 */
function resolveGoalStatus(goal) {
  const target = Number(goal.target_amount) || 0
  const current = Number(goal.current_amount) || 0

  if (goal.status === 'cancelled') return null
  if (target > 0 && current >= target) return goal.status === 'completed' ? null : 'completed'
  return goal.status === 'completed' ? 'active' : null
}

async function syncGoalStatus(goal) {
  const status = resolveGoalStatus(goal)
  if (status) await goal.update({ status })
  return goal
}

/**
 * 字段名映射：前端驼峰命名 → 后端下划线命名
 */
function mapFrontendFields(data) {
  const fieldMap = {
    'targetAmount': 'target_amount',
    'currentAmount': 'current_amount',
    'createTime': 'create_time',
    'isSample': 'is_sample'
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
    'target_amount': 'targetAmount',
    'current_amount': 'currentAmount',
    'create_time': 'createTime',
    'is_sample': 'isSample',
    'user_id': 'userId',
    'created_at': 'createdAt',
    'updated_at': 'updatedAt'
  }
  
  // 需要转换为数字的字段
  const numberFields = ['targetAmount', 'currentAmount']
  
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
 * 获取储蓄目标列表
 */
exports.getSavingGoals = async (req, res, next) => {
  try {
    const userId = req.userId

    const goals = await SavingGoal.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']]
    })

    // 存满的目标在读取时刷新状态，与折旧/贷款余额同为"读时推进"
    const frontendGoals = []
    for (const goal of goals) {
      frontendGoals.push(mapBackendFields((await syncGoalStatus(goal)).toJSON()))
    }

    res.json({
      success: true,
      data: frontendGoals,
      total: frontendGoals.length
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 获取单个储蓄目标详情
 */
exports.getSavingGoalById = async (req, res, next) => {
  try {
    const userId = req.userId
    const goalId = req.params.id

    const goal = await SavingGoal.findOne({
      where: { id: goalId, user_id: userId }
    })

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: '储蓄目标不存在'
      })
    }

    // 转换为前端格式
    const frontendGoal = mapBackendFields((await syncGoalStatus(goal)).toJSON())

    res.json({
      success: true,
      data: frontendGoal
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 创建储蓄目标
 */
exports.createSavingGoal = async (req, res, next) => {
  try {
    const userId = req.userId
    let goalData = req.body

    // 字段名映射
    goalData = mapFrontendFields(goalData)
    
    // 只保留数据库模型中存在的字段
    const allowedFields = [
      'title', 'category', 'description',
      'target_amount', 'current_amount',
      'deadline', 'create_time', 'status', 'is_sample'
    ]
    
    const filteredData = {}
    allowedFields.forEach(field => {
      if (goalData.hasOwnProperty(field)) {
        // 将空字符串转为 null
        filteredData[field] = goalData[field] === '' ? null : goalData[field]
      }
    })

    const goal = await SavingGoal.create({
      ...filteredData,
      user_id: userId
    })

    // 转换为前端格式（创建时若已存满也会立刻标记完成）
    const frontendGoal = mapBackendFields((await syncGoalStatus(goal)).toJSON())

    res.status(201).json({
      success: true,
      message: '储蓄目标创建成功',
      data: frontendGoal
    })
  } catch (error) {
    console.error('创建储蓄目标失败:', error)
    next(error)
  }
}

/**
 * 更新储蓄目标
 */
exports.updateSavingGoal = async (req, res, next) => {
  try {
    const userId = req.userId
    const goalId = req.params.id
    let updateData = req.body
    
    // 字段名映射
    updateData = mapFrontendFields(updateData)
    
    // 只保留数据库模型中存在的字段
    const allowedFields = [
      'title', 'category', 'description',
      'target_amount', 'current_amount',
      'deadline', 'status', 'is_sample'
    ]
    
    const filteredData = {}
    allowedFields.forEach(field => {
      if (updateData.hasOwnProperty(field)) {
        // 将空字符串转为 null
        filteredData[field] = updateData[field] === '' ? null : updateData[field]
      }
    })

    const goal = await SavingGoal.findOne({
      where: { id: goalId, user_id: userId }
    })

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: '储蓄目标不存在'
      })
    }

    await goal.update(filteredData)

    // 转换为前端格式
    const frontendGoal = mapBackendFields((await syncGoalStatus(goal)).toJSON())

    res.json({
      success: true,
      message: '储蓄目标更新成功',
      data: frontendGoal
    })
  } catch (error) {
    console.error('更新储蓄目标失败:', error)
    next(error)
  }
}

/**
 * 删除储蓄目标
 */
exports.deleteSavingGoal = async (req, res, next) => {
  try {
    const userId = req.userId
    const goalId = req.params.id

    const goal = await SavingGoal.findOne({
      where: { id: goalId, user_id: userId }
    })

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: '储蓄目标不存在'
      })
    }

    await goal.destroy()

    res.json({
      success: true,
      message: '储蓄目标删除成功'
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 批量删除储蓄目标
 */
exports.batchDeleteSavingGoals = async (req, res, next) => {
  try {
    const userId = req.userId
    const { ids } = req.body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供要删除的目标ID数组'
      })
    }

    const deletedCount = await SavingGoal.destroy({
      where: {
        id: ids,
        user_id: userId
      }
    })

    res.json({
      success: true,
      message: `成功删除${deletedCount}个储蓄目标`,
      deletedCount
    })
  } catch (error) {
    next(error)
  }
}
