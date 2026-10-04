export function parseMoneyToCents(value: string): number {
  const normalized = value.trim().replace(/R\$\s?/i, '').replace(/\./g, '').replace(',', '.')
  if (!normalized || !/^\d+(\.\d{0,2})?$/.test(normalized)) return 0
  return Math.round(Number(normalized) * 100)
}

export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',')
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

export function percentageOf(total: number, planned: number): number {
  if (planned <= 0) return total > 0 ? 100 : 0
  return Math.round((total / planned) * 1000) / 10
}

export function percentageChange(current: number, base: number): number {
  if (base <= 0) return 0
  return Math.round(((current - base) / base) * 1000) / 10
}
