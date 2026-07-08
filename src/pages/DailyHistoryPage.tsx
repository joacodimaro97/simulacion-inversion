import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import { useAccount } from '@/contexts/AccountContext'
import {
  usePerformance,
  useCreatePerformance,
  useDeletePerformance,
} from '@/hooks/usePerformance'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { formatCurrency, formatDate, formatPercent, formatShareValue, todayISO } from '@/utils/format'

type InputMode = 'return_rate' | 'share_value'

interface RecordForm {
  date: string
  dailyReturnRate: string
  shareValue: string
  notes: string
}

export function DailyHistoryPage() {
  const { accountId, isReady } = useAccount()
  const { data: records = [], isLoading } = usePerformance()
  const createPerformance = useCreatePerformance()
  const deletePerformance = useDeletePerformance()
  const [inputMode, setInputMode] = useState<InputMode>('return_rate')

  const { register, handleSubmit, reset } = useForm<RecordForm>({
    defaultValues: { date: todayISO(), dailyReturnRate: '', shareValue: '', notes: '' },
  })

  const onSubmit = async (data: RecordForm) => {
    if (!accountId) return

    const payload =
      inputMode === 'return_rate'
        ? {
            accountId,
            date: data.date,
            dailyReturnPercent: parseFloat(data.dailyReturnRate) || 0,
            dailyProfit: 0,
            shareValue: 1,
            notes: data.notes || undefined,
          }
        : {
            accountId,
            date: data.date,
            dailyReturnPercent: 0,
            dailyProfit: 0,
            shareValue: parseFloat(data.shareValue) || 1,
            notes: data.notes || undefined,
          }

    await createPerformance.mutateAsync(payload)
    reset({ date: todayISO(), dailyReturnRate: '', shareValue: '', notes: '' })
  }

  if (!isReady || isLoading) {
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
        <h1 className="text-2xl font-bold tracking-tight">Historial diario</h1>
        <p className="text-muted-foreground">
          Registrá el rendimiento real de tu FCI día por día
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agregar registro</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as InputMode)}>
            <TabsList>
              <TabsTrigger value="return_rate">Rendimiento %</TabsTrigger>
              <TabsTrigger value="share_value">Valor cuota parte</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date">Fecha</Label>
                  <Input id="date" type="date" {...register('date')} required />
                </div>

                {inputMode === 'return_rate' ? (
                  <div className="space-y-2">
                    <Label htmlFor="dailyReturnRate">Rendimiento diario (%)</Label>
                    <Input
                      id="dailyReturnRate"
                      type="number"
                      step="0.0001"
                      placeholder="0.12"
                      {...register('dailyReturnRate')}
                      required
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="shareValue">Valor cuota parte</Label>
                    <Input
                      id="shareValue"
                      type="number"
                      step="0.000001"
                      placeholder="1.000000"
                      {...register('shareValue')}
                      required
                    />
                  </div>
                )}

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="notes">Observaciones</Label>
                  <Textarea id="notes" placeholder="Notas opcionales" {...register('notes')} />
                </div>
              </div>

              <Button type="submit" disabled={createPerformance.isPending}>
                <Plus className="h-4 w-4" />
                Agregar registro
              </Button>
            </form>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Registros ({records.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <EmptyState message="No hay registros. Agregá el primero arriba." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Rendimiento</TableHead>
                  <TableHead>Ganancia</TableHead>
                  <TableHead>Cuota parte</TableHead>
                  <TableHead>Obs.</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{formatDate(record.date)}</TableCell>
                    <TableCell
                      className={
                        record.dailyReturnPercent >= 0 ? 'text-success' : 'text-destructive'
                      }
                    >
                      {formatPercent(record.dailyReturnPercent)}
                    </TableCell>
                    <TableCell
                      className={
                        record.dailyProfit >= 0 ? 'text-success' : 'text-destructive'
                      }
                    >
                      {formatCurrency(record.dailyProfit)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatShareValue(record.shareValue)}
                    </TableCell>
                    <TableCell className="max-w-32 truncate text-muted-foreground">
                      {record.notes ?? '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deletePerformance.mutate(record.id)}
                        disabled={deletePerformance.isPending}
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
