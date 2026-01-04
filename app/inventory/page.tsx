'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface CookieType {
  id: string
  name: string
  price: number
}

interface InventoryTransaction {
  id: string
  quantity: number
  type: string
  notes: string | null
  date: string
  cookieType: CookieType
}

interface InventoryLevel {
  cookieTypeId: string
  cookieTypeName: string
  received: number
  sold: number
  available: number
}

export default function InventoryPage() {
  const [cookieTypes, setCookieTypes] = useState<CookieType[]>([])
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([])
  const [inventoryLevels, setInventoryLevels] = useState<InventoryLevel[]>([])
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const [cookiesRes, transactionsRes, levelsRes] = await Promise.all([
      fetch('/api/cookie-types'),
      fetch('/api/inventory/transactions'),
      fetch('/api/inventory/levels')
    ])

    const cookies = await cookiesRes.json()
    const trans = await transactionsRes.json()
    const levels = await levelsRes.json()

    setCookieTypes(cookies)
    setTransactions(trans)
    setInventoryLevels(levels)
  }

  async function handleAddInventory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    const data = {
      cookieTypeId: formData.get('cookieTypeId') as string,
      quantity: parseInt(formData.get('quantity') as string),
      notes: formData.get('notes') as string,
    }

    try {
      const response = await fetch('/api/inventory/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        form.reset()
        setShowAddForm(false)
        fetchData()
      }
    } catch (error) {
      console.error('Error adding inventory:', error)
    }
  }

  const totalReceived = inventoryLevels.reduce((sum, level) => sum + level.received, 0)
  const totalSold = inventoryLevels.reduce((sum, level) => sum + level.sold, 0)
  const totalAvailable = inventoryLevels.reduce((sum, level) => sum + level.available, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block font-semibold">
            ← Back to Home
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
              <p className="text-gray-800 mt-2">Manage your cookie inventory</p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg"
            >
              {showAddForm ? 'Cancel' : '+ Add Inventory'}
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Total Received</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{totalReceived}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Total Sold</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{totalSold}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Available</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">{totalAvailable}</p>
          </div>
        </div>

        {/* Add Inventory Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add Inventory</h2>
            <form onSubmit={handleAddInventory} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cookieTypeId" className="block text-sm font-semibold text-gray-900 mb-1">
                    Cookie Type *
                  </label>
                  <select
                    id="cookieTypeId"
                    name="cookieTypeId"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    <option value="">Select a cookie...</option>
                    {cookieTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="quantity" className="block text-sm font-semibold text-gray-900 mb-1">
                    Quantity (boxes) *
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    min="1"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-semibold text-gray-900 mb-1">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={2}
                  placeholder="e.g., Received from troop leader"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg"
              >
                Add Inventory
              </button>
            </form>
          </div>
        )}

        {/* Current Inventory Levels */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Current Stock Levels</h2>
          <div className="space-y-3">
            {inventoryLevels.map((level) => (
              <div key={level.cookieTypeId} className="border-b pb-3 last:border-b-0">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{level.cookieTypeName}</p>
                    <div className="flex gap-4 mt-1 text-sm">
                      <span className="text-gray-700">Received: {level.received}</span>
                      <span className="text-gray-700">Sold: {level.sold}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${level.available > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {level.available}
                    </p>
                    <p className="text-xs text-gray-600">available</p>
                  </div>
                </div>
              </div>
            ))}
            {inventoryLevels.length === 0 && (
              <p className="text-gray-600 text-center py-4">No inventory yet. Add some above!</p>
            )}
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Transaction History</h2>
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="border-b pb-3 last:border-b-0">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900">{transaction.cookieType.name}</p>
                    <p className="text-sm text-gray-700">
                      {new Date(transaction.date).toLocaleDateString()} · {transaction.type}
                    </p>
                    {transaction.notes && (
                      <p className="text-sm text-gray-600 italic mt-1">{transaction.notes}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-bold ${transaction.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.quantity > 0 ? '+' : ''}{transaction.quantity}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <p className="text-gray-600 text-center py-4">No transactions yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}