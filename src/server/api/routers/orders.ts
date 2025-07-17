import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure, driverProcedure, kitchenProcedure } from '@/lib/trpc'

const orderItemSchema = z.object({
  productId: z.string(),
  productSizeId: z.string().optional(),
  quantity: z.number().min(1),
  toppings: z.array(z.string()).default([]),
  specialInstructions: z.string().optional(),
})

export const ordersRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({
      addressId: z.string(),
      items: z.array(orderItemSchema),
      paymentMethod: z.enum(['CASH', 'CARD', 'ONLINE']),
      notes: z.string().optional(),
      couponCode: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Calculate order totals
      let subtotal = 0
      const orderItems = []

      for (const item of input.items) {
        const product = await ctx.db.product.findUnique({
          where: { id: item.productId },
          include: {
            sizes: true,
          },
        })

        if (!product) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Product not found: ${item.productId}`,
          })
        }

        let itemPrice = product.basePrice
        
        // Add size price
        if (item.productSizeId) {
          const size = product.sizes.find((s: any) => s.id === item.productSizeId)
          if (size) {
            itemPrice += size.price
          }
        }

        // Add toppings price
        if (item.toppings.length > 0) {
          const toppings = await ctx.db.topping.findMany({
            where: { id: { in: item.toppings } },
          })
          itemPrice += toppings.reduce((sum: number, topping: any) => sum + topping.price, 0)
        }

        const totalItemPrice = itemPrice * item.quantity
        subtotal += totalItemPrice

        orderItems.push({
          productId: item.productId,
          productSizeId: item.productSizeId,
          quantity: item.quantity,
          price: itemPrice,
          specialInstructions: item.specialInstructions,
          toppings: item.toppings,
        })
      }

      // Get store settings for calculations
      const storeSettings = await ctx.db.storeSettings.findUnique({
        where: { id: 'store_settings' },
      })

      if (!storeSettings) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Store settings not found',
        })
      }

      // Apply coupon if provided
      let discount = 0
      let freeDelivery = false
      if (input.couponCode) {
        const coupon = await ctx.db.coupon.findUnique({
          where: { code: input.couponCode },
        })

        if (coupon && coupon.isActive && coupon.validUntil > new Date()) {
          if (subtotal >= (coupon.minOrderAmount || 0)) {
            if (coupon.type === 'PERCENTAGE') {
              discount = Math.min(
                (subtotal * coupon.value) / 100,
                coupon.maxDiscount || Infinity
              )
            } else if (coupon.type === 'FIXED_AMOUNT') {
              discount = Math.min(coupon.value, subtotal)
            } else if (coupon.type === 'FREE_DELIVERY') {
              freeDelivery = true
            }
          }
        }
      }

      const deliveryFee = freeDelivery || subtotal >= (storeSettings.freeDeliveryThreshold || 0) 
        ? 0 
        : storeSettings.deliveryFee

      const discountedSubtotal = subtotal - discount
      const tax = discountedSubtotal * storeSettings.taxRate
      const total = discountedSubtotal + deliveryFee + tax

      // Generate order number
      const orderNumber = `SPG${Date.now()}`

      // Create order
      const order = await ctx.db.order.create({
        data: {
          orderNumber,
          userId: ctx.session.user.id,
          addressId: input.addressId,
          paymentMethod: input.paymentMethod,
          subtotal,
          deliveryFee,
          tax,
          total,
          notes: input.notes,
          estimatedDelivery: new Date(Date.now() + storeSettings.estimatedDeliveryTime * 60 * 1000),
          items: {
            create: orderItems.map(item => ({
              productId: item.productId,
              productSizeId: item.productSizeId,
              quantity: item.quantity,
              price: item.price,
              specialInstructions: item.specialInstructions,
              toppings: item.toppings.length > 0 ? {
                create: item.toppings.map(toppingId => ({
                  toppingId,
                }))
              } : undefined,
            })),
          },
          tracking: {
            create: {
              status: 'PENDING',
              message: 'Order received and is being processed',
            },
          },
        },
        include: {
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
          address: true,
          tracking: true,
        },
      })

      return order
    }),

  getUserOrders: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(10),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      const orders = await ctx.db.order.findMany({
        where: { userId: ctx.session.user.id },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        skip: input.offset,
        include: {
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
          address: true,
          tracking: {
            orderBy: { timestamp: 'desc' },
          },
        },
      })

      return orders
    }),

  getOrder: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.db.order.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        include: {
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
          address: true,
          tracking: {
            orderBy: { timestamp: 'asc' },
          },
          driver: {
            select: {
              name: true,
              phone: true,
            },
          },
        },
      })

      if (!order) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Order not found',
        })
      }

      return order
    }),

  updateStatus: kitchenProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['CONFIRMED', 'PREPARING', 'READY_FOR_DELIVERY']),
      message: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.order.update({
        where: { id: input.id },
        data: { status: input.status },
        include: {
          tracking: true,
        },
      })

      // Add tracking entry
      await ctx.db.orderTracking.create({
        data: {
          orderId: input.id,
          status: input.status,
          message: input.message || `Order status updated to ${input.status}`,
        },
      })

      return order
    }),

  assignDriver: driverProcedure
    .input(z.object({
      orderId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.order.update({
        where: {
          id: input.orderId,
          status: 'READY_FOR_DELIVERY',
        },
        data: {
          driverId: ctx.session?.user.id,
          status: 'OUT_FOR_DELIVERY',
        },
      })

      // Add tracking entry
      await ctx.db.orderTracking.create({
        data: {
          orderId: input.orderId,
          status: 'OUT_FOR_DELIVERY',
          message: 'Order is out for delivery',
        },
      })

      return order
    }),

  completeDelivery: driverProcedure
    .input(z.object({
      orderId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.order.update({
        where: {
          id: input.orderId,
          driverId: ctx.session?.user.id,
          status: 'OUT_FOR_DELIVERY',
        },
        data: {
          status: 'DELIVERED',
          deliveredAt: new Date(),
        },
      })

      // Add tracking entry
      await ctx.db.orderTracking.create({
        data: {
          orderId: input.orderId,
          status: 'DELIVERED',
          message: 'Order has been delivered',
        },
      })

      return order
    }),

  cancelOrder: protectedProcedure
    .input(z.object({
      id: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.order.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
      })

      if (!order) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Order not found or cannot be cancelled',
        })
      }

      const updatedOrder = await ctx.db.order.update({
        where: { id: input.id },
        data: { status: 'CANCELLED' },
      })

      // Add tracking entry
      await ctx.db.orderTracking.create({
        data: {
          orderId: input.id,
          status: 'CANCELLED',
          message: input.reason || 'Order cancelled by customer',
        },
      })

      return updatedOrder
    }),
}) 
