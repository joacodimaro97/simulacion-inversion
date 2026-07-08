import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants'
import { CashAccountService } from '@/services/CashAccountService'
import { useToast } from '@/contexts/ToastContext'
import {
  invalidateCashAccounts,
  invalidateCashAll,
} from '@/utils/queryInvalidation'
import type { CreateCashAccountInput, UpdateCashAccountInput } from '@/types/cash'

export function useCashAccounts() {
  return useQuery({
    queryKey: queryKeys.cash.accounts,
    queryFn: () => CashAccountService.getAccounts(),
  })
}

export function useCreateCashAccount() {
  const queryClient = useQueryClient()
  const { showError, showToast } = useToast()

  return useMutation({
    mutationFn: (input: CreateCashAccountInput) => CashAccountService.createAccount(input),
    onSuccess: async () => {
      await invalidateCashAccounts(queryClient)
      showToast({ title: 'Cuenta creada', variant: 'success' })
    },
    onError: showError,
  })
}

export function useUpdateCashAccount() {
  const queryClient = useQueryClient()
  const { showError, showToast } = useToast()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCashAccountInput }) =>
      CashAccountService.updateAccount(id, input),
    onSuccess: async () => {
      await invalidateCashAccounts(queryClient)
      showToast({ title: 'Cuenta actualizada', variant: 'success' })
    },
    onError: showError,
  })
}

export function useDeleteCashAccount() {
  const queryClient = useQueryClient()
  const { showError, showToast } = useToast()

  return useMutation({
    mutationFn: (id: string) => CashAccountService.deleteAccount(id),
    onSuccess: async () => {
      await invalidateCashAll(queryClient)
      showToast({ title: 'Cuenta eliminada', variant: 'success' })
    },
    onError: showError,
  })
}
