import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { Dashboard, User } from '../../domain/models'
import { Alert, Badge, Button, Card, PageHeader, StatCard } from '../../components/ui'
import { formatDateTime, messageOf, money, pretty } from '../../lib/format'

export function OverviewPage({ me }: { me: User }) {
  const queryClient = useQueryClient()
  const dashboard = useQuery({ queryKey: ['dashboard'], queryFn: () => api<Dashboard>('/api/dashboard') })
  const users = useQuery({ queryKey: ['users'], queryFn: () => api<User[]>('/api/users') })
  const [recipientId, setRecipientId] = useState('')
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')

  const transfer = useMutation({
    mutationFn: () => api('/api/transfers', { method: 'POST', body: JSON.stringify({ recipientId, amount: Number(amount), memo }) }),
    onSuccess: () => {
      setAmount('')
      setMemo('')
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  if (dashboard.isLoading) return <div className="state-panel">Loading dashboard…</div>
  if (dashboard.isError || !dashboard.data) return <Alert>{messageOf(dashboard.error)}</Alert>
  const data = dashboard.data

  return <>
    <PageHeader kicker="Account overview" title={`Good day, ${me.displayName.split(' ')[0]}`} description="Monitor your Brain Coin account, transaction reliability, and recent financial activity." />

    <section className="stats-grid">
      <StatCard label="Available Brain Coins" value={`${money.format(data.balance)} BC`} note="Ledger-derived available balance" emphasis />
      <StatCard label="T-score" value={`${data.tScore.score} / 100`} note={pretty(data.tScore.band)} />
      <StatCard label="Recent transactions" value={`${data.recentActivity.length}`} note="Latest account activity" />
    </section>

    <section className="dashboard-grid">
      <Card title="Trustworthiness record" subtitle="Transparent reliability history used in TransAct decisions.">
        <div className="score-summary">
          <div className="score-ring"><strong>{data.tScore.score}</strong><span>T-score</span></div>
          <div className="score-copy"><strong>{pretty(data.tScore.band)}</strong><span>Transactional reliability</span></div>
        </div>
        <div className="score-components">
          {data.tScore.components.map(component => <div className="score-component" key={component.name}>
            <div><strong>{component.name}</strong><span>{component.explanation}</span></div>
            <b className={component.impact >= 0 ? 'money-positive' : 'money-negative'}>{component.impact >= 0 ? '+' : ''}{component.impact}</b>
          </div>)}
        </div>
        <div className="info-callout">T-score measures observed transaction and commitment reliability only. It does not measure skill, intelligence, seniority, employability, or personal worth.</div>
      </Card>

      <Card title="Transfer Brain Coins" subtitle="Send available Brain Coins to another developer.">
        <form className="form-stack" onSubmit={event => { event.preventDefault(); transfer.mutate() }}>
          <label>Recipient<select required value={recipientId} onChange={event => setRecipientId(event.target.value)}><option value="">Select a developer</option>{users.data?.filter(user => user.id !== me.id).map(user => <option key={user.id} value={user.id}>{user.displayName}</option>)}</select></label>
          <label>Amount<div className="amount-input"><span>BC</span><input required inputMode="decimal" type="number" min="0.01" step="0.01" value={amount} onChange={event => setAmount(event.target.value)} placeholder="0.00" /></div></label>
          <label>Payment note<input value={memo} maxLength={280} onChange={event => setMemo(event.target.value)} placeholder="Purpose of this transfer" /></label>
          {transfer.isError && <Alert>{messageOf(transfer.error)}</Alert>}
          {transfer.isSuccess && <Alert tone="success">Transfer completed and posted to the ledger.</Alert>}
          <Button type="submit" disabled={transfer.isPending || !recipientId}>{transfer.isPending ? 'Processing transfer…' : 'Review & transfer'}</Button>
          <p className="form-footnote">Transfers are atomic and cannot partially post.</p>
        </form>
      </Card>
    </section>

    <Card title="Recent transactions" subtitle="Your latest Brain Coin ledger activity.">
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
  </>
}
