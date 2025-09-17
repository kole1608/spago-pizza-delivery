import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getAuthSession()
    
    if (!session?.user || session.user.role !== 'DELIVERY_DRIVER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = params
    const body = await request.json()
    const { notes, proofPhoto } = body

    // Verify order belongs to this driver
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        driverId: session.user.id,
        status: 'OUT_FOR_DELIVERY'
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found or not assigned to you' }, { status: 404 })
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date(),
        actualDelivery: new Date()
      }
    })

    // Create tracking entry
    await prisma.orderTracking.create({
      data: {
        orderId,
        status: 'DELIVERED',
        message: 'Order has been delivered successfully',
        timestamp: new Date(),
        metadata: JSON.stringify({
          deliveredBy: session.user.id,
          notes,
          proofPhoto
        })
      }
    })

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: 'Order marked as delivered'
    })

  } catch (error) {
    console.error('Complete delivery error:', error)
    return NextResponse.json({ 
      error: 'Failed to complete delivery',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 })
  }
}