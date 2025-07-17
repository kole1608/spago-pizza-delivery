'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Phone, 
  Star, 
  Car, 
  AlertTriangle,
  CheckCircle,
  Circle,
  RotateCcw,
  Zap,
  Route,
  Timer,
  TrendingUp,
  Gauge
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useWebSocket } from '@/hooks/use-websocket'

interface RouteStop {
  sequence: number
  orderId: string
  address: string
  customerName: string
  estimatedArrival: string
  actualArrival?: string
  status: 'pending' | 'en_route' | 'arrived' | 'delivered' | 'failed'
}

interface TrackingData {
  routeId: string
  route: {
    id: string
    driverId: string
    status: 'planned' | 'active' | 'completed' | 'cancelled'
    totalStops: number
    completedStops: number
    currentStop?: RouteStop
    nextStops: RouteStop[]
  }
  driver: {
    id: string
    name: string
    phone: string
    photo?: string
    vehicle: {
      type: string
      plateNumber: string
      color: string
    }
    rating: number
  }
  liveLocation: {
    lat: number
    lng: number
    accuracy: number
    heading: number
    speed: number
    lastUpdated: string
    isMoving: boolean
  }
  performance: {
    onTimeDeliveries: number
    totalDeliveries: number
    avgDeliveryTime: number
    customerRating: number
    currentDelay: number
  }
  timeline: Array<{
    timestamp: string
    event: string
    location?: { lat: number; lng: number }
    description: string
    type: 'info' | 'success' | 'warning' | 'error'
  }>
  eta: {
    nextStop: string
    routeCompletion: string
    confidence: 'high' | 'medium' | 'low'
  }
  traffic_conditions: {
    overall: 'light' | 'moderate' | 'heavy' | 'severe'
    incidents: Array<{
      type: 'accident' | 'construction' | 'closure'
      location: string
      impact: 'low' | 'medium' | 'high'
      estimatedDelay: number
    }>
  }
}

interface AdvancedRouteTrackerProps {
  routeId?: string
  orderId?: string
  customerView?: boolean
  className?: string
}

