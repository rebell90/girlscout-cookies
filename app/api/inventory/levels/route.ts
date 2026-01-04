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
    
    // Get all cookie types for this user
    const cookieTypes = await prisma.cookieType.findMany({
      where: { 
        active: true,
        userId: user.id
      },
      orderBy: { name: 'asc' }
    })

    // Get all inventory transactions for this user
    const inventoryTransactions = await prisma.inventoryTransaction.findMany({
      where: {
        userId: user.id
      },
      include: {
        cookieType: true
      }
    })

    // Get all order items for this user
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          userId: user.id
        }
      },
      include: {
        cookieType: true
      }
    })

    // Calculate levels for each cookie type
    const levels = cookieTypes.map(cookieType => {
      // Sum up all inventory received
      const received = inventoryTransactions
        .filter(t => t.cookieTypeId === cookieType.id)
        .reduce((sum, t) => sum + t.quantity, 0)

      // Sum up all sold
      const sold = orderItems
        .filter(item => item.cookieTypeId === cookieType.id)
        .reduce((sum, item) => sum + item.quantity, 0)

      return {
        cookieTypeId: cookieType.id,
        cookieTypeName: cookieType.name,
        received,
        sold,
        available: received - sold
      }
    })

    return NextResponse.json(levels)
  } catch (error) {
    console.error('Error calculating inventory levels:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}