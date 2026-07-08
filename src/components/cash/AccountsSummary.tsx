import { Link } from 'react-router-dom'
import { PiggyBank } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/utils/format'
import { ROUTES } from '@/constants'
import { cn } from '@/utils/cn'
import type { CashAccount } from '@/types/cash'

interface AccountBalance {
  account: CashAccount
  balance: number
  loading: boolean
}

interface AccountsSummaryProps {
  items: AccountBalance[]
}

export function AccountsSummary({ items }: AccountsSummaryProps) {
  if (items.length === 0) return null

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Mis cuentas</CardTitle>
        <Link
          to={ROUTES.CASH_ACCOUNTS}
          className="text-xs text-muted-foreground hover:text-primary"
        >
          Gestionar
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ account, balance, loading }) => (
            <div
              key={account.id}
              className="rounded-lg border bg-muted/30 p-4 transition-colors hover:bg-muted/50"
            >
              <div className="mb-2 flex items-center gap-2">
                <div className="rounded-md bg-primary/10 p-2">
                  <PiggyBank className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{account.name}</p>
                  <p className="text-xs text-muted-foreground">{account.currency}</p>
                </div>
              </div>
              {loading ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <p
                  className={cn(
                    'text-xl font-bold',
                    balance >= 0 ? 'text-foreground' : 'text-destructive',
                  )}
                >
                  {formatCurrency(balance)}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
