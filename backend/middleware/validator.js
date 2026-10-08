/**
 * 数据验证中间件
 */

const { validationResult } = require('express-validator')

/**
 * 验证结果检查
 */
exports.validate = (req, res, next) => {
  const errors = validationResult(req)
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      errors: errors.array()
    })
  }
  
  next()
}

