import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Pencil, Trash2, ArrowLeftRight, TrendingUp } from 'lucide-react'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageHeaderSkeleton, TableSkeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate, todayISO } from '@/utils/format'
import { formatCategoryLabel, isCategorySelectionValid, resolveTransactionCategoryId, splitCategorySelection } from '@/utils/cashCategories'
import { CashTransactionFilters, resolveFilterCategoryId, type TransactionFilters } from '@/components/cash/CashTransactionFilters'
import { CategorySubcategoryFields } from '@/components/cash/CategorySubcategoryFields'
import { QuickTransactionModal } from '@/components/cash/QuickTransactionModal'
import { cn } from '@/utils/cn'
import { ROUTES } from '@/constants'
import type { CashTransaction, CashTransactionType } from '@/types/cash'

function isSystemTransaction(tx: CashTransaction) {
  return Boolean(tx.transferId || tx.fundingId)
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
  return null
}

interface TransactionForm {
  cashAccountId: string
  type: CashTransactionType
  parentCategoryId: string
  subcategoryId: string
  amount: string
  date: string
  description: string
}

export function CashTransactionsPage() {
  const [filters, setFilters] = useState<TransactionFilters>({
    cashAccountId: '',
    parentCategoryId: '',
    subcategoryId: '',
    type: '',
    startDate: '',
    endDate: '',
    hideSystemMovements: true,
  })
  const [editing, setEditing] = useState<CashTransaction | null>(null)
  const [quickOpen, setQuickOpen] = useState(false)

  const queryFilters = useMemo(() => {
    const categoryId = resolveFilterCategoryId(filters)
    return {
      ...(filters.cashAccountId ? { cashAccountId: filters.cashAccountId } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.startDate ? { startDate: filters.startDate } : {}),
      ...(filters.endDate ? { endDate: filters.endDate } : {}),
      ...(filters.hideSystemMovements
        ? { excludeTransfers: true, excludeFundings: true }
        : {}),
    }
  }, [filters])

  const { data: accounts = [], isLoading: accountsLoading } = useCashAccounts()
  const { data: allCategories = [] } = useCashCategories()
  const { data: transactions = [], isLoading: txLoading, isFetching: txFetching } =
    useCashTransactions(queryFilters)
  const createTx = useCreateCashTransaction()
  const updateTx = useUpdateCashTransaction()
  const deleteTx = useDeleteCashTransaction()

  const { register, handleSubmit, reset, setValue, watch } = useForm<TransactionForm>({
    defaultValues: {
      cashAccountId: '',
      type: 'EXPENSE',
      parentCategoryId: '',
      subcategoryId: '',
      amount: '',
      date: todayISO(),
      description: '',
    },
  })

  const formType = watch('type')
  const parentCategoryId = watch('parentCategoryId')
  const subcategoryId = watch('subcategoryId')
  const formCategories = useMemo(
    () => allCategories.filter((c) => c.type === formType),
    [allCategories, formType],
  )
  const selectionValid = isCategorySelectionValid(
    formCategories,
    parentCategoryId,
    subcategoryId,
  )

  const categoryMap = useMemo(
    () => new Map(allCategories.map((c) => [c.id, c])),
    [allCategories],
  )
  const accountMap = useMemo(
    () => new Map(accounts.map((a) => [a.id, a.name])),
    [accounts],
  )

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
      amount: '',
      date: todayISO(),
      description: '',
    })
  }

  const onSubmit = async (data: TransactionForm) => {
    const payload = {
      cashAccountId: data.cashAccountId,
      categoryId: resolveTransactionCategoryId(data.parentCategoryId, data.subcategoryId),
      type: data.type,
      amount: Number(data.amount),
      date: data.date,
      description: data.description || undefined,
    }

    if (editing) {
      await updateTx.mutateAsync({ id: editing.id, input: payload })
      cancelEdit()
      return
    }

    await createTx.mutateAsync(payload)
    reset({
      cashAccountId: data.cashAccountId,
      type: data.type,
      parentCategoryId: data.parentCategoryId,
      subcategoryId: data.subcategoryId,
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                <Label>Tipo</Label>
                <Select
                  value={formType}
                  onChange={(e) => {
                    setValue('type', e.target.value as CashTransactionType)
                    setValue('parentCategoryId', '')
                    setValue('subcategoryId', '')
                  }}
                >
                  <option value="EXPENSE">Gasto</option>
                  <option value="INCOME">Ingreso</option>
                </Select>
              </div>
              <CategorySubcategoryFields
                categories={formCategories}
                type={formType}
                parentCategoryId={parentCategoryId}
                subcategoryId={subcategoryId}
                onParentChange={(id) => setValue('parentCategoryId', id)}
                onSubcategoryChange={(id) => setValue('subcategoryId', id)}
              />
              <div className="space-y-2">
                <Label>Monto</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  {...register('amount', { required: true })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input type="date" {...register('date', { required: true })} />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input {...register('description')} placeholder="Opcional" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={createTx.isPending || updateTx.isPending || !selectionValid}
              >
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
        <CardContent>
          {txLoading && transactions.length === 0 ? (
            <TableSkeleton rows={4} />
          ) : transactions.length === 0 ? (
            <EmptyState message="No hay transacciones con estos filtros." />
          ) : (
            <div className={cn('transition-opacity', txFetching && 'opacity-60')}>
              <div className="space-y-3 md:hidden">
                {[...transactions]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((tx) => {
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
                              <Badge variant={tx.type === 'INCOME' ? 'success' : 'destructive'}>
                                {tx.type === 'INCOME' ? 'Ingreso' : 'Gasto'}
                              </Badge>
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
                              {formatCurrency(tx.amount)}
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
                  <TableHead>Categoría</TableHead>
                  <TableHead>Cuenta</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...transactions]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((tx) => (
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
                        {formatCurrency(tx.amount)}
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
