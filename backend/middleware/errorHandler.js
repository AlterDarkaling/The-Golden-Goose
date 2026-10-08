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
    // SQL 语句与库表结构只写进服务端日志，不返回客户端
    return res.status(500).json({
      success: false,
      message: '数据库操作失败'
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

  // 默认错误：stack 与原始 error 对象已记入上面的服务端日志，响应体只保留可读信息
  const statusCode = err.statusCode || 500
  const message = err.message || '服务器内部错误'

  res.status(statusCode).json({
    success: false,
    message: message
  })
}

