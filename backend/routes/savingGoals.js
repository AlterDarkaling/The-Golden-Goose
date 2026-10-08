/**
 * 梦想储蓄罐路由
 */

const express = require('express')
const router = express.Router()
const savingGoalController = require('../controllers/savingGoalController')
const { authenticateToken } = require('../middleware/auth')

// 所有路由都需要认证
router.use(authenticateToken)

// 获取储蓄目标列表
router.get('/', savingGoalController.getSavingGoals)

// 获取单个储蓄目标
router.get('/:id', savingGoalController.getSavingGoalById)

// 创建储蓄目标
router.post('/', savingGoalController.createSavingGoal)

// 更新储蓄目标
router.put('/:id', savingGoalController.updateSavingGoal)

// 删除储蓄目标
router.delete('/:id', savingGoalController.deleteSavingGoal)

// 批量删除储蓄目标
router.post('/batch-delete', savingGoalController.batchDeleteSavingGoals)

module.exports = router
