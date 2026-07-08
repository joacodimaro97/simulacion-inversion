import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Pencil, Trash2 } from 'lucide-react'
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
import { buildCategoryOptions, formatCategoryLabel } from '@/utils/cashCategories'
import { cn } from '@/utils/cn'
import type { CashTransaction, CashTransactionType } from '@/types/cash'

interface TransactionForm {
  cashAccountId: string
  type: CashTransactionType
  categoryId: string
  amount: string
  date: string
  description: string
}

interface Filters {
  cashAccountId: string
  categoryId: string
  type: '' | CashTransactionType
  startDate: string
  endDate: string
}

export function CashTransactionsPage() {
  const [filters, setFilters] = useState<Filters>({
    cashAccountId: '',
    categoryId: '',
    type: '',
    startDate: '',
    endDate: '',
  })
  const [editing, setEditing] = useState<CashTransaction | null>(null)

  const queryFilters = useMemo(
    () => ({
      ...(filters.cashAccountId ? { cashAccountId: filters.cashAccountId } : {}),
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.startDate ? { startDate: filters.startDate } : {}),
      ...(filters.endDate ? { endDate: filters.endDate } : {}),
    }),
    [filters],
  )

  const { data: accounts = [], isLoading: accountsLoading } = useCashAccounts()
  const { data: allCategories = [] } = useCashCategories()
  const { data: transactions = [], isLoading: txLoading } = useCashTransactions(queryFilters)
  const createTx = useCreateCashTransaction()
  const updateTx = useUpdateCashTransaction()
  const deleteTx = useDeleteCashTransaction()

  const { register, handleSubmit, reset, setValue, watch } = useForm<TransactionForm>({
    defaultValues: {
      cashAccountId: '',
      type: 'EXPENSE',
      categoryId: '',
      amount: '',
      date: todayISO(),
      description: '',
    },
  })

  const formType = watch('type')
  const categoryOptions = useMemo(
    () => buildCategoryOptions(allCategories, formType),
    [allCategories, formType],
  )
  const filterCategoryOptions = useMemo(() => {
    if (!filters.type) {
      return [
        ...buildCategoryOptions(allCategories, 'INCOME'),
        ...buildCategoryOptions(allCategories, 'EXPENSE'),
      ]
    }
    return buildCategoryOptions(allCategories, filters.type)
  }, [allCategories, filters.type])

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

  useEffect(() => {
    const current = watch('categoryId')
    const stillValid = categoryOptions.some((c) => c.id === current)
    if (!stillValid) {
      setValue('categoryId', categoryOptions[0]?.id ?? '')
    }
  }, [categoryOptions, setValue, watch])

  const startEdit = (tx: CashTransaction) => {
    setEditing(tx)
    reset({
      cashAccountId: tx.cashAccountId,
      type: tx.type,
      categoryId: tx.categoryId,
      amount: String(tx.amount),
      date: tx.date.split('T')[0] ?? tx.date,
      description: tx.description ?? '',
    })
  }

  const cancelEdit = () => {
    setEditing(null)
    reset({
      cashAccountId: accounts[0]?.id ?? '',
      type: 'EXPENSE',
      categoryId: '',
      amount: '',
      date: todayISO(),
      description: '',
    })
  }

  const onSubmit = async (data: TransactionForm) => {
    const payload = {
      cashAccountId: data.cashAccountId,
      categoryId: data.categoryId,
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
      categoryId: data.categoryId,
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
    <div className="space-y-8 animate-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Transacciones</h1>
        <p className="text-muted-foreground">Ingresos y gastos del día a día</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2">
            <Label>Cuenta</Label>
            <Select
              value={filters.cashAccountId}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, cashAccountId: e.target.value }))
              }
            >
              <option value="">Todas</option>
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
              value={filters.type}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  type: e.target.value as Filters['type'],
                  categoryId: '',
                }))
              }
            >
              <option value="">Todos</option>
              <option value="INCOME">Ingreso</option>
              <option value="EXPENSE">Gasto</option>
            </Select>
          </div>
              <div className="space-y-2">
                <Label>Categoría / Subcategoría</Label>
                <Select
                  value={filters.categoryId}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, categoryId: e.target.value }))
                  }
                >
                  <option value="">Todas</option>
                  <optgroup label="Categorías">
                    {filterCategoryOptions
                      .filter((c) => c.group === 'category')
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Subcategorías">
                    {filterCategoryOptions
                      .filter((c) => c.group === 'subcategory')
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                  </optgroup>
                </Select>
              </div>
          <div className="space-y-2">
            <Label>Desde</Label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, startDate: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Hasta</Label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, endDate: e.target.value }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
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
                    setValue('categoryId', '')
                  }}
                >
                  <option value="EXPENSE">Gasto</option>
                  <option value="INCOME">Ingreso</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoría / Subcategoría</Label>
                <Select {...register('categoryId', { required: true })}>
                  <optgroup label="Categorías">
                    {categoryOptions
                      .filter((c) => c.group === 'category')
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Subcategorías">
                    {categoryOptions
                      .filter((c) => c.group === 'subcategory')
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                  </optgroup>
                </Select>
              </div>
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
              <Button type="submit" disabled={createTx.isPending || updateTx.isPending}>
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
        <CardHeader>
          <CardTitle className="text-base">
            Historial ({transactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {txLoading ? (
            <TableSkeleton rows={4} />
          ) : transactions.length === 0 ? (
            <EmptyState message="No hay transacciones con estos filtros." />
          ) : (
            <Table>
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
                        <Badge variant={tx.type === 'INCOME' ? 'success' : 'destructive'}>
                          {tx.type === 'INCOME' ? 'Ingreso' : 'Gasto'}
                        </Badge>
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
                          tx.type === 'INCOME' ? 'text-success' : 'text-destructive',
                        )}
                      >
                        {tx.type === 'INCOME' ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </TableCell>
                      <TableCell className="max-w-40 truncate text-muted-foreground">
                        {tx.description || '-'}
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
