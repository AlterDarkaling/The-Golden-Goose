<template>
  <view class="detail-container">
    <!-- 头部信息 -->
    <view class="header-section">
      <view class="type-badge" :class="type">
        {{ type === 'asset' ? '💰 资产' : '💳 负债' }}
      </view>
      <view class="title">{{ itemData.name }}</view>
      <view class="amount">
        ¥{{ formatNumber(type === 'asset' ? (itemData.currentValue || itemData.initialValue) : (itemData.currentAmount || itemData.initialAmount)) }}
      </view>
    </view>

    <!-- 基本信息 -->
    <view class="info-section">
      <view class="section-title">基本信息</view>
      <view class="info-grid">
        <view class="info-item">
          <text class="info-label">分类</text>
          <text class="info-value">{{ getCategoryName(itemData.categoryId) }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">状态</text>
          <text class="info-value status" :class="itemData.status">{{ getStatusText(itemData.status) }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">创建时间</text>
          <text class="info-value">{{ formatDate(itemData.createTime) }}</text>
        </view>
        <view class="info-item" v-if="itemData.updateTime">
          <text class="info-label">更新时间</text>
          <text class="info-value">{{ formatDate(itemData.updateTime) }}</text>
        </view>
      </view>
    </view>

    <!-- 资产特有信息 -->
    <view v-if="type === 'asset'" class="info-section">
      <view class="section-title">资产详情</view>
      <view class="info-grid">
        <view class="info-item">
          <text class="info-label">初始价值</text>
          <text class="info-value">¥{{ formatNumber(itemData.initialValue) }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">当前价值</text>
          <text class="info-value">¥{{ formatNumber(itemData.currentValue || itemData.initialValue) }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">每日收益</text>
          <text class="info-value income">¥{{ formatNumber(itemData.dailyIncome || 0) }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">年化收益率</text>
          <text class="info-value">{{ itemData.annualReturn || 0 }}%</text>
        </view>
      </view>
    </view>

    <!-- 负债特有信息 -->
    <view v-if="type === 'liability'" class="info-section">
      <view class="section-title">负债详情</view>
      <view class="info-grid">
        <view class="info-item">
          <text class="info-label">初始金额</text>
          <text class="info-value">¥{{ formatNumber(itemData.initialAmount) }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">当前金额</text>
          <text class="info-value">¥{{ formatNumber(itemData.currentAmount || itemData.initialAmount) }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">每日成本</text>
          <text class="info-value cost">¥{{ formatNumber(itemData.dailyCost || 0) }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">年化利率</text>
          <text class="info-value">{{ itemData.annualRate || 0 }}%</text>
        </view>
      </view>
    </view>

    <!-- 备注信息 -->
    <view v-if="itemData.notes" class="info-section">
      <view class="section-title">备注</view>
      <view class="notes-content">
        <text>{{ itemData.notes }}</text>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="action-section">
      <button class="action-btn edit-btn" @click="handleEdit">编辑</button>
      <button class="action-btn delete-btn" @click="handleDelete">删除</button>
    </view>
  </view>
</template>

<script>
import StorageManager from '@/utils/storage.js'

export default {
  data() {
    return {
      type: 'asset',
      itemId: '',
      itemData: {}
    }
  },

  onLoad(options) {
    this.type = options.type || 'asset'
    this.itemId = options.id || ''
    this.loadItemData()
  },

  methods: {
    loadItemData() {
      let item
      if (this.type === 'asset') {
        const assets = StorageManager.getAssets()
        item = assets.find(a => a.id === this.itemId)
      } else {
        const liabilities = StorageManager.getLiabilities()
        item = liabilities.find(l => l.id === this.itemId)
      }

      if (item) {
        this.itemData = item
      } else {
        uni.showToast({
          title: '数据不存在',
          icon: 'none'
        })
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
      }
    },

    getCategoryName(categoryId) {
      const settings = StorageManager.getSettings()
      if (this.type === 'asset') {
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
    },

    formatDate(dateString) {
      if (!dateString) return '未知'
      const date = new Date(dateString)
      return date.toLocaleDateString('zh-CN')
    },

    handleEdit() {
      uni.navigateTo({
        url: `/pages/edit/edit?type=${this.type}&id=${this.itemId}`
      })
    },

    handleDelete() {
      uni.showModal({
        title: '确认删除',
        content: `确定要删除这个${this.type === 'asset' ? '资产' : '负债'}吗？`,
        success: (res) => {
          if (res.confirm) {
            let success = false
            if (this.type === 'asset') {
              success = StorageManager.deleteAsset(this.itemId)
            } else {
              success = StorageManager.deleteLiability(this.itemId)
            }

            if (success) {
              uni.showToast({
                title: '删除成功',
                icon: 'success'
              })
              setTimeout(() => {
                uni.navigateBack()
              }, 1500)
            } else {
              uni.showToast({
                title: '删除失败',
                icon: 'none'
              })
            }
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.detail-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 120rpx;
}

/* 头部信息 */
.header-section {
  background: white;
  padding: 60rpx 40rpx;
  text-align: center;
  border-bottom: 1rpx solid #e9ecef;
}

.type-badge {
  display: inline-block;
  padding: 12rpx 24rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  margin-bottom: 20rpx;
}

.type-badge.asset {
  background: #e8f5e8;
  color: #2e7d32;
}

.type-badge.liability {
  background: #ffeaea;
  color: #c62828;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  color: #212529;
  margin-bottom: 20rpx;
}

.amount {
  font-size: 48rpx;
  font-weight: bold;
  color: #4A90E2;
}

/* 信息部分 */
.info-section {
  background: white;
  margin: 20rpx;
  border-radius: 16rpx;
  padding: 40rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #212529;
  margin-bottom: 30rpx;
  padding-bottom: 16rpx;
  border-bottom: 2rpx solid #f8f9fa;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30rpx;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.info-label {
  font-size: 26rpx;
  color: #6c757d;
}

.info-value {
  font-size: 30rpx;
  color: #212529;
  font-weight: 500;
}

.info-value.status {
  padding: 8rpx 16rpx;
  border-radius: 12rpx;
  color: white;
  font-size: 24rpx;
  text-align: center;
  width: fit-content;
}

.info-value.status.active {
  background: #28a745;
}

.info-value.status.paused {
  background: #ffc107;
  color: #212529;
}

.info-value.status.completed {
  background: #6c757d;
}

.info-value.income {
  color: #28a745;
}

.info-value.cost {
  color: #dc3545;
}

/* 备注部分 */
.notes-content {
  background: #f8f9fa;
  padding: 30rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #495057;
  line-height: 1.6;
}

/* 操作按钮 */
.action-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 20rpx 40rpx;
  border-top: 1rpx solid #e9ecef;
  display: flex;
  gap: 20rpx;
}

.action-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 12rpx;
  font-size: 32rpx;
  font-weight: bold;
  border: none;
  transition: all 0.3s ease;
}

.edit-btn {
  background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
  color: white;
}

.edit-btn:active {
  transform: scale(0.98);
  opacity: 0.9;
}

.delete-btn {
  background: #f8f9fa;
  color: #dc3545;
  border: 2rpx solid #dc3545;
}

.delete-btn:active {
  background: #ffeaea;
  transform: scale(0.98);
}
</style>
