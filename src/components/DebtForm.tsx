import { useState, useEffect } from 'react'
import { useDebtStore } from '../store/useDebtStore'
import type { Debt, DebtFormData, DebtType } from '../types/debt'

interface DebtFormProps {
  initialData?: Debt
  onSave?: () => void
}

const today = () => new Date().toISOString().slice(0, 10)

const emptyForm = (): DebtFormData => ({
  debtType: 'installment',
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

  const debtType: DebtType = form.debtType ?? 'installment'

  const set = <K extends keyof DebtFormData>(key: K, value: DebtFormData[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const handleTypeChange = (type: DebtType) => {
    setForm((f) => ({
      ...f,
      debtType: type,
      minimumPaymentPercent: type === 'revolving' ? (f.minimumPaymentPercent ?? undefined) : undefined,
    }))
    setErrors({})
  }

  const handleMinPctChange = (raw: string) => {
    const pct = raw === '' ? undefined : Number(raw)
    const computed = pct && form.balance > 0
      ? Math.round(form.balance * pct / 100 * 100) / 100
      : undefined
    setForm((f) => ({
      ...f,
      minimumPaymentPercent: pct,
      minimumPayment: computed ?? f.minimumPayment,
      monthlyPayment: computed ? Math.max(f.monthlyPayment, computed) : f.monthlyPayment,
    }))
    setErrors((e) => ({ ...e, minimumPaymentPercent: undefined, minimumPayment: undefined }))
  }

  const validate = (): boolean => {
    const e: Partial<Record<keyof DebtFormData, string>> = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.balance || form.balance <= 0) e.balance = 'Balance must be greater than 0'
    if (!form.interestRate || form.interestRate <= 0) e.interestRate = 'Interest rate must be greater than 0'

    if (debtType === 'revolving') {
      if (!form.minimumPaymentPercent || form.minimumPaymentPercent <= 0)
        e.minimumPaymentPercent = 'Minimum payment % is required for revolving credit'
    } else {
      if (!form.minimumPayment || form.minimumPayment <= 0)
        e.minimumPayment = 'Minimum payment must be greater than 0'
    }

    if (!form.monthlyPayment || form.monthlyPayment <= 0)
      e.monthlyPayment = 'Monthly payment must be greater than 0'
    else if (form.monthlyPayment < form.minimumPayment)
      e.monthlyPayment = 'Monthly payment cannot be less than the minimum payment'

    if (!form.startDate) e.startDate = 'Start date is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    if (initialData) {
      await updateDebt(initialData.id, form)
      setSuccess('Debt updated!')
      setTimeout(() => onSave?.(), 800)
    } else {
      await addDebt(form)
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

        {/* Debt type selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Debt type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['installment', 'revolving'] as DebtType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleTypeChange(type)}
                className={[
                  'py-2 px-3 rounded-md text-sm font-medium border transition-colors text-left',
                  debtType === type
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-indigo-400',
                ].join(' ')}
              >
                <span className="block font-semibold capitalize">{type}</span>
                <span className={`block text-xs mt-0.5 ${debtType === type ? 'text-indigo-200' : 'text-gray-400 dark:text-gray-500'}`}>
                  {type === 'installment' ? 'Fixed payment · covers principal + interest' : 'Interest accrues to balance · % minimum'}
                </span>
              </button>
            ))}
          </div>
        </div>

        <Field label="Name" error={errors.name}>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder={debtType === 'installment' ? 'e.g. Car loan' : 'e.g. Visa card'}
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

        {debtType === 'revolving' ? (
          /* Revolving: minimum % is required; NOK amount auto-computed */
          <div className="grid grid-cols-2 gap-4">
            <Field label="Minimum payment %" error={errors.minimumPaymentPercent}>
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={form.minimumPaymentPercent ?? ''}
                onChange={(e) => handleMinPctChange(e.target.value)}
                placeholder="e.g. 3.5"
                className={input(errors.minimumPaymentPercent)}
              />
            </Field>
            <Field label="Minimum payment (NOK)" hint="auto-computed">
              <input
                type="number"
                min={0}
                step={1}
                value={form.minimumPayment || ''}
                readOnly
                className={`${input()} opacity-60 cursor-not-allowed`}
              />
            </Field>
          </div>
        ) : (
          /* Installment: fixed minimum amount */
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
        )}

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
