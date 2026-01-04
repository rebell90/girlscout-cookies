import { PrismaClient } from '@prisma/client'
import { Decimal } from 'decimal.js'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Get all existing users
  const users = await prisma.user.findMany()

  if (users.length === 0) {
    console.log('⚠️  No users found. Create an account via signup first, then run the seed.')
    return
  }

  // Your Girl Scout cookie types
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

  // Add cookies for each user
  for (const user of users) {
    console.log(`\n✓ Adding cookies for user: ${user.email}`)
    
    for (const cookie of cookieTypes) {
      await prisma.cookieType.upsert({
        where: { 
          userId_name: {
            userId: user.id,
            name: cookie.name
          }
        },
        update: cookie,
        create: {
          ...cookie,
          userId: user.id
        },
      })
      console.log(`  ✓ ${cookie.name}`)
    }
  }

  console.log('\n✅ Seeding complete!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })