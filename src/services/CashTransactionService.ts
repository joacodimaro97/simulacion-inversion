import { http } from '@/api/http'
import type {
  CashTransaction,
  CashTransactionQuery,
  CreateCashTransactionInput,
  UpdateCashTransactionInput,
} from '@/types/cash'

export const CashTransactionService = {
  async getTransactions(query?: CashTransactionQuery): Promise<CashTransaction[]> {
    const { data } = await http.get<CashTransaction[]>('/cash/transactions', {
      params: query,
    })
    return data
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
