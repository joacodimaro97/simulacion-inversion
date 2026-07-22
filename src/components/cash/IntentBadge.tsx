import { Badge } from '@/components/ui/badge'
import { cn } from '@/utils/cn'
import { INTENT_LABELS, INTENT_STYLES, resolveDisplayIntent } from '@/utils/cashIntent'
import type { CashTransaction, CashTransactionIntent } from '@/types/cash'

interface IntentBadgeProps {
  intent?: CashTransactionIntent | null
  transaction?: Pick<
    CashTransaction,
    'type' | 'intent' | 'transferId' | 'fundingId' | 'creditInstallmentId'
  >
  className?: string
}

export function IntentBadge({ intent, transaction, className }: IntentBadgeProps) {
  const resolved =
    intent ?? (transaction ? resolveDisplayIntent(transaction) : null)
  if (!resolved) return null

  return (
    <Badge className={cn(INTENT_STYLES[resolved].badge, className)}>
      {INTENT_LABELS[resolved]}
    </Badge>
  )
}
