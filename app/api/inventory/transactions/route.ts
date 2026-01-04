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
    
    const transactions = await prisma.inventoryTransaction.findMany({
      where: {
        userId: user.id
      },
      include: {
        cookieType: true
      },
      orderBy: {
        date: 'desc'
      }
    })
    
    const transactionsWithNumbers = transactions.map(t => ({
      ...t,
      cookieType: {
        ...t.cookieType,
        price: Number(t.cookieType.price)
      }
    }))
    
    return NextResponse.json(transactionsWithNumbers)
  } catch (error) {
    console.error('Error fetching inventory transactions:', error)
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
    
    const transaction = await prisma.inventoryTransaction.create({
      data: {
        userId: user.id,
        cookieTypeId: body.cookieTypeId,
        quantity: body.quantity,
        type: 'RECEIVED',
        notes: body.notes || null,
      },
      include: {
        cookieType: true
      }
    })

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Error creating inventory transaction:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}