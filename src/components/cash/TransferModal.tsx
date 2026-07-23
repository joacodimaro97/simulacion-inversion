import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { ArrowLeftRight } from 'lucide-react'
import { useCashAccounts } from '@/hooks/useCashAccounts'
import { useCreateCashTransfer } from '@/hooks/useCashTransfers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Dialog } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrencyFor, todayISO } from '@/utils/format'
import { isUsdCurrency, useUsdExchangeRate } from '@/utils/exchangeRate'
import { cn } from '@/utils/cn'
import type { CreateCashTransferInput } from '@/types/cash'

interface TransferModalProps {
  open: boolean
  onClose: () => void
  defaultFromAccountId?: string
}

interface TransferForm {
  fromCashAccountId: string
  toCashAccountId: string
  amount: string
  exchangeRate: string
  toAmount: string
  date: string
  description: string
}

type FxMode = 'rate' | 'toAmount'

function suggestCrossRate(
  fromCurrency: string,
  toCurrency: string,
  usdArsRate: number | null,
): number | null {
  if (usdArsRate == null || usdArsRate <= 0) return null
  if (isUsdCurrency(fromCurrency) && toCurrency.toUpperCase() === 'ARS') return usdArsRate
  if (fromCurrency.toUpperCase() === 'ARS' && isUsdCurrency(toCurrency)) {
    return 1 / usdArsRate
  }
  return null
}

function formatRate(rate: number): string {
  if (!Number.isFinite(rate) || rate <= 0) return '—'
  return rate.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: rate >= 1 ? 4 : 8,
  })
}

