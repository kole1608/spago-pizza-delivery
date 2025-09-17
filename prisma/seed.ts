import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create store settings
  await prisma.storeSettings.upsert({
    where: { id: 'store_settings' },
    update: {},
    create: {
      id: 'store_settings',
      storeName: 'Spago Pizza',
      phoneNumber: '+381 11 123 4567',
      email: 'info@spagopizza.com',
      address: 'Knez Mihailova 10, Belgrade, Serbia',
      deliveryRadius: 15.0,
      minOrderAmount: 10.0,
      deliveryFee: 3.0,
      freeDeliveryThreshold: 25.0,
      taxRate: 0.20,
      isOpen: true,
      estimatedDeliveryTime: 30,
    },
  })

  // Create demo users with hashed passwords
  const hashedPassword = await bcrypt.hash('password123', 12)

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@spago.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@spago.com',
      password: hashedPassword,
      role: 'ADMIN',
      phone: '+381 64 111 1111',
      isActive: true,
    },
  })

  const kitchenUser = await prisma.user.upsert({
    where: { email: 'kitchen@spago.com' },
    update: {},
    create: {
      name: 'Kitchen Staff',
      email: 'kitchen@spago.com',
      password: hashedPassword,
      role: 'KITCHEN_STAFF',
      phone: '+381 64 222 2222',
      isActive: true,
    },
  })

  const driverUser = await prisma.user.upsert({
    where: { email: 'driver@spago.com' },
    update: {},
    create: {
      name: 'Delivery Driver',
      email: 'driver@spago.com',
      password: hashedPassword,
      role: 'DELIVERY_DRIVER',
      phone: '+381 64 333 3333',
      isActive: true,
    },
  })

  const customerUser = await prisma.user.upsert({
    where: { email: 'customer@spago.com' },
    update: {},
    create: {
      name: 'John Customer',
      email: 'customer@spago.com',
      password: hashedPassword,
      role: 'CUSTOMER',
      phone: '+381 64 444 4444',
      isActive: true,
    },
  })

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
  const margheritaPizza = await prisma.product.upsert({
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

  const pepperoniPizza = await prisma.product.upsert({
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

  // Create product sizes
  await prisma.productSize.createMany({
    data: [
      { productId: margheritaPizza.id, name: 'Small', size: 'SMALL', price: 0, isDefault: true },
      { productId: margheritaPizza.id, name: 'Medium', size: 'MEDIUM', price: 4 },
      { productId: margheritaPizza.id, name: 'Large', size: 'LARGE', price: 8 },
      { productId: pepperoniPizza.id, name: 'Small', size: 'SMALL', price: 0, isDefault: true },
      { productId: pepperoniPizza.id, name: 'Medium', size: 'MEDIUM', price: 4 },
      { productId: pepperoniPizza.id, name: 'Large', size: 'LARGE', price: 8 },
    ],
    skipDuplicates: true,
  })

  // Create toppings
  const extraCheese = await prisma.topping.upsert({
    where: { name: 'Extra Cheese' },
    update: {},
    create: {
      name: 'Extra Cheese',
      price: 2.00,
      isVegetarian: true,
    },
  })

  const mushrooms = await prisma.topping.upsert({
    where: { name: 'Mushrooms' },
    update: {},
    create: {
      name: 'Mushrooms',
      price: 1.50,
      isVegetarian: true,
      isVegan: true,
    },
  })

  // Create inventory items
  await prisma.inventoryItem.createMany({
    data: [
      {
        name: 'Pizza Dough',
        category: 'Ingredients',
        currentStock: 25,
        minimumStock: 10,
        unit: 'kg',
        costPerUnit: 2.50,
        supplier: 'Local Bakery',
        lastRestocked: new Date(),
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Mozzarella Cheese',
        category: 'Ingredients',
        currentStock: 8,
        minimumStock: 15,
        unit: 'kg',
        costPerUnit: 8.00,
        supplier: 'Dairy Farm Co.',
        lastRestocked: new Date(),
        expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Tomato Sauce',
        category: 'Ingredients',
        currentStock: 30,
        minimumStock: 20,
        unit: 'liters',
        costPerUnit: 3.20,
        supplier: 'Fresh Foods Ltd',
        lastRestocked: new Date(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Pepperoni',
        category: 'Toppings',
        currentStock: 0,
        minimumStock: 5,
        unit: 'kg',
        costPerUnit: 12.00,
        supplier: 'Meat Products Inc',
        lastRestocked: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
    ],
    skipDuplicates: true,
  })

  // Create customer address
  await prisma.address.create({
    data: {
      userId: customerUser.id,
      name: 'Home',
      street: '123 Main Street, Apt 4B',
      city: 'Belgrade',
      zipCode: '11000',
      country: 'Serbia',
      isDefault: true,
    },
  })

  // Create sample order
  const sampleOrder = await prisma.order.create({
    data: {
      orderNumber: 'SPG' + Date.now(),
      userId: customerUser.id,
      addressId: (await prisma.address.findFirst({ where: { userId: customerUser.id } }))!.id,
      status: 'DELIVERED',
      paymentStatus: 'PAID',
      paymentMethod: 'CARD',
      subtotal: 15.00,
      taxAmount: 3.00,
      deliveryFee: 0.00,
      totalAmount: 18.00,
      estimatedDelivery: new Date(),
      actualDelivery: new Date(),
      deliveredAt: new Date(),
    },
  })

  // Create order items
  await prisma.orderItem.create({
    data: {
      orderId: sampleOrder.id,
      productId: margheritaPizza.id,
      quantity: 1,
      unitPrice: 15.00,
      totalPrice: 15.00,
    },
  })

  // Create order tracking
  await prisma.orderTracking.createMany({
    data: [
      {
        orderId: sampleOrder.id,
        status: 'CONFIRMED',
        message: 'Order confirmed and sent to kitchen',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
      },
      {
        orderId: sampleOrder.id,
        status: 'PREPARING',
        message: 'Kitchen is preparing your order',
        timestamp: new Date(Date.now() - 20 * 60 * 1000),
      },
      {
        orderId: sampleOrder.id,
        status: 'READY',
        message: 'Order is ready for delivery',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
      },
      {
        orderId: sampleOrder.id,
        status: 'OUT_FOR_DELIVERY',
        message: 'Driver is on the way',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
      },
      {
        orderId: sampleOrder.id,
        status: 'DELIVERED',
        message: 'Order has been delivered',
        timestamp: new Date(),
      },
    ],
  })

  // Create loyalty data
  await prisma.userLoyalty.create({
    data: {
      userId: customerUser.id,
      points: 150,
      tier: 'silver',
      totalSpent: 85.50,
      totalOrders: 5,
    },
  })

  // Create loyalty transactions
  await prisma.loyaltyTransaction.createMany({
    data: [
      {
        userId: customerUser.id,
        points: 18,
        type: 'EARNED',
        reason: `Points earned from order ${sampleOrder.orderNumber}`,
        referenceId: sampleOrder.id,
      },
    ],
  })

  // Create coupons
  await prisma.coupon.createMany({
    data: [
      {
        code: 'WELCOME20',
        type: 'PERCENTAGE',
        value: 20,
        minOrderAmount: 15,
        maxUses: 100,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        code: 'FREEDEL',
        type: 'FREE_DELIVERY',
        value: 0,
        minOrderAmount: 10,
        maxUses: 500,
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
    ],
    skipDuplicates: true,
  })

  console.log('✅ Database seeded successfully!')
  console.log('📧 Demo accounts created:')
  console.log('   Admin: admin@spago.com / password123')
  console.log('   Kitchen: kitchen@spago.com / password123')
  console.log('   Driver: driver@spago.com / password123')
  console.log('   Customer: customer@spago.com / password123')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })