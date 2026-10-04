import { CLASSIFICATIONS, INVESTMENT_CATEGORIES, type BudgetClassification, type InvestmentCategory } from '../types/domain'

export function isBudgetClassification(value: unknown): value is BudgetClassification {
  return typeof value === 'string' && (CLASSIFICATIONS as readonly string[]).includes(value)
}

export function isInvestmentCategory(value: unknown): value is InvestmentCategory {
  return typeof value === 'string' && (INVESTMENT_CATEGORIES as readonly string[]).includes(value)
}

export function requiredText(value: string, label: string): string {
  const normalized = value.trim()
  if (!normalized) throw new Error(`${label} é obrigatório.`)
  return normalized
}

export function nonNegativeCents(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${label} precisa ser um valor válido.`)
  return value
}

export function positiveCents(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${label} precisa ser maior que zero.`)
  return value
}

export function validPeriod(month: number, year: number): void {
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 2000 || year > 2200) {
    throw new Error('Competência inválida.')
  }
}
