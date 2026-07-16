import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants'
import { CashBudgetService } from '@/services/CashBudgetService'
import { useToast } from '@/contexts/ToastContext'
import { invalidateCashBudgets } from '@/utils/queryInvalidation'
import type { Budget, CreateBudgetInput, UpdateBudgetInput } from '@/types/cash'

export function useCashBudgets() {
  return useQuery({
    queryKey: queryKeys.cash.budgets,
    queryFn: () => CashBudgetService.getBudgets(),
  })
}

export function useCashBudget(id: string | null, initialData?: Budget) {
  return useQuery({
    queryKey: queryKeys.cash.budget(id ?? ''),
    queryFn: () => CashBudgetService.getBudget(id as string),
    enabled: Boolean(id),
    initialData,
  })
}

export function useCreateCashBudget() {
  const queryClient = useQueryClient()
  const { showError, showToast } = useToast()

  return useMutation({
    mutationFn: (input: CreateBudgetInput) => CashBudgetService.createBudget(input),
    onSuccess: async () => {
      await invalidateCashBudgets(queryClient)
      showToast({ title: 'Presupuesto creado', variant: 'success' })
    },
    onError: showError,
  })
}

export function useUpdateCashBudget() {
  const queryClient = useQueryClient()
  const { showError, showToast } = useToast()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBudgetInput }) =>
      CashBudgetService.updateBudget(id, input),
    onSuccess: async () => {
      await invalidateCashBudgets(queryClient)
      showToast({ title: 'Presupuesto actualizado', variant: 'success' })
    },
    onError: showError,
  })
}

export function useDeleteCashBudget() {
  const queryClient = useQueryClient()
  const { showError, showToast } = useToast()

  return useMutation({
    mutationFn: (id: string) => CashBudgetService.deleteBudget(id),
    onSuccess: async () => {
      await invalidateCashBudgets(queryClient)
      showToast({ title: 'Presupuesto eliminado', variant: 'success' })
    },
    onError: showError,
  })
}
