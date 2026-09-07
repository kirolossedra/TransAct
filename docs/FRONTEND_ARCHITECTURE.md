# Frontend architecture

TransAct's React application is organized by responsibility rather than as one page-sized component.

## Structure

```text
frontend/src/
  app/
    App.tsx                 # authentication boundary
    AppShell.tsx            # navigation and authenticated layout
  components/
    ui.tsx                  # shared visual primitives only
  domain/
    models.ts               # API/domain types
  lib/
    api.ts                  # HTTP/auth infrastructure
    format.ts               # formatting helpers
  features/
    auth/LoginPage.tsx
    dashboard/OverviewPage.tsx
    deals/DealsPage.tsx
    loans/LoansPage.tsx
    salaries/SalariesPage.tsx
    admin/AdminLoansPage.tsx
  main.tsx                  # composition root
  styles.css                # design tokens + responsive layout
```

## Rules

- Feature modules own their server-state queries, mutations, form state, and feature-specific presentation.
- `AppShell` owns navigation and authenticated layout only; it does not implement financial workflows.
- Shared UI components contain presentation primitives, not business rules.
- API access is centralized in `lib/api.ts`; feature components do not implement authentication headers or base URLs.
- API/domain contracts live in `domain/models.ts` so UI modules consume one consistent model.
- Financial state continues to come from the backend. The frontend does not calculate authoritative balances, T-scores, approval eligibility, or ledger outcomes.
- Desktop and mobile transaction presentations share the same server data; responsive presentation never changes financial meaning.

## Responsive strategy

- Desktop uses a persistent left navigation rail.
- Tablet/mobile use a sticky account header and horizontally scrollable feature navigation; sign-out remains available.
- Summary metrics remain multi-column on tablet and collapse progressively on narrow phones.
- Ledger tables become transaction cards on small screens instead of forcing horizontal financial-table scrolling.
- Financial actions retain a minimum 44 px target height.
