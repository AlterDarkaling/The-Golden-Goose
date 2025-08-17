Page({
  data: {
    type: 'asset',
    typeText: '资产',
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
    ],
    categoryOptions: []
  },

  onLoad(options) {
    const type = options.type || 'asset'
    this.setData({
      type: type,
      isEdit: !!options.id,
      editId: options.id || '',
      typeText: type === 'asset' ? '资产' : '负债'
    })
    
    this.loadCategoryOptions()
    
    if (this.data.isEdit) {
      this.loadEditData()
    } else {
      this.initFormData()
    }
  },

  loadCategoryOptions() {
    const settings = this.getSettings()
    const options = this.data.type === 'asset' ? settings.assetCategories : settings.liabilityCategories
    this.setData({
      categoryOptions: options
    })
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

  initFormData() {
    this.setData({
      formData: {
        name: '',
        categoryId: this.data.categoryOptions[0]?.id || '',
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
      },
      categoryIndex: 0,
      statusIndex: 0
    })
  },

  loadEditData() {
    // 这里可以添加加载编辑数据的逻辑
    // 暂时使用空数据
  },

  onCategoryChange(e) {
    this.setData({
      categoryIndex: e.detail.value,
      'formData.categoryId': this.data.categoryOptions[e.detail.value].id
    })
  },

  onStatusChange(e) {
    this.setData({
      statusIndex: e.detail.value,
      'formData.status': this.data.statusOptions[e.detail.value].value
    })
  },

  onDateChange(e) {
    this.setData({
      'formData.createDate': e.detail.value
    })
  },

  validateForm() {
    if (!this.data.formData.name.trim()) {
      wx.showToast({
        title: '请输入名称',
        icon: 'none'
      })
      return false
    }

    if (!this.data.formData.categoryId) {
      wx.showToast({
        title: '请选择分类',
        icon: 'none'
      })
      return false
    }

    if (this.data.type === 'asset') {
      if (!this.data.formData.initialValue || parseFloat(this.data.formData.initialValue) <= 0) {
        wx.showToast({
          title: '请输入有效的初始价值',
          icon: 'none'
        })
        return false
      }
    } else {
      if (!this.data.formData.initialAmount || parseFloat(this.data.formData.initialAmount) <= 0) {
        wx.showToast({
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

    // 这里可以添加保存逻辑
    wx.showToast({
      title: this.data.isEdit ? '更新成功' : '添加成功',
      icon: 'success'
    })
    setTimeout(() => {
      this.goBack()
    }, 1500)
  },

  goBack() {
    wx.navigateBack()
  }
})
