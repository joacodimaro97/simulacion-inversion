import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCurrency } from '@/utils/format'
import type { CashSummaryByCategory } from '@/types/cash'

interface CashCategoryChartProps {
  data: CashSummaryByCategory[]
}

function useYAxisWidth() {
  const [width, setWidth] = useState(140)

  useEffect(() => {
    const update = () => setWidth(window.innerWidth < 640 ? 72 : 140)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return width
}

export function CashCategoryChart({ data }: CashCategoryChartProps) {
  const yAxisWidth = useYAxisWidth()

  if (data.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
        Sin datos por categoría
      </div>
    )
  }

  const chartData = data.map((item) => ({
    name: item.parentCategoryName
      ? `${item.parentCategoryName} / ${item.categoryName}`
      : item.categoryName,
    total: item.total,
    type: item.type,
  }))

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 4, right: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          type="number"
          tickFormatter={(v: number) => formatCurrency(v)}
          stroke="var(--muted-foreground)"
          fontSize={11}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={yAxisWidth}
          stroke="var(--muted-foreground)"
          fontSize={10}
          tick={{ fontSize: 10 }}
        />
        <Tooltip
          formatter={(value) => formatCurrency(Number(value))}
          contentStyle={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
          }}
        />
        <Bar dataKey="total" radius={[0, 4, 4, 0]}>
          {chartData.map((entry, index) => (
            <Cell
              key={index}
              fill={entry.type === 'INCOME' ? 'var(--chart-1)' : 'var(--chart-5)'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
