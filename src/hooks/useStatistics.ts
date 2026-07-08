import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/constants'
import { StatisticsService } from '@/services/StatisticsService'
import { useAccount } from '@/contexts/AccountContext'

export function useStatistics() {
  const { accountId, isReady } = useAccount()

  return useQuery({
    queryKey: queryKeys.statistics.all(accountId ?? undefined),
    queryFn: () => StatisticsService.getStatistics({ accountId: accountId! }),
    enabled: isReady && !!accountId,
  })
}
