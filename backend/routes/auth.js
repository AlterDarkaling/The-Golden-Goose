/**
 * 认证路由
 */

const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const { authenticateToken } = require('../middleware/auth')

// 微信登录
router.post('/wechat/login', authController.wechatLogin)

// 刷新Token（需要认证）
router.post('/refresh-token', authenticateToken, authController.refreshToken)

// 获取当前用户信息（需要认证）
router.get('/me', authenticateToken, authController.getCurrentUser)

module.exports = router

