<template>
  <view class="edit-container">
    <view class="header">
      <text class="header-title">{{ isEdit ? '编辑' : '添加' }}{{ typeText }}</text>
    </view>

    <view class="form-container">
      <view class="form-group">
        <text class="form-label">名称 *</text>
        <input 
          v-model="formData.name" 
          placeholder="请输入名称" 
          class="form-input"
        />
      </view>

      <view class="form-group">
        <text class="form-label">分类 *</text>
        <picker 
          :value="categoryIndex" 
          :range="categoryOptions" 
          range-key="name"
          @change="onCategoryChange"
          class="form-picker"
        >
          <view class="picker-display">
            <text>{{ categoryOptions[categoryIndex]?.name || '请选择分类' }}</text>
            <text class="picker-arrow">▼</text>
          </view>
        </picker>
      </view>

      <view class="form-group">
        <text class="form-label">状态 *</text>
        <picker 
          :value="statusIndex" 
          :range="statusOptions" 
          range-key="label"
          @change="onStatusChange"
          class="form-picker"
        >
          <view class="picker-display">
            <text>{{ statusOptions[statusIndex]?.label || '请选择状态' }}</text>
            <text class="picker-arrow">▼</text>
          </view>
        </picker>
      </view>

      <!-- 资产特有字段 -->
      <template v-if="type === 'asset'">
        <view class="form-group">
          <text class="form-label">初始价值 *</text>
          <input 
            v-model="formData.initialValue" 
            type="number" 
            placeholder="请输入初始价值" 
            class="form-input"
          />
        </view>
        <view class="form-group">
          <text class="form-label">当前价值</text>
          <input 
            v-model="formData.currentValue" 
            type="number" 
            placeholder="请输入当前价值" 
            class="form-input"
          />
        </view>
        <view class="form-group">
          <text class="form-label">每日收益</text>
          <input 
            v-model="formData.dailyIncome" 
            type="number" 
            placeholder="请输入每日收益" 
            class="form-input"
          />
        </view>
        <view class="form-group">
          <text class="form-label">年化收益率 (%)</text>
          <input 
            v-model="formData.annualReturn" 
            type="number" 
            placeholder="请输入年化收益率" 
            class="form-input"
          />
        </view>
      </template>

      <!-- 负债特有字段 -->
      <template v-if="type === 'liability'">
        <view class="form-group">
          <text class="form-label">初始金额 *</text>
          <input 
            v-model="formData.initialAmount" 
            type="number" 
            placeholder="请输入初始金额" 
            class="form-input"
          />
        </view>
        <view class="form-group">
          <text class="form-label">当前金额</text>
          <input 
            v-model="formData.currentAmount" 
            type="number" 
            placeholder="请输入当前金额" 
            class="form-input"
          />
        </view>
        <view class="form-group">
          <text class="form-label">每日成本</text>
          <input 
            v-model="formData.dailyCost" 
            type="number" 
            placeholder="请输入每日成本" 
            class="form-input"
          />
        </view>
        <view class="form-group">
          <text class="form-label">年化利率 (%)</text>
          <input 
            v-model="formData.annualRate" 
            type="number" 
            placeholder="请输入年化利率" 
            class="form-input"
        />
        </view>
      </template>

      <view class="form-group">
        <text class="form-label">备注</text>
        <textarea 
          v-model="formData.notes" 
          placeholder="请输入备注信息" 
          class="form-textarea"
          maxlength="200"
        />
        <text class="char-count">{{ formData.notes.length }}/200</text>
      </view>

      <view class="form-group">
        <text class="form-label">创建时间</text>
        <picker 
          mode="date" 
          :value="formData.createDate" 
          @change="onDateChange"
          class="form-picker"
        >
          <view class="picker-display">
            <text>{{ formData.createDate || '请选择日期' }}</text>
            <text class="picker-arrow">▼</text>
          </view>
        </picker>
      </view>
    </view>

    <view class="button-group">
      <button class="btn btn-cancel" @click="goBack">取消</button>
      <button class="btn btn-save" @click="handleSave">保存</button>
    </view>
  </view>
</template>

<script>
import StorageManager from '@/utils/storage.js'

