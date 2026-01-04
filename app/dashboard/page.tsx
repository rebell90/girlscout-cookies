import { getCurrentUser } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { Decimal } from 'decimal.js'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get all orders with customer and items
  const orders = await prisma.order.findMany({
    where: {
      userId: user.id
    },
    include: {
      customer: true,
      orderItems: {
        include: {
          cookieType: true
        }
      }
    },
    orderBy: {
      orderDate: 'desc'
    }
  })

  // Get cookie types for inventory
  const cookieTypes = await prisma.cookieType.findMany({
    where: { 
      active: true,
      userId: user.id
    },
    orderBy: { name: 'asc' }
  })

  // Get inventory transactions
  const inventoryTransactions = await prisma.inventoryTransaction.findMany({
    where: {
      userId: user.id
    },
    include: {
      cookieType: true
    }
  })

  // Calculate stats
  const totalRevenue = orders.reduce((sum, order) => {
    return sum + Number(order.totalAmount)
  }, 0)

  const totalBoxesSold = orders.reduce((sum, order) => {
    return sum + order.orderItems.reduce((itemSum, item) => itemSum + item.quantity, 0)
  }, 0)

  const amountOwed = orders
    .filter(order => !order.isPaid)
    .reduce((sum, order) => sum + Number(order.totalAmount), 0)

  const pendingDeliveries = orders.filter(order => !order.isDelivered).length
  const unpaidOrders = orders.filter(order => !order.isPaid).length

  // Calculate inventory levels
  const inventoryLevels = cookieTypes.map(cookieType => {
    const received = inventoryTransactions
      .filter(t => t.cookieTypeId === cookieType.id)
      .reduce((sum, t) => sum + t.quantity, 0)

    const sold = orders.reduce((sum, order) => {
      return sum + order.orderItems
        .filter(item => item.cookieTypeId === cookieType.id)
        .reduce((itemSum, item) => itemSum + item.quantity, 0)
    }, 0)

    return {
      cookieTypeName: cookieType.name,
      received,
      sold,
      available: received - sold
    }
  })

  const totalInventory = inventoryLevels.reduce((sum, level) => sum + level.available, 0)

  // Recent orders (last 5)
  const recentOrders = orders.slice(0, 5)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block font-semibold">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-800 mt-2">Overview of your cookie sales</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-green-600">${totalRevenue.toFixed(2)}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600 mb-1">Boxes Sold</p>
            <p className="text-3xl font-bold text-blue-600">{totalBoxesSold}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600 mb-1">Current Inventory</p>
            <p className="text-3xl font-bold text-purple-600">{totalInventory}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600 mb-1">Amount Owed</p>
            <p className="text-3xl font-bold text-orange-600">${amountOwed.toFixed(2)}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600 mb-1">Pending Deliveries</p>
            <p className="text-3xl font-bold text-red-600">{pendingDeliveries}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600 mb-1">Unpaid Orders</p>
            <p className="text-3xl font-bold text-yellow-600">{unpaidOrders}</p>
          </div>
        </div>

        {/* Inventory Breakdown */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Inventory by Cookie Type</h2>
          <div className="space-y-3">
            {inventoryLevels.map((level) => (
              <div key={level.cookieTypeName} className="flex justify-between items-center border-b pb-2">
                <span className="font-medium text-gray-900">{level.cookieTypeName}</span>
                <div className="flex gap-4 text-sm">
                  <span className="text-gray-600">Received: {level.received}</span>
                  <span className="text-gray-600">Sold: {level.sold}</span>
                  <span className={`font-semibold ${level.available > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Available: {level.available}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
            <Link href="/orders" className="text-blue-600 hover:text-blue-800 font-semibold text-sm">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="border-b pb-3 last:border-b-0">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900">{order.customer.name}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-700">
                      {order.orderItems.reduce((sum, item) => sum + item.quantity, 0)} boxes - ${Number(order.totalAmount).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {order.isPaid ? (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                        Paid
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                        Unpaid
                      </span>
                    )}
                    {order.isDelivered ? (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                        Delivered
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {recentOrders.length === 0 && (
            <p className="text-gray-600 text-center py-8">No orders yet. Create your first order!</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Link 
            href="/orders/new"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg text-center"
          >
            + Create Order
          </Link>
          <Link 
            href="/inventory"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg text-center"
          >
            Manage Inventory
          </Link>
          <Link 
            href="/deliveries"
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-lg text-center"
          >
            View Deliveries
          </Link>
        </div>
      </div>
    </div>
  )
}