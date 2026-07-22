import { Label } from '@/components/ui/label'
import { cn } from '@/utils/cn'
import {
  CASH_TRANSACTION_INTENTS,
  INTENT_LABELS,
  INTENT_STYLES,
} from '@/utils/cashIntent'
import type { CashTransactionIntent } from '@/types/cash'

interface IntentSelectorProps {
  value: CashTransactionIntent
  onChange: (intent: CashTransactionIntent) => void
  className?: string
}

export function IntentSelector({ value, onChange, className }: IntentSelectorProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label>Intención (opcional)</Label>
      <div
        role="group"
        aria-label="Intención del gasto (opcional)"
        className="flex flex-wrap gap-1.5"
      >
        {CASH_TRANSACTION_INTENTS.map((intent) => {
          const active = value === intent
          const styles = INTENT_STYLES[intent]
          return (
            <button
              key={intent}
              type="button"
              onClick={() => onChange(intent)}
              className={cn(
                'inline-flex min-h-9 cursor-pointer items-center rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors',
                active ? styles.chipActive : styles.chip,
              )}
            >
              {INTENT_LABELS[intent]}
            </button>
          )
        })}
      </div>
    </div>
  )
}
