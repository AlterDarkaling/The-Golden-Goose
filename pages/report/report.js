const StorageManager = require('../../utils/storage.js')

Page({
  data: {
    reportData: {
      totalAssets: 0,
      totalLiabilities: 0,
      netWorth: 0,
      dailyIncome: 0,
      dailyCost: 0,
      dailyNet: 0,
      monthlyProjection: 0,
      yearlyProjection: 0
    },
    assetCategories: [],
    liabilityCategories: [],
    chartData: {
      assets: [],
      liabilities: []
    }
  },

  onLoad() {
    this.generateReport()
  },

  onShow() {
    this.generateReport()
  },

  generateReport() {
    const assets = StorageManager.getAssets()
    const liabilities = StorageManager.getLiabilities()
    const settings = StorageManager.getSettings()

    // 计算基本财务数据
    const totalAssets = assets.reduce((sum, asset) => sum + (asset.currentValue || asset.initialValue || 0), 0)
    const totalLiabilities = liabilities.reduce((sum, liability) => sum + (liability.currentAmount || liability.initialAmount || 0), 0)
    const netWorth = totalAssets - totalLiabilities
    const dailyIncome = StorageManager.calculateDailyIncome()
    const dailyCost = StorageManager.calculateDailyCost()
    const dailyNet = dailyIncome - dailyCost

    // 计算资产分类统计
    const assetCategories = this.calculateCategoryStats(assets, settings.assetCategories, 'asset')
    const liabilityCategories = this.calculateCategoryStats(liabilities, settings.liabilityCategories, 'liability')

    this.setData({
      reportData: {
        totalAssets,
        totalLiabilities,
        netWorth,
        dailyIncome,
        dailyCost,
        dailyNet,
        monthlyProjection: dailyNet * 30,
        yearlyProjection: dailyNet * 365
      },
      assetCategories,
      liabilityCategories
    })
  },

  calculateCategoryStats(items, categories, type) {
    const stats = categories.map(category => {
      const categoryItems = items.filter(item => item.categoryId === category.id)
      const total = categoryItems.reduce((sum, item) => {
        if (type === 'asset') {
          return sum + (item.currentValue || item.initialValue || 0)
        } else {
          return sum + (item.currentAmount || item.initialAmount || 0)
        }
      }, 0)

      return {
        ...category,
        count: categoryItems.length,
        total,
        percentage: 0 // 将在后面计算
      }
    }).filter(stat => stat.count > 0)

    // 计算百分比
    const grandTotal = stats.reduce((sum, stat) => sum + stat.total, 0)
    stats.forEach(stat => {
      stat.percentage = grandTotal > 0 ? ((stat.total / grandTotal) * 100).toFixed(1) : 0
    })

    return stats
  },

  formatMoney(amount) {
    return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  },

  formatMoneyShort(amount) {
    if (Math.abs(amount) >= 10000) {
      return (amount / 10000).toFixed(1) + '万'
    }
    return amount.toFixed(0)
  },

  // 导出报告
  exportReport() {
    const { reportData, assetCategories, liabilityCategories } = this.data
    const reportText = `
📊 财务报告 - ${new Date().toLocaleDateString()}

💰 资产负债概况：
• 总资产：¥${this.formatMoney(reportData.totalAssets)}
• 总负债：¥${this.formatMoney(reportData.totalLiabilities)}
• 净资产：¥${this.formatMoney(reportData.netWorth)}

📈 现金流分析：
• 每日收益：¥${reportData.dailyIncome.toFixed(2)}
• 每日成本：¥${reportData.dailyCost.toFixed(2)}
• 每日净收益：¥${reportData.dailyNet.toFixed(2)}
• 月度预测：¥${this.formatMoney(reportData.monthlyProjection)}
• 年度预测：¥${this.formatMoney(reportData.yearlyProjection)}

💎 资产分类分析：
${assetCategories.map(cat => `• ${cat.name}：¥${this.formatMoney(cat.total)} (${cat.percentage}%)`).join('\n')}

💳 负债分类分析：
${liabilityCategories.map(cat => `• ${cat.name}：¥${this.formatMoney(cat.total)} (${cat.percentage}%)`).join('\n')}
    `.trim()

    wx.showModal({
      title: '财务报告',
      content: '报告已生成，您可以复制以下内容保存：',
      confirmText: '查看详情',
      success: (res) => {
        if (res.confirm) {
          wx.showModal({
            title: '详细报告',
            content: reportText,
            showCancel: false
          })
        }
      }
    })
  },

  // 分析建议
  showAnalysis() {
    const { reportData } = this.data
    let advice = '💡 财务分析建议：\n\n'

    if (reportData.netWorth > 0) {
      advice += '✅ 您的净资产为正，财务状况良好！\n\n'
    } else {
      advice += '⚠️ 您的净资产为负，建议优化资产配置。\n\n'
    }

    if (reportData.dailyNet > 0) {
      advice += `✅ 您每日净收益¥${reportData.dailyNet.toFixed(2)}，按此速度年收益约¥${this.formatMoney(reportData.yearlyProjection)}。\n\n`
    } else if (reportData.dailyNet < 0) {
      advice += `⚠️ 您每日净成本¥${Math.abs(reportData.dailyNet).toFixed(2)}，建议增加收益性资产或减少成本。\n\n`
    }

    if (reportData.totalAssets > reportData.totalLiabilities * 2) {
      advice += '✅ 资产负债比例健康，可考虑适度投资增长。'
    } else if (reportData.totalLiabilities > reportData.totalAssets) {
      advice += '⚠️ 负债过高，建议优先偿还高成本负债。'
    }

    wx.showModal({
      title: '智能分析',
      content: advice,
      showCancel: false
    })
  }
})
