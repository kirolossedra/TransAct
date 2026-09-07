import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { Deal, User } from '../../domain/models'
import { Alert, Badge, Button, Card, PageHeader } from '../../components/ui'
import { formatDate, messageOf, money } from '../../lib/format'

export function DealsPage({ me }: { me: User }) {
  const queryClient = useQueryClient()
  const deals = useQuery({ queryKey: ['deals'], queryFn: () => api<Deal[]>('/api/deals') })
  const users = useQuery({ queryKey: ['users'], queryFn: () => api<User[]>('/api/users') })
  const [form, setForm] = useState({ developerId: '', title: '', description: '', amount: '', dueDate: '' })
  const refresh = () => { queryClient.invalidateQueries({ queryKey: ['deals'] }); queryClient.invalidateQueries({ queryKey: ['dashboard'] }) }
  const create = useMutation({ mutationFn: () => api('/api/deals', { method: 'POST', body: JSON.stringify({ ...form, amount: Number(form.amount), dueDate: form.dueDate || null }) }), onSuccess: () => { setForm({ developerId: '', title: '', description: '', amount: '', dueDate: '' }); refresh() } })
  const action = useMutation({ mutationFn: ({ id, verb }: { id: string; verb: string }) => api(`/api/deals/${id}/${verb}`, { method: 'POST' }), onSuccess: refresh })

  return <>
    <PageHeader kicker="Developer commitments" title="Project deals" description="Create clear work agreements, track delivery, and settle completed work in Brain Coins." />
    <section className="split-grid">
      <Card title="Create a project deal" subtitle="Define the work, assigned developer, amount, and expected completion date.">
        <form className="form-stack" onSubmit={event => { event.preventDefault(); create.mutate() }}>
          <label>Developer<select required value={form.developerId} onChange={event => setForm({ ...form, developerId: event.target.value })}><option value="">Select a developer</option>{users.data?.filter(user => user.id !== me.id).map(user => <option key={user.id} value={user.id}>{user.displayName}</option>)}</select></label>
          <label>Deal title<input required value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="e.g. Review authentication architecture" /></label>
          <label>Scope of work<textarea required rows={4} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} placeholder="Describe the expected deliverable" /></label>
          <div className="field-grid"><label>Compensation (BC)<input required type="number" min="0.01" step="0.01" value={form.amount} onChange={event => setForm({ ...form, amount: event.target.value })} /></label><label>Due date<input type="date" value={form.dueDate} onChange={event => setForm({ ...form, dueDate: event.target.value })} /></label></div>
          {create.isError && <Alert>{messageOf(create.error)}</Alert>}
          <Button type="submit" disabled={create.isPending}>Create deal proposal</Button>
        </form>
      </Card>
      <Card title="How reliability is recorded" subtitle="Only explicit project outcomes affect the transactional reliability record.">
        <div className="rule-list">
          <div><Badge tone="success">Completed</Badge><p>Positive evidence that the accepted commitment was fulfilled.</p></div>
          <div><Badge tone="warning">Overdue</Badge><p>Negative evidence while an accepted commitment remains unresolved.</p></div>
          <div><Badge tone="danger">Disputed</Badge><p>Records a dispute event without declaring either party professionally or morally at fault.</p></div>
          <div><Badge>Cancelled</Badge><p>A proposal cancelled before acceptance does not penalize the developer.</p></div>
        </div>
      </Card>
    </section>

    <Card title="Your project deals" subtitle="Active and historical commitments associated with your account.">
      {deals.isLoading && <div className="state-panel">Loading deals…</div>}
      {deals.isError && <Alert>{messageOf(deals.error)}</Alert>}
      <div className="record-list">{deals.data?.map(deal => <article className="record-card" key={deal.id}>
        <div className="record-header"><div><Badge tone={deal.status === 'COMPLETED' ? 'success' : deal.status === 'DISPUTED' ? 'danger' : deal.status === 'ACCEPTED' ? 'info' : 'neutral'}>{deal.status}</Badge><h3>{deal.title}</h3></div><strong className="record-amount">{money.format(deal.amount)} BC</strong></div>
        <p>{deal.description}</p>
        <dl className="record-meta"><div><dt>Requester</dt><dd>{deal.requester.displayName}</dd></div><div><dt>Developer</dt><dd>{deal.developer.displayName}</dd></div><div><dt>Due</dt><dd>{deal.dueDate ? formatDate(deal.dueDate) : 'Open'}</dd></div></dl>
        <div className="button-row">
          {deal.status === 'PROPOSED' && deal.developer.id === me.id && <Button onClick={() => action.mutate({ id: deal.id, verb: 'accept' })}>Accept deal</Button>}
          {deal.status === 'PROPOSED' && deal.requester.id === me.id && <Button variant="secondary" onClick={() => action.mutate({ id: deal.id, verb: 'cancel' })}>Cancel proposal</Button>}
          {deal.status === 'ACCEPTED' && deal.requester.id === me.id && <Button onClick={() => action.mutate({ id: deal.id, verb: 'complete' })}>Confirm completion & pay</Button>}
          {deal.status === 'ACCEPTED' && (deal.requester.id === me.id || deal.developer.id === me.id) && <Button variant="danger" onClick={() => action.mutate({ id: deal.id, verb: 'dispute' })}>Open dispute</Button>}
        </div>
      </article>)}</div>
      {action.isError && <Alert>{messageOf(action.error)}</Alert>}
    </Card>
  </>
}
