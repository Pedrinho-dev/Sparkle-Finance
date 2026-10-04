import { db } from '../db/db'
import type { Budget, BudgetClassification, BudgetSummary, DashboardSnapshot, Expense, FinancialSnapshot, HistoryEntry, Income, Investment, InvestmentCategory, InvestmentSummary, MonthRecord, Period } from '../types/domain'
import { baseRecord, markLocalDeleted, nowIso, persistSyncable } from './syncableRepository'
import { createId } from '../utils/ids'
import { currentPeriod, previousPeriod } from '../utils/date'
import { isInvestmentCategory, nonNegativeCents, positiveCents, requiredText, validPeriod } from '../utils/validation'
import { percentageChange, percentageOf } from '../utils/money'

async function ensureMonth(userId: string, period: Period): Promise<MonthRecord> {
  validPeriod(period.month, period.year)
  const existing = await db.months.where('[userId+year+month]').equals([userId, period.year, period.month]).first()
  if (existing && !existing.deletedAt) return existing
  const record: MonthRecord = { ...baseRecord(userId, existing), month: period.month, year: period.year }
  await persistSyncable(db.months, 'months', record)
  return record
}

export async function listBudgets(userId: string, period: Period): Promise<Budget[]> {
  return db.budgets.where('[userId+year+month]').equals([userId, period.year, period.month]).filter((budget) => !budget.deletedAt).sortBy('name')
}

export async function listExpensesForBudget(userId: string, budgetId: string): Promise<Expense[]> {
  return db.expenses.where('budgetId').equals(budgetId).filter((expense) => expense.userId === userId && !expense.deletedAt).sortBy('date')
}

export async function getDashboard(userId: string, period: Period): Promise<DashboardSnapshot> {
  const [budgets, income] = await Promise.all([
    listBudgets(userId, period),
    db.incomes.where('[userId+year+month]').equals([userId, period.year, period.month]).filter((item) => !item.deletedAt).first()
  ])
  const summaries: BudgetSummary[] = []
  for (const budget of budgets) {
    const expenses = await listExpensesForBudget(userId, budget.id)
    const totalSpentCents = expenses.reduce((total, expense) => total + expense.amountCents, 0)
    summaries.push({
      ...budget,
      totalSpentCents,
      remainingCents: budget.plannedAmountCents - totalSpentCents,
      percentage: percentageOf(totalSpentCents, budget.plannedAmountCents),
      expenses
    })
  }
  const plannedCents = summaries.reduce((total, budget) => total + budget.plannedAmountCents, 0)
  const spentCents = summaries.reduce((total, budget) => total + budget.totalSpentCents, 0)
  const incomeCents = income?.amountCents ?? 0
  return { income: income ?? null, budgets: summaries, totals: { incomeCents, plannedCents, spentCents, availableCents: incomeCents - spentCents } }
}

export async function saveIncome(userId: string, period: Period, amountCents: number): Promise<void> {
  await ensureMonth(userId, period)
  nonNegativeCents(amountCents, 'Renda')
  const existing = await db.incomes.where('[userId+year+month]').equals([userId, period.year, period.month]).first()
  const income: Income = { ...baseRecord(userId, existing), month: period.month, year: period.year, amountCents }
  await persistSyncable(db.incomes, 'incomes', income)
}

export async function saveBudget(input: {
  userId: string
  id?: string
  name: string
  plannedAmountCents: number
  classification: BudgetClassification
  period: Period
  observation: string
}): Promise<void> {
  await ensureMonth(input.userId, input.period)
  const existing = input.id ? await db.budgets.get(input.id) : undefined
  if (existing && existing.userId !== input.userId) throw new Error('Orçamento não pertence a esta conta.')
  const budget: Budget = {
    ...baseRecord(input.userId, existing),
    name: requiredText(input.name, 'Nome do orçamento'),
    plannedAmountCents: nonNegativeCents(input.plannedAmountCents, 'Valor planejado'),
    classification: input.classification,
    month: input.period.month,
    year: input.period.year,
    observation: input.observation.trim()
  }
  await persistSyncable(db.budgets, 'budgets', budget)
}

export async function deleteBudget(userId: string, budgetId: string): Promise<void> {
  const budget = await db.budgets.get(budgetId)
  if (!budget || budget.userId !== userId || budget.deletedAt) return
  await markLocalDeleted(db.budgets, 'budgets', budget)
}

export async function saveExpense(input: {
  userId: string
  id?: string
  budgetId: string
  description: string
  amountCents: number
  date: string
  observation: string
}): Promise<void> {
  const budget = await db.budgets.get(input.budgetId)
  if (!budget || budget.userId !== input.userId || budget.deletedAt) throw new Error('Selecione um orçamento ativo.')
  const existing = input.id ? await db.expenses.get(input.id) : undefined
  if (existing && existing.userId !== input.userId) throw new Error('Gasto não pertence a esta conta.')
  const date = input.date.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Data do gasto inválida.')
  const expense: Expense = {
    ...baseRecord(input.userId, existing),
    budgetId: input.budgetId,
    description: requiredText(input.description, 'Descrição do gasto'),
    amountCents: nonNegativeCents(input.amountCents, 'Valor do gasto'),
    date,
    observation: input.observation.trim()
  }
  await persistSyncable(db.expenses, 'expenses', expense)
}

