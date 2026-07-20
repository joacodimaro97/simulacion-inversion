import { es } from 'date-fns/locale'
import { format, parseISO } from 'date-fns'
import { totalDaysBetween } from '@/utils/budgets'
import type {
  CashTransaction,
  CashTransactionQuery,
  CashTransactionStats,
  CashTransactionWeekHighlight,
  CashTransactionWeekStats,
} from '@/types/cash'

const DAY_MS = 24 * 60 * 60 * 1000

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Día calendario alineado al backend (mediodía UTC / date-only).
 * `2026-07-20T12:00:00.000Z` → `2026-07-20`
 */
export function toCalendarDateKey(value: string | Date): string {
  if (value instanceof Date) {
    const y = value.getUTCFullYear()
    const m = String(value.getUTCMonth() + 1).padStart(2, '0')
    const d = String(value.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value

  const parsed = new Date(value)
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getUTCFullYear()
    const m = String(parsed.getUTCMonth() + 1).padStart(2, '0')
    const d = String(parsed.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  return value.slice(0, 10)
}

/** Timestamp UTC mediodía del día calendario YYYY-MM-DD. */
function utcNoon(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number)
  return Date.UTC(year!, month! - 1, day!, 12, 0, 0, 0)
}

function formatUTCDateKey(ms: number): string {
  const date = new Date(ms)
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function startOfWeekMondayUTC(dateKey: string): string {
  const noon = utcNoon(dateKey)
  const weekday = new Date(noon).getUTCDay() // 0=dom … 1=lun
  const offsetToMonday = weekday === 0 ? -6 : 1 - weekday
  return formatUTCDateKey(noon + offsetToMonday * DAY_MS)
}

function addDaysUTC(dateKey: string, days: number): string {
  return formatUTCDateKey(utcNoon(dateKey) + days * DAY_MS)
}

function maxDateKey(a: string, b: string): string {
  return a >= b ? a : b
}

function minDateKey(a: string, b: string): string {
  return a <= b ? a : b
}

function formatWeekLabel(weekStart: string, weekEnd: string): string {
  const start = parseISO(weekStart)
  const end = parseISO(weekEnd)
  const sameMonth = start.getUTCMonth() === end.getUTCMonth()
  if (sameMonth) {
    return `${format(start, 'd', { locale: es })}–${format(end, 'd MMM', { locale: es })}`
  }
  return `${format(start, 'd MMM', { locale: es })}–${format(end, 'd MMM', { locale: es })}`
}

function toHighlight(week: CashTransactionWeekStats): CashTransactionWeekHighlight {
  return {
    weekStart: week.weekStart,
    totalExpense: week.totalExpense,
    averageDailyExpense: week.averageDailyExpense,
  }
}

/**
 * Semanas lunes→domingo (UTC) dentro del rango filtrado.
 * Sin startDate+endDate → [].
 */
export function computeWeeklyExpenseStats(
  items: CashTransaction[],
  rangeStart: string,
  rangeEnd: string,
): Pick<
  CashTransactionStats,
  'byWeek' | 'highestExpenseWeek' | 'lowestExpenseWeek'
> {
  const rangeStartKey = toCalendarDateKey(rangeStart)
  const rangeEndKey = toCalendarDateKey(rangeEnd)
  if (rangeEndKey < rangeStartKey) {
    return { byWeek: [], highestExpenseWeek: null, lowestExpenseWeek: null }
  }

  const byWeek: CashTransactionWeekStats[] = []
  let weekMonday = startOfWeekMondayUTC(rangeStartKey)

  while (weekMonday <= rangeEndKey) {
    const weekSunday = addDaysUTC(weekMonday, 6)
    const segmentStart = maxDateKey(weekMonday, rangeStartKey)
    const segmentEnd = minDateKey(weekSunday, rangeEndKey)
    const dayCount = totalDaysBetween(segmentStart, segmentEnd)
    const partial = segmentStart !== weekMonday || segmentEnd !== weekSunday

    let totalExpense = 0
    let totalIncome = 0
    let expenseCount = 0

    for (const tx of items) {
      const dateKey = toCalendarDateKey(tx.date)
      if (dateKey < segmentStart || dateKey > segmentEnd) continue
      if (tx.type === 'INCOME') {
        totalIncome += tx.amount
      } else {
        totalExpense += tx.amount
        expenseCount += 1
      }
    }

    byWeek.push({
      weekStart: segmentStart,
      weekEnd: segmentEnd,
      label: formatWeekLabel(segmentStart, segmentEnd),
      dayCount,
      partial,
      totalExpense: round2(totalExpense),
      totalIncome: round2(totalIncome),
      expenseCount,
      averageDailyExpense: dayCount > 0 ? round2(totalExpense / dayCount) : 0,
    })

    weekMonday = addDaysUTC(weekMonday, 7)
  }

  const weeksWithExpense = byWeek.filter((w) => w.totalExpense > 0)
  if (weeksWithExpense.length === 0) {
    return { byWeek, highestExpenseWeek: null, lowestExpenseWeek: null }
  }

  const compareDesc = (a: CashTransactionWeekStats, b: CashTransactionWeekStats) => {
    if (b.averageDailyExpense !== a.averageDailyExpense) {
      return b.averageDailyExpense - a.averageDailyExpense
    }
    if (b.totalExpense !== a.totalExpense) {
      return b.totalExpense - a.totalExpense
    }
    return b.weekStart.localeCompare(a.weekStart)
  }

  const highest = [...weeksWithExpense].sort(compareDesc)[0]!
  const lowest = [...weeksWithExpense].sort((a, b) => compareDesc(b, a))[0]!

  return {
    byWeek,
    highestExpenseWeek: toHighlight(highest),
    lowestExpenseWeek: toHighlight(lowest),
  }
}

/**
 * Calcula stats del set filtrado (fallback si el backend aún devuelve un array).
 */
export function computeTransactionStats(
  items: CashTransaction[],
  query?: CashTransactionQuery,
): CashTransactionStats {
  let totalIncome = 0
  let totalExpense = 0
  let incomeCount = 0
  let expenseCount = 0
  let minTxDate: string | null = null
  let maxTxDate: string | null = null

  for (const tx of items) {
    const dateKey = toCalendarDateKey(tx.date)
    if (!minTxDate || dateKey < minTxDate) minTxDate = dateKey
    if (!maxTxDate || dateKey > maxTxDate) maxTxDate = dateKey

    if (tx.type === 'INCOME') {
      totalIncome += tx.amount
      incomeCount += 1
    } else {
      totalExpense += tx.amount
      expenseCount += 1
    }
  }

  const startDate = query?.startDate || minTxDate
  const endDate = query?.endDate || maxTxDate
  const totalDays =
    startDate && endDate ? totalDaysBetween(startDate, endDate) : 0

  const weekly =
    query?.startDate && query?.endDate
      ? computeWeeklyExpenseStats(items, query.startDate, query.endDate)
      : { byWeek: [], highestExpenseWeek: null, lowestExpenseWeek: null }

  return {
    totalIncome: round2(totalIncome),
    totalExpense: round2(totalExpense),
    net: round2(totalIncome - totalExpense),
    transactionCount: items.length,
    incomeCount,
    expenseCount,
    startDate,
    endDate,
    totalDays,
    averageDailyExpense: totalDays > 0 ? round2(totalExpense / totalDays) : 0,
    averageDailyIncome: totalDays > 0 ? round2(totalIncome / totalDays) : 0,
    ...weekly,
  }
}

/**
 * Prioriza el desglose semanal calculado desde `items` (misma fuente que la tabla).
 * Evita mostrar byWeek en 0 cuando el total de gastos sí tiene monto.
 */
export function ensureWeeklyStats(
  stats: CashTransactionStats,
  items: CashTransaction[],
  query?: CashTransactionQuery,
): CashTransactionStats {
  if (!query?.startDate || !query?.endDate) {
    return {
      ...stats,
      byWeek: [],
      highestExpenseWeek: null,
      lowestExpenseWeek: null,
    }
  }

  return {
    ...stats,
    ...computeWeeklyExpenseStats(items, query.startDate, query.endDate),
  }
}
