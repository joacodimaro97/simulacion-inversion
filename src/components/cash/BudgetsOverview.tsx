import { Link } from 'react-router-dom'
import { Target } from 'lucide-react'
import { useCashBudgets } from '@/hooks/useCashBudgets'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  const { data: budgets = [], isLoading } = useCashBudgets()

  const sorted = [...budgets].sort(
    (a, b) => STATUS_ORDER[a.analysis.status] - STATUS_ORDER[b.analysis.status],
  )
  const visible = sorted.slice(0, MAX_ITEMS)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Presupuestos</CardTitle>
        <Link
          to={ROUTES.CASH_BUDGETS}
          className="text-xs text-muted-foreground hover:text-primary"
        >
          Ver todos
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : budgets.length === 0 ? (
          <div className="flex h-24 flex-col items-center justify-center gap-2 text-center">
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
          <div className="space-y-3">
            {visible.map((budget) => (
              <BudgetRow key={budget.id} budget={budget} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
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
      className="block rounded-lg border bg-muted/30 p-3 transition-colors hover:bg-muted/50"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{budget.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {scopeLabel} · {hint}
          </p>
        </div>
        <Badge className={cn('shrink-0', meta.badgeClass)}>{meta.label}</Badge>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn('h-full rounded-full transition-all', barClass)}
            style={{ width: `${clampPercent(analysis.percentUsed)}%` }}
          />
        </div>
        <span
          className={cn(
            'shrink-0 text-xs font-semibold',
            analysis.overspent ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {analysis.percentUsed.toFixed(0)}%
        </span>
      </div>
    </Link>
  )
}
