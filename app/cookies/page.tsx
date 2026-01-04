import prisma from '@/lib/prisma'
import Link from 'next/link'

async function getCookies() {
  const cookies = await prisma.cookieType.findMany({
    where: { active: true },
    orderBy: { name: 'asc' }
  })
  
  return cookies.map(cookie => ({
    ...cookie,
    price: Number(cookie.price)
  }))
}

export default async function CookiesPage() {
  const cookies = await getCookies()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block font-semibold">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Cookie Varieties</h1>
          <p className="text-gray-800 mt-2">Our available Girl Scout cookies</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cookies.map((cookie) => (
            <div key={cookie.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold text-gray-900">{cookie.name}</h3>
                <span className="text-xl font-bold text-green-600">${cookie.price.toFixed(2)}</span>
              </div>
              
              {cookie.description && (
                <p className="text-gray-700 mb-4 text-sm">{cookie.description}</p>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {cookie.isNew && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
                    ✨ NEW
                  </span>
                )}
                {cookie.isGlutenFree && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                    🌾 Gluten-Free
                  </span>
                )}
                {cookie.isPeanutFree && (
                  <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full">
                    🥜 Peanut-Free
                  </span>
                )}
                {cookie.isVegan && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                    🌱 Vegan
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {cookies.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-700 text-lg">No cookies available yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}