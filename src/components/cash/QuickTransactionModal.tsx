import { useEffect, useMemo, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useCashAccounts } from '@/hooks/useCashAccounts'
import { useCashCategories } from '@/hooks/useCashCategories'
import { useCashTransactions, useCreateCashTransaction } from '@/hooks/useCashTransactions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Dialog } from '@/components/ui/dialog'
import { CategorySubcategoryFields } from '@/components/cash/CategorySubcategoryFields'
import { IntentSelector } from '@/components/cash/IntentSelector'
import { ReimbursementFields } from '@/components/cash/ReimbursementFields'
import { TransactionTypeToggle } from '@/components/cash/TransactionTypeToggle'
import {
  getCategories,
  getSubcategories,
  isCategorySelectionValid,
  resolveTransactionCategoryId,
} from '@/utils/cashCategories'
import { todayISO } from '@/utils/format'
import type { CashTransactionIntent, CashTransactionType } from '@/types/cash'

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
  isReimbursement: boolean
  relatedExpenseId: string
  intent: CashTransactionIntent | ''
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
  const { data: expenseTxData } = useCashTransactions({
    type: 'EXPENSE',
    excludeTransfers: true,
    excludeFundings: true,
  })
  const expenseTransactions = expenseTxData?.items ?? []
  const wasOpenRef = useRef(false)

  const { register, handleSubmit, reset, setValue, watch } = useForm<QuickForm>({
    defaultValues: {
      type: defaultType,
      cashAccountId: defaultAccountId ?? '',
      parentCategoryId: '',
      subcategoryId: '',
      isReimbursement: false,
      relatedExpenseId: '',
      intent: '',
      amount: '',
      date: todayISO(),
      description: '',
    },
  })

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
  const { data: categories = [] } = useCashCategories({ type: formType })
  const { data: expenseCategories = [] } = useCashCategories({ type: 'EXPENSE' })

  const parentCategories = useMemo(
    () => getCategories(categories, formType),
    [categories, formType],
  )

  const selectionValid = isCategorySelectionValid(
    categories,
    parentCategoryId,
    subcategoryId,
  )
  const submitDisabled =
    createTx.isPending ||
    (!isLinkedIncome && parentCategories.length === 0) ||
    (isLinkedIncome ? !watch('relatedExpenseId') : !selectionValid)

  // Solo resetear al abrir el modal, no cuando cambian las categorías al cambiar tipo.
  useEffect(() => {
    const justOpened = open && !wasOpenRef.current
    wasOpenRef.current = open
    if (!justOpened) return

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
      isReimbursement: false,
      relatedExpenseId: '',
      intent: '',
      amount: '',
      date: todayISO(),
      description: '',
    })
  }, [open, defaultType, defaultAccountId, accounts, categories, reset])

  useEffect(() => {
    if (accounts.length > 0 && !watch('cashAccountId')) {
      setValue('cashAccountId', defaultAccountId ?? accounts[0]!.id, {
        shouldDirty: true,
      })
    }
  }, [accounts, defaultAccountId, setValue, watch])

  const handleTypeChange = (type: CashTransactionType) => {
    setValue('type', type, { shouldDirty: true, shouldTouch: true })
    setValue('parentCategoryId', '', { shouldDirty: true })
    setValue('subcategoryId', '', { shouldDirty: true })
    if (type !== 'INCOME') {
      setValue('isReimbursement', false, { shouldDirty: true })
      setValue('relatedExpenseId', '', { shouldDirty: true })
    }
    if (type !== 'EXPENSE') {
      setValue('intent', '', { shouldDirty: true })
    }
  }

  const onSubmit = async (data: QuickForm) => {
    await createTx.mutateAsync({
      cashAccountId: data.cashAccountId,
      categoryId:
        data.type === 'INCOME' && data.isReimbursement && data.relatedExpenseId
          ? undefined
          : resolveTransactionCategoryId(data.parentCategoryId, data.subcategoryId),
      type: data.type,
      amount: Number(data.amount),
      date: data.date,
      description: data.description || undefined,
      relatedExpenseId:
        data.type === 'INCOME' && data.isReimbursement && data.relatedExpenseId
          ? data.relatedExpenseId
          : undefined,
      ...(data.type === 'EXPENSE' && data.intent ? { intent: data.intent } : {}),
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
            disabled={submitDisabled}
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
        <TransactionTypeToggle value={formType} onChange={handleTypeChange} />

        <div className="space-y-2">
          <Label>Monto</Label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0,00"
            autoFocus
            className="h-12 text-lg font-semibold tabular-nums"
            {...register('amount', { required: true })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
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
        </div>

        {!isLinkedIncome && (
          <div className="grid gap-3 sm:grid-cols-2">
            <CategorySubcategoryFields
              key={formType}
              categories={categories}
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
          </div>
        )}

        <div className="space-y-2">
          <Label>Descripción</Label>
          <Input
            placeholder={
              formType === 'EXPENSE' ? 'Ej: Supermercado, nafta…' : 'Ej: Sueldo, reintegro…'
            }
            {...register('description')}
          />
        </div>

        {formType === 'EXPENSE' && (
          <IntentSelector
            value={intent}
            onChange={(next) => setValue('intent', next, { shouldDirty: true })}
          />
        )}

        {formType === 'INCOME' && (
          <ReimbursementFields
            checked={isReimbursement}
            relatedExpenseId={watch('relatedExpenseId')}
            expenseTransactions={expenseTransactions}
            categories={expenseCategories}
            onCheckedChange={(checked) => {
              setValue('isReimbursement', checked, { shouldDirty: true })
              if (!checked) setValue('relatedExpenseId', '', { shouldDirty: true })
            }}
            onRelatedExpenseChange={(id) =>
              setValue('relatedExpenseId', id, { shouldDirty: true })
            }
          />
        )}
      </form>
    </Dialog>
  )
}
