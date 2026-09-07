export type User = {
  id: string
  displayName: string
  email: string
  role: 'DEVELOPER' | 'ADMIN'
}

export type TScoreComponent = { name: string; impact: number; explanation: string }
export type TScore = { score: number; band: string; components: TScoreComponent[] }
export type Activity = {
  transactionId: string
  type: string
  amount: number
  memo?: string
  counterparty: string
  createdAt: string
}
export type Dashboard = { user: User; balance: number; tScore: TScore; recentActivity: Activity[] }

export type Deal = {
  id: string
  requester: User
  developer: User
  title: string
  description: string
  amount: number
  dueDate?: string
  status: 'PROPOSED' | 'ACCEPTED' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED'
  createdAt: string
  acceptedAt?: string
  completedAt?: string
}

export type Loan = {
  id: string
  applicant: User
  amount: number
  outstandingAmount: number
  purpose: string
  qualificationSummary: string
  status: 'ADMIN_REVIEW' | 'APPROVED' | 'REJECTED' | 'REPAID' | 'DEFAULTED'
  reviewProvider: string
  paymentReviewBand: string
  paymentHistoryReview: string
  qualificationReviewBand: string
  qualificationReview: string
  adminNotes?: string
  submittedAt: string
  adminReviewDueAt: string
  decisionAt?: string
  repaymentDueAt?: string
}

export type Salary = {
  id: string
  payer: User
  recipient: User
  label: string
  amount: number
  intervalDays: number
  nextPaymentAt: string
  active: boolean
  lastRunAt?: string
  lastRunStatus?: string
}
