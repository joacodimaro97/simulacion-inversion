import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownLeft, ArrowUpRight, CalendarDays, DollarSign, Scale } from 'lucide-react'
import { useCashAccounts } from '@/hooks/useCashAccounts'
import { useCashSummary } from '@/hooks/useCashSummary'
import { useCashIntentSummary } from '@/hooks/useCashIntentSummary'
import { useAccountSummaries } from '@/hooks/useAccountSummaries'
import { CashPeriodFilters } from '@/components/cash/CashPeriodFilters'
import { IntentMetricsGrid } from '@/components/cash/IntentMetricsGrid'
import { ChartCard } from '@/components/common/ChartCard'
import { EmptyState } from '@/components/common/EmptyState'
import { MetricCard } from '@/components/common/MetricCard'
import { CashBreakdownPieChart } from '@/charts/CashBreakdownPieChart'
import { CashCategoryChart } from '@/charts/CashCategoryChart'
import { CashIncomeExpenseChart } from '@/charts/CashIncomeExpenseChart'
import { CashIntentBreakdownChart } from '@/charts/CashIntentBreakdownChart'
import { ChartSkeleton, MetricCardSkeleton, PageHeaderSkeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/utils/format'
import { CASH_TRANSACTION_INTENTS } from '@/utils/cashIntent'
import { isUsdCurrency, toArs, useUsdExchangeRate } from '@/utils/exchangeRate'
import { ROUTES } from '@/constants'
import { cn } from '@/utils/cn'

const now = new Date()
const YEARS = Array.from({ length: 6 }, (_, i) => now.getFullYear() - i)
const MONTH_LABELS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export function CashReportsPage() {
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [cashAccountId, setCashAccountId] = useState('')

  const summaryFilters = useMemo(
    () => ({
      year,
      month,
      ...(cashAccountId ? { cashAccountId } : {}),
    }),
    [year, month, cashAccountId],
  )

  const [usdRate] = useUsdExchangeRate()
  const { data: accounts = [], isLoading: accountsLoading } = useCashAccounts()
  const accountIds = useMemo(() => accounts.map((a) => a.id), [accounts])
  const accountPeriodSummaryQueries = useAccountSummaries(accountIds, summaryFilters)

  const { data: summary, isLoading: summaryLoading, isFetching: summaryFetching } =
    useCashSummary(summaryFilters)
  const {
    data: intentSummary,
    isLoading: intentSummaryLoading,
    isFetching: intentSummaryFetching,
  } = useCashIntentSummary(summaryFilters)

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === cashAccountId),
    [accounts, cashAccountId],
  )

  const needsFxAggregation = !cashAccountId && accounts.some((a) => isUsdCurrency(a.currency))

  const displayTotals = useMemo(() => {
    if (!summary) return null
    if (!needsFxAggregation) {
      return {
        totalIncome: summary.totalIncome,
        totalExpenseNet: summary.totalExpenseNet,
        totalReimbursed: summary.totalReimbursed,
        balance: summary.balance,
      }
    }

    return accounts.reduce(
      (acc, account) => {
        const idx = accounts.findIndex((a) => a.id === account.id)
        const period = accountPeriodSummaryQueries[idx]?.data
        if (!period) return acc
        const currency = account.currency
        return {
          totalIncome: acc.totalIncome + toArs(period.totalIncome, currency, usdRate),
          totalExpenseNet:
            acc.totalExpenseNet + toArs(period.totalExpenseNet, currency, usdRate),
          totalReimbursed:
            acc.totalReimbursed + toArs(period.totalReimbursed, currency, usdRate),
          balance: acc.balance + toArs(period.balance, currency, usdRate),
        }
      },
      {
        totalIncome: 0,
        totalExpenseNet: 0,
        totalReimbursed: 0,
        balance: 0,
      },
    )
  }, [summary, needsFxAggregation, accounts, accountPeriodSummaryQueries, usdRate])

  const expenseParents = useMemo(
    () => (summary?.byParentCategory ?? []).filter((c) => c.type === 'EXPENSE'),
    [summary],
  )
  const incomeParents = useMemo(
    () => (summary?.byParentCategory ?? []).filter((c) => c.type === 'INCOME'),
    [summary],
  )

  const intentItems = useMemo(() => {
    const items = intentSummary?.byIntent ?? []
    const order = new Map(
      CASH_TRANSACTION_INTENTS.map((intent, index) => [intent, index]),
    )
    return [...items].sort((a, b) => {
      const aOrder = a.intent == null ? Number.MAX_SAFE_INTEGER : (order.get(a.intent) ?? 999)
      const bOrder = b.intent == null ? Number.MAX_SAFE_INTEGER : (order.get(b.intent) ?? 999)
      return aOrder - bOrder
    })
  }, [intentSummary])

  if (accountsLoading) {
    return (
      <div className="space-y-8">
        <PageHeaderSkeleton />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>
        <ChartSkeleton />
      </div>
    )
  }

  const periodLabel = `${MONTH_LABELS[month - 1]} ${year}${selectedAccount ? ` · ${selectedAccount.name}` : ''}`
  const chartsBusy = summaryFetching || intentSummaryFetching

  return (
    <div className="space-y-8 animate-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Reportes</h1>
          <p className="text-sm text-muted-foreground">
            Análisis de gastos, ingresos e intenciones
          </p>
        </div>
        <Link
          to={ROUTES.CASH}
          className="inline-flex h-10 w-full items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground sm:h-8 sm:w-auto sm:text-xs"
        >
          Volver al resumen
        </Link>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4">
        <div className="flex min-w-0 items-start gap-2.5 sm:items-center">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/10 sm:mt-0">
            <CalendarDays className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 space-y-1">
            <div>
              <p className="text-sm font-semibold tracking-tight">Período</p>
              <p className="truncate text-xs text-muted-foreground">
                {chartsBusy && !summaryLoading ? 'Actualizando… · ' : ''}
                {periodLabel}
              </p>
            </div>
            {needsFxAggregation && (
              <div
                className={cn(
                  'inline-flex max-w-full items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium',
                  usdRate == null
                    ? 'bg-amber-500/10 text-amber-800 ring-1 ring-amber-500/30 dark:text-amber-200'
                    : 'bg-muted text-muted-foreground ring-1 ring-border/70',
                )}
              >
                <DollarSign className="h-3 w-3 shrink-0" />
                {usdRate == null ? (
                  <span className="min-w-0">
                    Cotización USD pendiente ·{' '}
                    <Link
                      to={ROUTES.SETTINGS}
                      className="font-semibold underline underline-offset-2"
                    >
                      Configurar
                    </Link>
                  </span>
                ) : (
                  <span className="tabular-nums">
                    1 USD = {usdRate.toLocaleString('es-AR')} ARS
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <CashPeriodFilters
          year={year}
          month={month}
          cashAccountId={cashAccountId}
          accounts={accounts}
          years={YEARS}
          onYearChange={setYear}
          onMonthChange={setMonth}
          onAccountChange={setCashAccountId}
          className="border-0 bg-transparent p-0 shadow-none"
        />
      </div>

      {summaryLoading && !summary ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>
      ) : summary && displayTotals ? (
        <div
          className={cn(
            'grid gap-3 sm:grid-cols-2 lg:grid-cols-3 transition-opacity',
            chartsBusy && 'opacity-60',
          )}
        >
          <MetricCard
            title="Ingresos"
            value={formatCurrency(displayTotals.totalIncome)}
            icon={ArrowDownLeft}
            trend="up"
          />
          <MetricCard
            title="Gastos netos"
            value={formatCurrency(displayTotals.totalExpenseNet)}
            icon={ArrowUpRight}
            trend="down"
            subtitle={
              displayTotals.totalReimbursed > 0
                ? `Reintegros ${formatCurrency(displayTotals.totalReimbursed)}`
                : undefined
            }
          />
          <MetricCard
            title="Balance"
            value={formatCurrency(displayTotals.balance)}
            icon={Scale}
            trend={displayTotals.balance >= 0 ? 'up' : 'down'}
          />
        </div>
      ) : (
        <EmptyState message="No hay resumen para este período." />
      )}

      {summaryLoading && !summary ? (
        <ChartSkeleton />
      ) : summary && displayTotals ? (
        <div className={cn('space-y-6 transition-opacity', chartsBusy && 'opacity-60')}>
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Ingresos vs gastos">
              <CashIncomeExpenseChart
                totalIncome={displayTotals.totalIncome}
                totalExpense={displayTotals.totalExpenseNet}
              />
            </ChartCard>
            <ChartCard title="Detalle por categoría y subcategoría">
              <CashCategoryChart data={summary.byCategory} />
            </ChartCard>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Distribución de gastos">
              <CashBreakdownPieChart
                data={expenseParents}
                emptyMessage="Sin gastos en este período"
              />
            </ChartCard>
            <ChartCard title="Distribución de ingresos">
              <CashBreakdownPieChart
                data={incomeParents}
                emptyMessage="Sin ingresos en este período"
              />
            </ChartCard>
          </div>
        </div>
      ) : null}

      {intentSummaryLoading && !intentSummary ? (
        <ChartSkeleton />
      ) : intentSummary ? (
        <div
          className={cn(
            'space-y-4 transition-opacity',
            intentSummaryFetching && 'opacity-60',
          )}
        >
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight">Gastos por intención</h2>
              <p className="text-xs text-muted-foreground">
                Neto del período
                {intentSummary.totalReimbursed > 0
                  ? ` · reintegros ${formatCurrency(intentSummary.totalReimbursed)}`
                  : ''}
              </p>
            </div>
            <p className="text-sm font-semibold tabular-nums">
              {formatCurrency(intentSummary.totalExpenseNet)}
            </p>
          </div>
          <IntentMetricsGrid items={intentItems} />
          <ChartCard title="Distribución por intención">
            <CashIntentBreakdownChart data={intentItems} />
          </ChartCard>
        </div>
      ) : null}
    </div>
  )
}
