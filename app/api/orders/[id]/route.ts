import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'
import { Decimal } from 'decimal.js'

interface OrderItem {
  cookieTypeId: string
  quantity: number
}

export async function GET(
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

    const order = await prisma.order.findFirst({
      where: {
        id,
        userId: user.id
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

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Convert Decimals to numbers
    const orderWithNumbers = {
      ...order,
      totalAmount: Number(order.totalAmount),
      donation: Number(order.donation),
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
    }

    return NextResponse.json(orderWithNumbers)
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    // Verify order belongs to user
    const existing = await prisma.order.findFirst({
      where: { id, userId: user.id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

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

    // Add donation to total
    const donation = new Decimal(body.donation || 0)
    totalAmount = totalAmount.add(donation)

    // Update order with items (delete existing items and recreate)
    const order = await prisma.$transaction(async (tx) => {
      // Delete existing order items
      await tx.orderItem.deleteMany({
        where: { orderId: id }
      })

      // Update order and create new items
      return await tx.order.update({
        where: { id },
        data: {
          customerId: body.customerId,
          totalAmount,
          donation,
          source: body.source || 'DOOR_TO_DOOR',
          paymentMethod: body.paymentMethod || null,
          notes: body.notes || null,
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
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
    
    // Verify order belongs to user
    const existing = await prisma.order.findFirst({
      where: { id, userId: user.id }
    })
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }
    
    await prisma.order.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}