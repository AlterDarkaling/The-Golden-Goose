/**
 * 负债模型
 */

const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Liability = sequelize.define('Liability', {
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
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '负债名称'
  },
  
  // 分类信息
  category_l1: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '一级分类（流动负债/长期负债/其他负债）'
  },
  
  category_l2: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '二级分类'
  },
  
  category_l3: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '三级分类'
  },
  
  // 金额信息
  initial_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '初始金额'
  },
  
  current_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '当前余额/剩余本金'
  },
  
  original_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    comment: '原始金额（兼容旧数据）'
  },
  
  // 贷款信息
  type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '负债类型'
  },
  
  monthly_payment: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    comment: '月还款额'
  },
  
  annual_rate: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: true,
    comment: '年利率（百分比，如 10.5 表示 10.5%）'
  },
  
  months: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '还款总月数'
  },
  
  total_interest: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    comment: '总利息'
  },
  
  total_amount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    comment: '总还款额（本金+利息）'
  },
  
  // 还款计划（JSON存储）
  loan_schedule: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '还款计划表'
  },
  
  // 关联信息
  related_asset_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '关联的资产ID'
  },
  
  // 状态
  status: {
    type: DataTypes.ENUM('normal', 'paid_off', 'overdue', 'prepaid'),
    defaultValue: 'normal',
    comment: '负债状态'
  },
  
  // 时间信息
  create_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: '创建日期/借贷日期'
  },
  
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: '开始日期'
  },
  
  // 其他信息
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '备注'
  },
  
  // 标记字段
  is_sample: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否为示例数据'
  }
}, {
  tableName: 'liabilities',
  comment: '负债表',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['category_l1', 'category_l2'] },
    { fields: ['status'] }
  ]
})

module.exports = Liability

