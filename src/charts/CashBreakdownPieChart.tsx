import {
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import { formatCurrency } from '@/utils/format'
import type { CashSummaryByParentCategory } from '@/types/cash'

const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  '#22d3ee',
  '#a78bfa',
  '#fb7185',
]

interface CashBreakdownPieChartProps {
  data: CashSummaryByParentCategory[]
  emptyMessage: string
}

export function CashBreakdownPieChart({ data, emptyMessage }: CashBreakdownPieChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  const chartData = data.map((item) => ({
    name: item.categoryName,
    value: item.total,
  }))

  return (
    <ResponsiveContainer width="100%" height={288}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={95}
          paddingAngle={2}
        >
          {chartData.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => formatCurrency(Number(value))}
          contentStyle={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
