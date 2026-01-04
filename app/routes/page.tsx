'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { RouteModal } from './RouteModal'

interface Customer {
  id: string
  name: string
}

interface RouteLocation {
  id: string
  address: string
  neighborhood: string | null
  visited: boolean
  visitedAt: string | null
  status: string | null
  notes: string | null
  customerId: string | null
  customer: Customer | null
}

export default function RoutesPage() {
  const [routes, setRoutes] = useState<RouteLocation[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRoute, setEditingRoute] = useState<RouteLocation | undefined>()
  const [filter, setFilter] = useState<'all' | 'not_visited' | 'ordered' | 'callback'>('all')
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<string>('all')

  useEffect(() => {
    fetchRoutes()
  }, [])

  async function fetchRoutes() {
    const response = await fetch('/api/routes')
    const data = await response.json()
    setRoutes(data)
  }

  async function handleDelete(routeId: string) {
    if (!confirm('Are you sure you want to delete this route location?')) return

    try {
      const response = await fetch(`/api/routes/${routeId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchRoutes()
      }
    } catch (error) {
      console.error('Error deleting route:', error)
    }
  }

  async function toggleVisited(routeId: string, visited: boolean) {
    try {
      const response = await fetch(`/api/routes/${routeId}/visited`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visited: !visited }),
      })

      if (response.ok) {
        fetchRoutes()
      }
    } catch (error) {
      console.error('Error updating route:', error)
    }
  }

  function openAddModal() {
    setEditingRoute(undefined)
    setIsModalOpen(true)
  }

  function openEditModal(route: RouteLocation) {
    setEditingRoute(route)
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingRoute(undefined)
    fetchRoutes()
  }

  // Get unique neighborhoods
  const neighborhoods = Array.from(new Set(routes.map(r => r.neighborhood).filter(Boolean))) as string[]

  // Filter routes
  const filteredRoutes = routes.filter(route => {
    const statusMatch = filter === 'all' || 
      (filter === 'not_visited' && !route.visited) ||
      (filter === 'ordered' && route.status === 'ORDERED') ||
      (filter === 'callback' && route.status === 'CALLBACK')
    
    const neighborhoodMatch = neighborhoodFilter === 'all' || route.neighborhood === neighborhoodFilter

    return statusMatch && neighborhoodMatch
  })

  // Group by neighborhood
  const routesByNeighborhood = filteredRoutes.reduce((acc, route) => {
    const neighborhood = route.neighborhood || 'No Neighborhood'
    if (!acc[neighborhood]) {
      acc[neighborhood] = []
    }
    acc[neighborhood].push(route)
    return acc
  }, {} as Record<string, RouteLocation[]>)

  const stats = {
    total: routes.length,
    visited: routes.filter(r => r.visited).length,
    notVisited: routes.filter(r => !r.visited).length,
    ordered: routes.filter(r => r.status === 'ORDERED').length,
    callback: routes.filter(r => r.status === 'CALLBACK').length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block font-semibold">
            ← Back to Home
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Routes</h1>
              <p className="text-gray-800 mt-2">Track your door-to-door visits</p>
            </div>
            <button
              onClick={openAddModal}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg"
            >
              + Add Location
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs font-medium text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs font-medium text-gray-600">Not Visited</p>
            <p className="text-2xl font-bold text-orange-600">{stats.notVisited}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs font-medium text-gray-600">Visited</p>
            <p className="text-2xl font-bold text-blue-600">{stats.visited}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs font-medium text-gray-600">Ordered</p>
            <p className="text-2xl font-bold text-green-600">{stats.ordered}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs font-medium text-gray-600">Callback</p>
            <p className="text-2xl font-bold text-purple-600">{stats.callback}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-3 mb-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              All ({routes.length})
            </button>
            <button
              onClick={() => setFilter('not_visited')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                filter === 'not_visited' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Not Visited ({stats.notVisited})
            </button>
            <button
              onClick={() => setFilter('ordered')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                filter === 'ordered' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Ordered ({stats.ordered})
            </button>
            <button
              onClick={() => setFilter('callback')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                filter === 'callback' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Callback ({stats.callback})
            </button>
          </div>

          {neighborhoods.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Filter by Neighborhood:
              </label>
              <select
                value={neighborhoodFilter}
                onChange={(e) => setNeighborhoodFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                <option value="all">All Neighborhoods</option>
                {neighborhoods.map((neighborhood) => (
                  <option key={neighborhood} value={neighborhood}>
                    {neighborhood}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Routes List */}
        <div className="space-y-6">
          {Object.entries(routesByNeighborhood).map(([neighborhood, locations]) => (
            <div key={neighborhood} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {neighborhood} ({locations.length})
              </h3>
              <div className="space-y-3">
                {locations.map((location) => (
                  <div key={location.id} className="border-b pb-3 last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{location.address}</p>
                        {location.customer && (
                          <p className="text-sm text-gray-700">Customer: {location.customer.name}</p>
                        )}
                        {location.notes && (
                          <p className="text-sm text-gray-600 italic mt-1">{location.notes}</p>
                        )}
                        {location.visitedAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            Visited: {new Date(location.visitedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="ml-4 flex flex-col gap-2 items-end">
                        <div className="flex gap-2">
                          {location.status === 'ORDERED' && (
                            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                              ✓ Ordered
                            </span>
                          )}
                          {location.status === 'DECLINED' && (
                            <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                              ✗ Declined
                            </span>
                          )}
                          {location.status === 'CALLBACK' && (
                            <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
                              📞 Callback
                            </span>
                          )}
                          {location.status === 'NOT_VISITED' && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full">
                              Not Visited
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleVisited(location.id, location.visited)}
                            className={`text-xs px-3 py-1 rounded font-semibold ${
                              location.visited
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                          >
                            {location.visited ? '👁️ Visited' : 'Mark Visited'}
                          </button>
                          <button
                            onClick={() => openEditModal(location)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(location.id)}
                            className="text-xs text-red-600 hover:text-red-800 font-semibold"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredRoutes.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-700 text-lg mb-4">No route locations yet. Add your first location!</p>
            <button
              onClick={openAddModal}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg"
            >
              + Add Location
            </button>
          </div>
        )}
      </div>

      <RouteModal
        isOpen={isModalOpen}
        onClose={closeModal}
        route={editingRoute}
      />
    </div>
  )
}