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
    
    const cookieTypes = await prisma.cookieType.findMany({
      where: { 
        active: true,
        userId: user.id
      },
      orderBy: { name: 'asc' }
    })
    
    const cookieTypesWithNumbers = cookieTypes.map(ct => ({
      ...ct,
      price: Number(ct.price)
    }))
    
    return NextResponse.json(cookieTypesWithNumbers)
  } catch (error) {
    console.error('Error fetching cookie types:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}