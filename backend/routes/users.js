/**
 * 用户路由
 */

const express = require('express')
const router = express.Router()
const { User } = require('../models')
const { authenticateToken } = require('../middleware/auth')

// 所有用户路由都需要认证
router.use(authenticateToken)

// 更新用户信息
router.put('/profile', async (req, res, next) => {
  try {
    const userId = req.userId
    const { nickname, avatar, signature } = req.body

    const user = await User.findByPk(userId)
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    await user.update({
      nickname: nickname || user.nickname,
      avatar: avatar !== undefined ? avatar : user.avatar,
      signature: signature !== undefined ? signature : user.signature
    })

    res.json({
      success: true,
      message: '用户信息更新成功',
      data: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar || user.wechat_avatar,
        signature: user.signature
      }
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router

