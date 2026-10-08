const StorageManager = require('../../utils/storage.js')
const { SmartStorage } = require('../../utils/apiClient.js')  // 新增：云端API支持

Page({
  data: {
    // 主题相关
    isDarkTheme: false,
    goals: [],
    showAddGoal: false,
    showUpdateGoal: false,
    goalTemplates: [],
    currentGoal: null,
    addAmount: '',
    previewProgress: '0.0',
    previewAmountText: '0.00',
    newGoal: {
      title: '',
      targetAmount: '',
      currentAmount: '',
      deadline: '',
      category: 'emergency',
      description: ''
    },
    categoryOptions: [
      { value: 'emergency', label: '应急储蓄', icon: '🛡️', description: '建议6个月生活费' },
      { value: 'house', label: '购房基金', icon: '🏠', description: '首付、装修等' },
      { value: 'education', label: '教育基金', icon: '🎓', description: '学费、培训等' },
      { value: 'travel', label: '旅行基金', icon: '✈️', description: '旅游、度假等' },
      { value: 'investment', label: '投资基金', icon: '📈', description: '股票、基金等' },
      { value: 'retirement', label: '养老储蓄', icon: '👴', description: '退休规划' },
      { value: 'car', label: '购车基金', icon: '🚗', description: '购车、换车等' },
      { value: 'wedding', label: '婚礼基金', icon: '💒', description: '结婚相关费用' },
      { value: 'health', label: '健康基金', icon: '🏥', description: '医疗、保险等' },
      { value: 'debt', label: '还债目标', icon: '💳', description: '信用卡、贷款等' },
      { value: 'gift', label: '礼物基金', icon: '🎁', description: '节日、生日礼物' },
      { value: 'other', label: '其他目标', icon: '🎯', description: '自定义目标' }
    ],
    categoryIndex: 0
  },

  onLoad() {
    // 初始化主题
    const app = getApp()
    const isDarkTheme = app.globalData ? app.globalData.isDarkTheme : false
    this.setData({ isDarkTheme })
    this.setTheme(isDarkTheme)
    this.loadGoals()
  },

  onShow() {
    // 同步主题状态
    const app = getApp()
    if (app.globalData) {
      const isDarkTheme = app.globalData.isDarkTheme
      this.setData({ isDarkTheme })
      this.setTheme(isDarkTheme)
    }
    this.loadGoals()
  },

  // 设置页面主题
  setTheme(isDark) {
    try {
      wx.setNavigationBarColor({
        frontColor: isDark ? '#ffffff' : '#000000',
        backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
        animation: {
          duration: 100,
          timingFunc: 'easeInOut'
        }
      })
      if (wx.setBackgroundColor) {
        const bgColor = isDark ? '#1e1e1e' : '#ffffff'
        wx.setBackgroundColor({
          backgroundColor: bgColor,
          backgroundColorTop: bgColor,
          backgroundColorBottom: bgColor
        })
        setTimeout(() => {
          wx.setBackgroundColor({
            backgroundColor: bgColor,
            backgroundColorTop: bgColor,
            backgroundColorBottom: bgColor
          })
        }, 50)
      }
      this.setData({
        isDarkTheme: isDark
      })
    } catch (error) {
      console.error('设置页面主题失败:', error)
    }
  },

  async loadGoals() {
    try {
      // 使用 SmartStorage 自动选择本地或云端
      const goals = await SmartStorage.getSavingGoals()
      // 处理目标数据，添加进度计算和智能建议
      const processedGoals = goals.map(goal => {
        const progress = this.calculateProgress(goal)
        const daysLeft = this.calculateDaysLeft(goal.deadline)
        const categoryInfo = this.getCategoryInfo(goal.category)
        const analysis = this.analyzeGoal(goal)
        
        // 预计算显示文本
        const progressText = progress.toFixed(1)
        const progressPercent = progress.toFixed(0)
        const dailyAdviceText = analysis && analysis.advice ? analysis.advice.dailyNeeded.toFixed(2) : '0.00'
        const monthlyAdviceText = analysis && analysis.advice ? analysis.advice.monthlyNeeded.toFixed(2) : '0.00'
        
        // 计算剩余天数显示文本
        let daysLeftText = ''
        if (daysLeft > 0) {
          daysLeftText = `还有${daysLeft}天`
        } else if (daysLeft === 0) {
          daysLeftText = '今天到期'
        } else {
          daysLeftText = `已过期${Math.abs(daysLeft)}天`
        }
        
        return {
          ...goal,
          progress,
          daysLeft,
          categoryInfo,
          analysis,
          advice: analysis ? analysis.advice : null,
          // 预计算的显示文本
          progressText,
          progressPercent,
          dailyAdviceText,
          monthlyAdviceText,
          daysLeftText,
          // 预格式化的金额显示文本
          currentAmountText: this.formatMoney(goal.currentAmount),
          targetAmountText: this.formatMoney(goal.targetAmount)
        }
      })
      
      // 按优先级和进度排序
      processedGoals.sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 }
        const aPriority = a.analysis ? priorityOrder[a.analysis.priority] : 1
        const bPriority = b.analysis ? priorityOrder[b.analysis.priority] : 1
        
        if (aPriority !== bPriority) return bPriority - aPriority
        return a.progress - b.progress // 进度低的排前面
      })
      
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
    const defaultCategory = 'emergency'
    const templates = this.getGoalTemplates(defaultCategory)
    
    this.setData({
      showAddGoal: true,
      newGoal: {
        title: '',
        targetAmount: '',
        currentAmount: '0',
        deadline: '',
        category: defaultCategory,
        description: ''
      },
      categoryIndex: 0,
      goalTemplates: templates
    })
  },

  // 隐藏添加目标表单
  hideAddGoalForm() {
    this.setData({ showAddGoal: false })
  },

  // 分类选择
  onCategoryChange(e) {
    const selectedCategory = this.data.categoryOptions[e.detail.value].value
    const templates = this.getGoalTemplates(selectedCategory)
    
    this.setData({
      categoryIndex: e.detail.value,
      'newGoal.category': selectedCategory,
      goalTemplates: templates
    })
  },

  // 选择模板
  selectTemplate(e) {
    const template = e.currentTarget.dataset.template
    const amount = template.amount || (template.months * template.multiplier)
    
    this.setData({
      'newGoal.title': template.name,
      'newGoal.targetAmount': amount.toString(),
      'newGoal.description': `基于${template.name}模板创建的目标`
    })
    
    wx.showToast({
      title: '模板已应用',
      icon: 'success'
    })
  },

  // 显示建议详情
  showAdviceDetail(e) {
    const { goalId } = e.currentTarget.dataset
    const goal = this.data.goals.find(g => g.id === goalId)
    
    if (!goal || !goal.analysis) return

    const { analysis, advice } = goal
    let content = `📊 储蓄计划建议：\n\n`
    
    if (advice) {
      content += `💰 还需储蓄：¥${this.formatMoney(advice.remaining)}\n`
      content += `📅 剩余时间：${advice.daysLeft}天\n\n`
      content += `💡 储蓄建议：\n`
      content += `• 每日储蓄：¥${advice.dailyNeeded.toFixed(2)}\n`
      content += `• 每周储蓄：¥${advice.weeklyNeeded.toFixed(2)}\n`
      content += `• 每月储蓄：¥${advice.monthlyNeeded.toFixed(2)}\n\n`
    }
    
    if (analysis.suggestions.length > 0) {
      content += `🎯 专家建议：\n`
      analysis.suggestions.forEach(suggestion => {
        content += `• ${suggestion}\n`
      })
    }

    wx.showModal({
      title: `${goal.categoryInfo.icon} ${goal.title}`,
      content,
      showCancel: false,
      confirmText: '知道了'
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
  async saveGoal() {
    const { newGoal } = this.data
    
    // 验证表单
    if (!newGoal.title.trim()) {
      wx.showToast({ title: '请输入储蓄罐名称', icon: 'none' })
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
      title: newGoal.title.trim(),
      targetAmount: parseFloat(newGoal.targetAmount),
      currentAmount: parseFloat(newGoal.currentAmount) || 0,
      deadline: newGoal.deadline,
      category: newGoal.category,
      description: newGoal.description.trim(),
      createTime: new Date().toISOString(),
      status: 'active'
    }

    // 使用 SmartStorage 保存
    try {
      await SmartStorage.saveSavingGoal(goal)
      
      wx.showToast({ title: '储蓄罐创建成功', icon: 'success' })
      this.hideAddGoalForm()
      this.loadGoals()
    } catch (e) {
      console.error('保存目标失败:', e)
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  },

  // 显示更新进度界面
  updateProgress(e) {
    const { goalId } = e.currentTarget.dataset
    const goal = this.data.goals.find(g => g.id === goalId)
    
    if (!goal) return

    const previewProgress = ((goal.currentAmount / goal.targetAmount) * 100).toFixed(1)
    
    // 预计算显示文本，避免WXML中的复杂计算
    const goalWithDisplayText = {
      ...goal,
      currentAmountText: this.formatMoney(goal.currentAmount),
      targetAmountText: this.formatMoney(goal.targetAmount),
      remainingAmountText: this.formatMoney(goal.targetAmount - goal.currentAmount)
    }

    this.setData({
      showUpdateGoal: true,
      currentGoal: goalWithDisplayText,
      addAmount: '',
      previewProgress: previewProgress,
      previewAmountText: goalWithDisplayText.currentAmountText
    })
  },

  // 隐藏更新界面
  hideUpdateGoal() {
    this.setData({
      showUpdateGoal: false,
      currentGoal: null,
      addAmount: '',
      previewProgress: '0.0',
      previewAmountText: '0.00'
    })
  },

  // 添加金额输入
  onAddAmountInput(e) {
    const addAmount = e.detail.value
    const { currentGoal } = this.data
    const addAmountNum = parseFloat(addAmount || 0)
    const newTotalAmount = currentGoal.currentAmount + addAmountNum
    const previewProgress = currentGoal ? ((newTotalAmount / currentGoal.targetAmount) * 100).toFixed(1) : '0.0'
    const previewAmountText = this.formatMoney(newTotalAmount)
    
    this.setData({
      addAmount: addAmount,
      previewProgress: previewProgress,
      previewAmountText: previewAmountText
    })
  },



  // 确认添加
  confirmUpdate() {
    const { addAmount, currentGoal } = this.data
    const addAmountNum = parseFloat(addAmount)
    
    if (isNaN(addAmountNum) || addAmountNum <= 0) {
      wx.showToast({ title: '请输入有效的添加金额', icon: 'none' })
      return
    }
    
    const newTotalAmount = currentGoal.currentAmount + addAmountNum
    this.updateGoalAmount(currentGoal.id, newTotalAmount)
    this.hideUpdateGoal()
  },

  async updateGoalAmount(goalId, newAmount) {
    try {
      const goals = await SmartStorage.getSavingGoals()
      const goal = goals.find(g => g.id === goalId)
      
      if (goal) {
        goal.currentAmount = newAmount
        
        // 检查是否完成目标
        if (newAmount >= goal.targetAmount) {
          goal.status = 'completed'
          
          wx.showModal({
            title: '🎉 恭喜梦想达成！',
            content: `您已成功完成"${goal.title}"储蓄罐！`,
            showCancel: false
          })
        }
        
        await SmartStorage.saveSavingGoal(goal)
        
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
      content: `确定要删除储蓄罐"${goal.title}"吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await SmartStorage.deleteSavingGoal(goalId)
            
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
    const num = parseFloat(amount) || 0
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  },

  // 计算储蓄建议
  calculateSavingsAdvice(goal) {
    const remaining = goal.targetAmount - goal.currentAmount
    const daysLeft = this.calculateDaysLeft(goal.deadline)
    
    if (daysLeft <= 0 || remaining <= 0) return null
    
    const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30))
    const weeksLeft = Math.max(1, Math.ceil(daysLeft / 7))
    
    const monthlyNeeded = remaining / monthsLeft
    const weeklyNeeded = remaining / weeksLeft
    const dailyNeeded = remaining / daysLeft
    
    return {
      remaining,
      monthsLeft,
      weeksLeft,
      daysLeft,
      monthlyNeeded,
      weeklyNeeded,
      dailyNeeded
    }
  },

  // 获取目标模板建议
  getGoalTemplates(category) {
    const templates = {
      emergency: [
        { name: '基础应急金', months: 3, multiplier: 3000 },
        { name: '标准应急金', months: 6, multiplier: 3000 },
        { name: '充足应急金', months: 9, multiplier: 3000 },
        { name: '安全应急金', months: 12, multiplier: 3000 }
      ],
      house: [
        { name: '首付20%', amount: 200000 },
        { name: '首付30%', amount: 300000 },
        { name: '全款购房', amount: 800000 },
        { name: '装修基金', amount: 100000 }
      ],
      education: [
        { name: '技能培训', amount: 5000 },
        { name: '学历提升', amount: 20000 },
        { name: '职业认证', amount: 15000 },
        { name: '子女教育', amount: 50000 }
      ],
      travel: [
        { name: '国内游', amount: 5000 },
        { name: '周边游', amount: 2000 },
        { name: '出境游', amount: 15000 },
        { name: '深度游', amount: 30000 }
      ],
      car: [
        { name: '代步车', amount: 50000 },
        { name: '经济型车', amount: 80000 },
        { name: '舒适型车', amount: 150000 },
        { name: '豪华型车', amount: 300000 }
      ],
      wedding: [
        { name: '简约婚礼', amount: 50000 },
        { name: '标准婚礼', amount: 100000 },
        { name: '精致婚礼', amount: 150000 },
        { name: '豪华婚礼', amount: 200000 }
      ],
      investment: [
        { name: '入门投资', amount: 10000 },
        { name: '稳健投资', amount: 50000 },
        { name: '进阶投资', amount: 100000 },
        { name: '大额投资', amount: 500000 }
      ],
      retirement: [
        { name: '基础养老', amount: 200000 },
        { name: '舒适养老', amount: 500000 },
        { name: '优质养老', amount: 1000000 },
        { name: '无忧养老', amount: 2000000 }
      ],
      health: [
        { name: '基础保障', amount: 20000 },
        { name: '全面保障', amount: 50000 },
        { name: '高端医疗', amount: 100000 },
        { name: '顶级保障', amount: 200000 }
      ],
      gift: [
        { name: '节日礼品', amount: 2000 },
        { name: '生日礼品', amount: 5000 },
        { name: '纪念礼品', amount: 10000 },
        { name: '特殊礼品', amount: 20000 }
      ]
    }
    
    const categoryTemplates = templates[category] || []
    
    // 为每个模板预格式化金额显示文本
    return categoryTemplates.map(template => {
      const amount = template.amount || (template.months * template.multiplier)
      return {
        ...template,
        amountText: this.formatMoney(amount)
      }
    })
  },

  // 智能目标分析
  analyzeGoal(goal) {
    const advice = this.calculateSavingsAdvice(goal)
    if (!advice) return null
    
    let priority = 'normal'
    let suggestions = []
    
    // 根据储蓄类型给出优先级建议
    if (goal.category === 'emergency') {
      priority = 'high'
      suggestions.push('应急储蓄是理财基础，建议优先完成')
    } else if (goal.category === 'debt') {
      priority = 'high'
      suggestions.push('还债储蓄建议优先处理，减少利息支出')
    }
    
    // 根据时间紧迫性给出建议
    if (advice.daysLeft <= 30) {
      priority = 'urgent'
      suggestions.push('储蓄罐即将到期，建议加大储蓄力度')
    } else if (advice.daysLeft <= 90) {
      suggestions.push('时间相对紧张，建议制定详细储蓄计划')
    }
    
    // 根据金额大小给出建议
    if (advice.dailyNeeded > 100) {
      suggestions.push('每日储蓄金额较大，建议检查预算合理性')
    } else if (advice.dailyNeeded < 10) {
      suggestions.push('每日储蓄压力较小，可以轻松达成')
    }
    
    return {
      priority,
      suggestions,
      advice
    }
  }
})
