import { useMemo, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Plus, Trash2 } from 'lucide-react'
import { useFundings, useDeleteFunding } from '@/hooks/useFundings'
import { useCashAccounts } from '@/hooks/useCashAccounts'
import { useAccounts } from '@/hooks/useAccounts'
import { FundingModal } from '@/components/cash/FundingModal'
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
import { formatCurrency, formatDate } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { FundingType } from '@/types/cash'

export function CashFundingsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState<FundingType>('CASH_TO_INVESTMENT')
  const [cashAccountId, setCashAccountId] = useState('')
  const [investmentAccountId, setInvestmentAccountId] = useState('')
  const [typeFilter, setTypeFilter] = useState<'' | FundingType>('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const queryFilters = useMemo(
    () => ({
      ...(cashAccountId ? { cashAccountId } : {}),
      ...(investmentAccountId ? { investmentAccountId } : {}),
      ...(typeFilter ? { type: typeFilter } : {}),
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    }),
    [cashAccountId, investmentAccountId, typeFilter, startDate, endDate],
  )

  const { data: cashAccounts = [], isLoading: cashLoading } = useCashAccounts()
  const { data: investmentAccounts = [], isLoading: invLoading } = useAccounts()
  const { data: fundings = [], isLoading, isFetching } = useFundings(queryFilters)
  const deleteFunding = useDeleteFunding()

  const openModal = (type: FundingType) => {
    setModalType(type)
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (deleteConfirmId !== id) {
      setDeleteConfirmId(id)
      return
    }
    await deleteFunding.mutateAsync(id)
    setDeleteConfirmId(null)
  }

  if (cashLoading || invLoading) {
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
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Efectivo ↔ Inversión
          </h1>
          <p className="text-sm text-muted-foreground">
            Depósitos y retiros entre efectivo y cuentas de inversión
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => openModal('CASH_TO_INVESTMENT')}>
            <ArrowUpRight className="h-4 w-4" />
            Depositar
          </Button>
          <Button variant="outline" onClick={() => openModal('INVESTMENT_TO_CASH')}>
            <ArrowDownLeft className="h-4 w-4" />
            Retirar
          </Button>
        </div>
      </div>

      <FundingModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultType={modalType}
      />

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle className="text-base">
            Historial ({fundings.length})
            {isFetching && !isLoading ? (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                Actualizando…
              </span>
            ) : null}
          </CardTitle>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Select
              value={cashAccountId}
              onChange={(e) => setCashAccountId(e.target.value)}
              className="col-span-2 h-10 w-full sm:col-span-1 sm:h-8 sm:w-40"
            >
              <option value="">Todas (efectivo)</option>
              {cashAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
            <Select
              value={investmentAccountId}
              onChange={(e) => setInvestmentAccountId(e.target.value)}
              className="col-span-2 h-10 w-full sm:col-span-1 sm:h-8 sm:w-40"
            >
              <option value="">Todas (inversión)</option>
              {investmentAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as '' | FundingType)}
              className="h-10 w-full sm:h-8 sm:w-36"
            >
              <option value="">Todos</option>
              <option value="CASH_TO_INVESTMENT">Depósitos</option>
              <option value="INVESTMENT_TO_CASH">Retiros</option>
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
          {isLoading && fundings.length === 0 ? (
            <TableSkeleton rows={3} />
          ) : fundings.length === 0 ? (
            <EmptyState
              message="No hay movimientos entre efectivo e inversión."
              action={
                <Button variant="outline" onClick={() => openModal('CASH_TO_INVESTMENT')}>
                  <Plus className="h-4 w-4" />
                  Registrar primer movimiento
                </Button>
              }
            />
          ) : (
            <div className={cn('transition-opacity', isFetching && 'opacity-60')}>
              <div className="space-y-3 md:hidden">
                {fundings.map((f) => (
                  <div key={f.id} className="rounded-lg border bg-card p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Badge
                          variant={
                            f.type === 'CASH_TO_INVESTMENT' ? 'secondary' : 'outline'
                          }
                        >
                          {f.type === 'CASH_TO_INVESTMENT' ? (
                            <ArrowUpRight className="mr-1 h-3 w-3" />
                          ) : (
                            <ArrowDownLeft className="mr-1 h-3 w-3" />
                          )}
                          {f.type === 'CASH_TO_INVESTMENT' ? 'Depósito' : 'Retiro'}
                        </Badge>
                        <p className="mt-2 text-sm font-medium">
                          {f.type === 'CASH_TO_INVESTMENT'
                            ? `${f.cashAccount.name} → ${f.investmentAccount.name}`
                            : `${f.investmentAccount.name} → ${f.cashAccount.name}`}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDate(f.date)}
                        </p>
                        {f.description && (
                          <p className="mt-1 text-xs text-muted-foreground">{f.description}</p>
                        )}
                      </div>
                      <span className="shrink-0 text-sm font-semibold">
                        {formatCurrency(f.amount)}
                      </span>
                    </div>
                    <div className="mt-3 border-t pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        className="w-full text-destructive hover:text-destructive"
                        onClick={() => handleDelete(f.id)}
                        disabled={deleteFunding.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                        {deleteConfirmId === f.id ? 'Confirmar eliminación' : 'Eliminar'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Table className="hidden md:table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Movimiento</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fundings.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell>{formatDate(f.date)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            f.type === 'CASH_TO_INVESTMENT' ? 'secondary' : 'outline'
                          }
                        >
                          {f.type === 'CASH_TO_INVESTMENT' ? (
                            <ArrowUpRight className="mr-1 h-3 w-3" />
                          ) : (
                            <ArrowDownLeft className="mr-1 h-3 w-3" />
                          )}
                          {f.type === 'CASH_TO_INVESTMENT' ? 'Depósito' : 'Retiro'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {f.type === 'CASH_TO_INVESTMENT'
                          ? `${f.cashAccount.name} → ${f.investmentAccount.name}`
                          : `${f.investmentAccount.name} → ${f.cashAccount.name}`}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(f.amount)}
                      </TableCell>
                      <TableCell className="max-w-40 truncate text-muted-foreground">
                        {f.description || '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          onClick={() => handleDelete(f.id)}
                          disabled={deleteFunding.isPending}
                          title={
                            deleteConfirmId === f.id
                              ? 'Clic de nuevo para confirmar'
                              : 'Eliminar'
                          }
                        >
                          <Trash2
                            className={cn(
                              'h-4 w-4',
                              deleteConfirmId === f.id
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
