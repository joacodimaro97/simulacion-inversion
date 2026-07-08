import { http } from '@/api/http'
import type {
  CreatePerformanceInput,
  DateRangeQuery,
  MonthlyPerformance,
  Performance,
  PerformancePeriodQuery,
  UpdatePerformanceInput,
  YearlyPerformance,
} from '@/types/api'

export const PerformanceService = {
  async getPerformance(query?: DateRangeQuery): Promise<Performance[]> {
    const { data } = await http.get<Performance[]>('/performance', { params: query })
    return data
  },

  async createPerformance(input: CreatePerformanceInput): Promise<Performance> {
    const { data } = await http.post<Performance>('/performance', input)
    return data
  },

  async updatePerformance(id: string, input: UpdatePerformanceInput): Promise<Performance> {
    const { data } = await http.put<Performance>(`/performance/${id}`, input)
    return data
  },

  async deletePerformance(id: string): Promise<void> {
    await http.delete(`/performance/${id}`)
  },

  async getMonthlyPerformance(query?: PerformancePeriodQuery): Promise<MonthlyPerformance[]> {
    const { data } = await http.get<MonthlyPerformance[]>('/performance/monthly', {
      params: query,
    })
    return data
  },

  async getYearlyPerformance(query?: PerformancePeriodQuery): Promise<YearlyPerformance[]> {
    const { data } = await http.get<YearlyPerformance[]>('/performance/yearly', {
      params: query,
    })
    return data
  },
}
