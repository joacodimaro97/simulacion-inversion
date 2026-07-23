import { http } from '@/api/http'
import type {
  CashIntentSummary,
  CashIntentSummaryQuery,
  CashSummary,
  CashSummaryQuery,
} from '@/types/cash'

export const CashSummaryService = {
  async getSummary(query?: CashSummaryQuery): Promise<CashSummary> {
    const { data } = await http.get<CashSummary>('/cash/summary', { params: query })
    return data
  },

  async getIntentSummary(query?: CashIntentSummaryQuery): Promise<CashIntentSummary> {
    const { data } = await http.get<CashIntentSummary>('/cash/summary/intents', {
      params: query,
    })
    return data
  },
}
