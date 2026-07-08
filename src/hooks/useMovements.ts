import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants'
import { MovementService } from '@/services/MovementService'
import { useAccount } from '@/contexts/AccountContext'
import { useToast } from '@/contexts/ToastContext'
import { invalidateMovements } from '@/utils/queryInvalidation'
import type { CreateMovementInput, UpdateMovementInput } from '@/types/api'

export function useMovements() {
  const { accountId, isReady } = useAccount()

  return useQuery({
    queryKey: queryKeys.movements.all(accountId ?? undefined),
    queryFn: () => MovementService.getMovements({ accountId: accountId! }),
    enabled: isReady && !!accountId,
  })
}

export function useCreateMovement() {
  const queryClient = useQueryClient()
  const { showError, showToast } = useToast()

  return useMutation({
    mutationFn: (input: CreateMovementInput) => MovementService.createMovement(input),
    onSuccess: async () => {
      await invalidateMovements(queryClient)
      showToast({ title: 'Movimiento registrado', variant: 'success' })
    },
    onError: showError,
  })
}

export function useUpdateMovement() {
  const queryClient = useQueryClient()
  const { showError, showToast } = useToast()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateMovementInput }) =>
      MovementService.updateMovement(id, input),
    onSuccess: async () => {
      await invalidateMovements(queryClient)
      showToast({ title: 'Movimiento actualizado', variant: 'success' })
    },
    onError: showError,
  })
}

export function useDeleteMovement() {
  const queryClient = useQueryClient()
  const { showError, showToast } = useToast()

  return useMutation({
    mutationFn: (id: string) => MovementService.deleteMovement(id),
    onSuccess: async () => {
      await invalidateMovements(queryClient)
      showToast({ title: 'Movimiento eliminado', variant: 'success' })
    },
    onError: showError,
  })
}
