import { useState } from 'react'
import type { ReactElement } from 'react'

interface FloralAccentProps {
  position: 'top-right' | 'bottom-left' | 'sides'
  tone?: 'light' | 'dark'
  className?: string
}

export function FloralAccent({ position, tone = 'light', className = '' }: FloralAccentProps): ReactElement {
  const [imageFailed, setImageFailed] = useState(false)
  const source = '/flowers/white-lilies-cutout.png'

  return <div aria-hidden="true" className={`floral-accent floral-${position} floral-${tone} ${className}`}>
    {!imageFailed ? <img className="floral-image" src={source} alt="" loading="lazy" decoding="async" onError={() => setImageFailed(true)} /> : <><span className="floral-stem" /><span className="floral-petal floral-petal-a" /><span className="floral-petal floral-petal-b" /><span className="floral-petal floral-petal-c" /><span className="floral-petal floral-petal-d" /><span className="floral-center" /></>}
  </div>
}
