import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Trash2, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { useAccount } from '@/contexts/AccountContext'
import { useMovements, useCreateMovement, useDeleteMovement } from '@/hooks/useMovements'
import { useStatistics } from '@/hooks/useStatistics'
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
import { MetricCardSkeleton, PageHeaderSkeleton, TableSkeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate, todayISO } from '@/utils/format'
import type { MovementType } from '@/types/api'

interface MovementForm {
  date: string
  type: MovementType
  amount: string
  description: string
}

export function MovementsPage() {
  const { accountId, isReady } = useAccount()
  const { data: movements = [], isLoading } = useMovements()
  const { data: stats, isLoading: statsLoading } = useStatistics()
  const createMovement = useCreateMovement()
  const deleteMovement = useDeleteMovement()

  const { register, handleSubmit, reset } = useForm<MovementForm>({
    defaultValues: {
      date: todayISO(),
      type: 'DEPOSIT',
      amount: '',
      description: '',
    },
  })

  const totals = useMemo(() => {
    const deposits = movements
      .filter((m) => m.type === 'DEPOSIT')
      .reduce((s, m) => s + m.amount, 0)
    const withdrawals = movements
      .filter((m) => m.type === 'WITHDRAW')
      .reduce((s, m) => s + m.amount, 0)
    return { deposits, withdrawals, net: deposits - withdrawals }
  }, [movements])

  const onSubmit = async (data: MovementForm) => {
    if (!accountId) return
    await createMovement.mutateAsync({
      accountId,
      date: data.date,
      type: data.type,
      amount: parseFloat(data.amount) || 0,
      description: data.description || undefined,
    })
    reset({ date: todayISO(), type: 'DEPOSIT', amount: '', description: '' })
  }

  if (!isReady || isLoading || statsLoading) {
    return (
      <div className="space-y-8">
        <PageHeaderSkeleton />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>
        <TableSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Movimientos</h1>
        <p className="text-muted-foreground">Registrá depósitos y retiros de capital</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total depósitos</p>
            <p className="text-xl font-bold text-success">{formatCurrency(totals.deposits)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total retiros</p>
            <p className="text-xl font-bold text-destructive">
              {formatCurrency(totals.withdrawals)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Neto invertido</p>
            <p className="text-xl font-bold">
              {formatCurrency(stats?.capitalInvertido ?? totals.net)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nuevo movimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input id="date" type="date" {...register('date')} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select id="type" {...register('type')}>
                  <option value="DEPOSIT">Depósito</option>
                  <option value="WITHDRAW">Retiro</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Monto ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="50000"
                  {...register('amount')}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  placeholder="Aporte mensual"
                  {...register('description')}
                />
              </div>
            </div>
            <Button type="submit" disabled={createMovement.isPending}>
              <Plus className="h-4 w-4" />
              Registrar movimiento
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historial ({movements.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {movements.length === 0 ? (
            <EmptyState message="No hay movimientos registrados." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...movements].reverse().map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>{formatDate(movement.date)}</TableCell>
                    <TableCell>
                      <Badge variant={movement.type === 'DEPOSIT' ? 'success' : 'destructive'}>
                        {movement.type === 'DEPOSIT' ? (
                          <ArrowDownLeft className="mr-1 h-3 w-3" />
                        ) : (
                          <ArrowUpRight className="mr-1 h-3 w-3" />
                        )}
                        {movement.type === 'DEPOSIT' ? 'Depósito' : 'Retiro'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(movement.amount)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {movement.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMovement.mutate(movement.id)}
                        disabled={deleteMovement.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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
