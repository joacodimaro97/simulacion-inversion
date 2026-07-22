import type { CashTransaction, CashTransactionIntent } from '@/types/cash'

export const DEFAULT_EXPENSE_INTENT: CashTransactionIntent = 'REVISAR'

export const CASH_TRANSACTION_INTENTS: CashTransactionIntent[] = [
  'NECESIDAD',
  'CUIDADO',
  'GUSTO',
  'IMPULSO',
  'REVISAR',
]

export const INTENT_LABELS: Record<CashTransactionIntent, string> = {
  NECESIDAD: 'Necesidad',
  CUIDADO: 'Cuidado',
  GUSTO: 'Gusto',
  IMPULSO: 'Impulso',
  REVISAR: 'Revisar',
}

/** Clases de color alineadas al design system (badge / chips). */
export const INTENT_STYLES: Record<
  CashTransactionIntent,
  { badge: string; chip: string; chipActive: string }
> = {
  NECESIDAD: {
    badge: 'border-transparent bg-success/15 text-success',
    chip: 'border-success/30 text-success hover:bg-success/10',
    chipActive: 'border-success bg-success text-success-foreground',
  },
  CUIDADO: {
    badge: 'border-transparent bg-sky-500/15 text-sky-700 dark:text-sky-300',
    chip: 'border-sky-500/30 text-sky-700 hover:bg-sky-500/10 dark:text-sky-300',
    chipActive: 'border-sky-600 bg-sky-600 text-white',
  },
  GUSTO: {
    badge: 'border-transparent bg-violet-500/15 text-violet-700 dark:text-violet-300',
    chip: 'border-violet-500/30 text-violet-700 hover:bg-violet-500/10 dark:text-violet-300',
    chipActive: 'border-violet-600 bg-violet-600 text-white',
  },
  IMPULSO: {
    badge: 'border-transparent bg-orange-500/15 text-orange-700 dark:text-orange-300',
    chip: 'border-orange-500/30 text-orange-700 hover:bg-orange-500/10 dark:text-orange-300',
    chipActive: 'border-orange-600 bg-orange-600 text-white',
  },
  REVISAR: {
    badge: 'border-transparent bg-muted text-muted-foreground',
    chip: 'border-border text-muted-foreground hover:bg-muted',
    chipActive: 'border-foreground/30 bg-secondary text-secondary-foreground',
  },
}

/** Gastos normales (no transfer / funding / crédito). */
export function isEditableExpense(tx: Pick<
  CashTransaction,
  'type' | 'transferId' | 'fundingId' | 'creditInstallmentId'
>): boolean {
  return (
    tx.type === 'EXPENSE' &&
    !tx.transferId &&
    !tx.fundingId &&
    !tx.creditInstallmentId
  )
}

/** Intent a mostrar en UI para un gasto editable; null si no aplica. */
export function resolveDisplayIntent(
  tx: Pick<
    CashTransaction,
    'type' | 'intent' | 'transferId' | 'fundingId' | 'creditInstallmentId'
  >,
): CashTransactionIntent | null {
  if (!isEditableExpense(tx)) return null
  return tx.intent ?? DEFAULT_EXPENSE_INTENT
}
