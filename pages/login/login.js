const StorageManager = require('../../utils/storage.js')
const { SmartStorage, APIClient } = require('../../utils/apiClient.js')

/**
 * 生成 n 个月前的 YYYY-MM-DD（演示数据用它体现"随时间变化"）
 */
function monthsAgo(months) {
  const target = new Date()
  target.setMonth(target.getMonth() - months)
  const y = target.getFullYear()
  const m = String(target.getMonth() + 1).padStart(2, '0')
  const d = String(target.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * 演示数据：分类一律采用 utils/accountingCategories.js 的规范值，
 * 创建走正常接口，折旧现值与贷款剩余本金全部由后端计算，前端不再自行模拟。
 * 两个身份的资产构成刻意差异明显，便于答辩时展示"切换用户后数据完全隔离"。
 */
const SAMPLE_DATA = {
  张三: {
    assets: [
      {
        name: '招商银行储蓄',
        categoryL1: 'current_assets', categoryL2: 'cash_assets', categoryL3: 'bank_deposit',
        initialValue: 150000, originalValue: 150000, currentValue: 150000,
        monthlyIncome: 200, createDate: monthsAgo(30), status: 'active', isSample: true,
        notes: '主要储蓄账户'
      },
      {
        name: '沪深300ETF',
        categoryL1: 'financial_assets', categoryL2: 'equity_fund', categoryL3: 'etf_fund',
        initialValue: 100000, originalValue: 100000, currentValue: 118000,
        monthlyIncome: 320, createDate: monthsAgo(28), status: 'active', isSample: true,
        notes: '定投ETF，按市值重估'
      },
      {
        name: '自住房产',
        categoryL1: 'physical_assets', categoryL2: 'appreciating_assets', categoryL3: 'real_estate',
        initialValue: 800000, originalValue: 800000, currentValue: 950000,
        createDate: monthsAgo(36), status: 'active', isSample: true,
        notes: '增值型实物资产，按市场估值计量，不计提折旧'
      },
      {
        name: 'iPhone 15 Pro',
        categoryL1: 'physical_assets', categoryL2: 'consumer_assets', categoryL3: 'mobile_computer',
        initialValue: 8000, originalValue: 8000, currentValue: 8000,
        depreciationRate: 40, isDepreciable: true, monthlyOperatingCost: 60,
        createDate: monthsAgo(24), status: 'active', isSample: true,
        notes: '两年前购入，按 40% 年折旧率余额递减计提'
      },
      {
        name: '本田雅阁汽车',
        categoryL1: 'physical_assets', categoryL2: 'consumer_assets', categoryL3: 'vehicle',
        initialValue: 180000, originalValue: 180000, currentValue: 180000,
        depreciationRate: 20, isDepreciable: true, monthlyOperatingCost: 1500,
        createDate: monthsAgo(36), status: 'active', isSample: true,
        notes: '三年前购入，按 20% 年折旧率计提'
      },
      {
        name: '互联网公司产品经理',
        categoryL1: 'work_income', categoryL2: 'main_job', categoryL3: 'salary',
        monthlyIncome: 25000, salaryStructure: 'monthly_salary',
        initialValue: 0, originalValue: 0, currentValue: 25000 * 24,
        startDate: monthsAgo(24), createDate: monthsAgo(24),
        status: 'active', isSample: true,
        notes: '入职两年，现值按累计收入计量，不计入净资产'
      }
    ],
    liabilities: [
      {
        name: '自住房贷款',
        categoryL1: 'long_term_liabilities', categoryL2: 'mortgage_loan', categoryL3: 'home_mortgage',
        initialAmount: 600000, originalAmount: 600000, currentAmount: 600000,
        annualRate: 4.9, months: 240, paymentType: 'equal_payment',
        startDate: monthsAgo(36), createDate: monthsAgo(36),
        status: 'normal', isSample: true,
        notes: '30 年期，起息三年，剩余本金按还款计划逐月递减'
      },
      {
        name: '购车贷款',
        categoryL1: 'long_term_liabilities', categoryL2: 'consumer_loan', categoryL3: 'car_loan',
        initialAmount: 120000, originalAmount: 120000, currentAmount: 120000,
        annualRate: 5.5, months: 36, paymentType: 'equal_payment',
        startDate: monthsAgo(12), createDate: monthsAgo(12),
        status: 'normal', isSample: true,
        notes: '3 年期车贷，起息一年'
      }
    ]
  },
  李四: {
    assets: [
      {
        name: '微信零钱',
        categoryL1: 'current_assets', categoryL2: 'cash_assets', categoryL3: 'digital_wallet',
        initialValue: 28000, originalValue: 28000, currentValue: 28000,
        createDate: monthsAgo(10), status: 'active', isSample: true
      },
      {
        name: '三年期定期存款',
        categoryL1: 'financial_assets', categoryL2: 'fixed_income', categoryL3: 'time_deposit',
        initialValue: 50000, originalValue: 50000, currentValue: 50000,
        createDate: monthsAgo(8), status: 'active', isSample: true,
        notes: '按票面价值计量'
      },
      {
        name: '索尼 A7M4 相机',
        categoryL1: 'physical_assets', categoryL2: 'consumer_assets', categoryL3: 'luxury_goods',
        initialValue: 15000, originalValue: 15000, currentValue: 15000,
        depreciationRate: 30, isDepreciable: true,
        createDate: monthsAgo(12), status: 'active', isSample: true,
        notes: '一年前购入，按 30% 年折旧率计提'
      },
      {
        name: '自由职业设计接单',
        categoryL1: 'work_income', categoryL2: 'part_time_job', categoryL3: 'freelance',
        monthlyIncome: 8000, salaryStructure: 'monthly_salary',
        initialValue: 0, originalValue: 0, currentValue: 8000 * 12,
        startDate: monthsAgo(12), createDate: monthsAgo(12),
        status: 'active', isSample: true
      }
    ],
    liabilities: [
      {
        name: '花呗分期',
        categoryL1: 'current_liabilities', categoryL2: 'short_term_loan', categoryL3: 'alipay_loan',
        initialAmount: 6000, originalAmount: 6000, currentAmount: 6000,
        annualRate: 0, months: 12, paymentType: 'equal_payment',
        startDate: monthsAgo(3), createDate: monthsAgo(3),
        status: 'normal', isSample: true,
        notes: '免息分期 12 期'
      }
    ]
  }
}

Page({
  data: {
    // 答辩演示的两个身份：昵称即账号标识，后端按 dev_<昵称> 映射到不同 user_id
    demoIdentities: [
      { nickname: '张三', desc: '房产存款 + 工作收入 + 房贷车贷' },
      { nickname: '李四', desc: '相机存款 + 兼职收入 + 免息分期' }
    ],
    logging: false
  },

  onLoad() {
    // 历史版本把示例数据写进按设备共享的本地缓存，切换身份会残留，这里统一清掉
    wx.removeStorageSync('assets_data')
    wx.removeStorageSync('liabilities_data')
    wx.removeStorageSync('has_sample_data')

    // 只有拿到登录凭证才跳过登录页，否则会带着上一个身份的 token 进首页
    if (wx.getStorageSync('app_initialized') && APIClient.getToken()) {
      wx.reLaunch({ url: '/pages/index/index' })
    }
  },

  // 以演示身份进入
  async handleEnterApp(e) {
    if (this.data.logging) return

    const nickname = e.currentTarget.dataset.nickname || '张三'
    this.setData({ logging: true })
    wx.showLoading({ title: '登录中...' })

    try {
      const res = await APIClient.devLogin(nickname)

      if (!res.success || !res.data || !res.data.token) {
        throw new Error(res.message || '登录失败')
      }

      const user = res.data.user

      wx.setStorageSync('app_initialized', true)
      wx.setStorageSync('user_info', {
        id: user.id,
        userId: user.id,
        nickname: user.nickname,
        avatar: user.avatar || '',
        wechatNickname: user.nickname,
        wechatAvatar: user.avatar || '',
        isWechatUser: false,
        useWechatInfo: false,
        createTime: new Date().toISOString()
      })

      await this.ensureSampleData(nickname)

      wx.hideLoading()
      wx.showToast({ title: `欢迎，${user.nickname}`, icon: 'success' })
      setTimeout(() => wx.reLaunch({ url: '/pages/index/index' }), 800)
    } catch (error) {
      wx.hideLoading()
      console.error('登录失败:', error)
      this.setData({ logging: false })
      wx.showModal({
        title: '登录失败',
        content: String(error.message || '请确认本地后端已在 localhost:3000 启动'),
        showCancel: false
      })
    }
  },

  // 该身份在云端还没有数据时灌入演示数据
  async ensureSampleData(nickname) {
    const preset = SAMPLE_DATA[nickname]
    if (!preset) return

    try {
      const assets = await SmartStorage.getAssets()
      const liabilities = await SmartStorage.getLiabilities()
      if (assets.length > 0 || liabilities.length > 0) return

      for (const asset of preset.assets) {
        await SmartStorage.saveAsset(asset)
      }
      for (const liability of preset.liabilities) {
        await SmartStorage.saveLiability(liability)
      }
    } catch (error) {
      console.error('初始化演示数据失败:', error)
    }
  },

  // 清掉本地缓存（保留登录凭证，退出登录在个人中心里做）
  clearLegacyLocalCache() {
    try {
      wx.removeStorageSync('assets_data')
      wx.removeStorageSync('liabilities_data')
      wx.removeStorageSync('has_sample_data')
      wx.showToast({ title: '本地缓存已清除', icon: 'none' })
    } catch (error) {
      console.error('清除本地缓存失败:', error)
    }
  }
})
