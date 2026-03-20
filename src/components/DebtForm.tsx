import { useState, useEffect } from 'react'
import { useDebtStore } from '../store/useDebtStore'
import type { Debt, DebtFormData } from '../types/debt'

interface DebtFormProps {
  initialData?: Debt
  onSave?: () => void
}

const today = () => new Date().toISOString().slice(0, 10)

const emptyForm = (): DebtFormData => ({
  name: '',
  balance: 0,
  interestRate: 0,
  minimumPaymentPercent: undefined,
  minimumPayment: 0,
  monthlyPayment: 0,
  startDate: today(),
  notes: '',
})

export default function DebtForm({ initialData, onSave }: DebtFormProps) {
  const addDebt = useDebtStore((s) => s.addDebt)
  const updateDebt = useDebtStore((s) => s.updateDebt)

  const [form, setForm] = useState<DebtFormData>(
    initialData ? { ...initialData } : emptyForm()
  )
  const [errors, setErrors] = useState<Partial<Record<keyof DebtFormData, string>>>({})
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (initialData) setForm({ ...initialData })
  }, [initialData])

  const set = <K extends keyof DebtFormData>(key: K, value: DebtFormData[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const validate = (): boolean => {
    const e: Partial<Record<keyof DebtFormData, string>> = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.balance || form.balance <= 0) e.balance = 'Balance must be greater than 0'
    if (!form.interestRate || form.interestRate <= 0) e.interestRate = 'Interest rate must be greater than 0'
    if (!form.minimumPayment || form.minimumPayment <= 0) e.minimumPayment = 'Minimum payment must be greater than 0'
    if (!form.monthlyPayment || form.monthlyPayment <= 0) e.monthlyPayment = 'Monthly payment must be greater than 0'
    else if (form.monthlyPayment < form.minimumPayment)
      e.monthlyPayment = 'Monthly payment cannot be less than the minimum payment'
    if (!form.startDate) e.startDate = 'Start date is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    if (initialData) {
      updateDebt(initialData.id, form)
      setSuccess('Debt updated!')
      setTimeout(() => onSave?.(), 800)
    } else {
      addDebt(form)
      setSuccess('Debt added!')
      setForm(emptyForm())
      setTimeout(() => onSave?.(), 800)
    }
  }

  const isEditing = !!initialData

  return (
    <div className="max-w-lg mx-auto p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
        {isEditing ? 'Edit Debt' : 'Add New Debt'}
      </h2>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <Field label="Name" error={errors.name}>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Student loan"
            className={input(errors.name)}
          />
        </Field>

        <Field label="Current balance (NOK)" error={errors.balance}>
          <input
            type="number"
            min={0}
            step={1}
            value={form.balance || ''}
            onChange={(e) => set('balance', Number(e.target.value))}
            placeholder="e.g. 150000"
            className={input(errors.balance)}
          />
        </Field>

        <Field label="Interest rate (APR %)" error={errors.interestRate}>
          <input
            type="number"
            min={0}
            step={0.01}
            value={form.interestRate || ''}
            onChange={(e) => set('interestRate', Number(e.target.value))}
            placeholder="e.g. 5.5"
            className={input(errors.interestRate)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Minimum payment % (optional)" hint="e.g. 3.5 for credit cards">
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={form.minimumPaymentPercent ?? ''}
              onChange={(e) => {
                const pct = e.target.value === '' ? undefined : Number(e.target.value)
                const computed = pct && form.balance > 0
                  ? Math.round(form.balance * pct / 100 * 100) / 100
                  : undefined
                setForm((f) => ({
                  ...f,
                  minimumPaymentPercent: pct,
                  minimumPayment: computed ?? f.minimumPayment,
                  monthlyPayment: computed ?? f.monthlyPayment,
                }))
                setErrors((err) => ({ ...err, minimumPayment: undefined, monthlyPayment: undefined }))
              }}
              placeholder="e.g. 3.5"
              className={input()}
            />
          </Field>

          <Field label="Minimum monthly payment (NOK)" error={errors.minimumPayment}>
            <input
              type="number"
              min={0}
              step={1}
              value={form.minimumPayment || ''}
              onChange={(e) => set('minimumPayment', Number(e.target.value))}
              placeholder="e.g. 2000"
              className={input(errors.minimumPayment)}
            />
          </Field>
        </div>

        <Field label="Actual monthly payment (NOK)" error={errors.monthlyPayment}>
          <input
            type="number"
            min={0}
            step={1}
            value={form.monthlyPayment || ''}
            onChange={(e) => set('monthlyPayment', Number(e.target.value))}
            placeholder="e.g. 3000"
            className={input(errors.monthlyPayment)}
          />
        </Field>

        <Field label="Start date" error={errors.startDate}>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => set('startDate', e.target.value)}
            className={input(errors.startDate)}
          />
        </Field>

        <Field label="Notes (optional)">
          <textarea
            value={form.notes ?? ''}
            onChange={(e) => set('notes', e.target.value)}
            rows={3}
            placeholder="Any additional details..."
            className={`${input()} resize-none`}
          />
        </Field>

        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            className="px-5 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition-colors"
          >
            {isEditing ? 'Save changes' : 'Add debt'}
          </button>
          {success && (
            <span className="text-green-600 text-sm font-medium">{success}</span>
          )}
        </div>
      </form>
    </div>
  )
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
        {hint && <span className="ml-1 font-normal text-gray-400 dark:text-gray-500">({hint})</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}

function input(error?: string) {
  return [
    'w-full rounded-md border px-3 py-2 text-sm',
    'text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700',
    'focus:outline-none focus:ring-2 focus:ring-indigo-500',
    error ? 'border-red-400 dark:border-red-600' : 'border-gray-300 dark:border-gray-600',
  ].join(' ')
}
