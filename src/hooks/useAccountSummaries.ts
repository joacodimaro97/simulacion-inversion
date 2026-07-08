import { useQueries } from '@tanstack/react-query'
import { queryKeys } from '@/constants'
import { CashSummaryService } from '@/services/CashSummaryService'
import type { CashSummaryQuery } from '@/types/cash'

export function useAccountSummaries(
  accountIds: string[],
  filters?: Omit<CashSummaryQuery, 'cashAccountId'>,
) {
  return useQueries({
    queries: accountIds.map((id) => ({
      queryKey: queryKeys.cash.summary({ ...filters, cashAccountId: id }),
      queryFn: () => CashSummaryService.getSummary({ ...filters, cashAccountId: id }),
      enabled: Boolean(id),
    })),
  })
}
