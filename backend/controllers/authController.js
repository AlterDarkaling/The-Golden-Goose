/**
 * 认证控制器
 */

const { User } = require('../models')
const { generateToken } = require('../utils/jwt')
const { code2Session } = require('../utils/wechat')

/**
 * 微信登录
 */
exports.wechatLogin = async (req, res, next) => {
  try {
    const { code, userInfo } = req.body

    if (!code) {
      return res.status(400).json({
        success: false,
        message: '缺少登录凭证'
      })
    }

    // 通过code换取openid和session_key
    const wechatData = await code2Session(code)
    
    if (!wechatData.openid) {
      return res.status(400).json({
        success: false,
        message: '微信登录失败'
      })
    }

    // 查找或创建用户
    let user = await User.findOne({ where: { openid: wechatData.openid } })
    
    if (!user) {
      // 创建新用户
      user = await User.create({
        openid: wechatData.openid,
        unionid: wechatData.unionid,
        session_key: wechatData.session_key,
        nickname: userInfo?.nickname || '大鹅爱记账用户',
        wechat_avatar: userInfo?.avatarUrl || '',
        last_login_at: new Date(),
        last_login_ip: req.ip
      })
    } else {
      // 更新现有用户
      await user.update({
        session_key: wechatData.session_key,
        last_login_at: new Date(),
        last_login_ip: req.ip
      })
    }

    // 生成JWT Token
    const token = generateToken(user.id)

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          nickname: user.nickname,
          avatar: user.avatar || user.wechat_avatar,
          signature: user.signature
        }
      }
    })
  } catch (error) {
    console.error('微信登录错误:', error)
    next(error)
  }
}

/**
 * 刷新Token
 */
exports.refreshToken = async (req, res, next) => {
  try {
    const userId = req.userId
    
    // 生成新的token
    const token = generateToken(userId)

    res.json({
      success: true,
      message: 'Token刷新成功',
      data: { token }
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 获取当前用户信息
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = req.user

    res.json({
      success: true,
      data: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar || user.wechat_avatar,
        signature: user.signature,
        wechat_avatar: user.wechat_avatar,
        created_at: user.created_at,
        last_login_at: user.last_login_at
      }
    })
  } catch (error) {
    next(error)
  }
}

