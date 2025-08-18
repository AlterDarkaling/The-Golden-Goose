const StorageManager = require('../../utils/storage.js')

Page({
  data: {
    goals: [],
    showAddGoal: false,
    newGoal: {
      title: '',
      targetAmount: '',
      currentAmount: '',
      deadline: '',
      category: 'savings',
      description: ''
    },
    categoryOptions: [
      { value: 'savings', label: '储蓄目标', icon: '💰' },
      { value: 'investment', label: '投资目标', icon: '📈' },
      { value: 'purchase', label: '购买目标', icon: '🛒' },
      { value: 'debt', label: '还债目标', icon: '💳' },
      { value: 'other', label: '其他目标', icon: '🎯' }
    ],
    categoryIndex: 0
  },

  onLoad() {
    this.loadGoals()
  },

  onShow() {
    this.loadGoals()
  },

  loadGoals() {
    try {
      const goals = wx.getStorageSync('financial_goals') || []
      // 处理目标数据，添加进度计算
      const processedGoals = goals.map(goal => ({
        ...goal,
        progress: this.calculateProgress(goal),
        daysLeft: this.calculateDaysLeft(goal.deadline),
        categoryInfo: this.getCategoryInfo(goal.category)
      }))
      
      this.setData({ goals: processedGoals })
    } catch (e) {
      console.error('加载目标失败:', e)
      this.setData({ goals: [] })
    }
  },

  calculateProgress(goal) {
    if (!goal.targetAmount || goal.targetAmount <= 0) return 0
    const progress = (goal.currentAmount / goal.targetAmount) * 100
    return Math.min(progress, 100)
  },

  calculateDaysLeft(deadline) {
    if (!deadline) return null
    const today = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  },

  getCategoryInfo(category) {
    return this.data.categoryOptions.find(opt => opt.value === category) || this.data.categoryOptions[0]
  },

  // 显示添加目标表单
  showAddGoalForm() {
    this.setData({
      showAddGoal: true,
      newGoal: {
        title: '',
        targetAmount: '',
        currentAmount: '0',
        deadline: '',
        category: 'savings',
        description: ''
      },
      categoryIndex: 0
    })
  },

  // 隐藏添加目标表单
  hideAddGoalForm() {
    this.setData({ showAddGoal: false })
  },

  // 分类选择
  onCategoryChange(e) {
    this.setData({
      categoryIndex: e.detail.value,
      'newGoal.category': this.data.categoryOptions[e.detail.value].value
    })
  },

  // 日期选择
  onDeadlineChange(e) {
    this.setData({
      'newGoal.deadline': e.detail.value
    })
  },

  // 输入事件处理
  onTitleInput(e) {
    this.setData({
      'newGoal.title': e.detail.value
    })
  },

  onTargetAmountInput(e) {
    this.setData({
      'newGoal.targetAmount': e.detail.value
    })
  },

  onCurrentAmountInput(e) {
    this.setData({
      'newGoal.currentAmount': e.detail.value
    })
  },

  onDescriptionInput(e) {
    this.setData({
      'newGoal.description': e.detail.value
    })
  },

  // 保存目标
  saveGoal() {
    const { newGoal } = this.data
    
    // 验证表单
    if (!newGoal.title.trim()) {
      wx.showToast({ title: '请输入目标名称', icon: 'none' })
      return
    }
    
    if (!newGoal.targetAmount || parseFloat(newGoal.targetAmount) <= 0) {
      wx.showToast({ title: '请输入有效的目标金额', icon: 'none' })
      return
    }

    if (!newGoal.deadline) {
      wx.showToast({ title: '请选择目标日期', icon: 'none' })
      return
    }

    // 创建新目标
    const goal = {
      id: Date.now().toString(),
      title: newGoal.title.trim(),
      targetAmount: parseFloat(newGoal.targetAmount),
      currentAmount: parseFloat(newGoal.currentAmount) || 0,
      deadline: newGoal.deadline,
      category: newGoal.category,
      description: newGoal.description.trim(),
      createTime: new Date().toISOString(),
      status: 'active'
    }

    // 保存到本地存储
    try {
      const goals = wx.getStorageSync('financial_goals') || []
      goals.push(goal)
      wx.setStorageSync('financial_goals', goals)
      
      wx.showToast({ title: '目标添加成功', icon: 'success' })
      this.hideAddGoalForm()
      this.loadGoals()
    } catch (e) {
      console.error('保存目标失败:', e)
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  },

  // 更新目标进度
  updateProgress(e) {
    const { goalId } = e.currentTarget.dataset
    const goal = this.data.goals.find(g => g.id === goalId)
    
    if (!goal) return

    wx.showModal({
      title: '更新进度',
      content: `当前进度：¥${goal.currentAmount.toFixed(2)}\n目标金额：¥${goal.targetAmount.toFixed(2)}`,
      editable: true,
      placeholderText: '请输入当前金额',
      success: (res) => {
        if (res.confirm && res.content) {
          const newAmount = parseFloat(res.content)
          if (isNaN(newAmount) || newAmount < 0) {
            wx.showToast({ title: '请输入有效金额', icon: 'none' })
            return
          }
          
          this.updateGoalAmount(goalId, newAmount)
        }
      }
    })
  },

  updateGoalAmount(goalId, newAmount) {
    try {
      const goals = wx.getStorageSync('financial_goals') || []
      const goalIndex = goals.findIndex(g => g.id === goalId)
      
      if (goalIndex !== -1) {
        goals[goalIndex].currentAmount = newAmount
        wx.setStorageSync('financial_goals', goals)
        
        // 检查是否完成目标
        if (newAmount >= goals[goalIndex].targetAmount) {
          wx.showModal({
            title: '🎉 恭喜完成目标！',
            content: `您已成功达成"${goals[goalIndex].title}"的目标！`,
            showCancel: false
          })
          goals[goalIndex].status = 'completed'
          wx.setStorageSync('financial_goals', goals)
        }
        
        wx.showToast({ title: '进度更新成功', icon: 'success' })
        this.loadGoals()
      }
    } catch (e) {
      console.error('更新进度失败:', e)
      wx.showToast({ title: '更新失败', icon: 'none' })
    }
  },

  // 删除目标
  deleteGoal(e) {
    const { goalId } = e.currentTarget.dataset
    const goal = this.data.goals.find(g => g.id === goalId)
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除目标"${goal.title}"吗？`,
      success: (res) => {
        if (res.confirm) {
          try {
            const goals = wx.getStorageSync('financial_goals') || []
            const filteredGoals = goals.filter(g => g.id !== goalId)
            wx.setStorageSync('financial_goals', filteredGoals)
            
            wx.showToast({ title: '删除成功', icon: 'success' })
            this.loadGoals()
          } catch (e) {
            console.error('删除目标失败:', e)
            wx.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      }
    })
  },

  // 查看目标详情
  viewGoalDetail(e) {
    const { goalId } = e.currentTarget.dataset
    const goal = this.data.goals.find(g => g.id === goalId)
    
    if (!goal) return

    const progressText = `进度：¥${goal.currentAmount.toFixed(2)} / ¥${goal.targetAmount.toFixed(2)} (${goal.progress.toFixed(1)}%)`
    const timeText = goal.daysLeft > 0 ? `还有${goal.daysLeft}天` : goal.daysLeft === 0 ? '今天到期' : `已过期${Math.abs(goal.daysLeft)}天`
    
    const content = `${goal.categoryInfo.icon} ${goal.categoryInfo.label}\n\n${progressText}\n⏰ ${timeText}\n\n📝 ${goal.description || '暂无描述'}`

    wx.showModal({
      title: goal.title,
      content,
      showCancel: false
    })
  },

  formatMoney(amount) {
    return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }
})
