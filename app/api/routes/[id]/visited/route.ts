import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const { id } = await params
    const body = await request.json()
    
    // Verify route belongs to user
    const existing = await prisma.routeLocation.findFirst({
      where: { id, userId: user.id }
    })
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Route not found' },
        { status: 404 }
      )
    }
    
    const route = await prisma.routeLocation.update({
      where: { id },
      data: {
        visited: body.visited,
        visitedAt: body.visited ? new Date() : null,
      },
    })

    return NextResponse.json(route)
  } catch (error) {
    console.error('Error updating route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}