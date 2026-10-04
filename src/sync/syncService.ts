import { db } from '../db/db'
import type { AppSetting, Budget, Category, Expense, Income, Investment, MonthRecord, SyncEntity, SyncMeta, SyncQueueItem, SyncableRecord, UserProfile } from '../types/domain'
import { nowIso, updatePendingCount } from '../repositories/syncableRepository'
import { isOnline, isSupabaseConfigured, supabase } from '../services/supabase'
import { fromRemote, remoteTable, toRemote, type RemoteRow } from './supabaseMapper'

const entities: SyncEntity[] = ['users', 'incomes', 'months', 'budgets', 'expenses', 'investments', 'categories', 'settings']

async function setMeta(changes: Partial<SyncMeta>): Promise<void> {
  const current = await db.syncMeta.get('global')
  await db.syncMeta.put({ id: 'global', state: current?.state ?? 'idle', pendingCount: current?.pendingCount ?? 0, lastSyncedAt: current?.lastSyncedAt ?? null, lastError: current?.lastError ?? null, ...changes })
}

async function getLocal(entity: SyncEntity, id: string): Promise<SyncableRecord | undefined> {
  if (entity === 'users') return db.users.get(id)
  if (entity === 'incomes') return db.incomes.get(id)
  if (entity === 'months') return db.months.get(id)
  if (entity === 'budgets') return db.budgets.get(id)
  if (entity === 'expenses') return db.expenses.get(id)
  if (entity === 'investments') return db.investments.get(id)
  if (entity === 'categories') return db.categories.get(id)
  return db.settings.get(id)
}

async function putLocal(record: SyncableRecord, entity: SyncEntity): Promise<void> {
  if (entity === 'users') await db.users.put(record as UserProfile)
  else if (entity === 'incomes') await db.incomes.put(record as Income)
  else if (entity === 'months') await db.months.put(record as MonthRecord)
  else if (entity === 'budgets') await db.budgets.put(record as Budget)
  else if (entity === 'expenses') await db.expenses.put(record as Expense)
  else if (entity === 'investments') await db.investments.put(record as Investment)
  else if (entity === 'categories') await db.categories.put(record as Category)
  else await db.settings.put(record as AppSetting)
}

async function markSynced(entity: SyncEntity, id: string): Promise<void> {
  const record = await getLocal(entity, id)
  if (!record) return
  await putLocal({ ...record, syncStatus: 'synced' }, entity)
}

async function markError(item: SyncQueueItem, message: string): Promise<void> {
  await db.syncQueue.put({ ...item, attempts: item.attempts + 1, lastAttemptAt: nowIso(), lastError: message })
  const record = await getLocal(item.entity, item.recordId)
  if (record) await putLocal({ ...record, syncStatus: 'error' }, item.entity)
}

async function pushQueue(userId: string): Promise<void> {
  if (!supabase) return
  const queue = await db.syncQueue.where('userId').equals(userId).sortBy('queuedAt')
  for (const item of queue.slice(0, 100)) {
    try {
      const remoteResult = await supabase.from(remoteTable(item.entity)).select('*').eq('id', item.recordId).eq('user_id', userId).maybeSingle()
      if (remoteResult.error) throw remoteResult.error
      if (remoteResult.data && typeof remoteResult.data === 'object' && remoteResult.data !== null) {
        const remoteUpdatedAt = (remoteResult.data as RemoteRow).updated_at
        if (typeof remoteUpdatedAt === 'string' && remoteUpdatedAt > item.payload.updatedAt) {
          const remote = fromRemote(item.entity, remoteResult.data as RemoteRow, userId)
          if (remote) {
            await db.transaction('rw', [db.syncQueue, db.users, db.incomes, db.months, db.budgets, db.expenses, db.investments, db.categories, db.settings], async () => {
              await putLocal(remote, item.entity)
              await db.syncQueue.delete(item.id)
            })
            continue
          }
        }
      }
      const { error } = await supabase.from(remoteTable(item.entity)).upsert(toRemote(item.entity, item.payload), { onConflict: 'id' })
      if (error) throw error
      await db.transaction('rw', [db.syncQueue, db.users, db.incomes, db.months, db.budgets, db.expenses, db.investments, db.categories, db.settings], async () => {
        await db.syncQueue.delete(item.id)
        await markSynced(item.entity, item.recordId)
      })
    } catch (error) {
      await markError(item, error instanceof Error ? error.message : 'Falha ao sincronizar registro.')
    }
  }
}

async function pullEntity(userId: string, entity: SyncEntity): Promise<void> {
  if (!supabase) return
  const { data, error } = await supabase.from(remoteTable(entity)).select('*').eq('user_id', userId)
  if (error) throw error
  if (!Array.isArray(data)) return
  for (const raw of data) {
    if (typeof raw !== 'object' || raw === null) continue
    const remote = fromRemote(entity, raw as RemoteRow, userId)
    if (!remote) continue
    const local = await getLocal(entity, remote.id)
    if (!local || remote.updatedAt > local.updatedAt) {
      await putLocal(remote, entity)
      await db.syncQueue.delete(`${entity}:${remote.id}`)
    } else if (local.syncStatus === 'synced') {
      await db.syncQueue.delete(`${entity}:${remote.id}`)
    }
  }
}

export async function syncNow(userId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    await setMeta({ state: 'disabled', lastError: null })
    await updatePendingCount()
    return
  }
  if (!isOnline()) {
    await setMeta({ state: 'offline' })
    return
  }
  const { data } = await supabase.auth.getUser()
  if (!data.user || data.user.id !== userId) {
    await setMeta({ state: 'unauthenticated' })
    return
  }
  await setMeta({ state: 'syncing', lastError: null })
  try {
    await pushQueue(userId)
    for (const entity of entities) await pullEntity(userId, entity)
    await updatePendingCount()
    await setMeta({ state: 'idle', lastSyncedAt: nowIso(), lastError: null })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha de sincronização.'
    await setMeta({ state: 'error', lastError: message })
    await updatePendingCount()
  }
}

export function startSync(userId: string): () => void {
  const onOnline = (): void => { void syncNow(userId) }
  const onVisibility = (): void => { if (document.visibilityState === 'visible') void syncNow(userId) }
  window.addEventListener('online', onOnline)
  document.addEventListener('visibilitychange', onVisibility)
  const interval = window.setInterval(() => { void syncNow(userId) }, 30_000)
  void syncNow(userId)
  return () => {
    window.removeEventListener('online', onOnline)
    document.removeEventListener('visibilitychange', onVisibility)
    window.clearInterval(interval)
  }
}
