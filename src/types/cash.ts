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
  createdAt: string
}

export interface CreateCashTransactionInput {
  cashAccountId: string
  categoryId: string
  type: CashTransactionType
  amount: number
  date: string
  description?: string
}

export interface UpdateCashTransactionInput {
  cashAccountId?: string
  categoryId?: string
  type?: CashTransactionType
  amount?: number
  date?: string
  description?: string | null
}

export interface CashTransactionQuery {
  cashAccountId?: string
  categoryId?: string
  type?: CashTransactionType
  startDate?: string
  endDate?: string
  excludeTransfers?: boolean
  excludeFundings?: boolean
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
  balance: number
  byCategory: CashSummaryByCategory[]
  byParentCategory: CashSummaryByParentCategory[]
}
