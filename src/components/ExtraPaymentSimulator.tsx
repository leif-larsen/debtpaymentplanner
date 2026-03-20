import { useState } from 'react'
import { calculateExtraPaymentImpact, formatCurrency, formatDuration } from '../utils/calculations'
import type { Debt } from '../types/debt'

interface ExtraPaymentSimulatorProps {
  debts: Debt[]
}

function formatPayoffDate(yyyyMM: string): string {
  if (!yyyyMM) return '—'
  const [year, month] = yyyyMM.split('-').map(Number)
  return new Date(year, month - 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

export default function ExtraPaymentSimulator({ debts }: ExtraPaymentSimulatorProps) {
  const [selectedId, setSelectedId] = useState<string>(debts[0]?.id ?? '')
  const [amount, setAmount] = useState<number>(0)

  if (debts.length === 0) return null

  const selectedDebt = debts.find((d) => d.id === selectedId) ?? debts[0]
  const impact = amount > 0 ? calculateExtraPaymentImpact(selectedDebt, amount) : null

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
        One-time payment simulator
      </h2>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
        See how a lump-sum payment would affect your payoff timeline. This is a read-only simulation — it does not change your saved data.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Apply to
          </label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {debts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({formatCurrency(d.balance)})
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Extra payment (NOK)
          </label>
          <input
            type="number"
            min={0}
            step={1000}
            value={amount || ''}
            onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
            placeholder="e.g. 10 000"
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {impact && amount <= selectedDebt.balance && (
        <div className="rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-4">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">
            Impact of paying {formatCurrency(amount)} extra on "{selectedDebt.name}"
          </p>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
            <div>
              <dt className="text-amber-600 dark:text-amber-500">Interest saved</dt>
              <dd className="font-semibold text-green-700 dark:text-green-400 text-sm">
                {formatCurrency(impact.interestSaved)}
              </dd>
            </div>
            <div>
              <dt className="text-amber-600 dark:text-amber-500">Time saved</dt>
              <dd className="font-semibold text-green-700 dark:text-green-400 text-sm">
                {impact.monthsSaved > 0 ? formatDuration(impact.monthsSaved) : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-amber-600 dark:text-amber-500">New payoff date</dt>
              <dd className="font-semibold text-amber-800 dark:text-amber-300 text-sm">
                {formatPayoffDate(impact.newPayoffDate)}
              </dd>
            </div>
            <div>
              <dt className="text-amber-600 dark:text-amber-500">Remaining balance</dt>
              <dd className="font-semibold text-amber-800 dark:text-amber-300 text-sm">
                {formatCurrency(Math.max(0, selectedDebt.balance - amount))}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {amount > selectedDebt.balance && (
        <p className="text-xs text-red-500 dark:text-red-400">
          Extra payment exceeds the current balance of {formatCurrency(selectedDebt.balance)}.
        </p>
      )}
    </div>
  )
}
