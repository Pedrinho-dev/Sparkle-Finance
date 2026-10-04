import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db/db'
import { saveBudget, saveExpense } from './financeRepository'
import { backupToJson, createBackup, importBackup } from './backupRepository'

const userId = 'backup-user'

describe('backup repository', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    const now = new Date().toISOString()
    await db.users.put({ id: userId, userId, email: null, displayName: 'Backup', createdAt: now, updatedAt: now, deletedAt: null, syncStatus: 'pending' })
  })

  it('exports and imports a complete local dataset as a merge', async () => {
    const period = { month: 9, year: 2026 }
    await saveBudget({ userId, name: 'Casa', plannedAmountCents: 10000, classification: 'Essencial', period, observation: '' })
    const budget = await db.budgets.where('userId').equals(userId).first()
    if (!budget) throw new Error('budget missing')
    await saveExpense({ userId, budgetId: budget.id, description: 'Conta', amountCents: 1250, date: '2026-09-01', observation: '' })
    const backup = await createBackup(userId)
    expect(backup.format).toBe('sparkle-finance-backup')
    expect(backup.budgets).toHaveLength(1)
    expect(backup.expenses).toHaveLength(1)
    await db.budgets.clear()
    await db.expenses.clear()
    const imported = await importBackup(userId, JSON.parse(backupToJson(backup)) as unknown)
    expect(imported).toBeGreaterThanOrEqual(2)
    expect(await db.budgets.count()).toBe(1)
    expect(await db.expenses.count()).toBe(1)
    expect((await db.budgets.toArray())[0]?.syncStatus).toBe('pending')
  })
})
