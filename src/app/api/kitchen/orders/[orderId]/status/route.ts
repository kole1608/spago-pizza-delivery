import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getAuthSession()
    
    if (!session?.user || !['ADMIN', 'KITCHEN_STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = params
    const body = await request.json()
    const { status, message } = body

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    // Update order status
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { 
        status,
        ...(status === 'READY' && { estimatedDelivery: new Date(Date.now() + 25 * 60 * 1000) })
      }
    })

    // Create tracking entry
    await prisma.orderTracking.create({
      data: {
        orderId,
        status,
        message: message || getStatusMessage(status),
        timestamp: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      order,
      message: `Order status updated to ${status}`
    })

  } catch (error) {
    console.error('Update order status error:', error)
    return NextResponse.json({ 
      error: 'Failed to update order status',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 })
  }
}

function getStatusMessage(status: string): string {
  const messages = {
    CONFIRMED: 'Order confirmed and sent to kitchen',
    PREPARING: 'Kitchen is preparing your order',
    READY: 'Order is ready for pickup/delivery',
    OUT_FOR_DELIVERY: 'Driver is on the way',
    DELIVERED: 'Order has been delivered'
  }
  return messages[status as keyof typeof messages] || `Order status: ${status}`
}