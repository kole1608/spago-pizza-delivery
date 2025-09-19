import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { customerId, addressId, items, paymentMethod, notes } = body

    if (!customerId || !addressId || !items || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Calculate totals
    let subtotal = 0
    const orderItems = []

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      })

      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 404 })
      }

      const itemPrice = parseFloat(product.basePrice.toString()) + 
                      (item.customizations?.reduce((sum: number, c: any) => sum + c.price, 0) || 0)
      const totalItemPrice = itemPrice * item.quantity
      subtotal += totalItemPrice

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: itemPrice,
        totalPrice: totalItemPrice,
        specialInstructions: item.notes
      })
    }

    // Get store settings
    const storeSettings = await prisma.storeSettings.findUnique({
      where: { id: 'store_settings' }
    })

    const deliveryFee = subtotal >= (storeSettings?.freeDeliveryThreshold || 25) ? 0 : (storeSettings?.deliveryFee || 3)
    const taxAmount = subtotal * (storeSettings?.taxRate || 0.2)
    const totalAmount = subtotal + deliveryFee + taxAmount

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber: `SPG${Date.now()}`,
        userId: customerId,
        addressId,
        paymentMethod,
        status: 'CONFIRMED',
        paymentStatus: paymentMethod === 'CASH' ? 'PENDING' : 'PAID',
        subtotal,
        taxAmount,
        deliveryFee,
        totalAmount,
        specialInstructions: notes,
        estimatedDelivery: new Date(Date.now() + 30 * 60 * 1000),
        items: {
          create: orderItems
        },
        tracking: {
          create: {
            status: 'CONFIRMED',
            message: 'Order confirmed via call center',
            timestamp: new Date()
          }
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: true,
        address: true
      }
    })

    return NextResponse.json({
      success: true,
      order,
      message: 'Order created successfully'
    })

  } catch (error) {
    console.error('Create call center order error:', error)
    return NextResponse.json({ 
      error: 'Failed to create order',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 })
  }
}