export default {
  data() {
    return {
      type: 'asset', // asset 或 liability
      isEdit: false,
      editId: '',
      categoryIndex: 0,
      statusIndex: 0,
      formData: {
        name: '',
        categoryId: '',
        status: 'active',
        initialValue: '',
        currentValue: '',
        dailyIncome: '',
        annualReturn: '',
        initialAmount: '',
        currentAmount: '',
        dailyCost: '',
        annualRate: '',
        notes: '',
        createDate: ''
      },
      statusOptions: [
        { label: '活跃', value: 'active' },
        { label: '暂停', value: 'paused' },
        { label: '已完成', value: 'completed' }
      ]
    }
  },

  computed: {
    typeText() {
      return this.type === 'asset' ? '资产' : '负债'
    },
    categoryOptions() {
      const settings = StorageManager.getSettings()
      return this.type === 'asset' ? settings.assetCategories : settings.liabilityCategories
    }
  },

  onLoad(options) {
    this.type = options.type || 'asset'
    this.isEdit = !!options.id
    this.editId = options.id || ''
    
    if (this.isEdit) {
      this.loadEditData()
    } else {
      this.initFormData()
    }
  },

  methods: {
    initFormData() {
      this.formData = {
        name: '',
        categoryId: this.categoryOptions[0]?.id || '',
        status: 'active',
        initialValue: '',
        currentValue: '',
        dailyIncome: '',
        annualReturn: '',
        initialAmount: '',
        currentAmount: '',
        dailyCost: '',
        annualRate: '',
        notes: '',
        createDate: new Date().toISOString().split('T')[0]
      }
      this.categoryIndex = 0
      this.statusIndex = 0
    },

    loadEditData() {
      let item
      if (this.type === 'asset') {
        const assets = StorageManager.getAssets()
        item = assets.find(a => a.id === this.editId)
      } else {
        const liabilities = StorageManager.getLiabilities()
        item = liabilities.find(l => l.id === this.editId)
      }

      if (item) {
        this.formData = { ...item }
        // 设置分类索引
        const categoryIndex = this.categoryOptions.findIndex(c => c.id === item.categoryId)
        this.categoryIndex = categoryIndex > -1 ? categoryIndex : 0
        // 设置状态索引
        const statusIndex = this.statusOptions.findIndex(s => s.value === item.status)
        this.statusIndex = statusIndex > -1 ? statusIndex : 0
      }
    },

    onCategoryChange(e) {
      this.categoryIndex = e.detail.value
      this.formData.categoryId = this.categoryOptions[this.categoryIndex].id
    },

    onStatusChange(e) {
      this.statusIndex = e.detail.value
      this.formData.status = this.statusOptions[this.statusIndex].value
    },

    onDateChange(e) {
      this.formData.createDate = e.detail.value
    },

    validateForm() {
      if (!this.formData.name.trim()) {
        uni.showToast({
          title: '请输入名称',
          icon: 'none'
        })
        return false
      }

      if (!this.formData.categoryId) {
        uni.showToast({
          title: '请选择分类',
          icon: 'none'
        })
        return false
      }

      if (this.type === 'asset') {
        if (!this.formData.initialValue || parseFloat(this.formData.initialValue) <= 0) {
          uni.showToast({
            title: '请输入有效的初始价值',
            icon: 'none'
          })
          return false
        }
      } else {
        if (!this.formData.initialAmount || parseFloat(this.formData.initialAmount) <= 0) {
          uni.showToast({
            title: '请输入有效的初始金额',
            icon: 'none'
          })
          return false
        }
      }

      return true
    },

    handleSave() {
      if (!this.validateForm()) {
        return
      }

      const saveData = {
        ...this.formData,
        updateTime: new Date().toISOString()
      }

      let success = false
      if (this.type === 'asset') {
        if (this.isEdit) {
          success = StorageManager.updateAsset(saveData)
        } else {
          success = StorageManager.addAsset(saveData)
        }
      } else {
        if (this.isEdit) {
          success = StorageManager.updateLiability(saveData)
        } else {
          success = StorageManager.addLiability(saveData)
        }
      }

      if (success) {
        uni.showToast({
          title: this.isEdit ? '更新成功' : '添加成功',
          icon: 'success'
        })
        setTimeout(() => {
          this.goBack()
        }, 1500)
      } else {
        uni.showToast({
          title: '操作失败',
          icon: 'none'
        })
      }
    },

    goBack() {
      uni.navigateBack()
    }
  }
}
</script>

<style scoped>
.edit-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 120rpx;
}

.header {
  background: white;
  padding: 30rpx 40rpx;
  border-bottom: 1rpx solid #e9ecef;
}

.header-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #212529;
}

.form-container {
  background: white;
  margin: 20rpx;
  border-radius: 16rpx;
  padding: 40rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.form-group {
  margin-bottom: 40rpx;
  position: relative;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #495057;
  font-weight: 500;
  margin-bottom: 16rpx;
}

.form-input {
  width: 100%;
  height: 80rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  border: 2rpx solid transparent;
  transition: all 0.3s ease;
}

.form-input:focus {
  border-color: #4A90E2;
  background: white;
}

.form-picker {
  width: 100%;
}

.picker-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 80rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #495057;
}

.picker-arrow {
  font-size: 20rpx;
  color: #adb5bd;
}

.form-textarea {
  width: 100%;
  height: 160rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  padding: 24rpx;
  font-size: 28rpx;
  border: 2rpx solid transparent;
  transition: all 0.3s ease;
  resize: none;
}

.form-textarea:focus {
  border-color: #4A90E2;
  background: white;
}

.char-count {
  position: absolute;
  bottom: 16rpx;
  right: 24rpx;
  font-size: 22rpx;
  color: #adb5bd;
}

.button-group {
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

.btn {
  flex: 1;
  height: 88rpx;
  border-radius: 12rpx;
  font-size: 32rpx;
  font-weight: bold;
  border: none;
  transition: all 0.3s ease;
}

.btn-cancel {
  background: #f8f9fa;
  color: #6c757d;
}

.btn-cancel:active {
  background: #e9ecef;
}

.btn-save {
  background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
  color: white;
}

.btn-save:active {
  transform: scale(0.98);
  opacity: 0.9;
}
</style>
