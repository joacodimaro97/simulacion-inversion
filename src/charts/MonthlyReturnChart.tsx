import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from 'recharts'
import { formatMonth, formatPercent } from '@/utils/format'

interface MonthlyReturnChartProps {
  data: { month: string; return: number }[]
}

export function MonthlyReturnChart({ data }: MonthlyReturnChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
        Sin datos de rendimiento mensual
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="month"
          tickFormatter={(v: string) => formatMonth(v)}
          stroke="var(--muted-foreground)"
          fontSize={12}
        />
        <YAxis
          tickFormatter={(v: number) => `${v.toFixed(1)}%`}
          stroke="var(--muted-foreground)"
          fontSize={12}
        />
        <ReferenceLine y={0} stroke="var(--muted-foreground)" />
        <Tooltip
          formatter={(value) => formatPercent(Number(value))}
          labelFormatter={(label) => formatMonth(String(label))}
          contentStyle={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
          }}
        />
        <Bar dataKey="return" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={index}
              fill={entry.return >= 0 ? 'var(--chart-1)' : 'var(--chart-5)'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
