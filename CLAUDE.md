# Claude Instructions — Debt Payment Planner

## Project Summary

Personal debt tracking SPA. React 19 + TypeScript + Vite + Tailwind v4 + Zustand. No backend. All data in localStorage.

## Commands

```bash
npm run dev      # start dev server (localhost:5173)
npm run build    # production build
npm run lint     # ESLint
npm run preview  # preview production build
```

## Code Style

- TypeScript strict mode — no `any`, no type assertions without good reason
- Functional components only, no class components
- Co-locate small utilities near usage; shared utils go in `src/utils/`
- Pure functions for all financial calculations — no side effects in `calculations.ts`
- Tailwind utility classes for styling — no separate CSS files per component
- Zustand store actions handle all state mutations — components never mutate state directly

## Financial Logic Rules

- Interest rate is always stored as APR percentage (e.g. `5.5` = 5.5% per year)
- Monthly rate = `APR / 100 / 12`
- `monthlyPayment` must always be `>= minimumPayment`
- Amortization schedules are capped at 1200 months (100 years) as a safety guard
- All currency formatting goes through `formatCurrency()` in `calculations.ts`

## Project Structure

```
src/
├── components/      # React UI components
├── store/           # Zustand stores
├── types/           # TypeScript type definitions (debt.ts is the core model)
└── utils/           # Pure utility functions (calculations, formatting)
```

## Do Not

- Add a backend or database — localStorage is intentional
- Add authentication — this is a personal, single-user tool
- Use `any` in TypeScript
- Introduce external charting libraries without discussing first (lightweight options preferred)
- Change the currency defaults without updating the README
