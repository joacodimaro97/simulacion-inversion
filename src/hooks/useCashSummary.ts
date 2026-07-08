import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/constants'
import { CashSummaryService } from '@/services/CashSummaryService'
import type { CashSummaryQuery } from '@/types/cash'

export function useCashSummary(filters?: CashSummaryQuery) {
  return useQuery({
    queryKey: queryKeys.cash.summary(filters),
    queryFn: () => CashSummaryService.getSummary(filters),
    placeholderData: keepPreviousData,
  })
}
