import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, PiggyBank, Wallet } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrencyFor } from '@/utils/format'
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
  const [open, setOpen] = useState(true)

  if (items.length === 0) return null

  return (
    <section className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-1 border-b border-border/60 bg-muted/20 px-2 py-1 sm:px-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex min-h-10 flex-1 cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted/60"
        >
          <Wallet className="h-4 w-4 shrink-0 text-primary" />
          <span className="text-sm font-semibold tracking-tight">Mis cuentas</span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium tabular-nums text-primary">
            {items.length}
          </span>
          <ChevronDown
            className={cn(
              'ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
              open ? 'rotate-0' : '-rotate-90',
            )}
          />
        </button>
        <Link
          to={ROUTES.CASH_ACCOUNTS}
          className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
          onClick={(e) => e.stopPropagation()}
        >
          Gestionar
        </Link>
      </div>

      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div className="grid gap-2 p-2.5 sm:grid-cols-2 sm:p-3 lg:grid-cols-3 xl:grid-cols-4">
            {items.map(({ account, balance, loading }) => (
              <div
                key={account.id}
                className="group flex items-center gap-2.5 rounded-lg border border-border/70 bg-background px-2.5 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-px hover:border-primary/25 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/10">
                  <PiggyBank className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-xs font-medium leading-tight text-foreground">
                      {account.name}
                    </p>
                    <span className="shrink-0 rounded bg-muted px-1 py-px text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {account.currency}
                    </span>
                  </div>
                  {loading ? (
                    <Skeleton className="mt-1 h-4 w-20" />
                  ) : (
                    <p
                      className={cn(
                        'mt-0.5 truncate text-sm font-semibold tabular-nums leading-tight',
                        balance >= 0 ? 'text-foreground' : 'text-destructive',
                      )}
                    >
                      {formatCurrencyFor(balance, account.currency)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
