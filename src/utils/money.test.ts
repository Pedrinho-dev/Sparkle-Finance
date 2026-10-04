import { describe, expect, it } from 'vitest'
import { formatCurrency, parseMoneyToCents, percentageOf } from './money'

describe('money invariants', () => {
  it('converts Brazilian input to integer cents', () => {
    expect(parseMoneyToCents('R$ 115,68')).toBe(11568)
    expect(parseMoneyToCents('1.234,50')).toBe(123450)
  })

  it('derives percentage without persisting a balance', () => {
    expect(percentageOf(2500, 10000)).toBe(25)
    expect(percentageOf(10, 0)).toBe(100)
  })

  it('formats cents for display only', () => {
    expect(formatCurrency(11568)).toContain('115,68')
  })
})
