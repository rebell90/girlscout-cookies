'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface Customer {
  id: string
  name: string
}

interface CookieType {
  id: string
  name: string
  price: number
}

interface OrderItem {
  cookieTypeId: string
  quantity: number
}

export default function NewOrderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedCustomerId = searchParams.get('customerId')

  const [customers, setCustomers] = useState<Customer[]>([])
  const [cookieTypes, setCookieTypes] = useState<CookieType[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState(preselectedCustomerId || '')
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [source, setSource] = useState('DOOR_TO_DOOR')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchCustomers()
    fetchCookieTypes()
  }, [])

  async function fetchCustomers() {
    const response = await fetch('/api/customers')
    const data = await response.json()
    setCustomers(data)
  }

  async function fetchCookieTypes() {
    const response = await fetch('/api/cookie-types')
    const data = await response.json()
    setCookieTypes(data)
  }

  function addItem() {
    if (cookieTypes.length > 0) {
      setOrderItems([...orderItems, { cookieTypeId: cookieTypes[0].id, quantity: 1 }])
    }
  }

  function removeItem(index: number) {
    setOrderItems(orderItems.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: 'cookieTypeId' | 'quantity', value: string | number) {
    const updated = [...orderItems]
    updated[index] = { ...updated[index], [field]: value }
    setOrderItems(updated)
  }

  function calculateTotal() {
    return orderItems.reduce((sum, item) => {
      const cookieType = cookieTypes.find(ct => ct.id === item.cookieTypeId)
      return sum + (cookieType ? cookieType.price * item.quantity : 0)
    }, 0)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCustomerId || orderItems.length === 0) return

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          source,
          items: orderItems,
        }),
      })

      if (response.ok) {
        router.push('/orders')
      }
    } catch (error) {
      console.error('Error creating order:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/orders" className="text-blue-600 hover:text-blue-800 mb-4 inline-block font-semibold">
            ← Back to Orders
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">New Order</h1>
          <p className="text-gray-800 mt-2">Create a new cookie order</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Customer Selection */}
          <div>
            <label htmlFor="customer" className="block text-sm font-semibold text-gray-900 mb-1">
              Customer *
            </label>
            <select
              id="customer"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              <option value="">Select a customer...</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
            <Link href="/customers" className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block">
              + Add new customer
            </Link>
          </div>

          {/* Source */}
          <div>
            <label htmlFor="source" className="block text-sm font-semibold text-gray-900 mb-1">
              Order Source *
            </label>
            <select
              id="source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              <option value="DOOR_TO_DOOR">Door to Door</option>
              <option value="ONLINE">Online</option>
              <option value="BOOTH">Booth</option>
            </select>
          </div>

          {/* Order Items */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-semibold text-gray-900">
                Order Items *
              </label>
              <button
                type="button"
                onClick={addItem}
                className="text-sm bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg"
              >
                + Add Item
              </button>
            </div>

            {orderItems.length === 0 && (
              <p className="text-gray-600 text-center py-8">No items yet. Click "Add Item" to start.</p>
            )}

            <div className="space-y-3">
              {orderItems.map((item, index) => {
                const cookieType = cookieTypes.find(ct => ct.id === item.cookieTypeId)
                return (
                  <div key={index} className="flex gap-3 items-center">
                    <select
                      value={item.cookieTypeId}
                      onChange={(e) => updateItem(index, 'cookieTypeId', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    >
                      {cookieTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name} - ${type.price.toFixed(2)}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                    <span className="w-24 text-right font-semibold text-gray-900">
                      ${cookieType ? (cookieType.price * item.quantity).toFixed(2) : '0.00'}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-800 font-bold text-xl"
                    >
                      ×
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Total */}
          {orderItems.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-xl font-bold">
                <span className="text-gray-900">Total:</span>
                <span className="text-gray-900">${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3">
            <Link
              href="/orders"
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || !selectedCustomerId || orderItems.length === 0}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg disabled:bg-gray-400"
            >
              {isSubmitting ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}