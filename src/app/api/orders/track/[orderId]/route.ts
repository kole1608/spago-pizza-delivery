import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getAuthSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = params

    // Get order with tracking information
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        ...(session.user.role === 'CUSTOMER' && { userId: session.user.id })
      },
      include: {
        tracking: {
          orderBy: { timestamp: 'asc' }
        },
        driver: {
          select: {
            id: true,
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
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Mock driver location for demo
    const driverLocation = order.driverId ? {
      lat: 44.8176 + (Math.random() - 0.5) * 0.01,
      lng: 20.4633 + (Math.random() - 0.5) * 0.01,
      lastUpdated: new Date().toISOString()
    } : null

    const trackingData = {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        createdAt: order.createdAt,
        estimatedDelivery: order.estimatedDelivery,
        actualDelivery: order.actualDelivery
      },
      tracking: order.tracking,
      driver: order.driver,
      driverLocation,
      address: order.address,
      items: order.items.map((item: any) => ({
        name: item.product.name,
        quantity: item.quantity
      }))
    }

    return NextResponse.json({
      tracking: trackingData,
      metadata: {
        lastUpdated: new Date().toISOString(),
        refreshInterval: 30000
      }
    })

  } catch (error) {
    console.error('Order tracking error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch order tracking',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 })
  }
}