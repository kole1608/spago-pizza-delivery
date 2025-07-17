import { Server as NetServer } from 'http'
import { NextApiResponse } from 'next'
import { Server as SocketIOServer } from 'socket.io'
import { prisma } from '@/lib/prisma'

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: SocketIOServer
    }
  }
}

export interface ServerToClientEvents {
  orderStatusUpdated: (data: {
    orderId: string
    status: string
    message: string
    timestamp: string
    driverLocation?: {
      lat: number
      lng: number
    }
    estimatedDelivery?: string
  }) => void
  
  newOrderNotification: (data: {
    orderId: string
    customerName: string
    items: Array<{
      name: string
      quantity: number
    }>
    total: number
    priority: 'normal' | 'urgent'
    estimatedPrepTime: number
  }) => void
  
  kitchenQueueUpdated: (data: {
    activeOrders: number
    averagePrepTime: number
    nextOrder?: {
      id: string
      items: Array<{ name: string; quantity: number }>
      priority: string
    }
  }) => void
  
  driverLocationUpdate: (data: {
    driverId: string
    location: {
      lat: number
      lng: number
    }
    speed: number
    heading: number
    accuracy: number
  }) => void
  
  inventoryLevelChanged: (data: {
    itemId: string
    itemName: string
    currentStock: number
    minimumStock: number
    status: 'in_stock' | 'low_stock' | 'out_of_stock'
    alertLevel: 'info' | 'warning' | 'critical'
  }) => void
  
  dashboardStatsUpdated: (data: {
    todayOrders: number
    todayRevenue: number
    activeOrders: number
    averageDeliveryTime: number
    topSellingItems: Array<{
      name: string
      quantity: number
    }>
  }) => void
  
  customerNotification: (data: {
    type: 'order_confirmed' | 'order_preparing' | 'order_ready' | 'driver_assigned' | 'order_delivered'
    title: string
    message: string
    orderId: string
    data?: any
  }) => void
}

export interface ClientToServerEvents {
  joinRoom: (room: string) => void
  leaveRoom: (room: string) => void
  
  updateOrderStatus: (data: {
    orderId: string
    status: string
    driverLocation?: {
      lat: number
      lng: number
    }
    estimatedDelivery?: string
  }) => void
  
  updateDriverLocation: (data: {
    driverId: string
    location: {
      lat: number
      lng: number
    }
    speed: number
    heading: number
  }) => void
  
  markOrderReady: (data: {
    orderId: string
    estimatedDelivery: string
  }) => void
  
  requestKitchenStatus: () => void
  requestDashboardStats: () => void
}

export interface InterServerEvents {
  ping: () => void
}

export interface SocketData {
  userId: string
  role: 'customer' | 'admin' | 'kitchen' | 'driver'
  storeId?: string
}

// Room naming conventions
export const ROOMS = {
  CUSTOMER: (userId: string) => `customer:${userId}`,
  ORDER: (orderId: string) => `order:${orderId}`,
  KITCHEN: (storeId: string = 'default') => `kitchen:${storeId}`,
  DRIVERS: (storeId: string = 'default') => `drivers:${storeId}`,
  ADMIN: (storeId: string = 'default') => `admin:${storeId}`,
  DASHBOARD: (storeId: string = 'default') => `dashboard:${storeId}`,
} as const

export class SocketManager {
  private io: SocketIOServer
  private connectionCount = 0
  private activeDrivers = new Map<string, {
    socketId: string
    location: { lat: number; lng: number }
    lastUpdate: Date
  }>()

