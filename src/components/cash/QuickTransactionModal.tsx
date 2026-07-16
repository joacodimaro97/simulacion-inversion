import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useCashAccounts } from '@/hooks/useCashAccounts'
import { useCashCategories } from '@/hooks/useCashCategories'
import { useCreateCashTransaction } from '@/hooks/useCashTransactions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Dialog } from '@/components/ui/dialog'
import { CategorySubcategoryFields } from '@/components/cash/CategorySubcategoryFields'
import {
  getCategories,
  getSubcategories,
  isCategorySelectionValid,
  resolveTransactionCategoryId,
} from '@/utils/cashCategories'
import { todayISO } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { CashTransactionType } from '@/types/cash'

interface QuickTransactionModalProps {
  open: boolean
  onClose: () => void
  defaultType?: CashTransactionType
  defaultAccountId?: string
}

interface QuickForm {
  type: CashTransactionType
  cashAccountId: string
  parentCategoryId: string
  subcategoryId: string
  amount: string
  date: string
  description: string
}

export function QuickTransactionModal({
  open,
  onClose,
  defaultType = 'EXPENSE',
  defaultAccountId,
}: QuickTransactionModalProps) {
  const { data: accounts = [] } = useCashAccounts()
  const createTx = useCreateCashTransaction()

  const { register, handleSubmit, reset, setValue, watch } = useForm<QuickForm>({
    defaultValues: {
      type: defaultType,
      cashAccountId: defaultAccountId ?? '',
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
  const { data: categories = [] } = useCashCategories({ type: formType })

  const parentCategories = useMemo(
    () => getCategories(categories, formType),
    [categories, formType],
  )

  const selectionValid = isCategorySelectionValid(
    categories,
    parentCategoryId,
    subcategoryId,
  )

  useEffect(() => {
    if (!open) return
    const parents = getCategories(categories, defaultType)
    const firstParentId = parents[0]?.id ?? ''
    const firstSubcategoryId = firstParentId
      ? (getSubcategories(categories, firstParentId)[0]?.id ?? '')
      : ''
    reset({
      type: defaultType,
      cashAccountId: defaultAccountId ?? accounts[0]?.id ?? '',
      parentCategoryId: firstParentId,
      subcategoryId: firstSubcategoryId,
      amount: '',
      date: todayISO(),
      description: '',
    })
  }, [open, defaultType, defaultAccountId, accounts, categories, reset])

  useEffect(() => {
    if (accounts.length > 0 && !watch('cashAccountId')) {
      setValue('cashAccountId', defaultAccountId ?? accounts[0]!.id)
    }
  }, [accounts, defaultAccountId, setValue, watch])

  const onSubmit = async (data: QuickForm) => {
    await createTx.mutateAsync({
      cashAccountId: data.cashAccountId,
      categoryId: resolveTransactionCategoryId(data.parentCategoryId, data.subcategoryId),
      type: data.type,
      amount: Number(data.amount),
      date: data.date,
      description: data.description || undefined,
    })
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Registrar movimiento"
      description="Cargá un gasto o ingreso en segundos"
      footer={
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="quick-transaction-form"
            className="flex-1"
            disabled={createTx.isPending || parentCategories.length === 0 || !selectionValid}
          >
            {createTx.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      }
    >
      <form
        id="quick-transaction-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
          {(['EXPENSE', 'INCOME'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setValue('type', t)
                setValue('parentCategoryId', '')
                setValue('subcategoryId', '')
              }}
              className={cn(
                'min-h-11 rounded-md py-2.5 text-sm font-medium transition-colors',
                formType === t
                  ? t === 'EXPENSE'
                    ? 'bg-destructive text-destructive-foreground shadow'
                    : 'bg-success text-success-foreground shadow'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t === 'EXPENSE' ? 'Gasto' : 'Ingreso'}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <Label>Monto</Label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0"
            autoFocus
            {...register('amount', { required: true })}
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

        <CategorySubcategoryFields
          categories={categories}
          type={formType}
          parentCategoryId={parentCategoryId}
          subcategoryId={subcategoryId}
          onParentChange={(id) => setValue('parentCategoryId', id)}
          onSubcategoryChange={(id) => setValue('subcategoryId', id)}
        />

        <div className="space-y-2">
          <Label>Fecha</Label>
          <Input type="date" {...register('date', { required: true })} />
        </div>

        <div className="space-y-2">
          <Label>Descripción (opcional)</Label>
          <Input placeholder="Ej: Supermercado" {...register('description')} />
        </div>
      </form>
    </Dialog>
  )
}
