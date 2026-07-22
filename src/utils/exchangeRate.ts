import { useCallback, useSyncExternalStore } from 'react'
import { USD_EXCHANGE_RATE_KEY } from '@/constants'

const RATE_CHANGE_EVENT = 'usd-rate-change'

function normalizeCurrency(currency: string | null | undefined): string {
  return (currency || 'ARS').trim().toUpperCase()
}

export function isUsdCurrency(currency: string | null | undefined): boolean {
  return normalizeCurrency(currency) === 'USD'
}

/** Lee la cotización USD→ARS desde localStorage. `null` si no está configurada. */
export function getStoredUsdRate(): number | null {
  try {
    const raw = localStorage.getItem(USD_EXCHANGE_RATE_KEY)
    if (raw == null || raw === '') return null
    const parsed = Number(raw)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  } catch {
    return null
  }
}

export function setStoredUsdRate(rate: number | null): void {
  try {
    if (rate == null || !Number.isFinite(rate) || rate <= 0) {
      localStorage.removeItem(USD_EXCHANGE_RATE_KEY)
    } else {
      localStorage.setItem(USD_EXCHANGE_RATE_KEY, String(rate))
    }
  } catch {
    // ignore quota / private mode
  }
  window.dispatchEvent(new Event(RATE_CHANGE_EVENT))
}

/** Convierte un monto a ARS usando la cotización USD→ARS. */
export function toArs(
  amount: number,
  currency: string | null | undefined,
  usdRate: number | null,
): number {
  if (!isUsdCurrency(currency)) return amount
  if (usdRate == null || usdRate <= 0) return amount
  return amount * usdRate
}

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener('storage', onStoreChange)
  window.addEventListener(RATE_CHANGE_EVENT, onStoreChange)
  return () => {
    window.removeEventListener('storage', onStoreChange)
    window.removeEventListener(RATE_CHANGE_EVENT, onStoreChange)
  }
}

export function useUsdExchangeRate() {
  const rate = useSyncExternalStore(subscribe, getStoredUsdRate, () => null)
  const setRate = useCallback((next: number | null) => {
    setStoredUsdRate(next)
  }, [])
  return [rate, setRate] as const
}
