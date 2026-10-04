import { db } from '../db/db'
import type { AppSetting } from '../types/domain'
import { baseRecord, persistSyncable } from './syncableRepository'

export async function getSetting(userId: string, key: string): Promise<string | null> {
  const setting = await db.settings.where('[userId+key]').equals([userId, key]).filter((item) => !item.deletedAt).first()
  return setting?.value ?? null
}

export async function saveSetting(userId: string, key: string, value: string): Promise<void> {
  const existing = await db.settings.where('[userId+key]').equals([userId, key]).first()
  const setting: AppSetting = { ...baseRecord(userId, existing), key, value }
  await persistSyncable(db.settings, 'settings', setting)
}
