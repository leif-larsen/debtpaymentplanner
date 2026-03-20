import { useState, useEffect } from 'react'
import { useDebtStore } from '../store/useDebtStore'
import { usePaymentStore } from '../store/usePaymentStore'
import type { Debt } from '../types/debt'
import type { Payment } from '../types/payment'

const LS_DEBT_KEY = 'debt-planner'
const LS_PAYMENT_KEY = 'debt-planner-payments'

function readLegacyData(): { debts: Debt[]; payments: Payment[] } | null {
  try {
    const debtRaw = localStorage.getItem(LS_DEBT_KEY)
    const paymentRaw = localStorage.getItem(LS_PAYMENT_KEY)
    if (!debtRaw && !paymentRaw) return null

    const debts: Debt[] = debtRaw
      ? (JSON.parse(debtRaw) as { state?: { debts?: Debt[] } }).state?.debts ?? []
      : []
    const payments: Payment[] = paymentRaw
      ? (JSON.parse(paymentRaw) as { state?: { payments?: Payment[] } }).state?.payments ?? []
      : []

    if (debts.length === 0 && payments.length === 0) return null
    return { debts, payments }
  } catch {
    return null
  }
}

export default function MigrationBanner() {
  const [legacy, setLegacy] = useState<{ debts: Debt[]; payments: Payment[] } | null>(null)
  const [status, setStatus] = useState<'idle' | 'migrating' | 'done' | 'error'>('idle')
  const loadDebts = useDebtStore((s) => s.load)
  const loadPayments = usePaymentStore((s) => s.load)

  useEffect(() => {
    setLegacy(readLegacyData())
  }, [])

  if (!legacy || status === 'done') return null

  const handleMigrate = async () => {
    setStatus('migrating')
    try {
      const res = await fetch('/api/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(legacy),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { debtsInserted, paymentsInserted } = await res.json() as {
        debtsInserted: number
        paymentsInserted: number
      }
      localStorage.removeItem(LS_DEBT_KEY)
      localStorage.removeItem(LS_PAYMENT_KEY)
      await Promise.all([loadDebts(), loadPayments()])
      console.log(`Migrated ${debtsInserted} debts and ${paymentsInserted} payments`)
      setStatus('done')
    } catch (e) {
      console.error('Migration failed', e)
      setStatus('error')
    }
  }

  const handleDismiss = () => {
    localStorage.removeItem(LS_DEBT_KEY)
    localStorage.removeItem(LS_PAYMENT_KEY)
    setLegacy(null)
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-700 px-4 py-3">
      <div className="mx-auto max-w-5xl flex items-center justify-between gap-4 flex-wrap">
        <div className="text-sm text-amber-800 dark:text-amber-300">
          <span className="font-semibold">Local data found</span>
          {' '}— {legacy.debts.length} debt{legacy.debts.length !== 1 ? 's' : ''} and{' '}
          {legacy.payments.length} payment{legacy.payments.length !== 1 ? 's' : ''} stored in this
          browser. Migrate to the database to keep your data.
        </div>
        <div className="flex gap-2 shrink-0">
          {status === 'error' && (
            <span className="text-sm text-red-600 dark:text-red-400 self-center">
              Migration failed — check console
            </span>
          )}
          <button
            onClick={handleMigrate}
            disabled={status === 'migrating'}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-medium rounded-md transition-colors"
          >
            {status === 'migrating' ? 'Migrating…' : 'Migrate now'}
          </button>
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 border border-amber-400 dark:border-amber-600 text-amber-700 dark:text-amber-300 text-sm rounded-md hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
          >
            Discard local data
          </button>
        </div>
      </div>
    </div>
  )
}
