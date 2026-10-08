/**
 * 大鹅爱记账后端服务入口
 */

require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')

// 导入路由
const authRoutes = require('./routes/auth')
const assetRoutes = require('./routes/assets')
const liabilityRoutes = require('./routes/liabilities')
const userRoutes = require('./routes/users')
const savingGoalRoutes = require('./routes/savingGoals')
const migrationRoutes = require('./routes/migration')

// 导入中间件
const errorHandler = require('./middleware/errorHandler')

// 导入数据库
const db = require('./config/database')

const app = express()
const PORT = process.env.PORT || 3000

// ==================== 中间件配置 ====================

// 安全头部
app.use(helmet())

// CORS配置
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*']
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}))

// 请求体解析
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 请求日志
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
} else {
  app.use(morgan('combined'))
}

// 限流配置
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制100个请求
  message: '请求过于频繁，请稍后再试',
  // 本地开发/演示环境不限流：每次进页面都要拉取列表，同一台机器共用一个计数，
  // 答辩演示过程中很容易触发 429 导致 App 直接不可用
  skip: () => process.env.NODE_ENV === 'development'
})
app.use('/api/', limiter)

// ==================== 路由配置 ====================

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// API路由
app.use('/api/auth', authRoutes)
app.use('/api/assets', assetRoutes)
app.use('/api/liabilities', liabilityRoutes)
app.use('/api/users', userRoutes)
app.use('/api/saving-goals', savingGoalRoutes)
app.use('/api/migration', migrationRoutes)

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  })
})

// 错误处理
app.use(errorHandler)

// ==================== 数据库连接与服务启动 ====================

async function startServer() {
  try {
    // 测试数据库连接
    await db.authenticate()
    console.log('✅ 数据库连接成功')

    // 同步数据库模型：仅创建缺失的表。
    // 不要用 { alter: true }：它每次启动都会给 unique 列重新追加唯一索引，
    // MySQL 单表索引上限 64，累积若干次启动后服务会直接起不来（ER_TOO_MANY_KEYS）
    if (process.env.NODE_ENV === 'development') {
      await db.sync()
      console.log('✅ 数据库模型同步完成')
    }

    // 启动服务器
    app.listen(PORT, () => {
      console.log(`🚀 服务器运行在 http://localhost:${PORT}`)
      console.log(`📝 环境: ${process.env.NODE_ENV}`)
    })
  } catch (error) {
    console.error('❌ 服务器启动失败:', error)
    process.exit(1)
  }
}

// 优雅退出
process.on('SIGTERM', async () => {
  console.log('⏹️  收到终止信号，正在关闭服务器...')
  await db.close()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('⏹️  收到中断信号，正在关闭服务器...')
  await db.close()
  process.exit(0)
})

startServer()

module.exports = app

