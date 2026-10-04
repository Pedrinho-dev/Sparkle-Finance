import { useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import { DashboardPage } from './pages/DashboardPage'
import { FinancePage } from './pages/FinancePage'
import { HistoryPage } from './pages/HistoryPage'
import { BackupPage } from './pages/BackupPage'
import { BudgetDetailPage } from './pages/BudgetDetailPage'
import { useCurrentUser, useDashboard, useSavedPeriod, useSavedTheme } from './hooks/useFinance'
import { useSyncStatus } from './hooks/useSyncStatus'
import { ensureAppMonth, ensureDefaultCategories } from './repositories/financeRepository'
import { currentPeriod } from './utils/date'
import { syncNow } from './sync/syncService'
import { saveSetting } from './repositories/settingsRepository'
import type { Expense, Period } from './types/domain'
import { StatusBadge } from './components/StatusBadge'
import { BrandLockup } from './components/BrandLockup'
import { SplashScreen } from './components/SplashScreen'
import { QuickExpenseModal } from './components/QuickExpenseModal'
import { BottomNavigation, type AppTab } from './components/BottomNavigation'

type Page = AppTab | 'detail'

export default function App(): ReactElement {
  const { user, loading, error } = useCurrentUser()
  const saved = useSavedPeriod(user?.id)
  const savedTheme = useSavedTheme(user?.id)
  const [period, setPeriod] = useState<Period>(currentPeriod())
  const [page, setPage] = useState<Page>('home')
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null)
  const [quickExpense, setQuickExpense] = useState<{ budgetId?: string; expense?: Expense } | null>(null)
  const [quickFeedback, setQuickFeedback] = useState<string | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [splash, setSplash] = useState(true)
  const dashboard = useDashboard(user?.id, period)
  const syncMeta = useSyncStatus(user?.id)
  useEffect(() => { if (saved.period) setPeriod(saved.period) }, [saved.period?.month, saved.period?.year])
  useEffect(() => { if (savedTheme) setTheme(savedTheme) }, [savedTheme])
  useEffect(() => { const timer = window.setTimeout(() => setSplash(false), 850); return () => window.clearTimeout(timer) }, [])
  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])
  useEffect(() => { if (user) { void ensureDefaultCategories(user.id); void ensureAppMonth(user.id) } }, [user?.id])
  if (splash || loading || saved.loading) return <SplashScreen />
  if (error || !user) return <div className="grid min-h-screen place-items-center bg-mist p-6"><div className="card max-w-md"><h1 className="text-xl font-semibold text-ink">Não foi possível abrir o app</h1><p className="mt-2 text-sm text-slate-600">{error ?? 'Conta local indisponível.'}</p></div></div>
  const activeTab: AppTab = page === 'detail' ? 'budgets' : page
  const selectedBudget = dashboard?.budgets.find((budget) => budget.id === selectedBudgetId)
  const changeTheme = (value: 'light' | 'dark'): void => { setTheme(value); void saveSetting(user.id, 'theme', value) }
  const openQuickExpense = (budgetId?: string): void => setQuickExpense({ budgetId })
  const showQuickFeedback = (message: string): void => { setQuickExpense(null); setQuickFeedback(message); window.setTimeout(() => setQuickFeedback(null), 3200) }
  return <div className="app-shell"><header className="app-topbar"><div className="topbar-inner"><BrandLockup compact /><div className="topbar-actions"><StatusBadge meta={syncMeta} online={syncMeta.state !== 'offline'} onSync={() => void syncNow(user.id)} /><button className="theme-toggle" type="button" onClick={() => changeTheme(theme === 'light' ? 'dark' : 'light')} aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}><span className="theme-dot" />{theme === 'light' ? 'Claro' : 'Escuro'}</button></div></div></header><main className="app-main">{page === 'home' && <DashboardPage userId={user.id} period={period} onPeriodChange={(value) => { setPeriod(value); void saveSetting(user.id, 'active-period', JSON.stringify(value)) }} mode="home" onOpenQuickExpense={openQuickExpense} onOpenBudget={(id) => { setSelectedBudgetId(id); setPage('detail') }} />}{page === 'finance' && <FinancePage userId={user.id} period={period} onPeriodChange={(value) => { setPeriod(value); void saveSetting(user.id, 'active-period', JSON.stringify(value)) }} onOpenHistory={() => setPage('history')} />}{page === 'budgets' && <DashboardPage userId={user.id} period={period} onPeriodChange={(value) => { setPeriod(value); void saveSetting(user.id, 'active-period', JSON.stringify(value)) }} mode="budgets" onOpenQuickExpense={openQuickExpense} onOpenBudget={(id) => { setSelectedBudgetId(id); setPage('detail') }} />}{page === 'history' && <HistoryPage userId={user.id} />}{page === 'settings' && <BackupPage userId={user.id} email={user.email} theme={theme} onThemeChange={changeTheme} />}{page === 'detail' && selectedBudget && <BudgetDetailPage budget={selectedBudget} onBack={() => setPage('budgets')} onAddExpense={() => openQuickExpense(selectedBudget.id)} />}{page === 'detail' && !selectedBudget && <div className="card-muted">Orçamento não encontrado. <button className="text-ink underline" type="button" onClick={() => setPage('budgets')}>Voltar</button></div>}</main><BottomNavigation active={activeTab} onChange={setPage} onQuickExpense={() => openQuickExpense()} />{quickFeedback && <p className="toast-message" role="status">{quickFeedback}</p>}{quickExpense && dashboard && <QuickExpenseModal userId={user.id} period={period} budgets={dashboard.budgets} expense={quickExpense.expense} initialBudgetId={quickExpense.budgetId} onClose={() => setQuickExpense(null)} onSaved={showQuickFeedback} />}</div>
}
