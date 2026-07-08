import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import {
  useCashAccounts,
  useCreateCashAccount,
  useUpdateCashAccount,
  useDeleteCashAccount,
} from '@/hooks/useCashAccounts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { formatCurrency } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { CashAccount } from '@/types/cash'

interface AccountForm {
  name: string
  description: string
  currency: string
  openingBalance: string
}

const emptyForm: AccountForm = {
  name: '',
  description: '',
  currency: 'ARS',
  openingBalance: '0',
}

export function CashAccountsPage() {
  const { data: accounts = [], isLoading } = useCashAccounts()
  const createAccount = useCreateCashAccount()
  const updateAccount = useUpdateCashAccount()
  const deleteAccount = useDeleteCashAccount()
  const [editing, setEditing] = useState<CashAccount | null>(null)
  const [mobileFormOpen, setMobileFormOpen] = useState(false)

  const { register, handleSubmit, reset } = useForm<AccountForm>({
    defaultValues: emptyForm,
  })

  const startEdit = (account: CashAccount) => {
    setMobileFormOpen(true)
    setEditing(account)
    reset({
      name: account.name,
      description: account.description ?? '',
      currency: account.currency,
      openingBalance: String(account.openingBalance ?? 0),
    })
  }

  const cancelEdit = () => {
    setEditing(null)
    setMobileFormOpen(false)
    reset(emptyForm)
  }

  const parseOpeningBalance = (value: string): number => {
    const parsed = Number(value)
    if (Number.isNaN(parsed) || parsed < 0) return 0
    return parsed
  }

  const onSubmit = async (data: AccountForm) => {
    const openingBalance = parseOpeningBalance(data.openingBalance)

    if (editing) {
      await updateAccount.mutateAsync({
        id: editing.id,
        input: {
          name: data.name,
          description: data.description || null,
          currency: data.currency || undefined,
          openingBalance,
        },
      })
      cancelEdit()
      return
    }

    await createAccount.mutateAsync({
      name: data.name,
      description: data.description || undefined,
      currency: data.currency || undefined,
      openingBalance,
    })
    reset(emptyForm)
    setMobileFormOpen(false)
  }

  if (isLoading) {
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
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Cuentas de efectivo</h1>
          <p className="text-sm text-muted-foreground">Cajas y cuentas para gastos e ingresos</p>
        </div>
        {!editing && !mobileFormOpen && (
          <Button
            className="md:hidden"
            onClick={() => {
              setMobileFormOpen(true)
              requestAnimationFrame(() => {
                document.getElementById('account-form')?.scrollIntoView({ behavior: 'smooth' })
              })
            }}
          >
            <Plus className="h-4 w-4" />
            Nueva cuenta
          </Button>
        )}
      </div>

      <Card
        id="account-form"
        className={cn(!editing && !mobileFormOpen && 'hidden md:block')}
      >
        <CardHeader>
          <CardTitle className="text-base">
            {editing ? 'Editar cuenta' : 'Nueva cuenta'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input {...register('name', { required: true })} placeholder="Caja de ahorro" />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input {...register('description')} placeholder="Opcional" />
              </div>
              <div className="space-y-2">
                <Label>Moneda</Label>
                <Input {...register('currency')} placeholder="ARS" maxLength={3} />
              </div>
              <div className="space-y-2">
                <Label>Saldo inicial</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('openingBalance', {
                    required: true,
                    min: 0,
                  })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={createAccount.isPending || updateAccount.isPending}
              >
                <Plus className="h-4 w-4" />
                {editing ? 'Guardar cambios' : 'Crear cuenta'}
              </Button>
              {editing && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancelar
                </Button>
              )}
              {!editing && mobileFormOpen && (
                <Button
                  type="button"
                  variant="outline"
                  className="md:hidden"
                  onClick={() => setMobileFormOpen(false)}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cuentas ({accounts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <EmptyState message="No hay cuentas. Creá la primera arriba." />
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {accounts.map((account) => (
                  <div key={account.id} className="rounded-lg border bg-card p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium">{account.name}</p>
                        {account.description && (
                          <p className="mt-0.5 text-xs text-muted-foreground">{account.description}</p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">{account.currency}</p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold">
                        {formatCurrency(account.openingBalance ?? 0)}
                      </p>
                    </div>
                    <div className="mt-3 flex gap-2 border-t pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        className="flex-1"
                        onClick={() => startEdit(account)}
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        className="flex-1 text-destructive hover:text-destructive"
                        onClick={() => deleteAccount.mutate(account.id)}
                        disabled={deleteAccount.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            <Table className="hidden md:table">
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Moneda</TableHead>
                  <TableHead>Saldo inicial</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {account.description || '-'}
                    </TableCell>
                    <TableCell>{account.currency}</TableCell>
                    <TableCell>{formatCurrency(account.openingBalance ?? 0)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          onClick={() => startEdit(account)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          onClick={() => deleteAccount.mutate(account.id)}
                          disabled={deleteAccount.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
