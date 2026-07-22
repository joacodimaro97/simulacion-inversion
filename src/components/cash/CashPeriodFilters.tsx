import { Select } from '@/components/ui/select'
import { cn } from '@/utils/cn'
import type { CashAccount } from '@/types/cash'

const MONTHS = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
]

interface CashPeriodFiltersProps {
  year: number
  month: number
  cashAccountId: string
  accounts: CashAccount[]
  years: number[]
  onYearChange: (year: number) => void
  onMonthChange: (month: number) => void
  onAccountChange: (accountId: string) => void
  className?: string
}

const selectClass =
  'h-10 w-full min-w-0 shrink-0 bg-background px-2 text-base shadow-none md:h-8 md:w-auto md:text-sm'

export function CashPeriodFilters({
  year,
  month,
  cashAccountId,
  accounts,
  years,
  onYearChange,
  onMonthChange,
  onAccountChange,
  className,
}: CashPeriodFiltersProps) {
  return (
    <div className={cn('rounded-lg border bg-muted/40 p-2', className)}>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
        <Select
          aria-label="Mes"
          value={String(month)}
          onChange={(e) => onMonthChange(Number(e.target.value))}
          className={`${selectClass} sm:w-[7.5rem]`}
        >
          {MONTHS.map((m) => (
            <option key={m.value} value={String(m.value)}>
              {m.label}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Año"
          value={String(year)}
          onChange={(e) => onYearChange(Number(e.target.value))}
          className={`${selectClass} sm:w-[5.5rem]`}
        >
          {years.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Cuenta"
          value={cashAccountId}
          onChange={(e) => onAccountChange(e.target.value)}
          className={`${selectClass} col-span-2 sm:col-span-1 sm:w-[8.5rem] md:w-[10rem]`}
        >
          <option value="">Todas</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
      </div>
    </div>
  )
}
