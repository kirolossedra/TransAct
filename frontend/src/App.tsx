import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, clearCredentials, credentials, saveCredentials } from './api'
import type { Dashboard, Deal, Loan, Salary, User } from './types'

type Tab = 'overview' | 'deals' | 'loans' | 'salary' | 'admin'

const money = new Intl.NumberFormat('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const when = (value?: string) => value ? new Date(value).toLocaleString() : '—'
const day = (value?: string) => value ? new Date(value).toLocaleDateString() : '—'

export default function App() {
  const [authenticated, setAuthenticated] = useState(Boolean(credentials()))
  return authenticated ? <Shell onLogout={() => { clearCredentials(); setAuthenticated(false) }} /> : <Login onSuccess={() => setAuthenticated(true)} />
}

function Login({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState('developer')
  const [password, setPassword] = useState('dev-demo')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    saveCredentials({ username, password })
    try {
      await api<User>('/api/me')
      onSuccess()
    } catch (e) {
      clearCredentials()
      setError(messageOf(e))
    } finally {
      setBusy(false)
    }
  }

  return <main className="login-shell">
    <section className="login-card">
      <div className="brand-mark">TA</div>
      <p className="eyebrow">Developer reciprocity economy</p>
      <h1>TransAct</h1>
      <p className="lede">Brain Coins make voluntary developer effort transferable. T-score records transactional reliability without pretending to measure human worth or technical skill.</p>
      <form onSubmit={submit} className="stack">
        <label>Username<input value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" /></label>
        <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" /></label>
        {error && <ErrorBox>{error}</ErrorBox>}
        <button className="primary" disabled={busy}>{busy ? 'Signing in…' : 'Enter TransAct'}</button>
      </form>
      <div className="demo-note">
        <strong>Demo identities</strong>
        <span>Developer: developer / dev-demo</span>
        <span>Administrator: admin / admin-demo</span>
        <small>Replace these environment-controlled demo credentials before any public deployment.</small>
      </div>
    </section>
  </main>
}

function Shell({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>('overview')
  const me = useQuery({ queryKey: ['me'], queryFn: () => api<User>('/api/me') })
  if (me.isLoading) return <FullState>Loading TransAct…</FullState>
  if (me.isError || !me.data) return <FullState><ErrorBox>{messageOf(me.error)}</ErrorBox><button onClick={onLogout}>Back to sign in</button></FullState>

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'deals', label: 'Project deals' },
    { key: 'loans', label: 'Loans' },
    { key: 'salary', label: 'Direct deposits' },
  ]
  if (me.data.role === 'ADMIN') tabs.push({ key: 'admin', label: 'Admin review' })

  return <div className="app-shell">
    <aside className="sidebar">
      <div>
        <div className="sidebar-brand"><div className="brand-mark small">TA</div><div><strong>TransAct</strong><span>Brain Coin network</span></div></div>
        <nav>{tabs.map(item => <button key={item.key} className={tab === item.key ? 'nav-active' : ''} onClick={() => setTab(item.key)}>{item.label}</button>)}</nav>
      </div>
      <div className="identity-card">
        <strong>{me.data.displayName}</strong>
        <span>{me.data.role}</span>
        <button className="quiet" onClick={onLogout}>Sign out</button>
      </div>
    </aside>
    <main className="content">
      {tab === 'overview' && <Overview me={me.data} />}
      {tab === 'deals' && <Deals me={me.data} />}
      {tab === 'loans' && <Loans />}
      {tab === 'salary' && <Salaries me={me.data} />}
      {tab === 'admin' && me.data.role === 'ADMIN' && <AdminLoans />}
    </main>
  </div>
}

