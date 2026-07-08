import { http } from '@/api/http'
import type {
  Account,
  CreateAccountInput,
  UpdateAccountInput,
} from '@/types/api'

export const AccountService = {
  async getAccounts(): Promise<Account[]> {
    const { data } = await http.get<Account[]>('/accounts')
    return data
  },

  async createAccount(input: CreateAccountInput): Promise<Account> {
    const { data } = await http.post<Account>('/accounts', input)
    return data
  },

  async updateAccount(id: string, input: UpdateAccountInput): Promise<Account> {
    const { data } = await http.put<Account>(`/accounts/${id}`, input)
    return data
  },

  async deleteAccount(id: string): Promise<void> {
    await http.delete(`/accounts/${id}`)
  },
}
