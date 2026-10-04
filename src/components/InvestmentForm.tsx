import { useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import type { Investment, InvestmentCategory } from '../types/domain'
import { INVESTMENT_CATEGORIES } from '../types/domain'
import { centsToInput, parseMoneyToCents } from '../utils/money'

export interface InvestmentFormValue {
  id?: string
  name: string
  category: InvestmentCategory
  investedCents: number
  currentValueCents: number
  date: string
  observation: string
}

interface InvestmentFormProps {
  investment?: Investment
  onSave: (value: InvestmentFormValue) => Promise<void>
  onCancel?: () => void
}

export function InvestmentForm({ investment, onSave, onCancel }: InvestmentFormProps): ReactElement {
  const [name, setName] = useState(investment?.name ?? '')
  const [category, setCategory] = useState<InvestmentCategory>(investment?.category ?? 'Renda fixa')
  const [invested, setInvested] = useState(investment ? centsToInput(investment.investedCents) : '')
  const [currentValue, setCurrentValue] = useState(investment ? centsToInput(investment.currentValueCents) : '')
  const [date, setDate] = useState(investment?.date ?? new Date().toISOString().slice(0, 10))
  const [observation, setObservation] = useState(investment?.observation ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setName(investment?.name ?? '')
    setCategory(investment?.category ?? 'Renda fixa')
    setInvested(investment ? centsToInput(investment.investedCents) : '')
    setCurrentValue(investment ? centsToInput(investment.currentValueCents) : '')
    setDate(investment?.date ?? new Date().toISOString().slice(0, 10))
    setObservation(investment?.observation ?? '')
  }, [investment])

  return <form className="investment-form" onSubmit={(event) => {
    event.preventDefault()
    setSaving(true)
    void onSave({ id: investment?.id, name, category, investedCents: parseMoneyToCents(invested), currentValueCents: parseMoneyToCents(currentValue), date, observation }).finally(() => setSaving(false))
  }}>
    <div className="form-grid">
      <label>Nome ou descrição<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Tesouro Selic" /></label>
      <label>Categoria<select value={category} onChange={(event) => setCategory(event.target.value as InvestmentCategory)}>{INVESTMENT_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label>
    </div>
    <div className="form-grid">
      <label>Valor investido<input required inputMode="decimal" value={invested} onChange={(event) => setInvested(event.target.value)} placeholder="0,00" /></label>
      <label>Valor atual<input required inputMode="decimal" value={currentValue} onChange={(event) => setCurrentValue(event.target.value)} placeholder="0,00" /></label>
    </div>
    <div className="form-grid">
      <label>Data<input required type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
      <label>Observações<input value={observation} onChange={(event) => setObservation(event.target.value)} placeholder="Opcional" /></label>
    </div>
    <div className="form-actions">
      <button className="button-primary" disabled={saving} type="submit">{saving ? 'Salvando…' : investment ? 'Atualizar investimento' : 'Adicionar investimento'}</button>
      {onCancel && <button className="button-secondary" type="button" onClick={onCancel}>Cancelar</button>}
    </div>
  </form>
}
