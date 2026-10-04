import type { ReactElement } from 'react'
import type { DashboardSnapshot } from '../types/domain'
import { formatCurrency } from '../utils/money'

export function SummaryCards({ snapshot }: { snapshot: DashboardSnapshot }): ReactElement {
  const cards = [
    ['Renda', formatCurrency(snapshot.totals.incomeCents)],
    ['Planejado', formatCurrency(snapshot.totals.plannedCents)],
    ['Gasto', formatCurrency(snapshot.totals.spentCents)],
    ['Restante', formatCurrency(snapshot.totals.availableCents)]
  ] as const
  return <div className="summary-grid">{cards.map(([label, value]) => <div className="summary-card" key={label}><span>{label}</span><strong className={label === 'Restante' && snapshot.totals.availableCents < 0 ? 'negative' : ''}>{value}</strong></div>)}</div>
}
