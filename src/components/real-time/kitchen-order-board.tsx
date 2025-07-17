'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Clock, 
  ChefHat, 
  CheckCircle, 
  AlertTriangle,
  Users,
  Timer,
  Package,
  Eye,
  Bell,
  Flame
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { useWebSocketStore } from '@/stores/websocket-store'
import { ROOMS } from '@/lib/socket-server'

interface KitchenOrderBoardProps {
  className?: string
  storeId?: string
}

interface Order {
  id: string
  customerName: string
  items: Array<{
    name: string
    quantity: number
    customizations?: string[]
    priority?: 'normal' | 'urgent'
  }>
  total: number
  orderTime: Date
  estimatedPrepTime: number
  status: 'confirmed' | 'preparing' | 'ready'
  tableNumber?: string
  specialInstructions?: string
  priority: 'normal' | 'urgent'
}

// Mock orders for demo
const mockOrders: Order[] = [
  {
    id: 'SP123456',
    customerName: 'John Doe',
    items: [
      { name: 'Margherita Pizza', quantity: 1, customizations: ['Extra cheese', 'No olives'] },
      { name: 'Caesar Salad', quantity: 1 }
    ],
    total: 24.50,
    orderTime: new Date(Date.now() - 8 * 60 * 1000), // 8 minutes ago
    estimatedPrepTime: 15,
    status: 'preparing',
    priority: 'normal',
    specialInstructions: 'Please make it crispy'
  },
  {
    id: 'SP123457',
    customerName: 'Jane Smith',
    items: [
      { name: 'Pepperoni Pizza', quantity: 2, priority: 'urgent' },
      { name: 'Garlic Bread', quantity: 1 }
    ],
    total: 32.00,
    orderTime: new Date(Date.now() - 3 * 60 * 1000), // 3 minutes ago
    estimatedPrepTime: 18,
    status: 'confirmed',
    priority: 'urgent'
  },
  {
    id: 'SP123458',
    customerName: 'Mike Wilson',
    items: [
      { name: 'Quattro Stagioni', quantity: 1 },
      { name: 'Tiramisu', quantity: 2 }
    ],
    total: 28.00,
    orderTime: new Date(Date.now() - 12 * 60 * 1000), // 12 minutes ago
    estimatedPrepTime: 20,
    status: 'preparing',
    priority: 'normal'
  },
  {
    id: 'SP123459',
    customerName: 'Sarah Brown',
    items: [
      { name: 'Vegan Pizza', quantity: 1, customizations: ['Extra vegetables'] }
    ],
    total: 16.00,
    orderTime: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    estimatedPrepTime: 12,
    status: 'ready',
    priority: 'normal'
  }
]

