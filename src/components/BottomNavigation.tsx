import type { ReactElement } from 'react'

export type AppTab = 'home' | 'finance' | 'budgets' | 'history' | 'settings'

interface BottomNavigationProps {
  active: AppTab
  onChange: (tab: AppTab) => void
  onQuickExpense: () => void
}

export function BottomNavigation({ active, onChange, onQuickExpense }: BottomNavigationProps): ReactElement {
  return <nav className="bottom-navigation" aria-label="Navegação principal"><button className={active === 'home' ? 'bottom-nav-item active' : 'bottom-nav-item'} type="button" onClick={() => onChange('home')}><NavGlyph kind="home" /><span>Início</span></button><button className={active === 'finance' ? 'bottom-nav-item active' : 'bottom-nav-item'} type="button" onClick={() => onChange('finance')}><NavGlyph kind="finance" /><span>Finanças</span></button><button className={active === 'budgets' ? 'bottom-nav-item active' : 'bottom-nav-item'} type="button" onClick={() => onChange('budgets')}><NavGlyph kind="budgets" /><span>Planos</span></button><button className="bottom-nav-add" type="button" onClick={onQuickExpense} aria-label="Adicionar despesa"><span>+</span></button><button className={active === 'history' ? 'bottom-nav-item active' : 'bottom-nav-item'} type="button" onClick={() => onChange('history')}><NavGlyph kind="history" /><span>Histórico</span></button><button className={active === 'settings' ? 'bottom-nav-item active' : 'bottom-nav-item'} type="button" onClick={() => onChange('settings')}><NavGlyph kind="settings" /><span>Ajustes</span></button></nav>
}

function NavGlyph({ kind }: { kind: 'home' | 'finance' | 'budgets' | 'history' | 'settings' }): ReactElement {
  const paths = { home: 'M3 10.5 12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-5v-6h-5v6H4.5A1.5 1.5 0 0 1 3 19.5z', finance: 'M4 5.5h16A1.5 1.5 0 0 1 21.5 7v10A1.5 1.5 0 0 1 20 18.5H4A1.5 1.5 0 0 1 2.5 17V7A1.5 1.5 0 0 1 4 5.5Zm0 4h17M6.5 14h4', budgets: 'M5 4.5h14A1.5 1.5 0 0 1 20.5 6v12A1.5 1.5 0 0 1 19 19.5H5A1.5 1.5 0 0 1 3.5 18V6A1.5 1.5 0 0 1 5 4.5Zm0 4h14M8 13h8M8 16h5', history: 'M12 7v5l3 2M21 12a9 9 0 1 1-2.64-6.36M21 4v5h-5', settings: 'M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm0-5v2m0 13v2M3.5 12h2m13 0h2M5.99 5.99l1.42 1.42m9.18 9.18 1.42 1.42m0-12.02-1.42 1.42M7.41 16.59l-1.42 1.42' } as const
  return <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[kind]} /></svg>
}
