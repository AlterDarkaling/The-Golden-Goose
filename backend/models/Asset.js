/**
 * 资产模型
 */

const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Asset = sequelize.define('Asset', {
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
    comment: '资产名称'
  },
  
  // 分类信息（传统会计准则）
  category_l1: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '一级分类（流动资产/金融资产/实物资产/工作收入/其他资产）'
  },
  
  category_l2: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '二级分类'
  },
  
  category_l3: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '三级分类（具体项目）'
  },
  
  // 价值信息
  initial_value: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '初始价值/购入价格'
  },
  
  current_value: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '当前价值'
  },
  
  original_value: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    comment: '原值（兼容旧数据）'
  },
  
  // 折旧相关（消费性资产）
  is_depreciable: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否需要折旧'
  },
  
  depreciation_rate: {
    type: DataTypes.DECIMAL(5, 4),
    allowNull: true,
    comment: '年折旧率'
  },
  
  custom_depreciation_rate: {
    type: DataTypes.DECIMAL(5, 4),
    allowNull: true,
    comment: '自定义折旧率'
  },
  
  total_depreciation: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    comment: '累计折旧额'
  },
  
  monthly_depreciation: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    comment: '月均折旧额'
  },
  
  depreciation_ratio: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    comment: '折旧比例（百分比）'
  },
  
  last_depreciation_update: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后折旧更新时间'
  },
  
  // 现金流信息
  monthly_income: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    comment: '月收入'
  },
  
  monthly_operating_cost: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    comment: '月运营成本'
  },
  
  // 工作收入专用字段
  salary_structure: {
    type: DataTypes.ENUM('hourly_wage', 'daily_wage', 'monthly_salary'),
    allowNull: true,
    comment: '薪资结构'
  },
  
  daily_work_hours: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 8,
    comment: '每日工作小时数'
  },
  
  weekly_work_days: {
    type: DataTypes.DECIMAL(3, 1),
    defaultValue: 5,
    comment: '每周工作天数'
  },
  
  working_months_per_year: {
    type: DataTypes.INTEGER,
    defaultValue: 12,
    comment: '每年工作月数'
  },
  
  fixed_allowances: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    comment: '固定津贴'
  },
  
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: '入职日期'
  },
  
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: '离职日期'
  },
  
  // 状态信息
  status: {
    type: DataTypes.ENUM(
      'active', 'dusty', 'rented', 'damaged', 
      'processed', 'gifted', 'sold', 'lost'
    ),
    defaultValue: 'active',
    comment: '资产状态'
  },
  
  // 时间信息
  create_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: '购买日期/创建日期'
  },
  
  purchase_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: '购买日期（兼容旧字段）'
  },
  
  // 其他信息
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '备注'
  },
  
  // 贷款关联
  purchase_method: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '购买方式（cash/loan）'
  },
  
  related_loan_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '关联的贷款ID'
  },
  
  // 标记字段
  is_sample: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否为示例数据'
  }
}, {
  tableName: 'assets',
  comment: '资产表',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['category_l1', 'category_l2'] },
    { fields: ['status'] },
    { fields: ['create_date'] }
  ]
})

module.exports = Asset

