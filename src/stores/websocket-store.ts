import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { io, Socket } from 'socket.io-client'
import { 
  ServerToClientEvents, 
  ClientToServerEvents,
  ROOMS
} from '@/lib/socket-server'

interface OrderUpdate {
  orderId: string
  status: string
  message: string
  timestamp: string
  driverLocation?: {
    lat: number
    lng: number
  }
  estimatedDelivery?: string
}

interface KitchenQueueData {
  activeOrders: number
  averagePrepTime: number
  nextOrder?: {
    id: string
    items: Array<{ name: string; quantity: number }>
    priority: string
  }
}

interface DashboardStats {
  todayOrders: number
  todayRevenue: number
  activeOrders: number
  averageDeliveryTime: number
  topSellingItems: Array<{
    name: string
    quantity: number
  }>
}

interface NotificationData {
  type: 'order_confirmed' | 'order_preparing' | 'order_ready' | 'driver_assigned' | 'order_delivered' | 'inventory_alert'
  title: string
  message: string
  orderId: string
  data?: any
}

interface DriverLocation {
  driverId: string
  location: {
    lat: number
    lng: number
  }
  speed: number
  heading: number
  accuracy: number
}

interface WebSocketStore {
  // Connection state
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null
  isConnected: boolean
  isConnecting: boolean
  reconnectAttempts: number
  lastError: string | null
  
  // Real-time data
  orderUpdates: Record<string, OrderUpdate>
  kitchenQueue: KitchenQueueData | null
  dashboardStats: DashboardStats | null
  notifications: NotificationData[]
  driverLocations: Record<string, DriverLocation>
  
  // Message queue for offline
  messageQueue: Array<{
    event: string
    data: any
    timestamp: number
  }>
  
  // Actions
  connect: (userId?: string, userRole?: string) => void
  disconnect: () => void
  joinRoom: (room: string) => void
  leaveRoom: (room: string) => void
  
  // Order management
  updateOrderStatus: (orderId: string, status: string, driverLocation?: { lat: number; lng: number }, estimatedDelivery?: string) => void
  markOrderReady: (orderId: string, estimatedDelivery: string) => void
  
  // Driver tracking
  updateDriverLocation: (driverId: string, location: { lat: number; lng: number }, speed: number, heading: number) => void
  
  // Data requests
  requestKitchenStatus: () => void
  requestDashboardStats: () => void
  
  // Notifications
  addNotification: (notification: NotificationData) => void
  markNotificationRead: (orderId: string) => void
  clearNotifications: () => void
  
  // Utility
  getOrderStatus: (orderId: string) => OrderUpdate | null
  isOrderActive: (orderId: string) => boolean
  getUnreadNotifications: () => NotificationData[]
}

