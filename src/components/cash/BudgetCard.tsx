import {
  CalendarRange,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrencyFor, formatDate } from '@/utils/format'
import {
  clampPercent,
  getBudgetBarClass,
  getBudgetCurrency,
  getBudgetStatusMeta,
  isCategoryBudget,
} from '@/utils/budgets'
import { cn } from '@/utils/cn'
import type { Budget, BudgetCategoryRef } from '@/types/cash'

interface BudgetCardProps {
  budget: Budget
  onViewDetail: (budget: Budget) => void
}

export function BudgetCard({ budget, onViewDetail }: BudgetCardProps) {
  const { analysis, cashAccount, categories = [] } = budget
  const currency = getBudgetCurrency(budget)
  const meta = getBudgetStatusMeta(analysis.status)
  const barClass = getBudgetBarClass(analysis.status, analysis.overspent)
  const barWidth = clampPercent(analysis.percentUsed)
  const byCategory = isCategoryBudget(budget)

  const money = (value: number) => formatCurrencyFor(value, currency)

  const isNotStarted = analysis.status === 'NOT_STARTED'
  const isCompleted = analysis.status === 'COMPLETED'
  const goalMet = analysis.spent <= budget.amount

  return (
    <Card className="flex flex-col animate-in transition-shadow hover:shadow-md">
      <CardContent className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold">{budget.name}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {!byCategory && cashAccount && (
                <span className="inline-flex items-center gap-1">
                  <PiggyBank className="h-3.5 w-3.5" />
                  {cashAccount.name}
                </span>
              )}
              {byCategory && cashAccount && (
                <span className="inline-flex items-center gap-1">
                  <PiggyBank className="h-3.5 w-3.5" />
                  {cashAccount.name}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <CalendarRange className="h-3.5 w-3.5" />
                {formatDate(budget.startDate)} – {formatDate(budget.endDate)}
              </span>
            </div>
            {byCategory && categories.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <CategoryChip key={cat.id} category={cat} />
                ))}
              </div>
            )}
          </div>
          <Badge className={cn('shrink-0', meta.badgeClass)}>{meta.label}</Badge>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Gastado {money(analysis.spent)} de {money(budget.amount)}
            </span>
            <span
              className={cn(
                'font-semibold',
                analysis.overspent ? 'text-destructive' : 'text-foreground',
              )}
            >
              {analysis.percentUsed.toFixed(0)}%
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn('h-full rounded-full transition-all', barClass)}
              style={{ width: `${barWidth}%` }}
            />
          </div>
        </div>

        {isNotStarted ? (
          <div className="rounded-lg border border-dashed bg-muted/30 p-3 text-sm">
            <p className="font-medium">Empieza el {formatDate(budget.startDate)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Planificado: {money(analysis.dailyAllowance)}/día durante {analysis.totalDays}{' '}
              días
            </p>
          </div>
        ) : isCompleted ? (
          <div
            className={cn(
              'rounded-lg border p-3 text-sm',
              goalMet
                ? 'border-success/30 bg-success/10'
                : 'border-destructive/30 bg-destructive/10',
            )}
          >
            <p className={cn('font-medium', goalMet ? 'text-success' : 'text-destructive')}>
              {goalMet ? '¡Cumpliste el presupuesto!' : 'Te pasaste del presupuesto'}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Gastaste {money(analysis.spent)} de {money(budget.amount)} ·{' '}
              {goalMet
                ? `te sobraron ${money(analysis.remaining)}`
                : `te excediste ${money(Math.abs(analysis.remaining))}`}
            </p>
          </div>
        ) : analysis.overspent ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">
              <p className="font-semibold text-destructive">
                Te pasaste {money(Math.abs(analysis.remaining))}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Restante: {money(analysis.remaining)} · Gastado {money(analysis.spent)} de{' '}
                {money(budget.amount)}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Al ritmo actual terminarías gastando{' '}
              <span className="font-medium text-foreground">
                {money(analysis.projectedTotal)}
              </span>
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Metric
                icon={Wallet}
                label="Podés gastar"
                value={`${money(analysis.suggestedDailyRemaining)}/día`}
                accent={analysis.suggestedDailyRemaining <= 0 ? 'danger' : 'success'}
              />
              <Metric
                label={`Te quedan · ${analysis.daysRemaining} días`}
                value={money(analysis.remaining)}
                accent={analysis.remaining < 0 ? 'danger' : 'default'}
              />
            </div>

            <div
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm',
                analysis.difference >= 0
                  ? 'bg-success/10 text-success'
                  : 'bg-destructive/10 text-destructive',
              )}
            >
              {analysis.difference >= 0 ? (
                <TrendingUp className="h-4 w-4 shrink-0" />
              ) : (
                <TrendingDown className="h-4 w-4 shrink-0" />
              )}
              <span className="font-medium">
                {analysis.difference >= 0
                  ? `Vas bien, ${money(analysis.difference)} por debajo de lo esperado`
                  : `Te pasaste ${money(Math.abs(analysis.difference))} de lo esperado a hoy`}
              </span>
            </div>

            <p className="text-xs text-muted-foreground">
              Al ritmo actual terminarías gastando{' '}
              <span className="font-medium text-foreground">
                {money(analysis.projectedTotal)}
              </span>
            </p>
          </>
        )}

        <Button
          variant="outline"
          className="mt-auto w-full"
          onClick={() => onViewDetail(budget)}
        >
          Ver detalle
        </Button>
      </CardContent>
    </Card>
  )
}

function CategoryChip({ category }: { category: BudgetCategoryRef }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium"
      style={
        category.color
          ? { borderColor: `${category.color}55`, backgroundColor: `${category.color}18` }
          : undefined
      }
    >
      {category.color && (
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: category.color }}
        />
      )}
      {category.name}
    </span>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
  accent = 'default',
}: {
  icon?: typeof Wallet
  label: string
  value: string
  accent?: 'default' | 'danger' | 'success'
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </p>
      <p
        className={cn(
          'mt-1 text-base font-bold',
          accent === 'danger' && 'text-destructive',
          accent === 'success' && 'text-success',
          accent === 'default' && 'text-foreground',
        )}
      >
        {value}
      </p>
    </div>
  )
}
