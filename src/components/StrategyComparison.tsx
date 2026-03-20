import { calculateStrategy, formatCurrency, formatDuration } from '../utils/calculations'
import type { Debt } from '../types/debt'

interface StrategyComparisonProps {
  debts: Debt[]
}

function formatPayoffDate(yyyyMM: string): string {
  if (!yyyyMM) return '—'
  const [year, month] = yyyyMM.split('-').map(Number)
  return new Date(year, month - 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

export default function StrategyComparison({ debts }: StrategyComparisonProps) {
  if (debts.length < 2) return null

  const avalanche = calculateStrategy(debts, 'avalanche')
  const snowball = calculateStrategy(debts, 'snowball')
  const interestDiff = snowball.totalInterestPaid - avalanche.totalInterestPaid
  const monthsDiff = snowball.monthsToPayoff - avalanche.monthsToPayoff

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
        Payoff strategy comparison
      </h2>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
        Based on your current total monthly budget of{' '}
        <span className="font-medium text-gray-600 dark:text-gray-400">
          {formatCurrency(debts.reduce((s, d) => s + d.monthlyPayment, 0))}
        </span>
      </p>

      <div className="grid grid-cols-2 gap-4">
        {/* Avalanche */}
        <div className="rounded-md border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-base">🏔</span>
            <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">Avalanche</span>
          </div>
          <p className="text-xs text-indigo-600 dark:text-indigo-500 mb-3">
            Highest interest rate first — minimises total interest paid.
          </p>
          <dl className="space-y-1.5 text-xs">
            <Row label="Total interest" value={formatCurrency(avalanche.totalInterestPaid)} />
            <Row label="Time to debt-free" value={formatDuration(avalanche.monthsToPayoff)} />
            <Row label="Debt-free date" value={formatPayoffDate(avalanche.payoffDate)} />
          </dl>
          <div className="mt-3 pt-3 border-t border-indigo-200 dark:border-indigo-800">
            <p className="text-xs text-indigo-500 dark:text-indigo-500 font-medium">Payoff order:</p>
            <ol className="mt-1 space-y-0.5">
              {avalanche.payoffOrder.map((name, i) => (
                <li key={name} className="text-xs text-indigo-700 dark:text-indigo-400">
                  {i + 1}. {name}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Snowball */}
        <div className="rounded-md border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-base">⛄</span>
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Snowball</span>
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-500 mb-3">
            Lowest balance first — faster early wins for motivation.
          </p>
          <dl className="space-y-1.5 text-xs">
            <Row label="Total interest" value={formatCurrency(snowball.totalInterestPaid)} />
            <Row label="Time to debt-free" value={formatDuration(snowball.monthsToPayoff)} />
            <Row label="Debt-free date" value={formatPayoffDate(snowball.payoffDate)} />
          </dl>
          <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-800">
            <p className="text-xs text-emerald-500 dark:text-emerald-500 font-medium">Payoff order:</p>
            <ol className="mt-1 space-y-0.5">
              {snowball.payoffOrder.map((name, i) => (
                <li key={name} className="text-xs text-emerald-700 dark:text-emerald-400">
                  {i + 1}. {name}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* Verdict */}
      {interestDiff !== 0 && (
        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          Avalanche saves{' '}
          <span className="font-semibold text-gray-700 dark:text-gray-200">
            {formatCurrency(Math.abs(interestDiff))}
          </span>{' '}
          in interest
          {monthsDiff !== 0 && (
            <>
              {' '}and{' '}
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {formatDuration(Math.abs(monthsDiff))}
              </span>{' '}
              {monthsDiff > 0 ? 'faster' : 'slower'}
            </>
          )}{' '}
          compared to snowball.
        </p>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="font-medium text-gray-800 dark:text-gray-200">{value}</dd>
    </div>
  )
}
