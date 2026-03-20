import type { Debt, DebtPayoffPlan, PayoffMonth } from '../types/debt'

/**
 * Calculate the full amortization schedule for a single debt.
 */
export function calculatePayoffPlan(debt: Debt): DebtPayoffPlan {
  const monthlyRate = debt.interestRate / 100 / 12
  const schedule: PayoffMonth[] = []

  let balance = debt.balance
  let totalInterest = 0
  let totalPaid = 0
  let month = 0

  const startDate = new Date(debt.startDate)

  while (balance > 0.005 && month < 1200) {
    month++
    const interest = balance * monthlyRate
    const payment = Math.min(debt.monthlyPayment, balance + interest)
    const principal = payment - interest

    balance = Math.max(0, balance - principal)
    totalInterest += interest
    totalPaid += payment

    const date = new Date(startDate)
    date.setMonth(startDate.getMonth() + month)

    schedule.push({
      month,
      date: date.toISOString().slice(0, 7),
      payment,
      principal,
      interest,
      remainingBalance: balance,
    })
  }

  const payoffDate = schedule.at(-1)?.date ?? ''

  return {
    debtId: debt.id,
    totalInterestPaid: totalInterest,
    totalPaid,
    payoffDate,
    monthsToPayoff: month,
    schedule,
  }
}

/**
 * Estimate payoff date using only the minimum payment.
 */
export function calculateMinimumPayoffPlan(debt: Debt): DebtPayoffPlan {
  return calculatePayoffPlan({ ...debt, monthlyPayment: debt.minimumPayment })
}

/**
 * Format a number as currency (NOK by default, configurable).
 */
export function formatCurrency(
  amount: number,
  currency = 'NOK',
  locale = 'nb-NO'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format months into a human-readable string (e.g. "2 years 3 months").
 */
export function formatDuration(months: number): string {
  const years = Math.floor(months / 12)
  const remainingMonths = months % 12

  if (years === 0) return `${remainingMonths}mo`
  if (remainingMonths === 0) return `${years}yr`
  return `${years}yr ${remainingMonths}mo`
}
