import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { db } from '../db/db'
import { startSync } from '../sync/syncService'
import type { SyncMeta } from '../types/domain'

export function useSyncStatus(userId: string | undefined): SyncMeta {
  const meta = useLiveQuery(() => db.syncMeta.get('global'), [], undefined)
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine)
  useEffect(() => {
    const onOnline = (): void => setOnline(true)
    const onOffline = (): void => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline) }
  }, [])
  useEffect(() => userId ? startSync(userId) : undefined, [userId])
  const fallback: SyncMeta = { id: 'global', state: online ? 'idle' : 'offline', pendingCount: 0, lastSyncedAt: null, lastError: null }
  return online ? meta ?? fallback : { ...(meta ?? fallback), state: 'offline' }
}
