'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Customer {
  id: string
  name: string
}

interface RouteModalProps {
  isOpen: boolean
  onClose: () => void
  route?: {
    id: string
    address: string
    neighborhood: string | null
    visited: boolean
    status: string | null
    notes: string | null
    customerId: string | null
  }
}

export function RouteModal({ isOpen, onClose, route }: RouteModalProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [neighborhoods, setNeighborhoods] = useState<string[]>([])

  useEffect(() => {
    if (isOpen) {
      fetchCustomers()
      fetchNeighborhoods()
    }
  }, [isOpen])

  async function fetchCustomers() {
    const response = await fetch('/api/customers')
    const data = await response.json()
    setCustomers(data)
  }

  async function fetchNeighborhoods() {
    try {
      const response = await fetch('/api/neighborhoods')
      const data = await response.json()
      setNeighborhoods(data)
    } catch (error) {
      console.error('Error fetching neighborhoods:', error)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)

    const form = e.currentTarget
    const formData = new FormData(form)
    const data = {
      address: formData.get('address') as string,
      neighborhood: formData.get('neighborhood') as string,
      status: formData.get('status') as string,
      notes: formData.get('notes') as string,
      customerId: formData.get('customerId') as string || null,
    }

    try {
      const url = route ? `/api/routes/${route.id}` : '/api/routes'
      const method = route ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        form.reset()
        router.refresh()
        onClose()
      }
    } catch (error) {
      console.error('Error saving route:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {route ? 'Edit Location' : 'Add Route Location'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="address" className="block text-sm font-semibold text-gray-900 mb-1">
                Address *
              </label>
              <input
                type="text"
                id="address"
                name="address"
                required
                defaultValue={route?.address}
                placeholder="123 Main St"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>

            <div>
              <label htmlFor="neighborhood" className="block text-sm font-semibold text-gray-900 mb-1">
                Neighborhood
              </label>
              <input
                type="text"
                id="neighborhood"
                name="neighborhood"
                list="neighborhoods-list"
                defaultValue={route?.neighborhood || ''}
                placeholder="e.g., Oak Street, Downtown"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-500"
              />
              <datalist id="neighborhoods-list">
                {neighborhoods.map((neighborhood) => (
                  <option key={neighborhood} value={neighborhood} />
                ))}
              </datalist>
              <p className="text-xs text-gray-600 mt-1">
                Start typing to see suggestions from previous entries, or type a new neighborhood
              </p>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-semibold text-gray-900 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={route?.status || 'NOT_VISITED'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                <option value="NOT_VISITED">Not Visited</option>
                <option value="ORDERED">Ordered</option>
                <option value="DECLINED">Declined</option>
                <option value="CALLBACK">Callback Later</option>
              </select>
            </div>

            <div>
              <label htmlFor="customerId" className="block text-sm font-semibold text-gray-900 mb-1">
                Link to Customer (optional)
              </label>
              <select
                id="customerId"
                name="customerId"
                defaultValue={route?.customerId || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                <option value="">None</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-semibold text-gray-900 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                defaultValue={route?.notes || ''}
                placeholder="e.g., Come back in February, Wants Thin Mints"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg disabled:bg-gray-400"
              >
                {isSubmitting ? 'Saving...' : route ? 'Update Location' : 'Add Location'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}