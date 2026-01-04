import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get unique neighborhoods from both customers and routes for this user
    const customers = await prisma.customer.findMany({
      where: { 
        userId: user.id,
        neighborhood: { not: null } 
      },
      select: { neighborhood: true }
    })
    
    const routes = await prisma.routeLocation.findMany({
      where: { 
        userId: user.id,
        neighborhood: { not: null } 
      },
      select: { neighborhood: true }
    })

    // Combine and deduplicate
    const allNeighborhoods = [
      ...customers.map(c => c.neighborhood),
      ...routes.map(r => r.neighborhood)
    ].filter(Boolean) as string[]

    const uniqueNeighborhoods = Array.from(new Set(allNeighborhoods)).sort()

    return NextResponse.json(uniqueNeighborhoods)
  } catch (error) {
    console.error('Error fetching neighborhoods:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}