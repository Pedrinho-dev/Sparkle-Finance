import type { ReactElement } from 'react'
import type { Period } from '../types/domain'
import { listRecentPeriods, periodId, periodLabel } from '../utils/date'

interface PeriodSelectorProps {
  period: Period
  onChange: (period: Period) => void
  onCopy?: () => void
}

export function PeriodSelector({ period, onChange, onCopy }: PeriodSelectorProps): ReactElement {
  return (
    <div className="period-controls">
      <label className="sr-only" htmlFor="period">Competência</label>
      <select id="period" className="period-select" value={periodId(period)} onChange={(event) => {
        const [year, month] = event.target.value.split('-').map(Number)
        onChange({ year, month })
      }}>
        {listRecentPeriods(period).map((option) => <option key={periodId(option)} value={periodId(option)}>{periodLabel(option)}</option>)}
      </select>
      {onCopy && <button type="button" className="period-copy" onClick={onCopy}>Copiar mês anterior</button>}
    </div>
  )
}
