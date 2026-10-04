import { useState } from 'react'
import type { ReactElement } from 'react'
import type { Expense } from '../types/domain'
import { centsToInput, parseMoneyToCents } from '../utils/money'

interface ExpenseFormProps { budgetId: string; expense?: Expense; onSave: (value: { id?: string; budgetId: string; description: string; amountCents: number; date: string; observation: string }) => Promise<void>; onCancel?: () => void }

export function ExpenseForm({ budgetId, expense, onSave, onCancel }: ExpenseFormProps): ReactElement {
  const [description, setDescription] = useState(expense?.description ?? '')
  const [amount, setAmount] = useState(expense ? centsToInput(expense.amountCents) : '')
  const [date, setDate] = useState(expense?.date ?? new Date().toISOString().slice(0, 10))
  const [observation, setObservation] = useState(expense?.observation ?? '')
  const [saving, setSaving] = useState(false)
  return <form className="expense-form" onSubmit={(event) => { event.preventDefault(); setSaving(true); void onSave({ id: expense?.id, budgetId, description, amountCents: parseMoneyToCents(amount), date, observation }).finally(() => setSaving(false)) }}><div className="expense-form-grid"><input required aria-label="Descrição do gasto" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Descrição" /><input required aria-label="Valor do gasto" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Valor" /><input required aria-label="Data do gasto" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></div><input aria-label="Observação do gasto" value={observation} onChange={(event) => setObservation(event.target.value)} placeholder="Observação (opcional)" /><div className="form-actions"><button className="button-primary" disabled={saving} type="submit">{saving ? 'Salvando…' : expense ? 'Atualizar gasto' : 'Adicionar gasto'}</button>{onCancel && <button className="button-secondary" type="button" onClick={onCancel}>Cancelar</button>}</div></form>
}
