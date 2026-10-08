/**
 * 微信API工具函数
 */

const axios = require('axios')

/**
 * 通过code换取session_key和openid
 */
exports.code2Session = async (code) => {
  try {
    const response = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: process.env.WECHAT_APPID,
        secret: process.env.WECHAT_SECRET,
        js_code: code,
        grant_type: 'authorization_code'
      }
    })

    const data = response.data

    if (data.errcode) {
      throw new Error(`微信登录失败: ${data.errmsg}`)
    }

    return {
      openid: data.openid,
      session_key: data.session_key,
      unionid: data.unionid
    }
  } catch (error) {
    console.error('微信登录错误:', error)
    throw error
  }
}

/**
 * 获取微信用户信息（需要用户授权）
 * 注意：新版微信小程序已废弃getUserInfo接口，需要使用按钮授权
 */
exports.getUserInfo = async (encryptedData, iv, sessionKey) => {
  // 这里需要实现解密逻辑
  // 微信官方提供了多种语言的解密demo
  // 参考：https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/signature.html
  
  // 简化处理：实际项目中需要实现完整的解密
  return {
    nickname: '微信用户',
    avatarUrl: ''
  }
}

