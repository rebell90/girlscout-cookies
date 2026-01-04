'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="flex justify-between items-center mb-12">
          <div className="text-center flex-1">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              🍪 Cookie Sales Tracker
            </h1>
            <p className="text-xl text-gray-600">
              Welcome back, {session?.user?.name || session?.user?.email}!
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/dashboard" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-3">📊</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h2>
            <p className="text-gray-600">View sales summary and key metrics</p>
          </Link>

          <Link href="/cookies" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-3">🍪</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Cookies</h2>
            <p className="text-gray-600">View all cookie varieties and info</p>
          </Link>

          <Link href="/inventory" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-3">📦</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Inventory</h2>
            <p className="text-gray-600">Manage cookie inventory</p>
          </Link>

          <Link href="/orders" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-3">🛒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Orders</h2>
            <p className="text-gray-600">View and manage orders</p>
          </Link>

          <Link href="/customers" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-3">👥</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Customers</h2>
            <p className="text-gray-600">Manage customer information</p>
          </Link>

          <Link href="/routes" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-3">🗺️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Routes</h2>
            <p className="text-gray-600">Track door-to-door visits</p>
          </Link>

          <Link href="/deliveries" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-3">🚚</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Deliveries</h2>
            <p className="text-gray-600">Pending deliveries and payments</p>
          </Link>
        </div>
      </div>
    </div>
  )
}