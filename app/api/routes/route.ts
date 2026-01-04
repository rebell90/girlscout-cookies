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
    
    const routes = await prisma.routeLocation.findMany({
      where: {
        userId: user.id
      },
      include: {
        customer: true
      },
      orderBy: {
        neighborhood: 'asc'
      }
    })
    return NextResponse.json(routes)
  } catch (error) {
    console.error('Error fetching routes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    
    const route = await prisma.routeLocation.create({
      data: {
        userId: user.id,
        address: body.address,
        neighborhood: body.neighborhood || null,
        status: body.status || 'NOT_VISITED',
        notes: body.notes || null,
        customerId: body.customerId || null,
      },
    })

    return NextResponse.json(route)
  } catch (error) {
    console.error('Error creating route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}