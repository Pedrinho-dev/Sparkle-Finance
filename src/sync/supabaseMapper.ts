import type { Budget, Expense, Income, Investment, MonthRecord, SyncEntity, SyncableRecord, UserProfile, Category, AppSetting, BudgetClassification, InvestmentCategory } from '../types/domain'
import { isBudgetClassification, isInvestmentCategory } from '../utils/validation'

export type RemoteTable = 'profiles' | 'incomes' | 'months' | 'budgets' | 'expenses' | 'investments' | 'categories' | 'settings'
export type RemoteRow = Record<string, unknown>

export function remoteTable(entity: SyncEntity): RemoteTable {
  return entity === 'users' ? 'profiles' : entity
}

export function toRemote(entity: SyncEntity, record: SyncableRecord): RemoteRow {
  const common = { id: record.id, user_id: record.userId, created_at: record.createdAt, updated_at: record.updatedAt, deleted_at: record.deletedAt, sync_status: record.syncStatus }
  if (entity === 'users') {
    const user = record as UserProfile
    return { ...common, email: user.email, display_name: user.displayName }
  }
  if (entity === 'incomes') {
    const income = record as Income
    return { ...common, month: income.month, year: income.year, amount_cents: income.amountCents }
  }
  if (entity === 'months') {
    const month = record as MonthRecord
    return { ...common, month: month.month, year: month.year }
  }
  if (entity === 'budgets') {
    const budget = record as Budget
    return { ...common, name: budget.name, planned_amount_cents: budget.plannedAmountCents, classification: budget.classification, month: budget.month, year: budget.year, observation: budget.observation }
  }
  if (entity === 'expenses') {
    const expense = record as Expense
    return { ...common, budget_id: expense.budgetId, description: expense.description, amount_cents: expense.amountCents, date: expense.date, observation: expense.observation }
  }
  if (entity === 'investments') {
    const investment = record as Investment
    return { ...common, name: investment.name, category: investment.category, invested_cents: investment.investedCents, current_value_cents: investment.currentValueCents, date: investment.date, observation: investment.observation }
  }
  if (entity === 'categories') {
    const category = record as Category
    return { ...common, name: category.name }
  }
  const setting = record as AppSetting
  return { ...common, key: setting.key, value: setting.value }
}

function stringValue(row: RemoteRow, key: string, fallback = ''): string {
  return typeof row[key] === 'string' ? row[key] as string : fallback
}

function nullableString(row: RemoteRow, key: string): string | null {
  return row[key] === null || row[key] === undefined ? null : stringValue(row, key)
}

function numberValue(row: RemoteRow, key: string): number {
  const value = row[key]
  return typeof value === 'number' ? value : Number(value)
}

function commonFromRemote(row: RemoteRow, userId: string): Pick<SyncableRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'syncStatus'> {
  return { id: stringValue(row, 'id'), userId, createdAt: stringValue(row, 'created_at'), updatedAt: stringValue(row, 'updated_at'), deletedAt: nullableString(row, 'deleted_at'), syncStatus: 'synced' }
}

export function fromRemote(entity: SyncEntity, row: RemoteRow, userId: string): SyncableRecord | null {
  const common = commonFromRemote(row, userId)
  if (!common.id || !common.updatedAt) return null
  if (entity === 'users') return { ...common, email: nullableString(row, 'email'), displayName: stringValue(row, 'display_name', 'Minha conta') }
  if (entity === 'incomes') return { ...common, month: numberValue(row, 'month'), year: numberValue(row, 'year'), amountCents: numberValue(row, 'amount_cents') }
  if (entity === 'months') return { ...common, month: numberValue(row, 'month'), year: numberValue(row, 'year') }
  if (entity === 'budgets') {
    const classification = stringValue(row, 'classification')
    if (!isBudgetClassification(classification)) return null
    return { ...common, name: stringValue(row, 'name'), plannedAmountCents: numberValue(row, 'planned_amount_cents'), classification: classification as BudgetClassification, month: numberValue(row, 'month'), year: numberValue(row, 'year'), observation: stringValue(row, 'observation') }
  }
  if (entity === 'expenses') return { ...common, budgetId: stringValue(row, 'budget_id'), description: stringValue(row, 'description'), amountCents: numberValue(row, 'amount_cents'), date: stringValue(row, 'date'), observation: stringValue(row, 'observation') }
  if (entity === 'investments') {
    const category = stringValue(row, 'category')
    if (!isInvestmentCategory(category)) return null
    return { ...common, name: stringValue(row, 'name'), category: category as InvestmentCategory, investedCents: numberValue(row, 'invested_cents'), currentValueCents: numberValue(row, 'current_value_cents'), date: stringValue(row, 'date'), observation: stringValue(row, 'observation') }
  }
  if (entity === 'categories') return { ...common, name: stringValue(row, 'name') }
  return { ...common, key: stringValue(row, 'key'), value: stringValue(row, 'value') }
}
