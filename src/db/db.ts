import Dexie, { type Table } from 'dexie'
import type { AppSetting, Budget, Category, Expense, Income, Investment, MonthRecord, SyncMeta, SyncQueueItem, UserProfile } from '../types/domain'

export class FinanceDatabase extends Dexie {
  users!: Table<UserProfile, string>
  incomes!: Table<Income, string>
  months!: Table<MonthRecord, string>
  budgets!: Table<Budget, string>
  expenses!: Table<Expense, string>
  investments!: Table<Investment, string>
  categories!: Table<Category, string>
  settings!: Table<AppSetting, string>
  syncQueue!: Table<SyncQueueItem, string>
  syncMeta!: Table<SyncMeta, string>

  constructor() {
    super('sparkle-racing-finance')
    this.version(1).stores({
      users: 'id, userId, updatedAt',
      incomes: 'id, userId, [userId+year+month], updatedAt',
      months: 'id, userId, [userId+year+month], updatedAt',
      budgets: 'id, userId, [userId+year+month], updatedAt',
      expenses: 'id, userId, budgetId, date, updatedAt',
      categories: 'id, userId, updatedAt',
      settings: 'id, userId, [userId+key], updatedAt',
      syncQueue: 'id, userId, [entity+recordId], queuedAt',
      syncMeta: 'id'
    })
    this.version(2).stores({
      users: 'id, userId, updatedAt',
      incomes: 'id, userId, [userId+year+month], updatedAt',
      months: 'id, userId, [userId+year+month], updatedAt',
      budgets: 'id, userId, [userId+year+month], updatedAt',
      expenses: 'id, userId, budgetId, date, updatedAt',
      investments: 'id, userId, date, updatedAt',
      categories: 'id, userId, updatedAt',
      settings: 'id, userId, [userId+key], updatedAt',
      syncQueue: 'id, userId, [entity+recordId], queuedAt',
      syncMeta: 'id'
    })
  }
}

export const db = new FinanceDatabase()
