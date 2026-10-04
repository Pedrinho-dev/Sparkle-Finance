import type { AppSetting, Budget, Category, Expense, Income, Investment, MonthRecord, SyncMeta, SyncQueueItem, UserProfile } from './domain'

export interface BackupPayload {
  format: 'sparkle-finance-backup'
  version: 1
  exportedAt: string
  users: UserProfile[]
  incomes: Income[]
  months: MonthRecord[]
  budgets: Budget[]
  expenses: Expense[]
  investments: Investment[]
  categories: Category[]
  settings: AppSetting[]
  syncQueue: SyncQueueItem[]
  syncMeta: SyncMeta | null
}
