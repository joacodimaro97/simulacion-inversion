import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/constants'
import { AccountService } from '@/services/AccountService'

export function useAccounts() {
  return useQuery({
    queryKey: queryKeys.accounts.all,
    queryFn: () => AccountService.getAccounts(),
  })
}
