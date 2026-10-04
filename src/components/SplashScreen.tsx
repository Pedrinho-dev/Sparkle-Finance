import type { ReactElement } from 'react'
import { BrandLockup } from './BrandLockup'
import { FloralAccent } from './FloralAccent'

export function SplashScreen(): ReactElement {
  return <div className="splash-screen"><FloralAccent position="top-right" tone="dark" /><FloralAccent position="bottom-left" tone="dark" /><div className="splash-content"><BrandLockup /><span className="splash-rule" /><p>Finance pessoal, no seu ritmo.</p></div><span className="splash-glow" /></div>
}
