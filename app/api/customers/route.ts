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
    
    const customers = await prisma.customer.findMany({
      where: {
        userId: user.id
      },
      include: {
        orders: {
          include: {
            orderItems: true
          }
        },
        routeLocation: true
      },
      orderBy: {
        neighborhood: 'asc'
      }
    })
    
    // Convert Decimals to numbers in nested orders
    const customersWithNumbers = customers.map(customer => ({
      ...customer,
      orders: customer.orders.map(order => ({
        ...order,
        totalAmount: Number(order.totalAmount),
        amountPaid: Number(order.amountPaid),
        orderItems: order.orderItems.map(item => ({
          ...item,
          pricePerBox: Number(item.pricePerBox),
          subtotal: Number(item.subtotal)
        }))
      }))
    }))
    
    return NextResponse.json(customersWithNumbers)
  } catch (error) {
    console.error('Error fetching customers:', error)
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
    
    const customer = await prisma.customer.create({
      data: {
        userId: user.id,
        name: body.name,
        phone: body.phone || null,
        email: body.email || null,
        address: body.address || null,
        neighborhood: body.neighborhood || null,
        notes: body.notes || null,
      },
    })

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}