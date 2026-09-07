# TransAct

TransAct is a closed-loop fintech-style platform for voluntary developers. Participants exchange **Brain Coins** for project work, recurring contributions, direct transfers, and loans. A separate **T-score** represents observed transactional reliability inside TransAct; it is intentionally not a measure of technical skill, intelligence, employability, or personal worth.

## What is implemented

### Developer economy

- Double-entry Brain Coin ledger with derived balances
- Atomic direct transfers
- Project deals with proposal, acceptance, completion, cancellation, dispute, and completion payment
- Explainable T-score based on project and repayment history
- Recurring salary/direct-deposit agreements
- Audit events for consequential state transitions

### Lending workflow

1. Payment history is gathered from TransAct records.
2. The review adapter evaluates payment history.
3. Applicant qualifications/context are reviewed separately.
4. The application enters a mandatory 3-day administrator review window.
5. A human administrator approves or rejects after the window ends.
6. Approval disburses Brain Coins through the ledger.
7. Repayments update outstanding principal and eventually T-score evidence.

The initial review provider is deliberately named `HEURISTIC_PLACEHOLDER`. It is **not** presented as AI. It keeps the end-to-end workflow executable until a real model/API key is configured.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React + TypeScript + Vite + TanStack Query |
| Backend | Java 21 + Spring Boot 4.1 |
| Persistence | PostgreSQL + Spring Data JPA |
| Migrations | Flyway |
| Security baseline | Spring Security HTTP Basic demo identities |
| Tests | JUnit / Spring Boot test infrastructure |
| Packaging | Docker / Docker Compose |
| CI | GitHub Actions |

Spring Boot 4.1 is used because the 3.5 line has reached the end of OSS support. Vite 8 is used for the frontend toolchain.

## Run locally

The simplest path is Docker Compose:

```bash
docker compose up --build
```

Then open:

- frontend: `http://localhost:5173`
- backend health: `http://localhost:8080/api/health`

### Demo credentials

Developer:

```text
username: developer
password: dev-demo
```

Administrator:

```text
username: admin
password: admin-demo
```

The developer login maps to seeded developer **Alice Morgan**. The administrator login maps to **TransAct Administrator**. Bob and Carol are seeded counterparties so the workflows can be exercised immediately.

These credentials are development scaffolding only. Configure `TRANSACT_DEVELOPER_PASSWORD` and `TRANSACT_ADMIN_PASSWORD` at minimum before any remote deployment, and replace the demo identity layer before treating the application as multi-user production software.

## Environment

Copy `.env.example` and adjust values as needed.

Important backend variables:

```text
DATABASE_URL
DATABASE_USERNAME
DATABASE_PASSWORD
TRANSACT_DEVELOPER_PASSWORD
TRANSACT_ADMIN_PASSWORD
CORS_ALLOWED_ORIGINS
LOAN_REVIEW_PERIOD_DAYS
SALARY_SCHEDULER_MS
```

Frontend:

```text
VITE_API_URL
```

No external AI key is required yet. The AI provider integration is intentionally the next deployment/configuration step.

## Architecture principles

### Ledger is authoritative

There is no mutable `balance` column. A balance is the sum of signed ledger postings. Every transfer writes two postings with equal magnitude and opposite sign.

### Money movement is deterministic

AI/model output cannot move Brain Coins, approve loans, reject loans, or change T-score. Financial state transitions live in deterministic Spring services and PostgreSQL transactions.

### T-score is narrow by design

The score includes only observable TransAct reliability signals such as completed project commitments, overdue accepted work, disputes, repaid loans, and defaults. Wealth and technical reputation are separate dimensions.

### Human loan authority

AI review is decision support. The administrator is the accountable decision-maker, and the application records the review window and human reasoning.

## Repository structure

```text
TransAct/
├── backend/                   Spring Boot API
│   ├── domain/                Entities + state models
│   ├── service/               Business rules and transactions
│   ├── api/                   HTTP controllers / views
│   ├── repo/                  Persistence access
│   └── db/migration/          Flyway schema
├── frontend/                  React application
├── docs/                      Architecture and rule documentation
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Important known gaps before public use

This is a serious engineering baseline, not yet a production financial institution. The next stages should replace demo authentication, integrate a real review provider with structured provenance, add stronger distributed scheduler guarantees, add a full dispute/appeal workflow, expand integration/E2E tests, and perform abuse/security threat modeling. Brain Coins are currently a closed internal accounting unit and should stay clearly separated from claims about fiat value or investment return.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/BUSINESS_RULES.md`](docs/BUSINESS_RULES.md), and [`docs/AI_REVIEW_BOUNDARY.md`](docs/AI_REVIEW_BOUNDARY.md).
