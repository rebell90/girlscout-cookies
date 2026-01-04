import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { Decimal } from 'decimal.js'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      }
    })

    // Create default cookie types for the new user
    const cookieTypes = [
      {
        name: 'Thin Mints',
        price: new Decimal('6.00'),
        description: 'Crispy chocolate wafers dipped in a mint chocolate coating',
        active: true,
        isGlutenFree: false,
        isPeanutFree: false,
        isVegan: true,
        isNew: false,
      },
      {
        name: 'Samoas/Caramel deLites',
        price: new Decimal('6.00'),
        description: 'Crispy cookies topped with caramel, coconut, and chocolate stripes',
        active: true,
        isGlutenFree: false,
        isPeanutFree: false,
        isVegan: false,
        isNew: false,
      },
      {
        name: 'Tagalongs/Peanut Butter Patties',
        price: new Decimal('6.00'),
        description: 'Crispy cookies layered with peanut butter and covered with a chocolaty coating',
        active: true,
        isGlutenFree: false,
        isPeanutFree: false,
        isVegan: true,
        isNew: false,
      },
      {
        name: 'Do-si-dos/Peanut Butter Sandwich',
        price: new Decimal('6.00'),
        description: 'Crisp and crunchy oatmeal cookies with creamy peanut butter filling',
        active: true,
        isGlutenFree: false,
        isPeanutFree: false,
        isVegan: false,
        isNew: false,
      },
      {
        name: 'Trefoils/Shortbread',
        price: new Decimal('6.00'),
        description: 'Iconic shortbread cookies inspired by the original Girl Scout recipe',
        active: true,
        isGlutenFree: false,
        isPeanutFree: false,
        isVegan: false,
        isNew: false,
      },
      {
        name: 'Lemonades',
        price: new Decimal('6.00'),
        description: 'Savory slices of shortbread with a refreshingly tangy lemon-flavored icing',
        active: true,
        isGlutenFree: false,
        isPeanutFree: false,
        isVegan: true,
        isNew: false,
      },
      {
        name: 'Adventurefuls',
        price: new Decimal('6.00'),
        description: 'Indulgent brownie-inspired cookies with a caramel flavored creme and a hint of sea salt',
        active: true,
        isGlutenFree: false,
        isPeanutFree: false,
        isVegan: false,
        isNew: false,
      },
      {
        name: 'Exploremores (New)',
        price: new Decimal('6.00'),
        description: 'Rocky road ice cream-inspired cookies filled with flavors of chocolate, marshmallow, and toasted almond creme',
        active: true,
        isGlutenFree: false,
        isPeanutFree: false,
        isVegan: false,
        isNew: true,
      },
      {
        name: 'Caramel Chocolate Chip',
        price: new Decimal('7.00'),
        description: 'Caramel, semi-sweet chocolate chips, and a hint of sea salt baked into a delicious cookie',
        active: true,
        isGlutenFree: true,
        isPeanutFree: true,
        isVegan: true,
        isNew: false,
      },
    ]

    for (const cookie of cookieTypes) {
      await prisma.cookieType.create({
        data: {
          ...cookie,
          userId: user.id
        }
      })
    }

    return NextResponse.json({ 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name 
      } 
    })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}