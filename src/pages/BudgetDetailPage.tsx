import type { ReactElement } from 'react'
import type { BudgetSummary } from '../types/domain'
import { formatCurrency } from '../utils/money'
import { FloralAccent } from '../components/FloralAccent'

interface BudgetDetailPageProps {
  budget: BudgetSummary
  onBack: () => void
  onAddExpense: () => void
}

export function BudgetDetailPage({ budget, onBack, onAddExpense }: BudgetDetailPageProps): ReactElement {
  return <div className="budget-detail-page"><button className="back-link" type="button" onClick={onBack}>← Voltar aos orçamentos</button><section className="budget-detail-hero"><FloralAccent position="top-right" tone="light" /><p className="budget-classification">{budget.classification}</p><h2>{budget.name}</h2>{budget.observation && <p>{budget.observation}</p>}<div className="detail-total"><span>Disponível</span><strong>{formatCurrency(budget.remainingCents)}</strong></div><div className="detail-metrics"><div><span>Orçamento</span><strong>{formatCurrency(budget.plannedAmountCents)}</strong></div><div><span>Gasto</span><strong>{formatCurrency(budget.totalSpentCents)}</strong></div><div><span>Uso</span><strong>{budget.percentage}%</strong></div></div><div className="progress-track detail-progress"><div className={`progress-fill ${budget.percentage > 100 ? 'progress-danger' : ''}`} style={{ transform: `scaleX(${Math.min(Math.max(budget.percentage, 0), 100) / 100})` }} /></div></section><section className="card detail-history"><div className="flex items-center justify-between gap-3"><div><p className="eyebrow">Movimentações</p><h3 className="section-title">Histórico</h3></div><button className="button-primary" type="button" onClick={onAddExpense}>+ Registrar gasto</button></div><div className="mt-4 space-y-2">{budget.expenses.slice().reverse().map((expense) => <div className="detail-expense" key={expense.id}><div><strong>{expense.description}</strong><span>{expense.date}{expense.observation ? ` · ${expense.observation}` : ''}</span></div><strong className="text-rose-600">−{formatCurrency(expense.amountCents)}</strong></div>)}{budget.expenses.length === 0 && <p className="card-muted">Nenhum gasto registrado neste orçamento.</p>}</div></section></div>
}
