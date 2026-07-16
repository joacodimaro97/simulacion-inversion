import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownLeft, ArrowUpRight, Wallet, Scale, Landmark, Plus, ArrowLeftRight } from 'lucide-react'
import { useCashAccounts } from '@/hooks/useCashAccounts'
import { useCashSummary } from '@/hooks/useCashSummary'
import { useCashTransactions } from '@/hooks/useCashTransactions'
import { useCashCategories } from '@/hooks/useCashCategories'
import { useAccountSummaries } from '@/hooks/useAccountSummaries'
import { AccountsSummary } from '@/components/cash/AccountsSummary'
import { BudgetsOverview } from '@/components/cash/BudgetsOverview'
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
import { formatCurrency, formatDate } from '@/utils/format'
import { formatCategoryLabel } from '@/utils/cashCategories'
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

  const { data: accounts = [], isLoading: accountsLoading } = useCashAccounts()
  const accountIds = useMemo(() => accounts.map((a) => a.id), [accounts])
  const accountSummaryQueries = useAccountSummaries(accountIds)
  const accountBalances = useMemo(
    () =>
      accounts.map((account, i) => ({
        account,
        balance: accountSummaryQueries[i]?.data?.balance ?? 0,
        loading: accountSummaryQueries[i]?.isLoading ?? true,
      })),
    [accounts, accountSummaryQueries],
  )
  const { data: summary, isLoading: summaryLoading, isFetching: summaryFetching } =
    useCashSummary(summaryFilters)
  const { data: transactions = [], isLoading: txLoading } = useCashTransactions(txFilters)
  const { data: categories = [] } = useCashCategories()

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === cashAccountId),
    [accounts, cashAccountId],
  )

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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium">Período</p>
            <p className="truncate text-xs text-muted-foreground">
              {summaryFetching && !summaryLoading ? 'Actualizando… · ' : ''}
              {periodLabel}
            </p>
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
          />
        </div>

        {summaryLoading && !summary ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <MetricCardSkeleton key={i} />
              ))}
            </div>
            <ChartSkeleton />
          </>
        ) : summary ? (
          <>
            <div
              className={cn(
                'grid gap-4 sm:grid-cols-2 lg:grid-cols-4 transition-opacity',
                summaryFetching && 'opacity-60',
              )}
            >
              <MetricCard
                title="Saldo inicial"
                value={formatCurrency(summary.openingBalance)}
                icon={Landmark}
              />
              <MetricCard
                title="Ingresos"
                value={formatCurrency(summary.totalIncome)}
                icon={ArrowDownLeft}
                trend="up"
              />
              <MetricCard
                title="Gastos"
                value={formatCurrency(summary.totalExpense)}
                icon={ArrowUpRight}
                trend="down"
              />
              <MetricCard
                title="Balance"
                value={formatCurrency(summary.balance)}
                icon={Scale}
                trend={summary.balance >= 0 ? 'up' : 'down'}
              />
            </div>

            <div
              className={cn(
                'grid gap-6 lg:grid-cols-2 transition-opacity',
                summaryFetching && 'opacity-60',
              )}
            >
              <ChartCard title="Ingresos vs gastos">
                <CashIncomeExpenseChart
                  totalIncome={summary.totalIncome}
                  totalExpense={summary.totalExpense}
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
        ) : (
          <EmptyState message="No hay resumen para este período." />
        )}
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
                      ) : (
                        <Badge variant={tx.type === 'INCOME' ? 'success' : 'destructive'}>
                          {tx.type === 'INCOME' ? 'Ingreso' : 'Gasto'}
                        </Badge>
                      )}
                      <span
                        className={cn(
                          'text-sm font-semibold',
                          isTransfer
                            ? 'text-slate-600'
                            : tx.type === 'INCOME'
                              ? 'text-success'
                              : 'text-destructive',
                        )}
                      >
                        {!isTransfer && (tx.type === 'INCOME' ? '+' : '-')}
                        {formatCurrency(tx.amount)}
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
