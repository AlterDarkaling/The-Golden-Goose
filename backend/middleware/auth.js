/**
 * JWT认证中间件
 */

const jwt = require('jsonwebtoken')
const { User } = require('../models')

/**
 * 验证JWT Token
 */
exports.authenticateToken = async (req, res, next) => {
  try {
    // 生产环境或有Token时：正常验证
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      })
    }

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // 查找用户
    const user = await User.findByPk(decoded.userId)
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      })
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: '账户已被禁用'
      })
    }

    // 将用户信息附加到请求对象
    req.user = user
    req.userId = user.id

    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '令牌已过期，请重新登录'
      })
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '无效的令牌'
      })
    }

    console.error('认证错误:', error)
    return res.status(500).json({
      success: false,
      message: '认证失败'
    })
  }
}

/**
 * 可选认证（有token则验证，无token也允许通过）
 */
exports.optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    req.user = null
    req.userId = null
    return next()
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findByPk(decoded.userId)
    
    if (user && user.status === 'active') {
      req.user = user
      req.userId = user.id
    } else {
      req.user = null
      req.userId = null
    }
  } catch (error) {
    req.user = null
    req.userId = null
  }

  next()
}

