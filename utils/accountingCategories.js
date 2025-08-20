/**
 * 传统会计准则资产负债分类管理器
 * 4大资产类型12子类 + 3大负债类型7子类
 */

class AccountingCategories {
  
  /**
   * 资产分类框架（4大类12子类）
   */
  static ASSET_CATEGORIES = {
    // 1. 流动资产
    current_assets: {
      label: '流动资产',
      icon: '💰',
      description: '随时可变现或在一年内消耗的资产',
      subcategories: {
        // 现金类资产
        cash_assets: {
          label: '现金类资产',
          icon: '💵',
          description: '随时可动用的高流动性资金',
          depreciable: false,
          marketValue: true,
          examples: ['活期存款', '钱包现金', '支付宝/微信零钱', '余额宝等货币基金'],
          accountingRule: '按实际金额计量，不产生折旧或增值',
          items: [
            { value: 'bank_deposit', label: '银行存款', description: '活期存款账户余额' },
            { value: 'cash_wallet', label: '现金', description: '钱包现金' },
            { value: 'digital_wallet', label: '数字钱包', description: '支付宝/微信零钱' },
            { value: 'money_fund', label: '货币基金', description: '余额宝等货币基金' }
          ]
        },
        // 短期理财资产
        short_term_investment: {
          label: '短期理财资产',
          icon: '📊',
          description: '持有期≤1年的低风险理财产品',
          depreciable: false,
          marketValue: true,
          examples: ['银行T+0理财', '短期国债', '结构性存款'],
          accountingRule: '按购买成本入账，到期按实际收益调整',
          items: [
            { value: 'bank_wealth', label: '银行理财', description: '银行T+0理财产品' },
            { value: 'short_bond', label: '短期国债', description: '≤1年期国债' },
            { value: 'structured_deposit', label: '结构性存款', description: '保本浮动收益存款' },
            { value: 'money_market', label: '货币市场基金', description: '短期货币市场工具' }
          ]
        }
      }
    },

    // 2. 金融资产
    financial_assets: {
      label: '金融资产',
      icon: '📈',
      description: '股票、基金、债券等金融投资品',
      subcategories: {
        // 股票/基金类
        equity_fund: {
          label: '股票/基金类',
          icon: '📊',
          description: '公开交易的权益类投资品',
          depreciable: false,
          marketValue: true,
          examples: ['A股/港股/美股', 'ETF指数基金', '公募基金'],
          accountingRule: '按市值重估，区分持仓成本与当前市值',
          items: [
            { value: 'a_stock', label: 'A股股票', description: '上海/深圳证券交易所股票' },
            { value: 'hk_stock', label: '港股', description: '香港联合交易所股票' },
            { value: 'us_stock', label: '美股', description: '美国证券交易所股票' },
            { value: 'etf_fund', label: 'ETF基金', description: '交易型开放式指数基金' },
            { value: 'mutual_fund', label: '公募基金', description: '股票型/混合型公募基金' }
          ]
        },
        // 固定收益类
        fixed_income: {
          label: '固定收益类',
          icon: '🏦',
          description: '到期还本付息的债权类资产',
          depreciable: false,
          marketValue: false,
          examples: ['企业债券', '定期存款', '大额存单'],
          accountingRule: '按票面价值计量，按月计提应计利息',
          items: [
            { value: 'corporate_bond', label: '企业债券', description: '>1年期企业债券' },
            { value: 'government_bond', label: '国债', description: '>1年期国债' },
            { value: 'time_deposit', label: '定期存款', description: '银行定期存款' },
            { value: 'large_deposit', label: '大额存单', description: '银行大额存单' }
          ]
        }
      }
    },

    // 3. 实物资产
    physical_assets: {
      label: '实物资产',
      icon: '🏠',
      description: '有形的物理资产',
      subcategories: {
        // 消费型资产（折旧类）
        consumer_assets: {
          label: '消费型资产',
          icon: '📱',
          description: '使用价值为主、价值随时间递减的物品',
          depreciable: true,
          marketValue: true,
          examples: ['手机电脑', '家电家具', '汽车衣物'],
          accountingRule: '可手动设置当前市值，或按月计提折旧计算，资产净值=当前市值或原值-累计折旧',
          depreciationRates: {
            'mobile_computer': { rate: 0.40, label: '手机/电脑', years: 3 },
            'home_appliance': { rate: 0.20, label: '家电', years: 5 },
            'furniture': { rate: 0.10, label: '家具', years: 10 },
            'vehicle': { rate: 0.20, label: '汽车', years: 5 },
            'clothing': { rate: 0.50, label: '衣物', years: 2 },
            'luxury_goods': { rate: 0.30, label: '奢侈品', years: 3 }
          },
          items: [
            { value: 'mobile_computer', label: '手机/电脑', description: '手机、电脑、平板等电子设备' },
            { value: 'home_appliance', label: '家电', description: '冰箱、洗衣机、空调等家电' },
            { value: 'furniture', label: '家具', description: '沙发、床、桌椅等家具' },
            { value: 'vehicle', label: '汽车', description: '私人用车（非投资用途）' },
            { value: 'clothing', label: '衣物', description: '服装、鞋帽、配饰' },
            { value: 'luxury_goods', label: '奢侈品', description: '名表、珠宝等奢侈品' }
          ]
        },
        // 增值型资产
        appreciating_assets: {
          label: '增值型资产',
          icon: '🏘️',
          description: '具备长期升值潜力的实物',
          depreciable: false,
          marketValue: true,
          examples: ['房产', '黄金贵金属', '收藏品'],
          accountingRule: '按市场估值重估，不计提折旧但需记录维护成本',
          items: [
            { value: 'real_estate', label: '房产', description: '自住/投资房产' },
            { value: 'precious_metals', label: '贵金属', description: '黄金、白银等贵金属' },
            { value: 'collectibles', label: '收藏品', description: '字画、古董、艺术品' },
            { value: 'rare_items', label: '稀有物品', description: '限量版商品、纪念品' }
          ]
        }
      }
    },

    // 4. 工作收入
    work_income: {
      label: '工作收入',
      icon: '💼',
      description: '通过工作获得的收入来源',
      subcategories: {
        // 本职工作
        main_job: {
          label: '本职工作',
          icon: '👔',
          description: '主要工作的收入',
          depreciable: false,
          marketValue: false,
          examples: ['工资收入', '奖金', '提成'],
          accountingRule: '按月度工资收入记录',
          items: [
            { value: 'salary', label: '工资收入', description: '固定月工资' },
            { value: 'bonus', label: '奖金', description: '年终奖、季度奖等' },
            { value: 'commission', label: '提成', description: '销售提成、业绩奖励' },
            { value: 'allowance', label: '津贴补贴', description: '各类津贴和补贴' }
          ]
        },
        // 兼职工作
        part_time_job: {
          label: '兼职工作',
          icon: '💻',
          description: '兼职或副业的收入',
          depreciable: false,
          marketValue: false,
          examples: ['兼职收入', '自由职业', '副业收入'],
          accountingRule: '按实际收入记录',
          items: [
            { value: 'freelance', label: '自由职业', description: '自由职业项目收入' },
            { value: 'part_time', label: '兼职工作', description: '兼职工作收入' },
            { value: 'side_business', label: '副业收入', description: '副业、小生意收入' },
            { value: 'consulting', label: '咨询服务', description: '咨询、顾问收入' }
          ]
        }
      }
    },

    // 5. 其他资产
    other_assets: {
      label: '其他资产',
      icon: '📋',
      description: '无形资产和预付类资产',
      subcategories: {
        // 无形资产
        intangible_assets: {
          label: '无形资产',
          icon: '⚖️',
          description: '无实物形态但具经济价值的权利',
          depreciable: true,
          marketValue: false,
          examples: ['专利权', '著作权', '商标权'],
          accountingRule: '按取得成本入账，按有效期摊销',
          items: [
            { value: 'patent', label: '专利权', description: '发明专利、实用新型专利' },
            { value: 'copyright', label: '著作权', description: '文学、艺术作品著作权' },
            { value: 'trademark', label: '商标权', description: '注册商标使用权' },
            { value: 'software_license', label: '软件使用权', description: '软件许可使用权' }
          ]
        },
        // 预付类资产
        prepaid_assets: {
          label: '预付类资产',
          icon: '🎫',
          description: '已支付但尚未享受的服务/商品',
          depreciable: true,
          marketValue: false,
          examples: ['预付房租', '健身卡年费', '保险费'],
          accountingRule: '按时间比例分摊计入费用',
          items: [
            { value: 'prepaid_rent', label: '预付房租', description: '预付的房租/物业费' },
            { value: 'prepaid_service', label: '预付服务费', description: '健身卡、会员费等' },
            { value: 'prepaid_insurance', label: '预付保险费', description: '保险费未到期部分' },
            { value: 'prepaid_other', label: '其他预付款', description: '其他预付费用' }
          ]
        }
      }
    }
  }

