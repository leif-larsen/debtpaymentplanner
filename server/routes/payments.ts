import { Hono } from 'hono'
import db from '../db.js'
import type { Payment } from '../../src/types/payment.js'

const router = new Hono()

function rowToPayment(row: Record<string, unknown>): Payment {
  return {
    id: row.id as string,
    debtId: row.debt_id as string,
    date: row.date as string,
    amount: row.amount as number,
    type: row.type as Payment['type'],
    note: row.note as string | undefined,
  }
}

router.get('/', (c) => {
  const rows = db.prepare('SELECT * FROM payments ORDER BY date, rowid').all() as Record<string, unknown>[]
  return c.json({ payments: rows.map(rowToPayment) })
})

router.post('/', async (c) => {
  const body = await c.req.json<Omit<Payment, 'id'> & { id?: string }>()
  const id = body.id ?? (Date.now().toString(36) + Math.random().toString(36).slice(2, 9))
  db.prepare(`
    INSERT INTO payments (id, debt_id, date, amount, type, note)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, body.debtId, body.date, body.amount, body.type, body.note ?? null)
  const row = db.prepare('SELECT * FROM payments WHERE id = ?').get(id) as Record<string, unknown>
  return c.json({ payment: rowToPayment(row) }, 201)
})

router.delete('/:id', (c) => {
  const id = c.req.param('id')
  db.prepare('DELETE FROM payments WHERE id = ?').run(id)
  return c.json({ ok: true })
})

export default router
