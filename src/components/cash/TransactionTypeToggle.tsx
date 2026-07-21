import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { CashTransactionType } from '@/types/cash'

interface TransactionTypeToggleProps {
  value: CashTransactionType
  onChange: (type: CashTransactionType) => void
  className?: string
}

export function TransactionTypeToggle({
  value,
  onChange,
  className,
}: TransactionTypeToggleProps) {
  return (
    <div className={cn('grid grid-cols-2 gap-1 rounded-lg bg-muted p-1', className)}>
      {([
        { type: 'EXPENSE', label: 'Gasto', icon: ArrowUpRight },
        { type: 'INCOME', label: 'Ingreso', icon: ArrowDownLeft },
      ] as const).map(({ type, label, icon: Icon }) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          className={cn(
            'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
            value === type
              ? type === 'EXPENSE'
                ? 'bg-destructive text-destructive-foreground shadow-sm'
                : 'bg-success text-success-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  )
}
