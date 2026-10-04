import { useState } from 'react'
import type { ReactElement } from 'react'

export const officialLogo = '/branding/sparkle-finance-logo.png'

interface BrandLockupProps {
  compact?: boolean
  inverted?: boolean
}

export function BrandLockup({ compact = false, inverted = false }: BrandLockupProps): ReactElement {
  const [failed, setFailed] = useState(false)
  return <div className={`brand-lockup ${compact ? 'brand-lockup-compact' : ''} ${inverted ? 'brand-lockup-inverted' : ''}`}>{failed ? <span className="brand-lockup-fallback"><strong>Sparkle</strong> <em>Finance</em></span> : <img src={officialLogo} alt="Sparkle Finance" className="brand-lockup-logo" onError={() => setFailed(true)} />}</div>
}
