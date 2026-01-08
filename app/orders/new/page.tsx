'use client'

import { Suspense } from 'react'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
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

function NewOrderForm() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [cookieTypes, setCookieTypes] = useState<CookieType[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [source, setSource] = useState('DOOR_TO_DOOR')
  const [orderItems, setOrderItems] = useState<OrderItem[]>([{ cookieTypeId: '', quantity: 1 }])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchData()
    }
  }, [status, router])

  useEffect(() => {
    // Pre-select customer if customerId is in URL
    const customerId = searchParams.get('customerId')
    if (customerId) {
      setSelectedCustomerId(customerId)
    }
  }, [searchParams])

  async function fetchData() {
    try {
      const [customersRes, cookiesRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/cookie-types')
      ])

      if (customersRes.ok && cookiesRes.ok) {
        const customersData = await customersRes.json()
        const cookiesData = await cookiesRes.json()
        setCustomers(customersData)
        setCookieTypes(cookiesData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function addOrderItem() {
    setOrderItems([...orderItems, { cookieTypeId: '', quantity: 1 }])
  }

  function removeOrderItem(index: number) {
    setOrderItems(orderItems.filter((_, i) => i !== index))
  }

  function updateOrderItem(index: number, field: keyof OrderItem, value: string | number) {
    const updated = [...orderItems]
    updated[index] = { ...updated[index], [field]: value }
    setOrderItems(updated)
  }

  function calculateTotal() {
    return orderItems.reduce((sum, item) => {
      const cookie = cookieTypes.find(c => c.id === item.cookieTypeId)
      return sum + (cookie ? cookie.price * item.quantity : 0)
    }, 0)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          source,
          items: orderItems.filter(item => item.cookieTypeId && item.quantity > 0)
        }),
      })

      if (response.ok) {
        router.push('/orders')
      } else {
        console.error('Failed to create order')
      }
    } catch (error) {
      console.error('Error creating order:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/orders" className="text-blue-600 hover:text-blue-800 mb-4 inline-block font-semibold">
            ← Back to Orders
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create New Order</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
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
              <option value="">Select a customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
            <Link 
              href="/customers"
              className="text-sm text-blue-600 hover:text-blue-800 mt-1 inline-block"
            >
              + Add new customer
            </Link>
          </div>

          <div>
            <label htmlFor="source" className="block text-sm font-semibold text-gray-900 mb-1">
              Order Source
            </label>
            <select
              id="source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              <option value="DOOR_TO_DOOR">Door-to-Door</option>
              <option value="ONLINE">Online</option>
              <option value="BOOTH">Booth</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-gray-900">
                Order Items *
              </label>
              <button
                type="button"
                onClick={addOrderItem}
                className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
              >
                + Add Item
              </button>
            </div>
            <div className="space-y-3">
              {orderItems.map((item, index) => (
                <div key={index} className="flex gap-3">
                  <select
                    value={item.cookieTypeId}
                    onChange={(e) => updateOrderItem(index, 'cookieTypeId', e.target.value)}
                    required
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    <option value="">Select cookie type</option>
                    {cookieTypes.map((cookie) => (
                      <option key={cookie.id} value={cookie.id}>
                        {cookie.name} - ${cookie.price.toFixed(2)}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value))}
                    required
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                  {orderItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeOrderItem(index)}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-semibold"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-xl font-bold">
              <span className="text-gray-900">Total:</span>
              <span className="text-green-600">${calculateTotal().toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href="/orders"
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg disabled:bg-gray-400"
            >
              {isSubmitting ? 'Creating Order...' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <NewOrderForm />
    </Suspense>
  )
}