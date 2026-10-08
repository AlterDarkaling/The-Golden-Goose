/**
 * 负债路由
 */

const express = require('express')
const router = express.Router()
const liabilityController = require('../controllers/liabilityController')
const { authenticateToken } = require('../middleware/auth')
const validateEntity = require('../middleware/validator')

// 所有负债路由都需要认证
router.use(authenticateToken)

// 获取负债列表
router.get('/', liabilityController.getLiabilities)

// 获取单个负债详情
router.get('/:id', liabilityController.getLiabilityById)

// 创建负债
router.post('/', validateEntity('liability'), liabilityController.createLiability)

// 批量创建负债（数据迁移用）
router.post('/batch', liabilityController.batchCreateLiabilities)

// 更新负债
router.put('/:id', validateEntity('liability', { partial: true }), liabilityController.updateLiability)

// 删除负债
router.delete('/:id', liabilityController.deleteLiability)

module.exports = router

