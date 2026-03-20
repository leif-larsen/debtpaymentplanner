import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Payment, PaymentType } from '../types/payment'

const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 9)

interface PaymentStore {
  payments: Payment[]
  addPayment: (debtId: string, date: string, amount: number, type: PaymentType, note?: string) => void
  removePayment: (id: string) => void
}


export const usePaymentStore = create<PaymentStore>()(
  persist(
    (set) => ({
      payments: [],

      addPayment: (debtId, date, amount, type, note) =>
        set((state) => ({
          payments: [
            ...state.payments,
            { id: generateId(), debtId, date, amount, type, note },
          ],
        })),

      removePayment: (id) =>
        set((state) => ({
          payments: state.payments.filter((p) => p.id !== id),
        })),
    }),
    { name: 'debt-planner-payments' }
  )
)
