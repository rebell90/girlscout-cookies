import prisma from '@/lib/prisma'
import Link from 'next/link'

async function getDashboardData() {
  // Get all orders
  const orders = await prisma.order.findMany({
    include: {
      orderItems: {
        include: {
          cookieType: true
        }
      }
    }
  })

  // Get inventory transactions
  const inventoryTransactions = await prisma.inventoryTransaction.findMany({
    include: {
      cookieType: true
    }
  })

  // Calculate inventory by cookie type
  const inventoryByType = inventoryTransactions.reduce((acc, transaction) => {
    const cookieName = transaction.cookieType.name
    if (!acc[cookieName]) {
      acc[cookieName] = 0
    }
    acc[cookieName] += transaction.quantity
    return acc
  }, {} as Record<string, number>)

  // Calculate total boxes sold
  const totalBoxesSold = orders.reduce((sum, order) => {
    return sum + order.orderItems.reduce((itemSum, item) => itemSum + item.quantity, 0)
  }, 0)

  // Calculate total revenue
  const totalRevenue = orders.reduce((sum, order) => {
    return sum + Number(order.totalAmount)
  }, 0)

  // Calculate amount owed
  const amountOwed = orders.reduce((sum, order) => {
    return sum + (Number(order.totalAmount) - Number(order.amountPaid))
  }, 0)

  // Get pending deliveries
  const pendingDeliveries = orders.filter(order => !order.isDelivered).length

  // Get unpaid orders
  const unpaidOrders = orders.filter(order => !order.isPaid).length

  // Calculate total inventory
  const totalInventory = Object.values(inventoryByType).reduce((sum, qty) => sum + qty, 0)

  return {
    totalRevenue,
    totalBoxesSold,
    amountOwed,
    pendingDeliveries,
    unpaidOrders,
    totalInventory,
    inventoryByType,
    recentOrders: orders.slice(-5).reverse() // Last 5 orders
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Sales Dashboard</h1>
          <p className="text-gray-600 mt-2">Overview of your cookie sales</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Revenue */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  ${data.totalRevenue.toFixed(2)}
                </p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>

          {/* Total Boxes Sold */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Boxes Sold</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {data.totalBoxesSold}
                </p>
              </div>
              <div className="text-4xl">📦</div>
            </div>
          </div>

          {/* Current Inventory */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Inventory</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {data.totalInventory}
                </p>
              </div>
              <div className="text-4xl">🍪</div>
            </div>
          </div>

          {/* Amount Owed */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Amount Owed</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  ${data.amountOwed.toFixed(2)}
                </p>
              </div>
              <div className="text-4xl">💵</div>
            </div>
          </div>

          {/* Pending Deliveries */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Deliveries</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {data.pendingDeliveries}
                </p>
              </div>
              <div className="text-4xl">🚚</div>
            </div>
          </div>

          {/* Unpaid Orders */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unpaid Orders</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">
                  {data.unpaidOrders}
                </p>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
          </div>
        </div>

        {/* Inventory Breakdown */}
        {data.totalInventory > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Inventory by Cookie Type</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Object.entries(data.inventoryByType).map(([name, quantity]) => (
                <div key={name} className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="font-semibold text-gray-900">{name}</p>
                  <p className="text-2xl font-bold text-blue-600 mt-2">{quantity}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Orders */}
        {data.recentOrders.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Orders</h2>
            <div className="space-y-4">
              {data.recentOrders.map((order) => (
                <div key={order.id} className="border-b pb-4 last:border-b-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900">{order.customer.name}</p>
                      <p className="text-sm text-gray-600">
                        {order.orderItems.reduce((sum, item) => sum + item.quantity, 0)} boxes
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">${Number(order.totalAmount).toFixed(2)}</p>
                      <div className="flex gap-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded ${order.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {order.isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${order.isDelivered ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                          {order.isDelivered ? 'Delivered' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/orders/new" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg text-center">
            + New Order
          </Link>
          <Link href="/inventory" className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg text-center">
            Manage Inventory
          </Link>
          <Link href="/deliveries" className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg text-center">
            View Deliveries
          </Link>
        </div>
      </div>
    </div>
  )
}