export function AdvancedRouteTracker({ 
  routeId, 
  orderId, 
  customerView = false, 
  className 
}: AdvancedRouteTrackerProps) {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // WebSocket connection for real-time updates
  const { isConnected, sendMessage } = useWebSocket({
    onMessage: (data) => {
      if (data.type === 'deliveryUpdate' && data.routeId === trackingData?.routeId) {
        handleRealtimeUpdate(data.data)
      }
    }
  })

  useEffect(() => {
    fetchTrackingData()
    
    // Set up auto-refresh every 30 seconds
    refreshIntervalRef.current = setInterval(fetchTrackingData, 30000)
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [routeId, orderId])

  useEffect(() => {
    if (trackingData && isConnected) {
      // Join WebSocket room for this route
      sendMessage({
        type: 'joinRoom',
        room: `route_${trackingData.routeId}`
      })
    }
  }, [trackingData, isConnected, sendMessage])

  const fetchTrackingData = async () => {
    try {
      setError(null)
      const params = new URLSearchParams()
      if (routeId) params.append('routeId', routeId)
      if (orderId) params.append('orderId', orderId)
      
      const response = await fetch(`/api/delivery/track-realtime?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch tracking data')
      }
      
      const data = await response.json()
      setTrackingData(data.tracking)
      setLastUpdate(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRealtimeUpdate = (updateData: any) => {
    setTrackingData(prev => {
      if (!prev) return prev
      
      return {
        ...prev,
        liveLocation: updateData.location || prev.liveLocation,
        route: {
          ...prev.route,
          currentStop: updateData.currentStopIndex !== undefined ? 
            prev.route.nextStops[updateData.currentStopIndex] : prev.route.currentStop
        },
        eta: {
          ...prev.eta,
          nextStop: updateData.estimatedArrival || prev.eta.nextStop
        }
      }
    })
    setLastUpdate(new Date())
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'en_route':
        return <Navigation className="h-5 w-5 text-blue-600" />
      case 'arrived':
        return <MapPin className="h-5 w-5 text-orange-600" />
      case 'failed':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      default:
        return <Circle className="h-5 w-5 text-gray-400" />
    }
  }

  const getTrafficColor = (condition: string) => {
    switch (condition) {
      case 'light': return 'text-green-600'
      case 'moderate': return 'text-yellow-600'
      case 'heavy': return 'text-orange-600'
      case 'severe': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const calculateProgress = () => {
    if (!trackingData) return 0
    return (trackingData.route.completedStops / trackingData.route.totalStops) * 100
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
              <div className="h-8 bg-gray-300 rounded w-1/2 mb-4"></div>
              <div className="h-32 bg-gray-300 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !trackingData) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <p className="mb-2">{error || 'No tracking data available'}</p>
            <Button onClick={fetchTrackingData} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      {/* Header */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Route className="h-6 w-6 text-blue-600" />
              Route Tracking
            </CardTitle>
            <div className="flex items-center gap-3">
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? '🟢 Live' : '🔴 Offline'}
              </Badge>
              {lastUpdate && (
                <span className="text-sm text-gray-500">
                  Updated {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Route Progress</span>
              <span className="text-sm text-gray-500">
                {trackingData.route.completedStops} of {trackingData.route.totalStops} deliveries
              </span>
            </div>
            <Progress value={calculateProgress()} className="h-3" />
          </div>

          {/* Driver Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Driver Information</h3>
              <div className="flex items-center gap-3">
                {trackingData.driver.photo && (
                  <img 
                    src={trackingData.driver.photo} 
                    alt={trackingData.driver.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="font-medium">{trackingData.driver.name}</p>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">{trackingData.driver.rating}</span>
                    <Phone className="h-4 w-4 text-gray-400 ml-2" />
                    <span className="text-sm text-gray-600">{trackingData.driver.phone}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <Car className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">{trackingData.driver.vehicle.type}</p>
                  <p className="text-xs text-gray-600">
                    {trackingData.driver.vehicle.color} • {trackingData.driver.vehicle.plateNumber}
                  </p>
                </div>
              </div>
            </div>

            {/* Live Status */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Live Status</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Current Speed</span>
                  <div className="flex items-center gap-1">
                    <Gauge className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">{Math.round(trackingData.liveLocation.speed)} km/h</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Movement</span>
                  <Badge variant={trackingData.liveLocation.isMoving ? "default" : "secondary"}>
                    {trackingData.liveLocation.isMoving ? '🚗 Moving' : '⏸️ Stopped'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Traffic</span>
                  <span className={`font-medium capitalize ${getTrafficColor(trackingData.traffic_conditions.overall)}`}>
                    {trackingData.traffic_conditions.overall}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Stop */}
      {trackingData.route.currentStop && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-blue-600" />
              Current Delivery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {getStatusIcon(trackingData.route.currentStop.status)}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">
                  {trackingData.route.currentStop.customerName}
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  {trackingData.route.currentStop.address}
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>ETA: {formatTime(trackingData.eta.nextStop)}</span>
                  </div>
                  <Badge 
                    variant={trackingData.performance.currentDelay > 0 ? "destructive" : "default"}
                  >
                    {trackingData.performance.currentDelay > 0 ? 
                      `+${trackingData.performance.currentDelay}min delayed` : 
                      'On time'
                    }
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Stops */}
      {trackingData.route.nextStops.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Upcoming Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trackingData.route.nextStops.map((stop, index) => (
                <motion.div
                  key={stop.orderId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">{stop.sequence}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{stop.customerName}</p>
                    <p className="text-xs text-gray-600">{stop.address}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatTime(stop.estimatedArrival)}</p>
                    <p className="text-xs text-gray-500">ETA</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Stats */}
        {!customerView && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">On-time Rate</span>
                <span className="font-medium">
                  {Math.round((trackingData.performance.onTimeDeliveries / trackingData.performance.totalDeliveries) * 100)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Delivery Time</span>
                <span className="font-medium">{trackingData.performance.avgDeliveryTime} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Customer Rating</span>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">{trackingData.performance.customerRating}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-blue-600" />
              Activity Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trackingData.timeline.slice(0, 5).map((event, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-3 h-3 rounded-full mt-1 ${
                    event.type === 'success' ? 'bg-green-500' :
                    event.type === 'warning' ? 'bg-yellow-500' :
                    event.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{event.event}</p>
                    <p className="text-xs text-gray-600">{event.description}</p>
                    <p className="text-xs text-gray-500">{formatTime(event.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Traffic Incidents */}
      {trackingData.traffic_conditions.incidents.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Traffic Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trackingData.traffic_conditions.incidents.map((incident, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <div className="flex-1">
                    <p className="font-medium text-sm capitalize">{incident.type}</p>
                    <p className="text-sm text-gray-600">{incident.location}</p>
                  </div>
                  <Badge variant="outline">+{incident.estimatedDelay} min</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 