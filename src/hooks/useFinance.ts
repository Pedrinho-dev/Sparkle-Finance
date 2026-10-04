import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { ensureCurrentUser } from '../services/identityService'
import { getDashboard, getFinancialSnapshot, listHistory } from '../repositories/financeRepository'
import { getSetting } from '../repositories/settingsRepository'
import type { DashboardSnapshot, FinancialSnapshot, HistoryEntry, Period, UserProfile } from '../types/domain'

export function useCurrentUser(): { user: UserProfile | null; loading: boolean; error: string | null } {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    void ensureCurrentUser().then((value) => {
      if (active) { setUser(value); setLoading(false) }
    }).catch((reason: unknown) => {
      if (active) { setError(reason instanceof Error ? reason.message : 'Não foi possível abrir a conta local.'); setLoading(false) }
    })
    return () => { active = false }
  }, [])
  return { user, loading, error }
}

export function useDashboard(userId: string | undefined, period: Period): DashboardSnapshot | undefined {
  return useLiveQuery(() => userId ? getDashboard(userId, period) : undefined, [userId, period.month, period.year], undefined)
}

export function useFinancial(userId: string | undefined, period: Period): FinancialSnapshot | undefined {
  return useLiveQuery(() => userId ? getFinancialSnapshot(userId, period) : undefined, [userId, period.month, period.year], undefined)
}

export function useHistory(userId: string | undefined, query: string): HistoryEntry[] | undefined {
  return useLiveQuery(() => userId ? listHistory(userId, query) : undefined, [userId, query], undefined)
}

export function useSavedPeriod(userId: string | undefined): { period: Period | null; loading: boolean } {
  const value = useLiveQuery(async () => {
    if (!userId) return null
    const raw = await getSetting(userId, 'active-period')
    if (!raw) return null
    try {
      const parsed: unknown = JSON.parse(raw)
      if (typeof parsed === 'object' && parsed !== null && 'month' in parsed && 'year' in parsed && typeof parsed.month === 'number' && typeof parsed.year === 'number') return { month: parsed.month, year: parsed.year }
    } catch {
      return null
    }
    return null
  }, [userId], undefined)
  return { period: value ?? null, loading: value === undefined }
}

export function useSavedTheme(userId: string | undefined): 'light' | 'dark' | undefined {
  const value = useLiveQuery(async () => userId ? getSetting(userId, 'theme') : undefined, [userId], undefined)
  return value === 'dark' ? 'dark' : value === 'light' ? 'light' : undefined
}
