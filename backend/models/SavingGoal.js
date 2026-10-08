/**
 * 梦想储蓄罐模型
 */

const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const SavingGoal = sequelize.define('SavingGoal', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '用户ID'
  },
  
  // 基本信息
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '储蓄罐名称'
  },
  
  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'other',
    comment: '储蓄类型：emergency/house/education/travel/investment/retirement/car/wedding/health/debt/gift/other'
  },
  
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '描述'
  },
  
  // 金额信息
  target_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    comment: '目标金额'
  },
  
  current_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '当前金额'
  },
  
  // 时间信息
  deadline: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: '目标日期'
  },
  
  create_time: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: '创建时间'
  },
  
  // 状态
  status: {
    type: DataTypes.ENUM('active', 'completed', 'cancelled'),
    defaultValue: 'active',
    comment: '状态：active-进行中, completed-已完成, cancelled-已取消'
  },
  
  // 是否为示例数据
  is_sample: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否为示例数据'
  }
}, {
  tableName: 'saving_goals',
  comment: '梦想储蓄罐表',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['status'] },
    { fields: ['category'] }
  ]
})

module.exports = SavingGoal
