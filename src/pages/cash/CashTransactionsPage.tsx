import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Plus,
  Pencil,
  Trash2,
  ArrowLeftRight,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Scale,
  CalendarDays,
  CreditCard,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCashAccounts } from '@/hooks/useCashAccounts'
import { useCashCategories } from '@/hooks/useCashCategories'
import {
  useCashTransactions,
  useCreateCashTransaction,
  useUpdateCashTransaction,
  useDeleteCashTransaction,
} from '@/hooks/useCashTransactions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/common/EmptyState'
import { MetricCard } from '@/components/common/MetricCard'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MetricCardSkeleton, PageHeaderSkeleton, TableSkeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatCurrencyFor, formatDate, todayISO } from '@/utils/format'
import { formatCategoryLabel, isCategorySelectionValid, resolveTransactionCategoryId, splitCategorySelection } from '@/utils/cashCategories'
import { CashTransactionFilters, resolveFilterCategoryParams, type TransactionFilters } from '@/components/cash/CashTransactionFilters'
import { CategorySubcategoryFields } from '@/components/cash/CategorySubcategoryFields'
import { IntentBadge } from '@/components/cash/IntentBadge'
import { IntentSelector } from '@/components/cash/IntentSelector'
import { QuickTransactionModal } from '@/components/cash/QuickTransactionModal'
import { ReimbursementFields } from '@/components/cash/ReimbursementFields'
import { TransactionTypeToggle } from '@/components/cash/TransactionTypeToggle'
import { TransactionWeeklyBreakdown } from '@/components/cash/TransactionWeeklyBreakdown'
import { Pagination } from '@/components/ui/pagination'
import { cn } from '@/utils/cn'
import { DEFAULT_EXPENSE_INTENT } from '@/utils/cashIntent'
import { ROUTES } from '@/constants'
import type { CashTransaction, CashTransactionIntent, CashTransactionType } from '@/types/cash'

const PAGE_SIZE = 10

function isSystemTransaction(tx: CashTransaction) {
  return Boolean(tx.transferId || tx.fundingId || tx.creditInstallmentId)
}

function SystemBadge({ tx }: { tx: CashTransaction }) {
  if (tx.transferId) {
    return (
      <Link to={ROUTES.CASH_TRANSFERS}>
        <Badge variant="slate" className="hover:opacity-80">
          <ArrowLeftRight className="mr-1 h-3 w-3" />
          Transferencia
        </Badge>
      </Link>
    )
  }
  if (tx.fundingId) {
    return (
      <Link to={ROUTES.CASH_FUNDINGS}>
        <Badge variant="secondary" className="hover:opacity-80">
          <TrendingUp className="mr-1 h-3 w-3" />
          Efectivo ↔ Inv.
        </Badge>
      </Link>
    )
  }
  if (tx.creditInstallmentId) {
    return (
      <Link to={ROUTES.CREDITS}>
        <Badge variant="outline" className="hover:opacity-80">
          <CreditCard className="mr-1 h-3 w-3" />
          Crédito
        </Badge>
      </Link>
    )
  }
  return null
}

interface TransactionForm {
  cashAccountId: string
  type: CashTransactionType
  parentCategoryId: string
  subcategoryId: string
  isReimbursement: boolean
  relatedExpenseId: string
  intent: CashTransactionIntent
  amount: string
  date: string
  description: string
}

