# Debt Payment Planner

A personal finance tool for tracking debts and visualizing payoff timelines.

## Features

- Add and manage multiple debts (loans, credit cards, etc.)
- Track balance, interest rate (APR), minimum payment, and actual monthly payment
- Calculate exact payoff dates and total interest paid
- Compare payoff strategies: avalanche (highest rate first) vs snowball (lowest balance first)
- Visualize amortization schedules per debt
- All data stored locally in the browser — no account or backend required

## Tech Stack

- **React 19** + **TypeScript** — UI
- **Vite** — build tooling
- **Tailwind CSS v4** — styling
- **Zustand** — state management with `localStorage` persistence
- No backend, no database

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Project Structure

```
src/
├── components/      # UI components
│   ├── Dashboard.tsx
│   ├── DebtCard.tsx
│   ├── DebtForm.tsx
│   └── PayoffChart.tsx
├── store/
│   └── useDebtStore.ts   # Zustand store (persisted to localStorage)
├── types/
│   └── debt.ts           # Core TypeScript types
└── utils/
    └── calculations.ts   # Amortization math, formatting helpers
```

## Currency

Default currency is **NOK** (Norwegian Krone). Change `formatCurrency` defaults in `src/utils/calculations.ts` to adjust.
