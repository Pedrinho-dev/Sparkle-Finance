import type { ReactElement } from 'react'
import type { SyncMeta } from '../types/domain'

interface StatusBadgeProps {
  meta: SyncMeta
  online: boolean
  onSync: () => void
}

export function StatusBadge({ meta, online, onSync }: StatusBadgeProps): ReactElement {
  const label = !online ? 'Offline' : meta.state === 'syncing' ? 'Sincronizando…' : meta.state === 'error' ? 'Sync indisponível' : meta.state === 'disabled' ? 'Somente local' : meta.state === 'unauthenticated' ? 'Entre para sincronizar' : 'Sincronizado'
  return <div className="status-badge"><span className={`status-pill ${online && meta.state === 'idle' ? 'status-ready' : 'status-waiting'}`}><span className="status-dot" />{label}</span>{meta.pendingCount > 0 && <span className="status-pending">{meta.pendingCount} pendentes</span>}{meta.lastError && <span className="sr-only" title={meta.lastError}>{meta.lastError}</span>}<button className="status-sync-button" type="button" onClick={onSync}>Sincronizar</button></div>
}