  constructor(io: SocketIOServer) {
    this.io = io
    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.connectionCount++
      console.log(`✅ Client connected: ${socket.id} (Total: ${this.connectionCount})`)

      // Authentication and room joining
      socket.on('joinRoom', (room: string) => {
        socket.join(room)
        console.log(`📡 Client ${socket.id} joined room: ${room}`)
      })

      socket.on('leaveRoom', (room: string) => {
        socket.leave(room)
        console.log(`📤 Client ${socket.id} left room: ${room}`)
      })

      // Order status updates
      socket.on('updateOrderStatus', async (data) => {
        try {
          await this.handleOrderStatusUpdate(data)
          
          // Broadcast to relevant rooms
          this.io.to(ROOMS.ORDER(data.orderId)).emit('orderStatusUpdated', {
            ...data,
            timestamp: new Date().toISOString(),
          })
          
          // Update kitchen dashboard if order completed
          if (data.status === 'READY' || data.status === 'DELIVERED') {
            await this.broadcastKitchenUpdate()
          }
          
          // Update admin dashboard
          await this.broadcastDashboardStats()
          
        } catch (error) {
          console.error('Error updating order status:', error)
          socket.emit('error', { message: 'Failed to update order status' })
        }
      })

      // Driver location tracking
      socket.on('updateDriverLocation', async (data) => {
        try {
          // Store driver location
          this.activeDrivers.set(data.driverId, {
            socketId: socket.id,
            location: data.location,
            lastUpdate: new Date(),
          })

          // Broadcast to drivers room and relevant order rooms
          this.io.to(ROOMS.DRIVERS()).emit('driverLocationUpdate', {
            ...data,
            accuracy: 10, // meters
          })

          // Find orders for this driver and update customers
          const driverOrders = await this.getActiveOrdersForDriver(data.driverId)
          for (const order of driverOrders) {
            this.io.to(ROOMS.ORDER(order.id)).emit('orderStatusUpdated', {
              orderId: order.id,
              status: 'OUT_FOR_DELIVERY',
              message: 'Your driver is on the way',
              timestamp: new Date().toISOString(),
              driverLocation: data.location,
            })
          }

        } catch (error) {
          console.error('Error updating driver location:', error)
        }
      })

      // Kitchen order management
      socket.on('markOrderReady', async (data) => {
        try {
          await this.handleOrderReady(data)
          
          // Notify customer
          this.io.to(ROOMS.ORDER(data.orderId)).emit('orderStatusUpdated', {
            orderId: data.orderId,
            status: 'READY',
            message: 'Your order is ready for pickup/delivery',
            timestamp: new Date().toISOString(),
            estimatedDelivery: data.estimatedDelivery,
          })
          
          // Update kitchen queue
          await this.broadcastKitchenUpdate()
          
        } catch (error) {
          console.error('Error marking order ready:', error)
        }
      })

      // Dashboard data requests
      socket.on('requestKitchenStatus', async () => {
        await this.broadcastKitchenUpdate()
      })

      socket.on('requestDashboardStats', async () => {
        await this.broadcastDashboardStats()
      })

      // Cleanup on disconnect
      socket.on('disconnect', () => {
        this.connectionCount--
        console.log(`❌ Client disconnected: ${socket.id} (Total: ${this.connectionCount})`)
        
        // Remove from active drivers if applicable
        for (const [driverId, driver] of this.activeDrivers.entries()) {
          if (driver.socketId === socket.id) {
            this.activeDrivers.delete(driverId)
            console.log(`🚗 Driver ${driverId} went offline`)
            break
          }
        }
      })
    })
  }

  private async handleOrderStatusUpdate(data: {
    orderId: string
    status: string
    driverLocation?: { lat: number; lng: number }
    estimatedDelivery?: string
  }) {
    // Update order in database
    await prisma.order.update({
      where: { id: data.orderId },
      data: {
        status: data.status,
        deliveryTime: data.status === 'DELIVERED' ? new Date() : undefined,
      },
    })

    // Create order tracking entry
    await prisma.orderTracking.create({
      data: {
        orderId: data.orderId,
        status: data.status,
        message: this.getStatusMessage(data.status),
        timestamp: new Date(),
        driverLocation: data.driverLocation ? JSON.stringify(data.driverLocation) : undefined,
      },
    })
  }

  private async handleOrderReady(data: {
    orderId: string
    estimatedDelivery: string
  }) {
    await prisma.order.update({
      where: { id: data.orderId },
      data: {
        status: 'READY',
        estimatedDelivery: new Date(data.estimatedDelivery),
      },
    })

    await prisma.orderTracking.create({
      data: {
        orderId: data.orderId,
        status: 'READY',
        message: 'Order is ready for pickup/delivery',
        timestamp: new Date(),
      },
    })
  }

  private async getActiveOrdersForDriver(driverId: string) {
    return await prisma.order.findMany({
      where: {
        driverId,
        status: {
          in: ['OUT_FOR_DELIVERY', 'READY'],
        },
      },
      select: {
        id: true,
      },
    })
  }

  private async broadcastKitchenUpdate() {
    const activeOrders = await prisma.order.count({
      where: {
        status: {
          in: ['CONFIRMED', 'PREPARING'],
        },
      },
    })

    const nextOrder = await prisma.order.findFirst({
      where: {
        status: 'CONFIRMED',
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    const queueData = {
      activeOrders,
      averagePrepTime: 15, // Calculate from historical data
      nextOrder: nextOrder ? {
        id: nextOrder.id,
        items: nextOrder.items.map((item: any) => ({
          name: item.product.name,
          quantity: item.quantity,
        })),
        priority: 'normal',
      } : undefined,
    }

    this.io.to(ROOMS.KITCHEN()).emit('kitchenQueueUpdated', queueData)
  }

  private async broadcastDashboardStats() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [todayOrders, todayRevenue, activeOrders] = await Promise.all([
      prisma.order.count({
        where: {
          createdAt: {
            gte: today,
          },
        },
      }),
      prisma.order.aggregate({
        where: {
          createdAt: {
            gte: today,
          },
          status: 'DELIVERED',
        },
        _sum: {
          total: true,
        },
      }),
      prisma.order.count({
        where: {
          status: {
            in: ['CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'],
          },
        },
      }),
    ])

    const statsData = {
      todayOrders,
      todayRevenue: todayRevenue._sum.total || 0,
      activeOrders,
      averageDeliveryTime: 25, // Calculate from historical data
      topSellingItems: [], // Calculate from order items
    }

    this.io.to(ROOMS.DASHBOARD()).emit('dashboardStatsUpdated', statsData)
  }

  private getStatusMessage(status: string): string {
    const messages = {
      confirmed: 'Order confirmed and sent to kitchen',
      preparing: 'Kitchen is preparing your order',
      ready: 'Order is ready for pickup/delivery',
      out_for_delivery: 'Driver is on the way',
      delivered: 'Order has been delivered',
    }
    return messages[status as keyof typeof messages] || `Order status: ${status}`
  }

  // Public methods for external use
  public async notifyNewOrder(orderData: {
    orderId: string
    customerName: string
    items: Array<{ name: string; quantity: number }>
    total: number
    priority?: 'normal' | 'urgent'
  }) {
    const estimatedPrepTime = this.calculatePrepTime(orderData.items)
    
    this.io.to(ROOMS.KITCHEN()).emit('newOrderNotification', {
      ...orderData,
      priority: orderData.priority || 'normal',
      estimatedPrepTime,
    })

    // Auto-update kitchen queue
    await this.broadcastKitchenUpdate()
    await this.broadcastDashboardStats()
  }

  public async notifyInventoryChange(data: {
    itemId: string
    itemName: string
    currentStock: number
    minimumStock: number
  }) {
    const status = this.getInventoryStatus(data.currentStock, data.minimumStock)
    const alertLevel = this.getInventoryAlertLevel(data.currentStock, data.minimumStock)

    this.io.to(ROOMS.ADMIN()).emit('inventoryLevelChanged', {
      ...data,
      status,
      alertLevel,
    })
  }

  public getConnectionCount(): number {
    return this.connectionCount
  }

  public getActiveDriversCount(): number {
    return this.activeDrivers.size
  }

  private calculatePrepTime(items: Array<{ name: string; quantity: number }>): number {
    // Basic calculation - can be enhanced with machine learning
    let totalTime = 5 // Base time
    for (const item of items) {
      totalTime += item.quantity * 3 // 3 minutes per item
    }
    return Math.min(totalTime, 45) // Cap at 45 minutes
  }

  private getInventoryStatus(current: number, minimum: number): 'in_stock' | 'low_stock' | 'out_of_stock' {
    if (current === 0) return 'out_of_stock'
    if (current <= minimum) return 'low_stock'
    return 'in_stock'
  }

  private getInventoryAlertLevel(current: number, minimum: number): 'info' | 'warning' | 'critical' {
    if (current === 0) return 'critical'
    if (current <= minimum * 0.5) return 'critical'
    if (current <= minimum) return 'warning'
    return 'info'
  }
}

export let socketManager: SocketManager | null = null

export function initializeSocketManager(io: SocketIOServer) {
  socketManager = new SocketManager(io)
  return socketManager
} 
