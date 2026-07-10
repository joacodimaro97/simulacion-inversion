import { getApiError } from '@/api/http'
import { AuthService } from '@/services/AuthService'
import type { User } from '@/types/api'

const MAX_ATTEMPTS = 4
const BASE_DELAY_MS = 1500

function isRetryableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return true
  const apiError = getApiError(error)
  if (apiError.statusCode === 401 || apiError.statusCode === 403) return false
  return true
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function restoreSession(): Promise<User> {
  let lastError: unknown

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      return await AuthService.getMe()
    } catch (error) {
      lastError = error
      if (!isRetryableError(error) || attempt === MAX_ATTEMPTS - 1) {
        throw error
      }
      await wait(BASE_DELAY_MS * (attempt + 1))
    }
  }

  throw lastError
}
