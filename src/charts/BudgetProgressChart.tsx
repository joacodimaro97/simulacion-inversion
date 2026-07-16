import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCurrencyFor, formatDate } from '@/utils/format'
import type { BudgetChartPoint } from '@/utils/budgets'

interface BudgetProgressChartProps {
  data: BudgetChartPoint[]
  currency: string
}

export function BudgetProgressChart({ data, currency }: BudgetProgressChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
        Sin datos para graficar
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={288}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="date"
          tickFormatter={(v: string) => formatDate(v)}
          stroke="var(--muted-foreground)"
          fontSize={11}
          minTickGap={24}
        />
        <YAxis
          tickFormatter={(v: number) => formatCurrencyFor(v, currency)}
          stroke="var(--muted-foreground)"
          fontSize={11}
          width={72}
        />
        <Tooltip content={<BudgetTooltip currency={currency} />} />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          formatter={(value) => (value === 'real' ? 'Gasto real' : 'Ritmo ideal')}
        />
        <Line
          type="monotone"
          dataKey="ideal"
          name="ideal"
          stroke="var(--muted-foreground)"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="real"
          name="real"
          stroke="var(--chart-1)"
          strokeWidth={2}
          dot={false}
          connectNulls={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

function BudgetTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean
  payload?: { dataKey: string; value: number | null }[]
  label?: string
  currency: string
}) {
  if (!active || !payload?.length) return null
  const real = payload.find((p) => p.dataKey === 'real')?.value
  const ideal = payload.find((p) => p.dataKey === 'ideal')?.value

  return (
    <div className="rounded-lg border bg-card p-3 shadow-lg">
      <p className="mb-1 text-xs text-muted-foreground">{formatDate(String(label))}</p>
      {typeof real === 'number' && (
        <p className="text-sm font-semibold text-chart-1">
          Gasto real: {formatCurrencyFor(real, currency)}
        </p>
      )}
      {typeof ideal === 'number' && (
        <p className="text-xs text-muted-foreground">
          Ritmo ideal: {formatCurrencyFor(ideal, currency)}
        </p>
      )}
    </div>
  )
}
