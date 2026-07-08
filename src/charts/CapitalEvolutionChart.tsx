import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCurrency, formatDate } from '@/utils/format'

interface CapitalEvolutionChartProps {
  data: { date: string; capital: number }[]
}

export function CapitalEvolutionChart({ data }: CapitalEvolutionChartProps) {
  if (data.length === 0) {
    return <EmptyChart message="Agregá registros diarios para ver la evolución del capital" />
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="capitalGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
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
        <Tooltip content={<CapitalTooltip />} />
        <Area
          type="monotone"
          dataKey="capital"
          stroke="var(--chart-1)"
          fill="url(#capitalGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function CapitalTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: { date: string; capital: number } }[]
}) {
  if (!active || !payload?.[0]) return null
  const data = payload[0].payload
  return (
    <div className="rounded-lg border bg-card p-3 shadow-lg">
      <p className="text-xs text-muted-foreground">{formatDate(data.date)}</p>
      <p className="text-sm font-semibold">{formatCurrency(data.capital)}</p>
    </div>
  )
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
      {message}
    </div>
  )
}