export const useWebSocketStore = create<WebSocketStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    socket: null,
    isConnected: false,
    isConnecting: false,
    reconnectAttempts: 0,
    lastError: null,
    
    orderUpdates: {},
    kitchenQueue: null,
    dashboardStats: null,
    notifications: [],
    driverLocations: {},
    messageQueue: [],
    
    // Connection management
    connect: (userId?: string, userRole?: string) => {
      const state = get()
      
      if (state.socket?.connected) {
        console.log('🔗 WebSocket already connected')
        return
      }
      
      set({ isConnecting: true, lastError: null })
      
      try {
        const socketUrl = process.env.NODE_ENV === 'production' 
          ? process.env.NEXT_PUBLIC_SITE_URL || ''
          : 'http://localhost:3000'
        
        const socket = io(socketUrl, {
          path: '/api/socket',
          transports: ['websocket', 'polling'],
          timeout: 20000,
          forceNew: false,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          auth: {
            userId,
            role: userRole,
          },
        })
        
        // Connection events
        socket.on('connect', () => {
          console.log('✅ WebSocket connected:', socket.id)
          set({ 
            socket, 
            isConnected: true, 
            isConnecting: false, 
            reconnectAttempts: 0,
            lastError: null
          })
          
          // Process queued messages
          const { messageQueue } = get()
          messageQueue.forEach(({ event, data }) => {
            socket.emit(event as any, data)
          })
          set({ messageQueue: [] })
          
          // Auto-join user room if userId provided
          if (userId) {
            socket.emit('joinRoom', ROOMS.CUSTOMER(userId))
          }
        })
        
        socket.on('disconnect', (reason) => {
          console.log('❌ WebSocket disconnected:', reason)
          set({ isConnected: false })
        })
        
        socket.on('connect_error', (error) => {
          console.error('🔥 WebSocket connection error:', error.message)
          set({ 
            isConnecting: false, 
            lastError: error.message,
            reconnectAttempts: get().reconnectAttempts + 1
          })
        })
        
        socket.on('reconnect', (attemptNumber) => {
          console.log(`🔄 WebSocket reconnected after ${attemptNumber} attempts`)
          set({ reconnectAttempts: 0 })
        })
        
        // Data event handlers
        socket.on('orderStatusUpdated', (data) => {
          set(state => ({
            orderUpdates: {
              ...state.orderUpdates,
              [data.orderId]: data
            }
          }))
          
          // Auto-add notification for customer
          if (userRole === 'customer') {
            get().addNotification({
              type: data.status as any,
              title: 'Order Update',
              message: data.message,
              orderId: data.orderId,
              data,
            })
          }
        })
        
        socket.on('kitchenQueueUpdated', (data) => {
          set({ kitchenQueue: data })
        })
        
        socket.on('dashboardStatsUpdated', (data) => {
          set({ dashboardStats: data })
        })
        
        socket.on('driverLocationUpdate', (data) => {
          set(state => ({
            driverLocations: {
              ...state.driverLocations,
              [data.driverId]: data
            }
          }))
        })
        
        socket.on('newOrderNotification', (data) => {
          // For kitchen staff
          if (userRole === 'kitchen' || userRole === 'admin') {
            get().addNotification({
              type: 'order_confirmed',
              title: 'New Order',
              message: `Order from ${data.customerName} - €${data.total.toFixed(2)}`,
              orderId: data.orderId,
              data,
            })
          }
        })
        
        socket.on('customerNotification', (data) => {
          get().addNotification(data)
        })
        
        socket.on('inventoryLevelChanged', (data) => {
          // For admin users
          if (userRole === 'admin') {
            if (data.alertLevel === 'warning' || data.alertLevel === 'critical') {
              get().addNotification({
                type: 'order_confirmed', // Reuse type for inventory
                title: 'Inventory Alert',
                message: `${data.itemName} is ${data.status.replace('_', ' ')} (${data.currentStock} remaining)`,
                orderId: data.itemId,
                data,
              })
            }
          }
        })
        
        socket.on('error', (error) => {
          console.error('🔥 WebSocket error:', error)
          set({ lastError: error.message || 'Unknown error' })
        })
        
      } catch (error) {
        console.error('🔥 Failed to create WebSocket connection:', error)
        set({ 
          isConnecting: false, 
          lastError: error instanceof Error ? error.message : 'Connection failed'
        })
      }
    },
    
    disconnect: () => {
      const { socket } = get()
      if (socket) {
        socket.disconnect()
        set({ 
          socket: null, 
          isConnected: false, 
          isConnecting: false,
          orderUpdates: {},
          kitchenQueue: null,
          dashboardStats: null,
          driverLocations: {},
        })
      }
    },
    
    joinRoom: (room: string) => {
      const { socket, isConnected } = get()
      if (socket && isConnected) {
        socket.emit('joinRoom', room)
      } else {
        // Queue the message
        set(state => ({
          messageQueue: [...state.messageQueue, {
            event: 'joinRoom',
            data: room,
            timestamp: Date.now()
          }]
        }))
      }
    },
    
    leaveRoom: (room: string) => {
      const { socket, isConnected } = get()
      if (socket && isConnected) {
        socket.emit('leaveRoom', room)
      }
    },
    
    // Order management
    updateOrderStatus: (orderId: string, status: string, driverLocation?: { lat: number; lng: number }, estimatedDelivery?: string) => {
      const { socket, isConnected } = get()
      const data = { orderId, status, driverLocation, estimatedDelivery }
      
      if (socket && isConnected) {
        socket.emit('updateOrderStatus', data)
      } else {
        set(state => ({
          messageQueue: [...state.messageQueue, {
            event: 'updateOrderStatus',
            data,
            timestamp: Date.now()
          }]
        }))
      }
    },
    
    markOrderReady: (orderId: string, estimatedDelivery: string) => {
      const { socket, isConnected } = get()
      const data = { orderId, estimatedDelivery }
      
      if (socket && isConnected) {
        socket.emit('markOrderReady', data)
      } else {
        set(state => ({
          messageQueue: [...state.messageQueue, {
            event: 'markOrderReady',
            data,
            timestamp: Date.now()
          }]
        }))
      }
    },
    
    // Driver tracking
    updateDriverLocation: (driverId: string, location: { lat: number; lng: number }, speed: number, heading: number) => {
      const { socket, isConnected } = get()
      const data = { driverId, location, speed, heading }
      
      if (socket && isConnected) {
        socket.emit('updateDriverLocation', data)
      } else {
        set(state => ({
          messageQueue: [...state.messageQueue, {
            event: 'updateDriverLocation',
            data,
            timestamp: Date.now()
          }]
        }))
      }
    },
    
    // Data requests
    requestKitchenStatus: () => {
      const { socket, isConnected } = get()
      if (socket && isConnected) {
        socket.emit('requestKitchenStatus')
      }
    },
    
    requestDashboardStats: () => {
      const { socket, isConnected } = get()
      if (socket && isConnected) {
        socket.emit('requestDashboardStats')
      }
    },
    
    // Notifications
    addNotification: (notification: NotificationData) => {
      set(state => ({
        notifications: [notification, ...state.notifications.slice(0, 49)] // Keep max 50
      }))
    },
    
    markNotificationRead: (orderId: string) => {
      set(state => ({
        notifications: state.notifications.filter(n => n.orderId !== orderId)
      }))
    },
    
    clearNotifications: () => {
      set({ notifications: [] })
    },
    
    // Utility functions
    getOrderStatus: (orderId: string) => {
      return get().orderUpdates[orderId] || null
    },
    
    isOrderActive: (orderId: string) => {
      const update = get().orderUpdates[orderId]
      return update && !['DELIVERED', 'CANCELLED'].includes(update.status)
    },
    
    getUnreadNotifications: () => {
      return get().notifications
    },
  }))
)

// Auto-cleanup on browser close
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    useWebSocketStore.getState().disconnect()
  })
} 
