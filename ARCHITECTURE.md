# Architecture

## Overview

Client-only SPA. No server, no auth, no database. All state lives in `localStorage` via Zustand's `persist` middleware.

```
Browser
└── React App (Vite)
    ├── UI Layer        src/components/
    ├── State Layer     src/store/useDebtStore.ts  ──► localStorage
    ├── Logic Layer     src/utils/calculations.ts
    └── Type Layer      src/types/debt.ts
```

## Data Flow

```
User input (DebtForm)
    │
    ▼
useDebtStore.addDebt / updateDebt
    │
    ├──► localStorage (persisted automatically)
    │
    └──► Re-render: Dashboard, DebtCard, PayoffChart
              │
              ▼
         calculations.ts (pure functions, no side effects)
              │
              ▼
         PayoffPlan → rendered in charts and summaries
```

## Key Data Model

```ts
Debt {
  id              string        // crypto.randomUUID()
  name            string        // e.g. "Student loan"
  balance         number        // current remaining balance
  interestRate    number        // APR as percentage (e.g. 5.5 for 5.5%)
  minimumPayment  number        // required minimum monthly payment
  monthlyPayment  number        // actual payment being made
  startDate       string        // ISO date — when tracking started
  notes?          string
  color?          string        // UI color tag
}
```

## Calculation Logic

All math lives in `src/utils/calculations.ts` as pure functions:

- **`calculatePayoffPlan(debt)`** — full month-by-month amortization schedule using the actual `monthlyPayment`
- **`calculateMinimumPayoffPlan(debt)`** — same but using `minimumPayment`, for comparison
- Monthly interest = `balance × (APR / 12 / 100)`
- Principal = `payment − interest`
- Iterates until `balance ≤ 0` or 1200 months (safety cap)

## State Management

Zustand with `persist` middleware writes to `localStorage` key `debt-planner`. The store is the single source of truth — components read from it and dispatch actions to it.

## Planned Enhancements

- Payoff strategy comparison (avalanche vs snowball vs custom order)
- Extra one-time payment ("downpayment bonus") scenarios
- Chart visualizations (balance over time, interest vs principal breakdown)
- Export to CSV/PDF
- Multiple currency support