function Overview({ me }: { me: User }) {
  const qc = useQueryClient()
  const dashboard = useQuery({ queryKey: ['dashboard'], queryFn: () => api<Dashboard>('/api/dashboard') })
  const users = useQuery({ queryKey: ['users'], queryFn: () => api<User[]>('/api/users') })
  const [recipientId, setRecipientId] = useState('')
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')

  const transfer = useMutation({
    mutationFn: () => api('/api/transfers', { method: 'POST', body: JSON.stringify({ recipientId, amount: Number(amount), memo }) }),
    onSuccess: () => {
      setAmount(''); setMemo('')
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  if (dashboard.isLoading) return <FullState>Loading dashboard…</FullState>
  if (dashboard.isError || !dashboard.data) return <ErrorBox>{messageOf(dashboard.error)}</ErrorBox>
  const d = dashboard.data

  return <>
    <PageHead eyebrow="Closed-loop developer economy" title={`Welcome, ${me.displayName.split(' ')[0]}`} description="Your balance records transferable contribution. Your T-score records only observed transactional reliability." />
    <section className="metric-grid">
      <Metric label="Brain Coin balance" value={`${money.format(d.balance)} BC`} note="Derived from ledger postings" />
      <Metric label="T-score" value={`${d.tScore.score}/100`} note={d.tScore.band.replaceAll('_', ' ')} />
      <Metric label="Recent activity" value={`${d.recentActivity.length}`} note="Latest ledger postings" />
    </section>

    <section className="two-column">
      <Card title="T-score explanation" subtitle="No opaque composite. Every current contribution is visible.">
        <div className="score-orbit"><strong>{d.tScore.score}</strong><span>T-score</span></div>
        <div className="breakdown">
          {d.tScore.components.map(component => <div className="breakdown-row" key={component.name}>
            <div><strong>{component.name}</strong><span>{component.explanation}</span></div>
            <b className={component.impact >= 0 ? 'positive' : 'negative'}>{component.impact >= 0 ? '+' : ''}{component.impact}</b>
          </div>)}
        </div>
        <p className="principle">T-score is a history of commitments on TransAct. It is not a proxy for intelligence, employability, seniority, or personal worth.</p>
      </Card>

      <Card title="Send Brain Coins" subtitle="A direct ledger transfer to another developer.">
        <form className="stack" onSubmit={e => { e.preventDefault(); transfer.mutate() }}>
          <label>Developer<select required value={recipientId} onChange={e => setRecipientId(e.target.value)}><option value="">Choose a developer</option>{users.data?.map(user => <option key={user.id} value={user.id}>{user.displayName}</option>)}</select></label>
          <label>Amount (BC)<input required type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} /></label>
          <label>Memo<input value={memo} maxLength={280} onChange={e => setMemo(e.target.value)} placeholder="What is this transfer for?" /></label>
          {transfer.isError && <ErrorBox>{messageOf(transfer.error)}</ErrorBox>}
          {transfer.isSuccess && <SuccessBox>Transfer posted atomically to the Brain Coin ledger.</SuccessBox>}
          <button className="primary" disabled={transfer.isPending}>Transfer Brain Coins</button>
        </form>
      </Card>
    </section>

    <Card title="Ledger activity" subtitle="Signed postings: positive means Brain Coins entered your account; negative means they left.">
      <div className="table-wrap"><table><thead><tr><th>Type</th><th>Counterparty</th><th>Memo</th><th>Date</th><th className="right">Amount</th></tr></thead><tbody>
        {d.recentActivity.map(item => <tr key={item.transactionId}><td><Pill>{pretty(item.type)}</Pill></td><td>{item.counterparty}</td><td>{item.memo || '—'}</td><td>{when(item.createdAt)}</td><td className={`right amount ${item.amount >= 0 ? 'positive' : 'negative'}`}>{item.amount >= 0 ? '+' : ''}{money.format(item.amount)} BC</td></tr>)}
        {!d.recentActivity.length && <tr><td colSpan={5}>No transactions yet.</td></tr>}
      </tbody></table></div>
    </Card>
  </>
}

function Deals({ me }: { me: User }) {
  const qc = useQueryClient()
  const deals = useQuery({ queryKey: ['deals'], queryFn: () => api<Deal[]>('/api/deals') })
  const users = useQuery({ queryKey: ['users'], queryFn: () => api<User[]>('/api/users') })
  const [form, setForm] = useState({ developerId: '', title: '', description: '', amount: '', dueDate: '' })

  const refresh = () => { qc.invalidateQueries({ queryKey: ['deals'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }) }
  const create = useMutation({ mutationFn: () => api('/api/deals', { method: 'POST', body: JSON.stringify({ ...form, amount: Number(form.amount), dueDate: form.dueDate || null }) }), onSuccess: () => { setForm({ developerId: '', title: '', description: '', amount: '', dueDate: '' }); refresh() } })
  const action = useMutation({ mutationFn: ({ id, verb }: { id: string; verb: string }) => api(`/api/deals/${id}/${verb}`, { method: 'POST' }), onSuccess: refresh })

  return <>
    <PageHead eyebrow="Project commitments" title="Developer deals" description="A deal records who promised what, for how many Brain Coins, and whether the commitment was completed, disputed, or cancelled." />
    <section className="two-column align-start">
      <Card title="Propose a deal" subtitle="Payment is released only after an accepted deal is marked complete by the requester.">
        <form className="stack" onSubmit={e => { e.preventDefault(); create.mutate() }}>
          <label>Developer<select required value={form.developerId} onChange={e => setForm({ ...form, developerId: e.target.value })}><option value="">Choose</option>{users.data?.map(u => <option key={u.id} value={u.id}>{u.displayName}</option>)}</select></label>
          <label>Title<input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label>
          <label>Work description<textarea required rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
          <div className="form-grid"><label>Brain Coins<input required type="number" min="0.01" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></label><label>Due date<input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></label></div>
          {create.isError && <ErrorBox>{messageOf(create.error)}</ErrorBox>}
          <button className="primary" disabled={create.isPending}>Create proposal</button>
        </form>
      </Card>
      <Card title="Reliability rule" subtitle="Project history can influence T-score, but only through explicit deal outcomes.">
        <div className="rule-block"><b>Completed</b><span>Positive reliability evidence for the assigned developer.</span></div>
        <div className="rule-block"><b>Accepted + overdue</b><span>Visible negative evidence until resolved.</span></div>
        <div className="rule-block"><b>Disputed</b><span>Negative evidence, but never an automatic verdict about who was morally or professionally at fault.</span></div>
        <div className="rule-block"><b>Cancelled before acceptance</b><span>No reliability penalty to the developer.</span></div>
      </Card>
    </section>

    <Card title="Your project deals">
      {deals.isLoading && <p>Loading deals…</p>}
      {deals.isError && <ErrorBox>{messageOf(deals.error)}</ErrorBox>}
      <div className="deal-list">{deals.data?.map(deal => <article className="deal-card" key={deal.id}>
        <div className="deal-top"><div><Pill>{deal.status}</Pill><h3>{deal.title}</h3></div><strong>{money.format(deal.amount)} BC</strong></div>
        <p>{deal.description}</p>
        <div className="deal-meta"><span>Requester: {deal.requester.displayName}</span><span>Developer: {deal.developer.displayName}</span><span>Due: {deal.dueDate ? day(deal.dueDate) : 'Open'}</span></div>
        <div className="actions">
          {deal.status === 'PROPOSED' && deal.developer.id === me.id && <button onClick={() => action.mutate({ id: deal.id, verb: 'accept' })}>Accept</button>}
          {deal.status === 'PROPOSED' && deal.requester.id === me.id && <button className="quiet" onClick={() => action.mutate({ id: deal.id, verb: 'cancel' })}>Cancel</button>}
          {deal.status === 'ACCEPTED' && deal.requester.id === me.id && <button className="primary small-button" onClick={() => action.mutate({ id: deal.id, verb: 'complete' })}>Confirm completion + pay</button>}
          {deal.status === 'ACCEPTED' && (deal.requester.id === me.id || deal.developer.id === me.id) && <button className="danger-outline" onClick={() => action.mutate({ id: deal.id, verb: 'dispute' })}>Dispute</button>}
        </div>
      </article>)}</div>
      {action.isError && <ErrorBox>{messageOf(action.error)}</ErrorBox>}
    </Card>
  </>
}

function Loans() {
  const qc = useQueryClient()
  const loans = useQuery({ queryKey: ['loans'], queryFn: () => api<Loan[]>('/api/loans') })
  const [amount, setAmount] = useState('')
  const [purpose, setPurpose] = useState('')
  const [qualifications, setQualifications] = useState('')
  const [repay, setRepay] = useState<Record<string, string>>({})
  const refresh = () => { qc.invalidateQueries({ queryKey: ['loans'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }) }
  const apply = useMutation({ mutationFn: () => api('/api/loans', { method: 'POST', body: JSON.stringify({ amount: Number(amount), purpose, qualifications }) }), onSuccess: () => { setAmount(''); setPurpose(''); setQualifications(''); refresh() } })
  const repayment = useMutation({ mutationFn: ({ id }: { id: string }) => api(`/api/loans/${id}/repay`, { method: 'POST', body: JSON.stringify({ amount: Number(repay[id]) }) }), onSuccess: refresh })

  return <>
    <PageHead eyebrow="Human-reviewed lending" title="Brain Coin loans" description="Payment history is gathered automatically. A review adapter assesses history and qualifications, then the application waits through a three-day administrator review window before a human decision." />
    <section className="two-column align-start">
      <Card title="Apply for a loan" subtitle="A real AI provider is intentionally not faked before an API key is configured; the current adapter identifies itself as a heuristic placeholder.">
        <form className="stack" onSubmit={e => { e.preventDefault(); apply.mutate() }}>
          <label>Amount (BC)<input required type="number" min="0.01" max="10000" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} /></label>
          <label>Purpose<textarea required rows={3} value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="What will the Brain Coins fund?" /></label>
          <label>Qualifications / context<textarea required rows={6} value={qualifications} onChange={e => setQualifications(e.target.value)} placeholder="Relevant project history, ability to repay through future contribution, and context an administrator should understand." /></label>
          {apply.isError && <ErrorBox>{messageOf(apply.error)}</ErrorBox>}
          {apply.isSuccess && <SuccessBox>Application entered administrator review.</SuccessBox>}
          <button className="primary" disabled={apply.isPending}>Submit application</button>
        </form>
      </Card>
      <Card title="Decision boundary" subtitle="The model never gets the final button.">
        <div className="flow"><span>1. Payment history</span><b>→</b><span>2. Review adapter</span><b>→</b><span>3. Qualifications review</span><b>→</b><span>4. 3-day human review</span><b>→</b><span>5. Administrator decision</span></div>
        <p className="principle">Loan access can materially affect participation in this economy. The evidence must therefore remain inspectable, contestable, and subordinate to accountable human judgment.</p>
      </Card>
    </section>

    <Card title="Your applications and loans">
      <div className="loan-list">{loans.data?.map(loan => <article className="loan-card" key={loan.id}>
        <div className="deal-top"><div><Pill>{loan.status}</Pill><h3>{money.format(loan.amount)} BC · {loan.purpose}</h3></div><span>Submitted {day(loan.submittedAt)}</span></div>
        <div className="review-grid">
          <ReviewPanel title={`Payment history · ${loan.paymentReviewBand}`} text={loan.paymentHistoryReview} provider={loan.reviewProvider} />
          <ReviewPanel title={`Qualifications · ${loan.qualificationReviewBand}`} text={loan.qualificationReview} provider={loan.reviewProvider} />
        </div>
        <div className="deal-meta"><span>Admin review opens for decision: {when(loan.adminReviewDueAt)}</span><span>Outstanding: {money.format(loan.outstandingAmount)} BC</span>{loan.repaymentDueAt && <span>Repayment due: {day(loan.repaymentDueAt)}</span>}</div>
        {loan.adminNotes && <p className="admin-note"><strong>Administrator note:</strong> {loan.adminNotes}</p>}
        {loan.status === 'APPROVED' && <form className="inline-form" onSubmit={e => { e.preventDefault(); repayment.mutate({ id: loan.id }) }}><input required type="number" min="0.01" max={loan.outstandingAmount} step="0.01" placeholder="Repayment BC" value={repay[loan.id] || ''} onChange={e => setRepay({ ...repay, [loan.id]: e.target.value })} /><button>Repay</button></form>}
      </article>)}</div>
      {loans.isLoading && <p>Loading loans…</p>}
      {(loans.isError || repayment.isError) && <ErrorBox>{messageOf(loans.error || repayment.error)}</ErrorBox>}
    </Card>
  </>
}

function Salaries({ me }: { me: User }) {
  const qc = useQueryClient()
  const salaries = useQuery({ queryKey: ['salaries'], queryFn: () => api<Salary[]>('/api/salaries') })
  const users = useQuery({ queryKey: ['users'], queryFn: () => api<User[]>('/api/users') })
  const [form, setForm] = useState({ recipientId: '', label: '', amount: '', intervalDays: '30', firstPaymentAt: '' })
  const refresh = () => { qc.invalidateQueries({ queryKey: ['salaries'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }) }
  const create = useMutation({ mutationFn: () => api('/api/salaries', { method: 'POST', body: JSON.stringify({ recipientId: form.recipientId, label: form.label, amount: Number(form.amount), intervalDays: Number(form.intervalDays), firstPaymentAt: form.firstPaymentAt ? new Date(form.firstPaymentAt).toISOString() : null }) }), onSuccess: refresh })
  const stop = useMutation({ mutationFn: (id: string) => api(`/api/salaries/${id}/deactivate`, { method: 'POST' }), onSuccess: refresh })

  return <>
    <PageHead eyebrow="Recurring compensation" title="Salary & direct deposit" description="Create recurring Brain Coin transfers for ongoing voluntary work. The scheduler posts each successful payment through the same authoritative ledger." />
    <section className="two-column align-start">
      <Card title="Create direct deposit">
        <form className="stack" onSubmit={e => { e.preventDefault(); create.mutate() }}>
          <label>Recipient<select required value={form.recipientId} onChange={e => setForm({ ...form, recipientId: e.target.value })}><option value="">Choose</option>{users.data?.map(u => <option key={u.id} value={u.id}>{u.displayName}</option>)}</select></label>
          <label>Agreement label<input required value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="Maintainer stipend" /></label>
          <div className="form-grid"><label>Amount (BC)<input required type="number" min="0.01" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></label><label>Every N days<input required type="number" min="1" max="365" value={form.intervalDays} onChange={e => setForm({ ...form, intervalDays: e.target.value })} /></label></div>
          <label>First payment<input type="datetime-local" value={form.firstPaymentAt} onChange={e => setForm({ ...form, firstPaymentAt: e.target.value })} /></label>
          {create.isError && <ErrorBox>{messageOf(create.error)}</ErrorBox>}
          <button className="primary">Schedule direct deposit</button>
        </form>
      </Card>
      <Card title="System behavior">
        <div className="rule-block"><b>Atomic payment</b><span>Each salary run is a normal double-entry Brain Coin transaction.</span></div>
        <div className="rule-block"><b>Insufficient balance</b><span>No partial payment. The run records failure and retries later.</span></div>
        <div className="rule-block"><b>Concurrency</b><span>The agreement row is locked while processing to reduce duplicate scheduled execution.</span></div>
      </Card>
    </section>
    <Card title="Agreements">
      <div className="deal-list">{salaries.data?.map(s => <article className="deal-card" key={s.id}><div className="deal-top"><div><Pill>{s.active ? 'ACTIVE' : 'STOPPED'}</Pill><h3>{s.label}</h3></div><strong>{money.format(s.amount)} BC</strong></div><div className="deal-meta"><span>{s.payer.id === me.id ? `You → ${s.recipient.displayName}` : `${s.payer.displayName} → You`}</span><span>Every {s.intervalDays} days</span><span>Next: {when(s.nextPaymentAt)}</span><span>Last: {s.lastRunStatus || 'Not run yet'}</span></div>{s.active && s.payer.id === me.id && <button className="quiet" onClick={() => stop.mutate(s.id)}>Stop agreement</button>}</article>)}</div>
      {salaries.isError && <ErrorBox>{messageOf(salaries.error)}</ErrorBox>}
    </Card>
  </>
}

function AdminLoans() {
  const qc = useQueryClient()
  const queue = useQuery({ queryKey: ['admin-loans'], queryFn: () => api<Loan[]>('/api/admin/loans') })
  const [notes, setNotes] = useState<Record<string, string>>({})
  const decision = useMutation({ mutationFn: ({ id, verb }: { id: string; verb: 'approve' | 'reject' }) => api(`/api/admin/loans/${id}/${verb}`, { method: 'POST', body: JSON.stringify({ notes: notes[id] || '' }) }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-loans'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }) } })

  return <>
    <PageHead eyebrow="Accountable human decision" title="Administrator loan review" description="The review adapter can organize evidence. It cannot approve, reject, or mutate a Brain Coin balance." />
    {queue.isError && <ErrorBox>{messageOf(queue.error)}</ErrorBox>}
    <div className="admin-queue">{queue.data?.map(loan => {
      const reviewComplete = Date.now() >= new Date(loan.adminReviewDueAt).getTime()
      return <Card key={loan.id} title={`${loan.applicant.displayName} · ${money.format(loan.amount)} BC`} subtitle={loan.purpose}>
        <div className="review-grid"><ReviewPanel title={`Payment history · ${loan.paymentReviewBand}`} text={loan.paymentHistoryReview} provider={loan.reviewProvider} /><ReviewPanel title={`Qualifications · ${loan.qualificationReviewBand}`} text={loan.qualificationReview} provider={loan.reviewProvider} /></div>
        <div className="qualification-box"><strong>Applicant-provided context</strong><p>{loan.qualificationSummary}</p></div>
        <div className={`review-clock ${reviewComplete ? 'ready' : ''}`}><strong>{reviewComplete ? 'Review window complete' : 'Mandatory review still open'}</strong><span>Decision permitted after {when(loan.adminReviewDueAt)}</span></div>
        <label>Administrator reasoning<textarea rows={3} value={notes[loan.id] || ''} onChange={e => setNotes({ ...notes, [loan.id]: e.target.value })} placeholder="Record reasons a future reviewer can understand." /></label>
        <div className="actions"><button className="primary" disabled={!reviewComplete || decision.isPending} onClick={() => decision.mutate({ id: loan.id, verb: 'approve' })}>Approve + disburse</button><button className="danger-outline" disabled={!reviewComplete || decision.isPending} onClick={() => decision.mutate({ id: loan.id, verb: 'reject' })}>Reject</button></div>
      </Card>
    })}</div>
    {queue.data?.length === 0 && <Card title="Queue clear"><p>No applications are currently awaiting administrator review.</p></Card>}
    {decision.isError && <ErrorBox>{messageOf(decision.error)}</ErrorBox>}
  </>
}

function ReviewPanel({ title, text, provider }: { title: string; text: string; provider: string }) {
  return <div className="review-panel"><div><strong>{title}</strong><Pill>{provider.replaceAll('_', ' ')}</Pill></div><p>{text}</p></div>
}

function PageHead({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <header className="page-head"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></header>
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return <section className="card"><div className="card-head"><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{children}</section>
}

function Pill({ children }: { children: ReactNode }) { return <span className="pill">{children}</span> }
function ErrorBox({ children }: { children: ReactNode }) { return <div className="alert error">{children}</div> }
function SuccessBox({ children }: { children: ReactNode }) { return <div className="alert success">{children}</div> }
function FullState({ children }: { children: ReactNode }) { return <main className="full-state">{children}</main> }
function messageOf(error: unknown) { return error instanceof Error ? error.message : 'Something went wrong.' }
function pretty(value: string) { return value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) }
