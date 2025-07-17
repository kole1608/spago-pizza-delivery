'use client'

import { useState, useEffect } from 'react'
import { 
  Navigation, 
  MapPin, 
  Clock, 
  Phone, 
  Camera, 
  CheckCircle, 
  AlertCircle,
  Car,
  Battery,
  Fuel,
  Route,
  Target,
  Timer,
  Star,
  TrendingUp,
  Play,
  Pause,
  Square
} from 'lucide-react'
import { motion } from 'framer-motion'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { useWebSocket } from '@/hooks/use-websocket'
import { useGeolocation } from '@/hooks/use-geolocation'

interface DeliveryStop {
  sequence: number
  orderId: string
  address: string
  customerName: string
  customerPhone: string
  estimatedArrival: string
  status: 'pending' | 'en_route' | 'arrived' | 'delivered' | 'failed'
  orderItems: Array<{
    name: string
    quantity: number
  }>
  specialInstructions?: string
  orderValue: number
}

interface DriverRoute {
  routeId: string
  status: 'assigned' | 'active' | 'completed' | 'paused'
  stops: DeliveryStop[]
  currentStopIndex: number
  totalDistance: number
  estimatedDuration: number
  startTime?: string
  completionTime?: string
}

interface DriverPerformance {
  todayDeliveries: number
  successRate: number
  avgDeliveryTime: number
  customerRating: number
  earnings: number
  hoursWorked: number
}

interface DriverDashboardProps {
  driverId: string
  className?: string
}

