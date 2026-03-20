# Architecture

## Overview

Client-only SPA. No server, no auth, no database. All state lives in `localStorage` via Zustand's `persist` middleware.

```
Browser
└── React App (Vite)
    ├── UI Layer        src/components/
    ├── State Layer     src/store/useDebtStore.ts      ──► localStorage (key: debt-planner)
    │                   src/store/usePaymentStore.ts   ──► localStorage (key: debt-planner-payments)
    ├── Logic Layer     src/utils/calculations.ts
    └── Type Layer      src/types/debt.ts + payment.ts
```

## Data Flow

```
User input (DebtForm / PaymentForm)
    │
    ▼
useDebtStore.addDebt / updateDebt
usePaymentStore.addPayment
    │
    ├──► localStorage (persisted automatically by Zustand)
    │
    └──► Re-render: Dashboard, DebtCard, PayoffChart
              │
              ▼
         calculations.ts (pure functions, no side effects)
              │
              ▼
         PayoffPlan / actual balance series → charts and summaries
```

## Data Model

### Debt

```ts
type DebtType = 'installment' | 'revolving'

interface Debt {
  id                    string       // unique ID
  debtType?             DebtType     // defaults to 'installment' when absent
  name                  string       // e.g. "Car loan"
  balance               number       // current balance at time of entry (NOK)
  interestRate          number       // APR as a percentage (e.g. 5.5 for 5.5%)
  minimumPaymentPercent? number      // revolving only: e.g. 3.5 means 3.5% of balance
  minimumPayment        number       // minimum monthly payment (NOK)
  monthlyPayment        number       // actual payment being made (>= minimumPayment)
  startDate             string       // ISO date — when tracking started
  notes?                string
  color?                string       // UI color tag
}
```

`balance` is the principal at the point the debt was set up in the app. It is a snapshot, not a live figure — the live balance is derived by applying all recorded payments (see `getActualBalance`).

### Payment

```ts
type PaymentType = 'payment' | 'charge'

interface Payment {
  id       string         // unique ID
  debtId   string         // references Debt.id
  date     string         // ISO date of the transaction
  amount   number         // always positive
  type     PaymentType    // 'payment' reduces balance; 'charge' increases it
  note?    string
}
```

## Calculation Logic

All math is in `src/utils/calculations.ts` as pure functions.

### Amortization (`calculatePayoffPlan`)

Standard month-by-month loop:

```
interest  = balance × (APR / 100 / 12)
payment   = min(monthlyPayment, balance + interest)   // cap at payoff
principal = payment − interest
balance   = balance − principal
```

Iterates until `balance ≤ 0.005` or 1200 months (100-year safety cap).

### Actual balance (`getActualBalance`, `getActualBalanceSeries`)

Payments are applied chronologically. For each recorded payment, one month of interest is accrued on the running balance before the payment is subtracted:

```
balance = balance + balance × monthlyRate − payment.amount   // type: 'payment'
balance = balance + payment.amount                           // type: 'charge'
```

This correctly handles installment loans (where the payment covers interest + principal, so only the principal portion reduces the balance) and revolving debts (where interest capitalises onto the balance each period).

### Forecast

The forecast line on the chart is calculated by calling `calculatePayoffPlan` with the current actual balance substituted for `debt.balance`. This re-projects the payoff timeline from where you are now, using the same monthly payment and interest rate.

## State Management

Two Zustand stores, both using `persist` middleware:

| Store | localStorage key | Contents |
|-------|-----------------|----------|
| `useDebtStore` | `debt-planner` | Debt records |
| `usePaymentStore` | `debt-planner-payments` | Payment log |

Components subscribe to slices of each store. `useShallow` is used on array selectors to prevent unnecessary re-renders when unrelated payments change.

## Debt Types

| Type | Minimum payment | Interest model |
|------|----------------|----------------|
| `installment` | Fixed NOK amount | Paid as part of each monthly payment |
| `revolving` | % of current balance, auto-computed to NOK | Accrues on the balance each period |

The amortization math (`balance + interest − payment`) is the same for both; the distinction is surfaced in the form UI and labelling only.
