'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { 
  CheckCircle, 
  Clock, 
  ChefHat, 
  Truck, 
  MapPin, 
  Phone,
  Bell,
  AlertCircle
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useWebSocketStore } from '@/stores/websocket-store'
import { ROOMS } from '@/lib/socket-server'

interface LiveOrderTrackerProps {
  orderId: string
  className?: string
}

interface OrderStep {
  status: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  estimatedTime: number // in minutes
  description: string
}

const ORDER_STEPS: OrderStep[] = [
  {
    status: 'confirmed',
    label: 'Order Confirmed',
    icon: CheckCircle,
    estimatedTime: 2,
    description: 'Your order has been received and confirmed'
  },
  {
    status: 'preparing',
    label: 'Preparing',
    icon: ChefHat,
    estimatedTime: 15,
    description: 'Our kitchen is preparing your order'
  },
  {
    status: 'ready',
    label: 'Ready',
    icon: Clock,
    estimatedTime: 20,
    description: 'Your order is ready for pickup/delivery'
  },
  {
    status: 'out_for_delivery',
    label: 'Out for Delivery',
    icon: Truck,
    estimatedTime: 25,
    description: 'Your order is on the way'
  },
  {
    status: 'delivered',
    label: 'Delivered',
    icon: CheckCircle,
    estimatedTime: 30,
    description: 'Your order has been delivered'
  }
]

