import { http } from '@/api/http'
import type { DateRangeQuery, Statistics } from '@/types/api'

export const StatisticsService = {
  async getStatistics(query?: DateRangeQuery): Promise<Statistics> {
    const { data } = await http.get<Statistics>('/statistics', { params: query })
    return data
  },
}
