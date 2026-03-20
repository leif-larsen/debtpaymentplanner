import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { calculatePayoffPlan, formatCurrency, getActualBalanceSeries } from '../utils/calculations'
import { usePaymentStore } from '../store/usePaymentStore'
import type { Debt } from '../types/debt'

// Planned line colors (saturated)
const COLORS = [
  '#6366f1', // indigo-500
  '#f59e0b', // amber-500
  '#10b981', // emerald-500
  '#ef4444', // red-500
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
]

// Actual line colors — lighter shade of each planned color
const ACTUAL_COLORS = [
  '#a5b4fc', // indigo-300
  '#fcd34d', // amber-300
  '#6ee7b7', // emerald-300
  '#fca5a5', // red-300
  '#93c5fd', // blue-300
  '#c4b5fd', // violet-300
  '#f9a8d4', // pink-300
  '#5eead4', // teal-300
]

interface PayoffChartProps {
  debts: Debt[]
}

function generateMonths(from: string, to: string): string[] {
  const months: string[] = []
  let [y, m] = from.split('-').map(Number)
  const [ty, tm] = to.split('-').map(Number)
  while (y < ty || (y === ty && m <= tm)) {
    months.push(`${y}-${String(m).padStart(2, '0')}`)
    m++
    if (m > 12) { m = 1; y++ }
  }
  return months
}

export default function PayoffChart({ debts }: PayoffChartProps) {
  const payments = usePaymentStore((s) => s.payments)

  if (debts.length === 0) return null

  const plans = debts.map((d) => ({ debt: d, plan: calculatePayoffPlan(d) }))
  const today = new Date().toISOString().slice(0, 7)

  const minDate = debts.reduce(
    (min, d) => (d.startDate.slice(0, 7) < min ? d.startDate.slice(0, 7) : min),
    debts[0].startDate.slice(0, 7)
  )
  const maxDate = plans.reduce(
    (max, { plan }) => (plan.payoffDate > max ? plan.payoffDate : max),
    ''
  )

  const allMonths = generateMonths(minDate, maxDate)

  // Build planned balance maps: date → balance per debt
  const plannedMaps = plans.map(({ debt, plan }) => {
    const m = new Map<string, number>()
    m.set(debt.startDate.slice(0, 7), debt.balance)
    for (const row of plan.schedule) {
      m.set(row.date, row.remainingBalance)
    }
    return m
  })

  // Build actual balance maps with forward-fill, capped at today
  const actualMaps = debts.map((debt) => {
    const debtPayments = payments.filter((p) => p.debtId === debt.id)
    if (debtPayments.length === 0) return null
    const series = getActualBalanceSeries(debt, debtPayments)
    const m = new Map<string, number>()
    for (const pt of series) m.set(pt.date, pt.balance)
    // Forward-fill across all months up to today
    const filled = new Map<string, number>()
    let last = debt.balance
    for (const month of allMonths) {
      if (month > today) break
      if (m.has(month)) last = m.get(month)!
      filled.set(month, last)
    }
    return filled
  })

  // Build chart data
  const data = allMonths.map((date) => {
    const point: Record<string, string | number> = { date }
    plans.forEach(({ debt }, i) => {
      // Planned: interpolate from map, forward-fill 0 after payoff
      const plannedMap = plannedMaps[i]
      const startDate = debt.startDate.slice(0, 7)
      if (date < startDate) {
        point[debt.name] = debt.balance
      } else if (plannedMap.has(date)) {
        point[debt.name] = plannedMap.get(date)!
      } else {
        // After payoff, find nearest prior entry
        let val = 0
        for (const [d, v] of plannedMap) {
          if (d <= date) val = v
        }
        point[debt.name] = val
      }

      // Actual
      const actualMap = actualMaps[i]
      if (actualMap && date <= today) {
        const val = actualMap.get(date)
        if (val !== undefined) point[`${debt.name} (actual)`] = val
      }
    })
    return point
  })

  const formatYAxis = (value: number) =>
    new Intl.NumberFormat('nb-NO', { notation: 'compact', currency: 'NOK' }).format(value)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatTooltipValue = (value: any) =>
    typeof value === 'number' ? formatCurrency(value) : String(value ?? '')

  const formatXAxis = (date: string) => {
    if (!date) return ''
    const [y, m] = date.split('-')
    return `${m}/${y.slice(2)}`
  }

  // Show every ~6 months on x-axis to avoid crowding
  const tickInterval = Math.max(1, Math.floor(allMonths.length / 10))

  const hasActual = actualMaps.some((m) => m !== null)

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Balance over time</h2>
        {hasActual && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Solid = planned · Dashed = actual
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={formatXAxis}
            interval={tickInterval}
          />
          <YAxis
            tickFormatter={formatYAxis}
            tick={{ fontSize: 11 }}
            width={60}
          />
          <Tooltip
            formatter={formatTooltipValue}
            labelFormatter={(label) => label}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <ReferenceLine
            x={today}
            stroke="#6b7280"
            strokeDasharray="4 2"
            label={{ value: 'Today', position: 'insideTopRight', fontSize: 10, fill: '#6b7280' }}
          />
          {debts.map((debt, i) => (
            <>
              <Line
                key={`${debt.id}-planned`}
                type="monotone"
                dataKey={debt.name}
                stroke={COLORS[i % COLORS.length]}
                dot={false}
                strokeWidth={2}
              />
              {actualMaps[i] && (
                <Line
                  key={`${debt.id}-actual`}
                  type="monotone"
                  dataKey={`${debt.name} (actual)`}
                  stroke={ACTUAL_COLORS[i % ACTUAL_COLORS.length]}
                  dot={false}
                  strokeWidth={2}
                  strokeDasharray="5 3"
                />
              )}
            </>
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
