import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownLeft, ArrowUpRight, Wallet, Scale, Landmark, Plus, ArrowLeftRight, ChevronDown, LayoutDashboard, CalendarDays, DollarSign } from 'lucide-react'
import { useCashAccounts } from '@/hooks/useCashAccounts'
import { useCashSummary } from '@/hooks/useCashSummary'
import { useCashTransactions } from '@/hooks/useCashTransactions'
import { useCashCategories } from '@/hooks/useCashCategories'
import { useAccountSummaries } from '@/hooks/useAccountSummaries'
import { AccountsSummary } from '@/components/cash/AccountsSummary'
import { BudgetsOverview } from '@/components/cash/BudgetsOverview'
import { IntentBadge } from '@/components/cash/IntentBadge'
import { QuickTransactionModal } from '@/components/cash/QuickTransactionModal'
import { TransferModal } from '@/components/cash/TransferModal'
import { FundingModal } from '@/components/cash/FundingModal'
import { CashPeriodFilters } from '@/components/cash/CashPeriodFilters'
import { Button } from '@/components/ui/button'
import { MetricCard } from '@/components/common/MetricCard'
import { ChartCard } from '@/components/common/ChartCard'
import { EmptyState } from '@/components/common/EmptyState'
import { CashCategoryChart } from '@/charts/CashCategoryChart'
import { CashIncomeExpenseChart } from '@/charts/CashIncomeExpenseChart'
import { CashBreakdownPieChart } from '@/charts/CashBreakdownPieChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MetricCardSkeleton, ChartSkeleton, PageHeaderSkeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatCurrencyFor, formatDate } from '@/utils/format'
import { formatCategoryLabel } from '@/utils/cashCategories'
import { isUsdCurrency, toArs, useUsdExchangeRate } from '@/utils/exchangeRate'
import { ROUTES } from '@/constants'
import { cn } from '@/utils/cn'
import type { CashTransactionType } from '@/types/cash'

