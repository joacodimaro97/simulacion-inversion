import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants'
import { CashTransactionService } from '@/services/CashTransactionService'
import { useToast } from '@/contexts/ToastContext'
import type {
  CashTransactionQuery,
  CreateCashTransactionInput,
  UpdateCashTransactionInput,
} from '@/types/cash'

export function useCashTransactions(filters?: CashTransactionQuery) {
  return useQuery({
    queryKey: queryKeys.cash.transactions(filters),
    queryFn: () => CashTransactionService.getTransactions(filters),
  })
}

export function useCreateCashTransaction() {
  const queryClient = useQueryClient()
  const { showError, showToast } = useToast()

  return useMutation({
    mutationFn: (input: CreateCashTransactionInput) =>
      CashTransactionService.createTransaction(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cash', 'transactions'] })
      void queryClient.invalidateQueries({ queryKey: ['cash', 'summary'] })
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cash', 'transactions'] })
      void queryClient.invalidateQueries({ queryKey: ['cash', 'summary'] })
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cash', 'transactions'] })
      void queryClient.invalidateQueries({ queryKey: ['cash', 'summary'] })
      showToast({ title: 'Transacción eliminada', variant: 'success' })
    },
    onError: showError,
  })
}
