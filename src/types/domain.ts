export const CLASSIFICATIONS = ['Essencial', 'Pessoal', 'Lazer', 'Emergência', 'Outros'] as const
export type BudgetClassification = (typeof CLASSIFICATIONS)[number]

export const INVESTMENT_CATEGORIES = ['Renda fixa', 'Ações', 'Fundos', 'Criptoativos', 'Outros'] as const
export type InvestmentCategory = (typeof INVESTMENT_CATEGORIES)[number]

export const SYNC_STATUSES = ['pending', 'synced', 'error'] as const
export type SyncStatus = (typeof SYNC_STATUSES)[number]
export type SyncState = 'idle' | 'offline' | 'syncing' | 'error' | 'disabled' | 'unauthenticated'
export type SyncEntity = 'users' | 'incomes' | 'months' | 'budgets' | 'expenses' | 'investments' | 'categories' | 'settings'

export interface SyncableEntity {
  id: string
  userId: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncStatus: SyncStatus
}

export interface UserProfile extends SyncableEntity {
  email: string | null
  displayName: string
}

export interface Income extends SyncableEntity {
  month: number
  year: number
  amountCents: number
}

export interface MonthRecord extends SyncableEntity {
  month: number
  year: number
}

export interface Budget extends SyncableEntity {
  name: string
  plannedAmountCents: number
  classification: BudgetClassification
  month: number
  year: number
  observation: string
}

export interface Expense extends SyncableEntity {
  budgetId: string
  description: string
  amountCents: number
  date: string
  observation: string
}

export interface Investment extends SyncableEntity {
  name: string
  category: InvestmentCategory
  investedCents: number
  currentValueCents: number
  date: string
  observation: string
}

export interface Category extends SyncableEntity {
  name: string
}

export interface AppSetting extends SyncableEntity {
  key: string
  value: string
}

export type SyncableRecord = UserProfile | Income | MonthRecord | Budget | Expense | Investment | Category | AppSetting

export interface SyncQueueItem {
  id: string
  userId: string
  entity: SyncEntity
  recordId: string
  operation: 'upsert'
  payload: SyncableRecord
  queuedAt: string
  attempts: number
  lastAttemptAt: string | null
  lastError: string | null
}

export interface SyncMeta {
  id: 'global'
  state: SyncState
  pendingCount: number
  lastSyncedAt: string | null
  lastError: string | null
}

export interface Period {
  month: number
  year: number
}

export interface BudgetSummary extends Budget {
  totalSpentCents: number
  remainingCents: number
  percentage: number
  expenses: Expense[]
}

export interface DashboardSnapshot {
  income: Income | null
  budgets: BudgetSummary[]
  totals: {
    incomeCents: number
    plannedCents: number
    spentCents: number
    availableCents: number
  }
}

export interface InvestmentSummary extends Investment {
  resultCents: number
  profitability: number
}

export interface FinancialSnapshot {
  dashboard: DashboardSnapshot
  investments: InvestmentSummary[]
  totals: {
    investedCents: number
    currentValueCents: number
    resultCents: number
    balanceCents: number
    trackedWealthCents: number
  }
}

export interface HistoryEntry {
  expense: Expense
  budgetName: string
  classification: BudgetClassification | 'Arquivado'
  period: Period
}
