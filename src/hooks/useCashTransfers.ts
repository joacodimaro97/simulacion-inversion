import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants'
import { CashTransferService } from '@/services/CashTransferService'
import { useToast } from '@/contexts/ToastContext'
import { getApiError } from '@/api/http'
import { invalidateCashTransfers } from '@/utils/queryInvalidation'
import type { CashTransferQuery, CreateCashTransferInput } from '@/types/cash'

export function useCashTransfers(filters?: CashTransferQuery) {
  return useQuery({
    queryKey: queryKeys.cash.transfers(filters),
    queryFn: () => CashTransferService.getTransfers(filters),
    placeholderData: keepPreviousData,
  })
}

export function useCreateCashTransfer() {
  const queryClient = useQueryClient()
  const { showError, showToast } = useToast()

  return useMutation({
    mutationFn: (input: CreateCashTransferInput) => CashTransferService.createTransfer(input),
    onSuccess: async () => {
      await invalidateCashTransfers(queryClient)
      showToast({ title: 'Transferencia realizada', variant: 'success' })
    },
    onError: (error) => {
      const apiError = getApiError(error)
      if (apiError.statusCode === 400 && apiError.message.toLowerCase().includes('moneda')) {
        showToast({
          title: 'Monedas distintas',
          description: 'Las cuentas deben tener la misma moneda',
          variant: 'destructive',
        })
        return
      }
      showError(error)
    },
  })
}

export function useDeleteCashTransfer() {
  const queryClient = useQueryClient()
  const { showError, showToast } = useToast()

  return useMutation({
    mutationFn: (id: string) => CashTransferService.deleteTransfer(id),
    onSuccess: async () => {
      await invalidateCashTransfers(queryClient)
      showToast({ title: 'Transferencia eliminada', variant: 'success' })
    },
    onError: showError,
  })
}
