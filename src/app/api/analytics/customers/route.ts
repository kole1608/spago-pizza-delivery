import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { subDays, differenceInDays } from 'date-fns'

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

    // Get customer metrics
    const totalCustomers = await prisma.user.count({
      where: {
        role: 'CUSTOMER',
        orders: {
          some: {
            ...(storeId !== 'all' && { storeId })
          }
        }
      }
    })

    const newCustomers = await prisma.user.count({
      where: {
        role: 'CUSTOMER',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    const returningCustomers = await prisma.user.count({
      where: {
        role: 'CUSTOMER',
        createdAt: {
          lt: startDate
        },
        orders: {
          some: {
            createdAt: {
              gte: startDate,
              lte: endDate
            },
            ...(storeId !== 'all' && { storeId })
          }
        }
      }
    })

    // Top customers
    const topCustomers = await prisma.user.findMany({
      where: {
        role: 'CUSTOMER'
      },
      include: {
        orders: {
          where: {
            status: 'DELIVERED',
            ...(storeId !== 'all' && { storeId })
          }
        }
      },
      take: 20
    })

    const topCustomersWithMetrics = topCustomers
      .filter(customer => customer.orders.length > 0)
      .map(customer => {
        const totalSpent = customer.orders.reduce((sum, order) => sum + parseFloat(order.totalAmount.toString()), 0)
        const orderCount = customer.orders.length
        const avgOrderValue = orderCount > 0 ? totalSpent / orderCount : 0
        const lastOrderDate = customer.orders.length > 0 ? 
          new Date(Math.max(...customer.orders.map(o => o.createdAt.getTime()))) : 
          new Date()

        let loyaltyTier = 'Bronze'
        if (totalSpent >= 500 && orderCount >= 10) loyaltyTier = 'Platinum'
        else if (totalSpent >= 250 && orderCount >= 5) loyaltyTier = 'Gold'
        else if (totalSpent >= 100 && orderCount >= 3) loyaltyTier = 'Silver'

        return {
          id: customer.id,
          name: customer.name || 'Unknown',
          email: customer.email,
          totalSpent,
          orderCount,
          avgOrderValue,
          lastOrderDate: lastOrderDate.toISOString(),
          lifetimeValue: totalSpent * 1.5, // Simple LTV calculation
          loyaltyTier
        }
      })
      .sort((a, b) => b.totalSpent - a.totalSpent)

    const metrics = {
      totalCustomers,
      newCustomers,
      returningCustomers,
      churnRate: 12.5, // Mock churn rate
      averageLifetimeValue: topCustomersWithMetrics.length > 0 ? 
        topCustomersWithMetrics.reduce((sum, c) => sum + c.lifetimeValue, 0) / topCustomersWithMetrics.length : 0,
      topCustomers: topCustomersWithMetrics
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
    console.error('Customer analytics error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch customer analytics',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 })
  }
}