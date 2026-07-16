import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns'
import type { Budget, BudgetStatus, Category } from '@/types/cash'

export type BudgetKind = 'account' | 'category'

export function isCategoryBudget(budget: Budget): boolean {
  return (budget.categoryIds?.length ?? 0) > 0 || (budget.categories?.length ?? 0) > 0
}

export function getBudgetKind(budget: Budget): BudgetKind {
  return isCategoryBudget(budget) ? 'category' : 'account'
}

export function getBudgetCurrency(budget: Budget): string {
  return budget.cashAccount?.currency || 'ARS'
}

/**
 * Expande las categorías seleccionadas incluyendo hijos (si se eligió un padre).
 * Útil para filtrar transacciones del gráfico en el frontend.
 */
export function expandCategoryIdsWithChildren(
  selectedIds: string[],
  allCategories: Category[],
): Set<string> {
  const selected = new Set(selectedIds)
  const result = new Set(selectedIds)
  for (const cat of allCategories) {
    if (cat.parentId && selected.has(cat.parentId)) {
      result.add(cat.id)
    }
  }
  return result
}

interface BudgetStatusMeta {
  label: string
  description: string
  badgeClass: string
  barClass: string
  dotClass: string
}

export const BUDGET_STATUS_META: Record<BudgetStatus, BudgetStatusMeta> = {
  NOT_STARTED: {
    label: 'No iniciado',
    description: 'Todavía no empezó el período',
    badgeClass: 'border-transparent bg-slate-400 text-white',
    barClass: 'bg-slate-400',
    dotClass: 'bg-slate-400',
  },
  ON_TRACK: {
    label: 'En camino',
    description: 'Vas al ritmo esperado',
    badgeClass: 'border-transparent bg-success text-success-foreground',
    barClass: 'bg-success',
    dotClass: 'bg-success',
  },
  UNDER_BUDGET: {
    label: 'Por debajo',
    description: 'Gastás menos de lo planificado',
    badgeClass: 'border-transparent bg-blue-500 text-white',
    barClass: 'bg-blue-500',
    dotClass: 'bg-blue-500',
  },
  OVER_BUDGET: {
    label: 'Excedido',
    description: 'Vas por encima de lo planificado',
    badgeClass: 'border-transparent bg-destructive text-destructive-foreground',
    barClass: 'bg-destructive',
    dotClass: 'bg-destructive',
  },
  COMPLETED: {
    label: 'Finalizado',
    description: 'El período ya terminó',
    badgeClass: 'border-transparent bg-slate-500 text-white',
    barClass: 'bg-slate-500',
    dotClass: 'bg-slate-500',
  },
}

export function getBudgetStatusMeta(status: BudgetStatus): BudgetStatusMeta {
  return BUDGET_STATUS_META[status] ?? BUDGET_STATUS_META.NOT_STARTED
}

/** Color de la barra de progreso: rojo si se pasó, si no según el estado. */
export function getBudgetBarClass(status: BudgetStatus, overspent: boolean): string {
  if (overspent) return 'bg-destructive'
  return getBudgetStatusMeta(status).barClass
}

/** Cantidad de días del período (inclusivo en ambos extremos). */
export function totalDaysBetween(startDate: string, endDate: string): number {
  try {
    const diff = differenceInCalendarDays(parseISO(endDate), parseISO(startDate))
    return diff >= 0 ? diff + 1 : 0
  } catch {
    return 0
  }
}

/** Preview de gasto diario planificado = amount / totalDays. */
export function computeDailyAllowancePreview(
  amount: number,
  startDate: string,
  endDate: string,
): number | null {
  const days = totalDaysBetween(startDate, endDate)
  if (days <= 0 || !Number.isFinite(amount) || amount <= 0) return null
  return amount / days
}

export interface BudgetChartPoint {
  date: string
  real: number | null
  ideal: number
}

/**
 * Serie diaria: gasto real acumulado (hasta hoy) vs línea ideal (dailyAllowance * día).
 * `transactions` deben ser sólo gastos reales del período (sin transferencias ni fundings).
 * Si se pasa `allowedCategoryIds`, solo cuenta gastos de esas categorías.
 */
export function buildBudgetChartData(
  budget: Budget,
  transactions: { date: string; amount: number; categoryId?: string }[],
  today: string,
  allowedCategoryIds?: Set<string>,
): BudgetChartPoint[] {
  const { startDate, endDate, analysis } = budget
  const totalDays = totalDaysBetween(startDate, endDate)
  if (totalDays <= 0) return []

  const perDay = new Map<string, number>()
  for (const t of transactions) {
    const day = t.date.slice(0, 10)
    if (day < startDate || day > endDate) continue
    if (allowedCategoryIds && t.categoryId && !allowedCategoryIds.has(t.categoryId)) continue
    if (allowedCategoryIds && !t.categoryId) continue
    perDay.set(day, (perDay.get(day) ?? 0) + t.amount)
  }

  const points: BudgetChartPoint[] = []
  let cumulative = 0
  let cursor = parseISO(startDate)
  for (let i = 0; i < totalDays; i++) {
    const dateStr = format(cursor, 'yyyy-MM-dd')
    cumulative += perDay.get(dateStr) ?? 0
    points.push({
      date: dateStr,
      real: dateStr <= today ? cumulative : null,
      ideal: analysis.dailyAllowance * (i + 1),
    })
    cursor = addDays(cursor, 1)
  }
  return points
}

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, value))
}
