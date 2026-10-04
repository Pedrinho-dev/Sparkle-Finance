import { useEffect, useState } from 'react'
import type { FormEvent, ReactElement } from 'react'
import type { BudgetSummary, Expense, Period } from '../types/domain'
import { saveExpense } from '../repositories/financeRepository'
import { centsToInput, parseMoneyToCents } from '../utils/money'
import { FloralAccent } from './FloralAccent'

interface QuickExpenseModalProps {
  userId: string
  period: Period
  budgets: BudgetSummary[]
  expense?: Expense
  initialBudgetId?: string
  onClose: () => void
  onSaved: (message: string) => void
}

export function QuickExpenseModal({ userId, budgets, expense, initialBudgetId, onClose, onSaved }: QuickExpenseModalProps): ReactElement {
  const [amount, setAmount] = useState(expense ? centsToInput(expense.amountCents) : '')
  const [budgetId, setBudgetId] = useState(expense?.budgetId ?? initialBudgetId ?? budgets[0]?.id ?? '')
  const [description, setDescription] = useState(expense?.description ?? '')
  const [date, setDate] = useState(expense?.date ?? new Date().toISOString().slice(0, 10))
  const [observation, setObservation] = useState(expense?.observation ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKeyDown)
    document.body.classList.add('modal-open')
    return () => { document.removeEventListener('keydown', onKeyDown); document.body.classList.remove('modal-open') }
  }, [onClose])
  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await saveExpense({ userId, id: expense?.id, budgetId, description, amountCents: parseMoneyToCents(amount), date, observation })
      onSaved(expense ? 'Gasto atualizado.' : 'Gasto salvo offline e pronto para sincronizar.')
      onClose()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível salvar o gasto.')
    } finally { setSaving(false) }
  }
  return <div className="modal-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="quick-modal" role="dialog" aria-modal="true" aria-labelledby="quick-expense-title"><FloralAccent position="top-right" tone="light" /><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">Registro rápido</p><h2 id="quick-expense-title" className="mt-1 text-2xl font-semibold text-ink">{expense ? 'Editar gasto' : 'Novo gasto'}</h2></div><button className="close-button" type="button" onClick={onClose} aria-label="Fechar">×</button></div>{budgets.length === 0 ? <p className="inline-alert mt-6 rounded-2xl p-4 text-sm">Crie um orçamento antes de registrar um gasto.</p> : <form className="relative z-10 mt-5 grid gap-4" onSubmit={(event) => void submit(event)}><label className="quick-amount-label">Valor<input autoFocus required inputMode="decimal" className="quick-amount" placeholder="R$ 0,00" value={amount} onChange={(event) => setAmount(event.target.value)} /></label><label>Orçamento<select required value={budgetId} onChange={(event) => setBudgetId(event.target.value)}>{budgets.map((budget) => <option key={budget.id} value={budget.id}>{budget.name} · {budget.classification}</option>)}</select></label><label>Descrição<input required placeholder="Ex.: Supermercado" value={description} onChange={(event) => setDescription(event.target.value)} /></label><div className="grid gap-3 sm:grid-cols-2"><label>Data<input required type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><label>Observação<input placeholder="Opcional" value={observation} onChange={(event) => setObservation(event.target.value)} /></label></div>{error && <p className="inline-alert rounded-xl px-3 py-2 text-sm" role="alert">{error}</p>}<button className="button-primary button-large" disabled={saving} type="submit">{saving ? 'Salvando…' : 'Salvar gasto'}</button></form>}</section></div>
}
