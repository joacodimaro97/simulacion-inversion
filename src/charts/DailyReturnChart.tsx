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
import { formatDate, formatPercent } from '@/utils/format'

interface DailyReturnChartProps {
  data: { date: string; return: number }[]
}

export function DailyReturnChart({ data }: DailyReturnChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
        Sin datos de rendimiento diario
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="date"
          tickFormatter={(v: string) => formatDate(v)}
          stroke="var(--muted-foreground)"
          fontSize={10}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={(v: number) => `${v.toFixed(2)}%`}
          stroke="var(--muted-foreground)"
          fontSize={12}
        />
        <ReferenceLine y={0} stroke="var(--muted-foreground)" />
        <Tooltip
          formatter={(value) => formatPercent(Number(value))}
          labelFormatter={(label) => formatDate(String(label))}
          contentStyle={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
          }}
        />
        <Bar dataKey="return" radius={[2, 2, 0, 0]}>
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
