import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Debt, DebtFormData } from '../types/debt'

interface DebtStore {
  debts: Debt[]
  addDebt: (data: DebtFormData) => void
  updateDebt: (id: string, data: Partial<DebtFormData>) => void
  removeDebt: (id: string) => void
}

export const useDebtStore = create<DebtStore>()(
  persist(
    (set) => ({
      debts: [],

      addDebt: (data) =>
        set((state) => ({
          debts: [
            ...state.debts,
            { ...data, id: crypto.randomUUID() },
          ],
        })),

      updateDebt: (id, data) =>
        set((state) => ({
          debts: state.debts.map((d) =>
            d.id === id ? { ...d, ...data } : d
          ),
        })),

      removeDebt: (id) =>
        set((state) => ({
          debts: state.debts.filter((d) => d.id !== id),
        })),
    }),
    { name: 'debt-planner' }
  )
)
