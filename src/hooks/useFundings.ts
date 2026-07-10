import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants'
import { FundingService } from '@/services/FundingService'
import { useToast } from '@/contexts/ToastContext'
import { getApiError } from '@/api/http'
import { invalidateFundings } from '@/utils/queryInvalidation'
import type { CreateFundingInput, FundingQuery } from '@/types/cash'

export function useFundings(filters?: FundingQuery) {
  return useQuery({
    queryKey: queryKeys.fundings.all(filters),
    queryFn: () => FundingService.getFundings(filters),
    placeholderData: keepPreviousData,
  })
}

export function useCreateFunding() {
  const queryClient = useQueryClient()
  const { showError, showToast } = useToast()

  return useMutation({
    mutationFn: (input: CreateFundingInput) => FundingService.createFunding(input),
    onSuccess: async () => {
      await invalidateFundings(queryClient)
      showToast({ title: 'Movimiento registrado', variant: 'success' })
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

export function useDeleteFunding() {
  const queryClient = useQueryClient()
  const { showError, showToast } = useToast()

  return useMutation({
    mutationFn: (id: string) => FundingService.deleteFunding(id),
    onSuccess: async () => {
      await invalidateFundings(queryClient)
      showToast({ title: 'Movimiento eliminado', variant: 'success' })
    },
    onError: showError,
  })
}
