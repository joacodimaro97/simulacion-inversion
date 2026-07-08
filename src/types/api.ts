export type MovementType = 'DEPOSIT' | 'WITHDRAW'
export type InvestmentType =
  | 'FCI'
  | 'MONEY_MARKET'
  | 'STOCK'
  | 'ETF'
  | 'CRYPTO'
  | 'FIXED_TERM'
  | 'BOND'
  | 'OTHER'
export type SimulationType =
  | 'FIXED'
  | 'REAL_HISTORY'
  | 'OPTIMISTIC'
  | 'PESSIMISTIC'
  | 'CUSTOM'

export interface ApiError {
  statusCode: number
  error: string
  message: string
  code?: string
}

export interface User {
  id: string
  name: string
  email: string
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  name: string
  email: string
  password: string
}

export interface Account {
  id: string
  userId: string
  name: string
  description: string | null
  currency: string
  investmentType: InvestmentType
  createdAt: string
  updatedAt: string
}

export interface CreateAccountInput {
  name: string
  description?: string
  currency?: string
  investmentType: InvestmentType
}

export interface UpdateAccountInput {
  name?: string
  description?: string | null
  currency?: string
  investmentType?: InvestmentType
}

export interface Movement {
  id: string
  accountId: string
  type: MovementType
  amount: number
  date: string
  description: string | null
  createdAt: string
}

export interface CreateMovementInput {
  accountId: string
  type: MovementType
  amount: number
  date: string
  description?: string
}

export interface UpdateMovementInput {
  type?: MovementType
  amount?: number
  date?: string
  description?: string | null
}

export interface Performance {
  id: string
  accountId: string
  date: string
  dailyReturnPercent: number
  dailyProfit: number
  shareValue: number
  notes: string | null
  createdAt: string
}

export interface CreatePerformanceInput {
  accountId: string
  date: string
  dailyReturnPercent: number
  dailyProfit: number
  shareValue: number
  notes?: string
}

export interface UpdatePerformanceInput {
  date?: string
  dailyReturnPercent?: number
  dailyProfit?: number
  shareValue?: number
  notes?: string | null
}

export interface MonthlyPerformance {
  year: number
  month: number
  totalReturnPercent: number
  totalProfit: number
  days: number
}

export interface YearlyPerformance {
  year: number
  totalReturnPercent: number
  totalProfit: number
  days: number
}

export interface DayExtreme {
  date: string
  value: number
}

export interface MonthExtreme {
  year: number
  month: number
  returnPercent: number
}

export interface Statistics {
  capitalActual: number
  capitalInvertido: number
  ganancia: number
  rentabilidad: number
  tea: number
  tna: number
  promedioDiario: number
  promedioMensual: number
  volatilidad: number
  desvioEstandar: number
  diasPositivos: number
  diasNegativos: number
  mejorDia: DayExtreme | null
  peorDia: DayExtreme | null
  mejorMes: MonthExtreme | null
  peorMes: MonthExtreme | null
  drawdown: number
  cagr: number
}

export interface SimulationDayResult {
  day: number
  capital: number
  profit: number
  dailyRate: number
}

export interface SimulationOutput {
  simulationType: SimulationType
  capitalInitial: number
  monthlyContribution: number
  years: number
  finalCapital: number
  totalProfit: number
  totalReturn: number
  results: SimulationDayResult[]
}

export interface RunSimulationInput {
  accountId: string
  name?: string
  simulationType: SimulationType
  capitalInitial: number
  monthlyContribution?: number
  annualRate?: number
  years: number
  optimisticMin?: number
  optimisticMax?: number
  pessimisticMin?: number
  pessimisticMax?: number
  customMean?: number
  customStdDev?: number
  customLossProbability?: number
}

export interface SaveSimulationInput extends RunSimulationInput {
  name: string
}

export interface Simulation {
  id: string
  accountId: string
  name: string
  simulationType: SimulationType
  capitalInitial: number
  monthlyContribution: number
  annualRate: number | null
  years: number
  createdAt: string
}

export interface SimulationResultEntry {
  id: string
  simulationId: string
  day: number
  capital: number
  profit: number
  dailyRate: number
}

export interface SimulationWithResults extends Simulation {
  results: SimulationResultEntry[]
}

export interface DateRangeQuery {
  accountId?: string
  startDate?: string
  endDate?: string
}

export interface PerformancePeriodQuery {
  accountId?: string
  year?: number
}
