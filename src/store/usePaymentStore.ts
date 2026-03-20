import { create } from 'zustand'
import type { Payment, PaymentType } from '../types/payment'

const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 9)

interface PaymentStore {
  payments: Payment[]
  loading: boolean
  error: string | null
  load: () => Promise<void>
  addPayment: (debtId: string, date: string, amount: number, type: PaymentType, note?: string) => Promise<void>
  removePayment: (id: string) => Promise<void>
}

export const usePaymentStore = create<PaymentStore>()((set) => ({
  payments: [],
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null })
    try {
      const res = await fetch('/api/payments')
      const { payments } = await res.json() as { payments: Payment[] }
      set({ payments, loading: false })
    } catch (e) {
      set({ error: String(e), loading: false })
    }
  },

  addPayment: async (debtId, date, amount, type, note) => {
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: generateId(), debtId, date, amount, type, note }),
    })
    const { payment } = await res.json() as { payment: Payment }
    set((s) => ({ payments: [...s.payments, payment] }))
  },

  removePayment: async (id) => {
    await fetch(`/api/payments/${id}`, { method: 'DELETE' })
    set((s) => ({ payments: s.payments.filter((p) => p.id !== id) }))
  },
}))
