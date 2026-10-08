/**
 * 模型关系定义
 */

const User = require('./User')
const Asset = require('./Asset')
const Liability = require('./Liability')
const SavingGoal = require('./SavingGoal')

// 用户与资产的关系
User.hasMany(Asset, { 
  foreignKey: 'user_id', 
  as: 'assets',
  onDelete: 'CASCADE'
})
Asset.belongsTo(User, { 
  foreignKey: 'user_id', 
  as: 'user' 
})

// 用户与负债的关系
User.hasMany(Liability, { 
  foreignKey: 'user_id', 
  as: 'liabilities',
  onDelete: 'CASCADE'
})
Liability.belongsTo(User, { 
  foreignKey: 'user_id', 
  as: 'user' 
})

// 用户与储蓄目标的关系
User.hasMany(SavingGoal, { 
  foreignKey: 'user_id', 
  as: 'savingGoals',
  onDelete: 'CASCADE'
})
SavingGoal.belongsTo(User, { 
  foreignKey: 'user_id', 
  as: 'user' 
})

// 资产与负债的关系（贷款购买）
Asset.hasOne(Liability, { 
  foreignKey: 'related_asset_id', 
  as: 'relatedLiability' 
})
Liability.belongsTo(Asset, { 
  foreignKey: 'related_asset_id', 
  as: 'relatedAsset' 
})

module.exports = {
  User,
  Asset,
  Liability,
  SavingGoal
}

