import { useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { getCategories, getSubcategories } from '@/utils/cashCategories'
import type { CashTransactionType, Category } from '@/types/cash'

export interface TransactionFilters {
  cashAccountId: string
  parentCategoryId: string
  subcategoryId: string
  type: '' | CashTransactionType
  startDate: string
  endDate: string
}

interface CashTransactionFiltersProps {
  filters: TransactionFilters
  accounts: { id: string; name: string }[]
  categories: Category[]
  onChange: (patch: Partial<TransactionFilters>) => void
}

const selectClass =
  'h-10 w-full min-w-0 shrink-0 bg-background px-2 text-base shadow-none md:h-8 md:w-auto md:text-sm'

const dateClass =
  'h-10 w-full shrink-0 px-2 text-base shadow-none md:h-8 md:w-[8.5rem] md:text-sm'

export function CashTransactionFilters({
  filters,
  accounts,
  categories,
  onChange,
}: CashTransactionFiltersProps) {
  const parentCategories = useMemo(() => {
    if (!filters.type) {
      return getCategories(categories).sort((a, b) => a.name.localeCompare(b.name))
    }
    return getCategories(categories, filters.type)
  }, [categories, filters.type])

  const subcategories = useMemo(
    () =>
      filters.parentCategoryId
        ? getSubcategories(categories, filters.parentCategoryId)
        : [],
    [categories, filters.parentCategoryId],
  )

  const handleTypeChange = (type: TransactionFilters['type']) => {
    onChange({ type, parentCategoryId: '', subcategoryId: '' })
  }

  const handleParentChange = (parentCategoryId: string) => {
    onChange({ parentCategoryId, subcategoryId: '' })
  }

  return (
    <div className="rounded-lg border bg-muted/40 p-2">
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
      <Select
        aria-label="Cuenta"
        value={filters.cashAccountId}
        onChange={(e) => onChange({ cashAccountId: e.target.value })}
        className={`${selectClass} sm:w-[8.5rem] md:w-[10rem]`}
      >
        <option value="">Todas las cuentas</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </Select>

      <Select
        aria-label="Tipo"
        value={filters.type}
        onChange={(e) => handleTypeChange(e.target.value as TransactionFilters['type'])}
        className={`${selectClass} sm:w-[6.5rem]`}
      >
        <option value="">Todos</option>
        <option value="INCOME">Ingreso</option>
        <option value="EXPENSE">Gasto</option>
      </Select>

      <Select
        aria-label="Categoría"
        value={filters.parentCategoryId}
        onChange={(e) => handleParentChange(e.target.value)}
        className={`${selectClass} sm:w-[8rem] md:w-[9.5rem]`}
      >
        <option value="">Todas</option>
        {parentCategories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>

      {filters.parentCategoryId && subcategories.length > 0 && (
        <Select
          aria-label="Subcategoría"
          value={filters.subcategoryId}
          onChange={(e) => onChange({ subcategoryId: e.target.value })}
          className={`${selectClass} sm:w-[8rem] md:w-[9.5rem]`}
        >
          <option value="">Todas</option>
          {subcategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      )}

      <Input
        aria-label="Desde"
        type="date"
        value={filters.startDate}
        onChange={(e) => onChange({ startDate: e.target.value })}
        className={`${dateClass} col-span-1`}
      />
      <Input
        aria-label="Hasta"
        type="date"
        value={filters.endDate}
        onChange={(e) => onChange({ endDate: e.target.value })}
        className={`${dateClass} col-span-1`}
      />
      </div>
    </div>
  )
}

export function resolveFilterCategoryId(filters: TransactionFilters): string | undefined {
  const id = filters.subcategoryId || filters.parentCategoryId
  return id || undefined
}
