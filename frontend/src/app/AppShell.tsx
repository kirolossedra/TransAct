import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { User } from '../domain/models'
import { Alert, Button, LoadingState } from '../components/ui'
import { OverviewPage } from '../features/dashboard/OverviewPage'
import { DealsPage } from '../features/deals/DealsPage'
import { LoansPage } from '../features/loans/LoansPage'
import { SalariesPage } from '../features/salaries/SalariesPage'
import { AdminLoansPage } from '../features/admin/AdminLoansPage'
import { messageOf } from '../lib/format'

type Tab = 'overview' | 'deals' | 'loans' | 'salary' | 'admin'
type NavItem = { key: Tab; label: string; icon: 'overview' | 'deals' | 'loans' | 'salary' | 'admin' }

const baseTabs: NavItem[] = [
  { key: 'overview', label: 'Dashboard', icon: 'overview' },
  { key: 'deals', label: 'Project deals', icon: 'deals' },
  { key: 'loans', label: 'Loans', icon: 'loans' },
  { key: 'salary', label: 'Direct deposits', icon: 'salary' },
]

export function AppShell({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>('overview')
  const me = useQuery({ queryKey: ['me'], queryFn: () => api<User>('/api/me') })

  if (me.isLoading) return <main className="full-page-state"><LoadingState>Loading TransAct…</LoadingState></main>
  if (me.isError || !me.data) return <main className="full-page-state"><Alert>{messageOf(me.error)}</Alert><Button variant="secondary" onClick={onLogout}>Back to sign in</Button></main>

  const tabs: NavItem[] = me.data.role === 'ADMIN' ? [...baseTabs, { key: 'admin', label: 'Admin review', icon: 'admin' }] : baseTabs
  const active = tabs.find(item => item.key === tab) || tabs[0]

  return <div className="app-layout namaa-shell">
    <aside className="sidebar namaa-sidebar">
      <div>
        <div className="brand-lockup namaa-brand">
          <div className="brand-symbol">T</div>
          <div><strong>TransAct</strong><span>Brain Coin network</span></div>
        </div>
        <p className="nav-section-label">Workspace</p>
        <nav className="side-nav" aria-label="Primary navigation">
          {tabs.map(item => <button key={item.key} className={tab === item.key ? 'nav-item active' : 'nav-item'} onClick={() => setTab(item.key)}>
            <NavIcon name={item.icon} />
            <span>{item.label}</span>
          </button>)}
        </nav>
      </div>

      <div className="sidebar-bottom">
        <div className="network-card">
          <span>Network</span>
          <strong>Closed-loop economy</strong>
          <small>Brain Coins settle voluntary developer contribution.</small>
        </div>
        <div className="account-panel">
          <div className="avatar">{me.data.displayName.slice(0, 1).toUpperCase()}</div>
          <div className="account-copy"><strong>{me.data.displayName}</strong><span>{me.data.role === 'ADMIN' ? 'Administrator' : 'Developer'}</span></div>
          <Button variant="ghost" className="signout-button" onClick={onLogout}>Sign out</Button>
        </div>
      </div>
    </aside>

    <div className="main-column">
      <header className="desktop-topbar">
        <div className="topbar-page"><span>TransAct / {active.label}</span><strong>{active.label}</strong></div>
        <div className="topbar-account"><div className="topbar-balance-chip"><span>Brain Coin account</span><strong>Active</strong></div><div className="avatar small-avatar">{me.data.displayName.slice(0, 1).toUpperCase()}</div><div className="topbar-user"><strong>{me.data.displayName}</strong><span>{me.data.role === 'ADMIN' ? 'Administrator' : 'Developer'}</span></div></div>
      </header>

      <header className="mobile-header">
        <div className="brand-lockup"><div className="brand-symbol">T</div><div><strong>TransAct</strong><span>Brain Coin network</span></div></div>
        <Button variant="secondary" onClick={onLogout}>Sign out</Button>
      </header>
      <div className="mobile-tabs" role="navigation" aria-label="Mobile navigation">
        {tabs.map(item => <button key={item.key} className={tab === item.key ? 'mobile-tab active' : 'mobile-tab'} onClick={() => setTab(item.key)}>{item.label}</button>)}
      </div>

      <main className="content namaa-content">
        {tab === 'overview' && <OverviewPage me={me.data} onNavigate={destination => setTab(destination)} />}
        {tab === 'deals' && <DealsPage me={me.data} />}
        {tab === 'loans' && <LoansPage />}
        {tab === 'salary' && <SalariesPage me={me.data} />}
        {tab === 'admin' && me.data.role === 'ADMIN' && <AdminLoansPage />}
      </main>
    </div>
  </div>
}

function NavIcon({ name }: { name: NavItem['icon'] }) {
  if (name === 'overview') return <svg className="nav-svg" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>
  if (name === 'deals') return <svg className="nav-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8.5h16v10.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M9 8.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2.5M4 12h16"/></svg>
  if (name === 'loans') return <svg className="nav-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9 12 4l9 5"/><path d="M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/></svg>
  if (name === 'salary') return <svg className="nav-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v13"/><path d="m7 11 5 5 5-5"/><path d="M5 21h14"/></svg>
  return <svg className="nav-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 20 6v5c0 5-3.2 8.3-8 10-4.8-1.7-8-5-8-10V6z"/><path d="m9 12 2 2 4-4"/></svg>
}
