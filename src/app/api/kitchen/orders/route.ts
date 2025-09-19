import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !['ADMIN', 'KITCHEN_STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const orders = await prisma.order.findMany({
      where: {
        status: status || { in: ['CONFIRMED', 'PREPARING', 'READY'] },
      },
      include: {
        user: {
          select: {
            name: true,
            phone: true
          }
        },
        items: {
          include: {
            product: true,
            toppings: {
              include: {
                topping: true
              }
            }
          }
        },
        address: true
      },
      orderBy: [
        { createdAt: 'asc' }
      ]
    })

    const kitchenQueue = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.user?.name || 'Unknown',
      customerPhone: order.user?.phone,
      items: order.items.map((item: any) => ({
        name: item.product.name,
        quantity: item.quantity,
        customizations: item.toppings.map((t: any) => t.topping.name),
        specialInstructions: item.specialInstructions
      })),
      total: parseFloat(order.totalAmount.toString()),
      orderTime: order.createdAt,
      estimatedPrepTime: 15, // Default prep time
      status: order.status,
      priority: order.totalAmount > 50 ? 'urgent' : 'normal',
      specialInstructions: order.specialInstructions
    }))

    return NextResponse.json({
      orders: kitchenQueue,
      summary: {
        total: orders.length,
        confirmed: orders.filter(o => o.status === 'CONFIRMED').length,
        preparing: orders.filter(o => o.status === 'PREPARING').length,
        ready: orders.filter(o => o.status === 'READY').length
      }
    })

  } catch (error) {
    console.error('Kitchen orders error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch kitchen orders',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 })
  }
}