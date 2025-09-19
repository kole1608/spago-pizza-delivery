import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'DELIVERY_DRIVER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'assigned'

    // Get orders assigned to this driver
    const orders = await prisma.order.findMany({
      where: {
        driverId: session.user.id,
        status: status === 'assigned' ? 'READY' : 
               status === 'active' ? 'OUT_FOR_DELIVERY' : 
               { in: ['READY', 'OUT_FOR_DELIVERY'] }
      },
      include: {
        user: {
          select: {
            name: true,
            phone: true
          }
        },
        address: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    const deliveryOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.user?.name || 'Unknown',
      customerPhone: order.user?.phone || '',
      address: `${order.address?.street}, ${order.address?.city}`,
      items: order.items.map((item: any) => ({
        name: item.product.name,
        quantity: item.quantity
      })),
      total: parseFloat(order.totalAmount.toString()),
      status: order.status,
      estimatedDelivery: order.estimatedDelivery,
      specialInstructions: order.specialInstructions
    }))

    return NextResponse.json({
      orders: deliveryOrders,
      summary: {
        total: orders.length,
        ready: orders.filter(o => o.status === 'READY').length,
        outForDelivery: orders.filter(o => o.status === 'OUT_FOR_DELIVERY').length
      }
    })

  } catch (error) {
    console.error('Driver orders error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch driver orders',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 })
  }
}