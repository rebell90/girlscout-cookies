'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
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

interface Order {
  id: string
  customerId: string
  source: string
  paymentMethod: string | null
  notes: string | null
  totalAmount: number
  donation: number
  orderItems: {
    id: string
    cookieTypeId: string
    quantity: number
    pricePerBox: number
    subtotal: number
    cookieType: {
      id: string
      name: string
      price: number
    }
  }[]
}

export default function EditOrderPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const [customers, setCustomers] = useState<Customer[]>([])
  const [cookieTypes, setCookieTypes] = useState<CookieType[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [source, setSource] = useState('DOOR_TO_DOOR')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [donation, setDonation] = useState(0)
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

  async function fetchData() {
    try {
      const [customersRes, cookiesRes, orderRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/cookie-types'),
        fetch(`/api/orders/${orderId}`)
      ])

      if (customersRes.ok && cookiesRes.ok && orderRes.ok) {
        const customersData = await customersRes.json()
        const cookiesData = await cookiesRes.json()
        const orderData: Order = await orderRes.json()

        setCustomers(customersData)
        setCookieTypes(cookiesData)

        // Populate form with existing order data
        setSelectedCustomerId(orderData.customerId)
        setSource(orderData.source)
        setPaymentMethod(orderData.paymentMethod || 'CASH')
        setDonation(orderData.donation || 0)
        setOrderItems(orderData.orderItems.map(item => ({
          cookieTypeId: item.cookieTypeId,
          quantity: item.quantity
        })))
      } else {
        console.error('Failed to fetch data')
        router.push('/orders')
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      router.push('/orders')
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
    const itemsTotal = orderItems.reduce((sum, item) => {
      const cookie = cookieTypes.find(c => c.id === item.cookieTypeId)
      return sum + (cookie ? cookie.price * item.quantity : 0)
    }, 0)
    return itemsTotal + donation
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          source,
          paymentMethod,
          donation: donation,
          items: orderItems.filter(item => item.cookieTypeId && item.quantity > 0)
        }),
      })

      if (response.ok) {
        router.push('/orders')
      } else {
        console.error('Failed to update order')
      }
    } catch (error) {
      console.error('Error updating order:', error)
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
          <h1 className="text-3xl font-bold text-gray-900">Edit Order</h1>
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
            <label htmlFor="paymentMethod" className="block text-sm font-semibold text-gray-900 mb-1">
              Payment Method
            </label>
            <select
              id="paymentMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              <option value="CASH">Cash</option>
              <option value="VENMO">Venmo</option>
              <option value="ONLINE">Pre-Paid Online</option>
              <option value="CHECK">Check</option>
              <option value="CARD">Credit or Debit Card</option>
              <option value="OTHER">Other</option>
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
                <div key={index} className="flex flex-col sm:flex-row gap-2 sm:gap-3">
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
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value))}
                      required
                      placeholder="Qty"
                      className="w-20 sm:w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                    {orderItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeOrderItem(index)}
                        className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-semibold whitespace-nowrap"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="donation" className="block text-sm font-semibold text-gray-900 mb-1">
              Monetary Donation (Optional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-600">$</span>
              <input
                id="donation"
                type="number"
                min="0"
                step="0.01"
                value={donation}
                onChange={(e) => setDonation(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Add a donation amount to support the troop
            </p>
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
              {isSubmitting ? 'Updating Order...' : 'Update Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
