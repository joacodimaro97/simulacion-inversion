import { cn } from '@/utils/cn'
import { formatCurrency } from '@/utils/format'
import {
  getIntentLabel,
  getIntentStyles,
  isCashTransactionIntent,
  NULL_INTENT_LABEL,
} from '@/utils/cashIntent'
import type { CashIntentSummaryItem } from '@/types/cash'

interface IntentMetricsGridProps {
  items: CashIntentSummaryItem[]
  className?: string
}

function resolveLabel(intent: CashIntentSummaryItem['intent']): string {
  if (intent == null) return NULL_INTENT_LABEL
  return isCashTransactionIntent(intent) ? getIntentLabel(intent) : intent
}

export function IntentMetricsGrid({ items, className }: IntentMetricsGridProps) {
  if (items.length === 0) return null

  return (
    <div className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-4', className)}>
      {items.map((item) => {
        const key = item.intent ?? 'null'
        const styles =
          item.intent != null && isCashTransactionIntent(item.intent)
            ? getIntentStyles(item.intent)
            : null

        return (
          <div
            key={key}
            className="rounded-xl border border-border/80 bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  'inline-flex rounded-md border px-2 py-0.5 text-xs font-medium',
                  styles?.badge ?? 'border-transparent bg-muted text-muted-foreground',
                )}
              >
                {resolveLabel(item.intent)}
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {item.count} {item.count === 1 ? 'gasto' : 'gastos'}
              </span>
            </div>
            <p className="mt-3 text-xl font-bold tracking-tight tabular-nums">
              {formatCurrency(item.total)}
            </p>
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Del gasto neto</span>
                <span className="font-medium tabular-nums text-foreground/80">
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    'h-full rounded-full transition-[width]',
                    item.intent === 'NECESIDAD' && 'bg-success',
                    item.intent === 'CONVENIENCIA' && 'bg-sky-500',
                    item.intent === 'GUSTO' && 'bg-violet-500',
                    item.intent === 'IMPULSO' && 'bg-orange-500',
                    item.intent == null && 'bg-muted-foreground',
                  )}
                  style={{ width: `${Math.min(100, Math.max(0, item.percentage))}%` }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
