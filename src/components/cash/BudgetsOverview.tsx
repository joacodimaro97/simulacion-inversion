import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Target } from 'lucide-react'
import { useCashBudgets } from '@/hooks/useCashBudgets'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrencyFor } from '@/utils/format'
import {
  clampPercent,
  getBudgetBarClass,
  getBudgetCurrency,
  getBudgetStatusMeta,
  isCategoryBudget,
} from '@/utils/budgets'
import { ROUTES } from '@/constants'
import { cn } from '@/utils/cn'
import type { Budget, BudgetStatus } from '@/types/cash'

const STATUS_ORDER: Record<BudgetStatus, number> = {
  OVER_BUDGET: 0,
  ON_TRACK: 1,
  UNDER_BUDGET: 2,
  NOT_STARTED: 3,
  COMPLETED: 4,
}

const MAX_ITEMS = 4

export function BudgetsOverview() {
  const [open, setOpen] = useState(true)
  const { data: budgets = [], isLoading } = useCashBudgets()

  const sorted = [...budgets].sort(
    (a, b) => STATUS_ORDER[a.analysis.status] - STATUS_ORDER[b.analysis.status],
  )
  const visible = sorted.slice(0, MAX_ITEMS)

  return (
    <section className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-1 border-b border-border/60 bg-muted/20 px-2 py-1 sm:px-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex min-h-10 flex-1 cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted/60"
        >
          <Target className="h-4 w-4 shrink-0 text-primary" />
          <span className="text-sm font-semibold tracking-tight">Mis presupuestos</span>
          {!isLoading && budgets.length > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium tabular-nums text-primary">
              {budgets.length}
            </span>
          )}
          <ChevronDown
            className={cn(
              'ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
              open ? 'rotate-0' : '-rotate-90',
            )}
          />
        </button>
        <Link
          to={ROUTES.CASH_BUDGETS}
          className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
          onClick={(e) => e.stopPropagation()}
        >
          Ver todos
        </Link>
      </div>

      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div className="p-2.5 sm:p-3">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : budgets.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Creá un presupuesto por categoría, ej. $80.000 en Alimentación este mes
                </p>
                <Link
                  to={ROUTES.CASH_BUDGETS}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  <Target className="h-4 w-4" />
                  Creá tu primer presupuesto
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {visible.map((budget) => (
                  <BudgetRow key={budget.id} budget={budget} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function BudgetRow({ budget }: { budget: Budget }) {
  const { analysis } = budget
  const currency = getBudgetCurrency(budget)
  const meta = getBudgetStatusMeta(analysis.status)
  const barClass = getBudgetBarClass(analysis.status, analysis.overspent)
  const money = (value: number) => formatCurrencyFor(value, currency)
  const byCategory = isCategoryBudget(budget)

  const scopeLabel = byCategory
    ? (budget.categories ?? []).map((c) => c.name).join(', ') || 'Categorías'
    : budget.cashAccount?.name ?? 'Cuenta'

  const hint = analysis.overspent
    ? `Te pasaste ${money(Math.abs(analysis.remaining))}`
    : analysis.status === 'NOT_STARTED'
      ? `Planificado: ${money(analysis.dailyAllowance)}/día`
      : analysis.status === 'COMPLETED'
        ? `Gastaste ${money(analysis.spent)} de ${money(budget.amount)}`
        : `Podés gastar ${money(analysis.suggestedDailyRemaining)}/día · ${analysis.daysRemaining} días`

  return (
    <Link
      to={ROUTES.CASH_BUDGETS}
      className="block rounded-lg border border-border/70 bg-background px-2.5 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-px hover:border-primary/25 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium leading-tight">{budget.name}</p>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {scopeLabel} · {hint}
          </p>
        </div>
        <Badge className={cn('shrink-0 text-[10px]', meta.badgeClass)}>{meta.label}</Badge>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn('h-full rounded-full transition-all', barClass)}
            style={{ width: `${clampPercent(analysis.percentUsed)}%` }}
          />
        </div>
        <span
          className={cn(
            'shrink-0 text-[11px] font-semibold tabular-nums',
            analysis.overspent ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {analysis.percentUsed.toFixed(0)}%
        </span>
      </div>
    </Link>
  )
}
