import type { ReactElement } from 'react'
import type { InvestmentSummary } from '../types/domain'
import { formatCurrency } from '../utils/money'

interface InvestmentCardProps {
  investment: InvestmentSummary
  onEdit: () => void
  onDelete: () => void
}

export function InvestmentCard({ investment, onEdit, onDelete }: InvestmentCardProps): ReactElement {
  const positive = investment.resultCents >= 0
  return <article className="investment-card">
    <div className="investment-card-heading">
      <div className="min-w-0">
        <span className="investment-category">{investment.category}</span>
        <h3>{investment.name}</h3>
      </div>
      <div className="investment-card-actions">
        <button className="icon-button" type="button" onClick={onEdit} aria-label={`Editar ${investment.name}`}>Editar</button>
        <button className="icon-button text-rose-600" type="button" onClick={onDelete} aria-label={`Arquivar ${investment.name}`}>Arquivar</button>
      </div>
    </div>
    <div className="investment-values">
      <div><span>Investido</span><strong>{formatCurrency(investment.investedCents)}</strong></div>
      <div><span>Valor atual</span><strong>{formatCurrency(investment.currentValueCents)}</strong></div>
    </div>
    <div className={positive ? 'investment-result positive' : 'investment-result negative'}>
      <div><span>Resultado</span><strong>{positive ? '+' : '−'}{formatCurrency(Math.abs(investment.resultCents))}</strong></div>
      <strong>{positive ? '+' : ''}{investment.profitability.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</strong>
    </div>
    <div className="investment-card-footer"><span>{new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${investment.date}T12:00:00`)).replace('.', '')}</span>{investment.observation && <span className="investment-observation" title={investment.observation}>{investment.observation}</span>}</div>
  </article>
}
