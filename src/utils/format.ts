import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatCurrencyPrecise(value: number, decimals = 2): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/** Formatea un monto según la moneda de la cuenta (ARS por defecto). */
export function formatCurrencyFor(
  value: number,
  currency: string | null | undefined = 'ARS',
  decimals?: number,
): string {
  const code = currency || 'ARS'
  const fractionDigits =
    decimals === undefined
      ? { minimumFractionDigits: 0, maximumFractionDigits: 2 }
      : { minimumFractionDigits: decimals, maximumFractionDigits: decimals }
  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: code,
      ...fractionDigits,
    }).format(value)
  } catch {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      ...fractionDigits,
    }).format(value)
  }
}

export function formatPercent(value: number, decimals = 2): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(decimals)}%`
}

/** Formatea ratios decimales del backend (0.59 → 59%) */
export function formatRatio(value: number, decimals = 2): string {
  return formatPercent(value * 100, decimals)
}

export function formatMonthFromApi(year: number, month: number): string {
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${months[month - 1] ?? month} ${year}`
}

export function formatShareValue(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 6,
    maximumFractionDigits: 6,
  }).format(value)
}

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: es })
  } catch {
    return dateStr
  }
}

export function formatMonth(monthStr: string): string {
  try {
    return format(parseISO(`${monthStr}-01`), 'MMM yyyy', { locale: es })
  } catch {
    return monthStr
  }
}

export function parseLocalNumber(value: string): number {
  const cleaned = value.replace(/\./g, '').replace(',', '.')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]!
}
