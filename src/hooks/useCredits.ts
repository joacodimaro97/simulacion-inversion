import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants'
import { CreditService } from '@/services/CreditService'
import { useToast } from '@/contexts/ToastContext'
import { invalidateCredits } from '@/utils/queryInvalidation'
import type {
  CreateCreditInput,
  CreditCalendarQuery,
  CreditListQuery,
  PayInstallmentInput,
  RescheduleInstallmentInput,
  UpdateCreditInput,
} from '@/types/credits'

export function useCredits(filters?: CreditListQuery) {
  return useQuery({
    queryKey: queryKeys.credits.list(filters),
    queryFn: () => CreditService.list(filters),
    placeholderData: keepPreviousData,
  })
}

export function useCreditsSummary(upcomingLimit = 10) {
  return useQuery({
    queryKey: queryKeys.credits.summary(upcomingLimit),
    queryFn: () => CreditService.getSummary(upcomingLimit),
  })
}

export function useCreditsCalendar(query: CreditCalendarQuery, enabled = true) {
  return useQuery({
    queryKey: queryKeys.credits.calendar(query),
    queryFn: () => CreditService.getCalendar(query),
    enabled,
    placeholderData: keepPreviousData,
  })
}

export function useCredit(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.credits.detail(id ?? ''),
    queryFn: () => CreditService.getById(id!),
    enabled: Boolean(id),
  })
}

export function useCreateCredit() {
  const queryClient = useQueryClient()
  const { showError, showToast } = useToast()

  return useMutation({
    mutationFn: (input: CreateCreditInput) => CreditService.create(input),
    onSuccess: async () => {
      await invalidateCredits(queryClient)
      showToast({ title: 'Crédito creado', variant: 'success' })
    },
    onError: showError,
  })
}

export function useUpdateCredit() {
  const queryClient = useQueryClient()
  const { showError, showToast } = useToast()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCreditInput }) =>
      CreditService.update(id, input),
    onSuccess: async () => {
      await invalidateCredits(queryClient)
      showToast({ title: 'Crédito actualizado', variant: 'success' })
    },
    onError: showError,
  })
}

export function useDeleteCredit() {
  const queryClient = useQueryClient()
  const { showError, showToast } = useToast()

  return useMutation({
    mutationFn: (id: string) => CreditService.remove(id),
    onSuccess: async () => {
      await invalidateCredits(queryClient)
      showToast({ title: 'Crédito eliminado o cancelado', variant: 'success' })
    },
    onError: showError,
  })
}

export function useRescheduleInstallment() {
  const queryClient = useQueryClient()
  const { showError, showToast } = useToast()

  return useMutation({
    mutationFn: ({
      creditId,
      installmentId,
      input,
    }: {
      creditId: string
      installmentId: string
      input: RescheduleInstallmentInput
    }) => CreditService.rescheduleInstallment(creditId, installmentId, input),
    onSuccess: async () => {
      await invalidateCredits(queryClient)
      showToast({ title: 'Cuota reprogramada', variant: 'success' })
    },
    onError: showError,
  })
}

export function usePayInstallment() {
  const queryClient = useQueryClient()
  const { showError, showToast } = useToast()

  return useMutation({
    mutationFn: ({
      creditId,
      installmentId,
      input,
    }: {
      creditId: string
      installmentId: string
      input: PayInstallmentInput
    }) => CreditService.payInstallment(creditId, installmentId, input),
    onSuccess: async () => {
      await invalidateCredits(queryClient)
      showToast({ title: 'Cuota registrada', variant: 'success' })
    },
    onError: showError,
  })
}

export function useUnpayInstallment() {
  const queryClient = useQueryClient()
  const { showError, showToast } = useToast()

  return useMutation({
    mutationFn: ({
      creditId,
      installmentId,
    }: {
      creditId: string
      installmentId: string
    }) => CreditService.unpayInstallment(creditId, installmentId),
    onSuccess: async () => {
      await invalidateCredits(queryClient)
      showToast({ title: 'Pago deshecho', variant: 'success' })
    },
    onError: showError,
  })
}
