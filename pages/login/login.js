Page({
  data: {
    activeTab: 'login',
    loginForm: {
      username: '',
      password: ''
    },
    registerForm: {
      username: '',
      password: '',
      confirmPassword: ''
    }
  },

  onLoad() {
    // 检查是否已经登录
    this.checkLoginStatus()
  },

  checkLoginStatus() {
    const userInfo = wx.getStorageSync('user_info')
    if (userInfo) {
      // 已经登录，直接跳转到首页
      wx.reLaunch({
        url: '/pages/index/index'
      })
    }
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({
      activeTab: tab,
      loginForm: { username: '', password: '' },
      registerForm: { username: '', password: '', confirmPassword: '' }
    })
  },

  // 微信授权登录
  handleWechatLogin() {
    wx.showLoading({
      title: '登录中...'
    })

    // 由于微信小程序限制，我们使用模拟登录
    // 在实际生产环境中，这里应该调用后端API进行真实的微信登录
    setTimeout(() => {
      this.processWechatLoginWithFallback()
    }, 1000)
  },

  // 获取用户信息（带降级处理）
  getUserProfileWithFallback() {
    // 尝试使用 getUserProfile
    if (wx.getUserProfile) {
      wx.getUserProfile({
        desc: '用于完善用户资料和提供个性化服务',
        success: (res) => {
          const userInfo = res.userInfo
          this.processWechatLogin(userInfo)
        },
        fail: (err) => {
          console.log('getUserProfile 失败:', err)
          // 降级到模拟用户信息
          this.processWechatLoginWithFallback()
        }
      })
    } else {
      // 如果不支持 getUserProfile，直接使用模拟信息
      this.processWechatLoginWithFallback()
    }
  },

  // 使用模拟用户信息登录（降级方案）
  processWechatLoginWithFallback() {
    const mockUserInfo = {
      nickName: '微信用户',
      avatarUrl: '',
      gender: 0,
      country: 'China',
      province: '',
      city: '',
      language: 'zh_CN'
    }
    this.processWechatLogin(mockUserInfo)
  },

  // 处理微信登录
  processWechatLogin(userInfo) {
    console.log('处理微信登录，用户信息:', userInfo)
    
    // 保存用户信息到本地存储
    const userData = {
      id: `wx_${Date.now()}`,
      username: userInfo.nickName || '微信用户',
      avatar: userInfo.avatarUrl || '',
      createTime: new Date().toISOString(),
      isWechatUser: true,
      wechatData: userInfo
    }

    // 保存到本地存储
    wx.setStorageSync('user_info', userData)
    
    // 保存到用户列表
    const users = wx.getStorageSync('users') || []
    users.push(userData)
    wx.setStorageSync('users', userData)

    wx.hideLoading()
    wx.showToast({
      title: '登录成功',
      icon: 'success'
    })

    // 跳转到首页
    setTimeout(() => {
      wx.reLaunch({
        url: '/pages/index/index'
      })
    }, 1500)
  },

  handleLogin() {
    const { username, password } = this.data.loginForm
    
    if (!username.trim() || !password.trim()) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    // 从本地存储获取用户信息
    const users = wx.getStorageSync('users') || []
    const user = users.find(u => u.username === username && u.password === password)

    if (user) {
      // 登录成功，保存用户信息
      wx.setStorageSync('user_info', {
        id: user.id,
        username: user.username,
        avatar: user.avatar || '',
        createTime: user.createTime
      })

      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })

      // 跳转到首页
      setTimeout(() => {
        wx.reLaunch({
          url: '/pages/index/index'
        })
      }, 1500)
    } else {
      wx.showToast({
        title: '用户名或密码错误',
        icon: 'none'
      })
    }
  },

  handleRegister() {
    const { username, password, confirmPassword } = this.data.registerForm
    
    if (!username.trim() || !password.trim() || !confirmPassword.trim()) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    if (password !== confirmPassword) {
      wx.showToast({
        title: '两次密码不一致',
        icon: 'none'
      })
      return
    }

    if (password.length < 6) {
      wx.showToast({
        title: '密码长度至少6位',
        icon: 'none'
      })
      return
    }

    // 检查用户名是否已存在
    const users = wx.getStorageSync('users') || []
    if (users.find(u => u.username === username)) {
      wx.showToast({
        title: '用户名已存在',
        icon: 'none'
      })
      return
    }

    // 创建新用户
    const newUser = {
      id: Date.now().toString(),
      username,
      password,
      avatar: '',
      createTime: new Date().toISOString()
    }

    users.push(newUser)
    wx.setStorageSync('users', users)

    // 自动登录
    wx.setStorageSync('user_info', {
      id: newUser.id,
      username: newUser.username,
      avatar: newUser.avatar,
      createTime: newUser.createTime
    })

    wx.showToast({
      title: '注册成功',
      icon: 'success'
    })

    // 跳转到首页
    setTimeout(() => {
      wx.reLaunch({
        url: '/pages/index/index'
      })
    }, 1500)
  }
})
