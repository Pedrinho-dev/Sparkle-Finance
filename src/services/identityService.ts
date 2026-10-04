import { db } from '../db/db'
import type { SyncableEntity, UserProfile } from '../types/domain'
import { createId } from '../utils/ids'
import { nowIso, updatePendingCount } from '../repositories/syncableRepository'
import { supabase } from './supabase'

const ACTIVE_USER_KEY = 'sparkle-finance.active-user-id'
const LEGACY_ACTIVE_USER_KEY = 'sparkle-racing-finance.active-user-id'

function activeUserId(): string | null {
  const current = localStorage.getItem(ACTIVE_USER_KEY)
  if (current) return current
  const legacy = localStorage.getItem(LEGACY_ACTIVE_USER_KEY)
  if (legacy) localStorage.setItem(ACTIVE_USER_KEY, legacy)
  return legacy
}

function setActiveUserId(id: string): void {
  localStorage.setItem(ACTIVE_USER_KEY, id)
}

function newLocalProfile(): UserProfile {
  const id = createId()
  const now = nowIso()
  return {
    id,
    userId: id,
    email: null,
    displayName: 'Minha conta',
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    syncStatus: 'pending'
  }
}

async function migrateLocalRecords(fromUserId: string, toUserId: string, email: string | null, displayName: string): Promise<void> {
  await db.transaction('rw', [db.users, db.incomes, db.months, db.budgets, db.expenses, db.investments, db.categories, db.settings, db.syncQueue], async () => {
    await migrateTable(db.incomes, fromUserId, toUserId)
    await migrateTable(db.months, fromUserId, toUserId)
    await migrateTable(db.budgets, fromUserId, toUserId)
    await migrateTable(db.expenses, fromUserId, toUserId)
    await migrateTable(db.investments, fromUserId, toUserId)
    await migrateTable(db.categories, fromUserId, toUserId)
    await migrateTable(db.settings, fromUserId, toUserId)
    const queues = await db.syncQueue.where('userId').equals(fromUserId).toArray()
    for (const queue of queues) {
      await db.syncQueue.put({ ...queue, userId: toUserId, payload: { ...queue.payload, userId: toUserId }, lastError: null })
    }
    const profile: UserProfile = {
      id: toUserId,
      userId: toUserId,
      email,
      displayName,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      deletedAt: null,
      syncStatus: 'pending'
    }
    await db.users.put(profile)
    await db.syncQueue.put({ id: `users:${profile.id}`, userId: toUserId, entity: 'users', recordId: profile.id, operation: 'upsert', payload: profile, queuedAt: nowIso(), attempts: 0, lastAttemptAt: null, lastError: null })
  })
  await updatePendingCount()
  setActiveUserId(toUserId)
}

async function migrateTable<T extends SyncableEntity>(table: { toArray: () => Promise<T[]>; bulkPut: (records: T[]) => Promise<unknown> }, fromUserId: string, toUserId: string): Promise<void> {
  const records = (await table.toArray()).filter((record) => record.userId === fromUserId)
  if (records.length > 0) await table.bulkPut(records.map((record) => ({ ...record, userId: toUserId, updatedAt: nowIso(), syncStatus: 'pending' as const })))
}

export async function ensureCurrentUser(): Promise<UserProfile> {
  if (supabase) {
    const { data } = await supabase.auth.getUser()
    if (data.user) {
      const localId = activeUserId()
      const profile = await db.users.get(data.user.id)
      if (!profile && localId && localId !== data.user.id) {
        await migrateLocalRecords(localId, data.user.id, data.user.email ?? null, data.user.user_metadata?.display_name ?? data.user.email ?? 'Minha conta')
      } else if (!profile) {
        const now = nowIso()
        const profile: UserProfile = { id: data.user.id, userId: data.user.id, email: data.user.email ?? null, displayName: data.user.email ?? 'Minha conta', createdAt: now, updatedAt: now, deletedAt: null, syncStatus: 'pending' }
        await db.users.put(profile)
        await db.syncQueue.put({ id: `users:${profile.id}`, userId: profile.userId, entity: 'users', recordId: profile.id, operation: 'upsert', payload: profile, queuedAt: now, attempts: 0, lastAttemptAt: null, lastError: null })
        await updatePendingCount()
      }
      setActiveUserId(data.user.id)
      const saved = await db.users.get(data.user.id)
      if (saved) return saved
    }
  }

  const savedId = activeUserId()
  const saved = savedId ? await db.users.get(savedId) : undefined
  if (saved) return saved
  const existing = await db.users.filter((user) => user.email === null && user.deletedAt === null).first()
  if (existing) {
    setActiveUserId(existing.id)
    return existing
  }
  const profile = newLocalProfile()
  await db.users.put(profile)
  setActiveUserId(profile.id)
  return profile
}

export async function signIn(email: string, password: string): Promise<void> {
  if (!supabase) throw new Error('Configure o Supabase para entrar com uma conta.')
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  await ensureCurrentUser()
}

export async function signUp(email: string, password: string): Promise<void> {
  if (!supabase) throw new Error('Configure o Supabase para criar uma conta.')
  const { error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
}

export async function signOut(): Promise<void> {
  if (supabase) {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }
  localStorage.removeItem(ACTIVE_USER_KEY)
  localStorage.removeItem(LEGACY_ACTIVE_USER_KEY)
}