  /**
   * 负债分类框架（3大类7子类）
   */
  static LIABILITY_CATEGORIES = {
    // 1. 流动负债
    current_liabilities: {
      label: '流动负债',
      icon: '💳',
      description: '一年内需要偿还的债务',
      subcategories: {
        // 信用卡负债
        credit_card_debt: {
          label: '信用卡负债',
          icon: '💳',
          description: '信用卡透支及分期欠款',
          examples: ['信用卡账单', '信用卡分期'],
          accountingRule: '按账单日记录应还总额，区分已出账单与未出账单',
          items: [
            { value: 'credit_card_bill', label: '信用卡账单', description: '已出账单待还款' },
            { value: 'credit_card_installment', label: '信用卡分期', description: '信用卡分期付款' },
            { value: 'credit_card_cash', label: '信用卡取现', description: '信用卡现金透支' }
          ]
        },
        // 短期借款
        short_term_loan: {
          label: '短期借款',
          icon: '📱',
          description: '偿还期≤1年的债务',
          examples: ['花呗借呗', '亲友借款', '现金贷'],
          accountingRule: '按剩余本金计量，按日计息',
          items: [
            { value: 'alipay_loan', label: '花呗/借呗', description: '支付宝花呗、借呗' },
            { value: 'wechat_loan', label: '微粒贷', description: '微信微粒贷' },
            { value: 'personal_loan', label: '亲友借款', description: '向亲友借款' },
            { value: 'cash_loan', label: '现金贷', description: '其他现金贷产品' }
          ]
        }
      }
    },

    // 2. 长期负债
    long_term_liabilities: {
      label: '长期负债',
      icon: '🏠',
      description: '偿还期>1年的债务',
      subcategories: {
        // 房贷
        mortgage_loan: {
          label: '房贷',
          icon: '🏠',
          description: '住房抵押贷款',
          examples: ['住房贷款', '商业贷款', '公积金贷款'],
          accountingRule: '按剩余本金计量，区分等额本息/等额本金',
          items: [
            { value: 'home_mortgage', label: '住房贷款', description: '银行住房抵押贷款' },
            { value: 'commercial_loan', label: '商业贷款', description: '商业银行住房贷款' },
            { value: 'provident_loan', label: '公积金贷款', description: '住房公积金贷款' }
          ]
        },
        // 车贷/消费贷
        consumer_loan: {
          label: '车贷/消费贷',
          icon: '🚗',
          description: '购车或大额消费分期贷款',
          examples: ['汽车贷款', '装修贷款', '教育贷款'],
          accountingRule: '按剩余本金计量，固定月供',
          items: [
            { value: 'car_loan', label: '汽车贷款', description: '购车分期贷款' },
            { value: 'decoration_loan', label: '装修贷款', description: '房屋装修贷款' },
            { value: 'education_loan', label: '教育贷款', description: '教育培训贷款' },
            { value: 'large_consumer_loan', label: '大额消费贷', description: '其他大额消费分期' }
          ]
        }
      }
    },

    // 3. 其他负债
    other_liabilities: {
      label: '其他负债',
      icon: '📄',
      description: '应付款项和预收款项',
      subcategories: {
        // 应付款项
        accounts_payable: {
          label: '应付款项',
          icon: '🧾',
          description: '已发生但未支付的账单',
          examples: ['水电燃气费', '通讯费', '医疗账单'],
          accountingRule: '按账单金额记录，支付后核销',
          items: [
            { value: 'utility_bill', label: '水电燃气费', description: '水费、电费、燃气费' },
            { value: 'telecom_bill', label: '通讯费', description: '手机话费、宽带费' },
            { value: 'medical_bill', label: '医疗账单', description: '医疗费用账单' },
            { value: 'other_payable', label: '其他应付款', description: '其他待付账单' }
          ]
        },
        // 预收款项
        advance_receipts: {
          label: '预收款项',
          icon: '💰',
          description: '提前收取但未提供服务的款项',
          examples: ['预收租金', '预收会员费'],
          accountingRule: '按时间比例确认收入',
          items: [
            { value: 'advance_rent', label: '预收租金', description: '提前收取的租金' },
            { value: 'advance_membership', label: '预收会员费', description: '预收的会员费用' },
            { value: 'advance_service', label: '预收服务费', description: '预收的服务费用' },
            { value: 'advance_other', label: '其他预收款', description: '其他预收款项' }
          ]
        }
      }
    }
  }

