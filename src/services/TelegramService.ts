import { http } from '@/api/http'
import type { User } from '@/types/api'
import type { TelegramLinkResponse, TelegramStatus } from '@/types/telegram'

export const TelegramService = {
  async getStatus(): Promise<TelegramStatus> {
    const { data } = await http.get<TelegramStatus>('/telegram/status')
    return data
  },

  async link(): Promise<TelegramLinkResponse> {
    const { data } = await http.post<TelegramLinkResponse>('/telegram/link')
    return data
  },

  async unlink(): Promise<User> {
    const { data } = await http.delete<User>('/telegram/link')
    return data
  },
}
