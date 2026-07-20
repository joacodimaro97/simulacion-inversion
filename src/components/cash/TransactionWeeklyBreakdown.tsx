import { ArrowDown, ArrowUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utils/cn'
import { formatCurrency } from '@/utils/format'
import type { CashTransactionStats } from '@/types/cash'

interface TransactionWeeklyBreakdownProps {
  stats: CashTransactionStats
  className?: string
}

export function TransactionWeeklyBreakdown({
  stats,
  className,
}: TransactionWeeklyBreakdownProps) {
  const weeks = stats.byWeek ?? []
  if (weeks.length === 0) return null

  const maxAverage = Math.max(...weeks.map((w) => w.averageDailyExpense), 0)
  const highestStart = stats.highestExpenseWeek?.weekStart
  const lowestStart = stats.lowestExpenseWeek?.weekStart

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium">Gasto por semana</p>
          <p className="text-xs text-muted-foreground">
            Semanas de lunes a domingo · promedio diario para comparar parciales
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {stats.highestExpenseWeek && (
            <Badge variant="destructive" className="gap-1 font-normal">
              <ArrowUp className="h-3 w-3" />
              Más gasto:{' '}
              {formatCurrency(stats.highestExpenseWeek.averageDailyExpense)}
              /día
            </Badge>
          )}
          {stats.lowestExpenseWeek && (
            <Badge variant="success" className="gap-1 font-normal">
              <ArrowDown className="h-3 w-3" />
              Menos gasto:{' '}
              {formatCurrency(stats.lowestExpenseWeek.averageDailyExpense)}
              /día
            </Badge>
          )}
        </div>
      </div>

      <ul className="space-y-2">
        {weeks.map((week) => {
          const isHighest = week.weekStart === highestStart
          const isLowest = week.weekStart === lowestStart && !isHighest
          const widthPct =
            maxAverage > 0 ? Math.max((week.averageDailyExpense / maxAverage) * 100, 4) : 4

          return (
            <li key={week.weekStart} className="space-y-1">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                  <span className="font-medium capitalize">{week.label}</span>
                  {week.partial && (
                    <Badge variant="outline" className="text-[10px] font-normal">
                      Parcial · {week.dayCount}d
                    </Badge>
                  )}
                  {isHighest && (
                    <Badge variant="destructive" className="text-[10px] font-normal">
                      Más
                    </Badge>
                  )}
                  {isLowest && (
                    <Badge variant="success" className="text-[10px] font-normal">
                      Menos
                    </Badge>
                  )}
                </div>
                <div className="shrink-0 text-right text-xs text-muted-foreground sm:text-sm">
                  <span
                    className={cn(
                      'font-semibold tabular-nums',
                      isHighest && 'text-destructive',
                      isLowest && 'text-success',
                      !isHighest && !isLowest && 'text-foreground',
                    )}
                  >
                    {formatCurrency(week.totalExpense)}
                  </span>
                  <span className="ml-1.5">
                    · {formatCurrency(week.averageDailyExpense)}/día
                  </span>
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    isHighest && 'bg-destructive/80',
                    isLowest && 'bg-success/80',
                    !isHighest && !isLowest && 'bg-primary/70',
                  )}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
