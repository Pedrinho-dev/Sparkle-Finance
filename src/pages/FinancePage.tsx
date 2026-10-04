import { useState } from 'react'
import type { ReactElement } from 'react'
import { deleteInvestment, saveInvestment } from '../repositories/financeRepository'
import { useFinancial } from '../hooks/useFinance'
import type { InvestmentSummary, Period } from '../types/domain'
import { formatCurrency } from '../utils/money'
import { periodLabel } from '../utils/date'
import { FloralAccent } from '../components/FloralAccent'
import { InvestmentCard } from '../components/InvestmentCard'
import { InvestmentForm, type InvestmentFormValue } from '../components/InvestmentForm'
import { PeriodSelector } from '../components/PeriodSelector'

interface FinancePageProps {
  userId: string
  period: Period
  onPeriodChange: (period: Period) => void
  onOpenHistory: () => void
}

type FinancialEvent = {
  id: string
  date: string
  title: string
  detail: string
  amountCents: number
  kind: 'income' | 'expense' | 'investment'
}

export function FinancePage({ userId, period, onPeriodChange, onOpenHistory }: FinancePageProps): ReactElement {
  const snapshot = useFinancial(userId, period)
  const [showInvestmentForm, setShowInvestmentForm] = useState(false)
  const [editingInvestment, setEditingInvestment] = useState<InvestmentSummary | undefined>()
  const [message, setMessage] = useState<string | null>(null)

  if (!snapshot) return <div className="card-muted">Carregando seu controle financeiro…</div>

  const run = async (operation: () => Promise<void>, success: string): Promise<boolean> => {
    try {
      await operation()
      setMessage(success)
      window.setTimeout(() => setMessage(null), 3200)
      return true
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível salvar.')
      return false
    }
  }

  const bestInvestment = snapshot.investments.reduce<InvestmentSummary | undefined>((best, investment) => !best || investment.profitability > best.profitability ? investment : best, undefined)
  const categoryTotals = new Map<string, number>()
  snapshot.investments.forEach((investment) => categoryTotals.set(investment.category, (categoryTotals.get(investment.category) ?? 0) + investment.currentValueCents))
  const categoryRows = Array.from(categoryTotals.entries()).sort((first, second) => second[1] - first[1])
  const events: FinancialEvent[] = [
    ...(snapshot.dashboard.totals.incomeCents > 0 ? [{ id: `income-${period.year}-${period.month}`, date: `${period.year}-${String(period.month).padStart(2, '0')}-01`, title: 'Receitas do mês', detail: 'Entrada total', amountCents: snapshot.dashboard.totals.incomeCents, kind: 'income' as const }] : []),
    ...snapshot.dashboard.budgets.flatMap((budget) => budget.expenses.map((expense) => ({ id: expense.id, date: expense.date, title: expense.description, detail: budget.name, amountCents: expense.amountCents, kind: 'expense' as const }))),
    ...snapshot.investments.map((investment) => ({ id: investment.id, date: investment.date, title: investment.name, detail: `Aporte · ${investment.category}`, amountCents: investment.investedCents, kind: 'investment' as const }))
  ].sort((first, second) => second.date.localeCompare(first.date)).slice(0, 6)
  const currentValueTotal = snapshot.totals.currentValueCents
  const formatDate = (date: string): string => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(`${date}T12:00:00`)).replace('.', '')
  const investmentResultLabel = snapshot.totals.resultCents >= 0 ? `+${formatCurrency(snapshot.totals.resultCents)}` : `−${formatCurrency(Math.abs(snapshot.totals.resultCents))}`

  const save = async (value: InvestmentFormValue): Promise<void> => {
    if (await run(() => saveInvestment({ ...value, userId }), value.id ? 'Investimento atualizado.' : 'Investimento salvo localmente.')) {
      setEditingInvestment(undefined)
      setShowInvestmentForm(false)
    }
  }

  return <div className="page-stack finance-page">
    <section className="page-title-row finance-page-title">
      <div><p className="eyebrow">Visão patrimonial</p><h2>Controle financeiro</h2><p>Receitas, despesas e investimentos em uma leitura só.</p></div>
      <PeriodSelector period={period} onChange={onPeriodChange} />
    </section>

    <section className="finance-hero">
      <FloralAccent position="top-right" tone="light" />
      <div className="finance-hero-copy"><p className="eyebrow">Resumo de {periodLabel(period)}</p><h3>Onde seu dinheiro está hoje?</h3><p>Veja o saldo do mês e o que sua carteira já representa.</p></div>
      <div className="finance-hero-balance"><span>Saldo livre</span><strong>{formatCurrency(snapshot.totals.balanceCents)}</strong><small>Receitas menos despesas do mês</small></div>
    </section>

    <section className="finance-summary-grid" aria-label="Resumo financeiro">
      <div className="finance-summary-item"><span>Receitas</span><strong>{formatCurrency(snapshot.dashboard.totals.incomeCents)}</strong><small>Entradas no mês</small></div>
      <div className="finance-summary-item"><span>Despesas</span><strong>{formatCurrency(snapshot.dashboard.totals.spentCents)}</strong><small>Saídas registradas</small></div>
      <div className="finance-summary-item"><span>Investido</span><strong>{formatCurrency(snapshot.totals.investedCents)}</strong><small>{snapshot.investments.length} {snapshot.investments.length === 1 ? 'posição' : 'posições'}</small></div>
      <div className="finance-summary-item summary-highlight"><span>Patrimônio acompanhado</span><strong>{formatCurrency(snapshot.totals.trackedWealthCents)}</strong><small>Saldo livre + valor atual</small></div>
    </section>

    <section className="finance-result-strip" aria-label="Resultado dos investimentos">
      <div><span>Valor atual da carteira</span><strong>{formatCurrency(currentValueTotal)}</strong></div>
      <div><span>Ganho ou perda</span><strong className={snapshot.totals.resultCents < 0 ? 'negative' : 'positive-value'}>{investmentResultLabel}</strong></div>
      <div><span>Leitura</span><strong>{bestInvestment ? `${bestInvestment.name} lidera` : 'Cadastre sua primeira posição'}</strong></div>
    </section>

    <div className="finance-content-grid">
      <section className="finance-panel investment-panel" aria-labelledby="investments-title">
        <div className="section-heading"><div><p className="eyebrow">Acompanhamento</p><h3 id="investments-title" className="section-title">Investimentos</h3><p className="section-support">Compare o valor investido com o valor atual.</p></div><button className="button-primary" type="button" onClick={() => { setEditingInvestment(undefined); setShowInvestmentForm((value) => !value) }}>{showInvestmentForm ? 'Fechar' : '+ Novo investimento'}</button></div>
        {showInvestmentForm && <InvestmentForm onSave={save} onCancel={() => setShowInvestmentForm(false)} />}
        {editingInvestment && <InvestmentForm investment={editingInvestment} onSave={save} onCancel={() => setEditingInvestment(undefined)} />}
        {snapshot.investments.length === 0 && !showInvestmentForm && <div className="empty-state investment-empty"><p>Nenhum investimento cadastrado.</p><span>Registre uma posição para acompanhar retorno, rentabilidade e distribuição.</span><button className="button-secondary" type="button" onClick={() => setShowInvestmentForm(true)}>Cadastrar investimento</button></div>}
        {snapshot.investments.length > 0 && <div className="investment-grid">{snapshot.investments.map((investment) => <InvestmentCard key={investment.id} investment={investment} onEdit={() => { setEditingInvestment(investment); setShowInvestmentForm(false) }} onDelete={() => void run(() => deleteInvestment(userId, investment.id), 'Investimento arquivado.')} />)}</div>}
      </section>

      <aside className="finance-side-column">
        <section className="finance-panel best-investment-panel"><div><p className="eyebrow">Melhor desempenho</p><h3>{bestInvestment ? bestInvestment.name : 'Ainda sem posições'}</h3></div>{bestInvestment ? <><strong className={bestInvestment.resultCents < 0 ? 'negative' : 'positive-value'}>{bestInvestment.profitability >= 0 ? '+' : ''}{bestInvestment.profitability.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</strong><p>{bestInvestment.resultCents >= 0 ? '+' : '−'}{formatCurrency(Math.abs(bestInvestment.resultCents))} sobre o valor investido.</p></> : <p>Adicione um investimento para enxergar qual posição está performando melhor.</p>}</section>
        <section className="finance-panel distribution-panel"><div><p className="eyebrow">Distribuição</p><h3>Por categoria</h3></div>{categoryRows.length === 0 ? <p className="section-support">Sem distribuição para mostrar.</p> : <div className="distribution-list">{categoryRows.map(([category, total]) => <div className="distribution-row" key={category}><div><span>{category}</span><strong>{formatCurrency(total)}</strong></div><div className="distribution-track"><span style={{ transform: `scaleX(${currentValueTotal > 0 ? total / currentValueTotal : 0})` }} /></div></div>)}</div>}</section>
      </aside>
    </div>

    <section className="finance-panel finance-history-panel" aria-labelledby="finance-history-title"><div className="section-heading"><div><p className="eyebrow">Movimentações</p><h3 id="finance-history-title" className="section-title">Histórico recente</h3></div><button className="link-button" type="button" onClick={onOpenHistory}>Ver histórico completo</button></div>{events.length === 0 ? <div className="ledger-empty"><p>Nenhuma movimentação recente.</p><span>Receitas, despesas e aportes aparecerão aqui.</span></div> : <div className="finance-history-list">{events.map((event) => <div className="finance-history-row" key={event.id}><span className={`finance-event-kind ${event.kind}`}>{event.kind === 'income' ? '+' : event.kind === 'investment' ? '↗' : '−'}</span><div><strong>{event.title}</strong><span>{event.detail} · {formatDate(event.date)}</span></div><strong className={event.kind === 'income' ? 'positive-value' : event.kind === 'investment' ? 'investment-value' : 'negative'}>{event.kind === 'income' ? '+' : '−'}{formatCurrency(event.amountCents)}</strong></div>)}</div>}</section>
    {message && <p className="toast-message" role="status">{message}</p>}
  </div>
}
