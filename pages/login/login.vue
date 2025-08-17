<template>
  <view class="login-container">
    <view class="logo-section">
      <view class="logo">🦢</view>
      <text class="app-name">金鹅理财</text>
      <text class="app-slogan">让钱为你工作</text>
    </view>

    <view class="form-section">
      <view class="tab-container">
        <view 
          class="tab-item" 
          :class="{ active: activeTab === 'login' }"
          @click="switchTab('login')"
        >
          登录
        </view>
        <view 
          class="tab-item" 
          :class="{ active: activeTab === 'register' }"
          @click="switchTab('register')"
        >
          注册
        </view>
      </view>

      <!-- 登录表单 -->
      <view v-if="activeTab === 'login'" class="form-container">
        <view class="input-group">
          <text class="input-label">用户名</text>
          <input 
            v-model="loginForm.username" 
            placeholder="请输入用户名" 
            class="input-field"
          />
        </view>
        <view class="input-group">
          <text class="input-label">密码</text>
          <input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="请输入密码" 
            class="input-field"
          />
        </view>
        <button class="submit-btn" @click="handleLogin">登录</button>
      </view>

      <!-- 注册表单 -->
      <view v-if="activeTab === 'register'" class="form-container">
        <view class="input-group">
          <text class="input-label">用户名</text>
          <input 
            v-model="registerForm.username" 
            placeholder="请输入用户名" 
            class="input-field"
          />
        </view>
        <view class="input-group">
          <text class="input-label">密码</text>
          <input 
            v-model="registerForm.password" 
            type="password" 
            placeholder="请输入密码" 
            class="input-field"
          />
        </view>
        <view class="input-group">
          <text class="input-label">确认密码</text>
          <input 
            v-model="registerForm.confirmPassword" 
            type="password" 
            placeholder="请再次输入密码" 
            class="input-field"
          />
        </view>
        <button class="submit-btn" @click="handleRegister">注册</button>
      </view>
    </view>

    <view class="tips-section">
      <text class="tips-text">
        {{ activeTab === 'login' ? '还没有账号？点击上方注册' : '已有账号？点击上方登录' }}
      </text>
    </view>
  </view>
</template>

<script>
import StorageManager from '@/utils/storage.js'

export default {
  data() {
    return {
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
    }
  },

  methods: {
    switchTab(tab) {
      this.activeTab = tab
      // 清空表单
      this.loginForm = { username: '', password: '' }
      this.registerForm = { username: '', password: '', confirmPassword: '' }
    },

    handleLogin() {
      const { username, password } = this.loginForm
      
      if (!username.trim() || !password.trim()) {
        uni.showToast({
          title: '请填写完整信息',
          icon: 'none'
        })
        return
      }

      // 从本地存储获取用户信息
      const users = uni.getStorageSync('users') || []
      const user = users.find(u => u.username === username && u.password === password)

      if (user) {
        // 登录成功，保存用户信息
        StorageManager.saveUser({
          id: user.id,
          username: user.username,
          avatar: user.avatar || '',
          createTime: user.createTime
        })

        uni.showToast({
          title: '登录成功',
          icon: 'success'
        })

        // 跳转到首页
        setTimeout(() => {
          uni.reLaunch({
            url: '/pages/index/index'
          })
        }, 1500)
      } else {
        uni.showToast({
          title: '用户名或密码错误',
          icon: 'none'
        })
      }
    },

    handleRegister() {
      const { username, password, confirmPassword } = this.registerForm
      
      if (!username.trim() || !password.trim() || !confirmPassword.trim()) {
        uni.showToast({
          title: '请填写完整信息',
          icon: 'none'
        })
        return
      }

      if (password !== confirmPassword) {
        uni.showToast({
          title: '两次密码不一致',
          icon: 'none'
        })
        return
      }

      if (password.length < 6) {
        uni.showToast({
          title: '密码长度至少6位',
          icon: 'none'
        })
        return
      }

      // 检查用户名是否已存在
      const users = uni.getStorageSync('users') || []
      if (users.find(u => u.username === username)) {
        uni.showToast({
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
      uni.setStorageSync('users', users)

      // 自动登录
      StorageManager.saveUser({
        id: newUser.id,
        username: newUser.username,
        avatar: newUser.avatar,
        createTime: newUser.createTime
      })

      uni.showToast({
        title: '注册成功',
        icon: 'success'
      })

      // 跳转到首页
      setTimeout(() => {
        uni.reLaunch({
          url: '/pages/index/index'
        })
      }, 1500)
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 40rpx;
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 80rpx;
}

.logo {
  font-size: 120rpx;
  margin-bottom: 20rpx;
}

.app-name {
  font-size: 48rpx;
  font-weight: bold;
  color: white;
  margin-bottom: 16rpx;
}

.app-slogan {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

.form-section {
  width: 100%;
  background: white;
  border-radius: 20rpx;
  padding: 40rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
}

.tab-container {
  display: flex;
  margin-bottom: 40rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  padding: 8rpx;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 20rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #6c757d;
  transition: all 0.3s ease;
}

.tab-item.active {
  background: white;
  color: #4A90E2;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.input-label {
  font-size: 28rpx;
  color: #495057;
  font-weight: 500;
}

.input-field {
  height: 80rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  border: 2rpx solid transparent;
  transition: all 0.3s ease;
}

.input-field:focus {
  border-color: #4A90E2;
  background: white;
}

.submit-btn {
  height: 88rpx;
  background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
  color: white;
  border: none;
  border-radius: 12rpx;
  font-size: 32rpx;
  font-weight: bold;
  margin-top: 20rpx;
  transition: all 0.3s ease;
}

.submit-btn:active {
  transform: scale(0.98);
  opacity: 0.9;
}

.tips-section {
  margin-top: 40rpx;
  text-align: center;
}

.tips-text {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
}
</style>
