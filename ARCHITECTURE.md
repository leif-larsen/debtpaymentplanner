# Architecture

## Overview

React SPA frontend served by a Node/Hono backend. The backend also exposes a REST API and persists all data to a SQLite file via `better-sqlite3`. No external services or database server required.

```
Browser
└── React App (Vite)
    ├── UI Layer        src/components/
    ├── State Layer     src/store/useDebtStore.ts      ──► fetch /api/debts
    │                   src/store/usePaymentStore.ts   ──► fetch /api/payments
    ├── Logic Layer     src/utils/calculations.ts
    └── Type Layer      src/types/debt.ts + payment.ts

Server (Node + Hono)
├── API Layer       server/routes/debts.ts + payments.ts
├── DB Layer        server/db.ts (better-sqlite3)
└── Static serving  dist/ (built Vite output)
```

## Data Flow

```
User input (DebtForm / PaymentForm)
    │
    ▼
useDebtStore / usePaymentStore  ──► fetch POST/PUT/DELETE /api/*
    │                                        │
    │ optimistic local state update          ▼
    │                               server/routes/*.ts
    │                                        │
    └──► Re-render: Dashboard,               ▼
         DebtCard, PayoffChart          better-sqlite3
              │                         db.sqlite file
              ▼
         calculations.ts (pure functions, no side effects)
              │
              ▼
         PayoffPlan / actual balance series → charts and summaries
```

On app load, `App.tsx` calls `useDebtStore.load()` and `usePaymentStore.load()` which fetch the full dataset from the API once.

## Data Model

### Debt

```ts
type DebtType = 'installment' | 'revolving'

interface Debt {
  id                     string       // unique ID
  debtType?              DebtType     // defaults to 'installment' when absent
  name                   string       // e.g. "Car loan"
  balance                number       // balance at time of entry (NOK)
  interestRate           number       // APR as a percentage (e.g. 5.5 for 5.5%)
  minimumPaymentPercent? number       // revolving only: e.g. 3.5 means 3.5% of balance
  minimumPayment         number       // minimum monthly payment (NOK)
  monthlyPayment         number       // actual payment being made (>= minimumPayment)
  startDate              string       // ISO date — when tracking started
  notes?                 string
  color?                 string       // UI color tag
}
```

`balance` is the principal at the point the debt was set up in the app. It is a snapshot — the live balance is derived by applying all recorded payments (see `getActualBalance`).

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

## Database

SQLite file at `./data/db.sqlite` (configurable via `DB_PATH` env var). Initialised in `server/db.ts` with WAL mode and foreign keys enabled.

```sql
CREATE TABLE debts (
  id                      TEXT PRIMARY KEY,
  debt_type               TEXT NOT NULL DEFAULT 'installment',
  name                    TEXT NOT NULL,
  balance                 REAL NOT NULL,
  interest_rate           REAL NOT NULL,
  minimum_payment_percent REAL,
  minimum_payment         REAL NOT NULL,
  monthly_payment         REAL NOT NULL,
  start_date              TEXT NOT NULL,
  notes                   TEXT,
  color                   TEXT
);

CREATE TABLE payments (
  id       TEXT PRIMARY KEY,
  debt_id  TEXT NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
  date     TEXT NOT NULL,
  amount   REAL NOT NULL,
  type     TEXT NOT NULL CHECK (type IN ('payment', 'charge')),
  note     TEXT
);
```

The schema is created automatically on first run via `CREATE TABLE IF NOT EXISTS`.

## API

All endpoints are prefixed `/api/`. The server also exposes `/api/migrate` for one-time migration from the old localStorage format.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/debts` | List all debts |
| POST | `/api/debts` | Create a debt |
| PUT | `/api/debts/:id` | Update a debt |
| DELETE | `/api/debts/:id` | Delete a debt (cascades to payments) |
| GET | `/api/payments` | List all payments |
| POST | `/api/payments` | Record a payment or charge |
| DELETE | `/api/payments/:id` | Remove a payment |
| POST | `/api/migrate` | Import debts + payments from localStorage export (idempotent) |

## State Management

Two plain Zustand stores (no `persist` middleware):

| Store | API base | Contents |
|-------|----------|----------|
| `useDebtStore` | `/api/debts` | Debt records + loading state |
| `usePaymentStore` | `/api/payments` | Payment log + loading state |

Both stores expose `load()`, which is called once in `App.tsx` on mount. Write actions (`addDebt`, `updateDebt`, etc.) call the API and then update local state on success.

`useShallow` is used on array selectors to prevent unnecessary re-renders when unrelated records change.

## Calculation Logic

All math is in `src/utils/calculations.ts` as pure functions — no API calls, no side effects.

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

Payments are applied chronologically. For each recorded payment, one month of interest is accrued on the running balance before the payment is applied:

```
balance = balance + balance × monthlyRate − payment.amount   // type: 'payment'
balance = balance + payment.amount                           // type: 'charge'
```

This is correct for both debt types: installment loans (payment covers interest + principal, so only the net principal reduces the balance) and revolving debts (interest capitalises onto the balance each period).

### Forecast

The forecast chart line is produced by calling `calculatePayoffPlan` with the current actual balance substituted for `debt.balance`, re-projecting the payoff timeline from the current position using the same monthly payment and interest rate.

## Debt Types

| Type | Minimum payment | Interest model |
|------|----------------|----------------|
| `installment` | Fixed NOK amount | Paid as part of each monthly payment |
| `revolving` | % of current balance, auto-computed to NOK | Accrues on the balance each period |

The amortization math (`balance + interest − payment`) is identical for both types; the distinction is in form UI, validation, and labelling only.

## Deployment

Single Docker container runs the Node server which serves both the API and the built Vite frontend as static files. A named Docker volume (`db-data`) mounts to `/app/data/` to persist the SQLite file across container rebuilds.

```
docker compose --profile prod up -d --build
```
