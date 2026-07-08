import { Select } from '@/components/ui/select'
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
}

const selectClass =
  'h-8 w-auto min-w-0 shrink-0 bg-background px-2 text-sm shadow-none'

export function CashPeriodFilters({
  year,
  month,
  cashAccountId,
  accounts,
  years,
  onYearChange,
  onMonthChange,
  onAccountChange,
}: CashPeriodFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 p-2">
      <Select
        aria-label="Mes"
        value={String(month)}
        onChange={(e) => onMonthChange(Number(e.target.value))}
        className={`${selectClass} w-[7.5rem]`}
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
        className={`${selectClass} w-[5.5rem]`}
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
        className={`${selectClass} w-[8.5rem] sm:w-[10rem]`}
      >
        <option value="">Todas</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </Select>
    </div>
  )
}
