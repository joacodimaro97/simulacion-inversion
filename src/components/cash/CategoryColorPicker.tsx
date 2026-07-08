import { Plus } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { cn } from '@/utils/cn'

export const DEFAULT_CATEGORY_COLOR = '#f97316'

export const PRESET_CATEGORY_COLORS = [
  '#f97316',
  '#ef4444',
  '#ec4899',
  '#a855f7',
  '#6366f1',
  '#3b82f6',
  '#06b6d4',
  '#14b8a6',
  '#22c55e',
  '#84cc16',
  '#eab308',
  '#64748b',
] as const

interface CategoryColorPickerProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function normalizeCategoryColor(color: string | null | undefined): string {
  const fallback = DEFAULT_CATEGORY_COLOR
  if (!color) return fallback

  const trimmed = color.trim()
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) return trimmed.toLowerCase()
  if (/^#[0-9A-Fa-f]{3}$/.test(trimmed)) return trimmed.toLowerCase()
  if (/^[0-9A-Fa-f]{6}$/.test(trimmed)) return `#${trimmed.toLowerCase()}`
  if (/^[0-9A-Fa-f]{3}$/.test(trimmed)) return `#${trimmed.toLowerCase()}`

  return fallback
}

export function CategoryColorPicker({
  value,
  onChange,
  className,
}: CategoryColorPickerProps) {
  const color = normalizeCategoryColor(value)
  const isPreset = PRESET_CATEGORY_COLORS.some(
    (preset) => preset.toLowerCase() === color.toLowerCase(),
  )

  return (
    <div className={cn('space-y-2', className)}>
      <Label>Color</Label>
      <div className="flex flex-wrap items-center gap-1.5">
        {PRESET_CATEGORY_COLORS.map((preset) => {
          const selected = preset.toLowerCase() === color.toLowerCase()
          return (
            <button
              key={preset}
              type="button"
              onClick={() => onChange(preset)}
              className={cn(
                'h-8 w-8 cursor-pointer rounded-full border-2 transition-transform hover:scale-105',
                selected
                  ? 'border-foreground ring-2 ring-ring ring-offset-2 ring-offset-background'
                  : 'border-white shadow-sm',
              )}
              style={{ backgroundColor: preset }}
              title={preset}
              aria-label={`Color ${preset}`}
              aria-pressed={selected}
            />
          )
        })}

        <label
          className={cn(
            'relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-dashed transition-colors hover:bg-muted',
            !isPreset
              ? 'border-foreground ring-2 ring-ring ring-offset-2 ring-offset-background'
              : 'border-muted-foreground/40 text-muted-foreground',
          )}
          title="Elegir otro color"
        >
          {!isPreset ? (
            <span
              className="h-full w-full rounded-full border border-white shadow-sm"
              style={{ backgroundColor: color }}
            />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          <input
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="sr-only"
            aria-label="Color personalizado"
          />
        </label>
      </div>
    </div>
  )
}
