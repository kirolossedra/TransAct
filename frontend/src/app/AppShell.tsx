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

const baseTabs: { key: Tab; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview', icon: '▦' },
  { key: 'deals', label: 'Project deals', icon: '⇄' },
  { key: 'loans', label: 'Loans', icon: '◫' },
  { key: 'salary', label: 'Direct deposits', icon: '↓' },
]

export function AppShell({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>('overview')
  const me = useQuery({ queryKey: ['me'], queryFn: () => api<User>('/api/me') })

  if (me.isLoading) return <main className="full-page-state"><LoadingState>Loading TransAct…</LoadingState></main>
  if (me.isError || !me.data) return <main className="full-page-state"><Alert>{messageOf(me.error)}</Alert><Button variant="secondary" onClick={onLogout}>Back to sign in</Button></main>

  const tabs = me.data.role === 'ADMIN' ? [...baseTabs, { key: 'admin' as Tab, label: 'Admin review', icon: '✓' }] : baseTabs

  return <div className="app-layout">
    <aside className="sidebar">
      <div>
        <div className="brand-lockup">
          <div className="brand-symbol">T</div>
          <div><strong>TransAct</strong><span>Brain Coin network</span></div>
        </div>
        <nav className="side-nav" aria-label="Primary navigation">
          {tabs.map(item => <button key={item.key} className={tab === item.key ? 'nav-item active' : 'nav-item'} onClick={() => setTab(item.key)}>
            <span className="nav-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span>
          </button>)}
        </nav>
      </div>
      <div className="account-panel">
        <div className="avatar">{me.data.displayName.slice(0, 1).toUpperCase()}</div>
        <div className="account-copy"><strong>{me.data.displayName}</strong><span>{me.data.role === 'ADMIN' ? 'Administrator' : 'Developer'}</span></div>
        <Button variant="ghost" className="signout-button" onClick={onLogout}>Sign out</Button>
      </div>
    </aside>

    <div className="main-column">
      <header className="mobile-header">
        <div className="brand-lockup"><div className="brand-symbol">T</div><div><strong>TransAct</strong><span>Brain Coin network</span></div></div>
        <Button variant="secondary" onClick={onLogout}>Sign out</Button>
      </header>
      <div className="mobile-tabs" role="navigation" aria-label="Mobile navigation">
        {tabs.map(item => <button key={item.key} className={tab === item.key ? 'mobile-tab active' : 'mobile-tab'} onClick={() => setTab(item.key)}>{item.label}</button>)}
      </div>
      <main className="content">
        {tab === 'overview' && <OverviewPage me={me.data} />}
        {tab === 'deals' && <DealsPage me={me.data} />}
        {tab === 'loans' && <LoansPage />}
        {tab === 'salary' && <SalariesPage me={me.data} />}
        {tab === 'admin' && me.data.role === 'ADMIN' && <AdminLoansPage />}
      </main>
    </div>
  </div>
}