export function DriverDashboard({ driverId, className }: DriverDashboardProps) {
  const [currentRoute, setCurrentRoute] = useState<DriverRoute | null>(null)
  const [performance, setPerformance] = useState<DriverPerformance | null>(null)
  const [isOnShift, setIsOnShift] = useState(false)
  const [currentStopNotes, setCurrentStopNotes] = useState('')
  const [proofPhoto, setProofPhoto] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Geolocation for real-time tracking
  const { location, error: locationError, startTracking, stopTracking } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
  })

  // WebSocket for real-time updates
  const { isConnected, sendMessage } = useWebSocket({
    onMessage: (data) => {
      if (data.type === 'routeUpdate' && data.driverId === driverId) {
        setCurrentRoute(data.route)
      }
      if (data.type === 'newRouteAssigned' && data.driverId === driverId) {
        setCurrentRoute(data.route)
        // Show notification
      }
    }
  })

  useEffect(() => {
    fetchDriverData()
    if (isOnShift) {
      startTracking()
    } else {
      stopTracking()
    }
  }, [isOnShift])

  useEffect(() => {
    if (location && isOnShift && currentRoute && isConnected) {
      // Send location update
      sendLocationUpdate()
    }
  }, [location, isOnShift, currentRoute, isConnected])

  const fetchDriverData = async () => {
    try {
      // Fetch current route and performance
      const [routeResponse, performanceResponse] = await Promise.all([
        fetch(`/api/delivery/driver-route?driverId=${driverId}`),
        fetch(`/api/delivery/driver-performance?driverId=${driverId}`)
      ])

      if (routeResponse.ok) {
        const routeData = await routeResponse.json()
        setCurrentRoute(routeData.route)
      }

      if (performanceResponse.ok) {
        const perfData = await performanceResponse.json()
        setPerformance(perfData.performance)
      }
    } catch (error) {
      console.error('Failed to fetch driver data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const sendLocationUpdate = async () => {
    if (!location || !currentRoute) return

    try {
      await fetch('/api/delivery/track-realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routeId: currentRoute.routeId,
          driverId,
          currentLocation: {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
            accuracy: location.coords.accuracy,
            heading: location.coords.heading || 0,
            speed: location.coords.speed || 0,
            timestamp: new Date().toISOString()
          },
          currentStopIndex: currentRoute.currentStopIndex,
          status: currentRoute.status === 'active' ? 'en_route' : 'paused',
          estimatedArrival: getCurrentStop()?.estimatedArrival || new Date().toISOString()
        })
      })
    } catch (error) {
      console.error('Failed to send location update:', error)
    }
  }

  const toggleShift = async () => {
    setIsOnShift(!isOnShift)
    
    // Send shift status to server
    try {
      await fetch('/api/delivery/driver-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId,
          status: !isOnShift ? 'available' : 'offline'
        })
      })
    } catch (error) {
      console.error('Failed to update shift status:', error)
    }
  }

  const startRoute = async () => {
    if (!currentRoute) return

    try {
      await fetch('/api/delivery/start-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routeId: currentRoute.routeId,
          driverId,
          startTime: new Date().toISOString()
        })
      })

      setCurrentRoute(prev => prev ? { ...prev, status: 'active', startTime: new Date().toISOString() } : null)
    } catch (error) {
      console.error('Failed to start route:', error)
    }
  }

  const markStopCompleted = async (status: 'delivered' | 'failed') => {
    if (!currentRoute || !getCurrentStop()) return

    try {
      const response = await fetch('/api/delivery/track-realtime', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routeId: currentRoute.routeId,
          stopIndex: currentRoute.currentStopIndex,
          status,
          proof: proofPhoto ? {
            type: 'photo',
            data: proofPhoto,
            timestamp: new Date().toISOString()
          } : undefined,
          notes: currentStopNotes
        })
      })

      if (response.ok) {
        // Move to next stop
        const nextIndex = currentRoute.currentStopIndex + 1
        if (nextIndex < currentRoute.stops.length) {
          setCurrentRoute(prev => prev ? { ...prev, currentStopIndex: nextIndex } : null)
        } else {
          // Route completed
          setCurrentRoute(prev => prev ? { ...prev, status: 'completed', completionTime: new Date().toISOString() } : null)
        }
        
        // Clear form
        setCurrentStopNotes('')
        setProofPhoto(null)
      }
    } catch (error) {
      console.error('Failed to mark stop completed:', error)
    }
  }

  const getCurrentStop = (): DeliveryStop | null => {
    if (!currentRoute || currentRoute.currentStopIndex >= currentRoute.stops.length) {
      return null
    }
    return currentRoute.stops[currentRoute.currentStopIndex]
  }

  const getNextStop = (): DeliveryStop | null => {
    if (!currentRoute || currentRoute.currentStopIndex + 1 >= currentRoute.stops.length) {
      return null
    }
    return currentRoute.stops[currentRoute.currentStopIndex + 1]
  }

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const calculateProgress = () => {
    if (!currentRoute) return 0
    return (currentRoute.currentStopIndex / currentRoute.stops.length) * 100
  }

  if (isLoading) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading driver dashboard...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Header - Shift Status */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-4 h-4 rounded-full ${isOnShift ? 'bg-green-500' : 'bg-gray-400'}`} />
              <div>
                <h2 className="text-xl font-bold">Driver Dashboard</h2>
                <p className="text-gray-600">
                  {isOnShift ? 'On Shift' : 'Off Shift'} • {isConnected ? 'Connected' : 'Offline'}
                </p>
              </div>
            </div>
            
            <Button
              onClick={toggleShift}
              variant={isOnShift ? "destructive" : "default"}
              size="lg"
            >
              {isOnShift ? (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  End Shift
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Shift
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      {performance && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Today's Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{performance.todayDeliveries}</p>
                <p className="text-sm text-gray-600">Deliveries</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{performance.successRate}%</p>
                <p className="text-sm text-gray-600">Success Rate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{performance.avgDeliveryTime}m</p>
                <p className="text-sm text-gray-600">Avg Time</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <p className="text-xl font-bold">{performance.customerRating}</p>
                </div>
                <p className="text-sm text-gray-600">Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Route */}
      {currentRoute ? (
        <div className="space-y-6">
          {/* Route Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-5 w-5 text-blue-600" />
                Current Route
                <Badge variant={currentRoute.status === 'active' ? "default" : "secondary"}>
                  {currentRoute.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Route Progress</span>
                  <span className="text-sm text-gray-500">
                    {currentRoute.currentStopIndex} of {currentRoute.stops.length} completed
                  </span>
                </div>
                <Progress value={calculateProgress()} className="h-3" />
                
                {currentRoute.status === 'assigned' && (
                  <Button onClick={startRoute} className="w-full">
                    <Play className="h-4 w-4 mr-2" />
                    Start Route
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Current Stop */}
          {getCurrentStop() && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-orange-600" />
                  Current Delivery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{getCurrentStop()!.customerName}</h3>
                    <p className="text-gray-600">{getCurrentStop()!.address}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <a href={`tel:${getCurrentStop()!.customerPhone}`} className="text-blue-600">
                        {getCurrentStop()!.customerPhone}
                      </a>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium mb-2">Order Items:</h4>
                    <div className="space-y-1">
                      {getCurrentStop()!.orderItems.map((item, index) => (
                        <p key={index} className="text-sm">
                          {item.quantity}x {item.name}
                        </p>
                      ))}
                    </div>
                  </div>

                  {getCurrentStop()!.specialInstructions && (
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <h4 className="font-medium text-yellow-800 mb-1">Special Instructions:</h4>
                      <p className="text-sm text-yellow-700">{getCurrentStop()!.specialInstructions}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>ETA: {formatTime(getCurrentStop()!.estimatedArrival)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">€{getCurrentStop()!.orderValue}</span>
                    </div>
                  </div>

                  {/* Delivery Actions */}
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Add delivery notes (optional)..."
                      value={currentStopNotes}
                      onChange={(e) => setCurrentStopNotes(e.target.value)}
                      rows={2}
                    />
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => markStopCompleted('delivered')}
                        className="flex-1"
                        variant="default"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Delivered
                      </Button>
                      <Button
                        onClick={() => markStopCompleted('failed')}
                        variant="destructive"
                        className="flex-1"
                      >
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Mark Failed
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Stop Preview */}
          {getNextStop() && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-gray-600" />
                  Next Delivery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">{getNextStop()!.sequence}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{getNextStop()!.customerName}</p>
                    <p className="text-sm text-gray-600">{getNextStop()!.address}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatTime(getNextStop()!.estimatedArrival)}</p>
                    <p className="text-xs text-gray-500">ETA</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Route Completed */}
          {currentRoute.status === 'completed' && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6 text-center">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-green-800 mb-2">Route Completed!</h3>
                <p className="text-green-700 mb-4">
                  All deliveries have been completed successfully.
                </p>
                <Button onClick={() => setCurrentRoute(null)}>
                  Return to Dashboard
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* No Active Route */
        <Card>
          <CardContent className="p-6 text-center">
            <Route className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Active Route</h3>
            <p className="text-gray-600 mb-4">
              {isOnShift ? 'Waiting for route assignment...' : 'Start your shift to receive route assignments'}
            </p>
            {!isOnShift && (
              <Button onClick={toggleShift}>
                <Play className="h-4 w-4 mr-2" />
                Start Shift
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Location Status */}
      {locationError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-700">
                Location access required for tracking. Please enable location services.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 