export function CashTransactionsPage() {
  const [filters, setFilters] = useState<TransactionFilters>({
    cashAccountId: '',
    parentCategoryId: '',
    subcategoryIds: [],
    type: '',
    intent: '',
    startDate: '',
    endDate: '',
    hideSystemMovements: true,
  })
  const [editing, setEditing] = useState<CashTransaction | null>(null)
  const [quickOpen, setQuickOpen] = useState(false)
  const [page, setPage] = useState(1)

  const queryFilters = useMemo(() => {
    const categoryParams = resolveFilterCategoryParams(filters)
    return {
      ...(filters.cashAccountId ? { cashAccountId: filters.cashAccountId } : {}),
      ...categoryParams,
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.intent && filters.type !== 'INCOME' ? { intent: filters.intent } : {}),
      ...(filters.startDate ? { startDate: filters.startDate } : {}),
      ...(filters.endDate ? { endDate: filters.endDate } : {}),
      ...(filters.hideSystemMovements
        ? { excludeTransfers: true, excludeFundings: true }
        : {}),
    }
  }, [filters])

  const { data: accounts = [], isLoading: accountsLoading } = useCashAccounts()
  const { data: allCategories = [] } = useCashCategories()
  const { data: txData, isLoading: txLoading, isFetching: txFetching } =
    useCashTransactions(queryFilters)
  const transactions = txData?.items ?? []
  const stats = txData?.stats
  const { data: expenseTxData } = useCashTransactions({
    type: 'EXPENSE',
    excludeTransfers: true,
    excludeFundings: true,
  })
  const expenseTransactions = expenseTxData?.items ?? []
  const createTx = useCreateCashTransaction()
  const updateTx = useUpdateCashTransaction()
  const deleteTx = useDeleteCashTransaction()

  const { register, handleSubmit, reset, setValue, watch } = useForm<TransactionForm>({
    defaultValues: {
      cashAccountId: '',
      type: 'EXPENSE',
      parentCategoryId: '',
      subcategoryId: '',
      isReimbursement: false,
      relatedExpenseId: '',
      intent: DEFAULT_EXPENSE_INTENT,
      amount: '',
      date: todayISO(),
      description: '',
    },
  })

  // Asegura que `type` esté registrado para que setValue + watch re-rendericen.
  register('type')
  register('isReimbursement')
  register('relatedExpenseId')
  register('parentCategoryId')
  register('subcategoryId')
  register('intent')

  const formType = watch('type')
  const parentCategoryId = watch('parentCategoryId')
  const subcategoryId = watch('subcategoryId')
  const isReimbursement = watch('isReimbursement')
  const intent = watch('intent')
  const isLinkedIncome = formType === 'INCOME' && isReimbursement
  const formCategories = useMemo(
    () => allCategories.filter((c) => c.type === formType),
    [allCategories, formType],
  )
  const selectionValid = isCategorySelectionValid(
    formCategories,
    parentCategoryId,
    subcategoryId,
  )
  const canSubmit =
    createTx.isPending ||
    updateTx.isPending ||
    (isLinkedIncome ? !watch('relatedExpenseId') : !selectionValid)

  const categoryMap = useMemo(
    () => new Map(allCategories.map((c) => [c.id, c])),
    [allCategories],
  )
  const accountMap = useMemo(
    () => new Map(accounts.map((a) => [a.id, a.name])),
    [accounts],
  )

  const sortedTransactions = useMemo(
    () => [...transactions].sort((a, b) => b.date.localeCompare(a.date)),
    [transactions],
  )

  const totalPages = Math.max(1, Math.ceil(sortedTransactions.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return sortedTransactions.slice(start, start + PAGE_SIZE)
  }, [sortedTransactions, currentPage])

  useEffect(() => {
    setPage(1)
  }, [queryFilters])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  useEffect(() => {
    if (accounts.length > 0 && !watch('cashAccountId')) {
      setValue('cashAccountId', accounts[0]!.id)
    }
  }, [accounts, setValue, watch])

  const startEdit = (tx: CashTransaction) => {
    if (isSystemTransaction(tx)) return
    const { parentCategoryId: parentId, subcategoryId: subId } = splitCategorySelection(
      tx.categoryId,
      allCategories,
    )
    setEditing(tx)
    reset({
      cashAccountId: tx.cashAccountId,
      type: tx.type,
      parentCategoryId: parentId,
      subcategoryId: subId,
      isReimbursement: Boolean(tx.relatedExpenseId),
      relatedExpenseId: tx.relatedExpenseId ?? '',
      intent: tx.intent ?? DEFAULT_EXPENSE_INTENT,
      amount: String(tx.amount),
      date: tx.date.split('T')[0] ?? tx.date,
      description: tx.description ?? '',
    })
    requestAnimationFrame(() => {
      document.getElementById('transaction-form')?.scrollIntoView({ behavior: 'smooth' })
    })
  }

  const cancelEdit = () => {
    setEditing(null)
    reset({
      cashAccountId: accounts[0]?.id ?? '',
      type: 'EXPENSE',
      parentCategoryId: '',
      subcategoryId: '',
      isReimbursement: false,
      relatedExpenseId: '',
      intent: DEFAULT_EXPENSE_INTENT,
      amount: '',
      date: todayISO(),
      description: '',
    })
  }

  const onSubmit = async (data: TransactionForm) => {
    const relatedExpenseId =
      data.type === 'INCOME' && data.isReimbursement && data.relatedExpenseId
        ? data.relatedExpenseId
        : null

    const basePayload = {
      cashAccountId: data.cashAccountId,
      categoryId:
        relatedExpenseId === null
          ? resolveTransactionCategoryId(data.parentCategoryId, data.subcategoryId)
          : undefined,
      type: data.type,
      amount: Number(data.amount),
      date: data.date,
      description: data.description || undefined,
    }

    if (editing) {
      await updateTx.mutateAsync({
        id: editing.id,
        input: {
          ...basePayload,
          relatedExpenseId,
          intent: data.type === 'EXPENSE' ? data.intent : null,
        },
      })
      cancelEdit()
      return
    }

    await createTx.mutateAsync({
      ...basePayload,
      relatedExpenseId: relatedExpenseId ?? undefined,
      ...(data.type === 'EXPENSE' ? { intent: data.intent } : {}),
    })
    reset({
      cashAccountId: data.cashAccountId,
      type: data.type,
      parentCategoryId: data.parentCategoryId,
      subcategoryId: data.subcategoryId,
      isReimbursement: false,
      relatedExpenseId: '',
      intent: data.type === 'EXPENSE' ? data.intent : DEFAULT_EXPENSE_INTENT,
      amount: '',
      date: todayISO(),
      description: '',
    })
  }

  if (accountsLoading) {
    return (
      <div className="space-y-8">
        <PageHeaderSkeleton />
        <TableSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in md:space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Transacciones</h1>
          <p className="text-sm text-muted-foreground">Ingresos y gastos del día a día</p>
        </div>
        <Button className="md:hidden" onClick={() => setQuickOpen(true)}>
          <Plus className="h-4 w-4" />
          Nueva transacción
        </Button>
      </div>

      <QuickTransactionModal open={quickOpen} onClose={() => setQuickOpen(false)} />

      <Card id="transaction-form" className={cn(!editing && 'hidden md:block')}>
        <CardHeader>
          <CardTitle className="text-base">
            {editing ? 'Editar transacción' : 'Nueva transacción'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <TransactionTypeToggle
              value={formType}
              onChange={(type) => {
                setValue('type', type, { shouldDirty: true, shouldTouch: true })
                setValue('parentCategoryId', '', { shouldDirty: true })
                setValue('subcategoryId', '', { shouldDirty: true })
                if (type !== 'INCOME') {
                  setValue('isReimbursement', false, { shouldDirty: true })
                  setValue('relatedExpenseId', '', { shouldDirty: true })
                }
                if (type === 'EXPENSE') {
                  setValue('intent', DEFAULT_EXPENSE_INTENT, { shouldDirty: true })
                }
              }}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Monto</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0,00"
                  className="h-12 text-lg font-semibold tabular-nums"
                  {...register('amount', { required: true })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Cuenta</Label>
                <Select {...register('cashAccountId', { required: true })}>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input type="date" {...register('date', { required: true })} />
              </div>

              {!isLinkedIncome && (
                <CategorySubcategoryFields
                  key={formType}
                  categories={formCategories}
                  type={formType}
                  parentCategoryId={parentCategoryId}
                  subcategoryId={subcategoryId}
                  onParentChange={(id) =>
                    setValue('parentCategoryId', id, { shouldDirty: true })
                  }
                  onSubcategoryChange={(id) =>
                    setValue('subcategoryId', id, { shouldDirty: true })
                  }
                />
              )}

              <div className="space-y-2 sm:col-span-2">
                <Label>Descripción</Label>
                <Input
                  {...register('description')}
                  placeholder={
                    formType === 'EXPENSE'
                      ? 'Ej: Supermercado, nafta…'
                      : 'Ej: Sueldo, reintegro…'
                  }
                />
              </div>
            </div>

            {formType === 'EXPENSE' && (
              <IntentSelector
                value={intent}
                onChange={(next) => setValue('intent', next, { shouldDirty: true })}
              />
            )}

            {formType === 'INCOME' && (
              <ReimbursementFields
                checked={watch('isReimbursement')}
                relatedExpenseId={watch('relatedExpenseId')}
                expenseTransactions={expenseTransactions}
                categories={allCategories}
                excludeTransactionId={editing?.id}
                onCheckedChange={(checked) => {
                  setValue('isReimbursement', checked, { shouldDirty: true })
                  if (!checked) setValue('relatedExpenseId', '', { shouldDirty: true })
                }}
                onRelatedExpenseChange={(id) =>
                  setValue('relatedExpenseId', id, { shouldDirty: true })
                }
              />
            )}

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={canSubmit}>
                <Plus className="h-4 w-4" />
                {editing ? 'Guardar cambios' : 'Registrar'}
              </Button>
              {editing && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">
              Historial ({transactions.length})
              {txFetching && !txLoading ? (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  Actualizando…
                </span>
              ) : null}
            </CardTitle>
          </div>
          <CashTransactionFilters
            filters={filters}
            accounts={accounts}
            categories={allCategories}
            onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          {txLoading && !stats ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <MetricCardSkeleton key={i} />
              ))}
            </div>
          ) : stats ? (
            <div
              className={cn(
                'grid gap-3 sm:grid-cols-2 lg:grid-cols-4 transition-opacity',
                txFetching && 'opacity-60',
              )}
            >
              <MetricCard
                title="Ingresos"
                value={formatCurrency(stats.totalIncome)}
                icon={ArrowDownLeft}
                trend="up"
                subtitle={`${stats.incomeCount} movimiento${stats.incomeCount === 1 ? '' : 's'}`}
              />
              <MetricCard
                title="Gastos"
                value={formatCurrency(stats.totalExpense)}
                icon={ArrowUpRight}
                trend="down"
                subtitle={`${stats.expenseCount} movimiento${stats.expenseCount === 1 ? '' : 's'}`}
              />
              <MetricCard
                title="Neto"
                value={formatCurrency(stats.net)}
                icon={Scale}
                trend={stats.net >= 0 ? 'up' : 'down'}
                subtitle={`${stats.transactionCount} en total`}
              />
              <MetricCard
                title="Promedio gasto/día"
                value={formatCurrency(stats.averageDailyExpense)}
                icon={CalendarDays}
                subtitle={
                  stats.totalDays > 0
                    ? `${stats.totalDays} día${stats.totalDays === 1 ? '' : 's'} del período`
                    : 'Sin rango de fechas'
                }
              />
            </div>
          ) : null}

          {stats && (stats.byWeek?.length ?? 0) > 0 ? (
            <div
              className={cn(
                'rounded-lg border bg-muted/30 p-3 sm:p-4 transition-opacity',
                txFetching && 'opacity-60',
              )}
            >
              <TransactionWeeklyBreakdown stats={stats} />
            </div>
          ) : stats && (!filters.startDate || !filters.endDate) ? (
            <p className="text-xs text-muted-foreground">
              Elegí fecha desde y hasta para ver el gasto por semana (lunes a domingo).
            </p>
          ) : null}

          {txLoading && transactions.length === 0 ? (
            <TableSkeleton rows={4} />
          ) : transactions.length === 0 ? (
            <EmptyState message="No hay transacciones con estos filtros." />
          ) : (
            <div className={cn('transition-opacity', txFetching && 'opacity-60')}>
              <div className="space-y-3 md:hidden">
                {paginatedTransactions.map((tx) => {
                    const category = categoryMap.get(tx.categoryId)
                    return (
                      <div
                        key={tx.id}
                        className="rounded-lg border bg-card p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {category
                                ? formatCategoryLabel(category, allCategories)
                                : 'Sin categoría'}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {formatDate(tx.date)}
                              {accountMap.get(tx.cashAccountId)
                                ? ` · ${accountMap.get(tx.cashAccountId)}`
                                : ''}
                            </p>
                            {tx.description && (
                              <p className="mt-1 truncate text-xs text-muted-foreground">
                                {tx.description}
                              </p>
                            )}
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            {isSystemTransaction(tx) ? (
                              <SystemBadge tx={tx} />
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
                                isSystemTransaction(tx)
                                  ? 'text-slate-600'
                                  : tx.type === 'INCOME'
                                    ? 'text-success'
                                    : 'text-destructive',
                              )}
                            >
                              {!isSystemTransaction(tx) && (tx.type === 'INCOME' ? '+' : '-')}
                              {formatCurrencyFor(
                                tx.amount,
                                accounts.find((a) => a.id === tx.cashAccountId)?.currency,
                              )}
                            </span>
                          </div>
                        </div>
                        {!isSystemTransaction(tx) && (
                        <div className="mt-3 flex gap-2 border-t pt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            className="flex-1"
                            onClick={() => startEdit(tx)}
                          >
                            <Pencil className="h-4 w-4" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            className="flex-1 text-destructive hover:text-destructive"
                            onClick={() => deleteTx.mutate(tx.id)}
                            disabled={deleteTx.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </Button>
                        </div>
                        )}
                      </div>
                    )
                  })}
              </div>
            <Table className="hidden md:table">
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Intención (opcional)</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Cuenta</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{formatDate(tx.date)}</TableCell>
                      <TableCell>
                        {isSystemTransaction(tx) ? (
                          <SystemBadge tx={tx} />
                        ) : (
                          <Badge variant={tx.type === 'INCOME' ? 'success' : 'destructive'}>
                            {tx.type === 'INCOME' ? 'Ingreso' : 'Gasto'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <IntentBadge transaction={tx} />
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const category = categoryMap.get(tx.categoryId)
                          return category
                            ? formatCategoryLabel(category, allCategories)
                            : '-'
                        })()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {accountMap.get(tx.cashAccountId) ?? '-'}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'font-semibold',
                          isSystemTransaction(tx)
                            ? 'text-slate-600'
                            : tx.type === 'INCOME'
                              ? 'text-success'
                              : 'text-destructive',
                        )}
                      >
                        {!isSystemTransaction(tx) && (tx.type === 'INCOME' ? '+' : '-')}
                        {formatCurrencyFor(
                          tx.amount,
                          accounts.find((a) => a.id === tx.cashAccountId)?.currency,
                        )}
                      </TableCell>
                      <TableCell className="max-w-40 truncate text-muted-foreground">
                        {tx.description || '-'}
                      </TableCell>
                      <TableCell>
                        {!isSystemTransaction(tx) && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={() => startEdit(tx)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={() => deleteTx.mutate(tx.id)}
                            disabled={deleteTx.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            <Pagination
              page={currentPage}
              pageSize={PAGE_SIZE}
              totalItems={sortedTransactions.length}
              onPageChange={setPage}
            />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
