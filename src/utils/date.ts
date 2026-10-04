import type { Period } from '../types/domain'

export function currentPeriod(date = new Date()): Period {
  return { month: date.getMonth() + 1, year: date.getFullYear() }
}

export function periodId(period: Period): string {
  return `${period.year}-${String(period.month).padStart(2, '0')}`
}

export function previousPeriod(period: Period): Period {
  return period.month === 1
    ? { month: 12, year: period.year - 1 }
    : { month: period.month - 1, year: period.year }
}

export function periodLabel(period: Period): string {
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(
    new Date(period.year, period.month - 1, 1)
  )
}

export function shortMonthLabel(period: Period): string {
  return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(
    new Date(period.year, period.month - 1, 1)
  )
}

export function listRecentPeriods(center: Period, radius = 12): Period[] {
  const result: Period[] = []
  const start = new Date(center.year, center.month - 1 - radius, 1)
  for (let offset = 0; offset <= radius * 2; offset += 1) {
    const date = new Date(start.getFullYear(), start.getMonth() + offset, 1)
    result.push({ month: date.getMonth() + 1, year: date.getFullYear() })
  }
  return result
}

export function monthDateRange(period: Period): { start: string; end: string } {
  const start = new Date(Date.UTC(period.year, period.month - 1, 1))
  const end = new Date(Date.UTC(period.year, period.month, 0))
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
}
