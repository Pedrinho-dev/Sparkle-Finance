import { useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import type { Budget, BudgetClassification, Period } from '../types/domain'
import { CLASSIFICATIONS } from '../types/domain'
import { centsToInput, parseMoneyToCents } from '../utils/money'

interface BudgetFormProps { period: Period; budget?: Budget; onSave: (value: { id?: string; name: string; plannedAmountCents: number; classification: BudgetClassification; observation: string }) => Promise<void>; onCancel?: () => void }

export function BudgetForm({ budget, onSave, onCancel }: BudgetFormProps): ReactElement {
  const [name, setName] = useState(budget?.name ?? '')
  const [amount, setAmount] = useState(budget ? centsToInput(budget.plannedAmountCents) : '')
  const [classification, setClassification] = useState<BudgetClassification>(budget?.classification ?? 'Essencial')
  const [observation, setObservation] = useState(budget?.observation ?? '')
  const [saving, setSaving] = useState(false)
  useEffect(() => { setName(budget?.name ?? ''); setAmount(budget ? centsToInput(budget.plannedAmountCents) : ''); setClassification(budget?.classification ?? 'Essencial'); setObservation(budget?.observation ?? '') }, [budget])
  return <form className="budget-form" onSubmit={(event) => { event.preventDefault(); setSaving(true); void onSave({ id: budget?.id, name, plannedAmountCents: parseMoneyToCents(amount), classification, observation }).finally(() => setSaving(false)) }}>
    <div className="form-grid"><label>Nome<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Moradia" /></label><label>Valor planejado<input required inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0,00" /></label></div>
    <div className="form-grid"><label>Classificação<select value={classification} onChange={(event) => setClassification(event.target.value as BudgetClassification)}>{CLASSIFICATIONS.map((item) => <option key={item}>{item}</option>)}</select></label><label>Observação<input value={observation} onChange={(event) => setObservation(event.target.value)} placeholder="Opcional" /></label></div>
    <div className="form-actions"><button className="button-primary" disabled={saving} type="submit">{saving ? 'Salvando…' : budget ? 'Atualizar orçamento' : 'Adicionar orçamento'}</button>{onCancel && <button className="button-secondary" type="button" onClick={onCancel}>Cancelar</button>}</div>
  </form>
}
