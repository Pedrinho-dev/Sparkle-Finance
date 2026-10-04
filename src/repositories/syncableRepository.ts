import type { Table } from 'dexie'
import { db } from '../db/db'
import type { SyncEntity, SyncQueueItem, SyncableEntity, SyncableRecord } from '../types/domain'
import { createId } from '../utils/ids'

export function nowIso(): string {
  return new Date().toISOString()
}

export async function persistSyncable<T extends SyncableRecord>(
  table: Table<T, string>,
  entity: SyncEntity,
  record: T
): Promise<void> {
  const queue: SyncQueueItem = {
    id: `${entity}:${record.id}`,
    userId: record.userId,
    entity,
    recordId: record.id,
    operation: 'upsert',
    payload: record,
    queuedAt: nowIso(),
    attempts: 0,
    lastAttemptAt: null,
    lastError: null
  }
  await db.transaction('rw', table, db.syncQueue, async () => {
    await table.put(record)
    await db.syncQueue.put(queue)
  })
  await updatePendingCount()
}

export async function updatePendingCount(): Promise<void> {
  const pendingCount = await db.syncQueue.count()
  const current = await db.syncMeta.get('global')
  await db.syncMeta.put({
    id: 'global',
    state: current?.state ?? 'idle',
    pendingCount,
    lastSyncedAt: current?.lastSyncedAt ?? null,
    lastError: current?.lastError ?? null
  })
}

export function baseRecord(userId: string, existing?: SyncableEntity): Pick<SyncableEntity, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'syncStatus'> {
  const now = nowIso()
  return {
    id: existing?.id ?? createId(),
    userId,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    deletedAt: null,
    syncStatus: 'pending'
  }
}

export async function markLocalDeleted<T extends SyncableRecord>(table: Table<T, string>, entity: SyncEntity, record: T): Promise<void> {
  const updated = { ...record, deletedAt: nowIso(), updatedAt: nowIso(), syncStatus: 'pending' as const } as T
  await persistSyncable(table, entity, updated)
}
