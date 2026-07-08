import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import {
  useCashCategories,
  useCreateCashCategory,
  useUpdateCashCategory,
  useDeleteCashCategory,
} from '@/hooks/useCashCategories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/common/EmptyState'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageHeaderSkeleton, TableSkeleton } from '@/components/ui/skeleton'
import { getCategories } from '@/utils/cashCategories'
import { CategoryColorPicker, DEFAULT_CATEGORY_COLOR, normalizeCategoryColor } from '@/components/cash/CategoryColorPicker'
import { CategoryIconPicker } from '@/components/cash/CategoryIconPicker'
import { DynamicIcon } from '@arraypress/lucide-icon-picker'
import { cn } from '@/utils/cn'
import type { CashTransactionType, Category } from '@/types/cash'

type Kind = 'category' | 'subcategory'

interface CategoryForm {
  kind: Kind
  name: string
  type: CashTransactionType
  categoryId: string
  color: string
  icon: string
}

const emptyForm: CategoryForm = {
  kind: 'category',
  name: '',
  type: 'EXPENSE',
  categoryId: '',
  color: DEFAULT_CATEGORY_COLOR,
  icon: '',
}

export function CashCategoriesPage() {
  const [filter, setFilter] = useState<'ALL' | CashTransactionType>('ALL')
  const typeFilter = filter === 'ALL' ? undefined : filter
  const { data: categories = [], isLoading } = useCashCategories(
    typeFilter ? { type: typeFilter } : undefined,
  )
  const createCategory = useCreateCashCategory()
  const updateCategory = useUpdateCashCategory()
  const deleteCategory = useDeleteCashCategory()
  const [editing, setEditing] = useState<Category | null>(null)
  const [mobileFormOpen, setMobileFormOpen] = useState(false)

  const { register, handleSubmit, reset, setValue, watch } = useForm<CategoryForm>({
    defaultValues: emptyForm,
  })

  const formType = watch('type')
  const formKind = watch('kind')
  const formColor = watch('color')
  const formIcon = watch('icon')
  const categoryOptions = useMemo(
    () => getCategories(categories, formType),
    [categories, formType],
  )

  const displayRows = useMemo(() => {
    const roots = categories
      .filter((c) => c.parentId === null)
      .sort((a, b) => a.name.localeCompare(b.name))

    const rows: { item: Category; kind: Kind; categoryName?: string }[] = []
    for (const root of roots) {
      rows.push({ item: root, kind: 'category' })
      const children = categories
        .filter((c) => c.parentId === root.id)
        .sort((a, b) => a.name.localeCompare(b.name))
      for (const child of children) {
        rows.push({ item: child, kind: 'subcategory', categoryName: root.name })
      }
    }
    return rows
  }, [categories])

  const startEdit = (category: Category) => {
    setMobileFormOpen(true)
    setEditing(category)
    reset({
      kind: category.parentId ? 'subcategory' : 'category',
      name: category.name,
      type: category.type,
      categoryId: category.parentId ?? '',
      color: normalizeCategoryColor(category.color),
      icon: category.icon ?? '',
    })
  }

  const cancelEdit = () => {
    setEditing(null)
    setMobileFormOpen(false)
    reset(emptyForm)
  }

  const onSubmit = async (data: CategoryForm) => {
    const parentId = data.kind === 'subcategory' ? data.categoryId || null : null

    if (data.kind === 'subcategory' && !parentId) return

    if (editing) {
      await updateCategory.mutateAsync({
        id: editing.id,
        input: {
          name: data.name,
          type: data.type,
          parentId,
          color: data.color || null,
          icon: data.icon || null,
        },
      })
      cancelEdit()
      return
    }

    await createCategory.mutateAsync({
      name: data.name,
      type: data.type,
      parentId,
      color: data.color || undefined,
      icon: data.icon || undefined,
    })
    reset({ ...emptyForm, type: data.type, kind: data.kind })
    setMobileFormOpen(false)
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeaderSkeleton />
        <TableSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in md:space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Categorías</h1>
          <p className="text-sm text-muted-foreground">
            Creá categorías y, si querés, subcategorías dentro de ellas
          </p>
        </div>
        {!editing && !mobileFormOpen && (
          <Button
            className="md:hidden"
            onClick={() => {
              setMobileFormOpen(true)
              requestAnimationFrame(() => {
                document.getElementById('category-form')?.scrollIntoView({ behavior: 'smooth' })
              })
            }}
          >
            <Plus className="h-4 w-4" />
            Nueva categoría
          </Button>
        )}
      </div>

      <Card
        id="category-form"
        className={cn(!editing && !mobileFormOpen && 'hidden md:block')}
      >
        <CardHeader>
          <CardTitle className="text-base">
            {editing
              ? formKind === 'subcategory'
                ? 'Editar subcategoría'
                : 'Editar categoría'
              : formKind === 'subcategory'
                ? 'Nueva subcategoría'
                : 'Nueva categoría'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Qué querés crear</Label>
                <Select
                  value={formKind}
                  onChange={(e) => {
                    const kind = e.target.value as Kind
                    setValue('kind', kind)
                    if (kind === 'category') setValue('categoryId', '')
                  }}
                >
                  <option value="category">Categoría</option>
                  <option value="subcategory">Subcategoría</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={formType}
                  onChange={(e) => {
                    setValue('type', e.target.value as CashTransactionType)
                    setValue('categoryId', '')
                  }}
                >
                  <option value="EXPENSE">Gasto</option>
                  <option value="INCOME">Ingreso</option>
                </Select>
              </div>

              {formKind === 'subcategory' && (
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select {...register('categoryId', { required: true })}>
                    <option value="">Elegí una categoría</option>
                    {categoryOptions
                      .filter((c) => c.id !== editing?.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>
                  {formKind === 'subcategory' ? 'Nombre de la subcategoría' : 'Nombre de la categoría'}
                </Label>
                <Input
                  {...register('name', { required: true })}
                  placeholder={formKind === 'subcategory' ? 'Verdulería' : 'Alimentación'}
                />
              </div>

              <CategoryColorPicker
                value={formColor}
                onChange={(color) => setValue('color', color)}
              />
              <CategoryIconPicker
                value={formIcon}
                onChange={(icon) => setValue('icon', icon)}
                color={formColor}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={createCategory.isPending || updateCategory.isPending}
              >
                <Plus className="h-4 w-4" />
                {editing ? 'Guardar cambios' : formKind === 'subcategory' ? 'Crear subcategoría' : 'Crear categoría'}
              </Button>
              {editing && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancelar
                </Button>
              )}
              {!editing && mobileFormOpen && (
                <Button
                  type="button"
                  variant="outline"
                  className="md:hidden"
                  onClick={() => setMobileFormOpen(false)}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList className="w-full overflow-x-auto">
          <TabsTrigger value="ALL">Todas</TabsTrigger>
          <TabsTrigger value="INCOME">Ingresos</TabsTrigger>
          <TabsTrigger value="EXPENSE">Gastos</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Listado ({categories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {displayRows.length === 0 ? (
            <EmptyState message="No hay categorías. Creá la primera arriba." />
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {displayRows.map(({ item, kind, categoryName }) => (
                  <div
                    key={item.id}
                    className="rounded-lg border bg-card p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-start gap-2">
                        {item.icon ? (
                          <DynamicIcon
                            name={item.icon}
                            className="mt-0.5 h-4 w-4 shrink-0"
                            style={item.color ? { color: item.color } : undefined}
                          />
                        ) : item.color ? (
                          <span
                            className="mt-1 inline-block h-4 w-4 shrink-0 rounded-full border"
                            style={{ backgroundColor: item.color }}
                          />
                        ) : null}
                        <div className="min-w-0">
                          <p className={cn('font-medium', kind === 'subcategory' && 'text-muted-foreground')}>
                            {kind === 'subcategory' && <span className="mr-1">·</span>}
                            {item.name}
                          </p>
                          {kind === 'subcategory' && categoryName && (
                            <p className="text-xs text-muted-foreground">{categoryName}</p>
                          )}
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            <Badge variant={kind === 'category' ? 'default' : 'secondary'} className="text-[10px]">
                              {kind === 'category' ? 'Categoría' : 'Subcategoría'}
                            </Badge>
                            <Badge
                              variant={item.type === 'INCOME' ? 'success' : 'destructive'}
                              className="text-[10px]"
                            >
                              {item.type === 'INCOME' ? 'Ingreso' : 'Gasto'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2 border-t pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        className="flex-1"
                        onClick={() => startEdit(item)}
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        className="flex-1 text-destructive hover:text-destructive"
                        onClick={() => deleteCategory.mutate(item.id)}
                        disabled={deleteCategory.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            <Table className="hidden md:table">
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo de ítem</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Ícono</TableHead>
                  <TableHead>Ingreso/Gasto</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayRows.map(({ item, kind, categoryName }) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {kind === 'subcategory' ? (
                        <span className="pl-4 text-muted-foreground">
                          <span className="mr-2">·</span>
                          {item.name}
                        </span>
                      ) : (
                        item.name
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={kind === 'category' ? 'default' : 'secondary'}>
                        {kind === 'category' ? 'Categoría' : 'Subcategoría'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {kind === 'subcategory' ? categoryName : '—'}
                    </TableCell>
                    <TableCell>
                      {item.icon ? (
                        <DynamicIcon
                          name={item.icon}
                          className="h-4 w-4"
                          style={item.color ? { color: item.color } : undefined}
                        />
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={item.type === 'INCOME' ? 'success' : 'destructive'}
                      >
                        {item.type === 'INCOME' ? 'Ingreso' : 'Gasto'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.color ? (
                        <span
                          className="inline-block h-5 w-5 rounded-full border"
                          style={{ backgroundColor: item.color }}
                          title={item.color}
                        />
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          onClick={() => startEdit(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          onClick={() => deleteCategory.mutate(item.id)}
                          disabled={deleteCategory.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