export function KitchenOrderBoard({ className, storeId = 'default' }: KitchenOrderBoardProps) {
  const { data: session } = useSession()
  const [orders, setOrders] = useState<Order[]>(mockOrders)
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  const {
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    markOrderReady,
    updateOrderStatus,
    kitchenQueue,
    notifications,
    isConnected,
    isConnecting,
    requestKitchenStatus
  } = useWebSocketStore()

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (session?.user?.id) {
      // Connect to WebSocket as kitchen staff
      connect(session.user.id, 'kitchen')
      
      // Join kitchen room
      joinRoom(ROOMS.KITCHEN(storeId))
      
      // Request initial kitchen status
      requestKitchenStatus()
    }

    return () => {
      leaveRoom(ROOMS.KITCHEN(storeId))
    }
  }, [session?.user?.id, storeId, connect, joinRoom, leaveRoom, requestKitchenStatus])

  // Update orders when kitchen queue data changes
  useEffect(() => {
    if (kitchenQueue?.nextOrder) {
      // In real app, this would sync with backend data
      console.log('Kitchen queue updated:', kitchenQueue)
    }
  }, [kitchenQueue])

  const getElapsedTime = (orderTime: Date) => {
    const elapsed = Math.floor((currentTime.getTime() - orderTime.getTime()) / 1000 / 60)
    return elapsed
  }

  const getTimeStatus = (order: Order) => {
    const elapsed = getElapsedTime(order.orderTime)
    const estimated = order.estimatedPrepTime
    
    if (elapsed > estimated + 5) return 'overdue'
    if (elapsed > estimated) return 'warning'
    return 'normal'
  }

  const getProgressPercentage = (order: Order) => {
    const elapsed = getElapsedTime(order.orderTime)
    return Math.min((elapsed / order.estimatedPrepTime) * 100, 100)
  }

  const handleStartOrder = (orderId: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, status: 'preparing' as const }
        : order
    ))
    
    updateOrderStatus(orderId, 'preparing')
  }

  const handleCompleteOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId)
    if (!order) return
    
    const estimatedDelivery = new Date(Date.now() + 25 * 60 * 1000) // 25 minutes from now
    
    setOrders(prev => prev.map(o => 
      o.id === orderId 
        ? { ...o, status: 'ready' as const }
        : o
    ))
    
    markOrderReady(orderId, estimatedDelivery.toISOString())
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }

  const sortedOrders = [...orders].sort((a, b) => {
    // Priority first
    if (a.priority === 'urgent' && b.priority === 'normal') return -1
    if (a.priority === 'normal' && b.priority === 'urgent') return 1
    
    // Then by status (confirmed first, then preparing, then ready)
    const statusOrder = { confirmed: 0, preparing: 1, ready: 2 }
    const statusDiff = statusOrder[a.status] - statusOrder[b.status]
    if (statusDiff !== 0) return statusDiff
    
    // Finally by order time (oldest first)
    return a.orderTime.getTime() - b.orderTime.getTime()
  })

  const activeOrders = orders.filter(o => o.status !== 'ready')
  const readyOrders = orders.filter(o => o.status === 'ready')
  const averagePrepTime = Math.round(orders.reduce((sum, o) => sum + o.estimatedPrepTime, 0) / orders.length)

  if (!session) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Please sign in to access the kitchen board
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className={className}>
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Orders</p>
                <p className="text-2xl font-bold text-gray-900">{activeOrders.length}</p>
              </div>
              <div className="bg-orange-100 p-2 rounded-full">
                <ChefHat className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ready Orders</p>
                <p className="text-2xl font-bold text-gray-900">{readyOrders.length}</p>
              </div>
              <div className="bg-green-100 p-2 rounded-full">
                <Package className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Prep Time</p>
                <p className="text-2xl font-bold text-gray-900">{averagePrepTime}m</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-full">
                <Timer className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Connection</p>
                <p className={`text-sm font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {isConnected ? 'Live' : isConnecting ? 'Connecting...' : 'Offline'}
                </p>
              </div>
              <div className={`p-2 rounded-full ${isConnected ? 'bg-green-100' : 'bg-red-100'}`}>
                <Bell className={`h-5 w-5 ${isConnected ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <Bell className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>New notifications:</strong> {notifications.length} updates
          </AlertDescription>
        </Alert>
      )}

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {sortedOrders.map((order) => {
          const timeStatus = getTimeStatus(order)
          const elapsed = getElapsedTime(order.orderTime)
          const progress = getProgressPercentage(order)
          
          return (
            <Card 
              key={order.id}
              className={`cursor-pointer transition-all duration-200 ${
                selectedOrder === order.id ? 'ring-2 ring-blue-500' : ''
              } ${
                order.priority === 'urgent' ? 'border-l-4 border-l-red-500' : ''
              } ${
                timeStatus === 'overdue' ? 'bg-red-50 border-red-200' :
                timeStatus === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                order.status === 'ready' ? 'bg-green-50 border-green-200' :
                'bg-white'
              }`}
              onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">#{order.id.slice(-6)}</CardTitle>
                  <div className="flex items-center gap-2">
                    {order.priority === 'urgent' && (
                      <Badge className="bg-red-100 text-red-800">
                        <Flame className="h-3 w-3 mr-1" />
                        Urgent
                      </Badge>
                    )}
                    <Badge className={
                      order.status === 'ready' ? 'bg-green-100 text-green-800' :
                      order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }>
                      {order.status === 'ready' ? 'Ready' : 
                       order.status === 'preparing' ? 'Preparing' : 'New'}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span className="font-medium">{order.customerName}</span>
                  <span>€{order.total.toFixed(2)}</span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Time and Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {elapsed}m elapsed
                    </span>
                    <span className={
                      timeStatus === 'overdue' ? 'text-red-600 font-medium' :
                      timeStatus === 'warning' ? 'text-yellow-600 font-medium' :
                      'text-gray-500'
                    }>
                      Target: {order.estimatedPrepTime}m
                    </span>
                  </div>
                  
                  {order.status === 'preparing' && (
                    <Progress 
                      value={progress} 
                      className={`h-2 ${
                        timeStatus === 'overdue' ? 'bg-red-100' :
                        timeStatus === 'warning' ? 'bg-yellow-100' :
                        'bg-gray-100'
                      }`}
                    />
                  )}
                </div>

                {/* Order Items */}
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.quantity}×</span>
                          <span>{item.name}</span>
                          {item.priority === 'urgent' && (
                            <Flame className="h-3 w-3 text-red-500" />
                          )}
                        </div>
                        {item.customizations && item.customizations.length > 0 && (
                          <div className="text-xs text-gray-500 ml-6">
                            {item.customizations.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Special Instructions */}
                {order.specialInstructions && (
                  <div className="bg-yellow-50 p-2 rounded text-xs">
                    <span className="font-medium text-yellow-800">Note:</span>
                    <span className="text-yellow-700 ml-1">{order.specialInstructions}</span>
                  </div>
                )}

                {/* Order Details (Expanded) */}
                {selectedOrder === order.id && (
                  <div className="border-t pt-3 space-y-2 text-xs text-gray-600">
                    <div>Order Time: {formatTime(order.orderTime)}</div>
                    {order.tableNumber && <div>Table: {order.tableNumber}</div>}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {order.status === 'confirmed' && (
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStartOrder(order.id)
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      size="sm"
                    >
                      Start Cooking
                    </Button>
                  )}
                  
                  {order.status === 'preparing' && (
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCompleteOrder(order.id)
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      Mark Ready
                    </Button>
                  )}
                  
                  {order.status === 'ready' && (
                    <div className="flex-1 text-center text-sm text-green-600 font-medium py-2">
                      Ready for Pickup
                    </div>
                  )}
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {orders.length === 0 && (
        <Card className="p-12 text-center">
          <ChefHat className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders in queue</h3>
          <p className="text-gray-600">
            All caught up! New orders will appear here automatically.
          </p>
        </Card>
      )}
    </div>
  )
} 