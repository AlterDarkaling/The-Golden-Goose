/**
 * 清空所有数据
 */

require('dotenv').config()
const db = require('../config/database')
const { User, Asset, Liability } = require('../models')

async function clearAllData() {
  try {
    console.log('开始清空数据...')
    
    // 连接数据库
    await db.authenticate()
    console.log('✅ 数据库连接成功')
    
    // 禁用外键检查
    await db.query('SET FOREIGN_KEY_CHECKS = 0')
    console.log('🔓 已禁用外键检查')
    
    // 删除所有负债
    await db.query('TRUNCATE TABLE liabilities')
    console.log(`✅ 已清空负债表`)
    
    // 删除所有资产
    await db.query('TRUNCATE TABLE assets')
    console.log(`✅ 已清空资产表`)
    
    // 删除所有用户
    await db.query('TRUNCATE TABLE users')
    console.log(`✅ 已清空用户表`)
    
    // 启用外键检查
    await db.query('SET FOREIGN_KEY_CHECKS = 1')
    console.log('🔒 已启用外键检查')
    
    console.log('🎉 所有数据清空完成！')
    
    await db.close()
    process.exit(0)
  } catch (error) {
    console.error('❌ 清空数据失败:', error)
    process.exit(1)
  }
}

clearAllData()
