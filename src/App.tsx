import { useState } from 'react'
import Dashboard from './components/Dashboard'
import DebtForm from './components/DebtForm'
import type { Debt } from './types/debt'

type Tab = 'dashboard' | 'add-debt'

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
    if (tab === 'dashboard') setEditingDebt(null)
    setActiveTab(tab)
  }

  const addDebtLabel = editingDebt ? 'Edit Debt' : 'Add Debt'

  return (
    <div className="min-h-screen bg-white">
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
              <button
                onClick={() => handleTabChange('dashboard')}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  activeTab === 'dashboard'
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => handleTabChange('add-debt')}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  activeTab === 'add-debt'
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {addDebtLabel}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="mx-auto max-w-5xl px-4 py-6">
        {activeTab === 'dashboard' ? (
          <Dashboard
            onAddDebt={() => handleTabChange('add-debt')}
            onEditDebt={handleEditDebt}
          />
        ) : (
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
