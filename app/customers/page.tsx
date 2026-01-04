'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { CustomerModal } from './CustomerModal'

export const dynamic = 'force-dynamic'

interface OrderItem {
  id: string
  quantity: number
  pricePerBox: number
  subtotal: number
}

interface Order {
  id: string
  totalAmount: number
  amountPaid: number
  isPaid: boolean
  isDelivered: boolean
  orderItems: OrderItem[]
}

interface Customer {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  neighborhood: string | null
  notes: string | null
  orders: Order[]
}

export default function CustomersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchCustomers()
    }
  }, [status, router])

  async function fetchCustomers() {
    setIsLoading(true)
    try {
      const response = await fetch('/api/customers')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
      } else if (response.status === 401) {
        router.push('/login')
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(customerId: string) {
    if (!confirm('Are you sure you want to delete this customer?')) return

    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchCustomers()
      }
    } catch (error) {
      console.error('Error deleting customer:', error)
    }
  }

  function openAddModal() {
    setEditingCustomer(undefined)
    setIsModalOpen(true)
  }

  function openEditModal(customer: Customer) {
    setEditingCustomer(customer)
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingCustomer(undefined)
    fetchCustomers()
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

  // Group by neighborhood
  const customersByNeighborhood = customers.reduce((acc, customer) => {
    const neighborhood = customer.neighborhood || 'No Neighborhood'
    if (!acc[neighborhood]) {
      acc[neighborhood] = []
    }
    acc[neighborhood].push(customer)
    return acc
  }, {} as Record<string, Customer[]>)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block font-semibold">
            ← Back to Home
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
              <p className="text-gray-800 mt-2">Manage your customer list</p>
            </div>
            <button
              onClick={openAddModal}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg"
            >
              + Add Customer
            </button>
          </div>
        </div>

        {/* Customer List */}
        <div className="space-y-6">
          {Object.entries(customersByNeighborhood).map(([neighborhood, customers]) => (
            <div key={neighborhood} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {neighborhood} ({customers.length})
              </h3>
              <div className="space-y-3">
                {customers.map((customer) => (
                  <div key={customer.id} className="border-b pb-3 last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{customer.name}</p>
                        {customer.address && (
                          <p className="text-sm text-gray-800">{customer.address}</p>
                        )}
                        {customer.phone && (
                          <p className="text-sm text-gray-800">{customer.phone}</p>
                        )}
                        {customer.notes && (
                          <p className="text-sm text-gray-700 italic mt-1">{customer.notes}</p>
                        )}
                      </div>
                      <div className="text-right ml-4 flex flex-col gap-2">
                        <p className="text-sm font-medium text-gray-800">
                          {customer.orders.length} {customer.orders.length === 1 ? 'order' : 'orders'}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(customer)}
                            className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(customer.id)}
                            className="text-sm text-red-600 hover:text-red-800 font-semibold"
                          >
                            Delete
                          </button>
                        </div>
                        <Link 
                          href={`/orders/new?customerId=${customer.id}`}
                          className="text-sm text-green-600 hover:text-green-800 font-semibold"
                        >
                          + New Order
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {customers.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-700 text-lg mb-4">No customers yet. Add your first customer!</p>
            <button
              onClick={openAddModal}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg"
            >
              + Add Customer
            </button>
          </div>
        )}
      </div>

      <CustomerModal
        isOpen={isModalOpen}
        onClose={closeModal}
        customer={editingCustomer}
      />
    </div>
  )
}