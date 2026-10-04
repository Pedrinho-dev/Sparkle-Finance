import { db } from '../db/db'
import type { BackupPayload } from '../types/backup'
import type { Budget, BudgetClassification, Category, Expense, Income, Investment, MonthRecord, AppSetting, SyncableRecord } from '../types/domain'
import { CLASSIFICATIONS } from '../types/domain'
import { nowIso, updatePendingCount } from './syncableRepository'
import { isInvestmentCategory } from '../utils/validation'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isSyncableRecord(value: unknown): value is SyncableRecord {
  if (!isRecord(value)) return false
  return isString(value.id) && isString(value.userId) && isString(value.createdAt) && isString(value.updatedAt) && (value.deletedAt === null || isString(value.deletedAt))
    && (value.syncStatus === 'pending' || value.syncStatus === 'synced' || value.syncStatus === 'error')
}

function parseArray(value: unknown): SyncableRecord[] {
  if (!Array.isArray(value) || !value.every(isSyncableRecord)) throw new Error('Backup inválido: registros incompletos.')
  return value
}

export async function createBackup(userId: string): Promise<BackupPayload> {
  const [users, incomes, months, budgets, expenses, investments, categories, settings, syncQueue, syncMeta] = await Promise.all([
    db.users.where('userId').equals(userId).toArray(),
    db.incomes.where('userId').equals(userId).toArray(),
    db.months.where('userId').equals(userId).toArray(),
    db.budgets.where('userId').equals(userId).toArray(),
    db.expenses.where('userId').equals(userId).toArray(),
    db.investments.where('userId').equals(userId).toArray(),
    db.categories.where('userId').equals(userId).toArray(),
    db.settings.where('userId').equals(userId).toArray(),
    db.syncQueue.where('userId').equals(userId).toArray(),
    db.syncMeta.get('global')
  ])
  return { format: 'sparkle-finance-backup', version: 1, exportedAt: nowIso(), users, incomes, months, budgets, expenses, investments, categories, settings, syncQueue, syncMeta: syncMeta ?? null }
}

