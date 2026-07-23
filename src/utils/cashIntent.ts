import type { CashTransaction, CashTransactionIntent } from '@/types/cash'

export const CASH_TRANSACTION_INTENTS: CashTransactionIntent[] = [
  'NECESIDAD',
  'CONVENIENCIA',
  'GUSTO',
  'IMPULSO',
]

export const INTENT_LABELS: Record<CashTransactionIntent, string> = {
  NECESIDAD: 'Necesidad',
  CONVENIENCIA: 'Conveniencia',
  GUSTO: 'Gusto',
  IMPULSO: 'Impulso',
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
  CONVENIENCIA: {
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
}

/** Colores para charts (recharts no resuelve clases Tailwind). */
export const INTENT_CHART_COLORS: Record<CashTransactionIntent, string> = {
  NECESIDAD: 'var(--chart-1)',
  CONVENIENCIA: 'var(--chart-2)',
  GUSTO: 'var(--chart-4)',
  IMPULSO: 'var(--chart-5)',
}

export const NULL_INTENT_CHART_COLOR = 'var(--muted-foreground)'
export const NULL_INTENT_LABEL = 'Sin etiqueta'

const FALLBACK_STYLE = {
  badge: 'border-transparent bg-muted text-muted-foreground',
  chip: 'border-border text-muted-foreground hover:bg-muted',
  chipActive: 'border-foreground/30 bg-secondary text-secondary-foreground',
}

export function isCashTransactionIntent(
  value: string | null | undefined,
): value is CashTransactionIntent {
  return (
    value != null &&
    (CASH_TRANSACTION_INTENTS as string[]).includes(value)
  )
}

export function getIntentLabel(intent: string): string {
  return isCashTransactionIntent(intent) ? INTENT_LABELS[intent] : intent
}

export function getIntentStyles(intent: string) {
  return isCashTransactionIntent(intent) ? INTENT_STYLES[intent] : FALLBACK_STYLE
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
): string | null {
  if (!isEditableExpense(tx) || !tx.intent) return null
  return tx.intent
}
