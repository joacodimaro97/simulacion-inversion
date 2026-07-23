import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { formatCurrency } from '@/utils/format'
import {
  getIntentLabel,
  INTENT_CHART_COLORS,
  isCashTransactionIntent,
  NULL_INTENT_CHART_COLOR,
  NULL_INTENT_LABEL,
} from '@/utils/cashIntent'
import type { CashIntentSummaryItem } from '@/types/cash'

interface CashIntentBreakdownChartProps {
  data: CashIntentSummaryItem[]
}

function resolveIntentName(intent: CashIntentSummaryItem['intent']): string {
  if (intent == null) return NULL_INTENT_LABEL
  return isCashTransactionIntent(intent) ? getIntentLabel(intent) : intent
}

function resolveIntentColor(intent: CashIntentSummaryItem['intent']): string {
  if (intent != null && isCashTransactionIntent(intent)) {
    return INTENT_CHART_COLORS[intent]
  }
  return NULL_INTENT_CHART_COLOR
}

export function CashIntentBreakdownChart({ data }: CashIntentBreakdownChartProps) {
  const chartData = data
    .filter((item) => item.total > 0 || item.count > 0)
    .map((item) => ({
      name: resolveIntentName(item.intent),
      value: item.total,
      percentage: item.percentage,
      fill: resolveIntentColor(item.intent),
    }))

  if (chartData.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
        Sin gastos etiquetados en este período
      </div>
    )
  }

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
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, _name, item) => {
            const percentage = Number(item.payload?.percentage ?? 0)
            return [
              `${formatCurrency(Number(value))} (${percentage.toFixed(1)}%)`,
              'Neto',
            ]
          }}
          contentStyle={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          layout="horizontal"
          verticalAlign="bottom"
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
