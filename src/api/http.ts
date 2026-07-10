import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { AUTH_TOKEN_KEY } from '@/constants'
import type { ApiError } from '@/types/api'

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export const http = axios.create({
  baseURL,
  timeout: 60_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export function getStoredToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function setStoredToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export function clearStoredToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY)
}

let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler
}

function isPublicAuthRequest(url?: string): boolean {
  if (!url) return false
  return url.includes('/auth/login') || url.includes('/auth/register')
}

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    const status = error.response?.status
    const hadAuth = Boolean(error.config?.headers?.Authorization)
    const url = error.config?.url

    if (status === 401 && hadAuth && !isPublicAuthRequest(url)) {
      clearStoredToken()
      onUnauthorized?.()
    }

    return Promise.reject(error)
  },
)

export function getApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    if (error.response?.data) {
      return error.response.data as ApiError
    }
    if (!error.response) {
      return {
        statusCode: 0,
        error: 'NetworkError',
        message:
          error.code === 'ECONNABORTED'
            ? 'El servidor tardó demasiado en responder. Intentá de nuevo.'
            : 'No se pudo conectar con el servidor. Verificá tu conexión.',
      }
    }
  }
  return {
    statusCode: 500,
    error: 'Error',
    message: error instanceof Error ? error.message : 'Error desconocido',
  }
}