  /**
   * 获取资产一级分类
   */
  static getAssetL1Categories() {
    return Object.keys(this.ASSET_CATEGORIES).map(key => ({
      value: key,
      label: this.ASSET_CATEGORIES[key].label,
      icon: this.ASSET_CATEGORIES[key].icon,
      description: this.ASSET_CATEGORIES[key].description
    }))
  }

  /**
   * 获取资产二级分类
   */
  static getAssetL2Categories(l1Category) {
    const category = this.ASSET_CATEGORIES[l1Category]
    if (!category) return []
    
    return Object.keys(category.subcategories).map(key => ({
      value: key,
      label: category.subcategories[key].label,
      icon: category.subcategories[key].icon,
      description: category.subcategories[key].description,
      depreciable: category.subcategories[key].depreciable,
      marketValue: category.subcategories[key].marketValue
    }))
  }

  /**
   * 获取资产三级分类（具体项目）
   */
  static getAssetL3Items(l1Category, l2Category) {
    const category = this.ASSET_CATEGORIES[l1Category]
    if (!category || !category.subcategories[l2Category]) return []
    
    return category.subcategories[l2Category].items || []
  }

  /**
   * 获取负债一级分类
   */
  static getLiabilityL1Categories() {
    return Object.keys(this.LIABILITY_CATEGORIES).map(key => ({
      value: key,
      label: this.LIABILITY_CATEGORIES[key].label,
      icon: this.LIABILITY_CATEGORIES[key].icon,
      description: this.LIABILITY_CATEGORIES[key].description
    }))
  }

