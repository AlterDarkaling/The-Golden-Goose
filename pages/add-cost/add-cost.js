Page({
  data: {
    itemId: '',
    itemType: 'asset',
    itemName: '',
    formData: {
      name: '',
      type: '',
      amount: '',
      date: '',
      description: '',
      affectNetWorth: true
    },
    costTypes: [
      { label: '维修费', value: 'repair' },
      { label: '保养费', value: 'maintenance' },
      { label: '保险费', value: 'insurance' },
      { label: '税费', value: 'tax' },
      { label: '升级费', value: 'upgrade' },
      { label: '配件费', value: 'parts' },
      { label: '服务费', value: 'service' },
      { label: '其他费用', value: 'other' }
    ],
    costTypeIndex: 0
  },

  onLoad(options) {
    const { itemId, type } = options
    if (!itemId || !type) {
      wx.showToast({
        title: '参数错误',
        icon: 'error'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      return
    }

    this.setData({
      itemId: itemId,
      itemType: type,
      'formData.date': this.getCurrentDate()
    })

    this.loadItemInfo()
  },

  // 加载项目信息
  loadItemInfo() {
    const { itemId, itemType } = this.data
    const dataKey = itemType === 'asset' ? 'assets_data' : 'liabilities_data'
    
    try {
      const items = wx.getStorageSync(dataKey) || []
      const item = items.find(item => item.id === itemId)
      
      if (item) {
        this.setData({
          itemName: item.name || '未命名项目'
        })
      }
    } catch (error) {
      console.error('加载项目信息失败:', error)
    }
  },

  // 获取当前日期
  getCurrentDate() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  // 输入事件处理
  onNameInput(e) {
    this.setData({
      'formData.name': e.detail.value
    })
  },

  onAmountInput(e) {
    this.setData({
      'formData.amount': e.detail.value
    })
  },

  onDescriptionInput(e) {
    this.setData({
      'formData.description': e.detail.value
    })
  },

  onCostTypeChange(e) {
    const index = e.detail.value
    this.setData({
      costTypeIndex: index,
      'formData.type': this.data.costTypes[index].value
    })
  },

  onDateChange(e) {
    this.setData({
      'formData.date': e.detail.value
    })
  },

  onAffectNetWorthChange(e) {
    this.setData({
      'formData.affectNetWorth': e.detail.value
    })
  },

  // 表单验证
  validateForm() {
    const { formData } = this.data

    if (!formData.name.trim()) {
      wx.showToast({
        title: '请输入费用名称',
        icon: 'none'
      })
      return false
    }

    if (!formData.type) {
      wx.showToast({
        title: '请选择费用类型',
        icon: 'none'
      })
      return false
    }

    if (!formData.amount || isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      wx.showToast({
        title: '请输入有效的费用金额',
        icon: 'none'
      })
      return false
    }

    if (!formData.date) {
      wx.showToast({
        title: '请选择发生日期',
        icon: 'none'
      })
      return false
    }

    return true
  },

  // 保存费用
  handleSave() {
    if (!this.validateForm()) {
      return
    }

    const { itemId, itemType, formData } = this.data
    
    // 创建费用记录
    const costRecord = {
      id: this.generateId(),
      itemId: itemId,
      itemType: itemType,
      name: formData.name.trim(),
      type: formData.type,
      amount: parseFloat(formData.amount),
      date: formData.date,
      description: formData.description.trim(),
      affectNetWorth: formData.affectNetWorth,
      createTime: new Date().toISOString()
    }

    try {
      // 保存到其他费用数据
      let allCosts = wx.getStorageSync('other_costs_data') || []
      allCosts.push(costRecord)
      wx.setStorageSync('other_costs_data', allCosts)

      // 如果影响净值，更新资产价值
      if (formData.affectNetWorth && itemType === 'asset') {
        this.updateAssetValue(costRecord)
      }

      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })

      setTimeout(() => {
        wx.navigateBack()
      }, 1500)

    } catch (error) {
      console.error('保存费用失败:', error)
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'error'
      })
    }
  },

  // 更新资产价值
  updateAssetValue(costRecord) {
    try {
      let assets = wx.getStorageSync('assets_data') || []
      const assetIndex = assets.findIndex(asset => asset.id === costRecord.itemId)
      
      if (assetIndex !== -1) {
        const asset = assets[assetIndex]
        const currentValue = asset.currentValue || asset.originalValue || asset.initialValue || 0
        asset.currentValue = Math.max(0, currentValue - costRecord.amount)
        
        assets[assetIndex] = asset
        wx.setStorageSync('assets_data', assets)
      }
    } catch (error) {
      console.error('更新资产价值失败:', error)
    }
  },

  // 生成ID
  generateId() {
    return 'cost_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  },

  // 取消操作
  handleCancel() {
    wx.showModal({
      title: '确认取消',
      content: '确定要取消添加费用吗？未保存的数据将丢失',
      success: (res) => {
        if (res.confirm) {
          wx.navigateBack()
        }
      }
    })
  }
})
