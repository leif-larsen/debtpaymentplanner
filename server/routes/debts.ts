import { Hono } from 'hono'
import db from '../db.js'
import type { Debt } from '../../src/types/debt.js'

const router = new Hono()

function rowToDebt(row: Record<string, unknown>): Debt {
  return {
    id: row.id as string,
    debtType: (row.debt_type as Debt['debtType']) ?? 'installment',
    name: row.name as string,
    balance: row.balance as number,
    interestRate: row.interest_rate as number,
    minimumPaymentPercent: row.minimum_payment_percent as number | undefined,
    minimumPayment: row.minimum_payment as number,
    monthlyPayment: row.monthly_payment as number,
    startDate: row.start_date as string,
    notes: row.notes as string | undefined,
    color: row.color as string | undefined,
  }
}

router.get('/', (c) => {
  const rows = db.prepare('SELECT * FROM debts ORDER BY rowid').all() as Record<string, unknown>[]
  return c.json({ debts: rows.map(rowToDebt) })
})

router.post('/', async (c) => {
  const body = await c.req.json<Omit<Debt, 'id'> & { id?: string }>()
  const id = body.id ?? (Date.now().toString(36) + Math.random().toString(36).slice(2, 9))
  db.prepare(`
    INSERT INTO debts (id, debt_type, name, balance, interest_rate, minimum_payment_percent, minimum_payment, monthly_payment, start_date, notes, color)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    body.debtType ?? 'installment',
    body.name,
    body.balance,
    body.interestRate,
    body.minimumPaymentPercent ?? null,
    body.minimumPayment,
    body.monthlyPayment,
    body.startDate,
    body.notes ?? null,
    body.color ?? null,
  )
  const row = db.prepare('SELECT * FROM debts WHERE id = ?').get(id) as Record<string, unknown>
  return c.json({ debt: rowToDebt(row) }, 201)
})

router.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<Partial<Debt>>()
  const existing = db.prepare('SELECT * FROM debts WHERE id = ?').get(id) as Record<string, unknown> | undefined
  if (!existing) return c.json({ error: 'Not found' }, 404)

  const merged = { ...rowToDebt(existing), ...body }
  db.prepare(`
    UPDATE debts SET
      debt_type = ?, name = ?, balance = ?, interest_rate = ?,
      minimum_payment_percent = ?, minimum_payment = ?, monthly_payment = ?,
      start_date = ?, notes = ?, color = ?
    WHERE id = ?
  `).run(
    merged.debtType ?? 'installment',
    merged.name,
    merged.balance,
    merged.interestRate,
    merged.minimumPaymentPercent ?? null,
    merged.minimumPayment,
    merged.monthlyPayment,
    merged.startDate,
    merged.notes ?? null,
    merged.color ?? null,
    id,
  )
  const row = db.prepare('SELECT * FROM debts WHERE id = ?').get(id) as Record<string, unknown>
  return c.json({ debt: rowToDebt(row) })
})

router.delete('/:id', (c) => {
  const id = c.req.param('id')
  db.prepare('DELETE FROM debts WHERE id = ?').run(id)
  return c.json({ ok: true })
})

export default router
