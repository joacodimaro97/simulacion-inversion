import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants'
import { SimulationService } from '@/services/SimulationService'
import { useAccount } from '@/contexts/AccountContext'
import { useToast } from '@/contexts/ToastContext'
import type { RunSimulationInput, SaveSimulationInput } from '@/types/api'

export function useSimulations() {
  const { accountId, isReady } = useAccount()

  return useQuery({
    queryKey: queryKeys.simulations.all(accountId ?? undefined),
    queryFn: () => SimulationService.getSimulations(accountId!),
    enabled: isReady && !!accountId,
  })
}

export function useSimulation(id: string | null) {
  return useQuery({
    queryKey: queryKeys.simulations.detail(id ?? ''),
    queryFn: () => SimulationService.getSimulationById(id!),
    enabled: !!id,
  })
}

export function useRunSimulation() {
  const { showError } = useToast()

  return useMutation({
    mutationFn: (input: RunSimulationInput) => SimulationService.runSimulation(input),
    onError: showError,
  })
}

export function useSaveSimulation() {
  const queryClient = useQueryClient()
  const { showError, showToast } = useToast()

  return useMutation({
    mutationFn: (input: SaveSimulationInput) => SimulationService.saveSimulation(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['simulations'] })
      showToast({ title: 'Simulación guardada', variant: 'success' })
    },
    onError: showError,
  })
}

export function useDeleteSimulation() {
  const queryClient = useQueryClient()
  const { showError, showToast } = useToast()

  return useMutation({
    mutationFn: (id: string) => SimulationService.deleteSimulation(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['simulations'] })
      showToast({ title: 'Simulación eliminada', variant: 'success' })
    },
    onError: showError,
  })
}
