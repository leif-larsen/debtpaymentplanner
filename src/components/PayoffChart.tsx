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
import {
  calculatePayoffPlan,
  formatCurrency,
  getActualBalance,
  getActualBalanceSeries,
} from '../utils/calculations'
import { usePaymentStore } from '../store/usePaymentStore'
import type { Debt } from '../types/debt'

// Planned / forecast line colors (saturated)
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

function buildPlannedMap(debt: Debt): Map<string, number> {
  const plan = calculatePayoffPlan(debt)
  const m = new Map<string, number>()
  m.set(debt.startDate.slice(0, 7), debt.balance)
  for (const row of plan.schedule) m.set(row.date, row.remainingBalance)
  return m
}

function lookupPlanned(map: Map<string, number>, date: string, fallback: number): number {
  if (map.has(date)) return map.get(date)!
  let val = fallback
  for (const [d, v] of map) {
    if (d <= date) val = v
  }
  return val
}

export default function PayoffChart({ debts }: PayoffChartProps) {
  const payments = usePaymentStore((s) => s.payments)

  if (debts.length === 0) return null

  const today = new Date().toISOString().slice(0, 7)

  // Original plans (from stored debt.balance)
  const originalPlans = debts.map((d) => calculatePayoffPlan(d))

  // Per-debt payment lists
  const debtPayments = debts.map((d) => payments.filter((p) => p.debtId === d.id))

  // Actual balance series (history up to today)
  const actualMaps = debts.map((debt, i) => {
    if (debtPayments[i].length === 0) return null
    const series = getActualBalanceSeries(debt, debtPayments[i])
    const raw = new Map<string, number>()
    for (const pt of series) raw.set(pt.date, pt.balance)
    return raw
  })

  // Forecast plans — re-projected from current actual balance, starting today
  const forecastPlans = debts.map((debt, i) => {
    if (!actualMaps[i]) return null
    const actualBalance = getActualBalance(debt, debtPayments[i])
    return calculatePayoffPlan({ ...debt, balance: actualBalance, startDate: today + '-01' })
  })

  // Date range: earliest start → latest of (original payoff, forecast payoff)
  const minDate = debts.reduce(
    (min, d) => (d.startDate.slice(0, 7) < min ? d.startDate.slice(0, 7) : min),
    debts[0].startDate.slice(0, 7)
  )
  const maxDate = [
    ...originalPlans.map((p) => p.payoffDate),
    ...forecastPlans.map((p) => p?.payoffDate ?? ''),
  ].reduce((max, d) => (d > max ? d : max), '')

  const allMonths = generateMonths(minDate, maxDate)

  // Build planned maps
  const plannedMaps = debts.map((d) => buildPlannedMap(d))

  // Build forecast maps (from today onward)
  const forecastMaps = forecastPlans.map((plan, i) => {
    if (!plan) return null
    const m = new Map<string, number>()
    m.set(today, getActualBalance(debts[i], debtPayments[i]))
    for (const row of plan.schedule) m.set(row.date, row.remainingBalance)
    return m
  })

  // Build chart data
  const data = allMonths.map((date) => {
    const point: Record<string, string | number> = { date }

    debts.forEach((debt, i) => {
      // Original planned line (full range)
      point[debt.name] = lookupPlanned(plannedMaps[i], date, debt.balance)

      // Actual line (up to today only)
      const actualMap = actualMaps[i]
      if (actualMap && date <= today) {
        let last = debt.balance
        for (const month of allMonths) {
          if (month > date) break
          if (actualMap.has(month)) last = actualMap.get(month)!
        }
        point[`${debt.name} (actual)`] = last
      }

      // Forecast line (today onward)
      const forecastMap = forecastMaps[i]
      if (forecastMap && date >= today) {
        point[`${debt.name} (forecast)`] = lookupPlanned(
          forecastMap,
          date,
          getActualBalance(debt, debtPayments[i])
        )
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

  const tickInterval = Math.max(1, Math.floor(allMonths.length / 10))
  const hasForecast = forecastPlans.some((p) => p !== null)

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Balance over time</h2>
        {hasForecast && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Solid = original plan · Dashed = actual · Dotted = forecast
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
              {/* Original plan — solid */}
              <Line
                key={`${debt.id}-planned`}
                type="monotone"
                dataKey={debt.name}
                stroke={COLORS[i % COLORS.length]}
                dot={false}
                strokeWidth={2}
              />
              {/* Actual history — dashed, lighter */}
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
              {/* Forecast from current balance — dotted, same saturated color */}
              {forecastMaps[i] && (
                <Line
                  key={`${debt.id}-forecast`}
                  type="monotone"
                  dataKey={`${debt.name} (forecast)`}
                  stroke={COLORS[i % COLORS.length]}
                  dot={false}
                  strokeWidth={2}
                  strokeDasharray="2 4"
                />
              )}
            </>
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
