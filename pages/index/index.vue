<template>
  <view class="container">
    <!-- 个人信息栏 -->
    <view class="user-info-section">
      <view class="user-info-top">
        <view class="net-worth">
          <text class="net-worth-label">净资产</text>
          <text class="net-worth-value">¥{{ formatNumber(netWorth) }}</text>
        </view>
        <view class="avatar-container" @click="chooseAvatar">
          <image 
            :src="userInfo.avatar || '/static/default-avatar.png'" 
            class="avatar"
            mode="aspectFill"
          />
          <view class="avatar-edit-icon">📷</view>
        </view>
      </view>
      <view class="user-info-bottom">
        <view class="info-item">
          <text class="info-label">每日成本</text>
          <text class="info-value cost">¥{{ formatNumber(dailyCost) }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">资产数量</text>
          <text class="info-value">{{ assetsCount }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">负债数量</text>
          <text class="info-value">{{ liabilitiesCount }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">每日收益</text>
          <text class="info-value income">¥{{ formatNumber(dailyIncome) }}</text>
        </view>
      </view>
    </view>

    <!-- 功能栏 -->
    <view class="function-bar">
      <view class="search-container">
        <input 
          v-model="searchKeyword" 
          placeholder="搜索资产或负债..." 
          class="search-input"
          @input="onSearch"
        />
      </view>
      <view class="filter-container">
        <picker 
          :value="sortIndex" 
          :range="sortOptions" 
          range-key="label"
          @change="onSortChange"
          class="filter-picker"
        >
          <view class="filter-item">
            <text>{{ sortOptions[sortIndex].label }}</text>
            <text class="filter-arrow">▼</text>
          </view>
        </picker>
        <picker 
          :value="categoryIndex" 
          :range="categoryOptions" 
          range-key="label"
          @change="onCategoryChange"
          class="filter-picker"
        >
          <view class="filter-item">
            <text>{{ categoryOptions[categoryIndex].label }}</text>
            <text class="filter-arrow">▼</text>
          </view>
        </picker>
        <picker 
          :value="statusIndex" 
          :range="statusOptions" 
          range-key="label"
          @change="onStatusChange"
          class="filter-picker"
        >
          <view class="filter-item">
            <text>{{ statusOptions[statusIndex].label }}</text>
            <text class="filter-arrow">▼</text>
          </view>
        </picker>
      </view>
    </view>

    <!-- 数据列表 -->
    <view class="data-section">
      <view class="section-header">
        <text class="section-title">资产与负债</text>
        <view class="add-buttons">
          <button class="add-btn asset-btn" @click="addAsset">+ 资产</button>
          <button class="add-btn liability-btn" @click="addLiability">+ 负债</button>
        </view>
      </view>
      
      <view class="data-list">
        <!-- 资产列表 -->
        <view v-for="asset in filteredAssets" :key="asset.id" class="data-item asset-item" @click="viewDetail(asset, 'asset')">
          <view class="item-left">
            <view class="item-icon asset-icon">💰</view>
            <view class="item-info">
              <text class="item-name">{{ asset.name }}</text>
              <text class="item-category">{{ getCategoryName(asset.categoryId, 'asset') }}</text>
            </view>
          </view>
          <view class="item-right">
            <text class="item-amount">¥{{ formatNumber(asset.currentValue || asset.initialValue) }}</text>
            <text class="item-status" :class="asset.status">{{ getStatusText(asset.status) }}</text>
          </view>
        </view>

        <!-- 负债列表 -->
        <view v-for="liability in filteredLiabilities" :key="liability.id" class="data-item liability-item" @click="viewDetail(liability, 'liability')">
          <view class="item-left">
            <view class="item-icon liability-icon">💳</view>
            <view class="item-info">
              <text class="item-name">{{ liability.name }}</text>
              <text class="item-category">{{ getCategoryName(liability.categoryId, 'liability') }}</text>
            </view>
          </view>
          <view class="item-right">
            <text class="item-amount">¥{{ formatNumber(liability.currentAmount || liability.initialAmount) }}</text>
            <text class="item-status" :class="liability.status">{{ getStatusText(liability.status) }}</text>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-if="filteredAssets.length === 0 && filteredLiabilities.length === 0" class="empty-state">
          <text class="empty-text">暂无数据</text>
          <text class="empty-hint">点击上方按钮添加资产或负债</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import StorageManager from '@/utils/storage.js'

export default {
  data() {
    return {
      userInfo: {},
      assets: [],
      liabilities: [],
      searchKeyword: '',
      sortIndex: 0,
      categoryIndex: 0,
      statusIndex: 0,
      sortOptions: [
        { label: '默认排序', value: 'default' },
        { label: '金额从高到低', value: 'amount-desc' },
        { label: '金额从低到高', value: 'amount-asc' },
        { label: '创建时间', value: 'time' }
      ],
      categoryOptions: [
        { label: '全部分类', value: 'all' },
        { label: '投资理财', value: 'investment' },
        { label: '经营性资产', value: 'business' },
        { label: '消费贷款', value: 'consumer_loan' },
        { label: '信用卡', value: 'credit_card' }
      ],
      statusOptions: [
        { label: '全部状态', value: 'all' },
        { label: '活跃', value: 'active' },
        { label: '暂停', value: 'paused' },
        { label: '已完成', value: 'completed' }
      ]
    }
  },

  computed: {
    netWorth() {
      return StorageManager.calculateNetWorth()
    },
    dailyCost() {
      return StorageManager.calculateDailyCost()
    },
    dailyIncome() {
      return StorageManager.calculateDailyIncome()
    },
    assetsCount() {
      return this.assets.length
    },
    liabilitiesCount() {
      return this.liabilities.length
    },
    filteredAssets() {
      let result = this.assets.filter(asset => {
        // 搜索过滤
        if (this.searchKeyword && !asset.name.includes(this.searchKeyword)) {
          return false
        }
        // 分类过滤
        if (this.categoryIndex > 0 && asset.categoryId !== this.categoryOptions[this.categoryIndex].value) {
          return false
        }
        // 状态过滤
        if (this.statusIndex > 0 && asset.status !== this.statusOptions[this.statusIndex].value) {
          return false
        }
        return true
      })

      // 排序
      switch (this.sortOptions[this.sortIndex].value) {
        case 'amount-desc':
          result.sort((a, b) => (b.currentValue || b.initialValue) - (a.currentValue || a.initialValue))
          break
        case 'amount-asc':
          result.sort((a, b) => (a.currentValue || a.initialValue) - (b.currentValue || b.initialValue))
          break
        case 'time':
          result.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
          break
      }

      return result
    },
    filteredLiabilities() {
      let result = this.liabilities.filter(liability => {
        // 搜索过滤
        if (this.searchKeyword && !liability.name.includes(this.searchKeyword)) {
          return false
        }
        // 分类过滤
        if (this.categoryIndex > 0 && liability.categoryId !== this.categoryOptions[this.categoryIndex].value) {
          return false
        }
        // 状态过滤
        if (this.statusIndex > 0 && liability.status !== this.statusOptions[this.statusIndex].value) {
          return false
        }
        return true
      })

      // 排序
      switch (this.sortOptions[this.sortIndex].value) {
        case 'amount-desc':
          result.sort((a, b) => (b.currentAmount || b.initialAmount) - (a.currentAmount || a.initialAmount))
          break
        case 'amount-asc':
          result.sort((a, b) => (a.currentAmount || a.initialAmount) - (b.currentAmount || b.initialAmount))
          break
        case 'time':
          result.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
          break
      }

      return result
    }
  },

  onLoad() {
    this.checkLogin()
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  methods: {
    checkLogin() {
      const user = StorageManager.getUser()
      if (!user) {
        uni.redirectTo({
          url: '/pages/login/login'
        })
      } else {
        this.userInfo = user
      }
    },

    loadData() {
      this.assets = StorageManager.getAssets()
      this.liabilities = StorageManager.getLiabilities()
    },

    chooseAvatar() {
      uni.showActionSheet({
        itemList: ['从相册选择', '拍照'],
        success: (res) => {
          if (res.tapIndex === 0) {
            this.selectFromAlbum()
          } else if (res.tapIndex === 1) {
            this.takePhoto()
          }
        }
      })
    },

    selectFromAlbum() {
      uni.chooseImage({
        count: 1,
        sourceType: ['album'],
        success: (res) => {
          this.updateAvatar(res.tempFilePaths[0])
        }
      })
    },

    takePhoto() {
      uni.chooseImage({
        count: 1,
        sourceType: ['camera'],
        success: (res) => {
          this.updateAvatar(res.tempFilePaths[0])
        }
      })
    },

    updateAvatar(avatarPath) {
      this.userInfo.avatar = avatarPath
      StorageManager.saveUser(this.userInfo)
      this.$forceUpdate()
    },

    onSearch() {
      // 搜索逻辑已在computed中实现
    },

    onSortChange(e) {
      this.sortIndex = e.detail.value
    },

    onCategoryChange(e) {
      this.categoryIndex = e.detail.value
    },

    onStatusChange(e) {
      this.statusIndex = e.detail.value
    },

    addAsset() {
      uni.navigateTo({
        url: '/pages/edit/edit?type=asset'
      })
    },

    addLiability() {
      uni.navigateTo({
        url: '/pages/edit/edit?type=liability'
      })
    },

    viewDetail(item, type) {
      uni.navigateTo({
        url: `/pages/detail/detail?type=${type}&id=${item.id}`
      })
    },

    getCategoryName(categoryId, type) {
      const settings = StorageManager.getSettings()
      if (type === 'asset') {
        const category = settings.assetCategories.find(c => c.id === categoryId)
        return category ? category.name : '未分类'
      } else {
        const category = settings.liabilityCategories.find(c => c.id === categoryId)
        return category ? category.name : '未分类'
      }
    },

    getStatusText(status) {
      const statusMap = {
        active: '活跃',
        paused: '暂停',
        completed: '已完成'
      }
      return statusMap[status] || '未知'
    },

    formatNumber(num) {
      if (typeof num !== 'number') return '0.00'
      return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }
  }
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

/* 个人信息栏 */
.user-info-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 20rpx;
  border-radius: 20rpx;
  padding: 40rpx;
  color: white;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
}

.user-info-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40rpx;
}

.net-worth {
  display: flex;
  flex-direction: column;
}

.net-worth-label {
  font-size: 28rpx;
  opacity: 0.9;
  margin-bottom: 10rpx;
}

.net-worth-value {
  font-size: 48rpx;
  font-weight: bold;
}

.avatar-container {
  position: relative;
  width: 120rpx;
  height: 120rpx;
}

.avatar {
  width: 100%;
  height: 100%;
  border-radius: 60rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.3);
}

.avatar-edit-icon {
  position: absolute;
  bottom: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border-radius: 50%;
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20rpx;
}

.user-info-bottom {
  display: flex;
  justify-content: space-between;
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.info-label {
  font-size: 24rpx;
  opacity: 0.8;
  margin-bottom: 8rpx;
}

.info-value {
  font-size: 32rpx;
  font-weight: bold;
}

.info-value.cost {
  color: #ff6b6b;
}

.info-value.income {
  color: #51cf66;
}

/* 功能栏 */
.function-bar {
  margin: 20rpx;
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.search-container {
  margin-bottom: 30rpx;
}

.search-input {
  width: 100%;
  height: 80rpx;
  background: #f8f9fa;
  border-radius: 40rpx;
  padding: 0 30rpx;
  font-size: 28rpx;
  border: none;
}

.filter-container {
  display: flex;
  gap: 20rpx;
}

.filter-picker {
  flex: 1;
}

.filter-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
  padding: 20rpx 24rpx;
  border-radius: 12rpx;
  font-size: 26rpx;
  color: #495057;
}

.filter-arrow {
  font-size: 20rpx;
  color: #adb5bd;
}

/* 数据部分 */
.data-section {
  margin: 20rpx;
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #212529;
}

.add-buttons {
  display: flex;
  gap: 20rpx;
}

.add-btn {
  padding: 16rpx 24rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  border: none;
  color: white;
}

.asset-btn {
  background: #4caf50;
}

.liability-btn {
  background: #f44336;
}

/* 数据列表 */
.data-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.data-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-radius: 16rpx;
  background: #f8f9fa;
  transition: all 0.3s ease;
}

.data-item:active {
  transform: scale(0.98);
  background: #e9ecef;
}

.item-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.item-icon {
  width: 60rpx;
  height: 60rpx;
  border-radius: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
}

.asset-icon {
  background: #e8f5e8;
}

.liability-icon {
  background: #ffeaea;
}

.item-info {
  display: flex;
  flex-direction: column;
}

.item-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #212529;
  margin-bottom: 8rpx;
}

.item-category {
  font-size: 24rpx;
  color: #6c757d;
}

.item-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8rpx;
}

.item-amount {
  font-size: 32rpx;
  font-weight: bold;
  color: #212529;
}

.item-status {
  font-size: 22rpx;
  padding: 8rpx 16rpx;
  border-radius: 12rpx;
  color: white;
}

.item-status.active {
  background: #28a745;
}

.item-status.paused {
  background: #ffc107;
  color: #212529;
}

.item-status.completed {
  background: #6c757d;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 0;
  color: #6c757d;
}

.empty-text {
  font-size: 32rpx;
  margin-bottom: 20rpx;
}

.empty-hint {
  font-size: 26rpx;
  opacity: 0.7;
}
</style>
