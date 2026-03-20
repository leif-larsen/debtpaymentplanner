import { useState } from 'react'
import { useDebtStore } from '../store/useDebtStore'
import { usePaymentStore } from '../store/usePaymentStore'
import { calculatePayoffPlan, formatCurrency, formatDuration, getActualBalance, getPlannedBalanceAtDate } from '../utils/calculations'
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

function AmortizationTable({ debt }: { debt: Debt }) {
  const { schedule } = calculatePayoffPlan(debt)
  return (
    <div className="mt-4 border-t border-gray-100 dark:border-gray-700 pt-4 overflow-x-auto">
      <table className="w-full text-xs text-gray-700 dark:text-gray-300">
        <thead>
          <tr className="text-left text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-700">
            <th className="pb-2 font-medium">Month</th>
            <th className="pb-2 font-medium">Date</th>
            <th className="pb-2 font-medium text-right">Payment</th>
            <th className="pb-2 font-medium text-right">Principal</th>
            <th className="pb-2 font-medium text-right">Interest</th>
            <th className="pb-2 font-medium text-right">Balance</th>
          </tr>
        </thead>
        <tbody>
          {schedule.map((row) => (
            <tr key={row.month} className="border-b border-gray-50 dark:border-gray-700/50">
              <td className="py-1">{row.month}</td>
              <td className="py-1">{row.date}</td>
              <td className="py-1 text-right">{formatCurrency(row.payment)}</td>
              <td className="py-1 text-right text-green-700 dark:text-green-400">{formatCurrency(row.principal)}</td>
              <td className="py-1 text-right text-red-500 dark:text-red-400">{formatCurrency(row.interest)}</td>
              <td className="py-1 text-right font-medium">{formatCurrency(row.remainingBalance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function DebtCard({ debt, onEdit }: DebtCardProps) {
  const removeDebt = useDebtStore((s) => s.removeDebt)
  const payments = usePaymentStore((s) => s.getPaymentsForDebt(debt.id))
  const [confirming, setConfirming] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)

  const plan = calculatePayoffPlan(debt)

  const today = new Date().toISOString().slice(0, 10)
  const actualBalance = payments.length > 0 ? getActualBalance(debt, payments) : null
  const plannedBalance = payments.length > 0 ? getPlannedBalanceAtDate(debt, today) : null
  const diff = actualBalance !== null && plannedBalance !== null ? actualBalance - plannedBalance : null

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-5">
      {confirming ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-700 dark:text-gray-300">
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
              className="px-4 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{debt.name}</h3>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit?.(debt)}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => setConfirming(true)}
                className="px-3 py-1 text-sm border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>

          {diff !== null && (
            <div
              className={[
                'mb-4 text-xs font-medium px-3 py-1.5 rounded-md',
                diff < -0.5
                  ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : diff > 0.5
                  ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
              ].join(' ')}
            >
              {diff < -0.5
                ? `${formatCurrency(Math.abs(diff))} ahead of schedule`
                : diff > 0.5
                ? `${formatCurrency(diff)} behind schedule`
                : 'On track'}
              {' '}— actual balance: {formatCurrency(actualBalance!)}
            </div>
          )}

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

          <button
            onClick={() => setShowSchedule((v) => !v)}
            className="mt-4 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
          >
            {showSchedule ? '▲ Hide schedule' : '▼ Show amortization schedule'}
          </button>

          {showSchedule && <AmortizationTable debt={debt} />}
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
      <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="font-medium text-gray-900 dark:text-gray-100">
        {value}
        {sub && <span className="block text-xs text-gray-400 dark:text-gray-500">{sub}</span>}
      </dd>
    </div>
  )
}
