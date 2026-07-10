import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { ArrowLeftRight } from 'lucide-react'
import { useCashAccounts } from '@/hooks/useCashAccounts'
import { useCreateCashTransfer } from '@/hooks/useCashTransfers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Dialog } from '@/components/ui/dialog'
import { todayISO } from '@/utils/format'

interface TransferModalProps {
  open: boolean
  onClose: () => void
  defaultFromAccountId?: string
}

interface TransferForm {
  fromCashAccountId: string
  toCashAccountId: string
  amount: string
  date: string
  description: string
}

export function TransferModal({
  open,
  onClose,
  defaultFromAccountId,
}: TransferModalProps) {
  const { data: accounts = [] } = useCashAccounts()
  const createTransfer = useCreateCashTransfer()

  const { register, handleSubmit, reset, setValue, watch } = useForm<TransferForm>({
    defaultValues: {
      fromCashAccountId: defaultFromAccountId ?? '',
      toCashAccountId: '',
      amount: '',
      date: todayISO(),
      description: '',
    },
  })

  const fromId = watch('fromCashAccountId')
  const toId = watch('toCashAccountId')
  const amount = watch('amount')

  const destinationAccounts = useMemo(
    () => accounts.filter((a) => a.id !== fromId),
    [accounts, fromId],
  )

  const isValid =
    fromId &&
    toId &&
    fromId !== toId &&
    Number(amount) > 0

  useEffect(() => {
    if (!open) return
    const from = defaultFromAccountId ?? accounts[0]?.id ?? ''
    const to = accounts.find((a) => a.id !== from)?.id ?? ''
    reset({
      fromCashAccountId: from,
      toCashAccountId: to,
      amount: '',
      date: todayISO(),
      description: '',
    })
  }, [open, defaultFromAccountId, accounts, reset])

  useEffect(() => {
    if (toId === fromId) {
      const next = destinationAccounts[0]?.id ?? ''
      setValue('toCashAccountId', next)
    }
  }, [fromId, toId, destinationAccounts, setValue])

  const onSubmit = async (data: TransferForm) => {
    if (data.fromCashAccountId === data.toCashAccountId) return
    await createTransfer.mutateAsync({
      fromCashAccountId: data.fromCashAccountId,
      toCashAccountId: data.toCashAccountId,
      amount: Number(data.amount),
      date: data.date,
      description: data.description || undefined,
    })
    onClose()
  }

  if (accounts.length < 2) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        title="Transferir entre cuentas"
        description="Necesitás al menos dos cuentas de efectivo"
      >
        <p className="text-sm text-muted-foreground">
          Creá otra cuenta de efectivo para poder transferir fondos entre ellas.
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
      title="Transferir entre cuentas"
      description="Mové dinero entre tus cuentas de efectivo"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label>Cuenta origen</Label>
          <Select {...register('fromCashAccountId', { required: true })}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.currency})
              </option>
            ))}
          </Select>
        </div>

        <div className="flex justify-center">
          <ArrowLeftRight className="h-5 w-5 text-slate-500" />
        </div>

        <div className="space-y-2">
          <Label>Cuenta destino</Label>
          <Select {...register('toCashAccountId', { required: true })}>
            {destinationAccounts.map((a) => (
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
          <Input placeholder="Ej: A la billetera" {...register('description')} />
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={createTransfer.isPending || !isValid}
          >
            {createTransfer.isPending ? 'Transfiriendo...' : 'Transferir'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
