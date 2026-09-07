import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { Loan } from '../../domain/models'
import { Alert, Badge, Button, Card, PageHeader, ReviewPanel } from '../../components/ui'
import { formatDateTime, messageOf, money } from '../../lib/format'

export function AdminLoansPage() {
  const queryClient = useQueryClient()
  const queue = useQuery({ queryKey: ['admin-loans'], queryFn: () => api<Loan[]>('/api/admin/loans') })
  const [notes, setNotes] = useState<Record<string, string>>({})
  const decision = useMutation({
    mutationFn: ({ id, verb }: { id: string; verb: 'approve' | 'reject' }) => api(`/api/admin/loans/${id}/${verb}`, { method: 'POST', body: JSON.stringify({ notes: notes[id] || '' }) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-loans'] }); queryClient.invalidateQueries({ queryKey: ['dashboard'] }) },
  })

  return <>
    <PageHeader kicker="Administrator workspace" title="Loan review queue" description="Inspect evidence, record reasoning, and make accountable human decisions after the mandatory review window." />
    {queue.isError && <Alert>{messageOf(queue.error)}</Alert>}
    <div className="admin-queue">{queue.data?.map(loan => {
      const reviewComplete = Date.now() >= new Date(loan.adminReviewDueAt).getTime()
      return <Card key={loan.id} className="admin-review-card" title={`${loan.applicant.displayName} · ${money.format(loan.amount)} BC`} subtitle={loan.purpose} actions={<Badge tone={reviewComplete ? 'success' : 'warning'}>{reviewComplete ? 'Decision ready' : 'Reviewing'}</Badge>}>
        <div className="review-grid"><ReviewPanel title={`Payment history · ${loan.paymentReviewBand}`} text={loan.paymentHistoryReview} provider={loan.reviewProvider} /><ReviewPanel title={`Qualifications · ${loan.qualificationReviewBand}`} text={loan.qualificationReview} provider={loan.reviewProvider} /></div>
        <div className="context-box"><span>Applicant context</span><p>{loan.qualificationSummary}</p></div>
        <div className={`review-window ${reviewComplete ? 'review-window-ready' : ''}`}><div><strong>{reviewComplete ? 'Review window complete' : 'Mandatory review period active'}</strong><span>{reviewComplete ? 'A human decision may now be recorded.' : `Decision available after ${formatDateTime(loan.adminReviewDueAt)}`}</span></div><Badge tone={reviewComplete ? 'success' : 'warning'}>{reviewComplete ? 'OPEN' : 'LOCKED'}</Badge></div>
        <label>Administrator reasoning<textarea rows={4} value={notes[loan.id] || ''} onChange={event => setNotes({ ...notes, [loan.id]: event.target.value })} placeholder="Record the evidence and reasoning behind the decision." /></label>
        <div className="button-row decision-row"><Button disabled={!reviewComplete || decision.isPending} onClick={() => decision.mutate({ id: loan.id, verb: 'approve' })}>Approve & disburse</Button><Button variant="danger" disabled={!reviewComplete || decision.isPending} onClick={() => decision.mutate({ id: loan.id, verb: 'reject' })}>Reject application</Button></div>
      </Card>
    })}</div>
    {queue.data?.length === 0 && <Card title="Review queue clear"><div className="empty-state"><strong>No pending applications</strong><p>There are currently no Brain Coin loans awaiting administrator review.</p></div></Card>}
    {decision.isError && <Alert>{messageOf(decision.error)}</Alert>}
  </>
}
