import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import db from './db.js'
import debtsRouter from './routes/debts.js'
import paymentsRouter from './routes/payments.js'
import type { Debt } from '../src/types/debt.js'
import type { Payment } from '../src/types/payment.js'

const app = new Hono()

app.route('/api/debts', debtsRouter)
app.route('/api/payments', paymentsRouter)

// One-time migration endpoint: accepts the raw Zustand localStorage state
// and inserts all records, skipping any that already exist.
app.post('/api/migrate', async (c) => {
  const body = await c.req.json<{ debts: Debt[]; payments: Payment[] }>()

  const insertDebt = db.prepare(`
    INSERT OR IGNORE INTO debts
      (id, debt_type, name, balance, interest_rate, minimum_payment_percent, minimum_payment, monthly_payment, start_date, notes, color)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const insertPayment = db.prepare(`
    INSERT OR IGNORE INTO payments (id, debt_id, date, amount, type, note)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const migrate = db.transaction(() => {
    let debtsInserted = 0
    let paymentsInserted = 0

    for (const d of body.debts ?? []) {
      const result = insertDebt.run(
        d.id,
        d.debtType ?? 'installment',
        d.name,
        d.balance,
        d.interestRate,
        d.minimumPaymentPercent ?? null,
        d.minimumPayment,
        d.monthlyPayment,
        d.startDate,
        d.notes ?? null,
        d.color ?? null,
      )
      debtsInserted += Number(result.changes)
    }

    for (const p of body.payments ?? []) {
      const result = insertPayment.run(p.id, p.debtId, p.date, p.amount, p.type, p.note ?? null)
      paymentsInserted += Number(result.changes)
    }

    return { debtsInserted, paymentsInserted }
  })

  const result = migrate()
  return c.json({ ok: true, ...result })
})

// Serve the built Vite frontend for all non-API routes
app.use('/*', serveStatic({ root: './dist' }))
app.get('/*', serveStatic({ path: './dist/index.html' }))

const port = Number(process.env.PORT ?? 3000)
console.log(`Server running on http://localhost:${port}`)

serve({ fetch: app.fetch, port })
