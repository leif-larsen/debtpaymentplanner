import { useState } from 'react'
import { useDebtStore } from '../store/useDebtStore'
import { calculatePayoffPlan, formatCurrency, formatDuration } from '../utils/calculations'
import type { Debt } from '../types/debt'

interface DebtCardProps {
  debt: Debt
  onEdit?: (debt: Debt) => void
}

function formatPayoffDate(yyyyMM: string): string {
  if (!yyyyMM) return '—'
  const [year, month] = yyyyMM.split('-').map(Number)
  return new Date(year, month - 1).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  })
}

export default function DebtCard({ debt, onEdit }: DebtCardProps) {
  const removeDebt = useDebtStore((s) => s.removeDebt)
  const [confirming, setConfirming] = useState(false)

  const plan = calculatePayoffPlan(debt)

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
      {confirming ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-700">
            Are you sure you want to delete <span className="font-semibold">{debt.name}</span>?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => removeDebt(debt.id)}
              className="px-4 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
            >
              Yes, delete
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="px-4 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{debt.name}</h3>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit?.(debt)}
                className="px-3 py-1 text-sm border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => setConfirming(true)}
                className="px-3 py-1 text-sm border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <Stat label="Balance" value={formatCurrency(debt.balance)} />
            <Stat label="Interest rate" value={`${debt.interestRate.toFixed(2)}% APR`} />
            <Stat
              label="Monthly payment"
              value={formatCurrency(debt.monthlyPayment)}
              sub={
                debt.monthlyPayment !== debt.minimumPayment
                  ? `min. ${formatCurrency(debt.minimumPayment)}`
                  : undefined
              }
            />
            <Stat label="Payoff date" value={formatPayoffDate(plan.payoffDate)} />
            <Stat label="Time remaining" value={formatDuration(plan.monthsToPayoff)} />
            <Stat label="Total interest" value={formatCurrency(plan.totalInterestPaid)} />
          </dl>
        </>
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub?: string
}) {
  return (
    <div>
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900">
        {value}
        {sub && <span className="block text-xs text-gray-400">{sub}</span>}
      </dd>
    </div>
  )
}
