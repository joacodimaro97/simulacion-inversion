import { useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { getCategories, getSubcategories } from '@/utils/cashCategories'
import { cn } from '@/utils/cn'
import type { CashTransactionQuery, CashTransactionType, Category } from '@/types/cash'

export interface TransactionFilters {
  cashAccountId: string
  parentCategoryId: string
  subcategoryIds: string[]
  type: '' | CashTransactionType
  startDate: string
  endDate: string
  hideSystemMovements: boolean
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
    onChange({ type, parentCategoryId: '', subcategoryIds: [] })
  }

  const handleParentChange = (parentCategoryId: string) => {
    onChange({ parentCategoryId, subcategoryIds: [] })
  }

  const toggleSubcategory = (id: string) => {
    const selected = filters.subcategoryIds.includes(id)
      ? filters.subcategoryIds.filter((x) => x !== id)
      : [...filters.subcategoryIds, id]
    onChange({ subcategoryIds: selected })
  }

  const selectedCount = filters.subcategoryIds.length

  return (
    <div className="space-y-2 rounded-lg border bg-muted/40 p-2">
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

        <label className="col-span-2 flex min-h-10 cursor-pointer items-center gap-2 rounded-md border bg-background px-3 text-sm sm:col-span-1 sm:min-h-8">
          <input
            type="checkbox"
            checked={filters.hideSystemMovements}
            onChange={(e) => onChange({ hideSystemMovements: e.target.checked })}
            className="h-4 w-4 rounded border-input"
          />
          <span className="text-muted-foreground">Ocultar transfer. y fundings</span>
        </label>
      </div>

      {filters.parentCategoryId && subcategories.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 px-0.5">
            <p className="text-xs font-medium text-muted-foreground">
              Subcategorías
              {selectedCount === 0
                ? ' · todas'
                : ` · ${selectedCount} seleccionada${selectedCount === 1 ? '' : 's'}`}
            </p>
            {selectedCount > 0 && (
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => onChange({ subcategoryIds: [] })}
              >
                Limpiar
              </button>
            )}
          </div>
          <div
            role="group"
            aria-label="Subcategorías"
            className="max-h-36 space-y-0.5 overflow-y-auto rounded-md border bg-background p-1.5 sm:max-h-28"
          >
            {subcategories.map((c) => {
              const checked = filters.subcategoryIds.includes(c.id)
              return (
                <label
                  key={c.id}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60',
                    checked && 'bg-muted/40',
                  )}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[var(--primary)]"
                    checked={checked}
                    onChange={() => toggleSubcategory(c.id)}
                  />
                  {c.color ? (
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full border"
                      style={{ backgroundColor: c.color }}
                    />
                  ) : (
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full border bg-muted" />
                  )}
                  <span>{c.name}</span>
                </label>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/** Resuelve categoryId / categoryIds para el query del listado. */
export function resolveFilterCategoryParams(
  filters: TransactionFilters,
): Pick<CashTransactionQuery, 'categoryId' | 'categoryIds'> {
  if (filters.subcategoryIds.length > 0) {
    return { categoryIds: filters.subcategoryIds }
  }
  if (filters.parentCategoryId) {
    return { categoryId: filters.parentCategoryId }
  }
  return {}
}
