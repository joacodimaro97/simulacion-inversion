import { http } from '@/api/http'
import type {
  CalendarInstallmentItem,
  CreateCreditInput,
  CreditCalendarQuery,
  CreditListQuery,
  CreditsSummary,
  CreditWithDetails,
  PayInstallmentInput,
  RescheduleInstallmentInput,
  UpdateCreditInput,
} from '@/types/credits'

export const CreditService = {
  async list(query?: CreditListQuery): Promise<CreditWithDetails[]> {
    const { data } = await http.get<CreditWithDetails[]>('/credits', { params: query })
    return data
  },

  async getSummary(upcomingLimit = 10): Promise<CreditsSummary> {
    const { data } = await http.get<CreditsSummary>('/credits/summary', {
      params: { upcomingLimit },
    })
    return data
  },

  async getCalendar(query: CreditCalendarQuery): Promise<CalendarInstallmentItem[]> {
    const { data } = await http.get<CalendarInstallmentItem[]>('/credits/calendar', {
      params: query,
    })
    return data
  },

  async getById(id: string): Promise<CreditWithDetails> {
    const { data } = await http.get<CreditWithDetails>(`/credits/${id}`)
    return data
  },

  async create(input: CreateCreditInput): Promise<CreditWithDetails> {
    const { data } = await http.post<CreditWithDetails>('/credits', input)
    return data
  },

  async update(id: string, input: UpdateCreditInput): Promise<CreditWithDetails> {
    const { data } = await http.patch<CreditWithDetails>(`/credits/${id}`, input)
    return data
  },

  async remove(id: string): Promise<void> {
    await http.delete(`/credits/${id}`)
  },

  async rescheduleInstallment(
    creditId: string,
    installmentId: string,
    input: RescheduleInstallmentInput,
  ): Promise<CreditWithDetails> {
    const { data } = await http.patch<CreditWithDetails>(
      `/credits/${creditId}/installments/${installmentId}`,
      input,
    )
    return data
  },

  async payInstallment(
    creditId: string,
    installmentId: string,
    input: PayInstallmentInput,
  ): Promise<CreditWithDetails> {
    const { data } = await http.post<CreditWithDetails>(
      `/credits/${creditId}/installments/${installmentId}/pay`,
      input,
    )
    return data
  },

  async unpayInstallment(
    creditId: string,
    installmentId: string,
  ): Promise<CreditWithDetails> {
    const { data } = await http.delete<CreditWithDetails>(
      `/credits/${creditId}/installments/${installmentId}/payment`,
    )
    return data
  },
}
