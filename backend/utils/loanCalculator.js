/**
 * 贷款计算器（从前端复用）
 * 支持等额本息和等额本金两种还款方式
 */

class LoanCalculator {
  
  /**
   * 计算等额本息还款
   */
  static calculateEqualPayment(principal, annualRate, months) {
    const monthlyRate = annualRate / 12
    
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
   * 计算等额本金还款
   */
  static calculateEqualPrincipal(principal, annualRate, months) {
    const monthlyRate = annualRate / 12
    const monthlyPrincipal = principal / months
    
    return this.generateEqualPrincipalSchedule(principal, annualRate, months, monthlyPrincipal)
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
}

module.exports = LoanCalculator

