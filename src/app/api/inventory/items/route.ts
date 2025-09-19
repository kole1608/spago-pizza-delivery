import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')

    const items = await prisma.inventoryItem.findMany({
      where: {
        ...(category && { category }),
        isActive: true
      },
      include: {
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      },
      orderBy: { name: 'asc' }
    })

    // Filter by stock status if requested
    let filteredItems = items
    if (status === 'low_stock') {
      filteredItems = items.filter(item => item.currentStock <= item.minimumStock && item.currentStock > 0)
    } else if (status === 'out_of_stock') {
      filteredItems = items.filter(item => item.currentStock === 0)
    }

    return NextResponse.json({
      items: filteredItems,
      summary: {
        total: items.length,
        lowStock: items.filter(item => item.currentStock <= item.minimumStock && item.currentStock > 0).length,
        outOfStock: items.filter(item => item.currentStock === 0).length,
        totalValue: items.reduce((sum, item) => sum + (item.currentStock * item.costPerUnit), 0)
      }
    })

  } catch (error) {
    console.error('Inventory items error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch inventory items',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, category, minimumStock, unit, costPerUnit, supplier } = body

    const item = await prisma.inventoryItem.create({
      data: {
        name,
        category,
        currentStock: 0,
        minimumStock,
        unit,
        costPerUnit,
        supplier
      }
    })

    return NextResponse.json({ item })

  } catch (error) {
    console.error('Create inventory item error:', error)
    return NextResponse.json({ 
      error: 'Failed to create inventory item',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 })
  }
}