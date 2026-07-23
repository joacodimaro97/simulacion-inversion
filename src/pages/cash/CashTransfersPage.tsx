import { useMemo, useState } from 'react'
import { ArrowLeftRight, Plus, Trash2 } from 'lucide-react'
import {
  useCashTransfers,
  useDeleteCashTransfer,
} from '@/hooks/useCashTransfers'
import { useCashAccounts } from '@/hooks/useCashAccounts'
import { TransferModal } from '@/components/cash/TransferModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { formatCurrencyFor, formatDate } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { CashTransfer } from '@/types/cash'

function formatRate(rate: number): string {
  return rate.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: rate >= 1 ? 4 : 8,
  })
}

function TransferAmounts({ transfer }: { transfer: CashTransfer }) {
  const { amount, toAmount, exchangeRate, fromAccount, toAccount } = transfer
  const cross =
    fromAccount.currency.toUpperCase() !== toAccount.currency.toUpperCase() ||
    exchangeRate != null

  return (
    <div className="space-y-0.5">
      <p className="text-sm font-semibold tabular-nums text-slate-700 dark:text-slate-300">
        {formatCurrencyFor(amount, fromAccount.currency)}
        {cross ? (
          <>
            <span className="mx-1 font-normal text-muted-foreground">→</span>
            {formatCurrencyFor(toAmount, toAccount.currency)}
          </>
        ) : null}
      </p>
      {exchangeRate != null && (
        <p className="text-[11px] text-muted-foreground">
          tc {formatRate(exchangeRate)} {toAccount.currency}/{fromAccount.currency}
        </p>
      )}
    </div>
  )
}

export function CashTransfersPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [cashAccountId, setCashAccountId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const queryFilters = useMemo(
    () => ({
      ...(cashAccountId ? { cashAccountId } : {}),
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    }),
    [cashAccountId, startDate, endDate],
  )

  const { data: accounts = [], isLoading: accountsLoading } = useCashAccounts()
  const { data: transfers = [], isLoading, isFetching } = useCashTransfers(queryFilters)
  const deleteTransfer = useDeleteCashTransfer()

  const handleDelete = async (id: string) => {
    if (deleteConfirmId !== id) {
      setDeleteConfirmId(id)
      return
    }
    await deleteTransfer.mutateAsync(id)
    setDeleteConfirmId(null)
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
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Transferencias</h1>
          <p className="text-sm text-muted-foreground">
            Movimientos entre tus cuentas de efectivo
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Nueva transferencia
        </Button>
      </div>

      <TransferModal open={modalOpen} onClose={() => setModalOpen(false)} />

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle className="text-base">
            Historial ({transfers.length})
            {isFetching && !isLoading ? (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                Actualizando…
              </span>
            ) : null}
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Select
              value={cashAccountId}
              onChange={(e) => setCashAccountId(e.target.value)}
              className="h-10 w-full sm:h-8 sm:w-40"
            >
              <option value="">Todas las cuentas</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-10 w-full sm:h-8 sm:w-36"
              aria-label="Desde"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-10 w-full sm:h-8 sm:w-36"
              aria-label="Hasta"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && transfers.length === 0 ? (
            <TableSkeleton rows={3} />
          ) : transfers.length === 0 ? (
            <EmptyState
              message="No hay transferencias registradas."
              action={
                <Button variant="outline" onClick={() => setModalOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Crear primera transferencia
                </Button>
              }
            />
          ) : (
            <div className={cn('transition-opacity', isFetching && 'opacity-60')}>
              <div className="space-y-3 md:hidden">
                {transfers.map((t) => (
                  <div key={t.id} className="rounded-lg border bg-card p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <ArrowLeftRight className="h-4 w-4 shrink-0 text-slate-500" />
                          <p className="text-sm font-medium">
                            {t.fromAccount.name}
                            <span className="mx-1 text-muted-foreground">→</span>
                            {t.toAccount.name}
                          </p>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDate(t.date)}
                          <span className="text-muted-foreground/80">
                            {' '}
                            · {t.fromAccount.currency} → {t.toAccount.currency}
                          </span>
                        </p>
                        {t.description && (
                          <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <TransferAmounts transfer={t} />
                      </div>
                    </div>
                    <div className="mt-3 border-t pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        className="w-full text-destructive hover:text-destructive"
                        onClick={() => handleDelete(t.id)}
                        disabled={deleteTransfer.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                        {deleteConfirmId === t.id ? 'Confirmar eliminación' : 'Eliminar'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Table className="hidden md:table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Movimiento</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{formatDate(t.date)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="slate">
                            <ArrowLeftRight className="mr-1 h-3 w-3" />
                            Transferencia
                          </Badge>
                          <span className="text-sm">
                            De {t.fromAccount.name} ({t.fromAccount.currency}) →{' '}
                            {t.toAccount.name} ({t.toAccount.currency})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <TransferAmounts transfer={t} />
                      </TableCell>
                      <TableCell className="max-w-40 truncate text-muted-foreground">
                        {t.description || '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          onClick={() => handleDelete(t.id)}
                          disabled={deleteTransfer.isPending}
                          title={
                            deleteConfirmId === t.id
                              ? 'Clic de nuevo para confirmar'
                              : 'Eliminar'
                          }
                        >
                          <Trash2
                            className={cn(
                              'h-4 w-4',
                              deleteConfirmId === t.id
                                ? 'text-destructive'
                                : 'text-muted-foreground',
                            )}
                          />
                        </Button>
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
