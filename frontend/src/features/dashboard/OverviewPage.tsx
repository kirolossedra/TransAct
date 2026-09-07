import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { Dashboard, User } from '../../domain/models'
import { Alert, Badge, Button, Card, PageHeader } from '../../components/ui'
import { formatDateTime, messageOf, money, pretty } from '../../lib/format'
import { BalanceTrend } from './BalanceTrend'

type DashboardDestination = 'deals' | 'loans' | 'salary'

export function OverviewPage({ me, onNavigate }: { me: User; onNavigate: (destination: DashboardDestination) => void }) {
  const queryClient = useQueryClient()
  const dashboard = useQuery({ queryKey: ['dashboard'], queryFn: () => api<Dashboard>('/api/dashboard') })
  const users = useQuery({ queryKey: ['users'], queryFn: () => api<User[]>('/api/users') })
  const [transferOpen, setTransferOpen] = useState(false)
  const [recipientId, setRecipientId] = useState('')
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')

  const transfer = useMutation({
    mutationFn: () => api('/api/transfers', { method: 'POST', body: JSON.stringify({ recipientId, amount: Number(amount), memo }) }),
    onSuccess: () => {
      setAmount('')
      setMemo('')
      setRecipientId('')
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const totals = useMemo(() => {
    const items = dashboard.data?.recentActivity || []
    return items.reduce((acc, item) => {
      if (item.amount >= 0) acc.incoming += item.amount
      else acc.outgoing += Math.abs(item.amount)
      return acc
    }, { incoming: 0, outgoing: 0 })
  }, [dashboard.data?.recentActivity])

  if (dashboard.isLoading) return <div className="state-panel">Loading dashboard…</div>
  if (dashboard.isError || !dashboard.data) return <Alert>{messageOf(dashboard.error)}</Alert>
  const data = dashboard.data

  const closeTransfer = () => {
    if (!transfer.isPending) setTransferOpen(false)
  }

  return <>
    <PageHeader kicker="Dashboard" title={`Welcome back, ${me.displayName.split(' ')[0]}`} description="A live view of your Brain Coin wallet, transactional reliability, and recent account movement." />

    <section className="namaa-overview-grid">
      <article className="wallet-balance-card">
        <div className="wallet-card-head">
          <div><span className="wallet-card-label">Total Brain Coin balance</span><strong>{money.format(data.balance)} BC</strong></div>
          <span className="wallet-network-chip">TransAct wallet</span>
        </div>
        <div className="wallet-card-footer">
          <div><span>Account holder</span><strong>{me.displayName}</strong></div>
          <div><span>Reliability</span><strong>{pretty(data.tScore.band)}</strong></div>
        </div>
      </article>

      <div className="financial-summary-grid">
        <div className="summary-tile"><span>Recent incoming</span><strong className="money-positive">+{money.format(totals.incoming)} BC</strong><small>Across visible ledger activity</small></div>
        <div className="summary-tile"><span>Recent outgoing</span><strong>{money.format(totals.outgoing)} BC</strong><small>Across visible ledger activity</small></div>
        <div className="summary-tile"><span>T-score</span><strong>{data.tScore.score}/100</strong><small>{pretty(data.tScore.band)}</small></div>
      </div>
    </section>

    <section className="quick-action-strip" aria-label="Quick financial actions">
      <button onClick={() => setTransferOpen(true)}><span className="quick-action-icon">↗</span><div><strong>Send coins</strong><small>Direct transfer</small></div></button>
      <button onClick={() => onNavigate('loans')}><span className="quick-action-icon">◫</span><div><strong>Apply for loan</strong><small>Contribution credit</small></div></button>
      <button onClick={() => onNavigate('deals')}><span className="quick-action-icon">⇄</span><div><strong>Project deal</strong><small>Create an agreement</small></div></button>
      <button onClick={() => onNavigate('salary')}><span className="quick-action-icon">↓</span><div><strong>Direct deposit</strong><small>Recurring payment</small></div></button>
    </section>

    <section className="namaa-insight-grid">
      <Card title="Balance movement" subtitle="Reconstructed from your current balance and latest ledger entries.">
        <BalanceTrend balance={data.balance} activity={data.recentActivity} />
      </Card>

      <Card title="T-score performance" subtitle="Explainable reliability evidence, not a hidden ranking.">
        <div className="tscore-overview">
          <div className="tscore-number"><strong>{data.tScore.score}</strong><span>/100</span></div>
          <div className="tscore-band"><Badge tone="info">{pretty(data.tScore.band)}</Badge><span>Transactional reliability</span></div>
        </div>
        <div className="tscore-progress"><span style={{ width: `${Math.max(0, Math.min(100, data.tScore.score))}%` }} /></div>
        <div className="compact-score-list">
          {data.tScore.components.slice(0, 4).map(component => <div key={component.name}>
            <div><strong>{component.name}</strong><span>{component.explanation}</span></div>
            <b className={component.impact >= 0 ? 'money-positive' : 'money-negative'}>{component.impact >= 0 ? '+' : ''}{component.impact}</b>
          </div>)}
        </div>
        <div className="info-callout compact-callout">Balance and T-score stay separate: holding more Brain Coins never increases trustworthiness.</div>
      </Card>
    </section>

    <Card title="Recent transactions" subtitle="Latest Brain Coin ledger activity across transfers, deals, loans, and recurring deposits.">
      <div className="transaction-table-wrap">
        <table className="transaction-table"><thead><tr><th>Transaction</th><th>Counterparty</th><th>Note</th><th>Date</th><th className="align-right">Amount</th></tr></thead><tbody>
          {data.recentActivity.map(item => <tr key={item.transactionId}>
            <td><Badge tone="info">{pretty(item.type)}</Badge></td><td>{item.counterparty}</td><td className="muted-cell">{item.memo || '—'}</td><td className="muted-cell">{formatDateTime(item.createdAt)}</td><td className={`align-right amount-cell ${item.amount >= 0 ? 'money-positive' : 'money-negative'}`}>{item.amount >= 0 ? '+' : ''}{money.format(item.amount)} BC</td>
          </tr>)}
          {!data.recentActivity.length && <tr><td colSpan={5}>No transactions yet.</td></tr>}
        </tbody></table>
      </div>
      <div className="transaction-cards">
        {data.recentActivity.map(item => <article className="transaction-card" key={item.transactionId}>
          <div className="transaction-card-top"><Badge tone="info">{pretty(item.type)}</Badge><strong className={item.amount >= 0 ? 'money-positive' : 'money-negative'}>{item.amount >= 0 ? '+' : ''}{money.format(item.amount)} BC</strong></div>
          <h3>{item.counterparty}</h3><p>{item.memo || 'No payment note'}</p><time>{formatDateTime(item.createdAt)}</time>
        </article>)}
      </div>
    </Card>

    {transferOpen && <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.currentTarget === event.target) closeTransfer() }}>
      <section className="finance-modal" role="dialog" aria-modal="true" aria-labelledby="transfer-title">
        <div className="finance-modal-head"><div><span>Brain Coin payment</span><h2 id="transfer-title">Send Brain Coins</h2><p>Transfer available balance directly to another developer.</p></div><button className="modal-close" onClick={closeTransfer} aria-label="Close transfer dialog">×</button></div>
        <form className="form-stack" onSubmit={event => { event.preventDefault(); transfer.mutate() }}>
          <label>Recipient<select required value={recipientId} onChange={event => setRecipientId(event.target.value)}><option value="">Select a developer</option>{users.data?.filter(user => user.id !== me.id).map(user => <option key={user.id} value={user.id}>{user.displayName}</option>)}</select></label>
          <label>Amount<div className="amount-input"><span>BC</span><input required inputMode="decimal" type="number" min="0.01" step="0.01" value={amount} onChange={event => setAmount(event.target.value)} placeholder="0.00" /></div></label>
          <label>Payment note<input value={memo} maxLength={280} onChange={event => setMemo(event.target.value)} placeholder="Purpose of this transfer" /></label>
          {transfer.isError && <Alert>{messageOf(transfer.error)}</Alert>}
          {transfer.isSuccess && <Alert tone="success">Transfer completed and posted to the ledger.</Alert>}
          <div className="modal-actions"><Button type="button" variant="secondary" onClick={closeTransfer}>Cancel</Button><Button type="submit" disabled={transfer.isPending || !recipientId}>{transfer.isPending ? 'Processing…' : 'Review & transfer'}</Button></div>
          <p className="form-footnote">Transfers are atomic and cannot partially post.</p>
        </form>
      </section>
    </div>}
  </>
}
