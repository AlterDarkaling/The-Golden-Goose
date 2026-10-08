/**
 * 数据库配置
 */

const { Sequelize } = require('sequelize')

const sequelize = new Sequelize(
  process.env.DB_NAME || 'golden_goose',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    
    // 连接池配置
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    
    // 日志配置
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    
    // 时区配置
    timezone: '+08:00',
    
    // 字符集
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      timestamps: true, // 自动添加 createdAt 和 updatedAt
      underscored: true // 使用下划线命名
    }
  }
)

module.exports = sequelize

