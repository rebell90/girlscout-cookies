import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Decimal } from 'decimal.js'
import { getCurrentUser } from '@/lib/auth-helpers'

interface OrderItem {
  cookieTypeId: string
  quantity: number
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
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
    
    // Convert Decimals to numbers
    const ordersWithNumbers = orders.map(order => ({
      ...order,
      totalAmount: Number(order.totalAmount),
      amountPaid: Number(order.amountPaid),
      orderItems: order.orderItems.map(item => ({
        ...item,
        pricePerBox: Number(item.pricePerBox),
        subtotal: Number(item.subtotal),
        cookieType: {
          ...item.cookieType,
          price: Number(item.cookieType.price)
        }
      }))
    }))
    
    return NextResponse.json(ordersWithNumbers)
  } catch (error) {
    console.error('Error fetching orders:', error)
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
    
    // Get cookie types to calculate prices
    const cookieTypes = await prisma.cookieType.findMany({
      where: { userId: user.id }
    })
    
    // Calculate total
    let totalAmount = new Decimal(0)
    const orderItemsData = body.items.map((item: OrderItem) => {
      const cookieType = cookieTypes.find(ct => ct.id === item.cookieTypeId)
      if (!cookieType) throw new Error('Cookie type not found')
      
      const pricePerBox = new Decimal(cookieType.price)
      const subtotal = pricePerBox.mul(item.quantity)
      totalAmount = totalAmount.add(subtotal)
      
      return {
        cookieTypeId: item.cookieTypeId,
        quantity: item.quantity,
        pricePerBox,
        subtotal
      }
    })

    // Create order with items
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        customerId: body.customerId,
        totalAmount,
        source: body.source || 'DOOR_TO_DOOR',
        orderItems: {
          create: orderItemsData
        }
      },
      include: {
        customer: true,
        orderItems: {
          include: {
            cookieType: true
          }
        }
      }
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}