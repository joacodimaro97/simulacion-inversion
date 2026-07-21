import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { formatRelatedExpenseOption } from '@/utils/cashCategories'
import { formatCurrency, formatDate } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { CashTransaction, Category } from '@/types/cash'

interface ReimbursementFieldsProps {
  checked: boolean
  relatedExpenseId: string
  expenseTransactions: CashTransaction[]
  categories: Category[]
  onCheckedChange: (checked: boolean) => void
  onRelatedExpenseChange: (id: string) => void
  excludeTransactionId?: string
  className?: string
}

export function ReimbursementFields({
  checked,
  relatedExpenseId,
  expenseTransactions,
  categories,
  onCheckedChange,
  onRelatedExpenseChange,
  excludeTransactionId,
  className,
}: ReimbursementFieldsProps) {
  const options = expenseTransactions.filter(
    (tx) => !excludeTransactionId || tx.id !== excludeTransactionId,
  )

  return (
    <div
      className={cn(
        'space-y-3 rounded-lg border border-dashed bg-muted/40 p-3 sm:p-4',
        className,
      )}
    >
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 shrink-0 rounded border-input"
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
        />
        <span className="min-w-0 space-y-0.5">
          <span className="block text-sm font-medium text-foreground">
            Es reintegro de un gasto
          </span>
          <span className="block text-xs text-muted-foreground">
            Vinculalo a un gasto previo para reflejar gastos netos en el resumen.
          </span>
        </span>
      </label>

      {checked && (
        <div className="space-y-2 pl-7">
          <Label>Gasto relacionado</Label>
          <Select
            value={relatedExpenseId}
            onChange={(e) => onRelatedExpenseChange(e.target.value)}
            required
          >
            <option value="">Seleccionar gasto…</option>
            {options.map((tx) => (
              <option key={tx.id} value={tx.id}>
                {formatRelatedExpenseOption(tx, categories, formatDate, formatCurrency)}
              </option>
            ))}
          </Select>
          {options.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No hay gastos disponibles para vincular.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
