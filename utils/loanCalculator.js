/**
 * 贷款计算器
 * 支持等额本息和等额本金两种还款方式
 * 实现资产与负债完全分离的记录逻辑
 */

class LoanCalculator {
  
  /**
   * 计算等额本息还款
   * @param {number} principal - 贷款本金
   * @param {number} annualRate - 年利率（如0.05表示5%）
   * @param {number} months - 还款月数
   * @returns {Object} 还款计划详情
   */
  static calculateEqualPayment(principal, annualRate, months) {
    const monthlyRate = annualRate / 12
    
    if (monthlyRate === 0) {
      // 无息贷款
      const monthlyPayment = principal / months
      return this.generatePaymentSchedule(principal, 0, months, monthlyPayment, 'equal_payment')
    }
    
    // 月供计算公式：M = P * [r(1+r)^n] / [(1+r)^n - 1]
    const monthlyPayment = principal * 
      (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
      (Math.pow(1 + monthlyRate, months) - 1)
    
    return this.generateEqualPaymentSchedule(principal, annualRate, months, monthlyPayment)
  }

  /**
   * 计算等额本金还款
   * @param {number} principal - 贷款本金
   * @param {number} annualRate - 年利率
   * @param {number} months - 还款月数
   * @returns {Object} 还款计划详情
   */
  static calculateEqualPrincipal(principal, annualRate, months) {
    const monthlyRate = annualRate / 12
    const monthlyPrincipal = principal / months
    
    return this.generateEqualPrincipalSchedule(principal, annualRate, months, monthlyPrincipal)
  }

  /**
   * 生成等额本息还款计划表
   */
  static generateEqualPaymentSchedule(principal, annualRate, months, monthlyPayment) {
    const monthlyRate = annualRate / 12
    const schedule = []
    let remainingPrincipal = principal
    let totalInterest = 0

    for (let month = 1; month <= months; month++) {
      const interestPayment = remainingPrincipal * monthlyRate
      const principalPayment = monthlyPayment - interestPayment
      remainingPrincipal -= principalPayment
      totalInterest += interestPayment

      schedule.push({
        month,
        monthlyPayment: Math.round(monthlyPayment * 100) / 100,
        principalPayment: Math.round(principalPayment * 100) / 100,
        interestPayment: Math.round(interestPayment * 100) / 100,
        remainingPrincipal: Math.round(Math.max(0, remainingPrincipal) * 100) / 100,
        totalPaidInterest: Math.round(totalInterest * 100) / 100,
        totalPaidPrincipal: Math.round((principal - remainingPrincipal) * 100) / 100
      })
    }

    return {
      type: 'equal_payment',
      principal: Math.round(principal * 100) / 100,
      annualRate,
      months,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalAmount: Math.round(monthlyPayment * months * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      schedule,
      summary: {
        totalCost: Math.round(monthlyPayment * months * 100) / 100,
        interestCost: Math.round(totalInterest * 100) / 100,
        interestRatio: Math.round((totalInterest / principal) * 10000) / 100
      }
    }
  }

  /**
   * 生成等额本金还款计划表
   */
  static generateEqualPrincipalSchedule(principal, annualRate, months, monthlyPrincipal) {
    const monthlyRate = annualRate / 12
    const schedule = []
    let remainingPrincipal = principal
    let totalInterest = 0

    for (let month = 1; month <= months; month++) {
      const interestPayment = remainingPrincipal * monthlyRate
      const monthlyPayment = monthlyPrincipal + interestPayment
      remainingPrincipal -= monthlyPrincipal
      totalInterest += interestPayment

      schedule.push({
        month,
        monthlyPayment: Math.round(monthlyPayment * 100) / 100,
        principalPayment: Math.round(monthlyPrincipal * 100) / 100,
        interestPayment: Math.round(interestPayment * 100) / 100,
        remainingPrincipal: Math.round(Math.max(0, remainingPrincipal) * 100) / 100,
        totalPaidInterest: Math.round(totalInterest * 100) / 100,
        totalPaidPrincipal: Math.round((principal - remainingPrincipal) * 100) / 100
      })
    }

    return {
      type: 'equal_principal',
      principal: Math.round(principal * 100) / 100,
      annualRate,
      months,
      firstMonthPayment: schedule[0].monthlyPayment,
      lastMonthPayment: schedule[schedule.length - 1].monthlyPayment,
      totalAmount: Math.round((principal + totalInterest) * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      schedule,
      summary: {
        totalCost: Math.round((principal + totalInterest) * 100) / 100,
        interestCost: Math.round(totalInterest * 100) / 100,
        interestRatio: Math.round((totalInterest / principal) * 10000) / 100
      }
    }
  }

  /**
   * 计算提前还款节省的利息
   * @param {Object} loanInfo - 贷款信息
   * @param {number} prepaymentMonth - 提前还款月份
   * @param {number} prepaymentAmount - 提前还款金额
   * @returns {Object} 提前还款分析
   */
  static calculatePrepaymentSavings(loanInfo, prepaymentMonth, prepaymentAmount) {
    const { schedule, type } = loanInfo
    
    if (prepaymentMonth > schedule.length || prepaymentMonth < 1) {
      throw new Error('提前还款月份无效')
    }

    const currentSchedule = schedule[prepaymentMonth - 1]
    const remainingPrincipal = currentSchedule.remainingPrincipal
    
    if (prepaymentAmount > remainingPrincipal) {
      throw new Error('提前还款金额不能超过剩余本金')
    }

    // 计算原计划剩余利息
    let originalRemainingInterest = 0
    for (let i = prepaymentMonth; i < schedule.length; i++) {
      originalRemainingInterest += schedule[i].interestPayment
    }

    // 计算提前还款后的新还款计划
    const newPrincipal = remainingPrincipal - prepaymentAmount
    const remainingMonths = schedule.length - prepaymentMonth
    
    let newRemainingInterest = 0
    if (newPrincipal > 0 && remainingMonths > 0) {
      const newLoanInfo = type === 'equal_payment' 
        ? this.calculateEqualPayment(newPrincipal, loanInfo.annualRate, remainingMonths)
        : this.calculateEqualPrincipal(newPrincipal, loanInfo.annualRate, remainingMonths)
      newRemainingInterest = newLoanInfo.totalInterest
    }

    const interestSavings = originalRemainingInterest - newRemainingInterest

    return {
      prepaymentAmount: Math.round(prepaymentAmount * 100) / 100,
      prepaymentMonth,
      originalRemainingInterest: Math.round(originalRemainingInterest * 100) / 100,
      newRemainingInterest: Math.round(newRemainingInterest * 100) / 100,
      interestSavings: Math.round(interestSavings * 100) / 100,
      savingsRatio: Math.round((interestSavings / prepaymentAmount) * 10000) / 100,
      recommendation: this.generatePrepaymentRecommendation(interestSavings, prepaymentAmount)
    }
  }

  /**
   * 生成贷款购买建议
   * @param {number} assetPrice - 资产价格
   * @param {number} loanAmount - 贷款金额
   * @param {number} annualRate - 年利率
   * @param {number} months - 还款月数
   * @returns {Object} 购买建议分析
   */
  static generatePurchaseAdvice(assetPrice, loanAmount, annualRate, months) {
    const cashPrice = assetPrice // 全款价格
    const loanInfo = this.calculateEqualPayment(loanAmount, annualRate, months)
    const totalLoanCost = loanInfo.totalAmount
    const interestCost = loanInfo.totalInterest
    
    // 计算全款 vs 贷款的成本差异
    const costDifference = totalLoanCost - loanAmount
    const savingsRatio = (costDifference / cashPrice) * 100

    return {
      cashPrice: Math.round(cashPrice * 100) / 100,
      loanAmount: Math.round(loanAmount * 100) / 100,
      totalLoanCost: Math.round(totalLoanCost * 100) / 100,
      interestCost: Math.round(interestCost * 100) / 100,
      costDifference: Math.round(costDifference * 100) / 100,
      savingsRatio: Math.round(savingsRatio * 100) / 100,
      monthlyPayment: loanInfo.monthlyPayment,
      recommendation: this.generatePurchaseRecommendation(savingsRatio, interestCost, loanInfo.monthlyPayment),
      equivalentItems: this.calculateEquivalentItems(interestCost)
    }
  }

  /**
   * 计算当前还款状态
   * @param {Object} loanInfo - 贷款信息
   * @param {number} paidMonths - 已还月数
   * @returns {Object} 当前状态
   */
  static getCurrentStatus(loanInfo, paidMonths) {
    if (paidMonths > loanInfo.schedule.length) {
      return { status: 'completed', message: '贷款已还清' }
    }

    const currentSchedule = loanInfo.schedule[paidMonths - 1] || loanInfo.schedule[0]
    const totalPaid = paidMonths * loanInfo.monthlyPayment
    const remainingAmount = loanInfo.totalAmount - totalPaid
    const progressRatio = (paidMonths / loanInfo.months) * 100

    return {
      status: 'active',
      paidMonths,
      remainingMonths: loanInfo.months - paidMonths,
      totalPaid: Math.round(totalPaid * 100) / 100,
      remainingAmount: Math.round(remainingAmount * 100) / 100,
      remainingPrincipal: currentSchedule.remainingPrincipal,
      totalPaidInterest: currentSchedule.totalPaidInterest,
      progressRatio: Math.round(progressRatio * 100) / 100,
      nextPaymentDate: this.calculateNextPaymentDate(loanInfo.startDate, paidMonths + 1)
    }
  }

  /**
   * 生成提前还款建议
   */
  static generatePrepaymentRecommendation(interestSavings, prepaymentAmount) {
    const savingsRatio = (interestSavings / prepaymentAmount) * 100
    
    if (savingsRatio > 10) {
      return {
        level: 'highly_recommended',
        message: `强烈建议提前还款，可节省${Math.round(savingsRatio)}%的利息成本`,
        icon: '🔥'
      }
    } else if (savingsRatio > 5) {
      return {
        level: 'recommended',
        message: `建议提前还款，可节省${Math.round(savingsRatio)}%的利息成本`,
        icon: '👍'
      }
    } else {
      return {
        level: 'optional',
        message: `提前还款收益较低，可考虑其他投资方式`,
        icon: '💡'
      }
    }
  }

  /**
   * 生成购买建议
   */
  static generatePurchaseRecommendation(savingsRatio, interestCost, monthlyPayment) {
    if (savingsRatio > 20) {
      return {
        level: 'cash_recommended',
        message: `建议全款购买，贷款利息成本过高（${Math.round(savingsRatio)}%）`,
        icon: '💰'
      }
    } else if (savingsRatio > 10) {
      return {
        level: 'consider_cash',
        message: `可考虑全款购买，能节省${Math.round(savingsRatio)}%的成本`,
        icon: '🤔'
      }
    } else {
      return {
        level: 'loan_acceptable',
        message: `贷款购买可接受，月供${monthlyPayment}元`,
        icon: '✅'
      }
    }
  }

  /**
   * 计算利息等价物品（如几杯奶茶）
   */
  static calculateEquivalentItems(interestCost) {
    const items = [
      { name: '杯奶茶', price: 20 },
      { name: '份外卖', price: 35 },
      { name: '张电影票', price: 45 },
      { name: '顿火锅', price: 80 }
    ]

    return items.map(item => ({
      name: item.name,
      quantity: Math.floor(interestCost / item.price),
      description: `相当于${Math.floor(interestCost / item.price)}${item.name}`
    })).filter(item => item.quantity > 0)
  }

  /**
   * 计算下次还款日期
   */
  static calculateNextPaymentDate(startDate, monthNumber) {
    if (!startDate) return null
    
    const date = new Date(startDate)
    date.setMonth(date.getMonth() + monthNumber)
    return date.toISOString().split('T')[0]
  }
}

module.exports = LoanCalculator
