export type CreditDirection = 'OWED_BY_ME' | 'OWED_TO_ME'
export type CreditStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
export type InstallmentStatus = 'PENDING' | 'PAID'

export interface CreditCashAccountRef {
  id: string
  name: string
  currency: string
}

export interface CreditInstallment {
  id: string
  creditId: string
  number: number
  dueDate: string
  amount: number
  status: InstallmentStatus
  paidAt: string | null
  cashAccountId: string | null
  overdue: boolean
  transactionId: string | null
  createdAt: string
  updatedAt: string
}

export interface CreditTotals {
  paidAmount: number
  pendingAmount: number
  paidCount: number
  pendingCount: number
  nextDueDate: string | null
  overdueAmount: number
  overdueCount: number
}

export interface CreditWithDetails {
  id: string
  userId: string
  name: string
  description: string | null
  counterparty: string | null
  direction: CreditDirection
  currency: string
  principal: number
  installmentCount: number
  installmentAmount: number
  startDate: string
  status: CreditStatus
  defaultCashAccountId: string | null
  createdAt: string
  updatedAt: string
  defaultCashAccount: CreditCashAccountRef | null
  installments: CreditInstallment[]
  totals: CreditTotals
}

export interface CalendarInstallmentItem {
  installmentId: string
  creditId: string
  creditName: string
  counterparty: string | null
  direction: CreditDirection
  currency: string
  number: number
  dueDate: string
  amount: number
  status: InstallmentStatus
  paidAt: string | null
  overdue: boolean
}

export interface CreditDirectionSummary {
  totalPending: number
  totalOverdue: number
  activeCredits: number
}

export interface CreditsSummary {
  owedByMe: CreditDirectionSummary
  owedToMe: CreditDirectionSummary
  upcoming: CalendarInstallmentItem[]
}

export interface CreditListQuery {
  direction?: CreditDirection
  status?: CreditStatus
  currency?: string
}

export interface CreditCalendarQuery {
  startDate: string
  endDate: string
  direction?: CreditDirection
  status?: CreditStatus
}

export interface CreateCreditInput {
  name: string
  description?: string
  counterparty?: string
  direction: CreditDirection
  currency?: string
  principal: number
  installmentCount: number
  startDate: string
  dueDates?: string[]
  defaultCashAccountId?: string | null
}

export interface UpdateCreditInput {
  name?: string
  description?: string | null
  counterparty?: string | null
  defaultCashAccountId?: string | null
}

export interface RescheduleInstallmentInput {
  dueDate: string
}

export interface PayInstallmentInput {
  cashAccountId: string
  date?: string
  description?: string
}
