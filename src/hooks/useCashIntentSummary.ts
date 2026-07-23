import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/constants'
import { CashSummaryService } from '@/services/CashSummaryService'
import type { CashIntentSummaryQuery } from '@/types/cash'

export function useCashIntentSummary(filters?: CashIntentSummaryQuery) {
  return useQuery({
    queryKey: queryKeys.cash.summaryIntents(filters),
    queryFn: () => CashSummaryService.getIntentSummary(filters),
    placeholderData: keepPreviousData,
  })
}
