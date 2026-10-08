/**
 * 贷款计算器（从前端复用）
 * 支持等额本息和等额本金两种还款方式
 *
 * 约定：annual_rate 一律按百分数传入（6.5 表示 6.5%），与 models/Liability.js 的字段注释一致
 */

class LoanCalculator {

  /**
   * 年利率（百分数）→ 月利率（小数）
   */
  static toMonthlyRate(annualRate) {
    return (Number(annualRate) || 0) / 100 / 12
  }

  /**
   * 计算等额本息还款
   */
  static calculateEqualPayment(principal, annualRate, months) {
    const monthlyRate = this.toMonthlyRate(annualRate)

    if (monthlyRate === 0) {
      const monthlyPayment = principal / months
      return this.generatePaymentSchedule(principal, 0, months, monthlyPayment, 'equal_payment')
    }
    
    const monthlyPayment = principal * 
      (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
      (Math.pow(1 + monthlyRate, months) - 1)
    
    return this.generateEqualPaymentSchedule(principal, annualRate, months, monthlyPayment)
  }

  /**
   * 生成等额本息还款计划表
   */
  static generateEqualPaymentSchedule(principal, annualRate, months, monthlyPayment) {
    const monthlyRate = this.toMonthlyRate(annualRate)
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
   * 生成零利息分期还款计划（免息借款/信用卡分期）
   */
  static generatePaymentSchedule(principal, annualRate, months, monthlyPayment, type) {
    const schedule = []
    let remainingPrincipal = principal
    let totalPaidPrincipal = 0

    for (let month = 1; month <= months; month++) {
      const principalPayment = Math.min(monthlyPayment, remainingPrincipal)
      remainingPrincipal -= principalPayment
      totalPaidPrincipal += principalPayment

      schedule.push({
        month,
        monthlyPayment: Math.round(monthlyPayment * 100) / 100,
        principalPayment: Math.round(principalPayment * 100) / 100,
        interestPayment: 0,
        remainingPrincipal: Math.round(Math.max(0, remainingPrincipal) * 100) / 100,
        totalPaidInterest: 0,
        totalPaidPrincipal: Math.round(totalPaidPrincipal * 100) / 100
      })
    }

    return {
      type,
      principal: Math.round(principal * 100) / 100,
      annualRate,
      months,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalAmount: Math.round(monthlyPayment * months * 100) / 100,
      totalInterest: 0,
      schedule,
      summary: {
        totalCost: Math.round(monthlyPayment * months * 100) / 100,
        interestCost: 0,
        interestRatio: 0
      }
    }
  }

  /**
   * 计算等额本金还款
   */
  static calculateEqualPrincipal(principal, annualRate, months) {
    const monthlyRate = this.toMonthlyRate(annualRate)
    const monthlyPrincipal = principal / months
    
    return this.generateEqualPrincipalSchedule(principal, annualRate, months, monthlyPrincipal)
  }

  /**
   * 生成等额本金还款计划表
   */
  static generateEqualPrincipalSchedule(principal, annualRate, months, monthlyPrincipal) {
    const monthlyRate = this.toMonthlyRate(annualRate)
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

  // ==================== 按时间推进余额 ====================

  /**
   * 摊还基数：历史数据的 initial_amount 可能为 0，依次退化到 original_amount / current_amount
   */
  static principalOf(liability) {
    for (const value of [liability.initial_amount, liability.original_amount, liability.current_amount]) {
      const num = Number(value)
      if (Number.isFinite(num) && num > 0) return num
    }
    return 0
  }

  /**
   * 分期摊还型负债：有总期数、有本金（年利率可为 0，表示免息分期）
   */
  static isAmortizing(liability) {
    if (!liability) return false
    return Number(liability.months) > 0 && LoanCalculator.principalOf(liability) > 0
  }

  /**
   * 还款方式：type 列存放前端值（consumer/investment/other 等），
   * 只有它本身就是 equal_payment/equal_principal 时才当还款方式用，否则沿用已存还款计划里的方式
   */
  static repaymentMethodOf(liability) {
    const REPAYMENT_METHODS = ['equal_payment', 'equal_principal']
    if (REPAYMENT_METHODS.includes(liability.type)) return liability.type

    const storedMethod = liability.loan_schedule && liability.loan_schedule.type
    if (REPAYMENT_METHODS.includes(storedMethod)) return storedMethod

    return 'equal_payment'
  }

  /**
   * 按当前本金/利率/期数生成还款计划，method 可显式指定（来自页面的还款方式选择）
   */
  static buildSchedule(liability, method) {
    const principal = LoanCalculator.principalOf(liability)
    const months = Number(liability.months) || 0
    const annualRate = Number(liability.annual_rate) || 0
    const repaymentMethod = method || LoanCalculator.repaymentMethodOf(liability)

    return repaymentMethod === 'equal_principal'
      ? LoanCalculator.buildMonthlyPaymentField(LoanCalculator.calculateEqualPrincipal(principal, annualRate, months))
      : LoanCalculator.calculateEqualPayment(principal, annualRate, months)
  }

  /**
   * 等额本金逐期月供递减，首期月供补进 monthlyPayment 字段，供列表与详情页统一展示
   */
  static buildMonthlyPaymentField(schedule) {
    if (schedule.monthlyPayment === undefined && schedule.schedule && schedule.schedule.length > 0) {
      schedule.monthlyPayment = schedule.schedule[0].monthlyPayment
    }
    return schedule
  }

  /**
   * 已有还款计划只有在条款（期数/本金/利率/还款方式）一致时复用，否则重建
   */
  static scheduleOf(liability, method) {
    const stored = liability.loan_schedule
    const months = Number(liability.months) || 0
    const repaymentMethod = method || LoanCalculator.repaymentMethodOf(liability)

    if (stored && Array.isArray(stored.schedule) && stored.schedule.length === months &&
      Number(stored.principal) === LoanCalculator.principalOf(liability) &&
      Number(stored.annualRate) === (Number(liability.annual_rate) || 0) &&
      stored.type === repaymentMethod) {
      return stored
    }

    return LoanCalculator.buildSchedule(liability, repaymentMethod)
  }

  /**
   * 已完成的还款期数：未到当期还款日不计入
   */
  static monthsElapsed(liability) {
    const startValue = liability.start_date || liability.create_date || liability.created_at
    if (!startValue) return 0

    const start = new Date(startValue)
    if (Number.isNaN(start.getTime())) return 0

    const now = new Date()
    let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
    if (now.getDate() < start.getDate()) months -= 1

    return Math.max(0, months)
  }

  /**
   * 计算该负债今天应剩余的本金，返回需要回写的字段；条款不完整或已同步时返回空对象
   */
  static advanceToNow(liability) {
    if (!LoanCalculator.isAmortizing(liability)) return {}

    const months = Number(liability.months) || 0
    const schedule = LoanCalculator.scheduleOf(liability)
    const items = schedule.schedule || []
    if (items.length === 0) return {}

    const elapsed = Math.min(LoanCalculator.monthsElapsed(liability), months)
    const remaining = elapsed <= 0 ? Number(schedule.principal) : Number(items[elapsed - 1].remainingPrincipal)
    const finished = elapsed >= months || remaining <= 0.005
    // 等额本金的计划里没有单一月供字段，取首期月供展示
    const firstMonthlyPayment = schedule.monthlyPayment !== undefined
      ? schedule.monthlyPayment
      : Number(items[0].monthlyPayment) || 0
    const patch = {}

    if (Number(liability.initial_amount) !== Number(schedule.principal)) patch.initial_amount = schedule.principal
    if (Number(liability.current_amount) !== remaining) patch.current_amount = remaining
    if (!(Number(liability.monthly_payment) > 0)) patch.monthly_payment = firstMonthlyPayment
    if (!(Number(liability.total_interest) > 0)) patch.total_interest = schedule.totalInterest
    if (!(Number(liability.total_amount) > 0)) patch.total_amount = schedule.totalAmount
    if (liability.loan_schedule !== schedule) patch.loan_schedule = schedule
    if (finished && liability.status !== 'paid_off') patch.status = 'paid_off'
    if (!finished && liability.status === 'paid_off') patch.status = 'normal'

    return patch
  }
}

module.exports = LoanCalculator

