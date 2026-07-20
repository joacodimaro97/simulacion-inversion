import { http } from '@/api/http'
import { computeTransactionStats, ensureWeeklyStats } from '@/utils/transactionStats'
import type {
  CashTransaction,
  CashTransactionListResponse,
  CashTransactionQuery,
  CreateCashTransactionInput,
  UpdateCashTransactionInput,
} from '@/types/cash'

function normalizeListResponse(
  data: CashTransaction[] | CashTransactionListResponse,
  query?: CashTransactionQuery,
): CashTransactionListResponse {
  if (Array.isArray(data)) {
    return {
      items: data,
      stats: computeTransactionStats(data, query),
    }
  }
  return {
    items: data.items,
    stats: ensureWeeklyStats(data.stats, data.items, query),
  }
}

/** Serializa arrays como params repetidos: categoryIds=a&categoryIds=b */
function serializeTransactionQueryParams(query?: CashTransactionQuery): string {
  if (!query) return ''
  const parts: string[] = []
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === undefined || item === null || item === '') continue
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`)
      }
      continue
    }
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
  }
  return parts.join('&')
}

export const CashTransactionService = {
  async getTransactions(
    query?: CashTransactionQuery,
  ): Promise<CashTransactionListResponse> {
    const { data } = await http.get<CashTransaction[] | CashTransactionListResponse>(
      '/cash/transactions',
      {
        params: query,
        paramsSerializer: serializeTransactionQueryParams,
      },
    )
    return normalizeListResponse(data, query)
  },

  async createTransaction(input: CreateCashTransactionInput): Promise<CashTransaction> {
    const { data } = await http.post<CashTransaction>('/cash/transactions', input)
    return data
  },

  async updateTransaction(
    id: string,
    input: UpdateCashTransactionInput,
  ): Promise<CashTransaction> {
    const { data } = await http.put<CashTransaction>(`/cash/transactions/${id}`, input)
    return data
  },

  async deleteTransaction(id: string): Promise<void> {
    await http.delete(`/cash/transactions/${id}`)
  },
}