  /**
   * 获取负债二级分类
   */
  static getLiabilityL2Categories(l1Category) {
    const category = this.LIABILITY_CATEGORIES[l1Category]
    if (!category) return []
    
    return Object.keys(category.subcategories).map(key => ({
      value: key,
      label: category.subcategories[key].label,
      icon: category.subcategories[key].icon,
      description: category.subcategories[key].description
    }))
  }

  /**
   * 获取负债三级分类（具体项目）
   */
  static getLiabilityL3Items(l1Category, l2Category) {
    const category = this.LIABILITY_CATEGORIES[l1Category]
    if (!category || !category.subcategories[l2Category]) return []
    
    return category.subcategories[l2Category].items || []
  }

  /**
   * 获取折旧率配置
   */
  static getDepreciationRate(l2Category, l3Item) {
    if (l2Category === 'consumer_assets') {
      const rates = this.ASSET_CATEGORIES.physical_assets.subcategories.consumer_assets.depreciationRates
      return rates[l3Item] || { rate: 0.15, label: '其他', years: 6 }
    }
    return null
  }

  /**
   * 判断是否需要折旧
   */
  static isDepreciable(l1Category, l2Category) {
    const category = this.ASSET_CATEGORIES[l1Category]
    if (!category || !category.subcategories[l2Category]) return false
    
    return category.subcategories[l2Category].depreciable || false
  }

  /**
   * 判断是否按市值计量
   */
  static isMarketValue(l1Category, l2Category) {
    const category = this.ASSET_CATEGORIES[l1Category]
    if (!category || !category.subcategories[l2Category]) return false
    
    return category.subcategories[l2Category].marketValue || false
  }

  /**
   * 获取会计处理规则
   */
  static getAccountingRule(l1Category, l2Category) {
    const category = this.ASSET_CATEGORIES[l1Category] || this.LIABILITY_CATEGORIES[l1Category]
    if (!category || !category.subcategories[l2Category]) return ''
    
    return category.subcategories[l2Category].accountingRule || ''
  }

  /**
   * 获取分类路径显示文本
   */
  static getCategoryPath(l1Category, l2Category, l3Item = null) {
    const l1 = this.ASSET_CATEGORIES[l1Category] || this.LIABILITY_CATEGORIES[l1Category]
    if (!l1) return '未知分类'
    
    const l2 = l1.subcategories[l2Category]
    if (!l2) return l1.label
    
    if (l3Item) {
      const l3 = l2.items?.find(item => item.value === l3Item)
      return `${l1.label} > ${l2.label} > ${l3?.label || l3Item}`
    }
    
    return `${l1.label} > ${l2.label}`
  }
}

module.exports = AccountingCategories
