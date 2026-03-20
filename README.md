# Debt Payment Planner

A personal finance tool for tracking debts and visualizing payoff timelines. Runs entirely in the browser — no account, no backend, no data ever leaves your device.

## Features

### Debt tracking
- Add multiple debts with balance, APR, minimum payment, and actual monthly payment
- Two debt types with appropriate field sets:
  - **Installment** (e.g. car loan, personal loan) — fixed monthly payment covering principal + interest
  - **Revolving** (e.g. credit card) — minimum payment defined as a percentage of the outstanding balance; interest accrues on top each month
- Per-debt amortization schedule (expandable on each debt card)

### Payment tracking
- Log actual payments against any debt, including one-off extra payments and charges
- Each debt card shows whether you are ahead of or behind the original schedule
- Payments reduce the balance correctly: for installment debts one month of interest is accrued before the payment is applied, so only the principal portion reduces the balance

### Payoff chart
The balance-over-time chart shows three lines per debt once payments have been recorded:

| Line | Style | What it shows |
|------|-------|---------------|
| Original plan | Solid | Projection from the balance you entered when setting up the debt |
| Actual | Dashed (lighter shade) | Running balance based on payments logged so far, up to today |
| Forecast | Dotted (same color as plan) | Re-projection from the current actual balance, showing the updated payoff date |

A vertical reference line marks today. If you have made extra payments the forecast line will finish earlier than the original plan; if you have underpaid it will finish later.

### Strategy tools
- **Strategy comparison** — side-by-side avalanche (highest rate first) vs snowball (lowest balance first), showing total interest and payoff date for each
- **Extra payment simulator** — model the interest saved and months cut by adding a one-off lump sum to any debt

## Getting Started

### Local development

The app requires the Node/Hono API server to be running alongside the Vite dev server (which proxies `/api` calls to port 3000).

```bash
npm install

# Terminal 1 — API server (SQLite, auto-restarts on changes)
npm run dev:server

# Terminal 2 — Vite frontend (hot reload)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Data is stored in `./data/db.sqlite`.

### Deploy to a VPS with Docker Compose

```bash
docker compose --profile prod up -d --build
```

The app runs on port 3000. SQLite data is stored in a named Docker volume (`db-data`) and survives container rebuilds.

To deploy an update:

```bash
docker compose --profile prod up -d --build
```

Docker Compose replaces the container but the `db-data` volume (and your data) is untouched.

### Migrating existing browser data

If you had data stored in the old localStorage-based version, a yellow banner will appear on first load. Click **Migrate now** to copy all debts and payments from the browser into the SQLite database, then clear the localStorage keys. The migration is idempotent — running it twice will not create duplicates.

## Project Structure

```
src/
├── components/
│   ├── Dashboard.tsx           # Overview stats, chart, strategy tools, debt list
│   ├── DebtCard.tsx            # Per-debt summary, amortization table, ahead/behind badge
│   ├── DebtForm.tsx            # Add / edit debt (type-aware field set)
│   ├── ExtraPaymentSimulator.tsx
│   ├── PaymentForm.tsx         # Log a payment or charge against a debt
│   ├── PaymentsPage.tsx        # Full payment history
│   ├── PayoffChart.tsx         # Balance over time (plan / actual / forecast)
│   └── StrategyComparison.tsx
├── store/
│   ├── useDebtStore.ts         # Debt CRUD, persisted to localStorage
│   └── usePaymentStore.ts      # Payment log, persisted to localStorage
├── types/
│   ├── debt.ts                 # Debt, DebtType, PayoffMonth, DebtPayoffPlan, …
│   └── payment.ts              # Payment, PaymentType
└── utils/
    └── calculations.ts         # All financial math (pure functions, no side effects)
```

## Currency

Default currency is **NOK** (Norwegian Krone). To change it, update the `currency` and `locale` defaults in `formatCurrency()` in `src/utils/calculations.ts`.

## Data storage

All data is stored in `localStorage` under two keys:

- `debt-planner` — debt records
- `debt-planner-payments` — payment log

Clearing browser storage will erase all data. There is no export or sync feature yet.
