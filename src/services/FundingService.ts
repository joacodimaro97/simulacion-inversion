import { http } from '@/api/http'
import type { AccountFunding, CreateFundingInput, FundingQuery } from '@/types/cash'

export const FundingService = {
  async getFundings(query?: FundingQuery): Promise<AccountFunding[]> {
    const { data } = await http.get<AccountFunding[]>('/fundings', { params: query })
    return data
  },

  async createFunding(input: CreateFundingInput): Promise<AccountFunding> {
    const { data } = await http.post<AccountFunding>('/fundings', input)
    return data
  },

  async deleteFunding(id: string): Promise<void> {
    await http.delete(`/fundings/${id}`)
  },
}
