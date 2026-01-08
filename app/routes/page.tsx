'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { RouteModal } from './RouteModal'

export const dynamic = 'force-dynamic'

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

type FilterType = 'all' | 'not_visited' | 'ordered' | 'callback'

// Status Badge Component - eliminates repeated conditional rendering
function StatusBadge({ status }: { status: string | null }) {
  if (!status) return null

  const statusConfig = {
    ORDERED: { bg: 'bg-green-100', text: 'text-green-800', label: '✓ Ordered' },
    DECLINED: { bg: 'bg-red-100', text: 'text-red-800', label: '✗ Declined' },
    CALLBACK: { bg: 'bg-purple-100', text: 'text-purple-800', label: '📞 Callback' },
    NOT_VISITED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Not Visited' },
  } as const

  const config = statusConfig[status as keyof typeof statusConfig]
  if (!config) return null

  return (
    <span className={`px-3 py-1 ${config.bg} ${config.text} text-xs font-semibold rounded-full`}>
      {config.label}
    </span>
  )
}

// Helper to check if route matches current filters
function routeMatchesFilters(
  route: RouteLocation,
  statusFilter: FilterType,
  neighborhoodFilter: string
): boolean {
  const statusMatch =
    statusFilter === 'all' ||
    (statusFilter === 'not_visited' && !route.visited) ||
    (statusFilter === 'ordered' && route.status === 'ORDERED') ||
    (statusFilter === 'callback' && route.status === 'CALLBACK')

  const neighborhoodMatch =
    neighborhoodFilter === 'all' ||
    route.neighborhood === neighborhoodFilter

  return statusMatch && neighborhoodMatch
}

export default function RoutesPage() {
  const [routes, setRoutes] = useState<RouteLocation[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRoute, setEditingRoute] = useState<RouteLocation | undefined>()
  const [filter, setFilter] = useState<FilterType>('all')
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

  // Calculate stats in a single pass through routes (more efficient than 5 separate filters)
  const stats = routes.reduce(
    (acc, route) => {
      acc.total++
      if (route.visited) acc.visited++
      if (!route.visited) acc.notVisited++
      if (route.status === 'ORDERED') acc.ordered++
      if (route.status === 'CALLBACK') acc.callback++
      return acc
    },
    { total: 0, visited: 0, notVisited: 0, ordered: 0, callback: 0 }
  )

  // Get unique neighborhoods
  const neighborhoods = Array.from(
    new Set(routes.map(r => r.neighborhood).filter(Boolean))
  ) as string[]

  // Filter routes using extracted helper function
  const filteredRoutes = routes.filter(route =>
    routeMatchesFilters(route, filter, neighborhoodFilter)
  )

  // Group filtered routes by neighborhood
  const routesByNeighborhood = filteredRoutes.reduce((acc, route) => {
    const neighborhood = route.neighborhood || 'No Neighborhood'
    if (!acc[neighborhood]) {
      acc[neighborhood] = []
    }
    acc[neighborhood].push(route)
    return acc
  }, {} as Record<string, RouteLocation[]>)

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
            {[
              { value: 'all' as const, label: 'All', count: routes.length },
              { value: 'not_visited' as const, label: 'Not Visited', count: stats.notVisited },
              { value: 'ordered' as const, label: 'Ordered', count: stats.ordered },
              { value: 'callback' as const, label: 'Callback', count: stats.callback },
            ].map(({ value, label, count }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                  filter === value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {label} ({count})
              </button>
            ))}
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
                        <StatusBadge status={location.status} />
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