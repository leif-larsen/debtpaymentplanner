import { useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useDebtStore } from '../store/useDebtStore'
import { usePaymentStore } from '../store/usePaymentStore'
import { formatCurrency, getActualBalance, getPlannedBalanceAtDate } from '../utils/calculations'
import type { Debt } from '../types/debt'
import type { Payment } from '../types/payment'
import PaymentForm from './PaymentForm'

export default function PaymentsPage() {
  const debts = useDebtStore((s) => s.debts)
  const [formDebt, setFormDebt] = useState<Debt | null>(null)

  if (debts.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500 dark:text-gray-400">
        <p className="text-lg font-medium">No debts yet</p>
        <p className="text-sm mt-1">Add a debt first to start tracking payments.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Payment tracking</h2>
      </div>

      {debts.map((debt) => (
        <DebtPaymentRow key={debt.id} debt={debt} onAddPayment={() => setFormDebt(debt)} />
      ))}

      {formDebt && (
        <PaymentForm debt={formDebt} onClose={() => setFormDebt(null)} />
      )}
    </div>
  )
}

function DebtPaymentRow({ debt, onAddPayment }: { debt: Debt; onAddPayment: () => void }) {
  const payments = usePaymentStore(useShallow((s) => s.payments.filter((p) => p.debtId === debt.id)))
  const removePayment = usePaymentStore((s) => s.removePayment)
  const [expanded, setExpanded] = useState(false)

  const today = new Date().toISOString().slice(0, 10)
  const actualBalance = getActualBalance(debt, payments)
  const plannedBalance = getPlannedBalanceAtDate(debt, today)
  const diff = actualBalance - plannedBalance // positive = behind, negative = ahead

  const hasDiff = payments.length > 0
  const ahead = diff < -0.5
  const behind = diff > 0.5

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header row */}
      <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">{debt.name}</span>
            {hasDiff && (
              <span
                className={[
                  'text-xs font-medium px-2 py-0.5 rounded-full',
                  ahead
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                    : behind
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
                ].join(' ')}
              >
                {ahead
                  ? `${formatCurrency(Math.abs(diff))} ahead`
                  : behind
                  ? `${formatCurrency(diff)} behind`
                  : 'on track'}
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-gray-500 dark:text-gray-400">
            <span>
              Actual: <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(actualBalance)}</span>
            </span>
            {hasDiff && (
              <span>
                Planned: <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(plannedBalance)}</span>
              </span>
            )}
            {payments.length === 0 && (
              <span className="italic text-gray-400 dark:text-gray-500">No payments recorded yet</span>
            )}
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={onAddPayment}
            className="px-3 py-1.5 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            + Add
          </button>
          {payments.length > 0 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {expanded ? 'Hide' : `History (${payments.length})`}
            </button>
          )}
        </div>
      </div>

      {/* Payment history */}
      {expanded && payments.length > 0 && (
        <div className="border-t border-gray-100 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/40 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-2">Date</th>
                <th className="text-left px-4 py-2">Type</th>
                <th className="text-right px-4 py-2">Amount</th>
                <th className="text-left px-4 py-2">Note</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {[...payments]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((p) => (
                  <PaymentRow key={p.id} payment={p} onRemove={() => removePayment(p.id)} />
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function PaymentRow({ payment, onRemove }: { payment: Payment; onRemove: () => void }) {
  const [confirming, setConfirming] = useState(false)

  return (
    <tr className="text-gray-700 dark:text-gray-300">
      <td className="px-4 py-2 tabular-nums">{payment.date}</td>
      <td className="px-4 py-2">
        <span
          className={[
            'text-xs font-medium px-2 py-0.5 rounded-full capitalize',
            payment.type === 'payment'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
          ].join(' ')}
        >
          {payment.type}
        </span>
      </td>
      <td className="px-4 py-2 text-right tabular-nums">
        <span className={payment.type === 'payment' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}>
          {payment.type === 'charge' ? '+' : '-'}{formatCurrency(payment.amount)}
        </span>
      </td>
      <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{payment.note ?? '—'}</td>
      <td className="px-4 py-2 text-right">
        {confirming ? (
          <span className="inline-flex gap-2">
            <button onClick={onRemove} className="text-red-600 dark:text-red-400 hover:underline text-xs">Yes, delete</button>
            <button onClick={() => setConfirming(false)} className="text-gray-500 hover:underline text-xs">Cancel</button>
          </span>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="text-gray-400 hover:text-red-500 transition-colors text-xs"
          >
            Delete
          </button>
        )}
      </td>
    </tr>
  )
}
