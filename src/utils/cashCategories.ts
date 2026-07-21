import type { Category, CashTransactionType } from '@/types/cash'

export function getCategories(
  categories: Category[],
  type?: CashTransactionType,
): Category[] {
  return categories.filter(
    (c) => c.parentId === null && (type === undefined || c.type === type),
  )
}

export function getSubcategories(
  categories: Category[],
  categoryId: string,
): Category[] {
  return categories
    .filter((c) => c.parentId === categoryId)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function splitCategorySelection(
  categoryId: string,
  categories: Category[],
): { parentCategoryId: string; subcategoryId: string } {
  const category = categories.find((c) => c.id === categoryId)
  if (!category) return { parentCategoryId: '', subcategoryId: '' }
  if (category.parentId) {
    return { parentCategoryId: category.parentId, subcategoryId: category.id }
  }
  return { parentCategoryId: category.id, subcategoryId: '' }
}

export function resolveTransactionCategoryId(
  parentCategoryId: string,
  subcategoryId: string,
): string {
  return subcategoryId || parentCategoryId
}

export function isCategorySelectionValid(
  categories: Category[],
  parentCategoryId: string,
  subcategoryId: string,
): boolean {
  if (!parentCategoryId) return false
  const subcategories = getSubcategories(categories, parentCategoryId)
  if (subcategories.length === 0) return true
  return subcategoryId !== '' && subcategories.some((c) => c.id === subcategoryId)
}

export function formatCategoryLabel(
  category: Category,
  categories: Category[],
): string {
  if (!category.parentId) return category.name
  const parent = categories.find((c) => c.id === category.parentId)
  return parent ? `${parent.name} / ${category.name}` : category.name
}

/** Label para selects de gasto relacionado (reintegros). */
export function formatRelatedExpenseOption(
  tx: {
    date: string
    amount: number
    description: string | null
    categoryId: string
  },
  categories: Category[],
  formatDate: (date: string) => string,
  formatCurrency: (amount: number) => string,
): string {
  const category = categories.find((c) => c.id === tx.categoryId)
  // Si es subcategoría, mostrar solo la subcategoría; si no, la categoría raíz.
  const categoryLabel = category?.name ?? 'Sin categoría'
  const parts = [formatDate(tx.date), formatCurrency(tx.amount), categoryLabel]
  const description = tx.description?.trim()
  if (description) parts.push(description)
  return parts.join(' · ')
}

export function buildCategoryOptions(
  categories: Category[],
  type: CashTransactionType,
): { id: string; label: string; group: 'category' | 'subcategory' }[] {
  const ofType = categories.filter((c) => c.type === type)
  const roots = ofType
    .filter((c) => c.parentId === null)
    .sort((a, b) => a.name.localeCompare(b.name))
  const options: { id: string; label: string; group: 'category' | 'subcategory' }[] = []

  for (const root of roots) {
    options.push({ id: root.id, label: root.name, group: 'category' })
    const children = ofType
      .filter((c) => c.parentId === root.id)
      .sort((a, b) => a.name.localeCompare(b.name))
    for (const child of children) {
      options.push({
        id: child.id,
        label: `${root.name} / ${child.name}`,
        group: 'subcategory',
      })
    }
  }

  return options
}
