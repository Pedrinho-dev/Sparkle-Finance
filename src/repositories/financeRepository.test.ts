import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db/db'
import { copyPreviousBudgets, deleteExpense, getDashboard, saveBudget, saveExpense, saveIncome } from './financeRepository'

const userId = 'user-test'
const period = { month: 9, year: 2026 }

describe('finance local persistence and derived totals', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    await db.users.put({ id: userId, userId, email: null, displayName: 'Teste', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), deletedAt: null, syncStatus: 'pending' })
  })

  it('stores cents, derives totals, and queues local writes as pending', async () => {
    await saveIncome(userId, period, 20000)
    await saveBudget({ userId, name: 'Moradia', plannedAmountCents: 15000, classification: 'Essencial', period, observation: '' })
    const budget = await db.budgets.where('userId').equals(userId).first()
    expect(budget?.plannedAmountCents).toBe(15000)
    if (!budget) throw new Error('budget missing')
    await saveExpense({ userId, budgetId: budget.id, description: 'Aluguel', amountCents: 11568, date: '2026-09-05', observation: '' })
    const snapshot = await getDashboard(userId, period)
    expect(snapshot.totals.incomeCents).toBe(20000)
    expect(snapshot.totals.plannedCents).toBe(15000)
    expect(snapshot.totals.spentCents).toBe(11568)
    expect(snapshot.totals.availableCents).toBe(8432)
    expect(snapshot.budgets[0]?.remainingCents).toBe(3432)
    expect(await db.syncQueue.count()).toBe(4)
    expect((await db.syncQueue.toArray()).every((item) => item.payload.syncStatus === 'pending')).toBe(true)
  })

  it('keeps data after closing and reopening IndexedDB', async () => {
    await saveBudget({ userId, name: 'Lazer', plannedAmountCents: 5000, classification: 'Lazer', period, observation: '' })
    db.close()
    await db.open()
    const saved = await db.budgets.where('userId').equals(userId).first()
    expect(saved?.name).toBe('Lazer')
    expect(saved?.plannedAmountCents).toBe(5000)
  })

  it('soft deletes expenses and does not count them in totals', async () => {
    await saveBudget({ userId, name: 'Pessoal', plannedAmountCents: 10000, classification: 'Pessoal', period, observation: '' })
    const budget = await db.budgets.where('userId').equals(userId).first()
    if (!budget) throw new Error('budget missing')
    await saveExpense({ userId, budgetId: budget.id, description: 'Livro', amountCents: 2500, date: '2026-09-06', observation: '' })
    const expense = await db.expenses.where('budgetId').equals(budget.id).first()
    if (!expense) throw new Error('expense missing')
    await deleteExpense(userId, expense.id)
    const snapshot = await getDashboard(userId, period)
    expect(snapshot.totals.spentCents).toBe(0)
    expect((await db.expenses.get(expense.id))?.deletedAt).not.toBeNull()
  })

  it('copies only budgets from the previous month', async () => {
    const previous = { month: 8, year: 2026 }
    await saveBudget({ userId, name: 'Transporte', plannedAmountCents: 9000, classification: 'Pessoal', period: previous, observation: 'ônibus' })
    const source = await db.budgets.where('[userId+year+month]').equals([userId, previous.year, previous.month]).first()
    if (!source) throw new Error('source budget missing')
    await saveExpense({ userId, budgetId: source.id, description: 'Passagem', amountCents: 1000, date: '2026-08-10', observation: '' })
    expect(await copyPreviousBudgets(userId, period)).toBe(1)
    const copied = await getDashboard(userId, period)
    expect(copied.budgets).toHaveLength(1)
    expect(copied.budgets[0]?.totalSpentCents).toBe(0)
  })
})
