import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants'
import { CashTransactionService } from '@/services/CashTransactionService'
import { useToast } from '@/contexts/ToastContext'
import { invalidateCashTransactions } from '@/utils/queryInvalidation'
import type {
  CashTransactionQuery,
  CreateCashTransactionInput,
  UpdateCashTransactionInput,
} from '@/types/cash'

export function useCashTransactions(filters?: CashTransactionQuery) {
  return useQuery({
    queryKey: queryKeys.cash.transactions(filters),
    queryFn: () => CashTransactionService.getTransactions(filters),
    placeholderData: keepPreviousData,
  })
}

export function useCreateCashTransaction() {
  const queryClient = useQueryClient()
  const { showError, showToast } = useToast()

  return useMutation({
    mutationFn: (input: CreateCashTransactionInput) =>
      CashTransactionService.createTransaction(input),
    onSuccess: async () => {
      await invalidateCashTransactions(queryClient)
      showToast({ title: 'Transacción registrada', variant: 'success' })
    },
    onError: showError,
  })
}

export function useUpdateCashTransaction() {
  const queryClient = useQueryClient()
  const { showError, showToast } = useToast()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCashTransactionInput }) =>
      CashTransactionService.updateTransaction(id, input),
    onSuccess: async () => {
      await invalidateCashTransactions(queryClient)
      showToast({ title: 'Transacción actualizada', variant: 'success' })
    },
    onError: showError,
  })
}

export function useDeleteCashTransaction() {
  const queryClient = useQueryClient()
  const { showError, showToast } = useToast()

  return useMutation({
    mutationFn: (id: string) => CashTransactionService.deleteTransaction(id),
    onSuccess: async () => {
      await invalidateCashTransactions(queryClient)
      showToast({ title: 'Transacción eliminada', variant: 'success' })
    },
    onError: showError,
  })
}
