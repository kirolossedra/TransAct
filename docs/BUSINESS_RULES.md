# Business Rules

## Brain Coin ledger

1. A user account cannot transfer more Brain Coins than its derived ledger balance.
2. System issuance accounts may go negative because they represent the balancing side of initial issuance.
3. A transfer never mutates a stored balance field; it writes balanced ledger postings.
4. Source and destination accounts are locked in deterministic UUID order during transfer to reduce deadlock risk.
5. A transfer is all-or-nothing.

## Project deals

1. A requester cannot create a deal with themselves.
2. Only the assigned developer can accept a proposal.
3. Only the requester can confirm completion and release payment.
4. Accepted work cannot be unilaterally cancelled.
5. Either party may dispute an accepted deal.
6. A dispute records a transactional concern but is not treated as proof of personal or professional fault.

## T-score

1. T-score measures observed transactional reliability only.
2. Coin balance, seniority, education, GitHub popularity, nationality, employer prestige, and model-generated personality judgments are excluded.
3. Every score component is returned to the user as an explanation.
4. A new participant begins as unestablished rather than being silently classified as trustworthy or untrustworthy.

## Loans

1. Payment history is generated from system records rather than self-reported.
2. Qualifications/context are supplied by the applicant.
3. Review outputs are advisory evidence.
4. A loan cannot be approved or rejected until the configured administrator review period ends (default: 3 days).
5. Only an administrator can make the final decision.
6. Approval and Brain Coin disbursement occur within one application transaction.
7. An applicant may not hold two simultaneously approved loans.
8. Repayment cannot exceed the outstanding amount.
9. An approved loan with an outstanding balance after its repayment deadline is marked defaulted.

## Salary / direct deposit

1. A recurring agreement has one payer, one developer recipient, an amount, an interval, and a next run time.
2. A failed salary payment never creates a partial ledger movement.
3. Only the payer can deactivate the agreement.
