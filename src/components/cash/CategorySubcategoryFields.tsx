import { useEffect, useMemo } from 'react'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { getCategories, getSubcategories } from '@/utils/cashCategories'
import type { CashTransactionType, Category } from '@/types/cash'

interface CategorySubcategoryFieldsProps {
  categories: Category[]
  type: CashTransactionType
  parentCategoryId: string
  subcategoryId: string
  onParentChange: (parentId: string) => void
  onSubcategoryChange: (subcategoryId: string) => void
  disabled?: boolean
}

export function CategorySubcategoryFields({
  categories,
  type,
  parentCategoryId,
  subcategoryId,
  onParentChange,
  onSubcategoryChange,
  disabled,
}: CategorySubcategoryFieldsProps) {
  const parentCategories = useMemo(
    () => getCategories(categories, type),
    [categories, type],
  )

  const subcategories = useMemo(
    () => (parentCategoryId ? getSubcategories(categories, parentCategoryId) : []),
    [categories, parentCategoryId],
  )

  const hasSubcategories = subcategories.length > 0

  useEffect(() => {
    const parentValid = parentCategories.some((c) => c.id === parentCategoryId)
    if (!parentValid) {
      const first = parentCategories[0]?.id ?? ''
      if (first !== parentCategoryId) onParentChange(first)
      if (subcategoryId) onSubcategoryChange('')
      return
    }

    if (!hasSubcategories) {
      if (subcategoryId) onSubcategoryChange('')
      return
    }

    const subValid = subcategories.some((c) => c.id === subcategoryId)
    if (!subValid) {
      onSubcategoryChange(subcategories[0]!.id)
    }
    // Callbacks omitted intentionally — only sync when selection data changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentCategories, parentCategoryId, subcategories, subcategoryId, hasSubcategories])

  const handleParentChange = (nextParentId: string) => {
    onParentChange(nextParentId)
    onSubcategoryChange('')
  }

  if (parentCategories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay categorías para este tipo. Creá una en Categorías.
      </p>
    )
  }

  return (
    <>
      <div className="space-y-2">
        <Label>Categoría</Label>
        <Select
          value={parentCategoryId}
          onChange={(e) => handleParentChange(e.target.value)}
          disabled={disabled}
          required
        >
          {parentCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      {hasSubcategories && (
        <div className="space-y-2">
          <Label>Subcategoría</Label>
          <Select
            value={subcategoryId}
            onChange={(e) => onSubcategoryChange(e.target.value)}
            disabled={disabled}
            required
          >
            {subcategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      )}
    </>
  )
}
