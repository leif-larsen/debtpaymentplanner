export type PayoffStrategy = 'avalanche' | 'snowball' | 'custom'

export interface Debt {
  id: string
  name: string
  balance: number
  interestRate: number // annual percentage rate (APR)
  minimumPayment: number
  monthlyPayment: number // actual payment being made (>= minimumPayment)
  startDate: string // ISO date string
  notes?: string
  color?: string // for UI differentiation
}

export interface PayoffMonth {
  month: number
  date: string
  payment: number
  principal: number
  interest: number
  remainingBalance: number
}

export interface DebtPayoffPlan {
  debtId: string
  totalInterestPaid: number
  totalPaid: number
  payoffDate: string
  monthsToPayoff: number
  schedule: PayoffMonth[]
}

export interface Summary {
  totalDebt: number
  totalMonthlyPayment: number
  totalMinimumPayment: number
  totalInterestIfMinimum: number
  projectedPayoffDate: string
  plans: DebtPayoffPlan[]
}

export type DebtFormData = Omit<Debt, 'id'>
