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
  return categories.filter((c) => c.parentId === categoryId)
}

export function formatCategoryLabel(
  category: Category,
  categories: Category[],
): string {
  if (!category.parentId) return category.name
  const parent = categories.find((c) => c.id === category.parentId)
  return parent ? `${parent.name} / ${category.name}` : category.name
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
