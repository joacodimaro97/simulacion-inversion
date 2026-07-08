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
import { formatCurrency } from '@/utils/format'

const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

interface SimulationComparisonChartProps {
  series: {
    name: string
    data: { day: number; capital: number }[]
  }[]
}

export function SimulationComparisonChart({ series }: SimulationComparisonChartProps) {
  if (series.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
        Seleccioná simulaciones para comparar
      </div>
    )
  }

  const maxLength = Math.max(...series.map((s) => s.data.length))
  const chartData = Array.from({ length: maxLength }, (_, i) => {
    const point: Record<string, number> = { day: i }
    for (const s of series) {
      point[s.name] = s.data[i]?.capital ?? 0
    }
    return point
  })

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="day"
          tickFormatter={(v: number) => `Día ${v}`}
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
          contentStyle={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
          }}
        />
        <Legend />
        {series.map((s, i) => (
          <Line
            key={s.name}
            type="monotone"
            dataKey={s.name}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
