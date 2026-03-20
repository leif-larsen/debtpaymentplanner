import { useState } from 'react'
import Dashboard from './components/Dashboard'
import DebtForm from './components/DebtForm'
import PaymentsPage from './components/PaymentsPage'
import type { Debt } from './types/debt'

type Tab = 'dashboard' | 'add-debt' | 'payments'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null)

  const handleEditDebt = (debt: Debt) => {
    setEditingDebt(debt)
    setActiveTab('add-debt')
  }

  const handleFormSave = () => {
    setEditingDebt(null)
    setActiveTab('dashboard')
  }

  const handleTabChange = (tab: Tab) => {
    if (tab !== 'add-debt') setEditingDebt(null)
    setActiveTab(tab)
  }

  const addDebtLabel = editingDebt ? 'Edit Debt' : 'Add Debt'

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation bar */}
      <nav className="bg-gray-900 text-white">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex items-center justify-between h-14">
            {/* App name */}
            <span className="text-lg font-semibold tracking-tight">
              Debt Payment Planner
            </span>

            {/* Nav tabs */}
            <div className="flex gap-1">
              {(['dashboard', 'payments', 'add-debt'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {tab === 'add-debt' ? addDebtLabel : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="mx-auto max-w-5xl px-4 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            onAddDebt={() => handleTabChange('add-debt')}
            onEditDebt={handleEditDebt}
          />
        )}
        {activeTab === 'payments' && <PaymentsPage />}
        {activeTab === 'add-debt' && (
          <DebtForm
            initialData={editingDebt ?? undefined}
            onSave={handleFormSave}
          />
        )}
      </main>
    </div>
  )
}

export default App
