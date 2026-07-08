import { http } from '@/api/http'
import type {
  Category,
  CategoryQuery,
  CategoryTreeNode,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@/types/cash'

export const CashCategoryService = {
  async getCategories(query?: CategoryQuery): Promise<Category[]> {
    const { data } = await http.get<Category[]>('/cash/categories', {
      params: query,
    })
    return data
  },

  async getCategoryTree(type?: CategoryQuery['type']): Promise<CategoryTreeNode[]> {
    const { data } = await http.get<CategoryTreeNode[]>('/cash/categories', {
      params: { tree: true, ...(type ? { type } : {}) },
    })
    return data
  },

  async createCategory(input: CreateCategoryInput): Promise<Category> {
    const { data } = await http.post<Category>('/cash/categories', input)
    return data
  },

  async updateCategory(id: string, input: UpdateCategoryInput): Promise<Category> {
    const { data } = await http.put<Category>(`/cash/categories/${id}`, input)
    return data
  },

  async deleteCategory(id: string): Promise<void> {
    await http.delete(`/cash/categories/${id}`)
  },
}