const now = new Date()
const YEARS = Array.from({ length: 6 }, (_, i) => now.getFullYear() - i)
const MONTH_LABELS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export function CashDashboardPage() {
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [cashAccountId, setCashAccountId] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState<CashTransactionType>('EXPENSE')
  const [transferOpen, setTransferOpen] = useState(false)
  const [fundingOpen, setFundingOpen] = useState(false)
  const [kpisOpen, setKpisOpen] = useState(true)

  const openQuickAdd = (type: CashTransactionType) => {
    setModalType(type)
    setModalOpen(true)
  }

  const summaryFilters = useMemo(
    () => ({
      year,
      month,
      ...(cashAccountId ? { cashAccountId } : {}),
    }),
    [year, month, cashAccountId],
  )

  const txFilters = useMemo(
    () => ({
      startDate: `${year}-${String(month).padStart(2, '0')}-01`,
      endDate: `${year}-${String(month).padStart(2, '0')}-31`,
      ...(cashAccountId ? { cashAccountId } : { excludeTransfers: true, excludeFundings: true }),
    }),
    [year, month, cashAccountId],
  )

  const [usdRate] = useUsdExchangeRate()
  const { data: accounts = [], isLoading: accountsLoading } = useCashAccounts()
  const accountIds = useMemo(() => accounts.map((a) => a.id), [accounts])
  const accountSummaryQueries = useAccountSummaries(accountIds)
  const accountPeriodSummaryQueries = useAccountSummaries(accountIds, summaryFilters)
  const accountBalances = useMemo(
    () =>
      accounts.map((account, i) => ({
        account,
        balance: accountSummaryQueries[i]?.data?.balance ?? 0,
        loading: accountSummaryQueries[i]?.isLoading ?? true,
      })),
    [accounts, accountSummaryQueries],
  )
  const accountOpeningBalances = useMemo(
    () =>
      accounts.map((account, i) => ({
        account,
        openingBalance: accountPeriodSummaryQueries[i]?.data?.openingBalance ?? 0,
        loading: accountPeriodSummaryQueries[i]?.isLoading ?? true,
      })),
    [accounts, accountPeriodSummaryQueries],
  )
  const accountPeriodBalances = useMemo(
    () =>
      accounts.map((account, i) => ({
        account,
        balance: accountPeriodSummaryQueries[i]?.data?.balance ?? 0,
        loading: accountPeriodSummaryQueries[i]?.isLoading ?? true,
      })),
    [accounts, accountPeriodSummaryQueries],
  )
  const { data: summary, isLoading: summaryLoading, isFetching: summaryFetching } =
    useCashSummary(summaryFilters)
  const { data: txData, isLoading: txLoading } = useCashTransactions(txFilters)
  const transactions = txData?.items ?? []
  const { data: categories = [] } = useCashCategories()

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === cashAccountId),
    [accounts, cashAccountId],
  )

  const needsFxAggregation = !cashAccountId && accounts.some((a) => isUsdCurrency(a.currency))

  /** KPIs en ARS: si hay cuentas USD y no hay filtro, sumamos por cuenta con cotización. */
  const displayTotals = useMemo(() => {
    if (!summary) return null
    if (!needsFxAggregation) {
      return {
        openingBalance: summary.openingBalance,
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
          openingBalance:
            acc.openingBalance + toArs(period.openingBalance, currency, usdRate),
          totalIncome: acc.totalIncome + toArs(period.totalIncome, currency, usdRate),
          totalExpenseNet:
            acc.totalExpenseNet + toArs(period.totalExpenseNet, currency, usdRate),
          totalReimbursed:
            acc.totalReimbursed + toArs(period.totalReimbursed, currency, usdRate),
          balance: acc.balance + toArs(period.balance, currency, usdRate),
        }
      },
      {
        openingBalance: 0,
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

  const recent = useMemo(
    () => [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8),
    [transactions],
  )

  const openingBalanceBreakdown = useMemo(() => {
    const items = cashAccountId
      ? accountOpeningBalances.filter((item) => item.account.id === cashAccountId)
      : accountOpeningBalances
    return items.length > 1 ? items : []
  }, [accountOpeningBalances, cashAccountId])

  const balanceBreakdown = useMemo(() => {
    const items = cashAccountId
      ? accountPeriodBalances.filter((item) => item.account.id === cashAccountId)
      : accountPeriodBalances
    return items.length > 1 ? items : []
  }, [accountPeriodBalances, cashAccountId])

  if (accountsLoading) {
    return (
      <div className="space-y-8">
        <PageHeaderSkeleton />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>
        <ChartSkeleton />
      </div>
    )
  }

  const periodLabel = `${MONTH_LABELS[month - 1]} ${year}${selectedAccount ? ` · ${selectedAccount.name}` : ''}`

  return (
    <div className="space-y-8 animate-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Gastos e ingresos</h1>
          <p className="text-sm text-muted-foreground">Resumen de tu flujo de efectivo</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive sm:flex-none"
            onClick={() => openQuickAdd('EXPENSE')}
          >
            <Plus className="mr-1 h-4 w-4" />
            Gasto
          </Button>
          <Button
            variant="outline"
            className="flex-1 text-success hover:bg-success/10 hover:text-success sm:flex-none"
            onClick={() => openQuickAdd('INCOME')}
          >
            <Plus className="mr-1 h-4 w-4" />
            Ingreso
          </Button>
          <Button
            variant="outline"
            className="flex-1 sm:flex-none"
            onClick={() => setTransferOpen(true)}
          >
            <ArrowLeftRight className="mr-1 h-4 w-4" />
            Transferir
          </Button>
          <Button
            variant="outline"
            className="flex-1 sm:flex-none"
            onClick={() => setFundingOpen(true)}
          >
            <ArrowUpRight className="mr-1 h-4 w-4" />
            A inversión
          </Button>
          <Link
            to={ROUTES.CASH_TRANSACTIONS}
            className="inline-flex h-10 w-full items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground sm:h-8 sm:w-auto sm:text-xs"
          >
            Ver transacciones
          </Link>
        </div>
      </div>

      <AccountsSummary items={accountBalances} />

      <BudgetsOverview />

      <QuickTransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultType={modalType}
        defaultAccountId={cashAccountId || undefined}
      />
      <TransferModal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        defaultFromAccountId={cashAccountId || undefined}
      />
      <FundingModal
        open={fundingOpen}
        onClose={() => setFundingOpen(false)}
      />

      <div className="space-y-6">
        <section className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-1 border-b border-border/60 bg-muted/20 px-2 py-1 sm:px-3">
            <button
              type="button"
              onClick={() => setKpisOpen((v) => !v)}
              aria-expanded={kpisOpen}
              className="flex min-h-10 flex-1 cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted/60"
            >
              <LayoutDashboard className="h-4 w-4 shrink-0 text-primary" />
              <span className="text-sm font-semibold tracking-tight">Resumen del período</span>
              <span className="hidden truncate text-xs font-normal text-muted-foreground sm:inline">
                · {periodLabel}
              </span>
              <ChevronDown
                className={cn(
                  'ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
                  kpisOpen ? 'rotate-0' : '-rotate-90',
                )}
              />
            </button>
          </div>

          <div
            className={cn(
              'grid transition-[grid-template-rows] duration-200 ease-out',
              kpisOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
            )}
          >
            <div className="overflow-hidden">
              <div className="space-y-3 p-2.5 sm:p-3">
                <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/20 p-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-3">
                  <div className="flex min-w-0 items-start gap-2.5 sm:items-center">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/10 sm:mt-0">
                      <CalendarDays className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div>
                        <p className="text-sm font-semibold tracking-tight">Período</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {summaryFetching && !summaryLoading ? 'Actualizando… · ' : ''}
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
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <MetricCardSkeleton key={i} />
                    ))}
                  </div>
                ) : summary && displayTotals ? (
                  <div
                    className={cn(
                      'grid gap-3 sm:grid-cols-2 lg:grid-cols-4 transition-opacity',
                      summaryFetching && 'opacity-60',
                    )}
                  >
                    <MetricCard
                      title="Saldo inicial"
                      value={formatCurrency(displayTotals.openingBalance)}
                      icon={Landmark}
                      className="shadow-none"
                      subtitle={
                        <KpiBreakdown
                          rows={openingBalanceBreakdown.map(({ account, openingBalance, loading }) => ({
                            key: account.id,
                            label: account.name,
                            value: formatCurrencyFor(openingBalance, account.currency),
                            loading,
                          }))}
                        />
                      }
                    />
                    <MetricCard
                      title="Ingresos"
                      value={formatCurrency(displayTotals.totalIncome)}
                      icon={ArrowDownLeft}
                      trend="up"
                      className="shadow-none"
                      subtitle={
                        <KpiBreakdown
                          rows={[...incomeParents]
                            .sort((a, b) => b.total - a.total)
                            .map((item) => ({
                              key: item.categoryId,
                              label: item.categoryName,
                              value: formatCurrency(item.total),
                              tone: 'success',
                            }))}
                        />
                      }
                    />
                    <MetricCard
                      title="Gastos netos"
                      value={formatCurrency(displayTotals.totalExpenseNet)}
                      icon={ArrowUpRight}
                      trend="down"
                      className="shadow-none"
                      subtitle={
                        <KpiBreakdown
                          rows={[
                            ...(displayTotals.totalReimbursed > 0
                              ? [
                                  {
                                    key: 'reimbursed',
                                    label: 'Reintegros vinculados',
                                    value: formatCurrency(displayTotals.totalReimbursed),
                                    tone: 'success' as const,
                                  },
                                ]
                              : []),
                            ...[...expenseParents]
                              .sort((a, b) => b.total - a.total)
                              .map((item) => ({
                                key: item.categoryId,
                                label: item.categoryName,
                                value: formatCurrency(item.total),
                                tone: 'destructive' as const,
                              })),
                          ]}
                        />
                      }
                    />
                    <MetricCard
                      title="Balance"
                      value={formatCurrency(displayTotals.balance)}
                      icon={Scale}
                      trend={displayTotals.balance >= 0 ? 'up' : 'down'}
                      className="shadow-none"
                      subtitle={
                        <KpiBreakdown
                          rows={balanceBreakdown.map(({ account, balance, loading }) => ({
                            key: account.id,
                            label: account.name,
                            value: formatCurrencyFor(balance, account.currency),
                            loading,
                            tone: balance >= 0 ? 'success' : 'destructive',
                          }))}
                        />
                      }
                    />
                  </div>
                ) : (
                  <EmptyState message="No hay resumen para este período." />
                )}
              </div>
            </div>
          </div>
        </section>

        {summaryLoading && !summary ? (
          <ChartSkeleton />
        ) : summary && displayTotals ? (
          <>
            <div
              className={cn(
                'grid gap-6 lg:grid-cols-2 transition-opacity',
                summaryFetching && 'opacity-60',
              )}
            >
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

            <div
              className={cn(
                'grid gap-6 lg:grid-cols-2 transition-opacity',
                summaryFetching && 'opacity-60',
              )}
            >
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
          </>
        ) : null}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Transacciones recientes</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {txLoading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : recent.length === 0 ? (
            <EmptyState message="No hay transacciones en este período." />
          ) : (
            <div className="space-y-3">
              {recent.map((tx) => {
                const category = categories.find((c) => c.id === tx.categoryId)
                const isTransfer = Boolean(tx.transferId)
                const isFunding = Boolean(tx.fundingId)
                const isCredit = Boolean(tx.creditInstallmentId)
                return (
                  <div
                    key={tx.id}
                    className="flex flex-col gap-2 border-b pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {category
                          ? formatCategoryLabel(category, categories)
                          : 'Sin categoría'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(tx.date)}
                        {tx.description ? ` · ${tx.description}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-2 sm:justify-end">
                      {isTransfer ? (
                        <Badge variant="slate">Transferencia</Badge>
                      ) : isFunding ? (
                        <Badge variant="secondary">Efectivo ↔ Inv.</Badge>
                      ) : isCredit ? (
                        <Badge variant="outline">Crédito</Badge>
                      ) : (
                        <div className="flex flex-wrap justify-end gap-1">
                          <Badge variant={tx.type === 'INCOME' ? 'success' : 'destructive'}>
                            {tx.type === 'INCOME' ? 'Ingreso' : 'Gasto'}
                          </Badge>
                          <IntentBadge transaction={tx} />
                        </div>
                      )}
                      <span
                        className={cn(
                          'text-sm font-semibold',
                          isTransfer || isCredit
                            ? 'text-slate-600'
                            : tx.type === 'INCOME'
                              ? 'text-success'
                              : 'text-destructive',
                        )}
                      >
                        {!isTransfer && !isCredit && (tx.type === 'INCOME' ? '+' : '-')}
                        {formatCurrencyFor(
                          tx.amount,
                          accounts.find((a) => a.id === tx.cashAccountId)?.currency,
                        )}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface KpiBreakdownRow {
  key: string
  label: string
  value: string
  loading?: boolean
  tone?: 'default' | 'success' | 'destructive'
}

function KpiBreakdown({ rows }: { rows: KpiBreakdownRow[] }) {
  const [open, setOpen] = useState(true)

  if (rows.length === 0) return null

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center gap-1 rounded-md py-1 text-left text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
      >
        <span>Detalle</span>
        <span className="tabular-nums text-muted-foreground/80">({rows.length})</span>
        <ChevronDown
          className={cn(
            'ml-auto h-3.5 w-3.5 transition-transform duration-200',
            open ? 'rotate-0' : '-rotate-90',
          )}
        />
      </button>
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-1.5 border-t border-border/60 pt-2">
            {rows.map((row) => (
              <div
                key={row.key}
                className="flex items-baseline justify-between gap-3 text-xs leading-tight"
              >
                <span className="min-w-0 truncate text-muted-foreground">{row.label}</span>
                <span
                  className={cn('shrink-0 font-medium tabular-nums', {
                    'text-success': row.tone === 'success',
                    'text-destructive': row.tone === 'destructive',
                    'text-foreground/80': !row.tone || row.tone === 'default',
                  })}
                >
                  {row.loading ? '…' : row.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
