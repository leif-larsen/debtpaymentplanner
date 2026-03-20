import { useState } from 'react'
import { usePaymentStore } from '../store/usePaymentStore'
import type { Debt } from '../types/debt'
import type { PaymentType } from '../types/payment'

interface PaymentFormProps {
  debt: Debt
  onClose: () => void
}

const today = () => new Date().toISOString().slice(0, 10)

export default function PaymentForm({ debt, onClose }: PaymentFormProps) {
  const addPayment = usePaymentStore((s) => s.addPayment)
  const [type, setType] = useState<PaymentType>('payment')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(today())
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = Number(amount)
    if (!parsed || parsed <= 0) {
      setError('Amount must be greater than 0')
      return
    }
    addPayment(debt.id, date, parsed, type, note.trim() || undefined)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
          Register transaction
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{debt.name}</p>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Type toggle */}
          <div className="flex rounded-md overflow-hidden border border-gray-300 dark:border-gray-600 text-sm font-medium">
            {(['payment', 'charge'] as PaymentType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={[
                  'flex-1 py-2 transition-colors capitalize',
                  type === t
                    ? t === 'payment'
                      ? 'bg-green-600 text-white'
                      : 'bg-red-500 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600',
                ].join(' ')}
              >
                {t === 'payment' ? 'Payment (reduces debt)' : 'Charge (increases debt)'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Amount (NOK)
              </label>
              <input
                type="number"
                min={0}
                step={1}
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(null) }}
                placeholder="e.g. 2000"
                className={inputCls(!!error)}
                autoFocus
              />
              {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputCls(false)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Note (optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Monthly payment"
              className={inputCls(false)}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              className={[
                'flex-1 py-2 rounded-md text-sm font-medium text-white transition-colors',
                type === 'payment'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-500 hover:bg-red-600',
              ].join(' ')}
            >
              {type === 'payment' ? 'Register payment' : 'Register charge'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-md text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function inputCls(hasError: boolean) {
  return [
    'w-full rounded-md border px-3 py-2 text-sm',
    'text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700',
    'focus:outline-none focus:ring-2 focus:ring-indigo-500',
    hasError ? 'border-red-400 dark:border-red-600' : 'border-gray-300 dark:border-gray-600',
  ].join(' ')
}
