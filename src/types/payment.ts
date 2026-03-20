export type PaymentType = 'payment' | 'charge'

export interface Payment {
  id: string
  debtId: string
  date: string // ISO date string
  amount: number // always positive; type determines effect on balance
  type: PaymentType // 'payment' reduces balance, 'charge' increases it
  note?: string
}
