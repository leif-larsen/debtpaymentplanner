import { create } from 'zustand'
import type { Debt, DebtFormData } from '../types/debt'

const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 9)

interface DebtStore {
  debts: Debt[]
  loading: boolean
  error: string | null
  load: () => Promise<void>
  addDebt: (data: DebtFormData) => Promise<void>
  updateDebt: (id: string, data: Partial<DebtFormData>) => Promise<void>
  removeDebt: (id: string) => Promise<void>
}

export const useDebtStore = create<DebtStore>()((set) => ({
  debts: [],
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null })
    try {
      const res = await fetch('/api/debts')
      const { debts } = await res.json() as { debts: Debt[] }
      set({ debts, loading: false })
    } catch (e) {
      set({ error: String(e), loading: false })
    }
  },

  addDebt: async (data) => {
    const res = await fetch('/api/debts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, id: generateId() }),
    })
    const { debt } = await res.json() as { debt: Debt }
    set((s) => ({ debts: [...s.debts, debt] }))
  },

  updateDebt: async (id, data) => {
    const res = await fetch(`/api/debts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const { debt } = await res.json() as { debt: Debt }
    set((s) => ({ debts: s.debts.map((d) => (d.id === id ? debt : d)) }))
  },

  removeDebt: async (id) => {
    await fetch(`/api/debts/${id}`, { method: 'DELETE' })
    set((s) => ({ debts: s.debts.filter((d) => d.id !== id) }))
  },
}))
