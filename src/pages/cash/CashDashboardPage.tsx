import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownLeft, ArrowUpRight, Wallet, Scale, Landmark } from 'lucide-react'
import { useCashAccounts } from '@/hooks/useCashAccounts'
import { useCashSummary } from '@/hooks/useCashSummary'
import { useCashTransactions } from '@/hooks/useCashTransactions'
import { useCashCategories } from '@/hooks/useCashCategories'
import { MetricCard } from '@/components/common/MetricCard'
import { ChartCard } from '@/components/common/ChartCard'
import { EmptyState } from '@/components/common/EmptyState'
import { CashCategoryChart } from '@/charts/CashCategoryChart'
import { CashIncomeExpenseChart } from '@/charts/CashIncomeExpenseChart'
import { CashBreakdownPieChart } from '@/charts/CashBreakdownPieChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { MetricCardSkeleton, ChartSkeleton, PageHeaderSkeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate } from '@/utils/format'
import { formatCategoryLabel } from '@/utils/cashCategories'
import { ROUTES } from '@/constants'
import { cn } from '@/utils/cn'

const now = new Date()
const YEARS = Array.from({ length: 6 }, (_, i) => now.getFullYear() - i)
const MONTHS = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
]

export function CashDashboardPage() {
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

  const txFilters = useMemo(
    () => ({
      startDate: `${year}-${String(month).padStart(2, '0')}-01`,
      endDate: `${year}-${String(month).padStart(2, '0')}-31`,
      ...(cashAccountId ? { cashAccountId } : {}),
    }),
    [year, month, cashAccountId],
  )

  const { data: accounts = [], isLoading: accountsLoading } = useCashAccounts()
  const { data: summary, isLoading: summaryLoading } = useCashSummary(summaryFilters)
  const { data: transactions = [], isLoading: txLoading } = useCashTransactions(txFilters)
  const { data: categories = [] } = useCashCategories()

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

  if (accountsLoading || summaryLoading) {
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

  return (
    <div className="space-y-8 animate-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gastos e ingresos</h1>
          <p className="text-muted-foreground">Resumen de tu flujo de efectivo</p>
        </div>
        <Link
          to={ROUTES.CASH_TRANSACTIONS}
          className="inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-accent hover:text-accent-foreground"
        >
          Ver transacciones
        </Link>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-5 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Año</Label>
            <Select value={String(year)} onChange={(e) => setYear(Number(e.target.value))}>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Mes</Label>
            <Select value={String(month)} onChange={(e) => setMonth(Number(e.target.value))}>
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Cuenta</Label>
            <Select
              value={cashAccountId}
              onChange={(e) => setCashAccountId(e.target.value)}
            >
              <option value="">Todas</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

          <div className="grid gap-6 lg:grid-cols-2">
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
        </>
      ) : (
        <EmptyState message="No hay resumen para este período." />
      )}

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
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div>
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
                    <div className="flex items-center gap-2">
                      <Badge variant={tx.type === 'INCOME' ? 'success' : 'destructive'}>
                        {tx.type === 'INCOME' ? 'Ingreso' : 'Gasto'}
                      </Badge>
                      <span
                        className={cn(
                          'text-sm font-semibold',
                          tx.type === 'INCOME' ? 'text-success' : 'text-destructive',
                        )}
                      >
                        {tx.type === 'INCOME' ? '+' : '-'}
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
