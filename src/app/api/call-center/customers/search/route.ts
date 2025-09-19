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
    const query = searchParams.get('q')

    if (!query || query.length < 3) {
      return NextResponse.json({ customers: [] })
    }

    const customers = await prisma.user.findMany({
      where: {
        role: 'CUSTOMER',
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } }
        ]
      },
      include: {
        addresses: {
          orderBy: { isDefault: 'desc' }
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        }
      },
      take: 10
    })

    const formattedCustomers = customers.map(customer => ({
      id: customer.id,
      name: customer.name || 'Unknown',
      phone: customer.phone || '',
      email: customer.email,
      addresses: customer.addresses.map(addr => ({
        id: addr.id,
        type: 'HOME', // Default type
        street: addr.street,
        city: addr.city,
        postalCode: addr.zipCode,
        instructions: addr.instructions,
        isDefault: addr.isDefault
      })),
      orderHistory: customer.orders.map(order => ({
        id: order.id,
        date: order.createdAt,
        total: parseFloat(order.totalAmount.toString()),
        items: order.items.map((item: any) => ({
          name: item.product.name,
          quantity: item.quantity
        })),
        status: order.status
      })),
      preferences: {
        favoriteItems: [], // Mock data
        allergies: [],
        paymentMethod: 'CARD'
      },
      loyaltyPoints: Math.floor(Math.random() * 500),
      lastOrderDate: customer.orders[0]?.createdAt
    }))

    return NextResponse.json({ customers: formattedCustomers })

  } catch (error) {
    console.error('Customer search error:', error)
    return NextResponse.json({ 
      error: 'Failed to search customers',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 })
  }
}