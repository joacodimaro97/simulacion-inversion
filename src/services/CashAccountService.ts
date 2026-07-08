import { http } from '@/api/http'
import type {
  CashAccount,
  CreateCashAccountInput,
  UpdateCashAccountInput,
} from '@/types/cash'

export const CashAccountService = {
  async getAccounts(): Promise<CashAccount[]> {
    const { data } = await http.get<CashAccount[]>('/cash/accounts')
    return data
  },

  async createAccount(input: CreateCashAccountInput): Promise<CashAccount> {
    const { data } = await http.post<CashAccount>('/cash/accounts', input)
    return data
  },

  async updateAccount(id: string, input: UpdateCashAccountInput): Promise<CashAccount> {
    const { data } = await http.put<CashAccount>(`/cash/accounts/${id}`, input)
    return data
  },

  async deleteAccount(id: string): Promise<void> {
    await http.delete(`/cash/accounts/${id}`)
  },
}
