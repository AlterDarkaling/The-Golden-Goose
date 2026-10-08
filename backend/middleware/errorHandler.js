/**
 * 全局错误处理中间件
 */

module.exports = (err, req, res, next) => {
  console.error('错误详情:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  })

  // Sequelize错误
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    })
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      success: false,
      message: '数据已存在',
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    })
  }

  if (err.name === 'SequelizeDatabaseError') {
    return res.status(500).json({
      success: false,
      message: '数据库操作失败',
      ...(process.env.NODE_ENV === 'development' && { 
        error: err.message,
        sql: err.sql 
      })
    })
  }

  // JWT错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: '无效的认证令牌'
    })
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: '认证令牌已过期'
    })
  }

  // 默认错误
  const statusCode = err.statusCode || 500
  const message = err.message || '服务器内部错误'

  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err 
    })
  })
}

