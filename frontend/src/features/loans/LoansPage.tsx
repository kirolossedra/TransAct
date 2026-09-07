import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { Loan } from '../../domain/models'
import { Alert, Badge, Button, Card, PageHeader, ReviewPanel } from '../../components/ui'
import { formatDate, formatDateTime, messageOf, money } from '../../lib/format'

export function LoansPage() {
  const queryClient = useQueryClient()
  const loans = useQuery({ queryKey: ['loans'], queryFn: () => api<Loan[]>('/api/loans') })
  const [amount, setAmount] = useState('')
  const [purpose, setPurpose] = useState('')
  const [qualifications, setQualifications] = useState('')
  const [repay, setRepay] = useState<Record<string, string>>({})
  const refresh = () => { queryClient.invalidateQueries({ queryKey: ['loans'] }); queryClient.invalidateQueries({ queryKey: ['dashboard'] }) }
  const apply = useMutation({ mutationFn: () => api('/api/loans', { method: 'POST', body: JSON.stringify({ amount: Number(amount), purpose, qualifications }) }), onSuccess: () => { setAmount(''); setPurpose(''); setQualifications(''); refresh() } })
  const repayment = useMutation({ mutationFn: ({ id }: { id: string }) => api(`/api/loans/${id}/repay`, { method: 'POST', body: JSON.stringify({ amount: Number(repay[id]) }) }), onSuccess: refresh })

  return <>
    <PageHeader kicker="Brain Coin lending" title="Loans" description="Apply for contribution credit, inspect the evidence package, and manage repayment from one transparent workflow." />
    <section className="split-grid">
      <Card title="New loan application" subtitle="Payment history is retrieved automatically. Add only the context the reviewer cannot infer from the ledger.">
        <form className="form-stack" onSubmit={event => { event.preventDefault(); apply.mutate() }}>
          <label>Loan amount<div className="amount-input"><span>BC</span><input required type="number" inputMode="decimal" min="0.01" max="10000" step="0.01" value={amount} onChange={event => setAmount(event.target.value)} placeholder="0.00" /></div></label>
          <label>Purpose<textarea required rows={3} value={purpose} onChange={event => setPurpose(event.target.value)} placeholder="What will these Brain Coins fund?" /></label>
          <label>Qualifications and repayment context<textarea required rows={6} value={qualifications} onChange={event => setQualifications(event.target.value)} placeholder="Relevant project history, expected future contribution, and context for the administrator." /></label>
          {apply.isError && <Alert>{messageOf(apply.error)}</Alert>}
          {apply.isSuccess && <Alert tone="success">Application submitted for review.</Alert>}
          <Button type="submit" disabled={apply.isPending}>{apply.isPending ? 'Submitting…' : 'Submit loan application'}</Button>
        </form>
      </Card>
      <Card title="Review process" subtitle="The evidence engine assists; the administrator decides.">
        <ol className="process-list">
          <li><span>1</span><div><strong>Payment history</strong><p>TransAct retrieves your ledger and repayment record.</p></div></li>
          <li><span>2</span><div><strong>Evidence review</strong><p>The configured review adapter summarizes payment and qualification evidence.</p></div></li>
          <li><span>3</span><div><strong>Three-day review window</strong><p>The application remains open for administrator review.</p></div></li>
          <li><span>4</span><div><strong>Human decision</strong><p>Only an administrator may approve or reject the loan.</p></div></li>
        </ol>
        <div className="info-callout">The review adapter cannot directly disburse Brain Coins, reject an applicant, or modify a T-score.</div>
      </Card>
    </section>

    <Card title="Applications & active loans" subtitle="Review status, evidence, outstanding amounts, and repayments.">
      {loans.isLoading && <div className="state-panel">Loading loans…</div>}
      <div className="record-list">{loans.data?.map(loan => <article className="record-card" key={loan.id}>
        <div className="record-header"><div><Badge tone={loan.status === 'APPROVED' || loan.status === 'REPAID' ? 'success' : loan.status === 'REJECTED' || loan.status === 'DEFAULTED' ? 'danger' : 'warning'}>{loan.status}</Badge><h3>{loan.purpose}</h3><span className="record-subtitle">Submitted {formatDate(loan.submittedAt)}</span></div><div className="loan-balance"><span>Original amount</span><strong>{money.format(loan.amount)} BC</strong></div></div>
        <div className="review-grid"><ReviewPanel title={`Payment history · ${loan.paymentReviewBand}`} text={loan.paymentHistoryReview} provider={loan.reviewProvider} /><ReviewPanel title={`Qualifications · ${loan.qualificationReviewBand}`} text={loan.qualificationReview} provider={loan.reviewProvider} /></div>
        <dl className="record-meta"><div><dt>Decision eligible</dt><dd>{formatDateTime(loan.adminReviewDueAt)}</dd></div><div><dt>Outstanding</dt><dd>{money.format(loan.outstandingAmount)} BC</dd></div>{loan.repaymentDueAt && <div><dt>Repayment due</dt><dd>{formatDate(loan.repaymentDueAt)}</dd></div>}</dl>
        {loan.adminNotes && <div className="admin-note"><strong>Administrator note</strong><p>{loan.adminNotes}</p></div>}
        {loan.status === 'APPROVED' && <form className="repayment-form" onSubmit={event => { event.preventDefault(); repayment.mutate({ id: loan.id }) }}><label>Repayment amount<div className="amount-input"><span>BC</span><input required type="number" min="0.01" max={loan.outstandingAmount} step="0.01" value={repay[loan.id] || ''} onChange={event => setRepay({ ...repay, [loan.id]: event.target.value })} placeholder="0.00" /></div></label><Button type="submit" variant="secondary">Make repayment</Button></form>}
      </article>)}</div>
      {(loans.isError || repayment.isError) && <Alert>{messageOf(loans.error || repayment.error)}</Alert>}
    </Card>
  </>
}
