/**
 * 认证路由
 */

const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const { authenticateToken } = require('../middleware/auth')

// 微信登录
router.post('/wechat/login', authController.wechatLogin)

// 演示身份登录（仅开发环境，用于多用户数据隔离演示）
router.post('/dev-login', authController.devLogin)

// 刷新Token（需要认证）
router.post('/refresh-token', authenticateToken, authController.refreshToken)

// 获取当前用户信息（需要认证）
router.get('/me', authenticateToken, authController.getCurrentUser)

module.exports = router