export function TransferModal({
  open,
  onClose,
  defaultFromAccountId,
}: TransferModalProps) {
  const { data: accounts = [] } = useCashAccounts()
  const createTransfer = useCreateCashTransfer()
  const [usdRate] = useUsdExchangeRate()
  const [fxMode, setFxMode] = useState<FxMode>('rate')

  const { register, handleSubmit, reset, setValue, watch } = useForm<TransferForm>({
    defaultValues: {
      fromCashAccountId: defaultFromAccountId ?? '',
      toCashAccountId: '',
      amount: '',
      exchangeRate: '',
      toAmount: '',
      date: todayISO(),
      description: '',
    },
  })

  const fromId = watch('fromCashAccountId')
  const toId = watch('toCashAccountId')
  const amountStr = watch('amount')
  const rateStr = watch('exchangeRate')
  const toAmountStr = watch('toAmount')

  const fromAccount = useMemo(
    () => accounts.find((a) => a.id === fromId),
    [accounts, fromId],
  )
  const toAccount = useMemo(
    () => accounts.find((a) => a.id === toId),
    [accounts, toId],
  )

  const destinationAccounts = useMemo(
    () => accounts.filter((a) => a.id !== fromId),
    [accounts, fromId],
  )

  const isCrossCurrency = Boolean(
    fromAccount &&
      toAccount &&
      fromAccount.currency.toUpperCase() !== toAccount.currency.toUpperCase(),
  )

  const amount = Number(amountStr)
  const exchangeRate = Number(rateStr)
  const toAmount = Number(toAmountStr)

  const preview = useMemo(() => {
    if (!isCrossCurrency || !fromAccount || !toAccount || !(amount > 0)) return null

    if (fxMode === 'rate' && exchangeRate > 0) {
      const computedTo = amount * exchangeRate
      return {
        fromAmount: amount,
        toAmount: computedTo,
        rate: exchangeRate,
      }
    }

    if (fxMode === 'toAmount' && toAmount > 0) {
      return {
        fromAmount: amount,
        toAmount,
        rate: toAmount / amount,
      }
    }

    return null
  }, [
    isCrossCurrency,
    fromAccount,
    toAccount,
    amount,
    exchangeRate,
    toAmount,
    fxMode,
  ])

  const isValid = Boolean(
    fromId &&
      toId &&
      fromId !== toId &&
      amount > 0 &&
      (!isCrossCurrency ||
        (fxMode === 'rate' ? exchangeRate > 0 : toAmount > 0)),
  )

  useEffect(() => {
    if (!open) return
    const from = defaultFromAccountId ?? accounts[0]?.id ?? ''
    const to = accounts.find((a) => a.id !== from)?.id ?? ''
    const fromAcc = accounts.find((a) => a.id === from)
    const toAcc = accounts.find((a) => a.id === to)
    const suggested =
      fromAcc && toAcc
        ? suggestCrossRate(fromAcc.currency, toAcc.currency, usdRate)
        : null

    setFxMode('rate')
    reset({
      fromCashAccountId: from,
      toCashAccountId: to,
      amount: '',
      exchangeRate: suggested != null ? String(suggested) : '',
      toAmount: '',
      date: todayISO(),
      description: '',
    })
  }, [open, defaultFromAccountId, accounts, reset, usdRate])

  useEffect(() => {
    if (toId === fromId) {
      const next = destinationAccounts[0]?.id ?? ''
      setValue('toCashAccountId', next)
    }
  }, [fromId, toId, destinationAccounts, setValue])

  // Prefill cotización al cambiar par de monedas.
  useEffect(() => {
    if (!open || !fromAccount || !toAccount) return
    if (fromAccount.currency.toUpperCase() === toAccount.currency.toUpperCase()) {
      setValue('exchangeRate', '')
      setValue('toAmount', '')
      return
    }
    const suggested = suggestCrossRate(fromAccount.currency, toAccount.currency, usdRate)
    setValue('exchangeRate', suggested != null ? String(suggested) : '')
    setValue('toAmount', '')
  }, [
    open,
    fromAccount?.id,
    toAccount?.id,
    fromAccount?.currency,
    toAccount?.currency,
    usdRate,
    setValue,
  ])

  const onSubmit = async (data: TransferForm) => {
    if (data.fromCashAccountId === data.toCashAccountId) return

    const payload: CreateCashTransferInput = {
      fromCashAccountId: data.fromCashAccountId,
      toCashAccountId: data.toCashAccountId,
      amount: Number(data.amount),
      date: data.date,
      description: data.description || undefined,
    }

    if (isCrossCurrency) {
      if (fxMode === 'rate') {
        payload.exchangeRate = Number(data.exchangeRate)
      } else {
        payload.toAmount = Number(data.toAmount)
      }
    }

    await createTransfer.mutateAsync(payload)
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
          <Label>
            Monto origen
            {fromAccount ? (
              <span className="ml-1 font-normal text-muted-foreground">
                ({fromAccount.currency})
              </span>
            ) : null}
          </Label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0"
            autoFocus
            {...register('amount', { required: true, min: 0.01 })}
          />
        </div>

        {isCrossCurrency && fromAccount && toAccount && (
          <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">
              Monedas distintas ({fromAccount.currency} → {toAccount.currency}). Indicá
              cotización o monto destino.
            </p>

            <Tabs value={fxMode} onValueChange={(v) => setFxMode(v as FxMode)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="rate" type="button">
                  Cotización
                </TabsTrigger>
                <TabsTrigger value="toAmount" type="button">
                  Monto destino
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {fxMode === 'rate' ? (
              <div className="space-y-2">
                <Label>
                  Cotización
                  <span className="ml-1 font-normal text-muted-foreground">
                    ({toAccount.currency} por 1 {fromAccount.currency})
                  </span>
                </Label>
                <Input
                  type="number"
                  step="any"
                  min="0.00000001"
                  placeholder={
                    isUsdCurrency(fromAccount.currency) &&
                    toAccount.currency.toUpperCase() === 'ARS'
                      ? 'Ej: 1400'
                      : fromAccount.currency.toUpperCase() === 'ARS' &&
                          isUsdCurrency(toAccount.currency)
                        ? 'Ej: 0,000714'
                        : '0'
                  }
                  {...register('exchangeRate', { required: true, min: 0.00000001 })}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>
                  Monto destino
                  <span className="ml-1 font-normal text-muted-foreground">
                    ({toAccount.currency})
                  </span>
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0"
                  {...register('toAmount', { required: true, min: 0.01 })}
                />
              </div>
            )}

            {preview && (
              <p
                className={cn(
                  'rounded-md bg-background px-3 py-2 text-sm font-medium text-foreground ring-1 ring-border/70',
                )}
              >
                Salen {formatCurrencyFor(preview.fromAmount, fromAccount.currency)} → entran{' '}
                {formatCurrencyFor(preview.toAmount, toAccount.currency)}
                <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                  tc {formatRate(preview.rate)} {toAccount.currency}/{fromAccount.currency}
                </span>
              </p>
            )}
          </div>
        )}

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
