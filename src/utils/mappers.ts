import type { SimulationType } from '@/types/api'

export type UiSimulationModel =
  | 'fixed_rate'
  | 'custom_daily'
  | 'optimistic'
  | 'pessimistic'
  | 'custom_distribution'
  | 'historical'

export function mapUiModelToSimulationType(model: UiSimulationModel): SimulationType {
  switch (model) {
    case 'fixed_rate':
      return 'FIXED'
    case 'historical':
      return 'REAL_HISTORY'
    case 'optimistic':
      return 'OPTIMISTIC'
    case 'pessimistic':
      return 'PESSIMISTIC'
    case 'custom_daily':
    case 'custom_distribution':
      return 'CUSTOM'
  }
}

export function mapSimulationTypeToUi(type: SimulationType): UiSimulationModel {
  switch (type) {
    case 'FIXED':
      return 'fixed_rate'
    case 'REAL_HISTORY':
      return 'historical'
    case 'OPTIMISTIC':
      return 'optimistic'
    case 'PESSIMISTIC':
      return 'pessimistic'
    case 'CUSTOM':
      return 'custom_distribution'
  }
}

export function percentToDecimal(value: number): number {
  return value / 100
}

export function decimalToPercent(value: number): number {
  return value * 100
}

export function toIsoDate(date: string): string {
  if (date.includes('T')) return date
  return date
}

export function formatMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

export function buildDistributionBuckets(
  values: number[],
  buckets = 10,
): { range: string; count: number }[] {
  if (values.length === 0) return []

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 0.01
  const bucketSize = range / buckets

  return Array.from({ length: buckets }, (_, i) => {
    const bucketMin = min + i * bucketSize
    const bucketMax = bucketMin + bucketSize
    const count = values.filter(
      (v) => v >= bucketMin && (i === buckets - 1 ? v <= bucketMax : v < bucketMax),
    ).length
    return {
      range: `${bucketMin.toFixed(2)}%`,
      count,
    }
  })
}
