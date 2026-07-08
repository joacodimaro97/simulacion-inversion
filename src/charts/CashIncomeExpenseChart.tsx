import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from 'recharts'
import { formatCurrency } from '@/utils/format'

interface CashIncomeExpenseChartProps {
  totalIncome: number
  totalExpense: number
}

export function CashIncomeExpenseChart({
  totalIncome,
  totalExpense,
}: CashIncomeExpenseChartProps) {
  const data = [
    { name: 'Ingresos', value: totalIncome, fill: 'var(--chart-1)' },
    { name: 'Gastos', value: totalExpense, fill: 'var(--chart-5)' },
  ]

  if (totalIncome === 0 && totalExpense === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
        Sin ingresos ni gastos en este período
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={288}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
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
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
