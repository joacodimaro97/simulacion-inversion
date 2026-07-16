import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { Info } from 'lucide-react'
import { useCashAccounts } from '@/hooks/useCashAccounts'
import { useCashCategories } from '@/hooks/useCashCategories'
import { useCreateCashBudget, useUpdateCashBudget } from '@/hooks/useCashBudgets'
import { CashSummaryService } from '@/services/CashSummaryService'
import { queryKeys } from '@/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Dialog } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrencyFor, todayISO } from '@/utils/format'
import { computeDailyAllowancePreview, getBudgetKind, type BudgetKind } from '@/utils/budgets'
import { getCategories, getSubcategories } from '@/utils/cashCategories'
import { cn } from '@/utils/cn'
import type { Budget } from '@/types/cash'

interface BudgetModalProps {
  open: boolean
  onClose: () => void
  budget?: Budget | null
}

interface BudgetForm {
  cashAccountId: string
  name: string
  amount: string
  startDate: string
  endDate: string
}

export function BudgetModal({ open, onClose, budget }: BudgetModalProps) {
  const { data: accounts = [] } = useCashAccounts()
  const { data: categories = [] } = useCashCategories({ type: 'EXPENSE' })
  const createBudget = useCreateCashBudget()
  const updateBudget = useUpdateCashBudget()
  const isEditing = Boolean(budget)

  const [mode, setMode] = useState<BudgetKind>('account')
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])

  const { register, handleSubmit, reset, watch, setValue } = useForm<BudgetForm>({
    defaultValues: {
      cashAccountId: '',
      name: '',
      amount: '',
      startDate: todayISO(),
      endDate: '',
    },
  })

  const cashAccountId = watch('cashAccountId')
  const name = watch('name')
  const amount = watch('amount')
  const startDate = watch('startDate')
  const endDate = watch('endDate')

  useEffect(() => {
    if (!open) return
    if (budget) {
      const kind = getBudgetKind(budget)
      setMode(kind)
      setSelectedCategoryIds(budget.categoryIds?.length ? [...budget.categoryIds] : [])
      reset({
        cashAccountId: budget.cashAccountId ?? '',
        name: budget.name,
        amount: String(budget.amount),
        startDate: budget.startDate.slice(0, 10),
        endDate: budget.endDate.slice(0, 10),
      })
      return
    }

    setMode('account')
    setSelectedCategoryIds([])
    reset({
      cashAccountId: '',
      name: '',
      amount: '',
      startDate: todayISO(),
      endDate: '',
    })
  }, [open, budget, reset])

  useEffect(() => {
    if (!open || budget || mode !== 'account' || accounts.length === 0) return
    if (!cashAccountId) {
      setValue('cashAccountId', accounts[0]!.id)
    }
  }, [open, budget, mode, accounts, cashAccountId, setValue])

  const handleModeChange = (nextMode: BudgetKind) => {
    setMode(nextMode)
    if (nextMode === 'category') {
      setValue('cashAccountId', '')
      return
    }
    if (!cashAccountId && accounts[0]) {
      setValue('cashAccountId', accounts[0].id)
    }
  }

  const accountIdForBalance =
    mode === 'account' ? cashAccountId : cashAccountId || ''

  const { data: accountSummary, isFetching: balanceLoading } = useQuery({
    queryKey: queryKeys.cash.summary({ cashAccountId: accountIdForBalance }),
    queryFn: () => CashSummaryService.getSummary({ cashAccountId: accountIdForBalance }),
    enabled: open && mode === 'account' && Boolean(accountIdForBalance),
  })

  const selectedAccount = accounts.find((a) => a.id === cashAccountId)
  const currency = selectedAccount?.currency ?? 'ARS'
  const balance = accountSummary?.balance ?? null

  const amountNum = amount.trim() ? Number(amount) : null
  const usingBalance = mode === 'account' && amountNum === null
  const effectiveAmount =
    mode === 'category' ? (amountNum ?? 0) : (amountNum ?? balance ?? 0)
  const effectiveStart = startDate || todayISO()

  const datesValid = Boolean(endDate) && endDate >= effectiveStart
  const preview = datesValid
    ? computeDailyAllowancePreview(effectiveAmount, effectiveStart, endDate)
    : null

  const noBalanceForAuto =
    mode === 'account' && usingBalance && balance !== null && balance <= 0

  const expenseRoots = useMemo(() => getCategories(categories, 'EXPENSE'), [categories])

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const canSubmitAccount =
    Boolean(cashAccountId) &&
    Boolean(name.trim()) &&
    datesValid &&
    (amountNum === null || amountNum > 0) &&
    !noBalanceForAuto

  const canSubmitCategory =
    selectedCategoryIds.length > 0 &&
    Boolean(name.trim()) &&
    datesValid &&
    amountNum !== null &&
    amountNum > 0

  const canSubmit = mode === 'account' ? canSubmitAccount : canSubmitCategory

  const onSubmit = async (data: BudgetForm) => {
    const parsedAmount = data.amount.trim() ? Number(data.amount) : undefined
    if (data.endDate < (data.startDate || todayISO())) return

    if (mode === 'category') {
      if (!parsedAmount || selectedCategoryIds.length === 0) return
      const payload = {
        name: data.name.trim(),
        endDate: data.endDate,
        startDate: data.startDate || undefined,
        amount: parsedAmount,
        categoryIds: selectedCategoryIds,
        cashAccountId: data.cashAccountId || null,
      }
      if (budget) {
        await updateBudget.mutateAsync({ id: budget.id, input: payload })
      } else {
        await createBudget.mutateAsync(payload)
      }
    } else {
      const payload = {
        name: data.name.trim(),
        endDate: data.endDate,
        startDate: data.startDate || undefined,
        amount: parsedAmount,
        cashAccountId: data.cashAccountId,
      }
      if (budget) {
        await updateBudget.mutateAsync({
          id: budget.id,
          input: { ...payload, categoryIds: [] },
        })
      } else {
        await createBudget.mutateAsync(payload)
      }
    }
    onClose()
  }

  if (!isEditing && mode === 'account' && accounts.length === 0) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        title="Nuevo presupuesto"
        description="Necesitás una cuenta de efectivo"
      >
        <p className="text-sm text-muted-foreground">
          Creá una cuenta de efectivo para poder planificar un presupuesto sobre ella, o
          cambiá a modo por categoría.
        </p>
        <div className="mt-4 flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cerrar
          </Button>
          <Button type="button" className="flex-1" onClick={() => handleModeChange('category')}>
            Por categoría
          </Button>
        </div>
      </Dialog>
    )
  }

  const isPending = createBudget.isPending || updateBudget.isPending

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEditing ? 'Editar presupuesto' : 'Nuevo presupuesto'}
      description="Planificá cuánto podés gastar por día. Solo visual: no bloquea saldo."
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {!isEditing && (
          <Tabs
            value={mode}
            onValueChange={(v) => handleModeChange(v as BudgetKind)}
          >
            <TabsList className="w-full">
              <TabsTrigger value="account" className="flex-1">
                Por cuenta
              </TabsTrigger>
              <TabsTrigger value="category" className="flex-1">
                Por categoría
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {isEditing && (
          <p className="text-xs text-muted-foreground">
            Tipo: {mode === 'category' ? 'Por categoría' : 'Por cuenta'}
          </p>
        )}

        <div className="space-y-2">
          <Label>Nombre</Label>
          <Input
            placeholder={
              mode === 'category' ? 'Ej: Alimentación del mes' : 'Ej: Gastos del mes'
            }
            {...register('name', { required: true })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Fecha inicio</Label>
            <Input type="date" {...register('startDate')} />
          </div>
          <div className="space-y-2">
            <Label>Fecha objetivo</Label>
            <Input type="date" {...register('endDate', { required: true })} />
          </div>
        </div>
        {endDate && !datesValid && (
          <p className="text-xs text-destructive">
            La fecha objetivo debe ser posterior o igual a la de inicio.
          </p>
        )}

        {mode === 'account' ? (
          <>
            <div className="space-y-2">
              <Label>Cuenta de efectivo</Label>
              <Select {...register('cashAccountId', { required: true })}>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency})
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Monto (opcional)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0"
                {...register('amount', { min: 0 })}
              />
              <p className="text-xs text-muted-foreground">
                Dejar vacío para usar el saldo actual de la cuenta
                {usingBalance && balance !== null
                  ? ` (${formatCurrencyFor(balance, currency)})`
                  : ''}
                {usingBalance && balanceLoading ? ' · calculando saldo…' : ''}
              </p>
              {noBalanceForAuto && (
                <p className="text-xs text-destructive">
                  La cuenta no tiene saldo positivo. Ingresá un monto manualmente.
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Categorías de gasto</Label>
              {expenseRoots.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay categorías de gasto. Creá alguna en Categorías.
                </p>
              ) : (
                <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border p-2">
                  {expenseRoots.map((root) => {
                    const children = getSubcategories(categories, root.id)
                    return (
                      <div key={root.id} className="space-y-0.5">
                        <CategoryCheckRow
                          id={root.id}
                          name={root.name}
                          color={root.color}
                          checked={selectedCategoryIds.includes(root.id)}
                          onToggle={toggleCategory}
                          indent={false}
                        />
                        {children.map((child) => (
                          <CategoryCheckRow
                            key={child.id}
                            id={child.id}
                            name={child.name}
                            color={child.color ?? root.color}
                            checked={selectedCategoryIds.includes(child.id)}
                            onToggle={toggleCategory}
                            indent
                          />
                        ))}
                      </div>
                    )
                  })}
                </div>
              )}
              {selectedCategoryIds.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Elegí al menos una categoría. Si elegís una padre, también se cuentan sus
                  subcategorías.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Monto</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="150000"
                {...register('amount', { required: true, min: 0.01 })}
              />
              <p className="text-xs text-muted-foreground">Obligatorio para presupuestos por categoría</p>
            </div>

            <div className="space-y-2">
              <Label>Cuenta (opcional)</Label>
              <Select
                value={cashAccountId}
                onChange={(e) => setValue('cashAccountId', e.target.value, { shouldDirty: true })}
              >
                <option value="">Todas las cuentas</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency})
                  </option>
                ))}
              </Select>
              <p className="text-xs text-muted-foreground">
                Filtrá los gastos de esas categorías a una cuenta concreta
              </p>
            </div>
          </>
        )}

        {preview !== null && (
          <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="text-sm">
              <p className="font-medium text-foreground">
                Podés gastar ~{formatCurrencyFor(preview, currency)} por día
              </p>
              <p className="text-xs text-muted-foreground">
                Sobre {formatCurrencyFor(effectiveAmount, currency)} en el período elegido
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" disabled={isPending || !canSubmit}>
            {isPending
              ? 'Guardando...'
              : isEditing
                ? 'Guardar cambios'
                : 'Crear presupuesto'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

function CategoryCheckRow({
  id,
  name,
  color,
  checked,
  onToggle,
  indent,
}: {
  id: string
  name: string
  color: string | null
  checked: boolean
  onToggle: (id: string) => void
  indent: boolean
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60',
        indent && 'pl-6',
      )}
    >
      <input
        type="checkbox"
        className="h-4 w-4 accent-[var(--primary)]"
        checked={checked}
        onChange={() => onToggle(id)}
      />
      {color ? (
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full border"
          style={{ backgroundColor: color }}
        />
      ) : (
        <span className="h-2.5 w-2.5 shrink-0 rounded-full border bg-muted" />
      )}
      <span className={cn(indent && 'text-muted-foreground')}>{name}</span>
    </label>
  )
}
