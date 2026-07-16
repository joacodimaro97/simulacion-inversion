import { http } from '@/api/http'
import type { Budget, CreateBudgetInput, UpdateBudgetInput } from '@/types/cash'

export const CashBudgetService = {
  async getBudgets(): Promise<Budget[]> {
    const { data } = await http.get<Budget[]>('/cash/budgets')
    return data
  },

  async getBudget(id: string): Promise<Budget> {
    const { data } = await http.get<Budget>(`/cash/budgets/${id}`)
    return data
  },

  async createBudget(input: CreateBudgetInput): Promise<Budget> {
    const { data } = await http.post<Budget>('/cash/budgets', input)
    return data
  },

  async updateBudget(id: string, input: UpdateBudgetInput): Promise<Budget> {
    const { data } = await http.put<Budget>(`/cash/budgets/${id}`, input)
    return data
  },

  async deleteBudget(id: string): Promise<void> {
    await http.delete(`/cash/budgets/${id}`)
  },
}
