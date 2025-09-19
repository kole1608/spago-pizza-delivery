import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { subDays } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month'
    const storeId = searchParams.get('storeId') || 'all'

    const endDate = new Date()
    const startDate = period === 'year' ? subDays(endDate, 365) : 
                    period === 'month' ? subDays(endDate, 30) : 
                    subDays(endDate, 7)

    // Get inventory items
    const inventoryItems = await prisma.inventoryItem.findMany({
      include: {
        stockMovements: {
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }
      }
    })

    const totalItems = inventoryItems.length
    const lowStockItems = inventoryItems.filter(item => 
      item.currentStock <= item.minimumStock && item.currentStock > 0
    ).length
    const outOfStockItems = inventoryItems.filter(item => 
      item.currentStock === 0
    ).length

    const totalValue = inventoryItems.reduce((sum, item) => 
      sum + (item.currentStock * item.costPerUnit), 0
    )

    // Top selling ingredients
    const topSellingIngredients = inventoryItems.map(item => {
      const usage = item.stockMovements
        .filter(movement => movement.type === 'OUT')
        .reduce((sum, movement) => sum + movement.quantity, 0)

      return {
        id: item.id,
        name: item.name,
        usage,
        revenue: usage * item.costPerUnit * 2.5,
        efficiency: item.currentStock > 0 ? usage / item.currentStock : 0
      }
    }).sort((a, b) => b.usage - a.usage).slice(0, 10)

    // Stock levels
    const stockLevels = inventoryItems.map(item => {
      const usage = item.stockMovements
        .filter(movement => movement.type === 'OUT')
        .reduce((sum, movement) => sum + movement.quantity, 0)

      const dailyUsage = usage / Math.max(1, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      const daysRemaining = dailyUsage > 0 ? Math.round(item.currentStock / dailyUsage) : 999

      let status: 'healthy' | 'low' | 'critical' | 'overstock' = 'healthy'
      if (item.currentStock === 0) status = 'critical'
      else if (item.currentStock <= item.minimumStock) status = 'low'
      else if (item.currentStock > item.minimumStock * 3) status = 'overstock'

      return {
        id: item.id,
        name: item.name,
        currentStock: item.currentStock,
        minimumStock: item.minimumStock,
        status,
        daysRemaining: Math.min(daysRemaining, 999),
        cost: item.costPerUnit
      }
    })

    const wastePercentage = 2.5 // Mock waste percentage
    const turnoverRate = 3.2 // Mock turnover rate

    const metrics = {
      totalItems,
      lowStockItems,
      outOfStockItems,
      totalValue,
      turnoverRate,
      wastePercentage,
      topSellingIngredients,
      stockLevels
    }

    return NextResponse.json({
      metrics,
      metadata: {
        period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        storeId,
        lastUpdated: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Inventory analytics error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch inventory analytics',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 })
  }
}