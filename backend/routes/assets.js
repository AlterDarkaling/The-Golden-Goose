/**
 * 资产路由
 */

const express = require('express')
const router = express.Router()
const assetController = require('../controllers/assetController')
const { authenticateToken } = require('../middleware/auth')
const validateEntity = require('../middleware/validator')

// 所有资产路由都需要认证
router.use(authenticateToken)

// 获取资产列表
router.get('/', assetController.getAssets)

// 获取单个资产详情
router.get('/:id', assetController.getAssetById)

// 创建资产
router.post('/', validateEntity('asset'), assetController.createAsset)

// 批量创建资产（数据迁移用）
router.post('/batch', assetController.batchCreateAssets)

// 更新资产
router.put('/:id', validateEntity('asset', { partial: true }), assetController.updateAsset)

// 删除资产
router.delete('/:id', assetController.deleteAsset)

module.exports = router

