import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants'
import { PerformanceService } from '@/services/PerformanceService'
import { useAccount } from '@/contexts/AccountContext'
import { useToast } from '@/contexts/ToastContext'
import type {
  CreatePerformanceInput,
  PerformancePeriodQuery,
  UpdatePerformanceInput,
} from '@/types/api'

export function usePerformance() {
  const { accountId, isReady } = useAccount()

  return useQuery({
    queryKey: queryKeys.performance.all(accountId ?? undefined),
    queryFn: () => PerformanceService.getPerformance({ accountId: accountId! }),
    enabled: isReady && !!accountId,
  })
}

export function useMonthlyPerformance(year?: number) {
  const { accountId, isReady } = useAccount()

  return useQuery({
    queryKey: queryKeys.performance.monthly(accountId ?? undefined, year),
    queryFn: () =>
      PerformanceService.getMonthlyPerformance({
        accountId: accountId!,
        year,
      } satisfies PerformancePeriodQuery),
    enabled: isReady && !!accountId,
  })
}

export function useYearlyPerformance() {
  const { accountId, isReady } = useAccount()

  return useQuery({
    queryKey: queryKeys.performance.yearly(accountId ?? undefined),
    queryFn: () => PerformanceService.getYearlyPerformance({ accountId: accountId! }),
    enabled: isReady && !!accountId,
  })
}

export function useCreatePerformance() {
  const queryClient = useQueryClient()
  const { showError, showToast } = useToast()

  return useMutation({
    mutationFn: (input: CreatePerformanceInput) => PerformanceService.createPerformance(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['performance'] })
      void queryClient.invalidateQueries({ queryKey: ['statistics'] })
      showToast({ title: 'Registro agregado', variant: 'success' })
    },
    onError: showError,
  })
}

export function useUpdatePerformance() {
  const queryClient = useQueryClient()
  const { showError, showToast } = useToast()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePerformanceInput }) =>
      PerformanceService.updatePerformance(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['performance'] })
      void queryClient.invalidateQueries({ queryKey: ['statistics'] })
      showToast({ title: 'Registro actualizado', variant: 'success' })
    },
    onError: showError,
  })
}

export function useDeletePerformance() {
  const queryClient = useQueryClient()
  const { showError, showToast } = useToast()

  return useMutation({
    mutationFn: (id: string) => PerformanceService.deletePerformance(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['performance'] })
      void queryClient.invalidateQueries({ queryKey: ['statistics'] })
      showToast({ title: 'Registro eliminado', variant: 'success' })
    },
    onError: showError,
  })
}
