import { useDebtStore } from '../store/useDebtStore'
import { calculatePayoffPlan, formatCurrency, formatDuration } from '../utils/calculations'
import DebtCard from './DebtCard'
import PayoffChart from './PayoffChart'
import type { Debt } from '../types/debt'

interface DashboardProps {
  onAddDebt: () => void
  onEditDebt: (debt: Debt) => void
}

function formatPayoffDate(yyyyMM: string): string {
  if (!yyyyMM) return '—'
  const [year, month] = yyyyMM.split('-').map(Number)
  return new Date(year, month - 1).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  })
}

export default function Dashboard({ onAddDebt, onEditDebt }: DashboardProps) {
  const debts = useDebtStore((s) => s.debts)

  const sorted = [...debts].sort((a, b) => b.balance - a.balance)

  if (debts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-gray-400 text-lg mb-2">No debts tracked yet</p>
        <p className="text-gray-400 text-sm mb-6">Add your first debt to start planning your payoff.</p>
        <button
          onClick={onAddDebt}
          className="px-5 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition-colors"
        >
          Add your first debt
        </button>
      </div>
    )
  }

  const plans = debts.map((d) => calculatePayoffPlan(d))
  const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0)
  const totalMonthly = debts.reduce((sum, d) => sum + d.monthlyPayment, 0)
  const totalMinimum = debts.reduce((sum, d) => sum + d.minimumPayment, 0)
  const totalInterest = plans.reduce((sum, p) => sum + p.totalInterestPaid, 0)
  const latestPayoff = plans.reduce(
    (latest, p) => (p.payoffDate > latest ? p.payoffDate : latest),
    ''
  )
  const totalMonths = plans.reduce((max, p) => Math.max(max, p.monthsToPayoff), 0)

  return (
    <div className="space-y-6">
      {/* Summary stats bar */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <SummaryStat label="Total debt" value={formatCurrency(totalDebt)} />
          <SummaryStat label="Monthly payment" value={formatCurrency(totalMonthly)} />
          <SummaryStat label="Minimum payment" value={formatCurrency(totalMinimum)} />
          <SummaryStat
            label="Extra per month"
            value={formatCurrency(totalMonthly - totalMinimum)}
            highlight={totalMonthly > totalMinimum}
          />
          <SummaryStat label="Debt-free date" value={formatPayoffDate(latestPayoff)} />
          <SummaryStat label="Time remaining" value={formatDuration(totalMonths)} />
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200">
          <span className="text-xs text-gray-500">Total interest to pay: </span>
          <span className="text-sm font-semibold text-red-600">{formatCurrency(totalInterest)}</span>
        </div>
      </div>

      {/* Payoff chart */}
      <PayoffChart debts={sorted} />

      {/* Debt list */}
      <div className="grid gap-4 sm:grid-cols-2">
        {sorted.map((debt) => (
          <DebtCard key={debt.id} debt={debt} onEdit={onEditDebt} />
        ))}
      </div>
    </div>
  )
}

function SummaryStat({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className={`text-sm font-semibold mt-0.5 ${highlight ? 'text-green-600' : 'text-gray-900'}`}>
        {value}
      </dd>
    </div>
  )
}
