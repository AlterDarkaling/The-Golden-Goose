/**
 * JWT工具函数
 */

const jwt = require('jsonwebtoken')

/**
 * 生成JWT Token
 */
exports.generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

/**
 * 验证JWT Token
 */
exports.verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET)
}

/**
 * 解码JWT Token（不验证）
 */
exports.decodeToken = (token) => {
  return jwt.decode(token)
}

