export type CashTransactionType = 'INCOME' | 'EXPENSE'

export interface CashAccount {
  id: string
  userId: string
  name: string
  description: string | null
  currency: string
  openingBalance: number
  createdAt: string
  updatedAt: string
}

export interface CreateCashAccountInput {
  name: string
  description?: string
  currency?: string
  openingBalance?: number
}

export interface UpdateCashAccountInput {
  name?: string
  description?: string | null
  currency?: string
  openingBalance?: number
}

export interface Category {
  id: string
  userId: string
  parentId: string | null
  name: string
  type: CashTransactionType
  color: string | null
  icon: string | null
  createdAt: string
}

export interface CategoryTreeNode extends Category {
  children: Category[]
}

export interface CreateCategoryInput {
  name: string
  type: CashTransactionType
  parentId?: string | null
  color?: string
  icon?: string
}

export interface UpdateCategoryInput {
  name?: string
  type?: CashTransactionType
  parentId?: string | null
  color?: string | null
  icon?: string | null
}

export interface CategoryQuery {
  type?: CashTransactionType
  parentId?: string
  rootsOnly?: boolean
  tree?: boolean
}

export interface CashTransaction {
  id: string
  cashAccountId: string
  categoryId: string
  type: CashTransactionType
  amount: number
  date: string
  description: string | null
  transferId: string | null
  fundingId: string | null
  /** Presente si la transacción fue generada al pagar una cuota de crédito. */
  creditInstallmentId?: string | null
  relatedExpenseId?: string | null
  createdAt: string
}

export interface CreateCashTransactionInput {
  cashAccountId: string
  categoryId?: string
  type: CashTransactionType
  amount: number
  date: string
  description?: string
  relatedExpenseId?: string
}

export interface UpdateCashTransactionInput {
  cashAccountId?: string
  categoryId?: string
  type?: CashTransactionType
  amount?: number
  date?: string
  description?: string | null
  relatedExpenseId?: string | null
}

export interface CashTransactionQuery {
  cashAccountId?: string
  categoryId?: string
  categoryIds?: string[]
  type?: CashTransactionType
  startDate?: string
  endDate?: string
  excludeTransfers?: boolean
  excludeFundings?: boolean
}

export interface CashTransactionWeekStats {
  weekStart: string
  weekEnd: string
  label: string
  dayCount: number
  partial: boolean
  totalExpense: number
  totalIncome: number
  expenseCount: number
  averageDailyExpense: number
}

export interface CashTransactionWeekHighlight {
  weekStart: string
  totalExpense: number
  averageDailyExpense: number
}

export interface CashTransactionStats {
  totalIncome: number
  totalExpense: number
  net: number
  transactionCount: number
  incomeCount: number
  expenseCount: number
  startDate: string | null
  endDate: string | null
  totalDays: number
  averageDailyExpense: number
  averageDailyIncome: number
  byWeek: CashTransactionWeekStats[]
  highestExpenseWeek: CashTransactionWeekHighlight | null
  lowestExpenseWeek: CashTransactionWeekHighlight | null
}

export interface CashTransactionListResponse {
  items: CashTransaction[]
  stats: CashTransactionStats
}

export type FundingType = 'CASH_TO_INVESTMENT' | 'INVESTMENT_TO_CASH'

export interface CashTransferAccountRef {
  id: string
  name: string
  currency: string
}

export interface CashTransfer {
  id: string
  userId: string
  fromCashAccountId: string
  toCashAccountId: string
  amount: number
  date: string
  description: string | null
  createdAt: string
  fromAccount: CashTransferAccountRef
  toAccount: CashTransferAccountRef
  outTransactionId: string
  inTransactionId: string
}

export interface CreateCashTransferInput {
  fromCashAccountId: string
  toCashAccountId: string
  amount: number
  date: string
  description?: string
}

export interface CashTransferQuery {
  cashAccountId?: string
  startDate?: string
  endDate?: string
}

export interface FundingAccountRef {
  id: string
  name: string
  currency: string
}

export interface FundingInvestmentAccountRef extends FundingAccountRef {
  investmentType: string
}

export interface AccountFunding {
  id: string
  userId: string
  type: FundingType
  cashAccountId: string
  investmentAccountId: string
  amount: number
  date: string
  description: string | null
  createdAt: string
  cashAccount: FundingAccountRef
  investmentAccount: FundingInvestmentAccountRef
  cashTransactionId: string
  investmentMovementId: string
}

export interface CreateFundingInput {
  type: FundingType
  cashAccountId: string
  investmentAccountId: string
  amount: number
  date: string
  description?: string
}

export interface FundingQuery {
  cashAccountId?: string
  investmentAccountId?: string
  type?: FundingType
  startDate?: string
  endDate?: string
}

export interface CashSummaryQuery {
  cashAccountId?: string
  year?: number
  month?: number
}

export interface CashSummaryByCategory {
  categoryId: string
  categoryName: string
  parentCategoryId: string | null
  parentCategoryName: string | null
  type: CashTransactionType
  total: number
  count: number
}

export interface CashSummaryByParentCategory {
  categoryId: string
  categoryName: string
  type: CashTransactionType
  total: number
  count: number
}

export interface CashSummary {
  openingBalance: number
  totalIncome: number
  totalExpense: number
  totalExpenseNet: number
  totalReimbursed: number
  balance: number
  byCategory: CashSummaryByCategory[]
  byParentCategory: CashSummaryByParentCategory[]
}

export type BudgetStatus =
  | 'NOT_STARTED'
  | 'ON_TRACK'
  | 'UNDER_BUDGET'
  | 'OVER_BUDGET'
  | 'COMPLETED'

export interface BudgetAnalysis {
  totalDays: number
  daysElapsed: number
  daysRemaining: number
  dailyAllowance: number
  spent: number
  remaining: number
  expectedToDate: number
  difference: number
  suggestedDailyRemaining: number
  averageDailySpent: number
  projectedTotal: number
  percentUsed: number
  overspent: boolean
  status: BudgetStatus
}

export interface BudgetCashAccountRef {
  id: string
  name: string
  currency: string
}

export interface BudgetCategoryRef {
  id: string
  name: string
  type: CashTransactionType
  color: string | null
  parentId: string | null
}

export interface Budget {
  id: string
  userId: string
  cashAccountId: string | null
  name: string
  amount: number
  startDate: string
  endDate: string
  categoryIds: string[]
  createdAt: string
  updatedAt: string
  cashAccount: BudgetCashAccountRef | null
  categories: BudgetCategoryRef[]
  analysis: BudgetAnalysis
}

export interface CreateBudgetInput {
  name: string
  endDate: string
  startDate?: string
  amount?: number
  cashAccountId?: string | null
  categoryIds?: string[]
}

export interface UpdateBudgetInput {
  name?: string
  amount?: number
  startDate?: string
  endDate?: string
  cashAccountId?: string | null
  categoryIds?: string[]
}
