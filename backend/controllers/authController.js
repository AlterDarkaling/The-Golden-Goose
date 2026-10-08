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
 * 演示身份登录
 * 微信登录需要真实 AppID 与 code 换 openid，开发者工具里跑不通；
 * 此接口按昵称固定映射到一个 dev_ 前缀 openid 并签发 JWT，用于验证多用户数据隔离。
 * 仅在开发环境开放，不涉及也不改动微信登录流程。
 */
exports.devLogin = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({
        success: false,
        message: '演示登录仅在开发环境开放'
      })
    }

    const nickname = String(req.body.nickname || '').trim().slice(0, 50)

    if (!nickname) {
      return res.status(400).json({
        success: false,
        message: '缺少演示身份昵称'
      })
    }

    // 同一昵称恒定映射到同一账号，保证切换身份后数据仍归该用户
    const openid = 'dev_' + nickname

    let user = await User.findOne({ where: { openid } })

    if (!user) {
      user = await User.create({
        openid,
        nickname,
        wechat_avatar: String(req.body.avatar || '').slice(0, 200),
        last_login_at: new Date(),
        last_login_ip: req.ip
      })
    } else {
      await user.update({
        last_login_at: new Date(),
        last_login_ip: req.ip
      })
    }

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
    console.error('演示登录错误:', error)
    next(error)
  }
}

/**
 * 刷新Token
 */exports.refreshToken = async (req, res, next) => {
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

