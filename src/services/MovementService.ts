import { http } from '@/api/http'
import type {
  CreateMovementInput,
  DateRangeQuery,
  Movement,
  UpdateMovementInput,
} from '@/types/api'

export const MovementService = {
  async getMovements(query?: DateRangeQuery): Promise<Movement[]> {
    const { data } = await http.get<Movement[]>('/movements', { params: query })
    return data
  },

  async createMovement(input: CreateMovementInput): Promise<Movement> {
    const { data } = await http.post<Movement>('/movements', input)
    return data
  },

  async updateMovement(id: string, input: UpdateMovementInput): Promise<Movement> {
    const { data } = await http.put<Movement>(`/movements/${id}`, input)
    return data
  },

  async deleteMovement(id: string): Promise<void> {
    await http.delete(`/movements/${id}`)
  },
}
