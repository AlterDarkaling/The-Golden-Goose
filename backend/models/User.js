/**
 * 用户模型
 */

const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // 微信相关
  openid: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false,
    comment: '微信openid'
  },
  
  unionid: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: true,
    comment: '微信unionid'
  },
  
  session_key: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '微信session_key'
  },
  
  // 用户信息
  nickname: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: '大鹅爱记账用户',
    comment: '昵称'
  },
  
  avatar: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '头像URL'
  },
  
  wechat_avatar: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '微信头像URL'
  },
  
  signature: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: '个人签名'
  },
  
  // 状态
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'banned'),
    defaultValue: 'active',
    comment: '账户状态'
  },
  
  // 最后登录
  last_login_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后登录时间'
  },
  
  last_login_ip: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '最后登录IP'
  }
}, {
  tableName: 'users',
  comment: '用户表'
})

module.exports = User

