import { useMemo, useState } from 'react'
import { Plus, Target } from 'lucide-react'
import { useCashBudgets } from '@/hooks/useCashBudgets'
import { BudgetCard } from '@/components/cash/BudgetCard'
import { BudgetModal } from '@/components/cash/BudgetModal'
import { BudgetDetailModal } from '@/components/cash/BudgetDetailModal'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeaderSkeleton, Skeleton } from '@/components/ui/skeleton'
import { getBudgetKind } from '@/utils/budgets'
import type { Budget } from '@/types/cash'

type Filter = 'ALL' | 'account' | 'category'

export function CashBudgetsPage() {
  const { data: budgets = [], isLoading, isFetching } = useCashBudgets()
  const [filter, setFilter] = useState<Filter>('ALL')

  const [modalOpen, setModalOpen] = useState(false)
  const [modalBudget, setModalBudget] = useState<Budget | null>(null)
  const [detailBudget, setDetailBudget] = useState<Budget | null>(null)

  const openCreate = () => {
    setModalBudget(null)
    setModalOpen(true)
  }

  const openEdit = (budget: Budget) => {
    setDetailBudget(null)
    setModalBudget(budget)
    setModalOpen(true)
  }

  const filtered = useMemo(() => {
    if (filter === 'ALL') return budgets
    return budgets.filter((b) => getBudgetKind(b) === filter)
  }, [budgets, filter])

  const accountCount = budgets.filter((b) => getBudgetKind(b) === 'account').length
  const categoryCount = budgets.filter((b) => getBudgetKind(b) === 'category').length

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeaderSkeleton />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in md:space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Presupuestos</h1>
          <p className="text-sm text-muted-foreground">
            Por cuenta o por categoría. Solo visual: no descuenta ni bloquea tu saldo.
            {isFetching && !isLoading ? (
              <span className="ml-1 text-xs">· Actualizando…</span>
            ) : null}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nuevo presupuesto
        </Button>
      </div>

      <BudgetModal
        open={modalOpen}
        budget={modalBudget}
        onClose={() => setModalOpen(false)}
      />
      <BudgetDetailModal
        open={Boolean(detailBudget)}
        budget={detailBudget}
        onClose={() => setDetailBudget(null)}
        onEdit={openEdit}
      />

      {budgets.length === 0 ? (
        <EmptyState
          message="Creá un presupuesto por categoría, ej. $80.000 en Alimentación este mes"
          action={
            <Button variant="outline" onClick={openCreate}>
              <Target className="h-4 w-4" />
              Creá tu primer presupuesto
            </Button>
          }
        />
      ) : (
        <>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
            <TabsList className="w-full overflow-x-auto sm:w-auto">
              <TabsTrigger value="ALL">Todos ({budgets.length})</TabsTrigger>
              <TabsTrigger value="category">Por categoría ({categoryCount})</TabsTrigger>
              <TabsTrigger value="account">Por cuenta ({accountCount})</TabsTrigger>
            </TabsList>
          </Tabs>

          {filtered.length === 0 ? (
            <EmptyState
              message={
                filter === 'category'
                  ? 'No hay presupuestos por categoría. Creá uno, por ejemplo $80.000 en Alimentación.'
                  : 'No hay presupuestos por cuenta en este filtro.'
              }
              action={
                <Button variant="outline" onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  Nuevo presupuesto
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((budget) => (
                <BudgetCard
                  key={budget.id}
                  budget={budget}
                  onViewDetail={setDetailBudget}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
