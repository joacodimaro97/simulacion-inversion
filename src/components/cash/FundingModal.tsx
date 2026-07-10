import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useCashAccounts } from '@/hooks/useCashAccounts'
import { useAccounts } from '@/hooks/useAccounts'
import { useCreateFunding } from '@/hooks/useFundings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Dialog } from '@/components/ui/dialog'
import { todayISO } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { FundingType } from '@/types/cash'

interface FundingModalProps {
  open: boolean
  onClose: () => void
  defaultType?: FundingType
  defaultCashAccountId?: string
  defaultInvestmentAccountId?: string
}

interface FundingForm {
  type: FundingType
  cashAccountId: string
  investmentAccountId: string
  amount: string
  date: string
  description: string
}

export function FundingModal({
  open,
  onClose,
  defaultType = 'CASH_TO_INVESTMENT',
  defaultCashAccountId,
  defaultInvestmentAccountId,
}: FundingModalProps) {
  const { data: cashAccounts = [] } = useCashAccounts()
  const { data: investmentAccounts = [] } = useAccounts()
  const createFunding = useCreateFunding()

  const { register, handleSubmit, reset, setValue, watch } = useForm<FundingForm>({
    defaultValues: {
      type: defaultType,
      cashAccountId: defaultCashAccountId ?? '',
      investmentAccountId: defaultInvestmentAccountId ?? '',
      amount: '',
      date: todayISO(),
      description: '',
    },
  })

  const formType = watch('type')
  const amount = watch('amount')
  const cashAccountId = watch('cashAccountId')
  const investmentAccountId = watch('investmentAccountId')

  const isValid =
    cashAccountId &&
    investmentAccountId &&
    Number(amount) > 0

  const title = useMemo(
    () =>
      formType === 'CASH_TO_INVESTMENT'
        ? 'Depositar a inversión'
        : 'Retirar a efectivo',
    [formType],
  )

  useEffect(() => {
    if (!open) return
    reset({
      type: defaultType,
      cashAccountId: defaultCashAccountId ?? cashAccounts[0]?.id ?? '',
      investmentAccountId:
        defaultInvestmentAccountId ?? investmentAccounts[0]?.id ?? '',
      amount: '',
      date: todayISO(),
      description: '',
    })
  }, [
    open,
    defaultType,
    defaultCashAccountId,
    defaultInvestmentAccountId,
    cashAccounts,
    investmentAccounts,
    reset,
  ])

  const onSubmit = async (data: FundingForm) => {
    await createFunding.mutateAsync({
      type: data.type,
      cashAccountId: data.cashAccountId,
      investmentAccountId: data.investmentAccountId,
      amount: Number(data.amount),
      date: data.date,
      description: data.description || undefined,
    })
    onClose()
  }

  if (cashAccounts.length === 0 || investmentAccounts.length === 0) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        title={title}
        description="Requisitos no cumplidos"
      >
        <p className="text-sm text-muted-foreground">
          {cashAccounts.length === 0
            ? 'Necesitás al menos una cuenta de efectivo.'
            : 'Necesitás al menos una cuenta de inversión.'}
        </p>
        <Button type="button" className="mt-4 w-full" onClick={onClose}>
          Entendido
        </Button>
      </Dialog>
    )
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description="Movimiento entre efectivo e inversión"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
          {(['CASH_TO_INVESTMENT', 'INVESTMENT_TO_CASH'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setValue('type', t)}
              className={cn(
                'min-h-11 rounded-md py-2.5 text-xs font-medium transition-colors sm:text-sm',
                formType === t
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t === 'CASH_TO_INVESTMENT' ? 'Depositar' : 'Retirar'}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <Label>Cuenta de efectivo</Label>
          <Select {...register('cashAccountId', { required: true })}>
            {cashAccounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.currency})
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Cuenta de inversión</Label>
          <Select {...register('investmentAccountId', { required: true })}>
            {investmentAccounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.currency})
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Monto</Label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0"
            autoFocus
            {...register('amount', { required: true, min: 0.01 })}
          />
        </div>

        <div className="space-y-2">
          <Label>Fecha</Label>
          <Input type="date" {...register('date', { required: true })} />
        </div>

        <div className="space-y-2">
          <Label>Descripción (opcional)</Label>
          <Input placeholder="Ej: Aporte mensual al FCI" {...register('description')} />
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={createFunding.isPending || !isValid}
          >
            {createFunding.isPending ? 'Guardando...' : 'Confirmar'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
