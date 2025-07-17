import { z } from 'zod'
import { createTRPCRouter, adminProcedure } from '@/lib/trpc'

export const adminRouter = createTRPCRouter({
  getOrders: adminProcedure
    .input(z.object({
      status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']).optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      const orders = await ctx.db.order.findMany({
        where: input.status ? { status: input.status } : undefined,
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        skip: input.offset,
        include: {
          user: {
            select: {
              name: true,
              email: true,
              phone: true,
            },
          },
          address: true,
          items: {
            include: {
              product: true,
              productSize: true,
              toppings: {
                include: {
                  topping: true,
                },
              },
            },
          },
          driver: {
            select: {
              name: true,
              phone: true,
            },
          },
        },
      })

      return orders
    }),

  getOrderStats: adminProcedure
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const startDate = input.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
      const endDate = input.endDate || new Date()

      const orders = await ctx.db.order.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          status: true,
          total: true,
          createdAt: true,
        },
      })

      const stats = {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum: number, order: any) => sum + order.total, 0),
        averageOrderValue: orders.length > 0 ? orders.reduce((sum: number, order: any) => sum + order.total, 0) / orders.length : 0,
        statusBreakdown: {
          PENDING: orders.filter((o: any) => o.status === 'PENDING').length,
          CONFIRMED: orders.filter((o: any) => o.status === 'CONFIRMED').length,
          PREPARING: orders.filter((o: any) => o.status === 'PREPARING').length,
          READY_FOR_DELIVERY: orders.filter((o: any) => o.status === 'READY_FOR_DELIVERY').length,
          OUT_FOR_DELIVERY: orders.filter((o: any) => o.status === 'OUT_FOR_DELIVERY').length,
          DELIVERED: orders.filter((o: any) => o.status === 'DELIVERED').length,
          CANCELLED: orders.filter((o: any) => o.status === 'CANCELLED').length,
        },
      }

      return stats
    }),

  getUsers: adminProcedure
    .input(z.object({
      role: z.enum(['CUSTOMER', 'ADMIN', 'DELIVERY_DRIVER', 'KITCHEN_STAFF']).optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      const users = await ctx.db.user.findMany({
        where: input.role ? { role: input.role } : undefined,
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        skip: input.offset,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
          _count: {
            select: {
              orders: true,
            },
          },
        },
      })

      return users
    }),

  updateUserRole: adminProcedure
    .input(z.object({
      userId: z.string(),
      role: z.enum(['CUSTOMER', 'ADMIN', 'DELIVERY_DRIVER', 'KITCHEN_STAFF']),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.update({
        where: { id: input.userId },
        data: { role: input.role },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      })

      return user
    }),

  getStoreSettings: adminProcedure
    .query(async ({ ctx }) => {
      const settings = await ctx.db.storeSettings.findUnique({
        where: { id: 'store_settings' },
      })

      return settings
    }),

  updateStoreSettings: adminProcedure
    .input(z.object({
      storeName: z.string().min(1).optional(),
      phoneNumber: z.string().optional(),
      email: z.string().email().optional(),
      address: z.string().optional(),
      deliveryRadius: z.number().min(0).optional(),
      minOrderAmount: z.number().min(0).optional(),
      deliveryFee: z.number().min(0).optional(),
      freeDeliveryThreshold: z.number().min(0).optional(),
      taxRate: z.number().min(0).max(1).optional(),
      isOpen: z.boolean().optional(),
      estimatedDeliveryTime: z.number().min(10).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const settings = await ctx.db.storeSettings.upsert({
        where: { id: 'store_settings' },
        update: input,
        create: {
          id: 'store_settings',
          ...input,
        },
      })

      return settings
    }),

  getDailySales: adminProcedure
    .input(z.object({
      days: z.number().min(1).max(365).default(30),
    }))
    .query(async ({ ctx, input }) => {
      const startDate = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000)
      
      const orders = await ctx.db.order.findMany({
        where: {
          createdAt: {
            gte: startDate,
          },
          status: 'DELIVERED',
        },
        select: {
          total: true,
          createdAt: true,
        },
      })

      // Group by date
      const salesByDate = orders.reduce((acc: any, order: any) => {
        const date = order.createdAt.toISOString().split('T')[0]
        if (!acc[date]) {
          acc[date] = { date, total: 0, count: 0 }
        }
        acc[date].total += order.total
        acc[date].count += 1
        return acc
      }, {})

      return Object.values(salesByDate)
    }),

  getPopularProducts: adminProcedure
    .input(z.object({
      days: z.number().min(1).max(365).default(30),
      limit: z.number().min(1).max(20).default(10),
    }))
    .query(async ({ ctx, input }) => {
      const startDate = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000)
      
      const orderItems = await ctx.db.orderItem.findMany({
        where: {
          order: {
            createdAt: {
              gte: startDate,
            },
            status: 'DELIVERED',
          },
        },
        include: {
          product: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      })

      // Group by product and sum quantities
      const productSales = orderItems.reduce((acc: any, item: any) => {
        const productId = item.productId
        if (!acc[productId]) {
          acc[productId] = {
            productId,
            name: item.product.name,
            image: item.product.image,
            totalQuantity: 0,
            totalRevenue: 0,
          }
        }
        acc[productId].totalQuantity += item.quantity
        acc[productId].totalRevenue += item.price * item.quantity
        return acc
      }, {})

      return Object.values(productSales)
        .sort((a: any, b: any) => b.totalQuantity - a.totalQuantity)
        .slice(0, input.limit)
    }),
}) 
