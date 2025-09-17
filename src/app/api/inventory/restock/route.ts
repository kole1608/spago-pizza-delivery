import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession()
    
    if (!session?.user || !['ADMIN', 'KITCHEN_STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { itemId, quantity, reason = 'Manual restock' } = body

    if (!itemId || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    // Update inventory item
    const item = await prisma.inventoryItem.update({
      where: { id: itemId },
      data: {
        currentStock: { increment: quantity },
        lastRestocked: new Date()
      }
    })

    // Create stock movement record
    await prisma.stockMovement.create({
      data: {
        inventoryItemId: itemId,
        type: 'IN',
        quantity,
        reason,
        performedBy: session.user.id
      }
    })

    return NextResponse.json({
      success: true,
      item,
      message: `Successfully restocked ${quantity} ${item.unit} of ${item.name}`
    })

  } catch (error) {
    console.error('Restock error:', error)
    return NextResponse.json({ 
      error: 'Failed to restock item',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 })
  }
}