import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { calculatePayoffPlan, formatCurrency } from '../utils/calculations'
import type { Debt } from '../types/debt'

const COLORS = [
  '#6366f1', // indigo
  '#f59e0b', // amber
  '#10b981', // emerald
  '#ef4444', // red
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
]

interface PayoffChartProps {
  debts: Debt[]
}

interface ChartPoint {
  month: number
  [debtName: string]: number
}

export default function PayoffChart({ debts }: PayoffChartProps) {
  if (debts.length === 0) return null

  const plans = debts.map((d) => ({ debt: d, plan: calculatePayoffPlan(d) }))
  const maxMonths = Math.max(...plans.map((p) => p.plan.monthsToPayoff))

  // Build one data point per month across all debts
  const data: ChartPoint[] = Array.from({ length: maxMonths + 1 }, (_, i) => {
    const point: ChartPoint = { month: i }
    for (const { debt, plan } of plans) {
      if (i === 0) {
        point[debt.name] = debt.balance
      } else {
        const row = plan.schedule[i - 1]
        point[debt.name] = row ? row.remainingBalance : 0
      }
    }
    return point
  })

  const formatYAxis = (value: number) =>
    new Intl.NumberFormat('nb-NO', { notation: 'compact', currency: 'NOK' }).format(value)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatTooltipValue = (value: any) =>
    typeof value === 'number' ? formatCurrency(value) : String(value ?? '')

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Balance over time</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11 }}
            label={{ value: 'Months', position: 'insideBottomRight', offset: -8, fontSize: 11 }}
          />
          <YAxis
            tickFormatter={formatYAxis}
            tick={{ fontSize: 11 }}
            width={60}
          />
          <Tooltip
            formatter={formatTooltipValue}
            labelFormatter={(label) => `Month ${label}`}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {debts.map((debt, i) => (
            <Line
              key={debt.id}
              type="monotone"
              dataKey={debt.name}
              stroke={COLORS[i % COLORS.length]}
              dot={false}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
