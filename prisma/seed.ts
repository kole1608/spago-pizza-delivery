import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create categories
  const pizzaCategory = await prisma.category.upsert({
    where: { slug: 'pizza' },
    update: {},
    create: {
      name: 'Pizza',
      slug: 'pizza',
      description: 'Delicious Italian pizzas made with fresh ingredients',
      sortOrder: 1,
    },
  })

  const pastaCategory = await prisma.category.upsert({
    where: { slug: 'pasta' },
    update: {},
    create: {
      name: 'Pasta',
      slug: 'pasta',
      description: 'Authentic Italian pasta dishes',
      sortOrder: 2,
    },
  })

  const saladCategory = await prisma.category.upsert({
    where: { slug: 'salads' },
    update: {},
    create: {
      name: 'Salads',
      slug: 'salads',
      description: 'Fresh and healthy salads',
      sortOrder: 3,
    },
  })

  const beverageCategory = await prisma.category.upsert({
    where: { slug: 'beverages' },
    update: {},
    create: {
      name: 'Beverages',
      slug: 'beverages',
      description: 'Refreshing drinks',
      sortOrder: 4,
    },
  })

  // Create products
  await prisma.product.upsert({
    where: { slug: 'margherita' },
    update: {},
    create: {
      name: 'Margherita',
      slug: 'margherita',
      description: 'Classic pizza with tomato sauce, mozzarella, and fresh basil',
      basePrice: 15.00,
      categoryId: pizzaCategory.id,
      isVegetarian: true,
      prepTime: 15,
      calories: 280,
    },
  })

  await prisma.product.upsert({
    where: { slug: 'pepperoni' },
    update: {},
    create: {
      name: 'Pepperoni',
      slug: 'pepperoni',
      description: 'Classic pepperoni pizza with mozzarella and tomato sauce',
      basePrice: 18.00,
      categoryId: pizzaCategory.id,
      prepTime: 15,
      calories: 320,
    },
  })

  await prisma.product.upsert({
    where: { slug: 'quattro-stagioni' },
    update: {},
    create: {
      name: 'Quattro Stagioni',
      slug: 'quattro-stagioni',
      description: 'Four seasons pizza with ham, mushrooms, artichokes, and olives',
      basePrice: 22.00,
      categoryId: pizzaCategory.id,
      prepTime: 18,
      calories: 340,
    },
  })

  await prisma.product.upsert({
    where: { slug: 'spaghetti-carbonara' },
    update: {},
    create: {
      name: 'Spaghetti Carbonara',
      slug: 'spaghetti-carbonara',
      description: 'Classic Italian pasta with eggs, pancetta, and parmesan',
      basePrice: 16.00,
      categoryId: pastaCategory.id,
      prepTime: 12,
      calories: 420,
    },
  })

  await prisma.product.upsert({
    where: { slug: 'caesar-salad' },
    update: {},
    create: {
      name: 'Caesar Salad',
      slug: 'caesar-salad',
      description: 'Fresh romaine lettuce with parmesan, croutons, and caesar dressing',
      basePrice: 12.00,
      categoryId: saladCategory.id,
      isVegetarian: true,
      prepTime: 5,
      calories: 180,
    },
  })

  await prisma.product.upsert({
    where: { slug: 'coca-cola' },
    update: {},
    create: {
      name: 'Coca Cola',
      slug: 'coca-cola',
      description: 'Classic Coca Cola 500ml bottle',
      basePrice: 2.50,
      categoryId: beverageCategory.id,
      isVegetarian: true,
      isVegan: true,
      prepTime: 1,
      calories: 210,
    },
  })

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 