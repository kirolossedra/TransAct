# TransAct Architecture

## Purpose

TransAct is a closed-loop software economy for voluntary developers. Brain Coins are an internal unit of account for reciprocal developer effort; they are not presented as fiat money, cryptocurrency, or an investment asset.

## Main boundaries

### Ledger

The ledger is authoritative. Account balances are derived from signed ledger postings. Every transfer creates exactly two postings of equal magnitude and opposite sign in one database transaction.

### Project deals

A project deal is a commitment between a requester and a developer. States are `PROPOSED`, `ACCEPTED`, `COMPLETED`, `DISPUTED`, and `CANCELLED`. Payment occurs only when the requester confirms completion of an accepted deal.

### T-score

T-score is calculated from observable TransAct events: completed project commitments, overdue accepted commitments, disputes, repaid loans, and defaults. Brain Coin wealth and technical skill are intentionally excluded from the score.

### Loans

Loan applications capture payment history automatically, run two advisory reviews, and then enter a mandatory administrator review window. The administrator remains the final decision-maker. Approval disburses through the ledger; repayment also posts through the ledger.

### Review provider

`AiReviewService` is the integration boundary for model-assisted review. The initial implementation uses `HEURISTIC_PLACEHOLDER`, which labels itself truthfully and exists only so the workflow can be exercised before an external model key is configured.

### Salary / direct deposit

Recurring salary agreements schedule ledger transfers. The agreement row is pessimistically locked while a scheduled payment is processed to reduce duplicate execution risk.

## Current deployment shape

- React + TypeScript + Vite frontend
- Spring Boot 4.1 / Java 21 API
- PostgreSQL
- Flyway schema migrations
- Docker packaging
- GitHub Actions CI

## Known next-stage work

Production identity should replace demo HTTP Basic users. The AI review adapter should be backed by a configured provider with structured output and provenance. Distributed scheduling should gain a stronger single-executor mechanism before horizontal scaling. Dispute resolution needs its own administrator workflow and appeal trail.
