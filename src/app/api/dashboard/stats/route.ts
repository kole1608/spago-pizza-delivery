import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfDay, subDays } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId') || 'all'

    const today = startOfDay(new Date())
    const yesterday = startOfDay(subDays(new Date(), 1))

    // Today's stats
    const [todayOrders, todayRevenue, activeOrders] = await Promise.all([
      prisma.order.count({
        where: {
          createdAt: { gte: today },
          ...(storeId !== 'all' && { storeId })
        }
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: today },
          status: 'DELIVERED',
          ...(storeId !== 'all' && { storeId })
        },
        _sum: { totalAmount: true }
      }),
      prisma.order.count({
        where: {
          status: { in: ['CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'] },
          ...(storeId !== 'all' && { storeId })
        }
      })
    ])

    // Yesterday's stats for comparison
    const [yesterdayOrders, yesterdayRevenue] = await Promise.all([
      prisma.order.count({
        where: {
          createdAt: { gte: yesterday, lt: today },
          ...(storeId !== 'all' && { storeId })
        }
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: yesterday, lt: today },
          status: 'DELIVERED',
          ...(storeId !== 'all' && { storeId })
        },
        _sum: { totalAmount: true }
      })
    ])

    // Top selling items
    const topSellingItems = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          createdAt: { gte: subDays(new Date(), 7) },
          status: 'DELIVERED',
          ...(storeId !== 'all' && { storeId })
        }
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5
    })

    const topSellingWithNames = await Promise.all(
      topSellingItems.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true }
        })
        return {
          name: product?.name || 'Unknown',
          quantity: item._sum.quantity || 0
        }
      })
    )

    const stats = {
      todayOrders,
      todayRevenue: parseFloat((todayRevenue._sum.totalAmount || 0).toString()),
      activeOrders,
      averageDeliveryTime: 25, // Mock average delivery time
      topSellingItems: topSellingWithNames,
      growth: {
        orders: yesterdayOrders > 0 ? ((todayOrders - yesterdayOrders) / yesterdayOrders) * 100 : 0,
        revenue: parseFloat((yesterdayRevenue._sum.totalAmount || 0).toString()) > 0 ? 
          ((parseFloat((todayRevenue._sum.totalAmount || 0).toString()) - parseFloat((yesterdayRevenue._sum.totalAmount || 0).toString())) / 
           parseFloat((yesterdayRevenue._sum.totalAmount || 0).toString())) * 100 : 0
      }
    }

    return NextResponse.json({
      stats,
      metadata: {
        storeId,
        lastUpdated: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch dashboard stats',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 })
  }
}