export async function deleteExpense(userId: string, expenseId: string): Promise<void> {
  const expense = await db.expenses.get(expenseId)
  if (!expense || expense.userId !== userId || expense.deletedAt) return
  await markLocalDeleted(db.expenses, 'expenses', expense)
}

export async function listInvestments(userId: string): Promise<Investment[]> {
  return db.investments.where('userId').equals(userId).filter((investment) => !investment.deletedAt).sortBy('date')
}

export async function getFinancialSnapshot(userId: string, period: Period): Promise<FinancialSnapshot> {
  const [dashboard, investments] = await Promise.all([getDashboard(userId, period), listInvestments(userId)])
  const summaries: InvestmentSummary[] = investments.map((investment) => {
    const resultCents = investment.currentValueCents - investment.investedCents
    return { ...investment, resultCents, profitability: percentageChange(investment.currentValueCents, investment.investedCents) }
  }).sort((first, second) => second.resultCents - first.resultCents)
  const investedCents = summaries.reduce((total, investment) => total + investment.investedCents, 0)
  const currentValueCents = summaries.reduce((total, investment) => total + investment.currentValueCents, 0)
  const resultCents = currentValueCents - investedCents
  const balanceCents = dashboard.totals.availableCents
  return { dashboard, investments: summaries, totals: { investedCents, currentValueCents, resultCents, balanceCents, trackedWealthCents: balanceCents + currentValueCents } }
}

export async function saveInvestment(input: {
  userId: string
  id?: string
  name: string
  category: InvestmentCategory
  investedCents: number
  currentValueCents: number
  date: string
  observation: string
}): Promise<void> {
  const existing = input.id ? await db.investments.get(input.id) : undefined
  if (existing && existing.userId !== input.userId) throw new Error('Investimento não pertence a esta conta.')
  if (!isInvestmentCategory(input.category)) throw new Error('Categoria do investimento inválida.')
  const date = input.date.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Data do investimento inválida.')
  const investment: Investment = {
    ...baseRecord(input.userId, existing),
    name: requiredText(input.name, 'Nome do investimento'),
    category: input.category,
    investedCents: positiveCents(input.investedCents, 'Valor investido'),
    currentValueCents: nonNegativeCents(input.currentValueCents, 'Valor atual'),
    date,
    observation: input.observation.trim()
  }
  await persistSyncable(db.investments, 'investments', investment)
}

export async function deleteInvestment(userId: string, investmentId: string): Promise<void> {
  const investment = await db.investments.get(investmentId)
  if (!investment || investment.userId !== userId || investment.deletedAt) return
  await markLocalDeleted(db.investments, 'investments', investment)
}

export async function copyPreviousBudgets(userId: string, target: Period): Promise<number> {
  const source = previousPeriod(target)
  const [sourceBudgets, targetBudgets] = await Promise.all([listBudgets(userId, source), listBudgets(userId, target)])
  const existingKeys = new Set(targetBudgets.map((budget) => `${budget.name.toLowerCase()}|${budget.classification}`))
  let copied = 0
  for (const sourceBudget of sourceBudgets) {
    const key = `${sourceBudget.name.toLowerCase()}|${sourceBudget.classification}`
    if (existingKeys.has(key)) continue
    await saveBudget({ userId, name: sourceBudget.name, plannedAmountCents: sourceBudget.plannedAmountCents, classification: sourceBudget.classification, period: target, observation: sourceBudget.observation })
    existingKeys.add(key)
    copied += 1
  }
  await ensureMonth(userId, target)
  return copied
}

export async function ensureDefaultCategories(userId: string): Promise<void> {
  const names = ['Essencial', 'Pessoal', 'Lazer', 'Emergência', 'Outros']
  const existing = await db.categories.where('userId').equals(userId).filter((category) => !category.deletedAt).toArray()
  const existingNames = new Set(existing.map((category) => category.name))
  for (const name of names) {
    if (existingNames.has(name)) continue
    const now = nowIso()
    await persistSyncable(db.categories, 'categories', { id: createId(), userId, name, createdAt: now, updatedAt: now, deletedAt: null, syncStatus: 'pending' })
  }
}

export async function listHistory(userId: string, query = ''): Promise<HistoryEntry[]> {
  const [expenses, budgets] = await Promise.all([
    db.expenses.where('userId').equals(userId).filter((expense) => !expense.deletedAt).toArray(),
    db.budgets.where('userId').equals(userId).toArray()
  ])
  const budgetMap = new Map(budgets.map((budget) => [budget.id, budget]))
  const normalizedQuery = query.trim().toLocaleLowerCase()
  return expenses
    .map((expense) => {
      const budget = budgetMap.get(expense.budgetId)
      return { expense, budgetName: budget?.name ?? 'Orçamento arquivado', classification: budget?.classification ?? ('Arquivado' as const), period: { month: Number(expense.date.slice(5, 7)), year: Number(expense.date.slice(0, 4)) } }
    })
    .filter((entry) => !normalizedQuery || `${entry.expense.description} ${entry.budgetName} ${entry.classification}`.toLocaleLowerCase().includes(normalizedQuery))
    .sort((a, b) => b.expense.date.localeCompare(a.expense.date))
}

export async function ensureAppMonth(userId: string): Promise<Period> {
  const period = currentPeriod()
  await ensureMonth(userId, period)
  return period
}
