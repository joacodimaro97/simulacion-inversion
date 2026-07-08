import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts'
import { formatCurrency, formatDate } from '@/utils/format'

interface CapitalVsContributionsChartProps {
  data: { date: string; capital: number; contributions: number }[]
}

export function CapitalVsContributionsChart({ data }: CapitalVsContributionsChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
        Sin datos para comparar
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="date"
          tickFormatter={(v: string) => formatDate(v)}
          stroke="var(--muted-foreground)"
          fontSize={12}
        />
        <YAxis
          tickFormatter={(v: number) => formatCurrency(v)}
          stroke="var(--muted-foreground)"
          fontSize={12}
          width={80}
        />
        <Tooltip
          formatter={(value) => formatCurrency(Number(value))}
          labelFormatter={(label) => formatDate(String(label))}
          contentStyle={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="capital"
          name="Capital"
          stroke="var(--chart-1)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="contributions"
          name="Aportes"
          stroke="var(--chart-2)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
