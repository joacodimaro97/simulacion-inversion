import type { QueryClient } from '@tanstack/react-query'

const REFETCH_ALL = { refetchType: 'all' as const }

export function invalidateCashAccounts(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['cash', 'accounts'], ...REFETCH_ALL }),
    queryClient.invalidateQueries({ queryKey: ['cash', 'summary'], ...REFETCH_ALL }),
  ])
}

export function invalidateCashCategories(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['cash', 'categories'], ...REFETCH_ALL }),
    queryClient.invalidateQueries({ queryKey: ['cash', 'transactions'], ...REFETCH_ALL }),
  ])
}

export function invalidateCashTransactions(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['cash', 'transactions'], ...REFETCH_ALL }),
    queryClient.invalidateQueries({ queryKey: ['cash', 'summary'], ...REFETCH_ALL }),
  ])
}

export function invalidateCashTransfers(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['cash', 'transfers'], ...REFETCH_ALL }),
    invalidateCashTransactions(queryClient),
  ])
}

export function invalidateFundings(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['fundings'], ...REFETCH_ALL }),
    invalidateCashTransactions(queryClient),
    invalidateMovements(queryClient),
    invalidateFciAccounts(queryClient),
  ])
}

export function invalidateCashAll(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: ['cash'], ...REFETCH_ALL })
}

export function invalidateFciAccounts(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['accounts'], ...REFETCH_ALL }),
    queryClient.invalidateQueries({ queryKey: ['statistics'], ...REFETCH_ALL }),
    queryClient.invalidateQueries({ queryKey: ['movements'], ...REFETCH_ALL }),
    queryClient.invalidateQueries({ queryKey: ['performance'], ...REFETCH_ALL }),
    queryClient.invalidateQueries({ queryKey: ['simulations'], ...REFETCH_ALL }),
  ])
}

export function invalidateMovements(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['movements'], ...REFETCH_ALL }),
    queryClient.invalidateQueries({ queryKey: ['statistics'], ...REFETCH_ALL }),
    queryClient.invalidateQueries({ queryKey: ['performance'], ...REFETCH_ALL }),
  ])
}

export function invalidatePerformance(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['performance'], ...REFETCH_ALL }),
    queryClient.invalidateQueries({ queryKey: ['statistics'], ...REFETCH_ALL }),
  ])
}

export function invalidateSimulations(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: ['simulations'], ...REFETCH_ALL })
}
