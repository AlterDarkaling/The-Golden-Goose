// 引入本地存储管理工具
const StorageManager = require('../../utils/storage.js')

Page({
  data: {
    userInfo: {},
    assets: [],
    liabilities: [],
    searchKeyword: '',
    sortFieldIndex: 0,
    sortOrderIndex: 0,
    categoryIndex: [0, 0],
    statusIndex: 0,
    sortFieldOptions: [
      { label: '默认排序', value: 'createTime' },
      { label: '金额', value: 'amount' },
      { label: '天数', value: 'days' },
      { label: '购买时间', value: 'purchaseDate' },
      { label: '每日成本', value: 'dailyCost' }
    ],
    sortOrderOptions: [
      { label: '降序', value: 'desc' },
      { label: '升序', value: 'asc' }
    ],
    // 一级分类
    categoryLevelOne: [
      { label: '全部类别', value: 'all' },
      { label: '投资理财', value: 'investment' },
      { label: '房产相关', value: 'property' },
      { label: '交通工具', value: 'vehicle' },
      { label: '数码设备', value: 'digital' },
      { label: '设备器材', value: 'equipment' },
      { label: '贷款负债', value: 'debt' },
      { label: '其他', value: 'other' }
    ],
    // 二级分类
    categoryLevelTwo: [
      // 全部类别的二级分类
      [{ label: '全部', value: 'all' }],
      // 投资理财的二级分类
      [
        { label: '全部', value: 'all' },
        { label: '股票', value: 'stocks' },
        { label: '基金', value: 'funds' },
        { label: '债券', value: 'bonds' },
        { label: '理财产品', value: 'wealth_products' },
        { label: '保险', value: 'insurance' },
        { label: '贵金属', value: 'precious_metals' },
        { label: '其他投资', value: 'other_investment' }
      ],
      // 房产相关的二级分类
      [
        { label: '全部', value: 'all' },
        { label: '住宅', value: 'residence' },
        { label: '商铺', value: 'commercial' },
        { label: '写字楼', value: 'office' },
        { label: '厂房', value: 'factory' },
        { label: '土地', value: 'land' },
        { label: '停车位', value: 'parking' },
        { label: '其他房产', value: 'other_property' }
      ],
      // 交通工具的二级分类
      [
        { label: '全部', value: 'all' },
        { label: '汽车', value: 'car' },
        { label: '摩托车', value: 'motorcycle' },
        { label: '货车', value: 'truck' },
        { label: '电动车', value: 'electric_vehicle' },
        { label: '船舶', value: 'boat' },
        { label: '其他交通工具', value: 'other_vehicle' }
      ],
      // 数码设备的二级分类
      [
        { label: '全部', value: 'all' },
        { label: '台式电脑', value: 'desktop' },
        { label: '笔记本电脑', value: 'laptop' },
        { label: '手机', value: 'phone' },
        { label: '平板电脑', value: 'tablet' },
        { label: '相机摄像', value: 'camera' },
        { label: '音响耳机', value: 'audio' },
        { label: '智能手表', value: 'smartwatch' },
        { label: '游戏设备', value: 'gaming' },
        { label: '其他数码', value: 'other_digital' }
      ],
      // 设备器材的二级分类
      [
        { label: '全部', value: 'all' },
        { label: '生产设备', value: 'production_equipment' },
        { label: '办公设备', value: 'office_equipment' },
        { label: '家用电器', value: 'appliances' },
        { label: '工具仪器', value: 'tools' },
        { label: '其他设备', value: 'other_equipment' }
      ],
      // 贷款负债的二级分类
      [
        { label: '全部', value: 'all' },
        { label: '房贷', value: 'mortgage' },
        { label: '车贷', value: 'car_loan' },
        { label: '经营贷款', value: 'business_loan' },
        { label: '消费贷款', value: 'consumer_loan' },
        { label: '信用卡', value: 'credit_card' },
        { label: '其他贷款', value: 'other_loan' }
      ],
      // 其他的二级分类
      [
        { label: '全部', value: 'all' },
        { label: '知识产权', value: 'intellectual_property' },
        { label: '收藏品', value: 'collectibles' },
        { label: '其他', value: 'other' }
      ]
    ],
      statusOptions: [
        { label: '全部状态', value: 'all' },
        { label: '使用中', value: 'active' },
        { label: '暂停', value: 'paused' },
        { label: '已完成', value: 'completed' }
      ],
    netWorth: 0,
    dailyCost: 0,
    dailyIncome: 0,
    assetsCount: 0,
    liabilitiesCount: 0,
    filteredAssets: [],
    filteredLiabilities: []
  },

  onLoad() {
    this.checkLogin()
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  checkLogin() {
    const hasInitialized = wx.getStorageSync('app_initialized')
    if (!hasInitialized) {
      // 未初始化，跳转到引导页
      wx.reLaunch({
        url: '/pages/login/login'
      })
      return
    }
    
    // 加载用户信息
    const user = StorageManager.getUser()
    if (user) {
      this.setData({
        userInfo: user
      })
      
      // 如果是微信用户，更新头像显示
      if (user.isWechatUser && user.avatar) {
        this.setData({
          'userInfo.avatar': user.avatar
        })
      }
    }
  },

  loadData() {
    const assets = StorageManager.getAssets()
    const liabilities = StorageManager.getLiabilities()
    
    // 处理数据，添加显示字段
    const processedAssets = assets.map(asset => ({
      ...asset,
      type: 'asset',
      typeText: '资产',
      categoryName: this.getCategoryName(asset.categoryL1, asset.categoryL2),
      displayAmount: this.formatNumber(asset.currentValue || asset.initialValue),
      statusText: this.getStatusText(asset.status),
      createTimeText: StorageManager.formatPurchaseDate(asset.createDate, asset.createTime),
      // 排序用的数值字段
      amountValue: asset.currentValue || asset.initialValue || 0,
      daysValue: this.calculateDaysSinceCreate(asset.createTime),
      purchaseDateValue: this.getPurchaseDateValue(asset.createDate, asset.createTime),
      dailyCostValue: asset.dailyIncome || 0 // 资产用每日收益
    }))
    
    const processedLiabilities = liabilities.map(liability => ({
      ...liability,
      type: 'liability',
      typeText: '负债',
      categoryName: this.getCategoryName(liability.categoryL1, liability.categoryL2),
      displayAmount: this.formatNumber(liability.currentAmount || liability.initialAmount),
      statusText: this.getStatusText(liability.status),
      createTimeText: StorageManager.formatPurchaseDate(liability.createDate, liability.createTime),
      // 排序用的数值字段
      amountValue: liability.currentAmount || liability.initialAmount || 0,
      daysValue: this.calculateDaysSinceCreate(liability.createTime),
      purchaseDateValue: this.getPurchaseDateValue(liability.createDate, liability.createTime),
      dailyCostValue: liability.dailyCost || 0 // 负债用每日成本
    }))

    this.setData({
      assets: processedAssets,
      liabilities: processedLiabilities,
      netWorth: this.formatNumber(StorageManager.calculateNetWorth()),
      dailyCost: this.formatNumber(StorageManager.calculateDailyCost()),
      dailyIncome: this.formatNumber(StorageManager.calculateDailyIncome()),
      assetsCount: assets.length,
      liabilitiesCount: liabilities.length
    })

    this.updateFilteredData()
  },

  updateFilteredData() {
    const { assets, liabilities, searchKeyword, sortFieldIndex, sortOrderIndex, categoryIndex, statusIndex, sortFieldOptions, sortOrderOptions, categoryLevelOne, categoryLevelTwo, statusOptions } = this.data

    // 获取当前选择的分类值
    const selectedCategoryL1 = categoryLevelOne[categoryIndex[0]].value
    const selectedCategoryL2 = categoryLevelTwo[categoryIndex[0]][categoryIndex[1]].value

    // 过滤资产
    let filteredAssets = assets.filter(asset => {
      if (searchKeyword && !asset.name.includes(searchKeyword)) {
        return false
      }
      
      // 分类过滤
      if (categoryIndex[0] > 0) { // 不是"全部类别"
        if (categoryIndex[1] === 0) {
          // 选择了一级分类的"全部"，只过滤一级分类
          if (asset.categoryL1 !== selectedCategoryL1) {
            return false
          }
        } else {
          // 选择了具体的二级分类，同时过滤一级和二级
          if (asset.categoryL1 !== selectedCategoryL1 || asset.categoryL2 !== selectedCategoryL2) {
            return false
          }
        }
      }
      
      if (statusIndex > 0 && asset.status !== statusOptions[statusIndex].value) {
        return false
      }
      return true
    })

    // 过滤负债
    let filteredLiabilities = liabilities.filter(liability => {
      if (searchKeyword && !liability.name.includes(searchKeyword)) {
        return false
      }
      
      // 分类过滤
      if (categoryIndex[0] > 0) { // 不是"全部类别"
        if (categoryIndex[1] === 0) {
          // 选择了一级分类的"全部"，只过滤一级分类
          if (liability.categoryL1 !== selectedCategoryL1) {
            return false
          }
        } else {
          // 选择了具体的二级分类，同时过滤一级和二级
          if (liability.categoryL1 !== selectedCategoryL1 || liability.categoryL2 !== selectedCategoryL2) {
            return false
          }
        }
      }
      
      if (statusIndex > 0 && liability.status !== statusOptions[statusIndex].value) {
        return false
      }
      return true
    })

    // 排序
    const sortField = sortFieldOptions[sortFieldIndex].value
    const sortOrder = sortOrderOptions[sortOrderIndex].value
    
    const sortFunction = (a, b) => {
      let valueA, valueB
      
      switch (sortField) {
        case 'amount':
          valueA = a.amountValue
          valueB = b.amountValue
          break
        case 'days':
          valueA = a.daysValue
          valueB = b.daysValue
          break
        case 'purchaseDate':
          valueA = a.purchaseDateValue
          valueB = b.purchaseDateValue
          break
        case 'dailyCost':
          valueA = a.dailyCostValue
          valueB = b.dailyCostValue
          break
        case 'createTime':
        default:
          // 默认排序：始终按添加时间降序（最新在前），不受升序降序选择影响
          valueA = new Date(a.createTime).getTime()
          valueB = new Date(b.createTime).getTime()
          return valueB - valueA  // 固定降序
      }
      
      // 其他排序字段才使用升序或降序选择
      if (sortOrder === 'asc') {
        return valueA - valueB
      } else {
        return valueB - valueA
      }
    }
    
    filteredAssets.sort(sortFunction)
    filteredLiabilities.sort(sortFunction)

    this.setData({
      filteredAssets,
      filteredLiabilities
    })
  },

  chooseAvatar() {
    // 跳转到个人中心页面
    wx.navigateTo({
      url: '/pages/profile/profile'
    })
  },

  // 计算创建以来的天数
  calculateDaysSinceCreate(createTime) {
    if (!createTime) return 0
    const now = new Date()
    const createDate = new Date(createTime)
    const diffMs = now - createDate
    return Math.floor(diffMs / (1000 * 60 * 60 * 24))
  },

  // 获取购买日期的数值（用于排序）
  getPurchaseDateValue(createDate, createTime) {
    if (createDate) {
      return new Date(createDate).getTime()
    } else if (createTime) {
      return new Date(createTime).getTime()
    }
    return 0
  },

  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    })
    this.updateFilteredData()
  },

  // 排序选择器变化事件
  onSortChange(e) {
    const [sortFieldIndex, sortOrderIndex] = e.detail.value
    
    // 如果选择默认排序，强制设置为降序（但不影响实际排序逻辑）
    const finalSortOrderIndex = sortFieldIndex === 0 ? 0 : sortOrderIndex
    
    this.setData({
      sortFieldIndex: sortFieldIndex,
      sortOrderIndex: finalSortOrderIndex
    })
    this.updateFilteredData()
  },

  // 分类选择器变化事件
  onCategoryChange(e) {
    this.setData({
      categoryIndex: e.detail.value
    })
    this.updateFilteredData()
  },

  // 分类选择器列变化事件
  onCategoryColumnChange(e) {
    const { column, value } = e.detail
    const categoryIndex = [...this.data.categoryIndex]
    
    if (column === 0) {
      // 一级分类变化，重置二级分类为0
      categoryIndex[0] = value
      categoryIndex[1] = 0
    } else {
      // 二级分类变化
      categoryIndex[1] = value
    }
    
    this.setData({
      categoryIndex: categoryIndex
    })
  },

  onStatusChange(e) {
    this.setData({
      statusIndex: e.detail.value
    })
    this.updateFilteredData()
  },

  addAsset() {
    wx.navigateTo({
      url: '/pages/edit/edit?type=asset'
    })
  },

  addLiability() {
    wx.navigateTo({
      url: '/pages/edit/edit?type=liability'
    })
  },

  viewDetail(e) {
    const { item, type } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/detail/detail?type=${type}&id=${item.id}`
    })
  },

  getCategoryName(categoryL1, categoryL2) {
    const { categoryLevelOne, categoryLevelTwo } = this.data
    
    // 查找一级分类
    const level1 = categoryLevelOne.find(cat => cat.value === categoryL1)
    if (!level1) return '其他'
    
    const level1Index = categoryLevelOne.findIndex(cat => cat.value === categoryL1)
    if (level1Index === -1) return level1.label
    
    // 查找二级分类
    const level2List = categoryLevelTwo[level1Index] || []
    const level2 = level2List.find(cat => cat.value === categoryL2)
    
    if (categoryL2 === 'all' || !level2) {
      return level1.label
    }
    
    return `${level1.label} - ${level2.label}`
  },

  getStatusText(status) {
    const statusMap = {
      active: '使用中',
      paused: '暂停',
      completed: '已完成'
    }
    return statusMap[status] || '未知'
  },

  formatNumber(num) {
    if (typeof num !== 'number') return '0.00'
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  },

  // 退出登录功能已移至个人中心页面
  
  // 浮动按钮点击事件
  handleFloatBtnClick() {
    wx.showActionSheet({
      itemList: ['添加资产', '添加负债'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.addAsset()
        } else if (res.tapIndex === 1) {
          this.addLiability()
        }
      }
    })
  }
})
