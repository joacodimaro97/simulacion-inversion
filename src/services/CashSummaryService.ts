import { http } from '@/api/http'
import type { CashSummary, CashSummaryQuery } from '@/types/cash'

export const CashSummaryService = {
  async getSummary(query?: CashSummaryQuery): Promise<CashSummary> {
    const { data } = await http.get<CashSummary>('/cash/summary', { params: query })
    return data
  },
}
