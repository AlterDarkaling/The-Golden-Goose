/**
 * 重置储蓄目标表（删除所有数据并重置自增 ID）
 * 警告：仅用于开发测试环境！
 */

require('dotenv').config()
const sequelize = require('../config/database')

async function resetSavingGoals() {
  try {
    console.log('🗑️ 清空储蓄目标表...')
    
    // 删除所有数据
    await sequelize.query('DELETE FROM saving_goals')
    
    // 重置自增 ID
    await sequelize.query('ALTER TABLE saving_goals AUTO_INCREMENT = 1')
    
    console.log('✅ 储蓄目标表已重置，下次创建的 ID 将从 1 开始')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ 重置失败:', error)
    process.exit(1)
  }
}

resetSavingGoals()