export function LiveOrderTracker({ orderId, className }: LiveOrderTrackerProps) {
  const { data: session } = useSession()
  const [elapsedTime, setElapsedTime] = useState(0)
  const [orderPlacedTime, setOrderPlacedTime] = useState<Date | null>(null)
  
  const {
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    getOrderStatus,
    isConnected,
    isConnecting,
    lastError,
    driverLocations,
    notifications
  } = useWebSocketStore()

  const orderUpdate = getOrderStatus(orderId)
  const currentStepIndex = ORDER_STEPS.findIndex(step => step.status === orderUpdate?.status) ?? 0
  const currentStep = ORDER_STEPS[currentStepIndex]
  const completedSteps = currentStepIndex + 1

  // Calculate progress percentage
  const progressPercentage = Math.min((completedSteps / ORDER_STEPS.length) * 100, 100)

  // Get driver location if order is out for delivery
  const driverData = orderUpdate?.driverLocation ? {
    orderLocation: orderUpdate.driverLocation,
    // Find driver from locations store (simplified)
    ...Object.values(driverLocations)[0]
  } : null

  // Get order-specific notifications
  const orderNotifications = notifications.filter(n => n.orderId === orderId)

  useEffect(() => {
    if (session?.user?.id) {
      // Connect to WebSocket
      connect(session.user.id, 'customer')
      
      // Join order-specific room
      joinRoom(ROOMS.ORDER(orderId))
      
      // Set initial order time (in real app, this would come from API)
      setOrderPlacedTime(new Date(Date.now() - Math.random() * 10 * 60 * 1000)) // Random time in last 10 minutes
    }

    return () => {
      leaveRoom(ROOMS.ORDER(orderId))
    }
  }, [orderId, session?.user?.id, connect, joinRoom, leaveRoom])

  useEffect(() => {
    if (!orderPlacedTime) return

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - orderPlacedTime.getTime()) / 1000 / 60) // minutes
      setElapsedTime(elapsed)
    }, 60000) // Update every minute

    // Initial calculation
    const elapsed = Math.floor((Date.now() - orderPlacedTime.getTime()) / 1000 / 60)
    setElapsedTime(elapsed)

    return () => clearInterval(interval)
  }, [orderPlacedTime])

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStepIndex) return 'completed'
    if (stepIndex === currentStepIndex) return 'current'
    return 'pending'
  }

  const getEstimatedTimeRemaining = () => {
    if (!currentStep || !orderPlacedTime) return null
    
    const targetTime = currentStep.estimatedTime
    const remaining = targetTime - elapsedTime
    return Math.max(remaining, 0)
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  if (!session) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please sign in to track your order
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className={className}>
      {/* Connection Status */}
      {isConnecting && (
        <Alert className="mb-4">
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Connecting to real-time tracking...
          </AlertDescription>
        </Alert>
      )}

      {lastError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Connection error: {lastError}. Retrying...
          </AlertDescription>
        </Alert>
      )}

      {/* Order Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Order #{orderId.slice(-6)}</CardTitle>
            <div className="flex items-center gap-2">
              {isConnected && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                  Live
                </Badge>
              )}
              {orderUpdate?.status && (
                <Badge className={
                  orderUpdate.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  orderUpdate.status === 'out_for_delivery' ? 'bg-blue-100 text-blue-800' :
                  orderUpdate.status === 'preparing' ? 'bg-orange-100 text-orange-800' :
                  'bg-gray-100 text-gray-800'
                }>
                  {currentStep?.label || orderUpdate.status}
                </Badge>
              )}
            </div>
          </div>
          
          {/* Time Information */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Elapsed: {formatTime(elapsedTime)}</span>
            </div>
            {getEstimatedTimeRemaining() !== null && (
              <div className="flex items-center gap-1">
                <Bell className="h-4 w-4" />
                <span>ETA: {formatTime(getEstimatedTimeRemaining()!)} remaining</span>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Order Progress</span>
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>

          {/* Latest Update */}
          {orderUpdate && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {currentStep && (
                    <div className="bg-blue-100 p-2 rounded-full">
                      <currentStep.icon className="h-5 w-5 text-blue-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-blue-900">{orderUpdate.message}</p>
                    <p className="text-sm text-blue-700 mt-1">
                      {new Date(orderUpdate.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Timeline */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Order Timeline</h3>
            <div className="space-y-3">
              {ORDER_STEPS.map((step, index) => {
                const status = getStepStatus(index)
                const StepIcon = step.icon
                
                return (
                  <div key={step.status} className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${
                      status === 'completed' ? 'bg-green-100 text-green-600' :
                      status === 'current' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      <StepIcon className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 pb-3">
                      <div className="flex items-center justify-between">
                        <p className={`font-medium ${
                          status === 'completed' ? 'text-green-900' :
                          status === 'current' ? 'text-blue-900' :
                          'text-gray-500'
                        }`}>
                          {step.label}
                        </p>
                        <span className="text-xs text-gray-500">
                          ~{step.estimatedTime}min
                        </span>
                      </div>
                      <p className={`text-sm ${
                        status === 'completed' ? 'text-green-700' :
                        status === 'current' ? 'text-blue-700' :
                        'text-gray-500'
                      }`}>
                        {step.description}
                      </p>
                      
                      {status === 'current' && step.status === 'preparing' && (
                        <div className="mt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                          🍕 Our chefs are working on your order right now!
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Driver Information */}
          {orderUpdate?.status === 'out_for_delivery' && driverData && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-green-900 flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Your Driver
                  </h4>
                  <Badge className="bg-green-100 text-green-800">On the way</Badge>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-green-700">Marko Petrović</span>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" className="h-7 px-2">
                        <Phone className="h-3 w-3 mr-1" />
                        Call
                      </Button>
                    </div>
                  </div>
                  
                  {orderUpdate.estimatedDelivery && (
                    <div className="flex items-center gap-1 text-green-700">
                      <MapPin className="h-3 w-3" />
                      <span>ETA: {new Date(orderUpdate.estimatedDelivery).toLocaleTimeString()}</span>
                    </div>
                  )}
                  
                  <div className="text-xs text-green-600">
                    🚗 Your driver is {Math.round(Math.random() * 3 + 1)}km away
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Notifications */}
          {orderNotifications.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Recent Updates</h4>
              {orderNotifications.slice(0, 3).map((notification, index) => (
                <div key={index} className="text-sm p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">{notification.title}</p>
                  <p className="text-gray-600">{notification.message}</p>
                </div>
              ))}
            </div>
          )}

          {/* Delivery Address */}
          <div className="pt-4 border-t">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Delivery Address
            </h4>
            <p className="text-sm text-gray-600">
              123 Main Street, Apt 4B<br />
              Belgrade, Serbia
            </p>
          </div>

          {/* Support Contact */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              <Phone className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
            {orderUpdate?.status === 'delivered' && (
              <Button className="flex-1 bg-orange-600 hover:bg-orange-700">
                Rate Order
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 