import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Pencil, Trash2 } from 'lucide-react'
import { useCashBudget, useDeleteCashBudget } from '@/hooks/useCashBudgets'
import { useCashCategories } from '@/hooks/useCashCategories'
import { CashTransactionService } from '@/services/CashTransactionService'
import { queryKeys } from '@/constants'
import { Dialog } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BudgetProgressChart } from '@/charts/BudgetProgressChart'
import { formatCurrencyFor, formatDate, todayISO } from '@/utils/format'
import {
  buildBudgetChartData,
  clampPercent,
  expandCategoryIdsWithChildren,
  getBudgetBarClass,
  getBudgetCurrency,
  getBudgetStatusMeta,
  isCategoryBudget,
} from '@/utils/budgets'
import { cn } from '@/utils/cn'
import type { Budget } from '@/types/cash'

interface BudgetDetailModalProps {
  open: boolean
  budget: Budget | null
  onClose: () => void
  onEdit: (budget: Budget) => void
}

export function BudgetDetailModal({ open, budget, onClose, onEdit }: BudgetDetailModalProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const deleteBudget = useDeleteCashBudget()
  const { data: allCategories = [] } = useCashCategories({ type: 'EXPENSE' })

  const { data: fresh } = useCashBudget(open ? (budget?.id ?? null) : null, budget ?? undefined)
  const display = fresh ?? budget

  const byCategory = display ? isCategoryBudget(display) : false

  const txFilters = display
    ? {
        ...(display.cashAccountId ? { cashAccountId: display.cashAccountId } : {}),
        type: 'EXPENSE' as const,
        startDate: display.startDate.slice(0, 10),
        endDate: display.endDate.slice(0, 10),
        excludeTransfers: true,
        excludeFundings: true,
      }
    : undefined

  const { data: txData } = useQuery({
    queryKey: queryKeys.cash.transactions(txFilters),
    queryFn: () => CashTransactionService.getTransactions(txFilters),
    enabled: open && Boolean(display),
  })
  const transactions = txData?.items ?? []

  const allowedCategoryIds = useMemo(() => {
    if (!display || !byCategory) return undefined
    return expandCategoryIdsWithChildren(display.categoryIds ?? [], allCategories)
  }, [display, byCategory, allCategories])

  const handleDelete = async () => {
    if (!display) return
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    await deleteBudget.mutateAsync(display.id)
    setConfirmDelete(false)
    onClose()
  }

  const handleClose = () => {
    setConfirmDelete(false)
    onClose()
  }

  const currency = display ? getBudgetCurrency(display) : 'ARS'
  const money = (value: number) => formatCurrencyFor(value, currency)

  const analysis = display?.analysis
  const meta = analysis ? getBudgetStatusMeta(analysis.status) : null
  const chartData = display
    ? buildBudgetChartData(display, transactions, todayISO(), allowedCategoryIds)
    : []

  const subtitle = display
    ? [
        byCategory
          ? (display.categories ?? []).map((c) => c.name).join(', ') || 'Por categoría'
          : display.cashAccount?.name,
        `${formatDate(display.startDate)} – ${formatDate(display.endDate)}`,
      ]
        .filter(Boolean)
        .join(' · ')
    : undefined

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={display?.name ?? 'Presupuesto'}
      description={subtitle}
      className="max-w-2xl"
    >
      {display && analysis && meta ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={meta.badgeClass}>{meta.label}</Badge>
              <Badge variant="outline">{byCategory ? 'Por categoría' : 'Por cuenta'}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Solo visual · no descuenta ni bloquea tu saldo
            </p>
          </div>

          {byCategory && (display.categories?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {display.categories.map((cat) => (
                <span
                  key={cat.id}
                  className="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium"
                  style={
                    cat.color
                      ? {
                          borderColor: `${cat.color}55`,
                          backgroundColor: `${cat.color}18`,
                        }
                      : undefined
                  }
                >
                  {cat.color && (
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                  )}
                  {cat.name}
                </span>
              ))}
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {money(analysis.spent)} de {money(display.amount)}
              </span>
              <span
                className={cn(
                  'font-semibold',
                  analysis.overspent ? 'text-destructive' : 'text-foreground',
                )}
              >
                {analysis.percentUsed.toFixed(1)}%
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  getBudgetBarClass(analysis.status, analysis.overspent),
                )}
                style={{ width: `${clampPercent(analysis.percentUsed)}%` }}
              />
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Gasto real vs ritmo ideal</p>
            <BudgetProgressChart data={chartData} currency={currency} />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Días totales" value={String(analysis.totalDays)} />
            <Stat label="Días transcurridos" value={String(analysis.daysElapsed)} />
            <Stat label="Días restantes" value={String(analysis.daysRemaining)} />
            <Stat label="Gasto diario planificado" value={money(analysis.dailyAllowance)} />
            <Stat label="Gastado" value={money(analysis.spent)} />
            <Stat
              label="Restante"
              value={money(analysis.remaining)}
              accent={analysis.remaining < 0 ? 'danger' : 'default'}
            />
            <Stat label="Esperado a hoy" value={money(analysis.expectedToDate)} />
            <Stat
              label="Diferencia"
              value={money(analysis.difference)}
              accent={analysis.difference >= 0 ? 'success' : 'danger'}
            />
            <Stat
              label="Podés gastar por día"
              value={money(analysis.suggestedDailyRemaining)}
              accent={analysis.suggestedDailyRemaining <= 0 ? 'danger' : 'success'}
            />
            <Stat label="Promedio gastado/día" value={money(analysis.averageDailySpent)} />
            <Stat label="Proyección total" value={money(analysis.projectedTotal)} />
            <Stat label="% usado" value={`${analysis.percentUsed.toFixed(1)}%`} />
          </div>

          <div className="flex gap-2 border-t pt-4">
            <Button variant="outline" className="flex-1" onClick={() => onEdit(display)}>
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
            <Button
              variant="outline"
              className="flex-1 text-destructive hover:text-destructive"
              onClick={handleDelete}
              disabled={deleteBudget.isPending}
            >
              <Trash2 className="h-4 w-4" />
              {confirmDelete ? 'Confirmar eliminación' : 'Eliminar'}
            </Button>
          </div>
        </div>
      ) : null}
    </Dialog>
  )
}

function Stat({
  label,
  value,
  accent = 'default',
}: {
  label: string
  value: string
  accent?: 'default' | 'success' | 'danger'
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={cn('mt-1 text-sm font-bold', {
          'text-success': accent === 'success',
          'text-destructive': accent === 'danger',
        })}
      >
        {value}
      </p>
    </div>
  )
}
