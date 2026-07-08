import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants'
import { CashCategoryService } from '@/services/CashCategoryService'
import { useToast } from '@/contexts/ToastContext'
import type {
  CashTransactionType,
  CategoryQuery,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@/types/cash'

export function useCashCategories(query?: CategoryQuery) {
  return useQuery({
    queryKey: queryKeys.cash.categories(query),
    queryFn: () => CashCategoryService.getCategories(query),
  })
}

export function useCashCategoryTree(type?: CashTransactionType) {
  return useQuery({
    queryKey: queryKeys.cash.categoryTree(type),
    queryFn: () => CashCategoryService.getCategoryTree(type),
  })
}

export function useCreateCashCategory() {
  const queryClient = useQueryClient()
  const { showError, showToast } = useToast()

  return useMutation({
    mutationFn: (input: CreateCategoryInput) => CashCategoryService.createCategory(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cash', 'categories'] })
      showToast({ title: 'Categoría creada', variant: 'success' })
    },
    onError: showError,
  })
}

export function useUpdateCashCategory() {
  const queryClient = useQueryClient()
  const { showError, showToast } = useToast()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCategoryInput }) =>
      CashCategoryService.updateCategory(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cash', 'categories'] })
      showToast({ title: 'Categoría actualizada', variant: 'success' })
    },
    onError: showError,
  })
}

export function useDeleteCashCategory() {
  const queryClient = useQueryClient()
  const { showError, showToast } = useToast()

  return useMutation({
    mutationFn: (id: string) => CashCategoryService.deleteCategory(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cash', 'categories'] })
      showToast({ title: 'Categoría eliminada', variant: 'success' })
    },
    onError: showError,
  })
}
