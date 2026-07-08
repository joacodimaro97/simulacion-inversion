import { createContext, useContext, useRef, useEffect, type ReactNode } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invalidateFciAccounts } from '@/utils/queryInvalidation'
import { queryKeys } from '@/constants'
import { AccountService } from '@/services/AccountService'
import type { Account, CreateAccountInput } from '@/types/api'

interface AccountContextValue {
  account: Account | null
  accountId: string | null
  isLoading: boolean
  isReady: boolean
}

const AccountContext = createContext<AccountContextValue | null>(null)

const DEFAULT_ACCOUNT: CreateAccountInput = {
  name: 'Mi FCI',
  description: 'Cuenta principal de inversión',
  investmentType: 'FCI',
  currency: 'ARS',
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const hasCreated = useRef(false)

  const { data: accounts = [], isLoading, isFetched } = useQuery({
    queryKey: queryKeys.accounts.all,
    queryFn: () => AccountService.getAccounts(),
  })

  const createMutation = useMutation({
    mutationFn: (input: CreateAccountInput) => AccountService.createAccount(input),
    onSuccess: async () => {
      await invalidateFciAccounts(queryClient)
    },
  })

  useEffect(() => {
    if (isFetched && accounts.length === 0 && !hasCreated.current && !createMutation.isPending) {
      hasCreated.current = true
      createMutation.mutate(DEFAULT_ACCOUNT)
    }
  }, [isFetched, accounts.length, createMutation.isPending])

  const account = accounts[0] ?? null

  return (
    <AccountContext.Provider
      value={{
        account,
        accountId: account?.id ?? null,
        isLoading: isLoading || createMutation.isPending,
        isReady: isFetched && !createMutation.isPending && !!account,
      }}
    >
      {children}
    </AccountContext.Provider>
  )
}

export function useAccount() {
  const context = useContext(AccountContext)
  if (!context) {
    throw new Error('useAccount debe usarse dentro de AccountProvider')
  }
  return context
}