export function downloadText(filename: string, content: string, type: string): void {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function importBackup(userId: string, raw: unknown): Promise<number> {
  if (!isRecord(raw) || !['sparkle-finance-backup', 'sparkle-racing-finance-backup'].includes(String(raw.format)) || raw.version !== 1) throw new Error('Arquivo de backup incompatível.')
  const collections = {
    users: parseArray(raw.users),
    incomes: parseArray(raw.incomes),
    months: parseArray(raw.months),
    budgets: parseArray(raw.budgets),
    expenses: parseArray(raw.expenses),
    investments: parseArray(raw.investments ?? []),
    categories: parseArray(raw.categories),
    settings: parseArray(raw.settings)
  }
  const currentProfile = await db.users.get(userId)
  if (!currentProfile) throw new Error('Conta local não encontrada.')
  const budgets: Budget[] = collections.budgets.filter(isBudget).map((record) => ({ ...record, userId, syncStatus: 'pending' as const }))
  const budgetIds = new Set(budgets.map((budget) => budget.id))
  const expenses: Expense[] = collections.expenses.filter(isExpense).filter((record) => budgetIds.has(record.budgetId)).map((record) => ({ ...record, userId, syncStatus: 'pending' as const }))
  const investments: Investment[] = collections.investments.filter(isInvestment).map((record) => ({ ...record, userId, syncStatus: 'pending' as const }))
  const incomes: Income[] = collections.incomes.filter(isIncome).map((record) => ({ ...record, userId, syncStatus: 'pending' as const }))
  const months: MonthRecord[] = collections.months.filter(isMonth).map((record) => ({ ...record, userId, syncStatus: 'pending' as const }))
  const categories: Category[] = collections.categories.filter(isCategory).map((record) => ({ ...record, userId, syncStatus: 'pending' as const }))
  const settings: AppSetting[] = collections.settings.filter(isSetting).map((record) => ({ ...record, userId, syncStatus: 'pending' as const }))
  const allRecords: SyncableRecord[] = [...budgets, ...expenses, ...investments, ...incomes, ...months, ...categories, ...settings]
  await db.transaction('rw', [db.budgets, db.expenses, db.investments, db.incomes, db.months, db.categories, db.settings, db.syncQueue], async () => {
    await db.budgets.bulkPut(budgets)
    await db.expenses.bulkPut(expenses)
    await db.investments.bulkPut(investments)
    await db.incomes.bulkPut(incomes)
    await db.months.bulkPut(months)
    await db.categories.bulkPut(categories)
    await db.settings.bulkPut(settings)
    for (const record of allRecords) {
      const entity = entityFor(record)
      await db.syncQueue.put({ id: `${entity}:${record.id}`, userId, entity, recordId: record.id, operation: 'upsert', payload: record, queuedAt: nowIso(), attempts: 0, lastAttemptAt: null, lastError: null })
    }
  })
  await updatePendingCount()
  return allRecords.length
}

function entityFor(record: SyncableRecord): 'users' | 'incomes' | 'months' | 'budgets' | 'expenses' | 'investments' | 'categories' | 'settings' {
  if ('amountCents' in record && 'budgetId' in record) return 'expenses'
  if ('investedCents' in record && 'currentValueCents' in record) return 'investments'
  if ('plannedAmountCents' in record) return 'budgets'
  if ('amountCents' in record) return 'incomes'
  if ('classification' in record) return 'budgets'
  if ('month' in record && 'year' in record) return 'months'
  if ('key' in record) return 'settings'
  if ('name' in record) return 'categories'
  return 'users'
}

function isBudget(record: SyncableRecord): record is Budget {
  return 'plannedAmountCents' in record && typeof record.plannedAmountCents === 'number' && Number.isSafeInteger(record.plannedAmountCents) && record.plannedAmountCents >= 0 && isClassification(record.classification) && isString(record.name) && isString(record.observation) && validMonthYear(record.month, record.year)
}

function isExpense(record: SyncableRecord): record is Expense {
  return 'budgetId' in record && typeof record.budgetId === 'string' && typeof record.amountCents === 'number' && Number.isSafeInteger(record.amountCents) && record.amountCents >= 0 && isString(record.description) && isString(record.date) && /^\d{4}-\d{2}-\d{2}$/.test(record.date) && isString(record.observation)
}

function isInvestment(record: SyncableRecord): record is Investment {
  return 'investedCents' in record && 'currentValueCents' in record && typeof record.investedCents === 'number' && Number.isSafeInteger(record.investedCents) && record.investedCents > 0 && typeof record.currentValueCents === 'number' && Number.isSafeInteger(record.currentValueCents) && record.currentValueCents >= 0 && isString(record.name) && isInvestmentCategory(record.category) && isString(record.date) && /^\d{4}-\d{2}-\d{2}$/.test(record.date) && isString(record.observation)
}

function isIncome(record: SyncableRecord): record is Income {
  return 'amountCents' in record && !('budgetId' in record) && 'month' in record && typeof record.amountCents === 'number' && Number.isSafeInteger(record.amountCents) && record.amountCents >= 0 && validMonthYear(record.month, record.year)
}

function isMonth(record: SyncableRecord): record is MonthRecord {
  return 'month' in record && 'year' in record && !('amountCents' in record) && !('plannedAmountCents' in record) && validMonthYear(record.month, record.year)
}

function isCategory(record: SyncableRecord): record is Category {
  return 'name' in record && !('plannedAmountCents' in record) && !('classification' in record)
}

function isSetting(record: SyncableRecord): record is AppSetting {
  return 'key' in record && typeof record.key === 'string'
}

function isClassification(value: unknown): value is BudgetClassification {
  return typeof value === 'string' && (CLASSIFICATIONS as readonly string[]).includes(value)
}

function validMonthYear(month: unknown, year: unknown): month is number {
  return typeof month === 'number' && Number.isInteger(month) && month >= 1 && month <= 12 && typeof year === 'number' && Number.isInteger(year) && year >= 2000 && year <= 2200
}

export function backupToJson(backup: BackupPayload): string {
  return JSON.stringify(backup, null, 2)
}

export function csvEscape(value: string): string {
  return `"${value.replaceAll('"', '""')}"`
}
