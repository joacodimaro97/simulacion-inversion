import { http } from '@/api/http'
import type {
  CashTransfer,
  CashTransferQuery,
  CreateCashTransferInput,
} from '@/types/cash'

export const CashTransferService = {
  async getTransfers(query?: CashTransferQuery): Promise<CashTransfer[]> {
    const { data } = await http.get<CashTransfer[]>('/cash/transfers', { params: query })
    return data
  },

  async createTransfer(input: CreateCashTransferInput): Promise<CashTransfer> {
    const { data } = await http.post<CashTransfer>('/cash/transfers', input)
    return data
  },

  async deleteTransfer(id: string): Promise<void> {
    await http.delete(`/cash/transfers/${id}`)
  },
}
