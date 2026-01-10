'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface Order {
  paymentMethod: ReactNode
  id: string
  orderDate: string
  totalAmount: number
  amountPaid: number
  isPaid: boolean
  isDelivered: boolean
  source: string
  customer: {
    id: string
    name: string
    phone: string | null
  }
  orderItems: {
    id: string
    quantity: number
    pricePerBox: number
    subtotal: number
    cookieType: {
      name: string
    }
  }[]
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'undelivered'>('all')

  useEffect(() => {
    fetchOrders()
  }, [])

  async function fetchOrders() {
    const response = await fetch('/api/orders')
    const data = await response.json()
    setOrders(data)
  }

  async function handleDelete(orderId: string) {
    if (!confirm('Are you sure you want to delete this order?')) return

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchOrders()
      }
    } catch (error) {
      console.error('Error deleting order:', error)
    }
  }

  async function togglePaid(orderId: string, isPaid: boolean) {
    try {
      const response = await fetch(`/api/orders/${orderId}/paid`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPaid: !isPaid }),
      })

      if (response.ok) {
        fetchOrders()
      }
    } catch (error) {
      console.error('Error updating order:', error)
    }
  }

  async function toggleDelivered(orderId: string, isDelivered: boolean) {
    try {
      const response = await fetch(`/api/orders/${orderId}/delivered`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDelivered: !isDelivered }),
      })

      if (response.ok) {
        fetchOrders()
      }
    } catch (error) {
      console.error('Error updating order:', error)
    }
  }

  const filteredOrders = orders.filter(order => {
    if (filter === 'unpaid') return !order.isPaid
    if (filter === 'undelivered') return !order.isDelivered
    return true
  })

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0)
  const totalBoxes = orders.reduce((sum, order) => 
    sum + order.orderItems.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block font-semibold">
            ← Back to Home
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
              <p className="text-gray-800 mt-2">
                {orders.length} orders · {totalBoxes} boxes · ${totalRevenue.toFixed(2)} total
              </p>
            </div>
            <Link
              href="/orders/new"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg"
            >
              + New Order
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-semibold ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              All Orders ({orders.length})
            </button>
            <button
              onClick={() => setFilter('unpaid')}
              className={`px-4 py-2 rounded-lg font-semibold ${
                filter === 'unpaid' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Unpaid ({orders.filter(o => !o.isPaid).length})
            </button>
            <button
              onClick={() => setFilter('undelivered')}
              className={`px-4 py-2 rounded-lg font-semibold ${
                filter === 'undelivered' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Undelivered ({orders.filter(o => !o.isDelivered).length})
            </button>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{order.customer.name}</h3>
                  {order.paymentMethod && (
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs font-semibold rounded">
                              {order.paymentMethod}
                            </span>
                          )}
                  {order.customer.phone && (
                    <p className="text-sm text-gray-700">{order.customer.phone}</p>
                  )}
                  <p className="text-sm text-gray-600">
                    {new Date(order.orderDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    ${order.totalAmount.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-700">
                    {order.orderItems.reduce((sum, item) => sum + item.quantity, 0)} boxes
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-4 space-y-1">
                {order.orderItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-800">
                      {item.quantity}x {item.cookieType.name}
                    </span>
                    <span className="text-gray-700">${item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Status and Actions */}
              <div className="flex flex-wrap gap-2 items-center justify-between border-t pt-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => togglePaid(order.id, order.isPaid)}
                    className={`px-3 py-1 rounded text-sm font-semibold ${
                      order.isPaid 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                    }`}
                  >
                    {order.isPaid ? '✓ Paid' : 'Mark Paid'}
                  </button>
                  <button
                    onClick={() => toggleDelivered(order.id, order.isDelivered)}
                    className={`px-3 py-1 rounded text-sm font-semibold ${
                      order.isDelivered 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {order.isDelivered ? '✓ Delivered' : 'Mark Delivered'}
                  </button>
                  <span className="px-3 py-1 rounded text-sm font-semibold bg-purple-100 text-purple-800">
                    {order.source.replace('_', ' ')}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(order.id)}
                  className="text-sm text-red-600 hover:text-red-800 font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-700 text-lg mb-4">
              {filter === 'all' 
                ? 'No orders yet. Create your first order!' 
                : `No ${filter} orders.`}
            </p>
            {filter === 'all' && (
              <Link
                href="/orders/new"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg"
              >
                + New Order
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}