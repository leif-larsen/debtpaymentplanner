import type { Debt, DebtPayoffPlan, PayoffMonth } from '../types/debt'

export type Strategy = 'avalanche' | 'snowball'

export interface StrategyResult {
  strategy: Strategy
  totalInterestPaid: number
  totalPaid: number
  monthsToPayoff: number
  payoffDate: string
  payoffOrder: string[] // debt names in the order they are paid off
}

export interface ExtraPaymentImpact {
  debtId: string
  interestSaved: number
  monthsSaved: number
  newPayoffDate: string
}

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
 * Simulate paying off multiple debts using avalanche or snowball strategy.
 * Total monthly budget = sum of all current monthlyPayments.
 * Minimums are paid on all debts; extra goes to the priority debt.
 * When a debt is cleared its freed payment cascades to the next priority debt.
 */
export function calculateStrategy(debts: Debt[], strategy: Strategy): StrategyResult {
  if (debts.length === 0) {
    return { strategy, totalInterestPaid: 0, totalPaid: 0, monthsToPayoff: 0, payoffDate: '', payoffOrder: [] }
  }

  const budget = debts.reduce((sum, d) => sum + d.monthlyPayment, 0)

  type DebtState = { id: string; name: string; balance: number; rate: number; minimum: number }
  const states: DebtState[] = debts.map((d) => ({
    id: d.id,
    name: d.name,
    balance: d.balance,
    rate: d.interestRate,
    minimum: d.minimumPayment,
  }))

  let month = 0
  let totalInterest = 0
  let totalPaid = 0
  const payoffOrder: string[] = []
  const startDate = new Date()

  while (states.some((s) => s.balance > 0.005) && month < 1200) {
    month++
    const active = states.filter((s) => s.balance > 0.005)
    const totalMinimums = active.reduce((sum, s) => sum + s.minimum, 0)
    const extra = Math.max(0, budget - totalMinimums)

    // Priority debt for the extra payment
    const priority = [...active].sort((a, b) =>
      strategy === 'avalanche' ? b.rate - a.rate : a.balance - b.balance
    )[0]

    for (const s of states) {
      if (s.balance <= 0.005) continue
      const interest = s.balance * (s.rate / 100 / 12)
      totalInterest += interest
      let payment = s.minimum + (s.id === priority.id ? extra : 0)
      payment = Math.min(payment, s.balance + interest)
      totalPaid += payment
      s.balance = Math.max(0, s.balance - (payment - interest))
      if (s.balance <= 0.005 && !payoffOrder.includes(s.name)) {
        payoffOrder.push(s.name)
      }
    }
  }

  const payoffDate = new Date(startDate)
  payoffDate.setMonth(startDate.getMonth() + month)

  return {
    strategy,
    totalInterestPaid: totalInterest,
    totalPaid,
    monthsToPayoff: month,
    payoffDate: payoffDate.toISOString().slice(0, 7),
    payoffOrder,
  }
}

/**
 * Calculate the impact of a one-time lump-sum payment applied to a debt's balance.
 */
export function calculateExtraPaymentImpact(debt: Debt, extraAmount: number): ExtraPaymentImpact {
  const original = calculatePayoffPlan(debt)
  const modified = calculatePayoffPlan({
    ...debt,
    balance: Math.max(0, debt.balance - extraAmount),
  })
  return {
    debtId: debt.id,
    interestSaved: original.totalInterestPaid - modified.totalInterestPaid,
    monthsSaved: original.monthsToPayoff - modified.monthsToPayoff,
    newPayoffDate: modified.payoffDate,
  }
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
