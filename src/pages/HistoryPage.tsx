import { useState } from 'react'
import type { ReactElement } from 'react'
import { useHistory } from '../hooks/useFinance'
import { downloadText, csvEscape } from '../repositories/backupRepository'
import { formatCurrency } from '../utils/money'
import { FloralAccent } from '../components/FloralAccent'

export function HistoryPage({ userId }: { userId: string }): ReactElement {
  const [query, setQuery] = useState('')
  const history = useHistory(userId, query) ?? []
  const exportCsv = (): void => {
    const rows = [['data', 'competência', 'orçamento', 'classificação', 'descrição', 'valor_centavos', 'valor_brl', 'observação'], ...history.map((entry) => [entry.expense.date, `${entry.period.year}-${String(entry.period.month).padStart(2, '0')}`, entry.budgetName, entry.classification, entry.expense.description, String(entry.expense.amountCents), formatCurrency(entry.expense.amountCents), entry.expense.observation])]
    downloadText('sparkle-finance-historico.csv', rows.map((row) => row.map(csvEscape).join(';')).join('\n'), 'text/csv;charset=utf-8')
  }
  return <div className="page-stack"><section className="page-title-row"><div><p className="eyebrow">Memória financeira</p><h2>Histórico</h2><p>Veja cada decisão do seu mês.</p></div><FloralAccent position="top-right" tone="light" /></section><section className="history-toolbar"><input aria-label="Filtrar histórico" placeholder="Buscar gasto ou orçamento" value={query} onChange={(event) => setQuery(event.target.value)} /><button className="button-secondary" type="button" onClick={exportCsv}>Exportar CSV</button></section><section className="history-list">{history.map((entry) => <article className="history-item" key={entry.expense.id}><div className="history-date"><strong>{entry.expense.date.slice(8, 10)}</strong><span>{entry.expense.date.slice(5, 7)}/{entry.period.year}</span></div><div className="min-w-0 flex-1"><strong className="block truncate">{entry.expense.description}</strong><span>{entry.budgetName} · {entry.classification}</span>{entry.expense.observation && <small>{entry.expense.observation}</small>}</div><strong className="history-amount">−{formatCurrency(entry.expense.amountCents)}</strong></article>)}{history.length === 0 && <div className="empty-state"><FloralAccent position="bottom-left" tone="light" /><p>Nenhum gasto encontrado.</p><span>Quando você registrar um gasto, ele aparecerá aqui.</span></div>}</section></div>
}
