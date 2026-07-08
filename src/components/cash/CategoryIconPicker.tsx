import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import {
  DynamicIcon,
  ICON_CATEGORIES,
  ICONS_BY_CATEGORY,
  searchIcons,
  toSlug,
} from '@arraypress/lucide-icon-picker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog } from '@/components/ui/dialog'
import { cn } from '@/utils/cn'

interface CategoryIconPickerProps {
  value: string
  onChange: (value: string) => void
  color?: string
}

export function CategoryIconPicker({ value, onChange, color }: CategoryIconPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(ICON_CATEGORIES[0] ?? '')

  const selectedSlug = toSlug(value)
  const hasValue = Boolean(selectedSlug)

  const visibleIcons = useMemo(() => {
    const query = search.trim()
    if (query) return searchIcons(query)
    return ICONS_BY_CATEGORY[category] ?? []
  }, [search, category])

  const handleSelect = (slug: string) => {
    onChange(slug)
    setOpen(false)
    setSearch('')
  }

  const handleClear = () => {
    onChange('')
  }

  return (
    <div className="space-y-2">
      <Label>Ícono</Label>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-9 flex-1 justify-center px-3 font-normal"
          onClick={() => setOpen(true)}
          aria-label={hasValue ? `Ícono: ${selectedSlug}` : 'Elegir ícono'}
        >
          {hasValue ? (
            <DynamicIcon
              name={selectedSlug}
              className="h-4 w-4"
              style={color ? { color } : undefined}
            />
          ) : (
            <span className="text-muted-foreground">Elegir ícono</span>
          )}
        </Button>
        {hasValue && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={handleClear}
            aria-label="Quitar ícono"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Dialog
        open={open}
        onClose={() => {
          setOpen(false)
          setSearch('')
        }}
        title="Elegir ícono"
        description="Buscá por nombre o explorá por categoría"
        className="max-w-lg"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar ícono..."
              className="pl-9"
              autoFocus
            />
          </div>

          {!search.trim() && (
            <div className="flex gap-1 overflow-x-auto pb-1">
              {ICON_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    'shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                    category === cat
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground',
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          <div className="max-h-72 overflow-y-auto rounded-lg border bg-muted/20 p-2">
            {visibleIcons.length > 0 ? (
              <div className="grid grid-cols-8 gap-1 sm:grid-cols-9">
                {visibleIcons.map((slug) => {
                  const selected = slug === selectedSlug
                  return (
                    <button
                      key={slug}
                      type="button"
                      title={slug}
                      onClick={() => handleSelect(slug)}
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-md transition-colors',
                        selected
                          ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                      )}
                    >
                      <DynamicIcon
                        name={slug}
                        className="h-4 w-4"
                        style={selected && color ? { color } : undefined}
                      />
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {search.trim()
                  ? `Sin resultados para "${search}"`
                  : 'No hay íconos en esta categoría'}
              </p>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            {search.trim()
              ? `${visibleIcons.length} resultados`
              : `${visibleIcons.length} íconos en ${category}`}
          </p>
        </div>
      </Dialog>
    </div>
  )
}
