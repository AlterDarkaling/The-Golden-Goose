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
      { label: '使用中', value: 'active' },
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
    const StorageManager = require('../../utils/storage.js')
    const { type, editId } = this.data
    
    let item
    if (type === 'asset') {
      const assets = StorageManager.getAssets()
      item = assets.find(a => a.id === editId)
    } else {
      const liabilities = StorageManager.getLiabilities()
      item = liabilities.find(l => l.id === editId)
    }

    if (item) {
      // 找到对应的分类索引
      const categoryIndex = this.data.categoryOptions.findIndex(cat => cat.id === item.categoryId)
      const statusIndex = this.data.statusOptions.findIndex(status => status.value === item.status)

      this.setData({
        formData: {
          name: item.name || '',
          categoryId: item.categoryId || '',
          status: item.status || 'active',
          initialValue: item.initialValue ? item.initialValue.toString() : '',
          currentValue: item.currentValue ? item.currentValue.toString() : '',
          dailyIncome: item.dailyIncome ? item.dailyIncome.toString() : '',
          annualReturn: item.annualReturn ? item.annualReturn.toString() : '',
          initialAmount: item.initialAmount ? item.initialAmount.toString() : '',
          currentAmount: item.currentAmount ? item.currentAmount.toString() : '',
          dailyCost: item.dailyCost ? item.dailyCost.toString() : '',
          annualRate: item.annualRate ? item.annualRate.toString() : '',
          notes: item.notes || '',
          createDate: item.createDate || new Date().toISOString().split('T')[0]
        },
        categoryIndex: categoryIndex >= 0 ? categoryIndex : 0,
        statusIndex: statusIndex >= 0 ? statusIndex : 0
      })
    } else {
      wx.showToast({
        title: '数据不存在',
        icon: 'none'
      })
      setTimeout(() => {
        this.goBack()
      }, 1500)
    }
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

  // 输入事件处理
  onNameInput(e) {
    this.setData({
      'formData.name': e.detail.value
    })
  },

  onInitialValueInput(e) {
    this.setData({
      'formData.initialValue': e.detail.value
    })
  },

  onCurrentValueInput(e) {
    this.setData({
      'formData.currentValue': e.detail.value
    })
  },

  onDailyIncomeInput(e) {
    this.setData({
      'formData.dailyIncome': e.detail.value
    })
  },

  onAnnualReturnInput(e) {
    this.setData({
      'formData.annualReturn': e.detail.value
    })
  },

  onInitialAmountInput(e) {
    this.setData({
      'formData.initialAmount': e.detail.value
    })
  },

  onCurrentAmountInput(e) {
    this.setData({
      'formData.currentAmount': e.detail.value
    })
  },

  onDailyCostInput(e) {
    this.setData({
      'formData.dailyCost': e.detail.value
    })
  },

  onAnnualRateInput(e) {
    this.setData({
      'formData.annualRate': e.detail.value
    })
  },

  onNotesInput(e) {
    this.setData({
      'formData.notes': e.detail.value
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

    const StorageManager = require('../../utils/storage.js')
    const { formData, type, isEdit, editId } = this.data

    // 构建保存数据
    const saveData = {
      name: formData.name.trim(),
      categoryId: formData.categoryId,
      status: formData.status,
      notes: formData.notes.trim(),
      createDate: formData.createDate
    }

    // 根据类型添加特定字段
    if (type === 'asset') {
      saveData.initialValue = parseFloat(formData.initialValue) || 0
      saveData.currentValue = parseFloat(formData.currentValue) || parseFloat(formData.initialValue) || 0
      saveData.dailyIncome = parseFloat(formData.dailyIncome) || 0
      saveData.annualReturn = parseFloat(formData.annualReturn) || 0
    } else {
      saveData.initialAmount = parseFloat(formData.initialAmount) || 0
      saveData.currentAmount = parseFloat(formData.currentAmount) || parseFloat(formData.initialAmount) || 0
      saveData.dailyCost = parseFloat(formData.dailyCost) || 0
      saveData.annualRate = parseFloat(formData.annualRate) || 0
    }

    let success = false
    if (isEdit) {
      // 更新数据
      if (type === 'asset') {
        success = StorageManager.updateAsset(editId, saveData)
      } else {
        success = StorageManager.updateLiability(editId, saveData)
      }
    } else {
      // 添加新数据
      if (type === 'asset') {
        success = StorageManager.addAsset(saveData)
      } else {
        success = StorageManager.addLiability(saveData)
      }
    }

    if (success) {
      wx.showToast({
        title: isEdit ? '更新成功' : '添加成功',
        icon: 'success'
      })
      setTimeout(() => {
        this.goBack()
      }, 1500)
    } else {
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none'
      })
    }
  },

  goBack() {
    wx.navigateBack()
  }
})
