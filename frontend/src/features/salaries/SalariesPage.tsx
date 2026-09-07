import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { Salary, User } from '../../domain/models'
import { Alert, Badge, Button, Card, PageHeader } from '../../components/ui'
import { formatDateTime, messageOf, money } from '../../lib/format'

export function SalariesPage({ me }: { me: User }) {
  const queryClient = useQueryClient()
  const salaries = useQuery({ queryKey: ['salaries'], queryFn: () => api<Salary[]>('/api/salaries') })
  const users = useQuery({ queryKey: ['users'], queryFn: () => api<User[]>('/api/users') })
  const [form, setForm] = useState({ recipientId: '', label: '', amount: '', intervalDays: '30', firstPaymentAt: '' })
  const refresh = () => { queryClient.invalidateQueries({ queryKey: ['salaries'] }); queryClient.invalidateQueries({ queryKey: ['dashboard'] }) }
  const create = useMutation({ mutationFn: () => api('/api/salaries', { method: 'POST', body: JSON.stringify({ recipientId: form.recipientId, label: form.label, amount: Number(form.amount), intervalDays: Number(form.intervalDays), firstPaymentAt: form.firstPaymentAt ? new Date(form.firstPaymentAt).toISOString() : null }) }), onSuccess: () => { setForm({ recipientId: '', label: '', amount: '', intervalDays: '30', firstPaymentAt: '' }); refresh() } })
  const stop = useMutation({ mutationFn: (id: string) => api(`/api/salaries/${id}/deactivate`, { method: 'POST' }), onSuccess: refresh })

  return <>
    <PageHeader kicker="Recurring compensation" title="Direct deposits" description="Set up recurring Brain Coin compensation for ongoing voluntary project work." />
    <section className="split-grid">
      <Card title="Create a direct deposit" subtitle="Recurring payments use the same authoritative double-entry ledger as one-time transfers.">
        <form className="form-stack" onSubmit={event => { event.preventDefault(); create.mutate() }}>
          <label>Recipient<select required value={form.recipientId} onChange={event => setForm({ ...form, recipientId: event.target.value })}><option value="">Select a developer</option>{users.data?.filter(user => user.id !== me.id).map(user => <option key={user.id} value={user.id}>{user.displayName}</option>)}</select></label>
          <label>Agreement name<input required value={form.label} onChange={event => setForm({ ...form, label: event.target.value })} placeholder="e.g. Monthly maintainer stipend" /></label>
          <div className="field-grid"><label>Payment amount (BC)<input required type="number" min="0.01" step="0.01" value={form.amount} onChange={event => setForm({ ...form, amount: event.target.value })} /></label><label>Frequency (days)<input required type="number" min="1" max="365" value={form.intervalDays} onChange={event => setForm({ ...form, intervalDays: event.target.value })} /></label></div>
          <label>First payment<input type="datetime-local" value={form.firstPaymentAt} onChange={event => setForm({ ...form, firstPaymentAt: event.target.value })} /></label>
          {create.isError && <Alert>{messageOf(create.error)}</Alert>}
          <Button type="submit" disabled={create.isPending}>{create.isPending ? 'Scheduling…' : 'Schedule direct deposit'}</Button>
        </form>
      </Card>
      <Card title="Payment controls" subtitle="Recurring compensation follows the same financial safeguards as manual transfers.">
        <div className="rule-list"><div><Badge tone="info">Atomic</Badge><p>Every run posts as one complete double-entry transaction.</p></div><div><Badge tone="warning">Balance check</Badge><p>Insufficient funds never create a partial payment.</p></div><div><Badge tone="success">Protected</Badge><p>The agreement row is locked while processing to reduce duplicate execution.</p></div></div>
      </Card>
    </section>

    <Card title="Direct deposit agreements" subtitle="Recurring Brain Coin payments associated with your account.">
      {salaries.isLoading && <div className="state-panel">Loading agreements…</div>}
      <div className="record-list">{salaries.data?.map(salary => <article className="record-card" key={salary.id}>
        <div className="record-header"><div><Badge tone={salary.active ? 'success' : 'neutral'}>{salary.active ? 'ACTIVE' : 'STOPPED'}</Badge><h3>{salary.label}</h3><span className="record-subtitle">{salary.payer.id === me.id ? `You pay ${salary.recipient.displayName}` : `${salary.payer.displayName} pays you`}</span></div><strong className="record-amount">{money.format(salary.amount)} BC</strong></div>
        <dl className="record-meta"><div><dt>Frequency</dt><dd>Every {salary.intervalDays} days</dd></div><div><dt>Next payment</dt><dd>{formatDateTime(salary.nextPaymentAt)}</dd></div><div><dt>Last run</dt><dd>{salary.lastRunStatus || 'Not run yet'}</dd></div></dl>
        {salary.active && salary.payer.id === me.id && <div className="button-row"><Button variant="secondary" onClick={() => stop.mutate(salary.id)}>Stop direct deposit</Button></div>}
      </article>)}</div>
      {salaries.isError && <Alert>{messageOf(salaries.error)}</Alert>}
    </Card>
  </>
}
