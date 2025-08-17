Page({
  data: {
    type: 'asset',
    itemId: '',
    itemData: {},
    categoryName: '',
    statusText: '',
    displayAmount: '0.00',
    createDate: ''
  },

  onLoad(options) {
    this.setData({
      type: options.type || 'asset',
      itemId: options.id || ''
    })
    this.loadItemData()
  },

  loadItemData() {
    let item
    if (this.data.type === 'asset') {
      const assets = wx.getStorageSync('assets_data') || []
      item = assets.find(a => a.id === this.data.itemId)
    } else {
      const liabilities = wx.getStorageSync('liabilities_data') || []
      item = liabilities.find(l => l.id === this.data.itemId)
    }

    if (item) {
      this.setData({
        itemData: item,
        categoryName: this.getCategoryName(item.categoryId),
        statusText: this.getStatusText(item.status),
        displayAmount: this.formatNumber(this.data.type === 'asset' ? (item.currentValue || item.initialValue) : (item.currentAmount || item.initialAmount)),
        createDate: this.formatDate(item.createTime)
      })
    } else {
      wx.showToast({
        title: '数据不存在',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  getCategoryName(categoryId) {
    const settings = this.getSettings()
    if (this.data.type === 'asset') {
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

  getSettings() {
    try {
      return wx.getStorageSync('app_settings') || this.getDefaultSettings()
    } catch (e) {
      return this.getDefaultSettings()
    }
  },

  getDefaultSettings() {
    return {
      assetCategories: [
        { id: 'investment', name: '投资理财', color: '#4CAF50' },
        { id: 'business', name: '经营性资产', color: '#2196F3' },
        { id: 'intellectual', name: '知识产权', color: '#9C27B0' },
        { id: 'real_estate', name: '房地产', color: '#FF9800' },
        { id: 'other_assets', name: '其他资产', color: '#607D8B' }
      ],
      liabilityCategories: [
        { id: 'consumer_loan', name: '消费贷款', color: '#F44336' },
        { id: 'business_loan', name: '经营性负债', color: '#E91E63' },
        { id: 'credit_card', name: '信用卡', color: '#9C27B0' },
        { id: 'mortgage', name: '房贷', color: '#673AB7' },
        { id: 'other_liabilities', name: '其他负债', color: '#795548' }
      ]
    }
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
    wx.navigateTo({
      url: `/pages/edit/edit?type=${this.data.type}&id=${this.data.itemId}`
    })
  },

  handleDelete() {
    wx.showModal({
      title: '确认删除',
      content: `确定要删除这个${this.data.type === 'asset' ? '资产' : '负债'}吗？`,
      success: (res) => {
        if (res.confirm) {
          // 这里可以添加删除逻辑
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          })
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        }
      }
    })
  }
})
