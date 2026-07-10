export const AUTH_TOKEN_KEY = 'fci_auth_token'

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/',
  DAILY_HISTORY: '/historial',
  MOVEMENTS: '/movimientos',
  SIMULATOR: '/simulador',
  COMPARATOR: '/comparador',
  CASH: '/cash',
  CASH_ACCOUNTS: '/cash/accounts',
  CASH_CATEGORIES: '/cash/categories',
  CASH_TRANSACTIONS: '/cash/transactions',
  CASH_TRANSFERS: '/cash/transfers',
  CASH_FUNDINGS: '/cash/fundings',
} as const

export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  accounts: {
    all: ['accounts'] as const,
    detail: (id: string) => ['accounts', id] as const,
  },
  movements: {
    all: (accountId?: string) => ['movements', accountId] as const,
  },
  performance: {
    all: (accountId?: string) => ['performance', accountId] as const,
    monthly: (accountId?: string, year?: number) =>
      ['performance', 'monthly', accountId, year] as const,
    yearly: (accountId?: string) => ['performance', 'yearly', accountId] as const,
  },
  simulations: {
    all: (accountId?: string) => ['simulations', accountId] as const,
    detail: (id: string) => ['simulations', id] as const,
  },
  statistics: {
    all: (accountId?: string) => ['statistics', accountId] as const,
  },
  cash: {
    accounts: ['cash', 'accounts'] as const,
    categories: (filters?: unknown) => ['cash', 'categories', filters] as const,
    categoryTree: (type?: string) => ['cash', 'categories', 'tree', type] as const,
    transactions: (filters?: unknown) => ['cash', 'transactions', filters] as const,
    summary: (filters?: unknown) => ['cash', 'summary', filters] as const,
    transfers: (filters?: unknown) => ['cash', 'transfers', filters] as const,
  },
  fundings: {
    all: (filters?: unknown) => ['fundings', filters] as const,
  },
} as const
